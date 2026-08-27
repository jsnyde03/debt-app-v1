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
  /**
   * ⛔ **S1.9.4 [pass-2 B-1] — EXTRA FILES, so a gate whose input is a CONFIG can be planted at all.**
   *
   * The first five scenarios plant a source file and let the gate find it. Seven registry entries were
   * un-fixable-with-the-gate-green precisely because those gates read a JSON file or the git index instead
   * of a source tree, so there was nothing for a created `.ts` to say to them. These are created and
   * deleted exactly like `at`.
   */
  also?: { at: string; body: string }[];
  /** Flags the planted run passes — how a gate is pointed at the planted input (`--registry=…`). */
  args?: string[];
  /**
   * ⛔ **S1.9.4 — THE CONTROL'S FLAGS, when the planted input is a FILE THE FLAGS POINT AT.**
   *
   * For the five source-tree scenarios the control is the same command with the plant deleted, and the
   * plant is the only variable. For a gate whose input is a config file, deleting the plant leaves the
   * flag pointing at nothing and the gate reds for *"the input is missing"* — which is a red, and says
   * nothing about the check. ⚠️ Measured: all five of these scored `control=exit 1` on the first run.
   *
   * So the control drops the override and runs the gate on its REAL input. The variable is then the
   * INPUT rather than one file's presence, and the claim the control makes is the one that matters: the
   * gate is not red unconditionally ([D63] — a test whose precondition refutes its own mechanism).
   */
  controlArgs?: string[];
  /**
   * ⛔ **S1.9.4 — THE REASON, not just the exit code.** A gate that reds for a DIFFERENT reason than the
   * planted defect scores as a perfect pass under an exit-code-only check, which is the same shape as an
   * assertion that reds before the one it exists to exercise. When set, the planted run's output must
   * contain this, so the plant is attributable.
   */
  expect?: string;
}

/**
 * ⛔ **S1.9.4 [pass-2 B-1] — THE SEVEN GATES WHOSE REGISTRY ENTRY COULD NOT SEE THEIR OWN UN-FIX.**
 *
 * ⚡ Auditor B measured every one of them: copy the gate to temp, apply the smallest edit that restores the
 * ORIGINAL defect, re-run the registry's own matcher — **all seven still GREEN**, with three controls
 * redding so the greens were falsifiable. Three of the seven are the fixes to `check-finding-guards.ts`
 * itself, *the gate that certifies all of the others*. The sharpest: deleting the CALL to `presentInCode`
 * leaves the helper, the token and the green — which is `tested-helper-is-not-a-used-helper`, cited by name
 * in the very docblock of the fix it defeats.
 *
 * ⛔ **A token proves an identifier is present. Only a plant proves the gate still refuses anything.**
 */
