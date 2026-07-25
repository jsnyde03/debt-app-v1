import type { Recurrence } from "@core/types/recurrence";

export type RequiredExpenseCategory = 
	| "housing"
	| "utilities"
	| "insurance"
	| "subscriptions"
	| "medical"
	| "other";

export type RequiredExpense = {
	id: string;
	name: string;
	amount: number;
	dueDate: string;
	originalDueDate?: string;
	recurrence: Recurrence;
	isPaidThisCycle?: boolean;
	isAutopay?: boolean;
	// Set true when the user reports at the payday check-in that this autopay
	// did NOT go through. Keeps it owed (not auto-reconciled) until actually paid.
	autopayFailedThisCycle?: boolean;
	expenseType?: "fixed" | "variable";
	category?: RequiredExpenseCategory;

	// v1.7 Smart obligation quality (2.5) — trial / intro-price modeling. A subscription that bills
	// `amount` now (often $0 or a low intro) but JUMPS to `fullAmount` on `fullChargeDate`. Without this
	// the Guardian projects the intro price forever and under-reserves for the real charge. All optional /
	// backfill-safe (older blobs parse with these undefined — no migration, like `cycleTopUp`). `isTrial`
	// is the explicit capture flag (drives the UI toggle + the heuristic); `fullAmount`/`fullChargeDate`
	// are only meaningful when it is true.
	isTrial?: boolean;
	fullAmount?: number;
	fullChargeDate?: string;

	// v1.7 Recovery Plan (2.6) — the user's per-bill essential-vs-deferrable OVERRIDE. Absent → the
	// Recovery engine derives it from `category` (classifyDeferability). Only set when the user flips a
	// bill in the Recovery card, so it always wins over the category default. Optional / backfill-safe.
	deferability?: "essential" | "deferrable";
};

export type Debt = {
	id: string;
	name: string;
	balance: number;
	originalBalance?: number;
	minimumPayment: number;
	dueDate: string;
	originalDueDate?: string;
	apr: number;
	remainingPayments?: number;
	scheduledPaymentAmount?: number;
	// v1.7 BNPL first-class (2.7.3) — the plan's provider (Klarna/Affirm/Afterpay/PayPal/Zip/…),
	// captured for the row/pill + the consolidated BNPL calendar. Optional / backfill-safe; only
	// meaningful when `type === "bnpl"`.
	bnplProvider?: string;
	type: "debt" | "bnpl";
	recurrence: Recurrence;

	//legacy/backward compatibiity for saved data
	isPaidThisCycle?: boolean;

	minimumPaidThisCycle?: boolean;
	snowballPaidThisCycle?: boolean;
	isAutopay?: boolean;
	// See RequiredExpense.autopayFailedThisCycle.
	autopayFailedThisCycle?: boolean;

	// v1.7 Projection auto-maintenance (2.3) — TWO deliberately-separate dates:
	//
	// `balanceAsOfDate` = the projection ANCHOR: the date `balance` is current as-of. The premium
	//   "always-current" number is projected forward from (balance, balanceAsOfDate) to today. It
	//   advances whenever `balance` changes for ANY reason — a user verify/edit (=today) OR a payday
	//   rollover (=the cycle date). Advancing it at rollover is what stops the projection from
	//   re-applying a paydown the rollover already made (the double-count bug). Absent → treat as today.
	//
	// `lastVerifiedDate` = the last time the USER confirmed this balance against reality (a statement).
	//   Set ONLY by a user verify/correct/edit — NEVER by a rollover (a rollover is a computed estimate,
	//   not a verification). Drives the staleness "verify soon" prompt + the "verified {date}" label, so
	//   they mean "you last checked this on {date}", not "the app recomputed it." Absent = never
	//   user-confirmed (rolled-forward / legacy). `balance` still only moves on confirm/correct/rollover
	//   — never silently mid-cycle.
	balanceAsOfDate?: string;
	lastVerifiedDate?: string;
};

export type Goal = {
	id: string;
	name: string;
	targetAmount: number;
	currentAmount: number;
	type: "emergency" | "savings";
	// v1.7 §2.9 sinking fund — the user opted (with sign-off) to fund this savings goal BEFORE debt payoff
	// so a "ready by {date}" plan holds; the honest debt-free-date cost is shown at opt-in. Optional / backfill-safe.
	priority?: boolean;
};

export type RecommendationOverride = {
	targetId: string;
	category: "emergency" | "snowball";
	amount: number;
};

// A completed plan action the user marked done during a pay cycle.
// Mirrors the local type in app/page.tsx; declared here so it can be
// persisted inside a PayCycleSnapshot. Structurally identical, so the
// page can pass its array straight through.
// THE canonical CompletedRecommendedAction (the persisted shape). Every other
// module imports this one — do not redeclare a local copy. `page.tsx`
// (handleMarkRecommendedAction) is the sole write path and always populates the
// full shape, so `label`/`recommendedAmount` are non-optional invariants that
// readers can rely on; `paymentSource` is optional (absent = treated as paycheck).
// (v1.7 will relocate this to a neutral `lib/types/` layer — see decision #4.)
export type CompletedRecommendedAction = {
	targetId: string;
	label: string;
	category: "emergency" | "snowball" | "optional_goal";
	recommendedAmount: number;
	actualAmount: number;
	paymentSource?: "paycheck" | "external";
};

