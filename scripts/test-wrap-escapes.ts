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
 * ⛔ **BOTH SPELLINGS, AND THE COVERAGE CLAIM IS DERIVED.** [class-1 re-audit 4 `U16`] This header used
 * to read *"each plant is the WRAPPED spelling only — the same-line spelling is already covered by
 * `test:gate-plants`"*. ⚡ **Measured: that was true of 4 of the 10 gates.** It was written when this
 * harness held four recipes; rounds 3 and 4 added six more and nobody re-checked the sentence — a
 * CARRIED PREMISE, the same shape as `T6`'s and `N-4`'s false `PER_LINE_OK` reasons.
 *
 * So the covered set is now READ from `test-gate-plants.ts` through `package.json`'s script map, and a
 * gate in neither harness fails this file. The six uncovered ones carry a `sameLine` plant here.
 *
 * Usage: npm run test:wrap-escapes
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { armPlant, preflightRestore } from './lib/plantSafety';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const SCRIPTS = join(REPO_ROOT, 'scripts');

/**
 * ⛔ `U15` - RECOVER FIRST, then read the tree. A previous run killed outright leaves a planted defect
 * in a tracked file, and every gate this harness then runs would be measuring that.
 */
const recovered = preflightRestore(REPO_ROOT);
if (recovered.length) {
  console.log(`⚠️  pre-flight restored ${recovered.length} file(s) left planted by an interrupted run:`);
  for (const r of recovered) console.log(`     ${r}`);
}

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
  plant?: string | (() => string);
  /**
   * ⛔ **WRAP AN EXISTING LINE, which is what Prettier actually does.** [class-1 re-audit 4 `U12`]
   *
   * Appending a pre-wrapped block is a proxy: it proves the gate sees a wrapped defect that was not there
   * before. For a gate whose fix was **tolerating** a wrap — `check-finding-guards`, whose guard tokens
   * are sentences — the discriminating plant is the opposite: take a line that is ALREADY correct and
   * break it, and require the gate to stay green. An append cannot express that, because the unwrapped
   * original is still sitting in the file answering for it.
   *
   * ⚠️ `find` must match exactly once; zero or many is a FAULT, not a verdict.
   */
  edit?: { find: string; replace: string };
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
  /**
   * ⛔ **THE ORDINARY, UNWRAPPED SPELLING — required when NO OTHER HARNESS PLANTS IT.**
   * [class-1 re-audit 4 `U16`]
   *
   * ⚡ This file's header used to justify planting only the wrapped spelling by saying the same-line one
   * *"is already covered by `test:gate-plants`"*. **Measured: true of 4 of the 10 gates.** The sentence
   * was written when the harness held four recipes; rounds 3 and 4 added six more and nobody re-checked
   * it — the same CARRIED PREMISE shape as `T6`'s and `N-4`'s false `PER_LINE_OK` reasons.
   *
   * ⚠️ So the claim is DERIVED rather than written: the covered set comes from `test-gate-plants.ts`
   * through `package.json`'s script map, and a gate in neither harness FAILS this file. A gate that lost
   * the ordinary spelling — a widened `AFTER`, a mis-edited callee, a second matcher going blind, which
   * is `U10` exactly — would otherwise be caught by nothing at all.
   */
  sameLine?: string | (() => string);
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
const RECIPES: Record<string, Recipe | Recipe[]> = {
  'check-amount-collapse.ts': {
    target: 'packages/core/utils/percentComplete.ts',
    plant: '\nexport const __wrapEscape = (raw: string) =>\n  parseAmountField(\n    raw,\n  ) ?? 0;\n',
    sameLine: '\nexport const __sameEscape = (raw: string) => parseAmountField(raw) ?? 0;\n',
    reason: /collapses a parsed amount to 0/,
  },
  'check-rounding.ts': {
    target: 'packages/core/utils/percentComplete.ts',
    plant: '\nexport const __wrapEscape2 = (x: number) =>\n  Math.round(\n    x * 100,\n  ) / 100;\n',
    sameLine: '\nexport const __sameEscape2 = (x: number) => Math.round(x * 100) / 100;\n',
    /**
     * ⚠️ The one recipe whose `reason` is a COUNT CROSSING rather than a site. This gate reds on a ratchet
     * and prints only `sites.slice(0, 12)`, so the plant's own line is not in the output at all. The
     * discriminator is the red branch's own sentence — the green path prints `(cap 94, downward-only)`.
     * Measured: blind leaves 94 and exits 0; seeing the wrapped `Math.round(` leaves 95 and prints this.
     */
    reason: /inline money-rounding expressions; the cap is/,
  },
  'check-sandbox-writes.ts': {
    target: 'apps/rn/src/utils/a11y.ts',
    plant: "\nimport {\n  appStore,\n} from '../store/appStore';\nexport const __wrapEscape3 = appStore;\n",
    sameLine: "\nimport { appStore } from '../store/appStore';\nexport const __sameEscape3 = appStore;\n",
    reason: /a11y\.ts:\d+/,
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
  'check-month-arithmetic.ts': {
    target: 'packages/core/utils/percentComplete.ts',
    // The ORIGINAL BLOCKER's own shape, wrapped: an unclamped `getDate()` carried across a month step.
    plant: [
      '',
      'export const __wrapMonth = (d: Date) =>',
      '  new Date(',
      '    d.getFullYear(),',
      '    d.getMonth() + 1,',
      '    d.getDate(),',
      '  );',
      '',
    ].join(String.fromCharCode(10)),
    reason: /percentComplete\.ts:\d+/,
  },
  'check-glossary.ts': {
    target: 'apps/rn/src/utils/a11y.ts',
    // A retired PHRASE wrapped between its two words - four of the five retired terms are phrases.
    plant: [
      '',
      'export const __wrapGlossary = `your breathing',
      '  room this month`;',
      '',
    ].join(String.fromCharCode(10)),
    reason: /a11y\.ts:\d+/,
  },
  /**
   * ⛔ **TWO RECIPES, one per MATCHER — `U10`.** This gate holds three scans and had one plant, so the
   * second per-line matcher was invisible to the census by construction: the file already counted as
   * wrap-sensitive, so nothing asked it for a reason.
   */
  'check-contrast.ts': [
    {
      target: 'apps/rn/src/components/plan/PaydayGuardianCard.tsx',
      // `textUses`. A `color:` token use wrapped by Prettier. Unseen, the token drops out of the CHECKED
      // SET, so a WCAG-AA failure ships behind a `never-text` exemption that is no longer true.
      plant: [
        '',
        'export const __wrapContrast = {',
        '  color:',
        '    c.accent.brand,',
        '};',
        '',
      ].join(String.fromCharCode(10)),
      sameLine: '\nexport const __sameContrast = { color: c.accent.brand };\n',
      reason: /accent\.brand/,
    },
    {
      target: 'apps/rn/src/components/plan/PaydayGuardianCard.tsx',
      /**
       * `INK_LITERAL`. ⚡ Measured before the fix: the same object on ONE line redded and named the line;
       * with the value wrapped onto its own line the gate printed **`every rendered token pair clears its
       * floor.`** and exited 0. A literal ink cannot flip with the theme, so it is right in one scheme
       * and unchecked in the other — and that shipped behind a green tick.
       */
      plant: [
        '',
        'export const __wrapInk = {',
        '  color:',
        "    '#123456',",
        '};',
        '',
      ].join(String.fromCharCode(10)),
      sameLine: "\nexport const __sameInk = { color: '#123456' };\n",
      reason: /paints ink as the literal '#123456'/,
    },
  ],
  'check-trust-claims.ts': {
    target: 'apps/rn/src/store/drift.ts',
    // The ledger declares its per-file counts EXACT, so a wrapped comparison silently LEAVES the ledger.
    plant: [
      '',
      'export const __wrapLiveness = (balance: number) =>',
      '  balance',
      '  >= 0;',
      '',
    ].join(String.fromCharCode(10)),
    sameLine: '\nexport const __sameLiveness = (balance: number) => balance >= 0;\n',
    reason: /drift\.ts is ledgered/,
  },
  /**
   * ⛔ **THE TOLERANCE DIRECTION, and the only recipe that WRAPS AN EXISTING LINE.** [`U11` · `U12`]
   *
   * ⚡ A guard token is a sentence, and a sentence is the most wrappable thing in this repo. Measured
   * before the fix: this exact edit — Prettier's ordinary output for a long string — took `267 → 266`
   * guarded and printed `the guard is gone` over an assertion that was still there, in the instrument
   * that decides whether every finding in the audit is closed, with `MAX_UNGUARDED` at 1 and no
   * allow-list to absorb it.
   *
   * ⚠️ `expect: 'green'` for the reason `T1` established: the fix was TOLERANCE, so a red-only plant
   * would score `MATCHED` against a gate reverted to per-physical-line and prove nothing.
   */
  'check-finding-guards.ts': {
    target: 'apps/rn/src/store/trustSelectors.test.ts',
    edit: {
      find: "'⛔ B1 — Today must NOT reach the debt-free celebration')",
      replace: "'⛔ B1 — Today must NOT reach the debt-free ' +\n      'celebration')",
    },
    expect: 'green',
    reason: /the guard is gone/,
  },
  'check-fixture-dates.ts': {
    // ⚠️ Must be TEST-SHAPED (the gate's population) and NOT clock-pinned, or the plant lands in the
    // `pinned` bucket and is reported rather than refused — a plant that cannot fail.
    target: 'apps/rn/src/utils/format.test.ts',
    plant: () => `\nexport const __wrapFuse = {\n  dueDate:\n    '${imminentDate()}',\n};\n`,
    sameLine: () => `\nexport const __sameFuse = { dueDate: '${imminentDate()}' };\n`,
    reason: /cross into the past within \d+ days/,
  },
};

const wrapSensitive = readdirSync(SCRIPTS)
  .filter((f) => /^check-.*\.ts$/.test(f))
  /**
   * ⚠️ **THE EXTENSION IS OPTIONAL IN THE IMPORT** — `check-scan-floors.ts` documents this exact miss in its
   * own header (*"`check-trust-claims.ts` imports `'./lib/stripCode.ts'` while the other ten omit it"*), and
   * this census reproduced it: `check-trust-claims` imported `'./lib/logicalLines.ts'` and read as
   * unclassified, with its plant recipe reported as covering nothing. **Second instrument, same blindness.**
   */
  /**
   * ⛔ **BOTH SHARED WRAP-SAFE HELPERS, not just the first one written.** [class-1 re-audit 4 `U12`]
   *
   * `lib/joinedCode` is the producer `check-finding-guards` moved onto for `U11` — a guard token is a
   * sentence, and asking one physical line for it reported an intact assertion as a deleted guard. Keying
   * this census on `logicalLines` alone would have left that gate sitting in `PER_LINE_UNREVIEWED`
   * FOREVER, labelled "not yet looked at", after being measured, fixed and certified. A gate joins this
   * harness by adopting EITHER helper.
   */
  .filter((f) => /from '\.\/lib\/(logicalLines|joinedCode)(\.ts)?'/.test(readFileSync(join(SCRIPTS, f), 'utf8')));

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
  /**
   * ⛔ **THE FOUR BELOW WERE MEASURED, not read** — [class-1 re-audit 4 `U12`]. Three of them parse with
   * the TypeScript compiler and never split their input at all; the fourth matches a bare identifier.
   *
   * ⚡ The row that used to sit above `check-native-a11y-props` called it *"the likeliest genuine member
   * of the class here"* — and both plants, same-line and wrapped over five lines, redded. It is immune.
   * Meanwhile `check-finding-guards`, annotated with nothing, WAS a genuine member (`U11`). ⛔ That note
   * was written from reading, three lines below the note recording that 4 of 11 reasons written from
   * reading turned out false.
   */
  'check-native-a11y-props.ts':
    'matches a bare prop IDENTIFIER (`\\baccessibilityValue\\b`), and an identifier is the one construct a ' +
    'formatter cannot split. Measured both directions: the prop on one line and the same prop wrapped over ' +
    'five lines each red, naming the line.',
  'check-a11y-collapse.ts': 'parses with `ts.createSourceFile` and never splits its input into lines — formatting is invisible to an AST by construction. Verified: 0 line splits in the file.',
  'check-type-scale.ts': 'same — `ts.createSourceFile`, 0 line splits.',
  'check-webkit-flex-controls.ts': 'same — `ts.createSourceFile`, 0 line splits.',
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
  'check-cap-literals.ts',
  'check-ci-chain.ts',
  'check-copy-owners.ts',
  'check-icon-glyphs.ts',
  'check-maestro-selectors.ts',
  'check-audit-closure.ts',
  'check-gate-sources.ts',
  'check-pass-coverage.ts',
  'check-restore-doors.ts',
  'check-rn-style-divergence.ts',
  'check-runner-completeness.ts',
  'check-scan-floors.ts',
]);

