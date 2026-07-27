import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { applyRollover } from '@/store/payday';

/**
 * 3.3.2.1 — the PORTFOLIO milestone-cross capture at rollover: a 25/50/75% journey crossing sets a
 * transient `pendingMilestone`; 100% (debt-free) is excluded (owned by the payoff finale); and an
 * already-celebrated threshold never re-fires (dedup via `portfolioMaxProgress`).
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function storeWith(balance: number, originalBalance: number, over: Partial<DebtStore> = {}): DebtStore {
  const s = createDefaultStore();
  const today = s.paycheck.currentDate;
  return {
    ...s,
    subscriptionPlan: 'premium',
    paycheck: { ...s.paycheck, amount: '2000' },
    // minimumPaidThisCycle: the user paid the minimum this cycle, so the rollover applies it (the real flow).
    debts: [{ id: 'd0', name: 'Card', balance, originalBalance, minimumPayment: 100, apr: 0, dueDate: today, type: 'debt', recurrence: 'monthly', balanceAsOfDate: today, lastVerifiedDate: today, minimumPaidThisCycle: true }],
    prefs: { ...s.prefs, onboardingComplete: true },
    ...over,
  };
}

function run() {
  console.log('Running milestone-cross capture (3.3.2.1) tests...');

  // The rollover pays each debt its minimum (100 here), so start just below a threshold to cross it.
  // A — a debt at 24% paid crosses 25% this rollover → the pending milestone is 25.
  const crossed = applyRollover(storeWith(3800, 5000));
  assert(crossed.pendingMilestone !== null, 'a portfolio crossing sets pendingMilestone');
  assert(crossed.pendingMilestone!.threshold === 25, `crossed 25% — got ${crossed.pendingMilestone?.threshold}`);
  assert(crossed.portfolioMaxProgress >= 25, 'portfolioMaxProgress advanced to (at least) the crossing');

  // B — paying the ONLY debt fully → 100% is debt-free (the finale's domain), NEVER a mid-milestone.
  const toFree = applyRollover(storeWith(60, 5000));
  assert(toFree.debts[0].balance <= 0, 'the tiny debt paid off (reaches 100%)');
  assert(toFree.pendingMilestone === null, '100% never sets a milestone (finale owns debt-free)');

  // C — dedup: a debt already past 75 (maxProgress recorded) rolling further does NOT re-fire a milestone.
  const dedup = applyRollover(storeWith(900, 5000, { portfolioMaxProgress: 75, pendingMilestone: null }));
  assert(dedup.debts[0].balance > 0, 'the debt is still alive (not a 100% case)');
  assert(dedup.pendingMilestone === null, 'an already-celebrated threshold does not re-fire');

  console.log(`✅ Milestone-cross capture (3.3.2.1) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
