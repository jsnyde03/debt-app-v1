/**
 * ⛔ **EVERY WRAP-SENSITIVE GATE IS PLANTED WITH THE *WRAPPED* SPELLING OF ITS OWN DEFECT.**
 * [S1.13.7.12.6 class 1 · pass-7 `D1-11`]
 *
 * `D1-11` is the finding that explains the other six: **every registered proof and every
 * `test:gate-plants` scenario certifying these gates planted the ONE spelling the gate already caught.**
 * A gate and its proof share an author, so they share a blind spot — six gates were certified green while
 * a Prettier line-wrap walked past all of them.
 *
 * ⛔ **THE POPULATION IS DERIVED, NOT TYPED.** The wrap-sensitive set is *every `scripts/check-*.ts` that
 * imports `./lib/logicalLines`*. A gate joins this harness by importing the helper — and if it imports the
 * helper with **no recipe here, this file FAILS**. That is the difference between a class fix and six
 * edits: a list would be prose again, and prose is what let the class recur six times.
 *
 * ⚠️ **Each plant is the WRAPPED spelling only.** The same-line spelling is already covered by
 * `test:gate-plants`; planting it again here would re-measure the half that was never broken.
 *
 * Usage: npm run test:wrap-escapes
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const SCRIPTS = join(REPO_ROOT, 'scripts');

interface Recipe {
  /** the file the plant is written into, repo-relative */
  target: string;
  /**
   * appended to the target — the defect, WRAPPED the way Prettier would wrap it.
   *
   * ⚠️ **A function when the plant must not itself be a dated fuse.** `check-fixture-dates` only refuses a
   * literal inside its imminent window, so a hard-coded date here would stop testing what it claims to
   * test the moment it aged past the window — a plant that quietly becomes a no-op is the `A1-4` shape
   * committed inside the harness written to prevent it.
   */
  plant: string | (() => string);
  /** the gate must red, and its output must name this */
  reason: RegExp;
  /**
   * ⛔ **`'green'` FOR A GATE WHOSE FIX WAS NOISE REDUCTION** — [class-1 re-audit 3 · `T1`].
   *
   * `check-store-id-writes` was fixed so that ordinary **correct** wrapped code stops redding. A red-only
   * harness cannot measure that: its plant redded before the fix and after it, so the recipe scored
   * `MATCHED` while proving nothing — **revert that gate to per-physical-line and this file still printed
   * `✅ 6 wrap-sensitive gate(s), each red on the WRAPPED spelling`.** The discriminating plant for a
   * noise fix is CORRECT code that must stay green.
   *
   * ⚠️ Both directions are real class-1 failures: `'red'` catches a gate going blind, `'green'` catches one
   * going noisy — and the noisy direction is the one with no escape route at a cap of zero.
   */
  expect?: 'red' | 'green';
}

/** A date inside `check-fixture-dates`' 21-day imminent window, computed rather than written down. */
function imminentDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 8);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * gate script → how to plant the wrapped spelling of the defect it exists to catch.
 *
 * ⚠️ A recipe appends to a real tracked file and is removed again. Every restore is verified
 * byte-identical before the run continues — `git checkout --` is not used, because it throws away an
 * uncommitted fix along with the plant.
 */
const RECIPES: Record<string, Recipe> = {
  'check-amount-collapse.ts': {
    target: 'packages/core/utils/percentComplete.ts',
    plant: '\nexport const __wrapEscape = (raw: string) =>\n  parseAmountField(\n    raw,\n  ) ?? 0;\n',
    reason: /collapses a parsed amount to 0/,
  },
  'check-rounding.ts': {
    target: 'packages/core/utils/percentComplete.ts',
    plant: '\nexport const __wrapEscape2 = (x: number) =>\n  Math.round(\n    x * 100,\n  ) / 100;\n',
    reason: /inline money-rounding expressions/,
  },
  'check-sandbox-writes.ts': {
    target: 'apps/rn/src/utils/a11y.ts',
    plant: "\nimport {\n  appStore,\n} from '../store/appStore';\nexport const __wrapEscape3 = appStore;\n",
    reason: /appStore|singleton|sanctioned/i,
  },
  'check-local-dates.ts': {
    target: 'packages/core/utils/percentComplete.ts',
    // ⚠️ Prettier breaks a method chain AT THE DOT — the exact spelling N-4 measured walking past this gate.
    plant: [
      '',
      'export const __wrapUtc = (d: Date) =>',
      '  d',
      '    .toISOString()',
      '    .slice(0, 10);',
      '',
    ].join('\n'),
    reason: /routed through UTC/,
  },
  'check-store-id-writes.ts': {
    target: 'apps/rn/src/store/analysisSelectors.ts',
    /**
     * ⛔ **CORRECT code that must stay GREEN** — this gate's fix (`N-5`, `T8`) was noise reduction, so the
     * discriminating plant is a wrapped `findIndex` with a BLOCK body: legitimate, and refused by every
     * earlier version of the gate. A red-only plant here scored `MATCHED` against a reverted gate (`T1`).
     */
    plant: [
      '',
      'export const __wrapLookup = (rows: { id: string }[], id: string) =>',
      '  rows.findIndex((r) => {',
      '    return r.id === id;',
      '  });',
      '',
    ].join('\n'),
    expect: 'green',
    reason: /outside a lookup/,
  },
  'check-fixture-dates.ts': {
    // ⚠️ Must be TEST-SHAPED (the gate's population) and NOT clock-pinned, or the plant lands in the
    // `pinned` bucket and is reported rather than refused — a plant that cannot fail.
    target: 'apps/rn/src/utils/format.test.ts',
    plant: () => `\nexport const __wrapFuse = {\n  dueDate:\n    '${imminentDate()}',\n};\n`,
    reason: /cross into the past within \d+ days/,
  },
};

