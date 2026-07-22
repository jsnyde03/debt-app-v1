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
  // Staggered verification dates so Projection auto-maintenance (2.3) demos one of each estimate
  // state for a Premium view: fresh (Store), aging (Visa), stale → "verify soon" (Car). Free just
  // reads "updated {date}". Only affects the DISPLAY estimate, not drift/plan (still on the anchor).
  const daysAgo = (n: number) => {
    const d = new Date(`${currentDate}T00:00:00`);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  return {
    ...base,
    paycheck: { ...base.paycheck, amount: '2350', nextPaycheckDate },
    // A user genuinely MID-JOURNEY (~39% paid — original $18,900 → now $11,580), so the ring shows
    // real progress past the 25% milestone and the snowball has an "about to win" focus debt.
    debts: [
      { id: 'demo-store', name: 'Store Card', balance: 180, originalBalance: 1200, minimumPayment: 30, apr: 22.99, dueDate: currentDate, type: 'debt', recurrence: 'monthly', lastVerifiedDate: daysAgo(8) },
      { id: 'demo-visa', name: 'Visa', balance: 2400, originalBalance: 4200, minimumPayment: 65, apr: 26.99, dueDate: currentDate, type: 'debt', recurrence: 'monthly', lastVerifiedDate: daysAgo(38) },
      { id: 'demo-car', name: 'Car Loan', balance: 9000, originalBalance: 13500, minimumPayment: 260, apr: 6.5, dueDate: currentDate, type: 'debt', recurrence: 'monthly', lastVerifiedDate: daysAgo(52) },
    ],
    requiredExpenses: [
      { id: 'demo-rent', name: 'Rent', amount: 1150, dueDate: currentDate, recurrence: 'monthly', category: 'housing' },
      { id: 'demo-utilities', name: 'Utilities', amount: 130, dueDate: currentDate, recurrence: 'monthly', category: 'utilities' },
      { id: 'demo-phone', name: 'Phone', amount: 85, dueDate: currentDate, recurrence: 'monthly', category: 'utilities' },
    ],
    livingExpenses: [
      { id: 'demo-groceries', name: 'Groceries', amount: 300, enabled: true },
      { id: 'demo-gas', name: 'Gas', amount: 120, enabled: true },
    ],
    // Emergency fund FUNDED, so surplus now attacks debt (the plan generates real extra-to-debt →
    // interest saved + the vs-minimums trajectory gap). A second, partially-funded goal fills Goals.
    goals: [
      { id: 'demo-ef', name: 'Emergency Fund', targetAmount: 1000, currentAmount: 1000, type: 'emergency' },
      { id: 'demo-vacation', name: 'Vacation Fund', targetAmount: 2500, currentAmount: 700, type: 'savings' },
    ],
    // A real track record — total debt falling cycle over cycle down to today's $11,580.
    cycleHistory: [
      { cycleEndDate: '2026-05-01', totalDebtBalance: 13320, totalPaidThisCycle: 430, allRequiredMet: true, completedRecommendedActions: [], payoffStrategy: 'snowball' },
      { cycleEndDate: '2026-05-15', totalDebtBalance: 12930, totalPaidThisCycle: 460, allRequiredMet: true, completedRecommendedActions: [], payoffStrategy: 'snowball' },
      { cycleEndDate: '2026-05-29', totalDebtBalance: 12520, totalPaidThisCycle: 445, allRequiredMet: true, completedRecommendedActions: [], payoffStrategy: 'snowball' },
      { cycleEndDate: '2026-06-12', totalDebtBalance: 12130, totalPaidThisCycle: 470, allRequiredMet: true, completedRecommendedActions: [], payoffStrategy: 'snowball' },
      { cycleEndDate: '2026-06-26', totalDebtBalance: 11840, totalPaidThisCycle: 455, allRequiredMet: true, completedRecommendedActions: [], payoffStrategy: 'snowball' },
      { cycleEndDate: '2026-07-10', totalDebtBalance: 11580, totalPaidThisCycle: 480, allRequiredMet: true, completedRecommendedActions: [], payoffStrategy: 'snowball' },
    ],
    driftBaseline: {
      anchorDate,
      anchorBalance: 12200,
      debtCount: 3,
      payoffStrategy: 'snowball',
      extraPayment: 450,
      projectedPoints: [
        { month: 0, balance: 12200 },
        { month: 3, balance: 11000 },
        { month: 12, balance: 6500 },
        { month: 22, balance: 0 },
      ],
      projectedDebtFreeDate: 'May 2028',
    },
    prefs: { ...base.prefs, isDemoMode: true, onboardingComplete: true },
  };
}
