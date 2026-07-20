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
  // A drift baseline frozen ~45 days ago so the Drift Tracker demos a real "days ahead" story for a
  // Premium+ view (the demo itself stays free → shows the teaser). Tuned so today's $11,000 reads
  // ahead of the plan's ~$11,152 projection for now.
  const anchor = new Date(`${currentDate}T00:00:00`);
  anchor.setDate(anchor.getDate() - 45);
  const anchorDate = anchor.toISOString().slice(0, 10);
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
    livingExpenses: [
      { id: 'demo-groceries', name: 'Groceries', amount: 300, enabled: true },
      { id: 'demo-gas', name: 'Gas', amount: 120, enabled: true },
    ],
    goals: [{ id: 'demo-ef', name: 'Emergency Fund', targetAmount: 1000, currentAmount: 250, type: 'emergency' }],
    // A short journey so Pay Cycle History has something to show (total debt falling each cycle).
    cycleHistory: [
      { cycleEndDate: '2026-05-22', totalDebtBalance: 12100, totalPaidThisCycle: 305, allRequiredMet: true, completedRecommendedActions: [], payoffStrategy: 'snowball' },
      { cycleEndDate: '2026-06-05', totalDebtBalance: 11720, totalPaidThisCycle: 380, allRequiredMet: true, completedRecommendedActions: [], payoffStrategy: 'snowball' },
      { cycleEndDate: '2026-06-19', totalDebtBalance: 11305, totalPaidThisCycle: 415, allRequiredMet: true, completedRecommendedActions: [], payoffStrategy: 'snowball' },
    ],
    driftBaseline: {
      anchorDate,
      anchorBalance: 11300,
      debtCount: 2,
      payoffStrategy: 'snowball',
      extraPayment: 300,
      projectedPoints: [
        { month: 0, balance: 11300 },
        { month: 3, balance: 11000 },
        { month: 12, balance: 7000 },
        { month: 24, balance: 0 },
      ],
      projectedDebtFreeDate: 'Jan 2028',
    },
    prefs: { ...base.prefs, isDemoMode: true, onboardingComplete: true },
  };
}
