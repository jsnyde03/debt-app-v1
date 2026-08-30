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
   * P6.3 — back the plan up to the app's private iCloud container. **[D47]: OPT-IN, default OFF**, which
   * is why this is optional rather than a `boolean` with a default: an existing blob migrates by simply
   * not having the key, and `undefined` must read as OFF everywhere. Readers compare `=== true` — a
   * truthiness check would be correct today and wrong the moment someone stores `'false'`.
   *
   * ⚠️ It lives in the STORE, so it travels inside the backup. That is deliberate and it is a real
   * trade: restoring on a new device carries the choice across (right — same person, same Apple ID,
   * same intent), but the flag is device-shaped and this is not a device-scoped store. Freedom kept the
   * equivalent in a separate device-prefs layer; Debt has no such layer, and inventing one for a single
   * boolean would be a second persistence path to keep correct. Revisit if a second device-shaped
   * preference ever appears.
   *
   * ⛔ Turning it ON is the only thing that makes financial data leave the device, so it is also the one
   * preference the privacy claim ([D41]) depends on. P6.9 verifies it.
   */
  cloudBackupEnabled?: boolean;
  /**
   * P6.8.7d.1 [B3] — the mtime of the iCloud backup **this install has accounted for**: one it wrote
   * itself, or one it restored from. Absent means "this install has never looked at the remote".
   *
   * ⛔ This is the ONLY thing in the app that reasons about the remote, and that gap is what B3 was.
   * Every guard before it — `shouldAutoBackup` included — reasoned purely about LOCAL state, so a
   * perfectly healthy local plan was always permission to overwrite whatever happened to be in iCloud.
   * R1 measured the fix both audit lenses proposed (route the toggle through `shouldAutoBackup`) and it
   * returns `true` at the moment of the flip, permitting the clobber anyway.
   *
   * ⚠️ **A backup blob can never contain its own mtime** — the value is only knowable after the write
   * that produced it. So the copy of this field that travels inside a backup is always one generation
   * stale, and every restore path MUST re-stamp it from the file it actually read. Not doing so leaves
   * the restored install unable to recognise the remote it just restored from, and its first background
   * would refuse to back up forever.
   */
  cloudBackupRemoteAt?: string;
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

/**
 * P6.8.7e.1 [B2/M2-5] — a debt that has just reached $0 and is owed its moment.
 *
 * ⛔ **The payload is captured at the CROSSING, not read back afterwards**, because by the time anything
 * renders, the numbers it wants are gone: the balance is zero, so `originalBalance` is the only record of
 * what was cleared, and *"what's next"* has to be computed against the debts that were still live at that
 * instant. The old in-component version got this right by capturing before it called the store; keeping
 * that property is why this is a stored payload and not a selector over the current state.
 */
export type PendingPayoff =
  | {
      kind: 'beat';
      debtName: string;
      /** ⛔ S1.9.2 [C3] — WHICH debt, so the trust guard can ask about THIS row's money rather than about
       *  the portfolio. The beat states two repairable figures (`amount` from `originalBalance`, `freed`
       *  from `minimumPayment`); gating it on a store-wide "any balance unread" would withhold a true
       *  beat over an unrelated debt, which is the over-match A1 was raised for. ⚠️ Optional so a blob
       *  stamped by an earlier build needs no version bump — absent means the guard cannot narrow, and it
       *  falls back to the portfolio-wide question, which is the safe direction. */
      debtId?: string;
      /** What the debt started at, when it was ever recorded. `null` renders the beat without a total. */
      amount: number | null;
      /** The minimum payment this payoff just freed up, every month, forever. */
      freed: number;
      /** The debt the plan attacks next, or `null` — see `kind: 'finale'` for when there is none left. */
      nextDebtName: string | null;
    }
  | { kind: 'finale' };

/**
 * 5.10 — a money field this build could not read, repaired to 0 and named so the app can ask the user
 * for one number instead of inventing it. ⛔ Never dropped silently: a $12,000 debt coerced to 0 without
 * a word renders as PAID OFF, which is the one outcome worse than a visible error.
 */