const B1_SCENARIOS: Scenario[] = [
  {
    gate: 'lint:finding-guards [M7]',
    script: 'check-finding-guards.ts',
    args: ['--registry=scripts/__gate_plant_registry__.json'],
    controlArgs: [],
    at: 'scripts/__gate_plant_guard__.ts',
    // The token appears ONLY inside a comment. [M7]'s whole finding: prose describing an assertion
    // survives that assertion being deleted, so it guards nothing.
    body: '// the assertion that would have to change\nexport const plantedTokenExtra = 1;\n',
    also: [{ at: 'scripts/__gate_plant_registry__.json', body: '{\n  "PLANT-COMMENT-ONLY": {\n    "what": "a guard whose token appears ONLY in a comment - the [M7] defect, verbatim",\n    "file": "scripts/__gate_plant_guard__.ts",\n    "token": "the assertion that would have to change"\n  }\n}\n' }],
    expect: 'ONLY IN A COMMENT',
    why: 'deleting the CALL to presentInCode leaves the helper, the token and the green — the [M7] defect verbatim',
  },
  {
    gate: 'lint:finding-guards [M6]',
    script: 'check-finding-guards.ts',
    args: ['--registry=scripts/__gate_plant_registry__.json'],
    controlArgs: [],
    at: 'scripts/__gate_plant_guard__.ts',
    // `plantedToken` is a strict PREFIX of `plantedTokenExtra` and appears nowhere on its own. Plain
    // containment calls that a match; [M6]'s boundary rule does not.
    body: 'export const plantedTokenExtra = 1;\n',
    also: [{ at: 'scripts/__gate_plant_registry__.json', body: '{\n  "PLANT-PREFIX": {\n    "what": "a token that is a strict PREFIX of a longer identifier - the [M6] boundary defect",\n    "file": "scripts/__gate_plant_guard__.ts",\n    "token": "plantedToken"\n  }\n}\n' }],
    expect: 'the guard is gone',
    why: 'reverting `lead` to plain containment lets a renamed identifier keep satisfying its old token',
  },
  {
    gate: 'lint:finding-guards [M8]',
    script: 'check-finding-guards.ts',
    args: ['--registry=scripts/__gate_plant_registry__.json'],
    controlArgs: [],
    // ⚠️ An EMPTY registry: entries were removed, which is how a closure stops being tracked. The strict
    // `!==` reds on it; the `<` it replaced would not, and that slack was ten entries wide.
    at: 'scripts/__gate_plant_registry__.json',
    body: '{}\n',
    expect: 'Entries were REMOVED',
    why: 'MIN_ENTRIES checked with `<` accepts a registry that lost entries — the [M8] slack shape',
  },
  {
    gate: 'lint:s1-coverage [M9-vocab]',
    script: 'surface-coverage.ts',
    args: ['--surface=s1', '--claims=scripts/__gate_plant_claims__.json'],
    controlArgs: ['--surface=s1'],
    // "nevr" is not in the vocabulary. Before [M9] an unrecognised value read as SWEPT, so a typo
    // exempted a file from [D69] silently.
    at: 'scripts/__gate_plant_claims__.json',
    body: '{\n  "apps/rn/src/store/trustSelectors.ts": ["nevr"]\n}\n',
    expect: 'outside the vocabulary',
    why: 'an unrecognised claim word used to read as swept, exempting a file from the convergence count',
  },
  {
    gate: 'lint:s1-coverage [D69-inventory]',
    script: 'surface-coverage.ts',
    args: ['--surface=s1', '--claims=scripts/__gate_plant_claims__.json'],
    controlArgs: ['--surface=s1'],
    // A claims file that describes almost none of the surface: every real file is UNCLASSIFIED, which is
    // the state [D69]'s exemption cannot be verified in either direction from.
    at: 'scripts/__gate_plant_claims__.json',
    body: '{\n  "apps/rn/src/store/trustSelectors.ts": ["never"]\n}\n',
    expect: 'UNCLASSIFIED',
    why: '`if (missing.length || stale.length)` reduced to `if (stale.length)` stops reporting new files entirely',
  },
  {
    gate: 'lint:secrets [M10-authoring]',
    script: 'check-committed-secrets.ts',
    args: ['--working-tree'],
    // ⚠️ UNTRACKED, which is the whole point: the committed-tree gate is blind to it BY DESIGN, and
    // `--working-tree` exists so a report's author finds their own plant before committing it.
    at: 'docs/audits/__gate_plant_report__.md',
    /**
     * ⛔ **ASSEMBLED AT RUNTIME, because a plant that is a LITERAL is a committed credential.**
     * The first cut spelled the DSN out here and `lint:secrets` — correctly — reported this file as
     * holding one, in the index and in HEAD, the moment it was committed. A fixture for a secrets gate
     * cannot itself be the thing the gate exists to refuse.
     *
     * ⚠️ The planted FILE still carries a real credential-shaped string, which is what makes it a plant;
     * what is missing is any single line of tracked source that matches the pattern.
     */
    body: `A transcript line: ${'SENTRY' + '_DSN=https://'}${'0123456789abcdef'.repeat(2)}${'@o1.ingest.' + 'sentry.io/1'}\n`,
    expect: 'working tree',
    why: '`if (false && WORKING_TREE)` leaves the identifier in place and the authoring check doing nothing',
  },
];

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
  ...B1_SCENARIOS,
  /**
   * ⛔ **S1.10.6.5 [pass-3 B1] — MULTI-LINE ON PURPOSE, BECAUSE THE GATE HAD TWO INDEPENDENT BLIND SPOTS
   * AND A ONE-LINE PLANT ONLY EXERCISES ONE.**
   *
   * The `Intl` pattern was paren-counted (`[^)]*\)` ran to the call's own closing paren, so it demanded
   * `style: 'currency'` AFTER the call closed) **and** the scan was line-by-line. Repairing either alone
   * still left the gate green over both live sites. ⚡ This plant is written the way the two sanctioned
   * formatters are — options on their own lines — so it fails under either regression.
   *
   * ⚠️ `packages/core`, not `apps/rn/src`: the two live sites were in core, and a plant in the tree that
   * was already covered would not have been where the blindness was.
   */
  {
    gate: 'lint:money [B1-multiline-intl]',
    script: 'check-money-format.ts',
    at: 'packages/core/__gate_plant__.ts',
    body:
      'export function money(n: number) {\n' +
      '  return new Intl.NumberFormat("en-US", {\n' +
      '    style: "currency",\n' +
      '    currency: "USD",\n' +
      '  }).format(n);\n' +
      '}\n',
    expect: 'an inline Intl currency formatter',
    why: 'a tenth hand-rolled formatter written just like the two sanctioned ones — green under BOTH of the B1 blind spots',
  },
];

