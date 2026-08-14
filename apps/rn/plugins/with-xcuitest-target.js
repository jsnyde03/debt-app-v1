/* global __dirname */
const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/*
 * 4.1.6a.7 — ADD AN XCUITEST TARGET, CNG-safe.
 *
 * WHY. ~16 device-checklist rows (§5 widget, §6 Live Activity / Dynamic Island, §10.3 Split View) are
 * filed permanently device-owed for one stated reason: "springboard surfaces outside the app under
 * test". That is a limit of MAESTRO, not of automation — XCUITest drives
 * `XCUIApplication(bundleIdentifier: "com.apple.springboard")`. The same target also carries
 * `performAccessibilityAudit()` (4 of the 6 premium-a11y bullets) and §10.5–§10.7's modifier-key chords,
 * which are the only three checks Appium was ever going to buy. One target, three filed workstreams.
 *
 * WHY A PLUGIN. `apps/rn/ios` is not committed — `expo prebuild` regenerates it, so a hand-added target
 * is destroyed every run. `@bacons/apple-targets` (already a dependency, driving `targets/widget`) does
 * NOT help: its supported-types table is app EXTENSIONS only, with no ui-test or unit-test entry.
 * Measured 2026-08-14 before any of this was written.
 *
 * ⚠️ TWO SHARP EDGES IN THE `xcode` LIB, both measured, both worked around below.
 *   ① `PRODUCTTYPE_BY_TARGETTYPE` has `unit_test_bundle` but NO `ui_test_bundle` —
 *      `com.apple.product-type.bundle.ui-testing` is simply absent, and `addTarget` THROWS on an
 *      unknown type. So the target is created as a unit-test bundle and its productType is patched.
 *   ② `addTarget` returns a target with `buildPhases: []`. Only `app_extension` gets phases added for
 *      it. The Sources phase is therefore created explicitly, or nothing compiles.
 *
 * ⚠️ AND ONE OUTSIDE IT. `.xcscheme` files are not modelled by the `xcode` lib at all. Without a Test
 * action referencing this target, `xcodebuild test` cannot run it — so the scheme is written by hand.
 *
 * ⛔ THE SCHEME WRITE LIVES INSIDE THE XCODEPROJECT MOD, NOT A DANGEROUS ONE, AND THAT IS MEASURED.
 * `withIosBaseMods` declares `dangerous` (line 142) before `xcodeproj` (line 220), and the mod compiler
 * runs them in that order — so a dangerous mod reading `project.pbxproj` from disk sees the file as it
 * was BEFORE this plugin's target was added. The first version wrote the scheme from a dangerous mod,
 * which is why it could only ever emit a `BlueprintName`: the uuid it needed did not exist yet. Written
 * here, `applyXcuitestTarget`'s return value is in hand.
 *
 * Idempotent: re-running against a project that already has the target is a no-op.
 */
const TARGET_NAME = 'CoverageProbeUITests';
const SWIFT_FILES = ['CoverageProbeUITests.swift'];

/** Build settings Xcode requires on a UI-test bundle. `TEST_TARGET_NAME` is what binds it to the app. */
const buildSettingsFor = (appTargetName, bundleId) => ({
  ALWAYS_SEARCH_USER_PATHS: 'NO',
  CLANG_ENABLE_MODULES: 'YES',
  CODE_SIGN_STYLE: 'Automatic',
  CURRENT_PROJECT_VERSION: '1',
  GENERATE_INFOPLIST_FILE: 'YES',
  IPHONEOS_DEPLOYMENT_TARGET: '15.1',
  MARKETING_VERSION: '1.0',
  PRODUCT_BUNDLE_IDENTIFIER: bundleId,
  PRODUCT_NAME: '"$(TARGET_NAME)"',
  SWIFT_EMIT_LOC_STRINGS: 'NO',
  SWIFT_VERSION: '5.0',
  TARGETED_DEVICE_FAMILY: '"1,2"',
  TEST_TARGET_NAME: `"${appTargetName}"`,
});

/**
 * The whole pbxproj mutation, as one pure function over an `xcode` project object.
 *
 * ⚠️ EXPORTED ON PURPOSE. `scripts/preflight-xcuitest-target.ts` applies THIS function to a real
 * `project.pbxproj` fixture and asserts the result, so the pre-flight tests the shipping code rather
 * than a second copy of it. A pre-flight that re-implements what it checks proves only that two
 * authors agreed — the "two places, one rule" shape this repo has been bitten by three times.
 *
 * Returns the new target's uuid, or null if it was already present.
 */
