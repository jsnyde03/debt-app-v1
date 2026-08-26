/**
 * [S0.13 · GAP-16] — EVERY GATE IS PROVEN TO FAIL **CLOSED**, ON A PLANTED DEFECT OF ITS OWN CLASS.
 *
 * ## Why this is the highest-value thing S0 built
 *
 * ⚡ **All FIFTEEN majors S0 found across four passes were the same shape: a gate reporting green while
 * doing less than it claimed.** Not one was a false red. The whole-phase after-scan classified them —
 * a stripper that made a gate 45× blinder · a `\r` site printing *"all 0 high+ findings trace"* and
 * exiting 0 · `//`-inside-a-string truncating three gates · `selfCheck` proving a throw but not a **call**
 * · invariant ⑨ unable to fire on any of 554 cases · a freshness record written after the suites ran ·
 * `lint:secrets` reading the working tree · 13 baseline entries that were standing permissions · a clamp
 * tested for presence rather than value · four assertions inside a fail-open `if`.
 *
 * ⛔ **And nothing in this tree asserted that any gate ever fails CLOSED.** That is the gap this closes.
 * ⚡ **Two independent derivations reached it:** pass 4's guard inventory reasoned forward from missing
 * guards (GAP-16), and the phase after-scan reasoned backward from realised defects. Same build item.
 *
 * ## The method, and the one rule that makes it trustworthy
 *
 * ⛔ **EVERY PLANT REPORTS WHETHER IT LANDED** — `plant-applied=YES|NO` — copied from
 * `test-stamp-coverage.ts`, which learned it the hard way: *"three of the first eight plants reported 'the
 * gate missed it' while the files were byte-identical to their backups."* ⚠️ **A plant that never applied
 * looks EXACTLY like a blind gate, and it fails in the safe-looking direction.** This bit me again while
 * building S0.13: a `sed` plant silently matched nothing, the gate came back green, and that green meant
 * nothing at all.
 *
 * ⚠️ **A plant CREATES a file; it never edits one.** Mutating a real source file and restoring it leaves a
 * window where a crash strands the tree in a planted state. Creating and deleting is reversible by
 * construction, and the harness refuses to start if a previous run left one behind.
 *
 * ⚠️ **Each scenario also runs a CONTROL** — the gate with the plant removed must exit 0. A gate that reds
 * unconditionally would otherwise score as a perfect pass, which is the [D63] shape: a test whose
 * precondition refutes its own mechanism.
 *
 * Usage: npm run test:gate-plants
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');

interface Scenario {
  /** the npm-script name, so a failure names the thing a human would run */
  gate: string;
  script: string;
  /** repo-relative path the plant creates */
  at: string;
  /** the planted defect — a real instance of the class the gate exists to catch */
  body: string;
  why: string;
}

const SCENARIOS: Scenario[] = [
  {
    gate: 'lint:month-arithmetic',
    script: 'check-month-arithmetic.ts',
    at: 'apps/rn/src/__gate_plant__.ts',
    body: 'export function bump(d: Date): Date {\n  d.setMonth(d.getMonth() + 1);\n  return d;\n}\n',
    why: 'raw setMonth is the overflow bug the gate was built for (Jan 31 + 1 month = Mar 3)',
  },
  {
    gate: 'lint:local-dates',
    script: 'check-local-dates.ts',
    at: 'apps/rn/src/__gate_plant__.ts',
    body: "export const today = (d: Date): string => d.toISOString().slice(0, 10);\n",
    why: 'a calendar date routed through UTC — wrong day east of UTC, i.e. Sydney and Auckland',
  },
  {
    gate: 'lint:glossary',
    script: 'check-glossary.ts',
    at: 'apps/rn/src/__gate_plant__.ts',
    body: "export const copy = 'You vanquished this debt, giving you breathing room.';\n",
    why: 'two retired terms the glossary replaced ("paid off", "cushion")',
  },
  {
    gate: 'lint:a11y-props',
    script: 'check-native-a11y-props.ts',
    at: 'apps/rn/src/__gate_plant__.tsx',
    body: 'export const P = () => <View accessibilityState={{ checked: true }} />;\n',
    why: 'no aria mapping on web — the control announces its role and never its state',
  },
  {
    gate: 'lint:type-scale',
    script: 'check-type-scale.ts',
    at: 'apps/rn/src/__gate_plant__.tsx',
    body:
      'const styles = { hero: { fontSize: 40 } };\n' +
      'export const P = () => <Text style={styles.hero} allowFontScaling={true}>1</Text>;\n',
    why: 'a 40pt figure with scaling explicitly ON — the S0.13 finding-4 shape',
  },
];

