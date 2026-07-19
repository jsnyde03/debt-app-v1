import { createDefaultStore } from './defaults';
import type { DebtStore } from './models';

/**
 * DEV-ONLY seed to verify the store → `@core` engine → UI wiring during Phase B (B.2.4), before the
 * real onboarding (B.3) exists. **Flip `DEV_SEED` to false when B.3 lands.** Applied in `_layout`
 * after hydrate only when the store is still empty, so it never clobbers real data.
 */
export const DEV_SEED = true;

export function isEmptyStore(store: DebtStore): boolean {
  return store.debts.length === 0 && store.requiredExpenses.length === 0 && !store.paycheck.amount;
}

export function seededStore(): DebtStore {
  const base = createDefaultStore();
  const { currentDate } = base.paycheck;
  return {
    ...base,
    paycheck: { ...base.paycheck, amount: '2100' },
    debts: [
      {
        id: 'visa',
        name: 'Visa',
        balance: 700,
        minimumPayment: 70,
        apr: 19,
        dueDate: currentDate,
        type: 'debt',
        recurrence: 'monthly',
      },
    ],
    requiredExpenses: [
      { id: 'phone', name: 'Phone', amount: 90, dueDate: currentDate, recurrence: 'monthly' },
    ],
    goals: [{ id: 'ef', name: 'Emergency Fund', targetAmount: 1000, currentAmount: 250, type: 'emergency' }],
    prefs: { ...base.prefs, onboardingComplete: true },
  };
}
