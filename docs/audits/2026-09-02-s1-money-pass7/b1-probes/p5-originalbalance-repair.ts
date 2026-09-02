/* B1 probe 5 — can an `originalBalance` repair on a CLEARED debt ever be answered?
   Drives the real wired zustand store (createDebtStore), so `clearResuppliedRepairs` runs in the set wrapper. */
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { createDebtStore } from '@/store/store';
import { mayClaim, unreadFieldsFor, answerableByEdit, clearResuppliedRepairs } from '@/store/trustSelectors';
import { selectPaidOffDebts, selectCelebrationStats } from '@/store/celebrationSelectors';

const s0 = createDefaultStore();
const repair = { entity: 'debt' as const, id: 'chase', name: 'Chase', field: 'originalBalance', kind: 'lost' as const };
function seed(): DebtStore {
  return {
    ...s0,
    paycheck: { ...s0.paycheck, amount: '2000', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    // Chase is GENUINELY paid off (balance 0, and the balance was read fine); only its ORIGINAL was lost.
    debts: [
      { id: 'chase', name: 'Chase', balance: 0, originalBalance: 0, minimumPayment: 0, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', lastVerifiedDate: '2026-07-01' },
      { id: 'amex', name: 'Amex', balance: 4000, originalBalance: 6000, minimumPayment: 80, apr: 18, dueDate: '2026-08-12', type: 'debt', recurrence: 'monthly' },
    ],
    pendingDataRepairs: [repair],
    prefs: { ...s0.prefs, onboardingComplete: true },
  } as unknown as DebtStore;
}

const st = createDebtStore();
st.setState({ store: seed() });
const g = () => st.getState().store;
const report = (label: string) => {
  const s = g();
  console.log(`${label.padEnd(46)} repairs=${JSON.stringify(s.pendingDataRepairs.map((r) => r.field + (r.acknowledged ? '(ack)' : '')))} ` +
    `mayClaim(debt-balances)=${mayClaim(s, 'debt-balances')} chase.originalBalance=${s.debts.find((d) => d.id === 'chase')!.originalBalance}`);
};

console.log('answerableByEdit(repair) =', answerableByEdit(repair), '  <- true => the ack branch is NOT taken');
console.log('unreadFieldsFor(chase)   =', JSON.stringify(unreadFieldsFor(g(), 'debt', 'chase')));
report('0 · seeded');

// 1. The user opens Chase and edits it — DebtSheet.submit()'s `fields`, verbatim (no originalBalance key).
st.getState().updateDebt('chase', { name: 'Chase Freedom', balance: 0, minimumPayment: 0, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', isAutopay: false } as never);
report('1 · edited the debt through the form');

// 2. The user taps "Got it" on the repairs card.
st.getState().acknowledgeDataRepairs?.();
report('2 · acknowledged the repairs card');

// 3. The user re-confirms the $0 balance (verifyDebtBalance) — the other "I have answered" door.
st.getState().verifyDebtBalance('chase', 0, '2026-08-01');
report('3 · re-verified the $0 balance');

// 4. Any patch at all that moves the store.
st.getState().updateDebt('amex', { name: 'Amex Gold', balance: 4000, minimumPayment: 80, apr: 18, dueDate: '2026-08-12', type: 'debt', recurrence: 'monthly', isAutopay: false } as never);
report('4 · edited the OTHER debt');

const s = g();
console.log('\n-- what stays suppressed for the life of the install --');
console.log('  selectPaidOffDebts(Chase).amount =', selectPaidOffDebts(s).find((d) => d.id === 'chase')?.amount);
console.log('  selectCelebrationStats.totalPaid =', selectCelebrationStats(s).totalPaid);
console.log('  progress ring / payoff view / widget gate mayClaim(debt-balances) =', mayClaim(s, 'debt-balances'));

// Control: the same repair on a debt whose balance is still positive CAN be answered, because a balance
// edit raises the high-water `originalBalance`.
const live = createDebtStore();
live.setState({ store: { ...seed(), debts: [{ ...seed().debts[0], balance: 500, minimumPayment: 25, originalBalance: 0 }, seed().debts[1]] } as DebtStore });
live.getState().updateDebt('chase', { name: 'Chase', balance: 600, minimumPayment: 25, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', isAutopay: false } as never);
console.log('\n⭐ CONTROL — same repair, LIVE balance, one balance edit:');
console.log('   repairs =', JSON.stringify(live.getState().store.pendingDataRepairs.map((r) => r.field)),
  ' originalBalance =', live.getState().store.debts.find((d) => d.id === 'chase')!.originalBalance,
  ' mayClaim =', mayClaim(live.getState().store, 'debt-balances'));
