/**
 * 4.1.6a.7.2 — LOCAL PRE-FLIGHT for the XCUITest config plugin.
 *
 * The native lane costs ~22 minutes and its characteristic failure is *an unexplained timeout twenty
 * minutes downstream*. A malformed `project.pbxproj` presents exactly that way. This applies the
 * plugin's REAL mutation — `applyXcuitestTarget`, imported, not re-implemented — to a genuine
 * `project.pbxproj`, asserts the structure Xcode requires, and round-trips the file back through the
 * parser. It runs on Windows, where `expo prebuild --platform ios` and `xcodebuild` cannot.
 *
 * ⚠️ What it CANNOT tell you: whether Xcode accepts the target. That needs the runner, and it is the
 * only question left for it. The repo's own lesson, filed 2026-08-13: *"No local pre-flight for the
 * capture path — a flagged web export + ~40-line check would have caught several CI cycles' worth of
 * defects."*
 *
 * Fixture: `ios/App/App.xcodeproj/project.pbxproj`, the legacy Capacitor project. Read-only, copied
 * before use. ⚠️ It dies at 5.5.1 — when it goes, vendor a copy under `scripts/fixtures/`.
 *
 * Usage: npm run preflight:xcuitest
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const REPO_ROOT = join(import.meta.dirname, '..');
const xcode = require(join(REPO_ROOT, 'apps/rn/node_modules/xcode')) as any;
const plugin = require(join(REPO_ROOT, 'apps/rn/plugins/with-xcuitest-target.js'));
const { applyXcuitestTarget, applyTestableToScheme, TARGET_NAME, SWIFT_FILES } = plugin;

const FIXTURE = join(REPO_ROOT, 'ios/App/App.xcodeproj/project.pbxproj');
const WORK_DIR = join(REPO_ROOT, 'node_modules', '.cache', 'xcuitest-preflight');
const WORK = join(WORK_DIR, 'project.pbxproj');

const problems: string[] = [];
const ok: string[] = [];
const check = (label: string, cond: boolean, detail = '') => {
  (cond ? ok : problems).push(cond ? label : `${label}${detail ? ` — ${detail}` : ''}`);
};

mkdirSync(WORK_DIR, { recursive: true });
writeFileSync(WORK, readFileSync(FIXTURE, 'utf8'), 'utf8');

const project = xcode.project(WORK);
project.parseSync();

const appTargetUuid = project.getFirstTarget().uuid;
const appTargetName = project.getFirstTarget().firstTarget.name.replace(/"/g, '');

const uuid = applyXcuitestTarget(project, { appTargetName, bundleId: 'com.jasonsnyder.debtplanner' });
check('the target is created', !!uuid, 'applyXcuitestTarget returned null on a project without it');
if (!uuid) { console.error(problems.join('\n')); process.exit(1); }

const native = project.pbxNativeTargetSection();
const t = native[uuid];

// ── the structure Xcode requires ──────────────────────────────────────────────────────────────────
check(
  'productType is a UI-testing bundle',
  t.productType === '"com.apple.product-type.bundle.ui-testing"',
  `got ${t.productType} — the xcode lib has no ui_test_bundle, so the patch after addTarget did not land`,
);
check('the target has build phases', Array.isArray(t.buildPhases) && t.buildPhases.length >= 1,
  `addTarget leaves buildPhases empty for non-extensions; got ${t.buildPhases?.length ?? 0}`);

const phaseNames = (t.buildPhases ?? []).map((p: any) => p.comment);
check('a Sources phase exists', phaseNames.includes('Sources'), `phases: ${phaseNames.join(', ') || 'none'}`);

const sourcesSection = JSON.stringify(project.pbxSourcesBuildPhaseObj(uuid) ?? {});
for (const f of SWIFT_FILES) {
  check(`${f} is in the Sources phase`, sourcesSection.includes(f.replace('.swift', '')),
    'the Swift would not compile into the bundle');
}

// ── build settings, on BOTH configurations ────────────────────────────────────────────────────────
const configs = project.pbxXCBuildConfigurationSection();
const list = project.pbxXCConfigurationList()[t.buildConfigurationList];
const cfgIds = (list?.buildConfigurations ?? []).map((c: any) => c.value);
check('two build configurations', cfgIds.length === 2, `got ${cfgIds.length}`);
for (const id of cfgIds) {
  const s = configs[id].buildSettings;
  const name = configs[id].name;
  check(`${name}: TEST_TARGET_NAME binds to the app`, s.TEST_TARGET_NAME === `"${appTargetName}"`,
    `got ${s.TEST_TARGET_NAME} — without this the bundle is not runnable as a UI test`);
  check(`${name}: SWIFT_VERSION is set`, !!s.SWIFT_VERSION);
  check(`${name}: iPad is a target device family`, String(s.TARGETED_DEVICE_FAMILY).includes('2'),
    'the springboard + §10 checks are iPad-side');
}

// ── the dependency, AND its direction ─────────────────────────────────────────────────────────────
const deps = (t.dependencies ?? []).map((d: any) => d.value);
check('the test target depends on something', deps.length === 1, `got ${deps.length}`);
const appDeps = (native[appTargetUuid].dependencies ?? []).map((d: any) => d.value);
check(
  'the direction is test → app, not app → test',
  deps.length === 1 && appDeps.length === 0,
  `app target has ${appDeps.length} dependencies; inverted, every app build drags the test bundle in`,
);

// ── round-trip: the file must still parse ─────────────────────────────────────────────────────────
let roundTripped = false;
try {
  writeFileSync(WORK, project.writeSync(), 'utf8');
  const reparsed = xcode.project(WORK);
  reparsed.parseSync();
  // ⚠️ NOT `pbxTargetByName` — it cannot find targets this lib created (they are stored double-quoted).
  // The first version of this check used it and reported a round-trip failure against a file that had
  // written and re-parsed perfectly. A verifier that is wrong in the same way as the code it verifies
  // is worse than no verifier.
  roundTripped = !!(reparsed.findTargetKey(`"${TARGET_NAME}"`) || reparsed.findTargetKey(TARGET_NAME));
} catch (e) {
  problems.push(`the written project.pbxproj does not parse back: ${(e as Error).message}`);
}
check('the written project round-trips through the parser', roundTripped,
  'a malformed pbxproj presents as an unexplained failure ~20 minutes into the native lane');

// ── idempotency ───────────────────────────────────────────────────────────────────────────────────
const again = applyXcuitestTarget(project, { appTargetName, bundleId: 'com.jasonsnyder.debtplanner' });
check('re-running is a no-op', again === null, 'prebuild runs the plugin every time');

// ── the SCHEME half ───────────────────────────────────────────────────────────────────────────────
//
// ⚠️ Until 2026-08-14 this file asserted nothing about the scheme, and the scheme is the half that
// decides whether `xcodebuild test` finds anything to run at all. The pbxproj can be perfect and the
// run still does nothing.
//
// ⛔ WHAT THIS CANNOT DO, STATED PLAINLY: there is no real Expo-generated `.xcscheme` in this repo
// (`find . -name '*.xcscheme'` → nothing; `ios/` is not committed and prebuild writes the scheme from a
// template on the runner). So these inputs are the three SHAPES the function branches on, not a sample
// of Expo's actual output. They prove the function handles each shape correctly; they do NOT prove
// Expo emits one of them. That last step is a one-second grep on the runner, and it belongs there —
// a fixture invented here to match an assumption could only ever agree with the assumption.
const BLUEPRINT = 'ABCD1234ABCD1234ABCD1234';
const schemeShapes: Array<[string, string]> = [
  ['a populated <Testables> block', '<TestAction a="1">\n      <Testables>\n         <TestableReference/>\n      </Testables>\n   </TestAction>'],
  ['a self-closing <Testables/>', '<TestAction a="1">\n      <Testables/>\n   </TestAction>'],
  ['a TestAction with no Testables at all', '<TestAction a="1">\n   </TestAction>'],
];

for (const [label, xml] of schemeShapes) {
  const out = applyTestableToScheme(xml, {
    targetName: TARGET_NAME,
    appName: appTargetName,
    blueprintId: BLUEPRINT,
  });
  check(`scheme · ${label}: the testable is inserted`, out.includes(`BlueprintName = "${TARGET_NAME}"`),
    'without a TestableReference, `xcodebuild test` runs nothing and reports success');
  // ⚠️ `/<Testables/`, NOT `/<Testables[\s>]/`. The narrower pattern cannot match `<Testables/>` — the
  // self-closing form — so it was blind to the exact defect this check exists for: with the
  // self-closing branch disabled, the function emits a new block AND leaves `<Testables/>` behind, and
  // the check reported one block and passed. Caught by planting that defect 2026-08-14. `</Testables>`
  // does not match either form, so opening tags are still counted once each.
  check(`scheme · ${label}: exactly one <Testables> block`,
    (out.match(/<Testables/g) ?? []).length === 1,
    `got ${(out.match(/<Testables/g) ?? []).length} — a second block is silently ignored by Xcode`);
  check(`scheme · ${label}: BlueprintIdentifier is carried`, out.includes(`BlueprintIdentifier = "${BLUEPRINT}"`),
    'Xcode writes one on every BuildableReference it generates');
  check(`scheme · ${label}: the testable is inside the Test action`,
    /<TestAction[\s\S]*TestableReference[\s\S]*<\/TestAction>/.test(out),
    'inserted outside <TestAction> it is inert');
  check(`scheme · ${label}: re-running is a no-op`,
    applyTestableToScheme(out, { targetName: TARGET_NAME, appName: appTargetName, blueprintId: BLUEPRINT }) === out,
    'prebuild runs the plugin every time');
}

for (const line of ok) console.log(`  ✅ ${line}`);
if (problems.length) {
  console.error(`\n⛔ xcuitest pre-flight — ${problems.length} problem${problems.length > 1 ? 's' : ''}:`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error('');
  process.exit(1);
}
console.log(`\n✅ xcuitest pre-flight: ${ok.length} structural checks pass against a real project.pbxproj.`);
console.log('   Remaining unknown, and only the macOS runner can answer it: does Xcode accept the target.');