const wrapSensitive = readdirSync(SCRIPTS)
  .filter((f) => /^check-.*\.ts$/.test(f))
  .filter((f) => /from '\.\/lib\/logicalLines'/.test(readFileSync(join(SCRIPTS, f), 'utf8')));

const problems: string[] = [];

/**
 * ⛔ **THE CENSUS — because deriving the population from the IMPORT can only ever see gates that already
 * joined.** Class-1 re-audit `R15`: this harness proves the four fixed gates do not regress, and is blind
 * to the class **recurring in a gate written tomorrow** — which is exactly how the class grew in the first
 * place: every member was written after `check-cap-literals` had already found and documented the escape.
 *
 * So: any gate that splits its input into physical lines is a wrap-sensitive CANDIDATE, and must either use
 * the shared helper or say here why per-line is correct for it. A new gate cannot quietly opt out.
 */
const PER_LINE_OK: Record<string, string> = {
  'check-apostrophes.ts': 'judges user-facing copy INSIDE a string literal, and a string does not span lines (a template literal that does is not copy). Per-line is the right unit.',
  'check-committed-secrets.ts': 'a secret is a single token; a credential split across a line break is not a credential. Per-line matches the subject.',
  'check-money-format.ts': 'same shape — the banned form is one identifier, not a call with arguments.',
  'check-press-opacity.ts': 'the subject is a STATE TERNARY inside one style value (pressed/hovered/disabled), which Prettier keeps on one line because it is short; the gate deliberately does NOT match `opacity` in general, so there is no call argument to wrap. ⚠️ Its previous row here claimed the prop "cannot be split", which the docblock of that gate contradicts - N-4.',
  'check-destructive-writes.ts': 'counts declared call sites per file against a ledger, so a wrapped call still moves the count — the ledger is the check, not the line.',
  'check-gate-freshness.ts': 'prints a recorded fingerprint line by line; it matches nothing in source.',
  'check-comment-convention.ts': 'a comment IS a line construct — `//` runs to the newline, so the line is the subject rather than an accident of formatting.',
  'check-conflict-markers.ts': "git writes `<<<<<<<` anchored at the start of its own line; the format is line-defined, not formatter-defined.",
  'check-control-chars.ts': 'a control character is one character; the line is only how the position is reported to a human.',
};

/**
 * ⛔ **EVERY GATE IS CLASSIFIED — the census is no longer keyed on `.split('\n')`.**
 * [class-1 re-audit 3 · `T5` `T10`]
 *
 * Two holes, opposite directions, in one predicate:
 * - `T5` — a genuinely wrap-sensitive gate that never splits lines was invisible to **both** lists. The
 *   census could only see gates that happened to use one idiom.
 * - `T10` — the predicate read COMMENTS, so a docblock merely *mentioning* `.split('\n')` demanded a review
 *   row for a gate that never splits a line. A census that classifies by prose is classifying prose.
 *
 * ⚡ So the population is now **every `check-*.ts`**, and each must land in exactly one of three places:
 * it uses the shared helper (and therefore has a plant recipe), it is named in {@link PER_LINE_OK} with a
 * reason, or it sits in {@link PER_LINE_UNREVIEWED}. **Silence is no longer a classification.**
 */
/**
 * ⛔ **MEASURED CLASS MEMBERS, NOT YET FIXED — a different state from "not yet looked at".**
 * [class-1 re-audit 3 · `T6` `T7`]
 *
 * A fresh auditor planted the wrapped spelling into each of these and watched it walk past. They are not
 * unreviewed: they are **known blind**, and collapsing that into {@link PER_LINE_UNREVIEWED} would lose the
 * one fact that distinguishes "we have not checked" from "we checked and it is broken".
 *
 * ⚠️ Downward-only. An entry leaves by being FIXED, never by being re-labelled.
 */
