/**
 * L1 probe 5 — B1-1: does the engine fund, once the goal is STORED, the pace the save-for-it sheet printed?
 * Sweep: tier × reserve held × existing priority goal × variable income × a crunch ahead × amount.
 * The sheet computes on `withProjectedBalances(store, isPremium)` and Today allocates on the same, so both
 * sides here use it. Run from <tree>/apps/rn:  npx tsx --tsconfig <tree>/apps/rn/tsconfig.json <this file>
 */
import { runMigrations } from '@/data/migrations';
import type { DebtStore, Goal } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectSaveForItOptions } from '@/store/guardianSelectors';
import { selectAllocation } from '@/store/selectors';

const DAY = '2026-08-26';
const NEXT = '2026-09-09';
const ANCHOR = '2026-07-01';

type Shape = { premium: boolean; reserve: boolean; priorGoal: boolean; variable: boolean; crunch: boolean; amount: number; income: number };
const shapes: Shape[] = [];
for (const premium of [false, true])
  for (const reserve of [false, true])
    for (const priorGoal of [false, true])
      for (const variable of [false, true])
        for (const crunch of [false, true])
          for (const amount of [300, 1500])
            for (const income of [1400, 2400]) shapes.push({ premium, reserve, priorGoal, variable, crunch, amount, income });

function build(sh: Shape): DebtStore {
  const s = runMigrations({
    version: 8,
    paycheck: { amount: String(sh.income), currentDate: DAY, nextPaycheckDate: NEXT, incomeVaries: sh.variable, leanAmount: Math.round(sh.income * 0.7), typicalAmount: sh.income },
    debts: [{ id: 'd0', name: 'Chase', balance: 4000, minimumPayment: 120, apr: 22, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR }],
    requiredExpenses: [
      { id: 'e0', name: 'Rent', amount: 800, dueDate: DAY, recurrence: 'monthly', category: 'housing' },
      ...(sh.crunch ? [{ id: 'e1', name: 'Insurance', amount: 1200, dueDate: '2026-10-01', recurrence: 'quarterly', category: 'insurance' }] : []),
    ],
    livingExpenses: [{ id: 'l0', name: 'Groceries', amount: 150, enabled: true }],
    goals: sh.priorGoal ? [{ id: 'g0', name: 'Trip', targetAmount: 900, currentAmount: 100, priority: true, priorityPerPaycheck: 60, type: 'savings' }] : [],
    cushionFloor: 200,
    ...(sh.reserve ? { expenseReserve: { balance: 200, contribution: { forCycle: NEXT, amount: 120 } } } : {}),
    prefs: { onboardingComplete: true, hasSavingsElsewhere: true },
  });
  return { ...s, subscriptionPlan: sh.premium ? 'premium' : 'free' };
}

let broken = 0;
let checked = 0;
for (const sh of shapes) {
  const store = build(sh);
  const engine = withProjectedBalances(store, sh.premium);
  const options = selectSaveForItOptions(engine, sh.amount);
  for (const o of options.filter((x) => x.prioritize && x.perPaycheck != null)) {
    const goal: Goal = { id: 'goal-2026-08-26-1', name: 'New', type: 'savings', targetAmount: sh.amount, currentAmount: 0, priority: true, priorityPerPaycheck: o.perPaycheck! };
    const stored = { ...store, goals: [...store.goals, goal] };
    const a = selectAllocation(withProjectedBalances(stored, sh.premium));
    const funded = a ? a.allocations.filter((x) => x.goalId === goal.id).reduce((t, x) => t + x.amount, 0) : 0;
    const priorBefore = selectAllocation(engine)?.allocations.filter((x) => x.goalId === 'g0').reduce((t, x) => t + x.amount, 0) ?? 0;
    const priorAfter = a?.allocations.filter((x) => x.goalId === 'g0').reduce((t, x) => t + x.amount, 0) ?? 0;
    checked += 1;
    const bad = Math.round(funded * 100) < Math.round(o.perPaycheck! * 100);
    if (bad) broken += 1;
    if (bad || priorAfter < priorBefore)
      console.log(JSON.stringify({ shape: sh, option: o.key, printed: o.perPaycheck, funded, priorGoalBefore: priorBefore, priorGoalAfter: priorAfter }));
  }
}
console.log(JSON.stringify({ shapes: shapes.length, optionsChecked: checked, brokenPromises: broken }));
