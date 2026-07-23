/**
 * Unit tests for the §2.3 valley-into-forecast rule (2.4.7.2). Pure + tsx-runnable (the helper imports
 * only the PaycheckConfig type). Run: `npx tsx apps/rn/src/store/projectedIncome.test.ts`.
 */
import type { PaycheckConfig } from '@/data/models';

import { projectedIncome } from './projectedIncome';

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}`);
  }
}

const PC = (over: Partial<PaycheckConfig>): PaycheckConfig => ({
  amount: '2000',
  payCycle: 'biweekly',
  nextPaycheckDate: '2026-08-06',
  currentDate: '2026-07-23',
  semiMonthlyFirstDay: '1',
  semiMonthlySecondDay: '15',
  monthlyPayDay: '1',
  incomeVaries: false,
  leanAmount: 0,
  typicalAmount: 0,
  ...over,
});

console.log('Running valley-into-forecast (2.4.7.2) tests...');

check('fixed income → the entered amount', projectedIncome(PC({ incomeVaries: false, amount: '2000' })) === 2000);
check('variable + lean set → the LEAN (the valley reaches the forecast)', projectedIncome(PC({ incomeVaries: true, amount: '2000', leanAmount: 1400 })) === 1400);
check('variable + no lean yet → falls back to the entered amount (never projects $0)', projectedIncome(PC({ incomeVaries: true, amount: '2000', leanAmount: 0 })) === 2000);
check('fixed income ignores a stray leanAmount', projectedIncome(PC({ incomeVaries: false, amount: '2000', leanAmount: 1400 })) === 2000);
check('non-numeric amount → 0 (guarded)', projectedIncome(PC({ incomeVaries: false, amount: 'abc' })) === 0);

if (failures > 0) {
  console.error(`\n❌ ${failures} valley-into-forecast test(s) failed.`);
  process.exit(1);
}
console.log('✅ valley-into-forecast (2.4.7.2) tests passed.');