export interface DataRepair {
  /**
   * ⛔ `migration` is not an entity — it is the v1.6 bridge reporting what it could not carry (M3-20).
   * It shares this channel because the user's question is identical in both cases (*"what could the app
   * not read?"*), and two cards competing for one ack slot would answer it twice.
   */
  /**
   * ⛔ `goal` added at P6.8.9.7.2 [B1]. It was absent because goals were never repaired at all — and the
   * union having no member for them is the cleanest proof that the omission was structural rather than a
   * dropped line. `mapLegacyStore` carries `goals: 'goals'` straight across from v1.6.
   */
  entity: 'debt' | 'requiredExpense' | 'livingExpense' | 'goal' | 'migration';
  id: string;
  name: string;
  field: string;
  /**
   * ⛔ **THE ACK HIDES THE CARD; IT DOES NOT UN-REPAIR THE DATA — and conflating those shipped a false
   * statement about the user's money.** [P6.8.9.7.11.10 · A-J2-1] `acknowledgeDataRepairs` used to EMPTY
   * this list, and two guards read it to suppress a celebration over money the app could not read
   * (`money.tsx`'s `unreadDebts` and `unreadGoals`). The repaired `0`s are permanent and the list was not,
   * so one *"Got it"* tap restored **"Every balance cleared"** over debts still owed, and badged a
   * $0-target goal **Funded** — for the life of the install.
   *
   * ⚡ So the record survives the ack and carries the ack instead. The card filters on this; anything
   * asking *"is this number trustworthy"* reads the whole list and keeps working forever.
   * ⚠️ Optional and absent-means-false, so every stored blob backfills without a version bump.
   */
  acknowledged?: boolean;
  /**
   * ⛔ **`recovered` AND `lost` ARE NOT THE SAME EVENT, and one word covering both made the app state
   * something false about money it had read correctly.** [P6.8.9.7.11.12 · A-J2-2] `readMoney` repairs a
   * numeric string by stripping its grouping — `'4,000'` becomes `4000`, the real number — and repairs
   * anything else to `0`, which is a loss. Both used to arrive here identically, so the card said *"could
   * not be read · your plan is running without it"* over a goal that Money one tab away rendered at its
   * correct `$4,000`. The two screens contradicted each other and this one was wrong.
   *
   * ⚠️ Optional and absent-means-`lost`, so every stored blob backfills without a version bump — the same
   * shape as `acknowledged`. `lost` is the safe default: it is what every record written before this
   * existed meant.
   *
   * ⚠️ **The record is still not the right question for the priority stand-down**, which matches on the
   * VALUE — a store written by an earlier build carries a pace of `0` and no record at all. See
   * `migrations.ts`.
   */
  kind?: 'recovered' | 'lost';
  /**
   * ⛔ **HOW MANY LOSSES THIS RECORD STANDS FOR. [S1.12.5.3 · pass-5 `B5-1`]**
   *
   * ⚡ A whole-row loss has no id to key on — `repairMoneyFields` writes `id: ''`, because there was no
   * id to read — and `mergeRepairs` dedupes on `entity|id|field`. So **every row loss inside one entity
   * collapsed to a single record**, and the sentence shown one line above **Replace my data** counted
   * records. Measured: a backup holding **10 debts of which 9 were unreadable** produced *"⚠️ 1 whole row
   * in this backup could not be read"* — **byte-identical** to a file that lost exactly one. The reader
   * was told they were losing 1 row while losing 9, under *"It can't be undone"*, over a live portfolio.
   *
   * ⚠️ **The dedupe key is deliberately unchanged.** Dropping `id` from it — the obvious repair — makes
   * field-level repairs on different rows share `entity|field` and collapse, which breaks the *"9 amounts"*
   * count that works correctly today. The magnitude rides on the record instead, so one record still means
   * one card and the number survives the merge.
   *
   * ⚠️ Optional and absent-means-1, so every stored blob backfills without a version bump — the same shape
   * as `acknowledged` and `kind`.
   */
  count?: number;
}

/**
 * ⛔ S1.5.3 [B3] — WHICH one-tap move drew this money, and from where.
 *
 * The `source` is the whole point: two flows write to this cycle's record and each has its own Undo, so
 * an undo must be able to find ITS OWN entry rather than the last one written. Adding a member here
 * without giving that flow its own undo path is how this defect is re-created.
 */