// v1.7 Payday Cushion Guardian (2.4.D) — the persisted substrate shapes.
// The Guardian's 3-band read (mirrors buildGuardianBrief's GuardianState; a
// self-contained persisted union, decoupled from the compute module).
export type GuardianBand = "clear" | "tight" | "at-risk";

// The Guardian's prediction for a cycle, stamped at cycle-START (§2.0.e / §3.2).
// Lives in-flight on the store (DebtStore.currentCyclePrediction) and is folded
// into the cycle's PayCycleSnapshot at rollover WITH the reconciled outcome — the
// snapshot itself is a historical end-of-cycle record, so the in-flight prediction
// cannot live on it (2.4.D.1 before-scan finding #2).
export type CyclePrediction = {
	// The cycle this prediction is FOR (matches the snapshot's cycleEndDate at rollover).
	forCycleEndDate: string;
	predictedCushion: number;
	predictedState: GuardianBand;
	predictedShortfall: number;
	// §2.0.e confidence context: which holdbacks / provisional flags were active at
	// stamp time, so the §2.9 scorecard can EXCLUDE / down-weight deliberately-cautious
	// reads instead of grading its own caution as a confident miss.
	predictedConfidenceContext: {
		discoveryHoldbackActive: boolean;
		coldStartHoldbackActive: boolean;
		provisional: boolean;
	};
	// The planned income this prediction assumed — captured here (not on the overwritten
	// PaycheckConfig) so predicted-vs-actual has real history (2.4.D.1 before-scan finding #1).
	plannedIncome: number;
	// Set true when the prediction was RE-STAMPED mid-cycle after a material change (2.4.D.4). Folded
	// into the snapshot's `disturbed` at rollover so the §2.9 scorecard excludes the cycle from N≥4.
	restampedMidCycle?: boolean;
	// §2.7 graduation (2.4.8): the prediction's TARGET regime — false while paying down debt (spare →
	// debt), true once debt-free (spare → EF / goals / wealth). The §2.9 scorecard reads this so a
	// debt-free→new-debt re-entry doesn't BLEND two different targets into one meaningless accuracy
	// number; the two regimes are graded separately. Optional → pre-2.4.8 predictions parse (default: debt).
	debtFree?: boolean;
	// §2.9 calibration (2.4.9): the cushion FLOOR at read time — stored so the scorecard can grade
	// "did the cushion hold at/above the line?" against the floor THAT prediction assumed (the user can
	// move their line later, so the current floor would misgrade history). Optional → pre-2.4.9 parse.
	floor?: number;
};

// The reconciled outcome of a cycle, captured at rollover against the prediction.
export type CycleOutcome = {
	actualIncome: number;
	actualCushionHeld: number;
	outcomeConfirmed: boolean;
};

// One per-paycheck income actual, paired with the income it was planned against.
// Per-PAYCHECK granularity (not per-cycle) so weekly earners with multiple paychecks
// per cycle keep a real series; `store.windfall` is excluded so a one-off can't inflate lean.
export type IncomeActual = {
	cycleEndDate: string;
	plannedIncome: number;
	actualIncome: number;
};

// An un-modeled outflow surfaced at a payday reconcile — the second half of the
// bill-completeness signal (§2.0.a), and the walk-back trigger for an over-confident
// "my bills are complete" attestation (§2.0.c).
export type SurpriseOutflow = {
	cycleEndDate: string;
	amount: number;
	note?: string;
};

// One frozen record of a pay cycle at the moment it rolled over.
// Written pre-rollover (before debts mutate / actions clear) so it
// captures where the user actually was when the cycle ended. Feeds Pay
// Cycle History, Streaks, and the Since-Last-Cycle delta indicator.
export type PayCycleSnapshot = {
	cycleEndDate: string;
	totalDebtBalance: number;
	// Total paid toward DEBT this cycle: required minimums paid + snowball extras.
	// (Formerly only the recommended-extras total, which excluded minimums and
	// included non-debt savings — a misleading "$X paid" in History.)
	totalPaidThisCycle: number;
	// Whether the user completed every required action they could AFFORD this
	// cycle — the Streak's "on plan" signal. Optional so snapshots persisted
	// before v1.5's required-based streak still load (default: on-plan, so a fix
	// never retroactively zeroes an existing streak).
	allRequiredMet?: boolean;
	// LEGACY (pre-v1.5 required-based streak): the recommended-contribution total.
	// No longer written or read; retained so old snapshots still parse.
	recommendedThisCycle?: number;
	completedRecommendedActions: CompletedRecommendedAction[];
	payoffStrategy: "snowball" | "avalanche";
	// v1.7 Guardian calibration (2.4.D): the cycle-start prediction folded in at rollover
	// + its reconciled outcome. Both optional so pre-v1.7 snapshots still parse; `disturbed`
	// marks a cycle whose prediction was re-stamped mid-cycle (excluded from the N≥4 count).
	prediction?: CyclePrediction;
	outcome?: CycleOutcome;
	disturbed?: boolean;
};

// localStorage key for the appended cycle-history array.
export const CYCLE_HISTORY_STORAGE_KEY = "debtPlanner.cycleHistory";