import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { claimFields } from '../apps/rn/src/store/trustSelectors.ts';
import { REPAIRABLE_MONEY_FIELDS } from '../apps/rn/src/data/migrations.ts';
import { stripCommentsOnly } from './lib/stripCode.ts';

/**
 * ⛔ **S1.10.6.2 [pass-3 C-1] — A CLAIM ROUTE WITH NO CALLER IS DECORATION, AND ONE SHIPPED.**
 *
 * ⚡ Pass 2 closed *"the trust rule is wired to a SUBSET of claim sites and a SUBSET of fields"* by adding
 * a **table**, and `trustSelectors.test.ts` gates that table for completeness — every repairable field is
 * routed to some claim, so a new field cannot land unrouted. ⛔ **That gate proved the table's INPUTS and
 * nothing about its OUTPUTS.** Pass 3 measured `'row-figures'` — the route invented for *"a single row
 * restating its own money"* — at **zero production consumers**: three grep hits, all the declaration or
 * its own test. Money went on printing *"0% APR"* on a card charging 22% and *"$0.00/mo"* on one demanding
 * $150, the two strings that route's own docblock names as the reason it exists.
 *
 * ⚡ **The fields were widened and the claim sites were only re-declared.** That is the third consecutive
 * pass in which the same rule was widened in one direction and missed in another, and the reason it is a
 * gate rather than a sweep: *this class has been closed by enumeration five times and the enumeration has
 * been short five times.*
 *
 * ## The three checks, and what each would have caught
 *
 * 1. **Every `MoneyClaim` is consumed in production.** Reds on `C-1` exactly — a declared route nobody
 *    asks. ⚠️ Tests do not count as consumers: `trustSelectors.test.ts` asserted `mayClaim(…,
 *    'row-figures') === false` and passed, because the selector was correct and unused.
 * 2. **Every `(claim, entity, field)` a call site asks about is actually ROUTED.** The helpers intersect
 *    what a site asks with what the claim routes, so an unrouted field contributes nothing and the site
 *    silently reads *"readable"* — the safe-looking direction, which is why it needs a checker rather than
 *    a reviewer.
 * 3. **The money-printing ledger.** Every production file that both prints money AND reads a repairable
 *    field either asks `trustSelectors` or is listed below with a written reason. ⛔ **`MAX_EXEMPT` is
 *    downward-only**: a new unguarded money surface reds, and so does a stale exemption, so the ledger
 *    cannot quietly grow or quietly rot. ⚠️ It is a *visibility* instrument, not a proof — a file that
 *    imports the module can still ask the wrong question. Check 2 is the one with teeth about correctness;
 *    this one exists because when this class was last counted, **38 production files printed money and 4
 *    consulted the trust module**, and nothing anywhere said so.
 */

const REPO_ROOT = join(import.meta.dirname, '..');

