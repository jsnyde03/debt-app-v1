/**
 * 8.4.4 surfaced — e2e run 1's snapshot showed Money's premium provisional-payoff row reading "$0 · 0% APR, verified" while Today
 * asks the user to confirm that payoff. Hypothesis: `money.tsx` passes `DebtRow` a debt from the PROJECTED store, and the row runs
 * `selectDebtBalanceView` on it again — so a re-anchored debt is no longer an estimate and `buildEstimateCaption` says "verified".
 *
 * Question 1: is the caption different for the raw debt and for the debt `view.order` hands the row?
 * Question 2: is it only the $0 estimate, or every projected premium row? (Decides whether it predates class 5's L1-R1.)
 *
 * Read-only. Run from apps/rn:  npx tsx --tsconfig ./tsconfig.json <this file>
 */
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { buildEstimateCaption, selectDebtBalanceView, withProjectedBalances } from '@/store/balanceSelectors';
import { selectPayoffView } from '@/store/payoffSelectors';

const DAY = '2026-08-26';
const fmt = (iso: string) => iso;

const store: DebtStore = {
  ...runMigrations({
    version: 8,
    paycheck: { amount: '2400', payCycle: 'monthly', currentDate: DAY, nextPaycheckDate: '2026-09-26' },
    debts: [
      // The e2e seed's provisional payoff: projects to $0.
      { id: 'card', name: 'Chase Freedom', balance: 40, originalBalance: 4200, minimumPayment: 300, apr: 0, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-05-01' },
      // A projected row that does NOT reach $0: anchored two months back, so its estimate moves but stays above $0.
      { id: 'visa', name: 'Visa', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-06-26', lastVerifiedDate: '2026-06-26' },
      // Run 2 — the two variables apart. Run 1's $0 row also had NO lastVerifiedDate, and `isEstimate` is `daysSinceVerified > 0`.
      { id: 'card-dated', name: 'Card+dated', balance: 40, originalBalance: 4200, minimumPayment: 300, apr: 0, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-05-01', lastVerifiedDate: '2026-05-01' },
      { id: 'visa-undated', name: 'Visa-undated', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-06-26' },
      // Verified today: the control, which should read "verified" either way.
      { id: 'car', name: 'Auto Loan', balance: 9800, originalBalance: 12000, minimumPayment: 310, apr: 6.4, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
    ],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
    cushionFloor: 200,
    prefs: { onboardingComplete: true },
  }),
  subscriptionPlan: 'premium',
};

const cpm = payCyclesPerMonth(store.paycheck.payCycle);
const view = selectPayoffView(withProjectedBalances(store, true));
for (const raw of store.debts) {
  const handed = view.order.find((d) => d.id === raw.id);
  const fromRaw = selectDebtBalanceView(raw, DAY, true, cpm);
  const capRaw = buildEstimateCaption(fromRaw, true, fmt);
  const line = [`${raw.name.padEnd(13)}`, `raw: bal ${fromRaw.currentBalance} isEstimate=${fromRaw.isEstimate} "${capRaw.text}"`];
  if (handed) {
    const fromHanded = selectDebtBalanceView(handed, DAY, true, cpm);
    const capHanded = buildEstimateCaption(fromHanded, true, fmt);
    line.push(`handed (what DebtRow gets): bal ${fromHanded.currentBalance} isEstimate=${fromHanded.isEstimate} staleness=${fromHanded.confidence.staleness} "${capHanded.text}"`);
    line.push(`anchor raw ${raw.balanceAsOfDate} → handed ${handed.balanceAsOfDate}`);
  } else {
    line.push('NOT in view.order');
  }
  console.log(line.join(' · '));
}