/**
 * ⚠️ `pbxTargetByName` DOES NOT FIND TARGETS THIS LIB CREATED. `addTarget` stores the name
 * double-quoted (`"\"CoverageProbeUITests\""`) and writes the same quoted string as the comment key,
 * while `pbxTargetByName` looks the comment up unquoted. Pre-existing targets are stored unquoted, so
 * the helper works for them and silently fails for ours — which made the idempotency guard never fire.
 * Measured on a real project 2026-08-14. Check both spellings.
 */
function findTarget(project, name) {
  return project.findTargetKey(`"${name}"`) || project.findTargetKey(name);
}

function applyXcuitestTarget(project, { appTargetName, bundleId }) {
  if (findTarget(project, TARGET_NAME)) return null; // idempotent

  const testBundleId = `${bundleId}.${TARGET_NAME}`;

  // ⚠️ edge ①: created as unit_test_bundle because ui_test_bundle is not in the lib's type map.
  const target = project.addTarget(TARGET_NAME, 'unit_test_bundle', TARGET_NAME, testBundleId);
  project.pbxNativeTargetSection()[target.uuid].productType =
    '"com.apple.product-type.bundle.ui-testing"';

  // ⚠️ edge ②: addTarget leaves buildPhases empty for everything except app_extension.
  project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
  project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);
  project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);

  // ⛔ edge ③: THE GROUP ALREADY CARRIES THE DIRECTORY, so the file must NOT repeat it.
  // `pbxCreateGroup(name, path)` sets BOTH — this group is named `CoverageProbeUITests` and has
  // `path = CoverageProbeUITests`. Xcode resolves a file reference as group.path + fileRef.path, so
  // passing `${TARGET_NAME}/${file}` here produced
  // `ios/CoverageProbeUITests/CoverageProbeUITests/CoverageProbeUITests.swift` and run 31822453981 died
  // on `Build input file cannot be found`. ⚠️ The pre-flight passed 31 checks on that same project:
  // it asserted the file was in the Sources phase and never asserted where the phase pointed. It now
  // asserts the RESOLVED path, and that check fails against the old line.
  const groupKey = project.pbxCreateGroup(TARGET_NAME, TARGET_NAME);
  project.addToPbxGroup(groupKey, project.getFirstProject().firstProject.mainGroup);
  for (const file of SWIFT_FILES) {
    project.addSourceFile(file, { target: target.uuid }, groupKey);
  }

  // Build settings on BOTH configurations — a UI-test bundle with no TEST_TARGET_NAME does not run.
  const settings = buildSettingsFor(appTargetName, testBundleId);
  const configs = project.pbxXCBuildConfigurationSection();
  const listId = project.pbxNativeTargetSection()[target.uuid].buildConfigurationList;
  const list = project.pbxXCConfigurationList()[listId];
  for (const { value: cfgId } of list.buildConfigurations) {
    Object.assign(configs[cfgId].buildSettings, settings);
  }

  // ⚠️ `addTargetDependency` writes into the PBXTargetDependency and PBXContainerItemProxy sections and
  // does NOT create them. A project with a single target has neither, so the call silently adds nothing
  // — measured against a real single-target project, where the new target came out with `dependencies:
  // []` and no error. Expo's prebuild output happens to have both sections; relying on that would make
  // this plugin correct by luck.
  const objects = project.hash.project.objects;
  objects.PBXTargetDependency = objects.PBXTargetDependency || {};
  objects.PBXContainerItemProxy = objects.PBXContainerItemProxy || {};

  // ⚠️ DIRECTION MATTERS. `addTargetDependency(t, deps)` makes `t` depend on `deps`. The TEST bundle
  // depends on the APP, never the reverse — inverted, every app build would drag the test bundle in.
  // Written backwards on the first pass and caught by the pre-flight's direction assertion.
  project.addTargetDependency(target.uuid, [project.getFirstTarget().uuid]);

  return target.uuid;
}

/**
 * Insert a `<TestableReference>` for this target into a scheme's Test action. Pure: XML in, XML out.
 *
 * ⚠️ EXPORTED for the same reason `applyXcuitestTarget` is — the pre-flight applies THIS function, so
 * the checks cover the shipping code. Until 2026-08-14 the scheme half was the only part of this plugin
 * nothing asserted, and it is the half most likely to make `xcodebuild test` find nothing to run.
 *
 * `blueprintId` is the target's pbxproj uuid. ⚠️ Xcode writes one on every `BuildableReference` it
 * generates; whether `xcodebuild` REQUIRES it is unmeasured (no macOS to ask). It is supplied because
 * matching what Xcode emits costs nothing here, and the alternative is spending a ~22-minute cycle to
 * find out. Do not record it as a known requirement — it is not one yet.
 *
 * Returns the XML unchanged when the target is already referenced.
 */
