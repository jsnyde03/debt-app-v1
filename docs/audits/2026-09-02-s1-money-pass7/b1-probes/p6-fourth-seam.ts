/* B1 probe 6 — the A1 / D2-1 agreement invariant, extended to `PlanSummary.status` + `paywallLead`,
   on guardianSelectors.test.ts's OWN fixtures (its `store()` helper and `cycle()` shape, copied verbatim). */
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { toCushionStatus } from '@core/timeline/buildMultiCycleTimeline';
import { selectAllocation, effectivePaycheckBuffer, BASE_PAYCHECK_BUFFER } from '@/store/selectors';
import { selectPlanSummary, selectRequiredRows } from '@/store/planSelectors';
import { selectCashTimeline } from '@/store/payoffSelectors';
import { selectPaydayGuardian, selectAppliedTopUp } from '@/store/guardianSelectors';
import { selectRecoveryPlan } from '@/store/recoverySelectors';
import { paywallLead } from '@/store/paywallLead';

// ── guardianSelectors.test.ts:26-72 `store()`, reduced to the keys these fixtures use.
function store(o: { amount?: string; floor?: number; premium?: boolean; bills?: number[]; goals?: { type: 'emergency' | 'savings'; current: number }[]; topUp?: number }): DebtStore {
  const s = createDefaultStore();
  const today = s.paycheck.currentDate;
  return {
    ...s,
    subscriptionPlan: o.premium ? 'premium' : 'free',
    cushionFloor: o.floor ?? 200,
    genuineCycleCount: 6,
    paycheck: { ...s.paycheck, amount: o.amount ?? '2000' },
    debts: [],
    requiredExpenses: (o.bills ?? []).map((amt, i) => ({ id: `e${i}`, name: `Bill ${i}`, amount: amt, dueDate: today, recurrence: 'monthly' })),
    goals: (o.goals ?? []).map((g, i) => ({ id: `g${i}`, name: g.type === 'emergency' ? 'Emergency Fund' : `Savings ${i}`, type: g.type, currentAmount: g.current, targetAmount: 5000 })),
    prefs: { ...s.prefs, onboardingComplete: true },
    ...(o.topUp ? { cycleTopUp: { forCycle: s.paycheck.nextPaycheckDate, amount: o.topUp, entries: [{ source: 'guardian' as const, goalId: 'g0', amount: o.topUp }] } } : {}),
  } as unknown as DebtStore;
}
// guardianSelectors.test.ts:369-370 `cycle(short, topUp)`
const cycle = (short: number, topUp: number) =>
  store({ premium: true, amount: '2000', bills: [2000 + short], floor: 200, topUp, goals: [{ type: 'savings', current: 1000 }] });

function row(label: string, st: DebtStore) {
  const a = selectAllocation(st)!;
  const summary = selectPlanSummary(st, a, selectRequiredRows(st, a));
  const card = toCushionStatus(selectPaydayGuardian(st)!.state);
  const forecast = selectCashTimeline(st)[0]?.cushionStatus;
  const lead = paywallLead(summary, effectivePaycheckBuffer(st), true, null);
  console.log(`\n== ${label} ==`);
  console.log(`  THE THREE THE TEST COMPARES (guardianSelectors.test.ts:471-479)`);
  console.log(`    card                     = ${card}`);
  console.log(`    summary.cushionStatus    = ${summary.cushionStatus}`);
  console.log(`    forecast[0].cushionStatus= ${forecast}`);
  console.log(`    agree?                   = ${new Set([card, summary.cushionStatus, forecast]).size === 1}`);
  console.log(`  THE SEAMS IT DOES NOT COMPARE — off the SAME object it already holds`);
  console.log(`    summary.status           = ${summary.status}`);
  console.log(`    summary.shortfall        = ${summary.shortfall}`);
  console.log(`    PlanHero statusLabel     = ${summary.status === 'overdue' ? 'Overdue payments need attention' : summary.status === 'short' ? 'Short this paycheck' : 'On track'}`);
  console.log(`    paywall lead.fact        = ${JSON.stringify(lead?.fact)}`);
  console.log(`    selectRecoveryPlan gap   = ${(selectRecoveryPlan(st) as { gap?: number } | null)?.gap ?? null}`);
  console.log(`    selectAppliedTopUp.holdsLine = ${selectAppliedTopUp(st)?.holdsLine}`);
}

// A1's own "the case that shipped" family, at the arity the suite never ran against PlanSummary.status.
row('cycle(50, 200)  — the test asserts band = tight here (line 439)', cycle(50, 200));
row('cycle(50, 0)    — ⭐ control, the same cycle with no money moved', cycle(50, 0));
row('cycle(400, 200) — ⭐ control, a shortfall the move does NOT cover', cycle(400, 200));
void BASE_PAYCHECK_BUFFER;

// ── The sharpest pair: guardianSelectors.test.ts:418-419 asserts the CARD names $200 and never $400.
{
  const st = cycle(400, 200);
  const a = selectAllocation(st)!;
  const brief = selectPaydayGuardian(st)!;
  const summary = selectPlanSummary(st, a, selectRequiredRows(st, a));
  console.log('\n== cycle(400, 200) · the two sentences on the same store ==');
  console.log('  Guardian card detail  =', JSON.stringify(brief.detail));
  console.log('  paywall lead.fact     =', JSON.stringify(paywallLead(summary, effectivePaycheckBuffer(st), true, null)?.fact));
}
