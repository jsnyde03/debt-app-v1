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
 *  cycle. The old `premium_plus` tier is gone; gating is a uniform inline `subscriptionPlan === 'premium'`
 *  check (driven by RevenueCat's `premium` entitlement via `setSubscriptionPlan`). */
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
  /**
   * 3.5.4.9 [D-A] — the user has turned the product-funnel events off. Optional, so an existing blob
   * migrates by simply not having it (absent = not opted out), which is the additive half of a schema
   * change and carries none of the risk of removing a key.
   *
   * Only ever read by `analytics/funnel.ts`, at its single choke point. Note what it does NOT gate:
   * there is no financial data in a funnel event by construction, so this is a preference about product
   * telemetry, not the guarantee — the guarantee is that the events cannot carry money in the first place.
   */
  analyticsOptOut?: boolean;
  /**
   * 3.7.B.2 (F10.1) — what Today calls the user, optional and user-supplied. Optional for the same
   * reason as `analyticsOptOut`: an existing blob migrates by simply not having the key, which is the
   * additive half of a schema change and carries none of the risk of removing one.
   *
   * Stored NORMALISED (`normalizeDisplayName`) — trimmed, interior whitespace collapsed, capped, and
   * `undefined` rather than `''` when cleared, so "cleared it" and "never set it" are one state and no
   * reader has to handle both. Never leaves the device; it is only ever rendered into the greeting.
   */
  displayName?: string;
  themeMode: ThemeMode;
  onboardingComplete: boolean;
  /** §2.5 D5.3 gate (2.4.7.6): the user has an emergency buffer in a separate account, so the plan
   *  skips building a pre-debt STARTER emergency fund and deploys to debt first. Default false. */
  hasSavingsElsewhere: boolean;
  /** 3.5.3: the premium Payday Countdown Live Activity auto-starts in the final ~3-day run-up to payday.
   *  User toggle (More → Preferences). Default true; only ever runs for premium users. */
  paydayLiveActivityEnabled: boolean;
  /** VIS-6: play a celebratory chime on the debt-free finale. Opt-in (default false) — sound is never
   *  a default; the visual + haptic carry the beat unless the user turns this on (More → Preferences). */
  debtFreeSoundEnabled: boolean;
  /**
   * 3.5.1 — which run of the Guardian tutorial this user has completed (or dismissed). `null` = never
   * offered/seen, so they get the first-run invitation.
   *
   * Deliberately NOT `guardianIntroSeen`, and deliberately not a boolean:
   *  - reusing `guardianIntroSeen` would silently EXCLUDE every existing v1.6 user, who carries it
   *    `true` from the old static intro but has never seen a tutorial;
   *  - a boolean can't express "saw the free run, then upgraded" — an upgrader is re-offered once,
   *    because the premium run shows the reserve/Recovery/release beats free never reaches.
   */
  tutorialSeen: 'free' | 'premium' | null;
  /**
   * 3.5.2 — interrupt-resume: the step the user was on when they left, so a phone call mid-walkthrough
   * doesn't cost them their place. `null` = start at the beginning. Cleared on completion or skip.
   *
   * Persisted rather than session-only because the realistic interruption (backgrounding the app, a
   * call) survives the session. `resumeIndex` clamps it, so a shorter arc in a later version can never
   * strand a returning user on a step that no longer exists.
   */
  tutorialStep: number | null;
  /**
   * 3.5.5.3 — which feature-discovery coach-marks this user has already been offered.
   *
   * A LIST of ids rather than a count or a flag: marks are added over versions, and each one is its own
   * "have you met this yet". A count would re-offer everything the moment the list grew.
   *
   * Persisted because the alternative is once-per-LAUNCH, and a hint that returns every launch is worse
   * than no hint — it teaches the user to dismiss without reading. More → "Show feature tips again"
   * clears it, which is the whole reason a discovery layer needs a replay entry at all.
   */
  coachMarksSeen: string[];
  /**
   * 3.7.A10.2 — expense ids the user has told us are NOT a debt, so the "is this a debt?" suggestion
   * stays gone. Optional so a store persisted before this field simply reads as "nothing dismissed"
   * rather than needing a migration of its own.
   *
   * ⚠️ Ids the DETECTOR flagged and the user waved off — not a list of expenses in general. It exists
   * because the suggestion is a guess about someone's money, and a guess that cannot be silenced is an
   * accusation repeated forever.
   */
  notDebtExpenseIds?: string[];
}