function applyTestableToScheme(xml, { targetName, appName, blueprintId }) {
  if (xml.includes(targetName)) return xml; // idempotent

  const testable = [
    '      <TestableReference',
    '         skipped = "NO">',
    '         <BuildableReference',
    '            BuildableIdentifier = "primary"',
    ...(blueprintId ? [`            BlueprintIdentifier = "${blueprintId}"`] : []),
    `            BuildableName = "${targetName}.xctest"`,
    `            BlueprintName = "${targetName}"`,
    `            ReferencedContainer = "container:${appName}.xcodeproj">`,
    '         </BuildableReference>',
    '      </TestableReference>',
  ].join('\n');

  // Insert into the existing <Testables> block, or create one inside <TestAction>.
  if (/<Testables>[\s\S]*?<\/Testables>/.test(xml)) {
    return xml.replace('</Testables>', `${testable}\n      </Testables>`);
  }
  // ⚠️ Self-closing `<Testables/>` is what an empty Test action actually contains, and the branch below
  // would not match it — the `<TestAction …>` fallback would then add a SECOND Testables block.
  if (/<Testables\s*\/>/.test(xml)) {
    return xml.replace(/<Testables\s*\/>/, `<Testables>\n${testable}\n      </Testables>`);
  }
  return xml.replace(/(<TestAction[^>]*>)/, `$1\n      <Testables>\n${testable}\n      </Testables>`);
}

const withXcuitestTarget = (config) => {
  // 1) Place the Swift sources under ios/<TARGET_NAME>/ at prebuild time.
  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const srcDir = path.join(__dirname, 'xcuitest-swift');
      const destDir = path.join(cfg.modRequest.platformProjectRoot, TARGET_NAME);
      fs.mkdirSync(destDir, { recursive: true });
      for (const file of SWIFT_FILES) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      }
      return cfg;
    },
  ]);

  // 2) Create the target, patch it into a UI-test bundle, wire it to the app — and, with its uuid in
  //    hand, add the scheme's Test action. Without that action `xcodebuild test` has nothing to run.
  config = withXcodeProject(config, (cfg) => {
    const appName = cfg.modRequest.projectName;
    const uuid = applyXcuitestTarget(cfg.modResults, {
      appTargetName: appName,
      bundleId: cfg.ios?.bundleIdentifier ?? 'com.jasonsnyder.debtplanner',
    });
    // On the idempotent path `applyXcuitestTarget` returns null, but the scheme may still need
    // patching — a prebuild regenerates the scheme from the template while the pbxproj persists.
    const blueprintId = uuid ?? findTarget(cfg.modResults, TARGET_NAME);

    const schemePath = path.join(
      cfg.modRequest.platformProjectRoot,
      `${appName}.xcodeproj`,
      'xcshareddata',
      'xcschemes',
      `${appName}.xcscheme`,
    );
    // ⚠️ LOUD, NOT SILENT, AND STILL NOT FATAL. A missing scheme means the target ships unrunnable, and
    // this plugin's whole failure mode is being discovered ~20 minutes downstream as something else. But
    // throwing here would take the Maestro suite down with it for a premise about prebuild's ordering
    // that has never been checked on a runner — so it warns, and the workflow asserts the scheme
    // separately, where the blast radius is the probe alone.
    if (!fs.existsSync(schemePath)) {
      console.warn(`⚠️  ${TARGET_NAME}: no scheme at ${schemePath} — \`xcodebuild test\` will find nothing to run.`);
      return cfg;
    }
    fs.writeFileSync(
      schemePath,
      applyTestableToScheme(fs.readFileSync(schemePath, 'utf8'), {
        targetName: TARGET_NAME,
        appName,
        blueprintId,
      }),
      'utf8',
    );
    return cfg;
  });

  return config;
};

module.exports = withXcuitestTarget;
module.exports.applyXcuitestTarget = applyXcuitestTarget;
module.exports.applyTestableToScheme = applyTestableToScheme;
module.exports.TARGET_NAME = TARGET_NAME;
module.exports.SWIFT_FILES = SWIFT_FILES;
