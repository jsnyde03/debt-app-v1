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
 * action referencing this target, `xcodebuild test` cannot run it — so the scheme is written by hand in
 * a second dangerous mod.
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

  const groupKey = project.pbxCreateGroup(TARGET_NAME, TARGET_NAME);
  project.addToPbxGroup(groupKey, project.getFirstProject().firstProject.mainGroup);
  for (const file of SWIFT_FILES) {
    project.addSourceFile(`${TARGET_NAME}/${file}`, { target: target.uuid }, groupKey);
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

  // 2) Create the target, patch it into a UI-test bundle, and wire it to the app.
  config = withXcodeProject(config, (cfg) => {
    applyXcuitestTarget(cfg.modResults, {
      appTargetName: cfg.modRequest.projectName,
      bundleId: cfg.ios?.bundleIdentifier ?? 'com.jasonsnyder.debtplanner',
    });
    return cfg;
  });

  // 3) The scheme. Not modelled by the `xcode` lib, so it is written directly — without a Test action
  //    referencing this target, `xcodebuild test` has nothing to run.
  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const appName = cfg.modRequest.projectName;
      const schemeDir = path.join(
        cfg.modRequest.platformProjectRoot,
        `${appName}.xcodeproj`,
        'xcshareddata',
        'xcschemes',
      );
      const schemePath = path.join(schemeDir, `${appName}.xcscheme`);
      if (!fs.existsSync(schemePath)) return cfg; // prebuild has not written it yet — nothing to patch

      let xml = fs.readFileSync(schemePath, 'utf8');
      if (xml.includes(TARGET_NAME)) return cfg; // idempotent

      const testable = [
        '      <TestableReference',
        '         skipped = "NO">',
        '         <BuildableReference',
        '            BuildableIdentifier = "primary"',
        `            BlueprintName = "${TARGET_NAME}"`,
        `            BuildableName = "${TARGET_NAME}.xctest"`,
        `            ReferencedContainer = "container:${appName}.xcodeproj">`,
        '         </BuildableReference>',
        '      </TestableReference>',
      ].join('\n');

      // Insert into the existing <Testables> block, or create one inside <TestAction>.
      if (/<Testables>[\s\S]*?<\/Testables>/.test(xml)) {
        xml = xml.replace('</Testables>', `${testable}\n      </Testables>`);
      } else {
        xml = xml.replace(/(<TestAction[^>]*>)/, `$1\n      <Testables>\n${testable}\n      </Testables>`);
      }
      fs.writeFileSync(schemePath, xml, 'utf8');
      return cfg;
    },
  ]);

  return config;
};

module.exports = withXcuitestTarget;
module.exports.applyXcuitestTarget = applyXcuitestTarget;
module.exports.TARGET_NAME = TARGET_NAME;
module.exports.SWIFT_FILES = SWIFT_FILES;