/**
 * ⛔ **THE UNREVIEWED LIST IS PINNED, NOT JUST DOWNWARD-ONLY BY CONVENTION** — [class-1 re-audit 3 · `N-10`].
 *
 * The census checked only the DEPARTURE half — a row naming a gate that no longer qualifies. Adding a real
 * new per-line gate **and** a row for it kept the run green with the count silently rising 11 → 12, which is
 * the arrival half and the one that matters: an unreviewed list that can grow is not a backlog, it is a
 * parking space.
 *
 * ⚠️ Lower it in the same edit that reviews a gate. Raising it is the defect this pin exists to catch.
 */
// ⚠️ 17 → 12 at S1.13.7.12.6 round 5 [`U12`]: four gates MEASURED immune moved into PER_LINE_OK
// (three parse with the TypeScript compiler, one matches a bare identifier), and `check-finding-guards`
// left by being FIXED onto lib/joinedCode - it is now in `wrapSensitive` with a recipe of its own.
const MAX_UNREVIEWED = 12;

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

/**
 * ⛔ **A GATE MAY HOLD MORE THAN ONE MATCHER, AND KEYING THIS MAP ON THE FILE HID ONE.**
 * [class-1 re-audit 4 `U10`, major]
 *
 * ⚡ `check-contrast` holds three scans. `T7` migrated `textUses`, the file then counted as
 * *wrap-sensitive*, and its second per-line matcher `INK_LITERAL` left the reviewable population without
 * ever being looked at - a hard-coded ink written the way Prettier emits it walked straight past the gate
 * that exists to refuse it, **measured**. One recipe per FILE cannot see that; one recipe per MATCHER can.
 *
 * ⚠️ A bare object is still accepted for the gates that genuinely have one matcher - the array form
 * is what a second one costs, not a migration everybody has to do first.
 */
