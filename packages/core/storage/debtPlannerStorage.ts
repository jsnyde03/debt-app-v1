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
	type: "debt" | "bnpl";
	recurrence: Recurrence;

	//legacy/backward compatibiity for saved data
	isPaidThisCycle?: boolean;

	minimumPaidThisCycle?: boolean;
	snowballPaidThisCycle?: boolean;
	isAutopay?: boolean;
	// See RequiredExpense.autopayFailedThisCycle.
	autopayFailedThisCycle?: boolean;

	// v1.7 Projection auto-maintenance (2.3) — the trust anchor. `balance` is the
	// user's last VERIFIED balance as of this date; it moves only on confirm/correct,
	// never silently. The live "always-current" number shown to premium users is
	// projected forward from (balance, lastVerifiedDate) to today and always labelled
	// "estimated · verified {date}" (never presented as synced fact). Absent = legacy /
	// unverified (pre-v1.7 blobs; the v3 migration backfills it to the app's current date).
	lastVerifiedDate?: string;
};

export type Goal = {
	id: string;
	name: string;
	targetAmount: number;
	currentAmount: number;
	type: "emergency" | "savings";
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
};

// localStorage key for the appended cycle-history array.
export const CYCLE_HISTORY_STORAGE_KEY = "debtPlanner.cycleHistory";