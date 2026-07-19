import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';

import { CURRENT_STORE_VERSION, type DebtStore } from './models';

/** Local (not UTC) today as YYYY-MM-DD — mirrors the Capacitor `getCurrentDate`. */
export function todayLocalISO(): string {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).toISOString().slice(0, 10);
}

/** A fresh, empty store — first launch / after "reset all data". `onboardingComplete: false`. */
export function createDefaultStore(): DebtStore {
  const currentDate = todayLocalISO();
  return {
    storeVersion: CURRENT_STORE_VERSION,
    paycheck: {
      amount: '',
      payCycle: 'biweekly',
      nextPaycheckDate: getNextPaycheckDate({ payCycle: 'biweekly', currentDate }),
      currentDate,
      semiMonthlyFirstDay: '1',
      semiMonthlySecondDay: '15',
      monthlyPayDay: '1',
    },
    payoffStrategy: 'snowball',
    debts: [],
    requiredExpenses: [],
    goals: [],
    cycleHistory: [],
    recommendationOverrides: [],
    completedRecommendedActions: [],
    milestoneMaxProgress: {},
    subscriptionPlan: 'free',
    prefs: {
      notificationsEnabled: false,
      appLockEnabled: false,
      isDemoMode: false,
      themeMode: 'system',
      onboardingComplete: false,
    },
    lastSavedAt: '',
  };
}
