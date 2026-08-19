import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';
import { todayLocalISODate } from '@core/utils/localDate';

import { CURRENT_STORE_VERSION, type DebtStore } from './models';

/**
 * Local (not UTC) today as YYYY-MM-DD — mirrors the Capacitor `getCurrentDate`.
 *
 * ⛔ NO `toISOString()`. Its name promised a local date and it delivered a UTC one: the old body built
 * local midnight and then converted, so anywhere EAST of UTC — all of Europe in summer, Asia, Australia
 * — local midnight is the PREVIOUS day in UTC and this returned yesterday. Invisible from the Americas,
 * which is why it survived. Kept as a named re-export because the RN app imports it under this name
 * everywhere; the rule itself lives in `@core/utils/localDate`.
 */
export const todayLocalISO = todayLocalISODate;

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
    dataRepairs: [],
    portfolioMaxProgress: 0,
    pendingMilestone: null,
    subscriptionPlan: 'free',
    cushionFloor: 200,
    driftBaseline: null,
    prefs: {
      notificationsEnabled: false,
      appLockEnabled: false,
      themeMode: 'system',
      onboardingComplete: false,
      hasSavingsElsewhere: false,
      paydayLiveActivityEnabled: true,
      debtFreeSoundEnabled: false,
      tutorialSeen: null,
      tutorialStep: null,
      coachMarksSeen: [],
      notDebtExpenseIds: [],
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
