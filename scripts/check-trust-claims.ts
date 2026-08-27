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
const isTest = (rel: string) => /\.test\.tsx?$/.test(rel) || rel.startsWith('apps/rn/tests/');
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
  'apps/rn/src/store/guardianSelectors.ts':
    'S1.10.6.2 after-scan — `selectCalibrationScore` splits the regime on `balance > 0` and `selectReserveRelease` names "your savings" off the same test, so a repaired balance reclassifies both. Filed, not yet reproduced',
  'apps/rn/src/components/plan/AffordabilityCard.tsx':
    'S1.10.6.2 after-scan — the cover-from-savings flow reads `goal.currentAmount` directly and prices a purchase against it. Filed, not yet reproduced',
};
/**
 * ⛔ **LITERALS, and the first cut of this file had them as `Object.keys(X).length` — which made both caps
 * VACUOUS.** A cap derived from the list it caps can never be exceeded; the check read as a ratchet and was
 * a no-op. ⚡ Found by re-reading the gate while removing `D3-1`'s row from `OPEN`, not by any suite: it is
 * the same *"an instrument reporting green while doing less than it claims"* shape this whole cluster
 * exists to end, written into the instrument built to end it. ⚠️ Both numbers only ever go DOWN.
 */
const MAX_EXEMPT = 1;
const MAX_OPEN = 2;

const unguarded: string[] = [];
for (const rel of files) {
  if (isTest(rel) || rel === TRUST_MODULE) continue;
  const src = read.get(rel) ?? '';
  if (!PRINTS_MONEY.test(src) || !READS_ENTITIES.test(src)) continue;
  if (src.includes('trustSelectors') || src.includes('dataRepairsCopy')) continue;
  unguarded.push(rel);
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
console.log(
  `   ⚠️ ${Object.keys(OPEN).length} claim site(s) still UNGUARDED and declared open — ${Object.keys(OPEN).join(', ')}`,
);
