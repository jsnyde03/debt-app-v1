/** D2 probe — what the three Siri intents say for a PREMIUM user whose minimum is unreadable. */
import { runMigrations } from '../../../../apps/rn/src/data/migrations';
import { buildWidgetSnapshot } from '../../../../apps/rn/src/widget/snapshot';
import { mayClaim } from '../../../../apps/rn/src/store/trustSelectors';
import type { DebtStore } from '../../../../apps/rn/src/data/models';

const withMinimum = (minimumPayment: unknown): DebtStore =>
  runMigrations({
    version: 8,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    paycheck: { amount: '2000', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16' },
    cushionFloor: 200,
    debts: [
      { id: 'a', name: 'Visa', balance: 5000, originalBalance: 8000, minimumPayment, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' },
    ],
    prefs: { onboardingComplete: true, paydayLiveActivityEnabled: true },
  } as never);

// The three sentences, transcribed from SiriQueryIntents.swift.
const debtFreeDateIntent = (s: ReturnType<typeof buildWidgetSnapshot>) =>
  !s.hasData ? 'Add a debt in Debt Planner to see your debt-free date.'
  : s.balancesUnread ? "Some of your balances couldn't be read, so I can't give you a date yet. Open Debt Planner and set them again."
  : s.debtFreeDate === 'Debt-free' ? "You're debt-free — nicely done."
  : `You're on track to be debt-free by ${s.debtFreeDate}.`;
const remainingDebtIntent = (s: ReturnType<typeof buildWidgetSnapshot>) =>
  !s.hasData ? "You don't have any debts in Debt Planner yet."
  : s.balancesUnread ? "Some of your balances couldn't be read, so I can't total them yet. Open Debt Planner and set them again."
  : `You have ${s.remaining} in debt remaining.`;
const paycheckCheckIntent = (s: ReturnType<typeof buildWidgetSnapshot>) =>
  s.guardianSpoken === '' ? 'Seeing your paycheck read is a Premium feature — open Debt Planner to unlock the Payday Guardian.'
  : s.guardianSpoken;

for (const [label, store] of [['UNREAD  (premium, minimumPayment = "n/a")', withMinimum('n/a')], ['CONTROL (premium, minimumPayment = 2500)', withMinimum(2500)]] as const) {
  const snap = buildWidgetSnapshot(store, 600);
  console.log(`\n=== ${label}`);
  console.log(`  subscriptionPlan        : ${store.subscriptionPlan}`);
  console.log(`  snapshot.isPremium      : ${snap.isPremium}`);
  console.log(`  mayClaim required-plan  : ${mayClaim(store, 'required-plan')}`);
  console.log(`  mayClaim row-figures    : ${mayClaim(store, 'row-figures')}`);
  console.log(`  snapshot.balancesUnread : ${snap.balancesUnread}`);
  console.log(`  snapshot.guardianSpoken : ${JSON.stringify(snap.guardianSpoken)}`);
  console.log(`  Siri · debt-free date   : ${debtFreeDateIntent(snap)}`);
  console.log(`  Siri · remaining debt   : ${remainingDebtIntent(snap)}`);
  console.log(`  Siri · paycheck check   : ${paycheckCheckIntent(snap)}`);
}