/** Bump when the persisted shape changes; `runMigrations` brings older blobs forward.
 *  v5 (2.4.D) adds the Payday Guardian substrate — the additive fields below merge onto the
 *  current defaults, so an older blob backfills safely (fixed income, count 0, empty logs).
 *  v7 (3.5.1/3.5.2) adds `prefs.tutorialSeen` + `prefs.tutorialStep`, both additive: the prefs merge
 *  backfills them to `null`, which is exactly right — every existing user becomes eligible for the
 *  tutorial invitation exactly once, and starts it at the beginning. (Both land under v7 rather than
 *  bumping twice: v7 has not shipped, so there is no blob in the wild that has one field but not the
 *  other.)
 *  v7 also carries `prefs.coachMarksSeen` (3.5.5.3), for the same reason and on the same terms: v7 is
 *  still unshipped, the prefs merge backfills it to `[]`, and an empty list is the correct starting
 *  state — every existing user is eligible for every mark exactly once.
 *  v7 also DROPS `prefs.isDemoMode` and `prefs.guardianIntroSeen` (5.6). Both were measured inert — zero
 *  production reads — and both are stripped by `runMigrations` rather than merely deleted from the type,
 *  so an upgraded blob stops carrying them instead of keeping a field nothing can read. Folded into v7 on
 *  the same terms as the two above: **v7 has not shipped**, so no blob in the wild distinguishes these
 *  states. ⚠️ `guardianIntroSeen` is why `tutorialSeen` exists as a separate field — a v1.6 user carries
 *  it `true`, so reusing it would have silently excluded exactly the people the tutorial is for. Dropping
 *  it now is safe *because* nothing was ever allowed to depend on it. */
export const CURRENT_STORE_VERSION = 7;

/** v1.7 (2.4.D): the store-level current-cycle notification carrier. Lives here — NOT on
 *  PayCycleSnapshot (a historical end-of-cycle record) — because the §2.8 notification fires at
 *  schedule-time for the CURRENT/upcoming cycle, which has no snapshot row yet. */
export interface CurrentCycleNotifyState {
  forCycleEndDate: string;
  notifiedRiskLevel: GuardianBand;
}

/** A just-crossed PORTFOLIO milestone (% of total debt paid) awaiting its celebratory ack (3.3.2). 100% is
 *  debt-free — owned by the payoff finale — so milestones here are only 25/50/75. */
