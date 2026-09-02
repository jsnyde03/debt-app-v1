/* C1 pass-7 probe 6: what "your line" is, on ONE store, according to each producer.
 * ONE variable = whether `cushionFloor` is readable. */
import { runMigrations } from '@/data/migrations';
import { selectPaydayGuardian, selectAffordability } from '@/store/guardianSelectors';
import { effectivePaycheckBuffer } from '@/store/selectors';
import { withProjectedBalances } from '@/store/balanceSelectors';

function store(cushionFloor: unknown, plan: 'premium' | 'free' = 'premium') {
  const raw: any = {
    storeVersion: 12,
    paycheck: { amount: '2000', payCycle: 'biweekly', nextPaycheckDate: '2026-09-15', currentDate: '2026-09-02', semiMonthlyFirstDay: '1', semiMonthlySecondDay: '15', monthlyPayDay: '1', incomeVaries: false, leanAmount: 0, typicalAmount: 0 },
    payoffStrategy: 'snowball',
    debts: [{ id: 'd1', name: 'Visa', balance: 3000, minimumPayment: 60, apr: 22, type: 'debt', recurrence: 'monthly', dueDate: '2026-09-10' }],
    requiredExpenses: [{ id: 'r1', name: 'Rent', amount: 900, dueDate: '2026-09-05', recurrence: 'monthly' }],
    livingExpenses: [], goals: [], cushionFloor, subscriptionPlan: plan, prefs: { onboardingComplete: true },
  };
  return runMigrations(raw);
}

for (const [label, floorRaw] of [['A · cushionFloor READABLE (350)', 350], ['B · cushionFloor UNREADABLE ("abc")', 'abc']] as const) {
  const s: any = store(floorRaw);
  const brief: any = selectPaydayGuardian(s);
  const eng: any = withProjectedBalances(s, true);
  const aff: any = selectAffordability(eng, 100);
  console.log(`\n======== ${label}`);
  console.log('  store.cushionFloor                                   =', s.cushionFloor);
  console.log('  PaydayGuardianCard  "$X · Your line"  (brief.floor)  =', brief ? brief.floor : '(null)');
  console.log('  CashRunwayChart     "your $X line"    (effectivePaycheckBuffer) =', effectivePaycheckBuffer(s));
  console.log('  AffordabilityCard   "below your $X line" (result.floor)         =', aff ? aff.floor : '(null)');
}

/* The free-tier control for GuardianScorecard\'s "I’ve set your line aside on every paycheck since
 * the first one" — what the plan ACTUALLY reserved while the user was free. */
const freeS: any = store(350, 'free');
console.log('\n======== CONTROL · the SAME $350 line, on the FREE tier');
console.log('  store.cushionFloor                    =', freeS.cushionFloor);
console.log('  effectivePaycheckBuffer (what is set aside) =', effectivePaycheckBuffer(freeS));
