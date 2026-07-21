/**
 * The RN app's consolidated persisted state (one blob → one zustand store), the single source of
 * truth for every screen. Entities are the SAME shapes as the Capacitor app, re-exported from the
 * shared `@core` schema so the two shells can't drift. (The Capacitor app persists these across
 * many `debtPlanner.*` localStorage keys; the Phase-D data bridge maps those → this blob.)
 */

import type {
  Debt,
  RequiredExpense,
  RequiredExpenseCategory,
  Goal,
  RecommendationOverride,
  CompletedRecommendedAction,
  PayCycleSnapshot,
} from '@core/storage/debtPlannerStorage';
import type { LivingExpense } from '@core/types/livingExpense';
import type { PayCycle } from '@core/payCycle/getNextPaycheckDate';
import type { DriftBaseline } from '@core/debt/computeDrift';

export type { DriftBaseline };

export type {
  Debt,
  RequiredExpense,
  RequiredExpenseCategory,
  Goal,
  RecommendationOverride,
  CompletedRecommendedAction,
  PayCycleSnapshot,
  LivingExpense,
  PayCycle,
};

export type PayoffStrategy = 'snowball' | 'avalanche';
export type SubscriptionPlan = 'free' | 'premium' | 'premium_plus';
export type ThemeMode = 'system' | 'light' | 'dark';

/** Paycheck / pay-cycle configuration (Capacitor: the `usePayCycleSettings` keys). */
export interface PaycheckConfig {
  amount: string; // kept as a string to mirror the input model (parsed at the engine boundary)
  payCycle: PayCycle;
  nextPaycheckDate: string;
  currentDate: string;
  semiMonthlyFirstDay: string;
  semiMonthlySecondDay: string;
  monthlyPayDay: string;
}

/** Rarely-changed preferences + lifecycle flags. */
export interface Preferences {
  notificationsEnabled: boolean;
  appLockEnabled: boolean;
  isDemoMode: boolean;
  themeMode: ThemeMode;
  onboardingComplete: boolean;
}

/** Bump when the persisted shape changes; `runMigrations` brings older blobs forward. */
export const CURRENT_STORE_VERSION = 2;

export interface DebtStore {
  storeVersion: number;
  paycheck: PaycheckConfig;
  payoffStrategy: PayoffStrategy;
  debts: Debt[];
  requiredExpenses: RequiredExpense[];
  livingExpenses: LivingExpense[];
  goals: Goal[];
  cycleHistory: PayCycleSnapshot[];
  recommendationOverrides: RecommendationOverride[];
  completedRecommendedActions: CompletedRecommendedAction[];
  milestoneMaxProgress: Record<string, number>;
  subscriptionPlan: SubscriptionPlan;
  /** Frozen Drift Tracker baseline (schema v2); null until the plan is first established. */
  driftBaseline: DriftBaseline | null;
  prefs: Preferences;
  lastSavedAt: string;
  /** The payday the capture sheet was last handled for (self-clears on rollover as the date advances). */
  lastHandledPaydayDate: string | null;
  /** True once we've asked for an App Store review — so we never re-prompt (beyond the OS throttle). */
  reviewPrompted?: boolean;
}