export interface PendingMilestone {
  threshold: 25 | 50 | 75;
  progressPercent: number;
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
  /** 3.3.2 — the highest portfolio %-paid milestone ever reached (25/50/75), so each celebrates once. */
  portfolioMaxProgress: number;
  /** 3.3.2 — a just-crossed portfolio milestone awaiting its ack; null when none / already acknowledged. */
  pendingMilestone: PendingMilestone | null;
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
  /** §2.3 income learning (2.4.7.8): the last lean suggestion the user dismissed, so we don't re-nudge it
   *  until the suggestion moves materially. Undefined = never dismissed. */
  dismissedLeanSuggestion?: number;
  /** §2.3.1 income-arrival axis: cycle-end dates where a paycheck was missed ($0 / "didn't get paid").
   *  A missed arrival pauses deploy and is EXCLUDED from lean-learning (it's a zero-arrival, not a low cycle). */
  missedArrivals: string[];
  /** §2.10 tight-case top-up (2.4.11.2): when a tight cycle is held by moving cash from savings, the amount
   *  moved + the cycle it's for. Cycle-KEYED (not just reset at rollover) so a stale top-up self-corrects:
   *  `selectPaydayGuardian` only applies it when `forCycle` matches the current cycle. Optional +
   *  fallback-to-none, so pre-2.4.11 stores parse unchanged (no migration needed). */
  /** 3.7.A3.5 — `goalId` is what makes the top-up UNDOABLE. Without it the record says money moved but
   *  not from where, so only a caller holding the goal in component state could reverse it — which is
   *  exactly why the affordability path had an undo and the Guardian card did not. Optional and
   *  backfill-safe: an older blob parses with it undefined and simply offers no undo. */
  cycleTopUp?: { forCycle: string; amount: number; goalId?: string };
  /** §2.0.c settling-in reserve (2.4.11.4b) — the reserve-held state (`deriveConfidenceContext.provisional`)
   *  as of the last rollover, so the next rollover can detect the held → free transition (mirrors
   *  `priorGuardianBand`). Undefined on old/new stores → the pre-rollover value is computed as the fallback. */
  priorReserveHeld?: boolean;
  /** §2.0.c settling-in reserve RELEASE (2.4.11.4b): set at the rollover where the reserve transitions
   *  held → free; a one-time insurance-framed acknowledgment. `tapped` = a surprise outflow drew on it
   *  during the hold window (`covered` = the sum). Cleared when the user dismisses the card. Optional +
   *  fallback-to-none, so older stores parse unchanged. */
  pendingReserveRelease?: { tapped: boolean; covered: number } | null;
  /** §2.0.c safety-net attestation (2.4.11.4c): the user confirmed their regular bills are all entered, so
   *  the Guardian holds a REDUCED discovery reserve (never skips — the floor still protects). Walked back
   *  (reset false) if a surprise outflow later proves the bills weren't complete. Optional/backfill-safe. */
  billsAttested?: boolean;
  /** §2.0.c attestation walk-back (2.4.11.4c): a surprise outflow arrived after the user attested → the
   *  hold was restored; a one-time notice. Cleared on dismiss. Optional/backfill-safe. */
  pendingReserveWalkback?: boolean | null;
  /** 3.8 — the expense reserve. ONE aggregate pot for the WHOLE recurring load (rent + utilities +
   *  subscriptions + …), never per-bill envelopes: the Expenses hero smooths every recurring expense into
   *  one per-paycheck figure, so a per-bill model would be wrong the first time two bills fall in one cycle.
   *
   *  ⚠️ `balance` deliberately does NOT clear at rollover — unlike `windfall`. Carrying across cycles IS
   *  the feature (set aside in cycle 1, spent in cycle 2); a cleared pot would be money the app took and
   *  never gave back. `contribution` is the opposite: cycle-KEYED like `cycleTopUp`, so a stale one
   *  self-corrects rather than re-holding cash in a cycle it was never meant for. It is held out of THIS
   *  cycle's spendable and folded into `balance` at rollover, net of what the cycle drew.
   *
   *  Optional + fallback-to-none, so a pre-3.8 blob parses unchanged and reads as "no pot" — which is
   *  exactly today's behaviour, the `absent ⇒ today's behaviour` rule Phase 5's migration relies on.
   *  No `storeVersion` bump: purely additive, merged by `runMigrations`'s `{...base, ...r}` (the v5 precedent). */
  expenseReserve?: ExpenseReserve;
}

/** 3.8 — see `DebtStore.expenseReserve`. */
export interface ExpenseReserve {
  /** Cash currently held for upcoming recurring expenses. Carries ACROSS cycles. Never negative. */
  balance: number;
  /** THIS cycle's set-aside, keyed by the cycle it belongs to (`paycheck.nextPaycheckDate`, matching
   *  `cycleTopUp.forCycle`). Absent / stale key ⇒ nothing held this cycle. */
  contribution?: { forCycle: string; amount: number };
}
