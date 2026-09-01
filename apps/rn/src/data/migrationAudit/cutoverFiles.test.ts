import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { importDoor, webkitDoor } from '@/data/migrationAudit/doors';
import { checkAll } from '@/data/migrationAudit/invariants';

/**
 * 5.11 — the cutover backup files are ASSERTED, not just written.
 *
 * ⛔ These three files are what a device session is measured against, so a typo in one turns a real
 * migration failure into "the fixture was wrong" — or worse, the reverse. A hand-made test artifact
 * deciding what a check can see is this repo's most expensive recurring defect (`route-smoke` passing
 * 10/10 on a fixture with no bills; the e2e backup fixture that was a subset no user ever had).
 *
 * ⚠️ The figures asserted here are the SAME ones the device tick-list tells 🎯 to compare on the phone.
 * If they drift apart, this reds — which is the only reason they can be trusted on the far side.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
}

const DIR = join(__dirname, '..', '..', '..', '..', '..', 'docs', 'cutover');
const load = (name: string) => JSON.parse(readFileSync(join(DIR, name), 'utf8')) as Record<string, unknown>;

export default async function run() {
  // ── v16-populated: the seed file. It must survive BOTH doors with its exact figures. ─────────────
  {
    const blob = load('v16-populated.json');
    // v1.6's own `assertValidBackupShape` refuses a file whose array fields are not arrays — so the seed
    // is checked against v1.6's contract, not only against v1.7's reader.
    for (const field of ['requiredExpenses', 'livingExpenses', 'debts', 'goals', 'completedRecommendedActions']) {
      assert(Array.isArray(blob[field]), `v16-populated: ${field} is an array (v1.6 refuses otherwise)`);
    }
    assert(blob.version === 1 && typeof blob.exportedAt === 'string', 'v16-populated: carries v1.6 markers');

    const viaFile = importDoor(blob);
    const viaKeys = await webkitDoor(blob);
    assert(viaFile.store !== null, 'v16-populated migrates through the import door');
    assert(viaKeys.store !== null, 'v16-populated migrates through the WebKit door');
    assert([...checkAll(viaFile), ...checkAll(viaKeys)].length === 0, 'v16-populated: no invariant violations');

    const s = viaFile.store!;
    // ⭐ THE FIGURES ON THE TICK-LIST. Deliberately distinct values — a portfolio of round numbers cannot
    // tell a successful migration from a default.
    assert(s.paycheck.amount === '3247', 'income lands as 3247');
    assert(s.paycheck.payCycle === 'biweekly', 'pay cycle lands as biweekly');
    assert(s.debts.length === 3, '3 debts land');
    assert(s.debts.find((d) => d.name === 'Car loan')?.balance === 11380, 'the car loan lands at 11380');
    assert(s.requiredExpenses.length === 4, '4 bills land');
    assert(s.requiredExpenses.find((e) => e.name === 'Rent')?.amount === 1465, '…the rent lands at 1465');
    assert(s.livingExpenses.length === 2, '2 living expenses land');

    // ⛔ FIELD VALUES, not counts — this is the assertion that was missing. 🎯 found the goal rendering as
    // `undefined` on a real device while `goals.length === 1` passed happily: an array with one element
    // satisfies a count while every field inside it is wrong. Three shapes in this fixture were invented
    // rather than read, and a count could not see any of them.
    const goal = s.goals[0];
    assert(goal?.name === 'Emergency fund', 'the goal lands with its name');
    assert(goal?.targetAmount === 1500, '⛔ …and `targetAmount` — NOT an invented `target`');
    assert(goal?.currentAmount === 385, '⛔ …and `currentAmount` — NOT an invented `saved`');
    assert(goal?.type === 'emergency', '…and its type');

    // The other two shapes the same mistake reached, now pinned so they cannot silently regress.
    assert(s.livingExpenses.every((e) => typeof e.enabled === 'boolean'), 'every living expense carries `enabled`');
    assert(s.cycleHistory.length === 2, '2 cycle snapshots land');
    assert(
      typeof s.cycleHistory[0]?.cycleEndDate === 'string' && typeof s.cycleHistory[0]?.totalPaidThisCycle === 'number',
      '…in the real `PayCycleSnapshot` shape, not an invented one',
    );
    assert(s.dataRepairs.length === 0, 'a HEALTHY file reports zero repairs');

    // ⛔ FOUND ON A REAL DEVICE (🎯): importing a v1.6 backup landed the user in ONBOARDING with the data
    // imported but invisible behind the route guard. v1.6's `buildBackupData()` never emitted
    // `hasCompletedOnboarding`, so a genuine backup file cannot carry it — it is not a fixture gap.
    assert(
      s.prefs.onboardingComplete === true,
      '⛔ a restored portfolio does NOT drop the user into onboarding',
    );
    assert(JSON.stringify(viaFile.store) === JSON.stringify(viaKeys.store), 'both doors agree on the seed file');
  }

  // ── v16-damaged: the file that must produce a VISIBLE repair report on the device. ───────────────
  {
    const blob = load('v16-damaged.json');
    const viaFile = importDoor(blob);
    assert(viaFile.store !== null, 'v16-damaged still migrates (a bad field costs a field, not a portfolio)');
    assert(checkAll(viaFile).length === 0, 'v16-damaged: no invariant violations');
    const s = viaFile.store!;
    assert(s.debts.length === 3, '…all 3 debts are KEPT');
    // ⚠️ THREE repairs from TWO damaged fields, and the third is correct rather than a miscount.
    // `withBackfilledOriginalBalance` (5.2, ported from v1.5) copies `balance` into `originalBalance`
    // when the latter is absent — so an unreadable balance propagates before the repair runs, and both
    // land at 0 and are both reported. Asserted on CONTENT rather than on a count, because the count is
    // a consequence of a backfill order that could legitimately change.
    assert(
      s.dataRepairs.some((r) => r.name === 'Visa' && r.field === 'balance'),
      '⛔ the unreadable debt balance is reported, naming the debt',
    );
    assert(
      s.dataRepairs.some((r) => r.name === 'Electric' && r.field === 'amount'),
      '⛔ …and so is the unreadable bill amount',
    );
    assert(
      s.debts.find((d) => d.name === 'Visa')?.balance === 0,
      '…the unreadable value lands at 0 rather than staying null',
    );
    assert(
      s.debts.find((d) => d.name === 'Car loan')?.balance === 11380,
      '⭐ …and the UNDAMAGED debts are untouched — one bad field costs a field, not a portfolio',
    );
  }

  // ── v17-envelope: the round-trip file for the new build. ─────────────────────────────────────────
  {
    const blob = load('v17-envelope.json');
    const viaFile = importDoor(blob);
    assert(viaFile.store !== null, 'v17-envelope imports');
    assert(checkAll(viaFile).length === 0, 'v17-envelope: no invariant violations');
    assert(viaFile.store!.paycheck.amount === '3247', '…carrying the same income as the v1.6 seed');

    /**
     * ⛔ **S1.13.7.8 [pass-6 `D2-10`] — THE COMMITTED BYTES CARRY EVERY FIELD, NOT JUST THREE.**
     *
     * The three assertions above are the whole of this block, and none of them is field coverage — so
     * `cycleHistory` was missing for as long as nobody looked (`D5-14`), and `completedRecommendedActions`
     * and `lastSavedAt` were still missing after that fix reached only the field it named.
     *
     * ⚡ **This is a DIFFERENT failure from the generator's own check**, which is why both exist:
     * `make-cutover-backups.ts` refuses to WRITE a short envelope, and this refuses a committed file that
     * was never regenerated after the generator was fixed. A generator-only check is green over stale
     * bytes, and the bytes are what the device session actually reads.
     *
     * ⚠️ Asserted against the v1.6 SEED's own keys rather than against `createDefaultStore()`. A backup
     * payload is legitimately a subset of a live store — `D2-10` itself flagged that as a judgement about
     * the format rather than a defect — but every field the v1.6 portfolio HAS must survive the move, and
     * the paycheck block is where most of them land.
     */
    const seed = load('v16-populated.json');
    const store = (blob as { store: Record<string, unknown> }).store;
    const paycheck = store.paycheck as Record<string, unknown>;
    const NOT_IN_V17 = new Set([
      'version', 'exportedAt', 'amount', 'payCycle', 'currentDate', 'nextPaycheckDate',
      'semiMonthlyFirstDay', 'semiMonthlySecondDay', 'monthlyPayDay',
    ]);
    for (const field of Object.keys(seed)) {
      if (NOT_IN_V17.has(field)) continue;
      assert(field in store || field in paycheck, `v17-envelope carries the v1.6 field \`${field}\``);
    }
    assert(Array.isArray(store.completedRecommendedActions), '⛔ D2-10 — including completedRecommendedActions, which the v1.6 block already asserts is an array');
    assert(typeof store.lastSavedAt === 'string', '⛔ D2-10 — and lastSavedAt, its sibling in the same omission');
  }

  console.log(`✅ 5.11 cutover backup files verified (${passed} asserts).`);
}
