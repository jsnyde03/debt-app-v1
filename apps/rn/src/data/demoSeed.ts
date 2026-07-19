import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';

import { createDefaultStore } from './defaults';
import type { DebtStore } from './models';

/**
 * "Try with Sample Data" — a realistic populated store so a new user can explore the app before
 * entering their own numbers. Sets `isDemoMode` + `onboardingComplete` so the route-guard drops
 * straight into the tabs. (Parity with the Capacitor `applyDemoPlannerStateToStorage` demo path.)
 */
export function demoStore(): DebtStore {
  const base = createDefaultStore();
  const { currentDate } = base.paycheck;
  const nextPaycheckDate = getNextPaycheckDate({ payCycle: 'biweekly', currentDate });
  return {
    ...base,
    paycheck: { ...base.paycheck, amount: '2100', nextPaycheckDate },
    debts: [
      { id: 'demo-visa', name: 'Visa', balance: 2400, minimumPayment: 65, apr: 22.99, dueDate: currentDate, type: 'debt', recurrence: 'monthly' },
      { id: 'demo-car', name: 'Car Loan', balance: 8600, minimumPayment: 240, apr: 6.5, dueDate: currentDate, type: 'debt', recurrence: 'monthly' },
    ],
    requiredExpenses: [
      { id: 'demo-rent', name: 'Rent', amount: 1200, dueDate: currentDate, recurrence: 'monthly', category: 'housing' },
      { id: 'demo-phone', name: 'Phone', amount: 80, dueDate: currentDate, recurrence: 'monthly', category: 'utilities' },
    ],
    goals: [{ id: 'demo-ef', name: 'Emergency Fund', targetAmount: 1000, currentAmount: 250, type: 'emergency' }],
    prefs: { ...base.prefs, isDemoMode: true, onboardingComplete: true },
  };
}
