/**
 * Probe 4 — run from `apps/rn` (`npx tsx ../../docs/.../p4-seventh-site.ts` will NOT resolve `@/`;
 * copy to `apps/rn/src/` to run, or run its body there). Recorded here as the exact source measured.
 *
 * A. planSelectors.ts:255 — the SEVENTH site: the required row for a debt whose minimum is TICKED
 *    is built from the RAW `d.minimumPayment`, not the in-window figure.
 * B. recoverySelectors.ts:50 — a SECOND live expression of the in-window minimum, which disagrees
 *    with `effectiveMinimumInWindow` (the declared one producer) on an un-normalised BNPL.
 */
import { createDefaultStore } from '@/data/defaults';
import { selectAllocation } from '@/store/selectors';
import { selectRequiredRows } from '@/store/planSelectors';
import { selectRecoveryPlan } from '@/store/recoverySelectors';
import { effectiveMinimumInWindow } from '@core/debt/bnplInstallment';
const C = '2026-10-01', N = '2026-11-01', D = '2026-10-02';
function mk(paid: boolean, extra: any = {}, amount = '3000') {
  const s0 = createDefaultStore();
  const debt: any = { id: 'd1', name: 'Weekly loan', balance: 5000, minimumPayment: 50, apr: 10, dueDate: D,
    type: 'debt', recurrence: 'weekly', minimumPaidThisCycle: paid, ...extra };
  return { store: { ...s0, paycheck: { ...s0.paycheck, amount, payCycle: 'monthly', currentDate: C, nextPaycheckDate: N },
    debts: [debt], requiredExpenses: [], livingExpenses: [], goals: [], prefs: { ...s0.prefs, onboardingComplete: true } } as any, debt };
}
console.log('=== A. the required-plan ROW, unticked vs ticked (same debt, same cycle) ===');
for (const paid of [false, true]) {
  const { store } = mk(paid);
  const a = selectAllocation(store)!;
  const r = selectRequiredRows(store, a).find((x: any) => x.item.category === 'minimum_debt');
  console.log(`  minimumPaidThisCycle=${String(paid).padEnd(5)} | engine totalRequired $${a.totalRequired} | VISIBLE ROW $${r ? r.item.amount : '-'} | caption ${r?.view.installments ? r.view.installments.count + ' x $' + r.view.installments.each : 'none'}`);
}
console.log('\n=== B. the recovery plan: a SECOND expression of the in-window minimum ===');
for (const [label, extra] of [
  ['plain weekly, n=4', {}],
  ['installment-native, MONTHLY (n=1), scheduled 80 != stored minimum 50', { type: 'bnpl', bnplProvider: 'Klarna', recurrence: 'monthly', scheduledPaymentAmount: 80, remainingPayments: 40 }],
] as any[]) {
  const { store, debt } = mk(false, extra, '10');
  const owner = Math.min(effectiveMinimumInWindow(debt, C, N), debt.balance);
  const plan: any = selectRecoveryPlan(store);
  const ess = (plan?.coverNow ?? plan?.essential ?? plan?.cover ?? []).find?.((x: any) => x.id === 'd1');
  console.log(`  ${label}`);
  console.log(`     effectiveMinimumInWindow (the declared ONE producer) = $${owner}`);
  console.log(`     recoverySelectors essential amount                   = $${ess ? ess.amount : 'n/a'}`);
}
