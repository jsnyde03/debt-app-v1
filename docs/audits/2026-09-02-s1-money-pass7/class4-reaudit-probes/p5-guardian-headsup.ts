/**
 * Probe 5 — run from `apps/rn` (see p4's note on `@/` resolution).
 * The reserve and the required-action caption were widened past `type`/`isInstallmentNative`;
 * `selectBnplBetweenPaycheck` — the Guardian line whose whole job is to EXPLAIN that reserve — was not.
 */
import { createDefaultStore } from '@/data/defaults';
import { selectAllocation } from '@/store/selectors';
import { selectBnplBetweenPaycheck } from '@/store/guardianSelectors';
import { deriveRequiredActionView } from '@core/debt/deriveRequiredActionView';
const C = '2026-10-01', N = '2026-11-01', D = '2026-10-02';
const shapes: any = {
  'installment-native BNPL': { type: 'bnpl', bnplProvider: 'Klarna', scheduledPaymentAmount: 50, remainingPayments: 40 },
  'fallback BNPL':           { type: 'bnpl', bnplProvider: 'Afterpay' },
  'plain debt (weekly)':     { type: 'debt' },
};
for (const [kind, extra] of Object.entries(shapes)) {
  const s0 = createDefaultStore();
  const debt: any = { id: 'd1', name: 'Loan', balance: 5000, minimumPayment: 50, apr: 0, dueDate: D, recurrence: 'weekly', ...(extra as any) };
  const store: any = { ...s0, paycheck: { ...s0.paycheck, amount: '3000', payCycle: 'monthly', currentDate: C, nextPaycheckDate: N },
    debts: [debt], requiredExpenses: [], livingExpenses: [], goals: [], prefs: { ...s0.prefs, onboardingComplete: true } };
  const a = selectAllocation(store)!;
  const row = a.allocations.find((x: any) => x.category === 'minimum_debt');
  const view = row ? deriveRequiredActionView(row as any, [], [debt], C) : null;
  console.log(kind.padEnd(24), '| reserved', String(a.totalRequired).padEnd(5), '| row', String(row ? row.amount : '-').padEnd(5),
    '| caption', view?.installments ? `${view.installments.count} x $${view.installments.each}` : 'NONE ',
    '| guardian heads-up:', selectBnplBetweenPaycheck(store) ?? 'null');
}
