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
    livingExpenses: [
      { id: 'cl-food', name: 'Groceries', amount: 483 },
      { id: 'cl-gas', name: 'Fuel', amount: 176 },
    ],
    debts: [
      { id: 'cd-visa', name: 'Visa', balance: 4271, minimumPayment: 96, apr: 22.74, dueDate: '2026-09-04', type: 'debt', recurrence: 'monthly', isAutopay: false, isPaidThisCycle: false, minimumPaidThisCycle: false },
      { id: 'cd-car', name: 'Car loan', balance: 11380, minimumPayment: 327, apr: 6.49, dueDate: '2026-09-15', type: 'debt', recurrence: 'monthly', isAutopay: true, isPaidThisCycle: false, minimumPaidThisCycle: false },
      { id: 'cd-med', name: 'Dental', balance: 843, minimumPayment: 75, apr: 0, dueDate: '2026-09-20', type: 'debt', recurrence: 'monthly', isAutopay: false, isPaidThisCycle: false, minimumPaidThisCycle: false },
    ],
    goals: [{ id: 'cg-ef', name: 'Emergency fund', target: 1500, saved: 385 }],
    completedRecommendedActions: [],
    payoffStrategy: 'avalanche',
    lastSavedAt: '2026-08-19T11:58:00.000Z',
    cycleHistory: [
      { cycleStart: '2026-07-17', cycleEnd: '2026-07-30', income: 3247, totalPaid: 498 },
      { cycleStart: '2026-07-31', cycleEnd: '2026-08-13', income: 3247, totalPaid: 523 },
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
      prefs: { onboardingComplete: true },
    },
  };
}

const files: [string, unknown][] = [
  ['v16-populated.json', v16Populated()],
  ['v16-damaged.json', v16Damaged()],
  ['v17-envelope.json', v17Envelope()],
];

for (const [name, value] of files) {
  writeFileSync(join(OUT, name), JSON.stringify(value, null, 2) + '\n');
  console.log(`  wrote docs/cutover/${name}`);
}