/** ⛔ Downward-only. Lowering it to make a run pass is the defect this file exists to catch — the same
 *  ratchet `MIN_CHECKS` uses in `preflight-native-lane.ts`, and the opposite of a cap. */
const MIN_SCENARIOS = 12;

const abs = (rel: string) => join(REPO_ROOT, rel);

/** Refuse to start over a tree a previous run left dirty — a stale plant would score as a real defect. */
for (const s of SCENARIOS) {
  // ⚠️ `also` included: a stale extra file is exactly as poisonous as a stale primary one.
  for (const rel of [s.at, ...(s.also ?? []).map((f) => f.at)]) {
    if (existsSync(abs(rel))) {
      console.error(`\n❌ test:gate-plants — a previous run left ${rel} behind. Delete it and re-run.\n`);
      process.exit(1);
    }
  }
}

/**
 * Exit code AND output of a gate, run the way a human runs it. Never throws: a non-zero exit is the signal.
 * ⚠️ The output is captured because an exit code alone cannot say WHY a gate redded — see `Scenario.expect`.
 */
function runGate(script: string, args: string[] = []): { status: number; out: string } {
  const grab = (e: unknown) =>
    `${(e as { stdout?: Buffer }).stdout?.toString() ?? ''}${(e as { stderr?: Buffer }).stderr?.toString() ?? ''}`;
  try {
    const out = execFileSync('npx', ['tsx', join('scripts', script), ...args], { cwd: REPO_ROOT, stdio: 'pipe', shell: true });
    return { status: 0, out: out.toString() };
  } catch (e) {
    const status = typeof (e as { status?: number }).status === 'number' ? (e as { status: number }).status : 1;
    return { status, out: grab(e) };
  }
}

let failures = 0;
console.log(`\n  gate plants — ${SCENARIOS.length} scenarios, each proving its gate fails CLOSED\n`);

for (const s of SCENARIOS) {
  const files = [{ at: s.at, body: s.body }, ...(s.also ?? [])];
  let planted = false;
  try {
    for (const f of files) {
      mkdirSync(dirname(abs(f.at)), { recursive: true });
      writeFileSync(abs(f.at), f.body, 'utf8');
    }
    planted = files.every((f) => existsSync(abs(f.at)));
    const withPlant = runGate(s.script, s.args ?? []);
    for (const f of files) rmSync(abs(f.at), { force: true });
    // ⚠️ The control runs with the same args unless the scenario names its own — see `controlArgs`, and
    // note that defaulting to `s.args` is what makes a source-tree scenario's control a single-variable
    // comparison.
    const withoutPlant = runGate(s.script, s.controlArgs ?? s.args ?? []);

    // ⛔ S1.9.4 — the planted run must red FOR THE PLANTED REASON. Without this a scenario passes on a
    // gate that reds at startup for something unrelated, which is a green that means nothing.
    const rightReason = !s.expect || withPlant.out.includes(s.expect);
    const ok = planted && withPlant.status !== 0 && withoutPlant.status === 0 && rightReason;
    if (!ok) failures++;
    console.log(
      `  ${ok ? '✅' : '❌'} ${s.gate.padEnd(26)} plant-applied=${planted ? 'YES' : 'NO '} ` +
        `· planted=exit ${withPlant.status} · control=exit ${withoutPlant.status}` +
        `${s.expect ? ` · reason=${rightReason ? 'MATCHED' : 'WRONG'}` : ''}`,
    );
    if (!ok) {
      console.log(`       ⛔ ${s.why}`);
      if (!planted) console.log('       ⛔ THE PLANT DID NOT APPLY — this result says nothing about the gate.');
      else if (withPlant.status === 0) console.log('       ⛔ the gate FAILED OPEN: it passed with the defect present.');
      else if (withoutPlant.status !== 0) console.log('       ⛔ the control did not pass — the gate reds regardless of the plant.');
      else console.log(`       ⛔ it redded for the WRONG REASON — expected output containing ${JSON.stringify(s.expect)}.`);
    }
  } finally {
    // ⛔ `finally`, so a throw anywhere above cannot strand a planted file in the tree.
    for (const f of files) rmSync(abs(f.at), { force: true });
  }
}

for (const s of SCENARIOS) {
  for (const rel of [s.at, ...(s.also ?? []).map((f) => f.at)]) {
    if (existsSync(abs(rel))) {
      console.error(`\n❌ test:gate-plants — failed to clean up ${rel}. Remove it before committing.\n`);
      failures++;
    }
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
