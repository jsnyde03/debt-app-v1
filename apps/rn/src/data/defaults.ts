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
      incomeVaries: false,
      leanAmount: 0,
      typicalAmount: 0,
    },
    payoffStrategy: 'snowball',
    debts: [],
    requiredExpenses: [],
    livingExpenses: [],
    goals: [],
    cycleHistory: [],
    recommendationOverrides: [],
    completedRecommendedActions: [],
    milestoneMaxProgress: {},
    portfolioMaxProgress: 0,
    pendingMilestone: null,
    subscriptionPlan: 'free',
    cushionFloor: 200,
    driftBaseline: null,
    prefs: {
      notificationsEnabled: false,
      appLockEnabled: false,
      isDemoMode: false,
      themeMode: 'system',
      onboardingComplete: false,
      hasSavingsElsewhere: false,
      guardianIntroSeen: false,
      paydayLiveActivityEnabled: true,
      debtFreeSoundEnabled: false,
    },
    lastSavedAt: '',
    lastHandledPaydayDate: null,
    reviewPrompted: false,
    // v1.7 Payday Guardian substrate (2.4.D) — safe/decisive defaults; an upgrade reads as
    // fresh-but-unproven (fixed income, zero genuine cycles, empty logs, no in-flight prediction).
    inputsAsOf: currentDate,
    genuineCycleCount: 0,
    onboardedAt: null,
    incomeActualsLog: [],
    surpriseOutflowLog: [],
    currentCyclePrediction: null,
    currentCycleNotifyState: null,
    pushLog: [],
    priorGuardianBand: null,
    missedArrivals: [],
  };
}