/** Every file git tracks — never a directory list. An enumerated scope is only as good as its last omission. */
function trackedSources(): string[] {
  return execFileSync('git', ['ls-files', '*.ts', '*.tsx'], { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

const TRUST_MODULE = 'apps/rn/src/store/trustSelectors.ts';

/**
 * ⛔ **S1.11.2 [pass-4 D4-3] — THIS REPO HAS TWO TEST-FILE CONVENTIONS AND THIS KNEW ONE.**
 *
 * It was `/\.test\.tsx?$/ || rel.startsWith('apps/rn/tests/')`. ⚡ **`packages/` contains ZERO `.test.ts`
 * files.** Its convention is `testXxx.ts` — `testDebtProjection.ts`, `testBnplInstallment.ts`, … —
 * **64 tracked files**, plus the 20 in `packages/core/testing/`. `inScope` admits all of them and every
 * one was classified **production**.
 *
 * ⛔ So a `MoneyClaim` could lose its last real production caller with this gate green, as long as one
 * `testXxx.ts` still mentioned it — which is pass-3 blocker `C-1` verbatim, behind the gate written to
 * make `C-1` impossible. ⚠️ The finding said *"40+"*; measured, it is **64**.
 *
 * ⚠️ **Widening the enumeration by one spelling is what produced this.** The gate's own history records
 * the previous version missing `check-trust-claims.ts` over a `.ts` import spelling and calling it
 * *"the undercount class this repo has now measured seven times, arriving inside the instrument written
 * to close it."* So this matches the CONDITION — a file whose job is testing — by directory and by
 * basename convention, and the self-check below asserts it against real tracked paths from **both**
 * conventions rather than trusting the regex to be read correctly.
 */
const isTest = (rel: string) =>
  /\.test\.tsx?$/.test(rel) || // apps/rn convention
  /(^|\/)tests?\//.test(rel) || // apps/rn/tests/, and any tests/ dir
  /(^|\/)testing\//.test(rel) || // packages/core/testing/ — the runners
  /(^|\/)test[A-Z][A-Za-z0-9]*\.tsx?$/.test(rel); // packages/core convention: testDebtProjection.ts

/**
 * ⛔ **MODULE SCOPE, and the sample paths are asserted to EXIST.** A classifier self-check whose fixtures
 * are stale paths passes by testing nothing — the same shape as a plant that never applied. Each row is a
 * real tracked file, and the existence assertion is what stops this rotting into a tautology.
 */
{
  const SAMPLES: readonly (readonly [string, boolean])[] = [
    ['apps/rn/src/store/trustSelectors.test.ts', true], //           apps: .test.ts
    ['apps/rn/tests/e2e/trust-claims.spec.ts', true], //             apps: the e2e tree
    ['packages/core/debt/testDebtProjection.ts', true], //           packages: testXxx.ts — the 64 D4-3 found
    ['packages/core/testing/runRegressionTests.ts', true], //        packages: the runners
    ['apps/rn/src/store/trustSelectors.ts', false], //               production, and the subject itself
    ['packages/core/debt/projectDebtPayoff.ts', false], //           production, in the tree that was misread
  ];
  const tracked = new Set(trackedSources());
  for (const [rel, want] of SAMPLES) {
    if (!tracked.has(rel)) {
      console.error(`\n❌ trust claims — its own isTest() fixture \`${rel}\` is not a tracked file.\n   ⛔ A classifier checked against paths that no longer exist proves nothing. Re-point the sample.\n`);
      process.exit(1);
    }
    if (isTest(rel) !== want) {
      console.error(`\n❌ trust claims — isTest(${rel}) is ${isTest(rel)}, expected ${want}.\n   ⛔ [D4-3] Misclassifying a test as production lets a claim keep a caller it does not have.\n`);
      process.exit(1);
    }
  }
}
/**
 * ⛔ The LEGACY Capacitor tree is out of scope and says so here rather than by being forgotten. It is
 * deleted at P6.11 and shares no store with the RN app, so a trust guard there would be guarding nothing.
 */
const inScope = (rel: string) => rel.startsWith('apps/rn/src/') || rel.startsWith('packages/');

const files = trackedSources().filter(inScope);
const read = new Map<string, string>();
for (const rel of files) read.set(rel, stripCommentsOnly(readFileSync(join(REPO_ROOT, rel), 'utf8')));

const failures: string[] = [];

// ── 1 · every claim is consumed in production ────────────────────────────────────────────────────
const claims = Object.keys(claimFields());
const consumers = new Map<string, string[]>();
for (const claim of claims) {
  const needle = `'${claim}'`;
  const hits = files.filter(
    (rel) => rel !== TRUST_MODULE && !isTest(rel) && (read.get(rel) ?? '').includes(needle),
  );
  consumers.set(claim, hits);
  if (hits.length === 0) {
    failures.push(
      `[claim] '${claim}' is declared in ${TRUST_MODULE} and asked by NO production file. ` +
        `A route nobody calls does not guard anything — that is pass-3 C-1 verbatim.`,
    );
  }
}

// ── 2 · every asked (claim, entity, field) triple is routed ──────────────────────────────────────
/**
 * ⚠️ Matched on the CALL, not on a line: both helpers take `(store, claim, entity, id?, ...fields)` with
 * the fields as trailing string literals, so a single regex over the argument list reads every triple.
 * A call whose claim or entity is not a literal is reported rather than skipped — an expression there
 * defeats the check, and a silent skip is how a gate starts reporting green while doing less.
 */
const CALL = /\b(rowFieldUnread|anyRowFieldUnread)\s*\(([^;]*?)\)\s*[;,)\]}\n]/g;
const routes = claimFields();
for (const rel of files) {
  if (rel === TRUST_MODULE) continue;
  const src = read.get(rel) ?? '';
  for (const m of src.matchAll(CALL)) {
    const fn = m[1];
    const args = m[2].split(',').map((a) => a.trim());
    // arg 0 is the store expression; the claim and entity follow.
    const [, claimArg, entityArg, ...rest] = args;
    const lit = (a: string | undefined) => (a && /^'[^']*'$/.test(a) ? a.slice(1, -1) : null);
    const claim = lit(claimArg);
    const entity = lit(entityArg);
    if (!claim || !entity) {
      failures.push(`[route] ${rel}: ${fn}(…) passes a non-literal claim or entity — the gate cannot read it`);
      continue;
    }
    if (!(claim in routes)) {
      failures.push(`[route] ${rel}: ${fn}(…) asks claim '${claim}', which is not a MoneyClaim`);
      continue;
    }
    // `rowFieldUnread` carries an id argument before the fields; `anyRowFieldUnread` does not.
    const fieldArgs = (fn === 'rowFieldUnread' ? rest.slice(1) : rest).map(lit).filter((f): f is string => !!f);
    const routed = routes[claim as keyof typeof routes][entity as keyof (typeof routes)[keyof typeof routes]];
    for (const field of fieldArgs) {
      if (!routed) {
        failures.push(
          `[route] ${rel}: '${claim}' routes nothing for entity '${entity}', so asking about '${field}' ` +
            `there can only ever answer "readable". Route it in trustSelectors, or ask the right claim.`,
        );
        continue;
      }
      if (routed !== 'any' && !routed.includes(field)) {
        failures.push(
          `[route] ${rel}: '${claim}' does not route '${entity}.${field}' — the call intersects to nothing ` +
            `and silently reports the figure as readable.`,
        );
      }
    }
  }
}