const PER_LINE_KNOWN_BLIND: Record<string, string> = {
  'check-month-arithmetic.ts':
    "T6 - the ORIGINAL BLOCKER this gate exists for is itself a wrapped `new Date(...)`, and the wrapped spelling escapes it. Its PER_LINE_OK row claimed the argument list 'is not part of the subject'; the subject is the argument list.",
  'check-glossary.ts':
    "T6 - Prettier's ordinary JSX text wrap splits a rendered sentence across lines, and the gate compares one physical line at a time, so the wrapped sentence is a different sentence to it and to nobody else.",
  'check-contrast.ts':
    'T7 - measured to let a WCAG-AA failure ship behind a `never-text` exemption when the pair is written across lines.',
  'check-trust-claims.ts':
    'T7 - measured a genuine class member by the same plant.',
};

const allGates = readdirSync(SCRIPTS).filter((f) => /^check-.*\.ts$/.test(f));
const perLineCandidates = allGates.filter((f) => !wrapSensitive.includes(f));

/**
 * ⛔ **THE CENSUS'S FIRST RUN MEASURED THE CLASS AT ~20 GATES, NOT THE 6 THE AUDIT NAMED** — and that is
 * the finding, not a nuisance. Reviewing all of them is more than class 1 filed, so the remainder is held
 * as an explicit **downward-only** list rather than waved through: the harness reds if it GROWS, and each
 * entry leaves only by being reviewed into {@link PER_LINE_OK} with a reason, or fixed.
 *
 * ⚠️ **A silent exemption here would be the same defect as the one being fixed.** These are named, counted,
 * and printed on every run precisely so "we never looked" cannot read as "we checked".
 */
const PER_LINE_UNREVIEWED = new Set([
  // ⚠️ Added by the INVERTED census (T5): previously invisible because they do not split lines at all.
  // Listed rather than reasoned about — 4 of 11 reasons written from reading turned out false (T6, N-4).
  'check-a11y-collapse.ts',
  'check-cap-literals.ts',
  'check-ci-chain.ts',
  'check-copy-owners.ts',
  'check-icon-glyphs.ts',
  'check-maestro-selectors.ts',
  'check-type-scale.ts',
  'check-webkit-flex-controls.ts',
  'check-audit-closure.ts',
  'check-finding-guards.ts',
  'check-gate-sources.ts',
  // ⚠️ Matches JSX props, whose VALUES wrap readily — the likeliest genuine member of the class here.
  'check-native-a11y-props.ts',
  'check-pass-coverage.ts',
  'check-restore-doors.ts',
  'check-rn-style-divergence.ts',
  'check-runner-completeness.ts',
  'check-scan-floors.ts',
]);

const unreviewedSeen: string[] = [];
const knownBlindSeen: string[] = [];
for (const gate of perLineCandidates) {
  if (gate in PER_LINE_OK) continue;
  if (gate in PER_LINE_KNOWN_BLIND) {
    knownBlindSeen.push(gate);
    continue;
  }
  if (PER_LINE_UNREVIEWED.has(gate)) {
    unreviewedSeen.push(gate);
    continue;
  }
  problems.push(
    `${gate} does not use lib/logicalLines and is named in NONE of PER_LINE_OK,\n` +
      '        PER_LINE_KNOWN_BLIND or PER_LINE_UNREVIEWED. A per-line matcher is defeated by a formatter —\n' +
      '        that is the whole of class 1, whose members were every gate written AFTER the escape was\n' +
      '        already documented. Use the shared helper, or classify it here.',
  );
}
for (const gate of Object.keys(PER_LINE_KNOWN_BLIND)) {
  if (wrapSensitive.includes(gate)) {
    problems.push(
      `PER_LINE_KNOWN_BLIND names ${gate}, which now uses the shared helper.\n` +
        '        It was FIXED — delete the row rather than leaving a measured defect on the books.',
    );
  }
}
for (const gate of PER_LINE_UNREVIEWED) {
  if (!perLineCandidates.includes(gate)) {
    problems.push(
      `PER_LINE_UNREVIEWED names ${gate}, which no longer splits its input into physical lines.\n` +
        '        A row covering nothing is slack — delete it.',
    );
  }
}