export type CycleTopUpEntry = {
  source: 'guardian' | 'affordability';
  goalId: string;
  /** What actually LEFT the goal — clamped by its balance, not the amount requested. */
  amount: number;
};

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
  /**
   * 5.10 — money fields this launch could not read, repaired to 0 and reported so the app can ask for
   * one number instead of inventing it. ⛔ Derived on every read, never merged forward: it describes the
   * CURRENT blob, so a field the user has since fixed stops being reported.
   */
  dataRepairs: DataRepair[];
  /**
   * P6.8.7c.2 (audit B4/M3-2) — repairs the user has not been TOLD about yet, held until they acknowledge.
   *
   * ⛔ **`dataRepairs` above cannot do this job, and that is by design rather than by oversight.** It
   * describes the blob THIS read saw, so `repairsAreNotRepeated` guarantees a second pass reports nothing
   * — which means the list is gone the moment a save rewrites the store. The design assumed something
   * would consume it during that one pass; nothing ever did, so a debt repaired to `0` was filed under
   * `PAID OFF` with no word to anyone. This field is the durable half: it merges forward and only the
   * user's acknowledgement empties it.
   */
  pendingDataRepairs: DataRepair[];
  /** 3.3.2 — the highest portfolio %-paid milestone ever reached (25/50/75), so each celebrates once. */
  portfolioMaxProgress: number;
  /** 3.3.2 — a just-crossed portfolio milestone awaiting its ack; null when none / already acknowledged. */
  pendingMilestone: PendingMilestone | null;
  /**
   * P6.8.7e.1 [B2/M2-5] — a debt that just reached $0, awaiting its celebration.
   *
   * ⛔ **This field exists because the product's emotional terminus was unreachable for the majority
   * tier.** The beat and the finale rendered only from a `useState` inside Today, set only by
   * `confirmPayoff`, reached only from `PayoffInvitationCard`, offered only from
   * `selectProvisionalPayoffs` — which **returns `[]` for a free user**. A free user could pay off every
   * debt they owned and never see either. ⚠️ And `payday.ts` deliberately excludes the 100 % crossing
   * (*"finale owns debt-free"*), so the milestone engine had consciously vacated the only other watcher.
   *
   * ⛔ **The premium line is untouched, and this is the distinction the fix turns on.** Premium buys the
   * app *noticing* a payoff the user has not confirmed — that is `selectProvisionalPayoffs`, and it stays
   * premium because it removes WORK. The celebration is not work; it is the moment. It now fires from the
   * balance actually reaching zero, whoever is watching.
   *
   * ⚠️ Persisted, like `pendingMilestone` and unlike the `useState` it replaces — so a payoff confirmed
   * seconds before the app is backgrounded still gets its moment.
   */
  pendingPayoff: PendingPayoff | null;
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
  /**
   * ⛔ S1.5.3 [B3] — `entries` IS THE TRUTH; `amount` and `goalId` are the derived/legacy view.
   *
   * ONE record with ONE `goalId` served **two independent one-tap money moves** — the Guardian's tight
   * top-up and the affordability card's cover-a-dip — and it accumulated an amount while keeping only the
   * MOST RECENT source. Measured both ways, on the real store:
   *
   *  - **$70 teleports.** `pickTopUpGoal` returns the largest-balance funded goal, so once the Guardian's
   *    draw shrinks S1 the affordability flow picks S2. The record's `goalId` becomes S2, one Undo hands
   *    the whole $120 back to S2, and S1 is permanently $70 short. The aggregate conserves, which is
   *    exactly why nothing noticed.
   *  - **$50 is created from nothing.** With a single goal, both undos fire: the card's `undo()` reads
   *    `applied.cover` from COMPONENT STATE, never the store, so the Guardian having already reversed it
   *    is invisible. `amount` lands at **−50** and `appliedTopUp()`'s `Math.max(0, …)` hides it.
   *
   * ⚠️ Each entry records **what actually left the goal**, not what was asked for: the goal clamps at 0
   * and the record used not to, so a draw larger than the balance credited the cushion with money that
   * never moved.
   *
   * Backfill-safe. A pre-S1.5.3 blob has `amount`/`goalId` and no `entries`; `topUpEntries()` reads it as
   * a single `'guardian'` entry, which is the behaviour it already had. No migration — the record is
   * cycle-keyed, so a stale one reads as 0 regardless.
   */
  cycleTopUp?: { forCycle: string; amount: number; goalId?: string; entries?: CycleTopUpEntry[] };
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
