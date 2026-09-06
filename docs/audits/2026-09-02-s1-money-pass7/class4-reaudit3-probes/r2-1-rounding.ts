/**
 * R3 probe — attack the ROUNDING in R2-1's fix.
 *   const reserved = Math.min(effectiveMinimumInWindow(d, start, end), d.balance);
 *   const count    = Math.round(reserved / each);
 * effectiveMinimumInWindow already caps at the balance, so a balance that is not a whole
 * multiple of `each` makes `reserved / each` fractional and Math.round guesses.
 */
import { createDefaultStore } from '@/data/defaults';
import type { Debt, DebtStore } from '@/data/models';
import { effectiveMinimumInWindow } from '@core/debt/bnplInstallment';
import { selectBnplBetweenPaycheck } from '@/store/guardianSelectors';

const CURRENT = '2026-08-03';
const NEXT = '2026-08-31';
const DUE = '2026-08-06';
const EACH = 50;

const weeklyDebt = (over: Partial<Debt> = {}): Debt =>
  ({
    id: 'd1', name: 'Car Loan', balance: 5000, minimumPayment: EACH, apr: 10,
    dueDate: DUE, type: 'debt', recurrence: 'weekly', ...over,
  }) as unknown as Debt;

function storeWith(debt: Debt): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    paycheck: { ...s.paycheck, amount: '3000', payCycle: 'monthly', currentDate: CURRENT, nextPaycheckDate: NEXT },
    debts: [debt], requiredExpenses: [], livingExpenses: [], goals: [],
    prefs: { ...s.prefs, onboardingComplete: true },
  } as DebtStore;
}

console.log('balance | reserved(=what the app holds back) | count stated | $ stated | over/under | line');
let overstated = 0;
for (const balance of [1, 20, 49, 50, 60, 74, 75, 76, 99, 100, 110, 124, 125, 126, 149, 150, 174, 175, 200]) {
  const d = weeklyDebt({ balance });
  const reserved = Math.min(effectiveMinimumInWindow(d, CURRENT, NEXT), balance);
  const line = selectBnplBetweenPaycheck(storeWith(d));
  const m = line?.match(/— (\d+) /);
  const stated = m ? Number(m[1]) * EACH : 0;
  const delta = stated - reserved;
  if (delta > 0) overstated++;
  console.log(
    `$${String(balance).padStart(4)} | $${String(reserved).padStart(6)} | ${m ? m[1] : '-'} | $${String(stated).padStart(4)} | ` +
      `${delta > 0 ? `OVER +$${delta}` : delta < 0 ? `under -$${-delta}` : 'exact'} | ${line ?? 'null'}`,
  );
}
console.log(`\nrows overstating the reserve: ${overstated}`);