/** ⛔ A gate that declares itself wrap-sensitive and has no recipe makes this harness vacuous for it. */
for (const gate of wrapSensitive) {
  if (!(gate in RECIPES)) {
    problems.push(
      `${gate} imports lib/logicalLines and has NO plant recipe in scripts/test-wrap-escapes.ts.\n` +
        '        A wrap-sensitive gate certified by nothing is exactly the D1-11 shape this file exists to\n' +
        '        close. Add a recipe that plants the WRAPPED spelling of the defect it catches.',
    );
  }
}
for (const gate of Object.keys(RECIPES)) {
  if (!wrapSensitive.includes(gate)) {
    problems.push(
      `${gate} has a recipe here but no longer imports lib/logicalLines.\n` +
        '        A recipe covering nothing is slack — delete it, or restore the gate\'s logical-line scan.',
    );
  }
}

function runGate(gate: string): { code: number; out: string } {
  try {
    /**
     * ⚠️ **`shell: true` is required and its absence looked exactly like a finding.** On Windows `npx` is
     * a `.cmd`; without a shell the nested spawn fails, the gate never runs, and this harness scored all
     * three gates `RED-FOR-THE-WRONG-REASON` — *"it redded, but not for your defect"* — about runs in which
     * nothing redded at all. That is the same harness-fault-wearing-a-finding's-face shape `[D78]` was
     * written for, and `test-gate-plants.ts` already carried the answer.
     */
    const out = execFileSync('npx', ['tsx', `scripts/${gate}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true,
    });
    return { code: 0, out };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? -1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

const results: string[] = [];
for (const gate of wrapSensitive) {
  const recipe = RECIPES[gate];
  if (!recipe) continue;
  const abs = join(REPO_ROOT, recipe.target);
  const backup = `${abs}.wrapescape-backup`;
  const original = readFileSync(abs, 'utf8');
  copyFileSync(abs, backup);

  let verdict = 'UNKNOWN';
  try {
    /**
     * ⛔ **THE BASELINE RUN IS THE WHOLE POINT, AND IT WAS MISSING** — class-1 re-audit `R1`.
     *
     * Without it, a gate that was ALREADY red for an unrelated reason reds under the plant too and scores
     * `MATCHED` — so this harness, written to close *"a check that cannot fail"*, was itself one.
     * ⚡ Measured: `check-sandbox-writes` reverted to per-physical-line **plus** a stale `ALLOWED` entry
     * printed `✅ 4 wrap-sensitive gate(s), each red on the WRAPPED spelling` and exited 0.
     *
     * A red baseline is a **FAULT**, never a verdict: there is no measurement to report.
     */
    const before = runGate(gate);
    if (before.code !== 0) {
      verdict = 'FAULT-BASELINE-ALREADY-RED';
      throw new Error('baseline red');
    }
    const snippet = typeof recipe.plant === 'function' ? recipe.plant() : recipe.plant;
    writeFileSync(abs, original + snippet, 'utf8');
    const applied = readFileSync(abs, 'utf8') !== original;
    const r = runGate(gate);
    const named = recipe.reason.test(r.out);
    const want = recipe.expect ?? 'red';
    if (!applied) verdict = 'PLANT-NOT-APPLIED';
    else if (want === 'green') {
      // The plant is CORRECT code. A red here means the gate refuses a formatter's ordinary output.
      verdict = r.code === 0 ? 'MATCHED' : 'FALSE-POSITIVE-ON-CORRECT-CODE';
    } else if (r.code === 0) verdict = 'FAILED-OPEN';
    else if (!named) verdict = 'RED-FOR-THE-WRONG-REASON';
    else verdict = 'MATCHED';
  } catch {
    if (verdict === 'UNKNOWN') verdict = 'FAULT';
  } finally {
    copyFileSync(backup, abs);
    unlinkSync(backup);
  }

  const restored = readFileSync(abs, 'utf8') === original;
  if (!restored) {
    console.error(`\n❌ ${gate}: RESTORE FAILED on ${recipe.target}. Repair by hand before continuing.\n`);
    process.exit(1);
  }
  results.push(`  ${verdict === 'MATCHED' ? '✅' : '❌'} ${gate.padEnd(28)} wrapped-plant=${verdict} · restored=YES`);
  if (verdict !== 'MATCHED') {
    problems.push(
      `${gate} did not red for the WRAPPED spelling of its defect (${verdict}).\n` +
        `        Planted into ${recipe.target}. This is the D1-3/D1-6/D1-8 escape: the gate catches the\n` +
        '        same-line spelling and a formatter defeats it.',
    );
  }
}

for (const line of results) console.log(line);

if (problems.length) {
  console.error(`\n❌ wrap-escapes: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `\n✅ wrap-escapes: ${wrapSensitive.length} wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect` +
    ` · ${Object.keys(PER_LINE_OK).length} per-line by design` +
    ` · ⛔ ${knownBlindSeen.length} MEASURED BLIND, awaiting fix` +
    ` · ⚠️ ${unreviewedSeen.length} per-line and NOT YET REVIEWED (downward-only).`,
);
