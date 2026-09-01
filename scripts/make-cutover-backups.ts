/**
 * 5.11 — generate the backup files for the cutover device session.
 *
 * ⛔ The v1.6 file is the load-bearing one, and not for the reason it looks like. v1.6 ships
 * `readBackupFile`, so THAT file is how a test phone gets a realistic portfolio in seconds instead of
 * someone typing one in — and a hand-typed portfolio is how a cutover test quietly ends up exercising
 * three debts and no history. It seeds the source; the migration is what is being tested.
 *
 * Every figure is deliberately DISTINCT and memorable, because the check on the far side is "does this
 * match" rather than "does this look plausible". A portfolio of round numbers cannot tell a successful
 * migration from a default.
 *
 * ⛔ **EVERY FIELD NAME HERE IS READ FROM `origin/v1.6-dev:lib/storage/debtPlannerStorage.ts` AND
 * `lib/types/livingExpense.ts`, NEVER INVENTED.** The first cut invented three of them — `goals` used
 * `target`/`saved` instead of `targetAmount`/`currentAmount`/`type`, `cycleHistory` invented four fields
 * of `PayCycleSnapshot`, and `livingExpenses` omitted the required `enabled`. 🎯 found the first on a real
 * device, where the goal rendered as a row of `undefined`.
 *
 * ⚡ **The tests did not catch it because they asserted `goals.length === 1` — a COUNT.** An array with one
 * element passes that while every field inside it is wrong. This is the same defect class the audit itself
 * documents (*"asserting a field equals the default proves nothing"*), committed in the fixture written to
 * verify the audit. The assertions in `cutoverFiles.test.ts` now check field VALUES.
 *
 * Usage: npx tsx scripts/make-cutover-backups.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(import.meta.dirname, '..', 'docs', 'cutover');
mkdirSync(OUT, { recursive: true });

/** Shape matches `origin/v1.6-dev`'s `buildBackupData()` exactly — v1.6 refuses anything else. */
function v16Populated() {
  return {
    version: 1,
    exportedAt: '2026-08-19T12:00:00.000Z',
    amount: '3247',
    payCycle: 'biweekly',
    semiMonthlyFirstDay: 1,
    semiMonthlySecondDay: 15,
    monthlyPayDay: 1,
    currentDate: '2026-08-19',
    nextPaycheckDate: '2026-08-28',
    requiredExpenses: [
      { id: 'ce-rent', name: 'Rent', amount: 1465, dueDate: '2026-09-01', recurrence: 'monthly', category: 'housing' },
      { id: 'ce-power', name: 'Electric', amount: 138, dueDate: '2026-09-08', recurrence: 'monthly', category: 'utilities' },
      { id: 'ce-phone', name: 'Phone', amount: 71, dueDate: '2026-09-12', recurrence: 'monthly', category: 'utilities' },
      { id: 'ce-ins', name: 'Car insurance', amount: 592, dueDate: '2026-11-02', recurrence: 'quarterly', category: 'insurance' },
    ],
    // ⛔ `enabled` is REQUIRED (`origin/v1.6-dev:lib/types/livingExpense.ts`) — omitting it was one of the
    // three shapes this file invented rather than read. See the header note.
    livingExpenses: [
      { id: 'cl-food', name: 'Groceries', amount: 483, enabled: true },
      { id: 'cl-gas', name: 'Fuel', amount: 176, enabled: true },
    ],
    debts: [
      { id: 'cd-visa', name: 'Visa', balance: 4271, minimumPayment: 96, apr: 22.74, dueDate: '2026-09-04', type: 'debt', recurrence: 'monthly', isAutopay: false, isPaidThisCycle: false, minimumPaidThisCycle: false },
      { id: 'cd-car', name: 'Car loan', balance: 11380, minimumPayment: 327, apr: 6.49, dueDate: '2026-09-15', type: 'debt', recurrence: 'monthly', isAutopay: true, isPaidThisCycle: false, minimumPaidThisCycle: false },
      { id: 'cd-med', name: 'Dental', balance: 843, minimumPayment: 75, apr: 0, dueDate: '2026-09-20', type: 'debt', recurrence: 'monthly', isAutopay: false, isPaidThisCycle: false, minimumPaidThisCycle: false },
    ],
    // ⛔ `targetAmount`/`currentAmount`/`type` — NOT `target`/`saved`. 🎯 caught this on a real device:
    // the goal imported as a row of `undefined`, because an array with one element satisfies a
    // length assertion while every field inside it is wrong.
    goals: [{ id: 'cg-ef', name: 'Emergency fund', targetAmount: 1500, currentAmount: 385, type: 'emergency' }],
    completedRecommendedActions: [],
    payoffStrategy: 'avalanche',
    lastSavedAt: '2026-08-19T11:58:00.000Z',
    // ⛔ `PayCycleSnapshot` = `cycleEndDate`/`totalDebtBalance`/`totalPaidThisCycle` — the third invented
    // shape, and the one nobody had reached yet. It would have broken History the same silent way.
    cycleHistory: [
      { cycleEndDate: '2026-07-30', totalDebtBalance: 17284, totalPaidThisCycle: 498, allRequiredMet: true },
      { cycleEndDate: '2026-08-13', totalDebtBalance: 16761, totalPaidThisCycle: 523, allRequiredMet: true },
    ],
  };
}