const recipesFor = (gate: string): Recipe[] => {
  const r = RECIPES[gate];
  return r ? (Array.isArray(r) ? r : [r]) : [];
};

/**
 * ⛔ **WHICH GATES `test:gate-plants` ACTUALLY PLANTS — DERIVED, because the written claim was false.**
 * [class-1 re-audit 4 `U16`]
 *
 * The scenarios there name an npm script (`gate: 'lint:month-arithmetic'`), and `package.json` says which
 * `scripts/check-*.ts` that script runs. Both halves are read rather than restated, so neither can go
 * stale: renaming a script, or pointing it at a different gate file, moves this set with it.
 */
function sameLinePlantedElsewhere(): Set<string> {
  const scripts = (JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> })
    .scripts;
  const plants = readFileSync(join(SCRIPTS, 'test-gate-plants.ts'), 'utf8');
  const covered = new Set<string>();
  for (const m of plants.matchAll(/gate:\s*'(lint:[A-Za-z0-9:-]+)/g)) {
    const cmd = scripts[m[1]];
    const file = cmd && /scripts\/(check-[A-Za-z0-9._-]+\.ts)/.exec(cmd);
    if (file) covered.add(file[1]);
  }
  return covered;
}
const sameLineCovered = sameLinePlantedElsewhere();

