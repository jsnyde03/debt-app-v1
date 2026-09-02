/* C1 pass-7 probe 4: PlanHero's SPLIT under `unreadPlanInputs`.
 * One store, one variable = whether a debt's minimumPayment is readable.
 * The four derived figures are computed with PlanHero.tsx:80,99,114-117 verbatim. */
import { runMigrations } from '@/data/migrations';
import { mayClaim } from '@/store/trustSelectors';
import { selectAllocation } from '@/store/selectors';
import { selectPlanSummary, selectRequiredRows } from '@/store/planSelectors';

function storeWith(minimumPayment: unknown) {
  const raw: any = {
    storeVersion: 12,
    paycheck: { amount: '2000', payCycle: 'biweekly', nextPaycheckDate: '2026-09-15', currentDate: '2026-09-02', semiMonthlyFirstDay: '1', semiMonthlySecondDay: '15', monthlyPayDay: '1', incomeVaries: false, leanAmount: 0, typicalAmount: 0 },
    payoffStrategy: 'snowball',
    debts: [
      { id: 'd1', name: 'Visa', balance: 3000, minimumPayment: 60, apr: 22, type: 'debt', recurrence: 'monthly', dueDate: '2026-09-10' },
      { id: 'd2', name: 'Car loan', balance: 18000, minimumPayment, apr: 6, type: 'debt', recurrence: 'monthly', dueDate: '2026-09-12' },
    ],
    requiredExpenses: [{ id: 'r1', name: 'Rent', amount: 400, dueDate: '2026-09-05', recurrence: 'monthly' }],
    livingExpenses: [],
    goals: [],
    cushionFloor: 200,
    subscriptionPlan: 'premium',
    prefs: { onboardingComplete: true },
  };
  return runMigrations(raw);
}

for (const [label, min] of [['A · minimumPayment READABLE (500)', 500], ['B · minimumPayment UNREADABLE ("--")', '--']] as const) {
  const s: any = storeWith(min);
  const alloc: any = selectAllocation(s);
  const rows: any = selectRequiredRows(s, alloc);
  const summary: any = selectPlanSummary(s, alloc, rows);
  const unreadPlanInputs = !mayClaim(s, 'required-plan');

  // PlanHero.tsx:80, 99, 114-117 — verbatim.
  const paycheck = summary.requiredTotal + summary.remainingAfterRequired;
  const required = Math.max(0, summary.requiredTotal - summary.shortfall);
  const everyday = Math.max(0, summary.everydayHeld);
  const billsReserve = Math.max(0, summary.billsReserve);
  const spokenFor = everyday + billsReserve;
  const free = Math.max(0, summary.remainingAfterRequired - spokenFor);

  // PlanHero.tsx:157-161 — what the card SAYS.
  const reassurance = unreadPlanInputs
    ? 'Something this paycheck has to cover could not be read, so I can’t tell you where the plan lands yet.'
    : summary.debtFreeDate
      ? `${summary.status} · debt-free by ${summary.debtFreeDate}`
      : summary.status;

  console.log(`\n======== ${label}`);
  console.log('  store.debts[1].minimumPayment =', s.debts[1].minimumPayment);
  console.log('  unreadPlanInputs (gate)       =', unreadPlanInputs);
  console.log('  HERO headline  (This paycheck)=', paycheck);
  console.log('  legend Required               =', required);
  console.log('  legend Spoken for             =', spokenFor);
  console.log('  legend FLEXIBLE  <-- printed  =', free);
  console.log('  status line (withheld or not) =', JSON.stringify(reassurance));
}