/**
 * The SAME portfolio with the defect 5.10 measured: v1.6's onboarding let `Number("12,000")` through as
 * NaN, which `JSON` persists as `null`. This file is what a real affected user's data looks like, and it
 * is the only way to see the repair report render on a device.
 */
function v16Damaged() {
  const base = v16Populated();
  base.debts[0].balance = null as unknown as number; // typed "4,271" during onboarding
  base.requiredExpenses[1].amount = null as unknown as number;
  return base;
}

/** A v1.7 envelope, for the export→import round trip on the new build. */
function v17Envelope() {
  const v16 = v16Populated();
  return {
    format: 'debt-planner-backup',
    formatVersion: 1,
    app: 'Debt Planner',
    exportedAt: '2026-08-19T12:00:00.000Z',
    storeVersion: 7,
    store: {
      storeVersion: 7,
      paycheck: {
        amount: v16.amount,
        payCycle: v16.payCycle,
        currentDate: v16.currentDate,
        nextPaycheckDate: v16.nextPaycheckDate,
        semiMonthlyFirstDay: String(v16.semiMonthlyFirstDay),
        semiMonthlySecondDay: String(v16.semiMonthlySecondDay),
        monthlyPayDay: String(v16.monthlyPayDay),
      },
      payoffStrategy: v16.payoffStrategy,
      debts: v16.debts,
      requiredExpenses: v16.requiredExpenses,
      livingExpenses: v16.livingExpenses,
      goals: v16.goals,
      /**
       * ⛔ **S1.12.5.8 [pass-5 `D5-14`] — THE ENVELOPE CARRIED NO CYCLE HISTORY, WHICH ITS OWN HEADER
       * NAMES AS THE HAZARD.** Measured: `grep -c cycleHistory` was **1** in `v16-populated.json` and
       * **0** here. `v17Envelope()` copies fields off `v16Populated()` one at a time, so a field added to
       * the v1.6 fixture does not reach the v1.7 one — and the cutover fixtures exist precisely to prove
       * a real user's data survives the v1.6 → v1.7 move. A fixture missing the field is a fixture that
       * cannot fail on it.
       */
      cycleHistory: v16.cycleHistory,
      /**
       * ⛔ **S1.13.7.8 [pass-6 `D2-10`] — `D5-14`'s FIX REACHED `cycleHistory` AND LEFT ITS SIBLINGS.**
       *
       * The docblock above states the class exactly — *"copies fields off `v16Populated()` one at a time,
       * so a field added to the v1.6 fixture does not reach the v1.7 one"* — and then fixed the one member
       * that had been reported. Measured on the committed fixtures, `completedRecommendedActions` and
       * `lastSavedAt` reached **neither** `store` nor `store.paycheck`, while the v1.6 block of
       * `cutoverFiles.test.ts` asserts the first IS an array. Two fixtures disagreeing about whether a
       * field matters.
       *
       * ⚡ Both are real `DebtStore` fields (`defaults.ts:41`, `:68`). The envelope is what a device
       * session proves a real portfolio survives on, and a field missing from it is a field the round
       * trip cannot fail on.
       */
      completedRecommendedActions: v16.completedRecommendedActions,
      lastSavedAt: v16.lastSavedAt,
      prefs: { onboardingComplete: true },
    },
  };
}

