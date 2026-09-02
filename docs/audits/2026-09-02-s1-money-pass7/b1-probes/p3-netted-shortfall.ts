/* B1 probe 3 — is the top-up netted for the BAND but not for `PlanSummary.shortfall` / `.status`,
   which PlanHero and the paywall read? [S1.9.3 A1: "netted exactly ONCE, and EVERY read takes the result"] */
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectPlanSummary, selectRequiredRows } from '@/store/planSelectors';
import { selectAllocation, effectivePaycheckBuffer } from '@/store/selectors';
import { nettedTopUp, appliedTopUp } from '@/store/topUpSelectors';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { paywallLead } from '@/store/paywallLead';

const s0 = createDefaultStore();
function mk(topUp?: number): DebtStore {
  return {
    ...s0,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    cushionFloor: 200,
    paycheck: { ...s0.paycheck, amount: '2000', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    debts: [],
    requiredExpenses: [{ id: 'rent', name: 'Rent', amount: 2150, dueDate: '2026-08-05', recurrence: 'monthly' }],
    goals: [{ id: 'vac', name: 'Vacation', targetAmount: 1000, currentAmount: 900, type: 'savings' }],
    prefs: { ...s0.prefs, onboardingComplete: true },
    ...(topUp ? { cycleTopUp: { forCycle: '2026-09-01', amount: topUp, goalId: 'vac' } } : {}),
  } as unknown as DebtStore;
}

for (const t of [undefined, 400]) {
  const st = mk(t);
  const a = selectAllocation(st)!;
  const summary = selectPlanSummary(st, a, selectRequiredRows(st, a));
  const n = nettedTopUp(st, a.shortfall);
  const brief = selectPaydayGuardian(st);
  console.log(`\n=== cycleTopUp = ${t ?? 'none'} ===`);
  console.log(`  allocation.shortfall (raw)      = ${a.shortfall}`);
  console.log(`  appliedTopUp                    = ${appliedTopUp(st)}`);
  console.log(`  nettedTopUp residual / surplus  = ${n.residual} / ${n.surplus}`);
  console.log(`  --- what each surface states ---`);
  console.log(`  Guardian band  (brief.state)    = ${brief?.state}   brief.shortfall = ${brief?.shortfall}`);
  console.log(`  PlanSummary.cushionStatus       = ${summary.cushionStatus}   (netted, planSelectors:488)`);
  console.log(`  PlanSummary.shortfall           = ${summary.shortfall}       (RAW, planSelectors:463)`);
  console.log(`  PlanSummary.status              = ${summary.status}          (RAW, planSelectors:508)`);
  console.log(`  PlanHero statusLabel            = ${summary.status === 'overdue' ? 'Overdue payments need attention' : summary.status === 'short' ? 'Short this paycheck' : 'On track'}`);
  const lead = paywallLead(summary, effectivePaycheckBuffer(st), true, null);
  console.log(`  paywall lead.fact               = ${JSON.stringify(lead?.fact)}`);
}
