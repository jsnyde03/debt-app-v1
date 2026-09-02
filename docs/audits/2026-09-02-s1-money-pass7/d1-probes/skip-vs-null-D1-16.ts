// D1 probe: which invariants report "evaluated" while having checked NOTHING?
import { checkAllTracked, type DoorOutcome } from '../../../../apps/rn/src/data/migrationAudit/invariants.ts';

const base = { door: 'probe', input: {}, inputBefore: '{}', inputAfter: '{}', refused: false, threw: null };

const refused: DoorOutcome = { ...base, store: null, refused: true };
console.log('outcome A — the door REFUSED (store === null), so nothing about money/version/pace can be checked:');
console.log('   evaluated =', checkAllTracked(refused).evaluated.join(', '));
console.log('   violations =', checkAllTracked(refused).violations.length);

const noGoals: DoorOutcome = {
  ...base,
  store: { storeVersion: 999, goals: 'not-an-array', debts: [], requiredExpenses: [], livingExpenses: [], dataRepairs: [] } as never,
};
console.log('\noutcome B — store present but `goals` is not an array (priorityGoalIsCapped returns null at :271):');
console.log('   evaluated =', checkAllTracked(noGoals).evaluated.join(', '));