/**
 * ⛔ **S1.13.7.8 [pass-6 `D2-10`] — EVERY v1.6 FIELD IS CARRIED OR WRITTEN OFF, CHECKED AT GENERATION.**
 *
 * ⚡ **Asking mechanically is the point.** `D5-14` named this class in prose and fixed one member; adding
 * two more by hand would be the same shape again, two fields further along. For every key
 * `v16Populated()` produces: is it in the v1.7 `store`, in its `paycheck` block, or named below? A field
 * added to the v1.6 fixture **fails this script** until somebody answers.
 *
 * ⚠️ It runs at GENERATION rather than as a test assertion, deliberately: the failure being guarded is
 * writing a fixture that is quietly short, and the cheapest place to refuse that is before the bytes are
 * written. `cutoverFiles.test.ts` then asserts what the file CONTAINS.
 */
const V16_FIELDS_NOT_IN_V17: Record<string, string> = {
  version: 'the v1.6 envelope format number; the v1.7 envelope carries `formatVersion` + `storeVersion`',
  exportedAt: 'an envelope field in both formats, set at the top level here rather than inside `store`',
  amount: 'moves into `store.paycheck.amount` — asserted by the v17 block of cutoverFiles.test.ts',
  payCycle: 'moves into `store.paycheck.payCycle`',
  currentDate: 'moves into `store.paycheck.currentDate`',
  nextPaycheckDate: 'moves into `store.paycheck.nextPaycheckDate`',
  semiMonthlyFirstDay: 'moves into `store.paycheck`, stringified — v1.7 holds these as strings',
  semiMonthlySecondDay: 'moves into `store.paycheck`, stringified',
  monthlyPayDay: 'moves into `store.paycheck`, stringified',
};

function die(lines: string[]): never {
  console.error('');
  for (const line of lines) console.error(line);
  console.error('');
  process.exit(1);
}

function assertEveryV16FieldAccountedFor(): void {
  const v16 = v16Populated() as unknown as Record<string, unknown>;
  const envelope = v17Envelope();
  const store = envelope.store as unknown as Record<string, unknown>;
  const paycheck = store.paycheck as Record<string, unknown>;

  const missing = Object.keys(v16).filter(
    (key) => !(key in store) && !(key in paycheck) && !(key in V16_FIELDS_NOT_IN_V17),
  );
  if (missing.length > 0) {
    die([
      `❌ make-cutover-backups: ${missing.length} v1.6 field(s) reach neither the v1.7 envelope nor V16_FIELDS_NOT_IN_V17:`,
      ...missing.map((m) => `     ${m}`),
      '',
      '  [D2-10] The envelope is built field by field, so a field added to the v1.6 fixture does not reach',
      '  the v1.7 one and the round trip cannot fail on it. Carry it, or write down why it does not travel.',
    ]);
  }

  // ⚠️ The other direction: a write-off describing nothing is slack the next omission hides in — the same
  // rule `check-amount-collapse`'s ALLOWED map carries.
  const stale = Object.keys(V16_FIELDS_NOT_IN_V17).filter((key) => !(key in v16));
  if (stale.length > 0) {
    die([
      `❌ make-cutover-backups: V16_FIELDS_NOT_IN_V17 names ${stale.length} field(s) the v1.6 fixture no longer has:`,
      ...stale.map((m) => `     ${m}`),
    ]);
  }
}

assertEveryV16FieldAccountedFor();

const files: [string, unknown][] = [
  ['v16-populated.json', v16Populated()],
  ['v16-damaged.json', v16Damaged()],
  ['v17-envelope.json', v17Envelope()],
];

for (const [name, value] of files) {
  writeFileSync(join(OUT, name), JSON.stringify(value, null, 2) + '\n');
  console.log(`  wrote docs/cutover/${name}`);
}