// ── 3 · the claim-site ledger ────────────────────────────────────────────────────────────────────
/**
 * ⛔ **THE POPULATION IS "READS AN ENTITY LIST **AND** PRINTS MONEY", and the precision is the point.**
 *
 * ⚠️ **The first cut of this check was `prints money AND mentions a repairable field name`, and it was
 * measured and thrown away**: it returned **16** files, most of them matching on the word *"balance"* in
 * JSX prose or on a local named `amount`. ⛔ A ledger whose rows mostly say *"false positive"* is worse
 * than no ledger — it reads as coverage and is a list of noise, which is `a-pass-that-cannot-fail` wearing
 * a green tick. The narrowed signal returns **7**, and every one is a real reader of the user's entities.
 *
 * ⚡ **And the narrowing is architectural, not a convenience.** The file that reads the raw list is the one
 * that must ask; a component handed `PaidOffDebt[]` or `BreakdownBill[]` is downstream of a guard that has
 * already sanitised its props — which is exactly how `C-4` was fixed (`selectPaidOffDebts` nulls the
 * figure and *"every render downstream then does the right thing for free"*).
 */
const PRINTS_MONEY = /\b(formatCurrency|formatWhole|formatMoney|formatCompactMoney)\s*\(/;
const READS_ENTITIES = /\.(debts|goals|requiredExpenses|livingExpenses)\b/;
// ⚠️ Referenced so a repairable field added to `migrations.ts` still reaches this file's reader; the
// routing completeness itself is `trustSelectors.test.ts`'s gate, and check 2 above is the call-site half.
void REPAIRABLE_MONEY_FIELDS;

/** States nothing back to the user as a fact about money it may not have read. Downward-only. */
const EXEMPT: Record<string, string> = {
  'apps/rn/src/components/entities/DebtSheet.tsx':
    'the FORM. Every figure on it is what the user is typing this instant, so it asserts nothing back',
};

/**
 * ⛔ **KNOWN-UNGUARDED CLAIM SITES, AND THEY ARE NOT EXEMPTIONS.** Counted separately and printed on the
 * green line **by name**, because a gate whose success sentence hides its own open list is the class this
 * whole cluster exists to end. A row leaves by being fixed; the cap only goes DOWN.
 */
const OPEN: Record<string, string> = {
  // ⚡ `apps/rn/src/widget/snapshot.ts` was here for pass-3 blocker `D3-1` and left the list by being FIXED
  // at S1.10.6.3 — the ledger reds on a stale row, so the removal was forced rather than remembered.
  // ⭐ **AND AT S1.10.6.9 THE LAST TWO LEFT AND THE LIST IS EMPTY.** `guardianSelectors.ts` carried
  // `G-1`…`G-5` and now asks `debtLiveness`; `AffordabilityCard.tsx` carried `G-4`'s render and now asks
  // `mayClaim(store, 'required-plan')`. ⛔ **Both removals were FORCED by this check, not remembered** — it
  // red on the stale rows the moment the fixes landed, which is the whole reason the ledger is exact in
  // both directions. ⚠️ An empty `OPEN` with `MAX_OPEN = 0` means a new unguarded claim site cannot be
  // parked here; it has to be fixed or argued into `EXEMPT`, whose own cap is also downward-only.
};
/**
 * ⛔ **LITERALS, and the first cut of this file had them as `Object.keys(X).length` — which made both caps
 * VACUOUS.** A cap derived from the list it caps can never be exceeded; the check read as a ratchet and was
 * a no-op. ⚡ Found by re-reading the gate while removing `D3-1`'s row from `OPEN`, not by any suite: it is
 * the same *"an instrument reporting green while doing less than it claims"* shape this whole cluster
 * exists to end, written into the instrument built to end it. ⚠️ Both numbers only ever go DOWN.
 */
const MAX_EXEMPT = 1;
const MAX_OPEN = 0;

/**
 * ⛔ **S1.11.2 [pass-4 D4-8] — A MENTION IS NOT A USE, AND MEMBERSHIP TURNED ON A MENTION.**
 *
 * The line was `if (src.includes('trustSelectors') || src.includes('dataRepairsCopy')) continue;` — so a
 * file that so much as **names** the module left the ledger population entirely, and nothing then asked
 * whether the money it prints is behind a call.
 *
 * ⚡ Measured on `widget/snapshot.ts`, `D3-1`'s own file, which holds **two** `mayClaim` calls. Comment out
 * **one** — the realistic regression — and the import is still used, the file still mentions the module,
 * and `lint:trust-claims` exits 0 printing *"⭐ 0 claim sites open — every money surface … asks the
 * guard."* ⛔ **That sentence is false while the plant is in**, and the widget can go back to saying
 * *"Debt-free · 100% · $0"* over balances the app returned `debt-free-unverified` about.
 * ⚠️ Deleting **both** calls and leaving only the `import` also exits 0 — `tested-helper-is-not-a-used-helper`.
 *
 * Membership now turns on an actual **call**. ⚠️ The file-level limit the docblock already declares stands
 * — a file that calls the guard can still ask the wrong question — but *called at all* is checkable, and
 * *mentioned* was not the property anyone meant.
 */
const ASKS_GUARD = /\b(mayClaim|rowFieldUnread|anyRowFieldUnread|describeRepair|repairBlocks|repairsA11yLabel)\s*\(/;

/** ⛔ Module scope — the distinction this finding is about, asserted rather than assumed. */
{
  const CASES: readonly (readonly [string, boolean, string])[] = [
    ["const ok = mayClaim(store, 'debt-balances');", true, 'a call is a use'],
    ['const u = rowFieldUnread(store, c, e, id, f);', true, 'the per-row helper is a use'],
    ["import { mayClaim } from '@/store/trustSelectors';", false, '⛔ D4-8 — an import is a MENTION'],
    ['// see trustSelectors for the rule', false, '⛔ D4-8 — a comment is a mention'],
    ['const x = trustSelectors;', false, 'naming the module is a mention'],
  ];
  for (const [line, want, why] of CASES) {
    if (ASKS_GUARD.test(line) !== want) {
      console.error(`\n❌ trust claims — its own ASKS_GUARD is wrong: ${why}\n   ${JSON.stringify(line)} → ${ASKS_GUARD.test(line)}, expected ${want}\n`);
      process.exit(1);
    }
  }
}

const unguarded: string[] = [];
/** ⛔ [C4-4] Every file the ledger CONSIDERED, guarded or not — the population, which was never counted. */
const population: string[] = [];
for (const rel of files) {
  if (isTest(rel) || rel === TRUST_MODULE) continue;
  const src = read.get(rel) ?? '';
  if (!PRINTS_MONEY.test(src) || !READS_ENTITIES.test(src)) continue;
  population.push(rel);
  if (ASKS_GUARD.test(src)) continue;
  unguarded.push(rel);
}

/**
 * ⛔ **S1.11.5.3 [pass-4 `C4-4`] — THE LEDGER COUNTED ITS EXCEPTIONS AND NEVER ITS POPULATION.**
 *
 * ⭐ **`C4-4`'s NAMED defect is already closed, and it was re-measured rather than read.** It reported the
 * escape as `src.includes('trustSelectors')` — *"a file escapes by IMPORTING the guard, not by asking
 * it"* — and `D4-8` had since replaced that with `ASKS_GUARD`, a call regex carrying its own module-scope
 * self-check. Re-ran the finding's plant 3 verbatim *(a new money surface using the sanctioned
 * `formatWhole`, importing `mayClaim` and never calling it)*: **the gate REDS**, naming the file.
 *
 * ⛔ **What measurement found instead is one level down, and it is this cluster's own class.** Neuter
 * `PRINTS_MONEY` — one identifier — and the population collapses to **zero**: no file is considered, no row
 * is unguarded, and the gate prints *"0 claim sites open"* over a tree it never looked at.
 * ⚠️ **Today that is caught only by COINCIDENCE**: `EXEMPT` holds one row, and the stale-row check reds
 * because that row stops qualifying. `MAX_EXEMPT` is downward-only and this file's own docblock argues
 * toward emptying both ledgers — **so the accident that saves it is the thing the gate is trying to
 * remove.** Measured both ways: neutered → `population 0`, reds; intact → 7, green.
 *
 * ⚠️ A floor, not an exact count — the number moves with every money screen added or removed, and an exact
 * figure would red permanently and train people to raise it without reading. What it catches is the
 * failure being guarded: total blinding takes it to ~0.
 */
const MIN_POPULATION = 6; // measured 2026-08-29: 7 files, the same 7 this file's own docblock records.
if (population.length < MIN_POPULATION) {
  failures.push(
    `[population] the ledger considered ${population.length} file(s) and the floor is ${MIN_POPULATION}. ` +
      'Either the money surface really shrank — lower the floor in the same edit, and say why — or ' +
      'PRINTS_MONEY / READS_ENTITIES stopped matching and this gate is reporting an empty tree as a clean one.',
  );
}

for (const rel of unguarded) {
  if (!(rel in EXEMPT) && !(rel in OPEN)) {
    failures.push(
      `[ledger] ${rel} reads the user's entity lists and prints money without asking trustSelectors. ` +
        `Ask the guard, or declare it in EXEMPT (it states nothing) or OPEN (it is a known defect, with its finding id).`,
    );
  }
}
for (const rel of [...Object.keys(EXEMPT), ...Object.keys(OPEN)]) {
  if (!unguarded.includes(rel)) {
    failures.push(
      `[ledger] ${rel} is declared here and no longer qualifies — it now asks the guard, stopped printing ` +
        `money, or moved. ⛔ Remove the row; a stale entry is how a list stops describing the tree.`,
    );
  }
}
if (Object.keys(EXEMPT).length > MAX_EXEMPT) {
  failures.push(`[ledger] MAX_EXEMPT is ${MAX_EXEMPT} and EXEMPT holds ${Object.keys(EXEMPT).length}. This cap only goes DOWN.`);
}
if (Object.keys(OPEN).length > MAX_OPEN) {
  failures.push(`[ledger] MAX_OPEN is ${MAX_OPEN} and OPEN holds ${Object.keys(OPEN).length}. This cap only goes DOWN.`);
}

// ── 4 · the LIVENESS ledger ──────────────────────────────────────────────────────────────────────
/**
 * ⛔ **S1.10.6.9 [`G-1`…`G-5`] — `balance > 0` IS *"IS THIS DEBT LIVE?"* ASKED OF THE ONE FIELD THE IMPORT
 * PATH REPAIRS TO `0`, AND FIVE SITES IN ONE FILE GOT IT WRONG IN THE SAME DIRECTION.**
 *
 * ⚡ `trustSelectors.debtLiveness` is now the owner, and the obvious gate — *ban the expression* — was
 * written, measured and thrown away: `git grep` returns **40+ occurrences**, and most are `packages/core`
 * amortization loops that are handed arrays, have no store, and are right to treat a `0` balance as paid.
 * ⛔ **An unsatisfiable rule is `B1` all over again**, which is the finding on this very page that says a
 * gate nobody can satisfy gets worked around rather than obeyed.
 *
 * ⚠️ **So the scope is where the question is even ASKABLE: `apps/rn/src`, where `DebtStore` and therefore
 * `pendingDataRepairs` are in reach.** `packages/core` is deliberately out — not overlooked. And the shape
 * is the same LEDGER as check 3 above rather than a ban: every site is named, the counts are exact in
 * **both** directions (a fixed site reds until its row goes, a new one reds on arrival), and the total only
 * ever goes DOWN.
 *
 * ⚠️ **A row here is NOT a verdict of "defect".** It is *"this site re-derives liveness and nobody has
 * measured whether it matters."* Seven of these ten files never mention the trust module at any line. What
 * this check buys is that the number is now on a screen instead of nowhere — when this class was last
 * counted by hand, the count was **two**, and the file the hand-count named held five.
 */
/**
 * ⛔ **S1.11.5.3 [pass-4 `C4-3`] — THE LEDGER READ ONE SPELLING OF A TWO-SIDED CONDITION.**
 *
 * ⚡ This was `balance > 0` alone, so `balance <= 0` — **the spelling `C4-2`'s blocker was written in** —
 * was invisible to the instrument built to make every re-derivation visible. Auditor C measured it on this
 * gate's own file list and scope: **14 ledgered sites, 13 unledgered**, across 9 files, **7 of which were
 * on the ledger at no spelling at all**. `celebrationSelectors.ts` was ledgered at *one* site while holding
 * *three* liveness tests.
 *
 * ⛔ **This file's own docblock argued that a BAN is unsatisfiable and a LEDGER is the answer — and then
 * built the ledger out of one member of the enumeration it had just warned about.** Reading rule 4
 * verbatim: *judge the condition the consumer evaluates, never the example the finding cited.* The
 * condition is *"is this debt live?"*, and `<= 0` asks it exactly as much as `> 0` does.
 *
 * ⚠️ **Projection points are NOT excluded mechanically, and that is deliberate.** `TrajectoryChart` and
 * friends test `p.balance <= 0` on a curve point, which is not repairable and is correctly out of scope —
 * but a receiver-name heuristic is a second rule to get wrong, and this ledger's contract is already that
 * *"a row is NOT a verdict of defect; it is `this site re-derives liveness and nobody has measured whether
 * it matters`"*. So they are rows, with that written into their `why`.
 */
const LIVENESS_RE = /\bbalance\s*(?:>=?|<=?|={2,3}|!={1,2})\s*0\b/;
const livenessCounts = new Map<string, number>();
for (const rel of files) {
  if (isTest(rel) || rel === TRUST_MODULE || !rel.startsWith('apps/rn/src/')) continue;
  const n = (read.get(rel) ?? '').split('\n').filter((l) => LIVENESS_RE.test(l)).length;
  if (n > 0) livenessCounts.set(rel, n);
}

/** file → how many re-derivations it holds, and what is known about them. ⛔ Counts are EXACT. */
const LIVENESS_OPEN: Record<string, { sites: number; why: string }> = {
  'apps/rn/src/store/analysisSelectors.ts': { sites: 1, why: 'the analysis debt basis; never mentions the trust module' },
  'apps/rn/src/store/balanceSelectors.ts': { sites: 2, why: 'the stale-estimate filters; never mentions the trust module' },
  'apps/rn/src/store/demoRun.ts': { sites: 1, why: 'the demo script; a seeded store carries no repairs, so this is very likely a non-defect — unmeasured' },
  'apps/rn/src/store/drift.ts': { sites: 1, why: '"has a plan" gate; never mentions the trust module' },
  'apps/rn/src/store/payoffCelebration.ts': { sites: 3, why: 'before/after arrays around a payoff; never mentions the trust module. ⛔ Ledgered at 2 and holding 3 until `C4-3` widened the condition — the third is `now.balance <= 0`, the CROSSING test itself, and the render is gated by `selectCelebration` (pass-2 `C3`)' },
  // ── ⛔ Surfaced by `C4-3`'s widening. Every row below was re-derived all along and invisible. ──
  'apps/rn/src/store/guardianSelectors.ts': { sites: 1, why: '`d.balance <= 0 || !isInstallmentNative(d)` — a SKIP in the BNPL installment walk, not a claim. A repaired-to-0 balance is skipped as already-clear; whether that under-reserves is unmeasured' },
  'apps/rn/src/store/payday.ts': { sites: 1, why: '`balance === 0 && !prior` — a snapshot suppressor for a debt that was already at zero, on the RAW value. Unmeasured against a repaired 0' },
  'apps/rn/src/store/recoverySelectors.ts': { sites: 1, why: '`d.balance <= 0` — a SKIP in the catch-up plan walk. Same shape as `guardianSelectors` above and equally unmeasured' },
  // ⚠️ PROJECTION POINTS, not store debts — `p.balance` on a computed curve, which is not repairable and is
  // correctly out of scope. Ledgered rather than excluded by a receiver-name heuristic: a second rule to get
  // wrong, over a ledger whose contract already says a row is not a verdict of defect.
  'apps/rn/src/components/payoff/TrajectoryChart.tsx': { sites: 4, why: 'PROJECTION POINTS (`p.balance <= 0` on a curve) — not repairable, out of scope, ledgered for visibility' },
  'apps/rn/src/components/payoff/compareStrategies.ts': { sites: 1, why: 'PROJECTION POINT — `points.find((p) => p.balance <= 0)`, the debt-free month off a computed curve' },
  'apps/rn/src/components/payoff/trajectoryDomain.ts': { sites: 1, why: 'PROJECTION POINT — the same find, one module over' },
  'apps/rn/src/store/payoffSelectors.ts': { sites: 1, why: 'the ranking basis; never mentions the trust module' },
  'apps/rn/src/store/planSelectors.ts': { sites: 2, why: 'asks the module at `selectPlanState`; these two sites are separate and unmeasured' },
  'apps/rn/src/store/sandboxScenarios.ts': { sites: 1, why: 'the tutorial sandbox; a synthetic store carries no repairs — unmeasured' },
  'apps/rn/src/widget/snapshot.ts': { sites: 1, why: 'asks the module at the payload gate (`D3-1`); whether THIS site is covered is unmeasured' },
};
/** ⛔ Downward-only, and a LITERAL — check 3's caps were once derived from their own lists and vacuous.
 *
 *  ⛔ **12 → 22, S1.11.5.3 [pass-4 `C4-3`], AND THIS IS THE ONE TIME IT GOES UP.** The cap's rule is
 *  downward-only and it is being raised, so the reason is written here rather than assumed: **the
 *  INSTRUMENT was widened, not the tree.** `LIVENESS_RE` read `balance > 0` alone and was blind to
 *  `<= 0` — the spelling `C4-2`'s blocker was written in — so ten of these sites existed all along and
 *  could not be seen. ⚠️ **No site was added by any commit; every one is a re-derivation this ledger was
 *  built to show and did not.** From here it is downward-only again, from 22.
 *
 *  ⭐ 13 → 12, S1.11.4.2 [pass-4 `C4-2`]: `celebrationSelectors.ts` no longer re-derives liveness at all.
 *  Its one ledgered site was the `balance > 0` inside `isLastLiveDebt`, and the row's own `why` said the
 *  coverage was **unmeasured** — measured now, and it was wrong: the helper answered *"clearing Amex makes
 *  you debt-free"* over a $12,000 balance the reader had lost. It asks `mayClaim` instead. ⚠️ The gate
 *  found this itself, on the green path, by noticing the ledger had gone stale. */
const MAX_LIVENESS_SITES = 22;

for (const [rel, n] of livenessCounts) {
  const row = LIVENESS_OPEN[rel];
  if (!row) {
    failures.push(
      `[liveness] ${rel} re-derives LIVENESS (${n} site(s): \`balance\` compared against 0) and is not on the ledger. ` +
        `Ask \`trustSelectors.debtLiveness\` / \`liveDebts\`, or add the row with what is known about it.`,
    );
  } else if (row.sites !== n) {
    failures.push(
      `[liveness] ${rel} is ledgered at ${row.sites} site(s) and holds ${n}. ⛔ Exact in BOTH directions — ` +
        `update the row (and ${row.sites > n ? 'lower' : 'do NOT raise'} MAX_LIVENESS_SITES).`,
    );
  }
}
for (const rel of Object.keys(LIVENESS_OPEN)) {
  if (!livenessCounts.has(rel)) {
    failures.push(`[liveness] ${rel} is ledgered and re-derives nothing any more. ⛔ Remove the row and lower MAX_LIVENESS_SITES.`);
  }
}
const livenessTotal = Object.values(LIVENESS_OPEN).reduce((s, r) => s + r.sites, 0);
if (livenessTotal > MAX_LIVENESS_SITES) {
  failures.push(`[liveness] MAX_LIVENESS_SITES is ${MAX_LIVENESS_SITES} and the ledger holds ${livenessTotal}. This cap only goes DOWN.`);
}

/**
 * ⛔ **S1.11.2 [pass-4 D4-8] — THE CONSUMER COUNT WAS PRINTED AND NEVER FLOORED.**
 *
 * Commenting out one of `widget/snapshot.ts`'s two `mayClaim` calls moved this line from
 * `debt-balances→2` to `debt-balances→1` — **the drop was visible in the green output** — and nothing
 * compared it to anything. A claim losing a caller now reds instead of being narrated.
 *
 * ⚠️ **EXACT in both directions**, the same shape check 4 uses. A new legitimate call site reds too, and
 * that is deliberate: raising a floor should be a decision someone writes down, not a number that drifts.
 */
const CLAIM_CONSUMER_FLOOR: Record<string, number> = {
  // ⛔ 3 at S1.11.4.2 [pass-4 C4-9]: progress.tsx joined them. The ring, the journey line, the debt-free
  // date and the chart headline all read figures derived from a balance the app may not have read, and the
  // screen's only trust check sat inside its `!hasDebts` empty-state branch — unreachable on the ordinary
  // mixed portfolio. Raised deliberately, with the caller named.
  'debt-balances': 3, // widget/snapshot.ts ×1 (the balance gate) + money.tsx + progress.tsx
  'goal-amounts': 1,
  'required-plan': 5,
  'row-figures': 5,
};
for (const claim of claims) {
  const actual = consumers.get(claim)!.length;
  const declared = CLAIM_CONSUMER_FLOOR[claim];
  if (declared === undefined) {
    failures.push(`[floor] '${claim}' has no entry in CLAIM_CONSUMER_FLOOR. Add it with the count this tree has.`);
  } else if (actual !== declared) {
    failures.push(
      `[floor] '${claim}' is asked by ${actual} production file(s), and CLAIM_CONSUMER_FLOOR declares ${declared}.\n` +
        `        ${actual < declared ? '⛔ A CALLER WAS LOST — this is the D4-8 regression: the count drops and the green line still says every surface asks the guard.' : 'A new caller appeared; raise the floor deliberately.'}\n` +
        `        Callers: ${consumers.get(claim)!.join(', ') || '(none)'}`,
    );
  }
}
for (const claim of Object.keys(CLAIM_CONSUMER_FLOOR)) {
  if (!claims.includes(claim)) failures.push(`[floor] CLAIM_CONSUMER_FLOOR names '${claim}', which is no longer a MoneyClaim. Remove the row.`);
}

if (failures.length > 0) {
  console.error(`\n❌ trust claims: ${failures.length} problem(s)\n`);
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  console.error('\nThe rule: never state a number about money the app could not read.');
  console.error('It has now been widened three times and missed a different direction each time.\n');
  process.exit(1);
}

const consumerCount = claims.map((c) => `${c}→${consumers.get(c)!.length}`).join(' · ');
console.log(
  `✅ trust claims: ${claims.length} claims all consumed in production (${consumerCount}); every asked field routed.`,
);
/**
 * ⛔ **THE SUCCESS LINE STATES WHAT IS STILL OPEN, BY NAME.** A gate whose green sentence hides its own
 * open list is the class this cluster exists to end — and `assert-the-honest-state-by-name` is the other
 * half: suppressing the "2 sites open" sentence at zero would leave the reader with no statement at all,
 * so zero is said out loud rather than skipped.
 */
console.log(
  Object.keys(OPEN).length === 0
    ? // ⚠️ S1.11.2 [D4-8] — SOFTENED TO WHAT IS MEASURED. The old wording claimed "every money surface
      // asks the guard", which this gate cannot establish: it checks that a money-printing file CALLS
      // the guard somewhere, not that the figure it prints is behind that call. The consumer floors
      // above are what make a lost caller red; this line states the weaker fact it can actually support.
      `   ⭐ 0 claim sites open — all ${population.length} money-printing files that read the user's entities call the guard (floor ${MIN_POPULATION}; per-claim callers floored).`
    : `   ⚠️ ${Object.keys(OPEN).length} claim site(s) still UNGUARDED and declared open — ${Object.keys(OPEN).join(', ')}`,
);
console.log(
  // ⛔ [C4-3] The line said "of `balance > 0`" — the one spelling — while claiming to count the class.
  // A success sentence that names a narrower thing than it measured is how the ledger read as complete.
  `   ⚠️ ${livenessTotal} liveness re-derivation(s) (\`balance\` compared against 0, either direction) across ${Object.keys(LIVENESS_OPEN).length} file(s), ` +
    `cap ${MAX_LIVENESS_SITES} — none measured against a repaired balance yet: ${Object.keys(LIVENESS_OPEN).join(', ')}`,
);