/** ⛔ Downward-only. Lowering it to make a run pass is the defect this file exists to catch — the same
 *  ratchet `MIN_CHECKS` uses in `preflight-native-lane.ts`, and the opposite of a cap. */
const MIN_SCENARIOS = 5;

const abs = (rel: string) => join(REPO_ROOT, rel);

/** Refuse to start over a tree a previous run left dirty — a stale plant would score as a real defect. */
for (const s of SCENARIOS) {
  if (existsSync(abs(s.at))) {
    console.error(`\n❌ test:gate-plants — a previous run left ${s.at} behind. Delete it and re-run.\n`);
    process.exit(1);
  }
}

/** Exit code of a gate, run the way a human runs it. Never throws: a non-zero exit is the signal. */
function runGate(script: string): number {
  try {
    execFileSync('npx', ['tsx', join('scripts', script)], { cwd: REPO_ROOT, stdio: 'pipe', shell: true });
    return 0;
  } catch (e) {
    return typeof (e as { status?: number }).status === 'number' ? (e as { status: number }).status : 1;
  }
}

let failures = 0;
console.log(`\n  gate plants — ${SCENARIOS.length} scenarios, each proving its gate fails CLOSED\n`);

for (const s of SCENARIOS) {
  const path = abs(s.at);
  let planted = false;
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, s.body, 'utf8');
    planted = existsSync(path);
    const withPlant = runGate(s.script);
    rmSync(path, { force: true });
    const withoutPlant = runGate(s.script);

    const ok = planted && withPlant !== 0 && withoutPlant === 0;
    if (!ok) failures++;
    console.log(
      `  ${ok ? '✅' : '❌'} ${s.gate.padEnd(22)} plant-applied=${planted ? 'YES' : 'NO '} ` +
        `· planted=exit ${withPlant} · control=exit ${withoutPlant}`,
    );
    if (!ok) {
      console.log(`       ⛔ ${s.why}`);
      if (!planted) console.log('       ⛔ THE PLANT DID NOT APPLY — this result says nothing about the gate.');
      else if (withPlant === 0) console.log('       ⛔ the gate FAILED OPEN: it passed with the defect present.');
      else console.log('       ⛔ the control did not pass — the gate reds regardless of the plant.');
    }
  } finally {
    // ⛔ `finally`, so a throw anywhere above cannot strand a planted file in the tree.
    rmSync(path, { force: true });
  }
}

for (const s of SCENARIOS) {
  if (existsSync(abs(s.at))) {
    console.error(`\n❌ test:gate-plants — failed to clean up ${s.at}. Remove it before committing.\n`);
    failures++;
  }
}

if (SCENARIOS.length < MIN_SCENARIOS) {
  console.error(
    `\n❌ test:gate-plants — ${SCENARIOS.length} scenarios, ${MIN_SCENARIOS} expected. Scenarios were\n` +
      '   REMOVED rather than red. Do not lower the floor; restore the scenario.\n',
  );
  process.exit(1);
}

if (failures) {
  console.error(`\n❌ test:gate-plants — ${failures} of ${SCENARIOS.length} scenarios failed.\n`);
  process.exit(1);
}
console.log(`\n✅ test:gate-plants — all ${SCENARIOS.length} gates fail closed on a planted defect.\n`);
