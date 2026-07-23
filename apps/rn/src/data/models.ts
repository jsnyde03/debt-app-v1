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
  GuardianBand,
  CyclePrediction,
  IncomeActual,
  SurpriseOutflow,
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
  GuardianBand,
  CyclePrediction,
  IncomeActual,
  SurpriseOutflow,
};

export type PayoffStrategy = 'snowball' | 'avalanche';
/** One-tier reshape (Elevation Phase 2): free finishes the job · premium does it with you every
 *  cycle. The old `premium_plus` tier is gone; feature access is via `@/subscription/hasFeatureAccess`. */
export type SubscriptionPlan = 'free' | 'premium';
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
  // v1.7 variable/irregular income (2.4.D · §2.3). Numbers (parsed at the same boundary as `amount`).
  // `incomeVaries` false → fixed income (lean-verification is N/A / masked, §2.0.a). When true, `leanAmount`
  // = the conservative floor the plan runs on ("the floor you can count on"), `typicalAmount` = the optional
  // normal-cycle figure. `seasonalStrongMonths` (1–12) is the day-one SELF-DECLARATION of seasonality
  // (§2.3 — detection can't fire in year one), so the seasonal branch fires before a year of data exists.
  incomeVaries: boolean;
  leanAmount: number;
  typicalAmount: number;
  seasonalStrongMonths?: number[];
}

/** Rarely-changed preferences + lifecycle flags. */
export interface Preferences {
  notificationsEnabled: boolean;
  appLockEnabled: boolean;
  isDemoMode: boolean;
  themeMode: ThemeMode;
  onboardingComplete: boolean;
}

/** Bump when the persisted shape changes; `runMigrations` brings older blobs forward.
 *  v5 (2.4.D) adds the Payday Guardian substrate — the additive fields below merge onto the
 *  current defaults, so an older blob backfills safely (fixed income, count 0, empty logs). */
export const CURRENT_STORE_VERSION = 5;

/** v1.7 (2.4.D): the store-level current-cycle notification carrier. Lives here — NOT on
 *  PayCycleSnapshot (a historical end-of-cycle record) — because the §2.8 notification fires at
 *  schedule-time for the CURRENT/upcoming cycle, which has no snapshot row yet. */
export interface CurrentCycleNotifyState {
  forCycleEndDate: string;
  notifiedRiskLevel: GuardianBand;
}

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
  /**
   * Premium auto-protect: the cushion the plan holds each cycle before deploying anything to extra
   * payoff — the user's "bank low-balance alert" line (default $200, adjustable). Premium reserves it
   * as the paycheck buffer so tight cycles keep cash instead of over-paying debt; free is unaffected.
   */
  cushionFloor: number;
  /** Frozen Drift Tracker baseline (schema v2); null until the plan is first established. */
  driftBaseline: DriftBaseline | null;
  prefs: Preferences;
  lastSavedAt: string;
  /** The payday the capture sheet was last handled for (self-clears on rollover as the date advances). */
  lastHandledPaydayDate: string | null;
  /** True once we've asked for an App Store review — so we never re-prompt (beyond the OS throttle). */
  reviewPrompted?: boolean;
  /** One-time extra income added to THIS cycle only (bonus/refund/side gig); clears on rollover. */
  windfall?: number;

  // ─── v1.7 Payday Cushion Guardian substrate (2.4.D) ─────────────────────────────────────────
  /** §2.0 read-freshness: stamped `= currentDate` on every genuine income/bill/balance EDIT (NOT a
   *  rollover), so the "I can't see far enough" cutoff keys off real input recency, not per-debt
   *  `lastVerifiedDate`. Backfills to the migration's current date (an upgrade reads as fresh). */
  inputsAsOf: string;
  /** §2.0 bill-completeness: count of GENUINE lived cycles (real rollovers) — excludes seeded/
   *  imported/`disturbed` cycles, so it is NOT `cycleHistory.length` (which demoSeed pre-loads). Gates
   *  the discovery holdback's decay. Starts at 0; an established upgrader re-enters discovery (accepted). */
  genuineCycleCount: number;
  /** When onboarding first completed (the bill-completeness baseline). Null until onboarded. */
  onboardedAt: string | null;
  /** §2.3 per-paycheck income actuals (planned vs actual), the sole producer of lean-verification. */
  incomeActualsLog: IncomeActual[];
  /** §2.0.a/c un-modeled outflows surfaced at reconcile (bill-completeness + attestation walk-back). */
  surpriseOutflowLog: SurpriseOutflow[];
  /** §2.0.e the in-flight prediction for the CURRENT cycle, stamped at cycle-start; folded into the
   *  cycle's snapshot WITH the reconciled outcome at rollover. Null between stamp and first compute. */
  currentCyclePrediction: CyclePrediction | null;
  /** §2.8 store-level notification carrier (see CurrentCycleNotifyState). Null until first notify. */
  currentCycleNotifyState: CurrentCycleNotifyState | null;
  /** §2.8 ISO timestamps of risk pushes, for the ≤2-per-rolling-month cap (underivable from a flag). */
  pushLog: string[];
  /** §2.2 the prior Guardian band, persisted + reloaded across rollover, for hysteresis. Null = no prior. */
  priorGuardianBand: GuardianBand | null;
  /** §2.3.1 income-arrival axis: cycle-end dates where a paycheck was missed ($0 / "didn't get paid").
   *  A missed arrival pauses deploy and is EXCLUDED from lean-learning (it's a zero-arrival, not a low cycle). */
  missedArrivals: string[];
}