/** ⛔ A gate that declares itself wrap-sensitive and has no recipe makes this harness vacuous for it. */
for (const gate of wrapSensitive) {
  if (recipesFor(gate).length === 0) {
    problems.push(
      `${gate} imports lib/logicalLines and has NO plant recipe in scripts/test-wrap-escapes.ts.\n` +
        '        A wrap-sensitive gate certified by nothing is exactly the D1-11 shape this file exists to\n' +
        '        close. Add a recipe that plants the WRAPPED spelling of the defect it catches.',
    );
  }
  /**
   * ⛔ `U16` — the ORDINARY spelling has to be planted by SOMEBODY. Four of these ten gates are covered
   * by `test:gate-plants`; the other six were covered by a sentence in this file's header claiming they
   * were. A `green` recipe is exempt: its plant IS correct code, so there is no defect spelling to cover.
   */
  for (const [n, recipe] of recipesFor(gate).entries()) {
    if (recipe.expect === 'green' || recipe.sameLine || sameLineCovered.has(gate)) continue;
    problems.push(
      `${gate} #${n + 1} — NOTHING plants the same-line spelling of its defect.\n` +
        `        test:gate-plants covers ${[...sameLineCovered].sort().join(', ') || 'nothing'}, and this\n` +
        '        matcher is not among them. Give the recipe a `sameLine` plant, or add a scenario there.\n' +
        '        A gate losing the ORDINARY spelling — a widened bound, a matcher going blind — would be\n' +
        '        caught by nothing, and the reason for not covering it was a sentence that had gone false.',
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
  const all = recipesFor(gate);
  for (const [n, recipe] of all.entries()) {
  // ⚠️ A gate with more than one matcher names WHICH one in its result line - `U10`'s whole point is
  // that two scans in one file are two different things to certify.
  const label = all.length > 1 ? `${gate} #${n + 1}` : gate;
  const abs = join(REPO_ROOT, recipe.target);
  const original = readFileSync(abs, 'utf8');
  /**
   * ⛔ `U15` - the sidecar is written BEFORE the plant and interruption handlers are armed, because
   * the `finally` below does not run on a signal. A run of THIS harness was killed at a tool timeout and
   * left a planted defect in tracked production source, with the backup beside it and nothing to use it.
   */
  const disarm = armPlant([{ abs, original }]);

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
    /**
     * ⛔ **THE `reason` REGEX IS TESTED AGAINST THE GREEN RUN, AND SIX OF NINE USED TO MATCH IT.**
     * [class-1 re-audit 4 `U5`, major]
     *
     * `MATCHED` requires *the gate redded* **and** *`reason` names the defect*. If `reason` also matches
     * the gate's SUCCESS line, the second condition tests nothing — a plant that reds its gate through a
     * side channel (a scan-floor assertion, a different check inside a multi-check gate, a parse fault)
     * scores `MATCHED`, and `RED-FOR-THE-WRONG-REASON` becomes unreachable.
     *
     * ⚡ **Measured, not reasoned: `rounding` matched on `inline money-rounding expressions`,
     * `sandbox-writes` on `sanctioned`, `month-arithmetic` on `setMonth`, `glossary` on `retired word`,
     * `trust-claims` on `liveness`, and `contrast` on the bare word `contrast` — which is in the gate's
     * own name and therefore in every line it prints.** Each was written by reading the failure message,
     * and a failure message repeats its own subject.
     *
     * ⚠️ The narrowed regexes name the PLANT'S SITE (`percentComplete.ts:123`, `accent.brand`,
     * `drift.ts is ledgered`) rather than the gate's subject, because the site is the half a green run
     * cannot print. ⛔ **This is the third location of the `a check that cannot fail` class in this
     * cluster** (`R1`'s missing baseline, `T1`'s red-only recipe, now this), so it is asserted here
     * rather than left as a convention — the baseline output is already in hand one line up.
     */
    if (recipe.reason.test(before.out)) {
      verdict = 'FAULT-REASON-MATCHES-GREEN';
      problems.push(
        `${gate} — its recipe's \`reason\` ${recipe.reason} matches the gate's own GREEN output.\n` +
          '        The verdict `MATCHED` then means only "it exited non-zero", so RED-FOR-THE-WRONG-REASON\n' +
          '        cannot be reached and any side-channel red scores as a pass. Narrow it to something only\n' +
          "        the failure prints — the plant's own file:line, or the token it names.",
      );
      throw new Error('reason vacuous');
    }
    let planted: string;
    if (recipe.edit) {
      // ⛔ `U12` — exactly one match, or the plant is measuring something nobody chose.
      const n = original.split(recipe.edit.find).length - 1;
      if (n !== 1) {
        verdict = `PLANT-ANCHOR-MATCHED-${n}x`;
        throw new Error('anchor');
      }
      planted = original.replace(recipe.edit.find, recipe.edit.replace);
    } else {
      const snippet = typeof recipe.plant === 'function' ? recipe.plant() : (recipe.plant ?? '');
      planted = original + snippet;
    }
    writeFileSync(abs, planted, 'utf8');
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

    /**
     * ⛔ `U16` — AND THE ORDINARY SPELLING, for the six gates no other harness plants. Run second and
     * from the ORIGINAL text, never on top of the wrapped plant: two defects in the file at once cannot
     * tell you which one the gate saw.
     */
    if (verdict === 'MATCHED' && recipe.sameLine) {
      const plain = typeof recipe.sameLine === 'function' ? recipe.sameLine() : recipe.sameLine;
      writeFileSync(abs, original + plain, 'utf8');
      const s = runGate(gate);
      if (s.code === 0) verdict = 'SAME-LINE-FAILED-OPEN';
      else if (!recipe.reason.test(s.out)) verdict = 'SAME-LINE-RED-FOR-THE-WRONG-REASON';
    }
  } catch {
    if (verdict === 'UNKNOWN') verdict = 'FAULT';
  } finally {
    disarm();
  }

  const restored = readFileSync(abs, 'utf8') === original;
  if (!restored) {
    console.error(`\n❌ ${gate}: RESTORE FAILED on ${recipe.target}. Repair by hand before continuing.\n`);
    process.exit(1);
  }
  results.push(`  ${verdict === 'MATCHED' ? '✅' : '❌'} ${label.padEnd(28)} wrapped-plant=${verdict} · restored=YES`);
  if (verdict !== 'MATCHED') {
    problems.push(
      `${label} did not red for the WRAPPED spelling of its defect (${verdict}).\n` +
        `        Planted into ${recipe.target}. This is the D1-3/D1-6/D1-8 escape: the gate catches the\n` +
        '        same-line spelling and a formatter defeats it.',
    );
  }
  }
}

if (unreviewedSeen.length > MAX_UNREVIEWED) {
  problems.push(
    [
      `PER_LINE_UNREVIEWED holds ${unreviewedSeen.length} gate(s) and the pin is ${MAX_UNREVIEWED}.`,
      '        It only goes DOWN. A gate leaves by being reviewed into PER_LINE_OK with a reason, or by',
      '        being fixed onto the shared helper — never by the list growing to accommodate it.',
    ].join(String.fromCharCode(10)),
  );
}

for (const line of results) console.log(line);

// ⛔ `U14` — counted from the recipes actually exercised, not from `wrapSensitive.length`, so a recipe
// changing direction moves the number rather than being absorbed into the wrong half.
const exercised = wrapSensitive.flatMap((g) => recipesFor(g));
const greenRecipes = exercised.filter((r) => r.expect === 'green').length;
const redRecipes = exercised.length - greenRecipes;

if (problems.length) {
  console.error(`\n❌ wrap-escapes: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  /**
   * ⛔ **THE COUNTS ARE SPLIT BY DIRECTION — the line used to claim all ten were `red on the WRAPPED
   * spelling` while one is an `expect: 'green'` recipe that must NOT red.** [class-1 re-audit 4 `U14`]
   *
   * ⚠️ It reads as a small wording slip and it is not: `T1` measured that a red-only harness scored
   * `MATCHED` against a gate reverted to per-physical-line, which is why the green direction was added at
   * all. A summary that folds it back into the red count erases the distinction the recipe exists for —
   * and this file's own `U7` neighbour is about a verdict line that said something untrue.
   */
  `\n✅ wrap-escapes: ${wrapSensitive.length} wrap-sensitive gate(s) · ${exercised.length} matcher recipes —` +
    ` ${redRecipes} red on the WRAPPED spelling of their own defect, ${greenRecipes} GREEN on correct` +
    ' code a formatter produced' +
    ` · ${exercised.filter((r) => r.sameLine).length} also planted UNWRAPPED here, ${
      wrapSensitive.filter((g) => sameLineCovered.has(g)).length
    } by test:gate-plants` +
    ` · ${Object.keys(PER_LINE_OK).length} per-line by design` +
    ` · ⛔ ${knownBlindSeen.length} MEASURED BLIND, awaiting fix` +
    ` · ⚠️ ${unreviewedSeen.length} per-line and NOT YET REVIEWED (downward-only).`,
);
