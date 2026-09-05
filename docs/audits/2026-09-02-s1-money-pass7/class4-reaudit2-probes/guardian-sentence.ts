/**
 * ROUND-2 PROBE — is the widened Guardian heads-up TRUE for every shape it now admits?
 *
 * Round 1's `F7` replaced the `isInstallmentNative(d)` gate in `selectBnplBetweenPaycheck` with
 * `hasKnownBnplCadence(d)`. `isInstallmentNative` REQUIRES `remainingPayments > 0`, and
 * `bnplInstallmentsInWindow` caps its count at `remainingPayments`. The two shapes the widening
 * admits — a fallback BNPL and a plain debt — carry no `remainingPayments`, so the cap is `Infinity`.
 *
 * The sentence multiplies count × per-charge amount. `effectiveMinimumInWindow` — the reserve the
 * sentence exists to explain — caps that product at the BALANCE. Does the sentence?
 */
import { selectBnplBetweenPaycheck } from '../../../../apps/rn/src/store/guardianSelectors';
import { effectiveMinimumInWindow } from '../../../../packages/core/debt/bnplInstallment';
import type { Debt } from '../../../../packages/core/storage/debtPlannerStorage';
import { createDefaultStore } from '../../../../apps/rn/src/data/defaults';
import type { DebtStore } from '../../../../apps/rn/src/data/models';

const START = '2026-08-03';
const END = '2026-09-01'; // a monthly payer's window: 29 days

function storeWith(d: Partial<Debt>): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    debts: [{ id: 'd1', name: 'Car Loan', balance: 5000, minimumPayment: 50, apr: 10, dueDate: START, type: 'debt', recurrence: 'weekly', ...d } as unknown as Debt],
    requiredExpenses: [], livingExpenses: [], goals: [],
    paycheck: { ...s.paycheck, amount: '3000', payCycle: 'monthly', currentDate: START, nextPaycheckDate: END },
    prefs: { ...s.prefs, onboardingComplete: true },
  } as DebtStore;
}

const CASES: { label: string; debt: Partial<Debt> }[] = [
  { label: 'installment-native BNPL, healthy balance', debt: { type: 'bnpl', bnplProvider: 'Klarna', scheduledPaymentAmount: 50, remainingPayments: 40, balance: 2000 } },
  { label: 'installment-native BNPL, 2 payments left ($100 balance)', debt: { type: 'bnpl', bnplProvider: 'Klarna', scheduledPaymentAmount: 50, remainingPayments: 2, balance: 100 } },
  { label: 'fallback BNPL, healthy balance', debt: { type: 'bnpl', bnplProvider: 'Afterpay', balance: 2000 } },
  { label: '⚠ fallback BNPL, $100 balance left', debt: { type: 'bnpl', bnplProvider: 'Afterpay', balance: 100 } },
  { label: 'plain weekly debt, healthy balance', debt: { type: 'debt', balance: 2000 } },
  { label: '⚠ plain weekly debt, $120 balance left', debt: { type: 'debt', balance: 120 } },
  { label: '⚠ plain weekly debt, $60 balance left', debt: { type: 'debt', balance: 60 } },
  { label: '⚠ plain weekly debt, $1 balance left', debt: { type: 'debt', balance: 1 } },
  { label: 'plain weekly debt with an EMPTY name', debt: { type: 'debt', name: '', balance: 2000 } },
];

console.log(`window ${START} → ${END} (29 days), a $50 weekly charge\n`);
let false_ = 0;
for (const c of CASES) {
  const store = storeWith(c.debt);
  const d = store.debts[0];
  const line = selectBnplBetweenPaycheck(store);
  const reserve = effectiveMinimumInWindow(d, START, END);
  const m = line?.match(/Heads up — (\d+) (.*) payments \(about \$([\d,]+) each\)/);
  const claimed = m ? Number(m[1]) * Number(m[3].replace(/,/g, '')) : null;
  const honest = claimed === null || Math.abs(claimed - reserve) < 0.005;
  if (!honest) false_++;
  console.log(`  ${honest ? '  ' : '✗ '}${c.label}`);
  console.log(`       balance $${d.balance} · reserve (effectiveMinimumInWindow) $${reserve}`);
  console.log(`       line: ${line === null ? 'null' : JSON.stringify(line)}`);
  if (claimed !== null) console.log(`       the sentence claims $${claimed} lands before the next paycheck`);
  console.log('');
}
console.log(`${false_} of ${CASES.length} cases state a total the app does NOT reserve.`);
