import { combinedHoldback } from "@core/guardian/holdbackComposition";
import type { LivingExpense } from "@core/types/livingExpense";
import type { Recurrence } from "@core/types/recurrence";

export type Expense = {
	id: string;
	name: string;
	amount: number;
	dueDate: string;
	recurrence: Recurrence;
	isPaidThisCycle?: boolean;
	isAutopay?: boolean;
	/** §2.5 — a `variable` obligation swings month to month, so the Guardian holds a small buffer for it
	 *  (see `variableBillBufferFraction`). Absent/`"fixed"` → no buffer. */
	expenseType?: "fixed" | "variable";
};

export type Debt = {
	id: string;
	name: string;
	balance: number;
	minimumPayment: number;
	apr: number;
	dueDate: string;
	type: "debt" | "bnpl";
	recurrence: Recurrence;
	isPaidThisCycle?: boolean;
	minimumPaidThisCycle?: boolean;
	snowballPaidThisCycle?: boolean;
	isAutopay?: boolean;
};

export type Goal = {
	id: string;
	name: string;
	targetAmount: number;
	currentAmount: number;
	type: "emergency" | "savings";
	/** §2.9 sinking fund — the user chose (with sign-off, seeing the debt-free-date cost) to fund this
	 *  savings goal BEFORE debt payoff, so its "ready by" date holds. Absent → funds after debt (normal). */
	priority?: boolean;
};

// v1.7 §2.2 canonical partition (2.4.6.1.1) — the ONE bucket set every selector, bar zone, and
// reconciliation test derives from. The old single `leftover` (which conflated the reserved buffer
// and the true residual → the F3 "cushion lie") is split into `cushion_buffer` + `true_leftover`,
// and the held/gated buckets are added. `prefunded_reserve` (fed by the §2.5 water-fill, 2.4.7),
// `discovery_holdback` (fed by §2.0's deriveConfidenceContext, 2.4.6.1.3), and `starter_emergency`
// (the gated starter EF, 2.4.7) are declared here but stay $0 until their producer lands.
export type AllocationCategory =
	| "expense"
	| "minimum_debt"
	| "autopay_expense"
	| "autopay_debt"
	| "cushion_buffer"     // 1 · the reserved floor
	| "prefunded_reserve"  // 2 · cash held this cycle for a specific future crunch (§2.5)
	| "discovery_holdback" // 3 · the §2.0 uncertainty reserve
	| "starter_emergency"  // 4 · the gated starter EF
	| "emergency"          // 5 · the fuller EF
	| "snowball"           // 6 · debt (extra beyond minimums)
	| "optional_goal"      // 7 · goals
	| "true_leftover";     // 8 · genuine residual liquid cash

/** Displayed "protected" cushion = held/kept buckets (1+2+3+8). NOT `cushion_buffer` alone (round-6
 *  F1: held reserves must count as cushion or "put to work" over-counts them). */
export const PROTECTED_CUSHION_CATEGORIES = [
	"cushion_buffer",
	"prefunded_reserve",
	"discovery_holdback",
	"true_leftover",
] as const satisfies readonly AllocationCategory[];

/** "Put to work" = actual EF / debt / goals (buckets 4–7). */
export const PUT_TO_WORK_CATEGORIES = [
	"starter_emergency",
	"emergency",
	"snowball",
	"optional_goal",
] as const satisfies readonly AllocationCategory[];

export type AllocationItem = {
	label: string;
	amount: number;
	category: AllocationCategory;
	targetId?: string;
	debtId?: string;
	goalId?: string;
};

export type UnfundedRequiredItem = {
	label: string;
	amount: number;
	category: "expense" | "minimum_debt" | "autopay_expense" | "autopay_debt";
	debtId?: string;
};

type AllocatePaycheckParams = {
	paycheckAmount: number;
	currentDate: string;
	nextPaycheckDate: string;
	expenses: Expense[];
	livingExpenses?: LivingExpense[];
	debts: Debt[];
	goals: Goal[];
	strategy: "snowball" | "avalanche";
	paycheckBuffer?: number;
	/** §2.0.b uncertainty holdback (2.4.6.1.3) — fraction of above-floor headroom held back from
	 *  deploy while bill-completeness is unproven. 0 = no hold (free tier / proven). */
	discoveryHoldbackFraction?: number;
	/** §2.0.b cold-start holdback — fraction held while a variable-income lean is unverified. 0 for
	 *  fixed income / confirmed. Composes with discovery by `max`, not sum. */
	coldStartHoldbackFraction?: number;
	/** §2.5 variable-bill buffer fraction (2.5.3b) — fraction of THIS cycle's `variable`-flagged
	 *  obligations held as extra cushion against a higher-than-typed bill. 0 = no buffer (free / no
	 *  variable bills). Composed into the uncertainty holdback by `max`, so it's never stacked on the
	 *  §2.0 discovery reserve. */
	variableBillBufferFraction?: number;
	/** §2.5 prefunded reserve (2.4.7) — cash earmarked THIS cycle for a specific future crunch. Adds
	 *  to the hold (a real dated need), clamped so the held buckets never exceed headroom. */
	prefundedReserve?: number;
	/** §2.5 starter-EF cap (2.4.7.6) — the emergency-fund tranche funded BEFORE debt payoff (the rest
	 *  funds after). Capped at the goal's target. Default `STARTER_EMERGENCY_TARGET`. */
	starterEmergencyTarget?: number;
	/** §2.5 D5.3 gate (2.4.7.6) — the user has an emergency buffer elsewhere, so skip the pre-debt
	 *  starter EF and deploy to debt first (the fuller EF still funds after debt). */
	skipStarterEmergency?: boolean;
};

/** §2.5 default starter emergency-fund target (2.4.7.6) — the small buffer built before aggressive debt
 *  payoff (the standard sequence). [BUILD]-tunable, Phase 6. */
export const STARTER_EMERGENCY_TARGET = 1000;

/** Clamp a fraction to [0, 1] — a bad upstream value must degrade to "no hold", never a negative/>100%. */
function clampFraction(f: number): number {
	return Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0;
}

export function allocatePaycheck({
	paycheckAmount,
	nextPaycheckDate,
	expenses,
	livingExpenses = [],
	debts,
	goals,
	strategy,
	paycheckBuffer = 50,
	discoveryHoldbackFraction = 0,
	coldStartHoldbackFraction = 0,
	variableBillBufferFraction = 0,
	prefundedReserve = 0,
	starterEmergencyTarget = STARTER_EMERGENCY_TARGET,
	skipStarterEmergency = false,
}: AllocatePaycheckParams) {
	const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

	let remaining = roundMoney(paycheckAmount);

	const allocations: AllocationItem[] = [];
	const unfundedRequiredItems: UnfundedRequiredItem[] = [];

	// Count required actions the paycheck could FULLY cover but that are still
	// unpaid — i.e. affordable and skipped. Drives the Streak: "on plan" means
	// the user completed everything they could afford. Autopay items are excluded
	// (they pay automatically, so a missing manual tap isn't a skip). A partially
	// covered item is NOT counted (a binary bill can't be half-paid, so it's
	// forgiven as unaffordable).
	let affordableUnpaidRequiredCount = 0;

	const isDueBeforeNextPaycheck = (dueDate: string) => {
		const due = new Date(`${dueDate}T00:00:00`);
		const next = new Date(`${nextPaycheckDate}T00:00:00`);

		// A pay cycle runs [payday, next payday): a bill due on the next payday is
		// covered by that paycheck, so it belongs to the next cycle, not this one.
		return due < next;
	};

	const upcomingExpenses = expenses
		.filter((expense) => isDueBeforeNextPaycheck(expense.dueDate))
		.sort(
			(a, b) =>
				new Date(a.dueDate).getTime() -
				new Date(b.dueDate).getTime()
		);

	const upcomingMinimums = debts
		.filter((debt) => isDueBeforeNextPaycheck(debt.dueDate))
		.sort(
			(a, b) =>
				new Date(a.dueDate).getTime() -
				new Date(b.dueDate).getTime()
		);

	const expenseRequiredTotal = upcomingExpenses.reduce(
		(sum, expense) => sum + expense.amount,
		0
	);

	const debtMinimumRequiredTotal = upcomingMinimums.reduce(
		(sum, debt) => sum + Math.min(debt.minimumPayment, debt.balance),
		0
	);

	const totalRequired = roundMoney(
		expenseRequiredTotal + debtMinimumRequiredTotal
	);

	const livingExpenseReserve = roundMoney(
		livingExpenses
			.filter((expense) => expense.enabled)
			.reduce((sum, expense) => sum + expense.amount, 0)
	);

	const paidExpenseTotal = upcomingExpenses
		.filter((expense) => expense.isPaidThisCycle)
		.reduce((sum, expense) => sum + expense.amount, 0);

	const paidDebtMinimumTotal = upcomingMinimums
		.filter((debt) => debt.minimumPaidThisCycle ?? debt.isPaidThisCycle)
		.reduce(
			(sum, debt) => sum + Math.min(debt.minimumPayment, debt.balance),
			0
		);

	const paidRequiredTotal = roundMoney(
		paidExpenseTotal + paidDebtMinimumTotal
	);

	remaining = roundMoney(
		Math.max(0, remaining - paidRequiredTotal - livingExpenseReserve)
	);

	const unpaidExpenses = upcomingExpenses.filter(
		(expense) => !expense.isPaidThisCycle
	);

	const unpaidMinimums = upcomingMinimums.filter(
		(debt) => !(debt.minimumPaidThisCycle ?? debt.isPaidThisCycle)
	);

	const unpaidRequiredTotal = roundMoney(
		unpaidExpenses.reduce((sum, expense) => sum + expense.amount, 0) +
		unpaidMinimums.reduce(
			(sum, debt) => sum + Math.min(debt.minimumPayment, debt.balance),
			0
		)
	);

	const shortfall = roundMoney(Math.max(0, unpaidRequiredTotal - remaining));

	const paidTowardDebt = (debtId: string) => {
		const debt = upcomingMinimums.find((item) => item.id === debtId);

		const alreadyPaidMinimum =
			debt?.minimumPaidThisCycle ?? debt?.isPaidThisCycle ?? false;

		const paidMinimumAmount =
			alreadyPaidMinimum && debt
				? Math.min(debt.minimumPayment, debt.balance)
				: 0;

		const allocatedAmount = allocations
			.filter(
				(item) =>
					item.debtId === debtId &&
					(item.category === "minimum_debt" ||
						item.category === "autopay_debt" ||
						item.category === "snowball")
			)
			.reduce((sum, item) => sum + item.amount, 0);

		return roundMoney(paidMinimumAmount + allocatedAmount);
	};

	for (const expense of unpaidExpenses) {
		const coveredAmount = roundMoney(Math.min(expense.amount, remaining));
		const unfundedAmount = roundMoney(expense.amount - coveredAmount);

		if (!expense.isAutopay && coveredAmount > 0 && unfundedAmount <= 0) {
			affordableUnpaidRequiredCount += 1;
		}

		if (coveredAmount > 0) {
			allocations.push({
				label:
					coveredAmount === expense.amount
						? expense.isAutopay
							? `Reserve autopay for ${expense.name}`
							: `Pay ${expense.name}`
						: expense.isAutopay
							? `Reserve autopay for ${expense.name} (partial)`
							: `Pay ${expense.name} (partial)`,
				amount: coveredAmount,
				category: expense.isAutopay ? "autopay_expense" : "expense",
				targetId: expense.id,
			});

			remaining = roundMoney(remaining - coveredAmount);
		}

		if (unfundedAmount > 0) {
			unfundedRequiredItems.push({
				label:
					coveredAmount > 0
						? expense.isAutopay
							? `Finish autopay reserve for ${expense.name}`
							: `Finish ${expense.name}`
						: expense.isAutopay
							? `Reserve autopay for ${expense.name}`
							: `Pay ${expense.name}`,
				amount: unfundedAmount,
				category: expense.isAutopay ? "autopay_expense" : "expense",
			});
		}
	}

	for (const debt of unpaidMinimums) {
		const remainingDebtBalance = roundMoney(
			Math.max(0, debt.balance - paidTowardDebt(debt.id))
		);

		const requiredMinimum = roundMoney(
			Math.min(debt.minimumPayment, remainingDebtBalance)
		);

		const coveredAmount = roundMoney(Math.min(requiredMinimum, remaining));
		const unfundedAmount = roundMoney(requiredMinimum - coveredAmount);

		if (!debt.isAutopay && coveredAmount > 0 && unfundedAmount <= 0) {
			affordableUnpaidRequiredCount += 1;
		}

		if (coveredAmount > 0) {
			allocations.push({
				label:
					coveredAmount === requiredMinimum
						? debt.isAutopay
							? `Reserve autopay minimum for ${debt.name}`
							: `Pay minimum on ${debt.name}`
						: debt.isAutopay
							? `Reserve autopay minimum for ${debt.name} (partial)`
							: `Pay minimum on ${debt.name} (partial)`,
				amount: coveredAmount,
				category: debt.isAutopay ? "autopay_debt" : "minimum_debt",
				targetId: debt.id,
				debtId: debt.id,
			});

			remaining = roundMoney(remaining - coveredAmount);
		}

		if (unfundedAmount > 0) {
			unfundedRequiredItems.push({
				label:
					coveredAmount > 0
						? debt.isAutopay
							? `Reserve remaining autopay minimum for ${debt.name}`
							: `Pay remaining minimum on ${debt.name}`
						: debt.isAutopay
							? `Reserve autopay minimum for ${debt.name}`
							: `Pay minimum on ${debt.name}`,
				amount: unfundedAmount,
				category: debt.isAutopay ? "autopay_debt" : "minimum_debt",
				debtId: debt.id,
			});
		}
	}

	if (shortfall === 0 && remaining > 0 && paycheckBuffer > 0) {
		const amount = roundMoney(Math.min(paycheckBuffer, remaining));

		allocations.push({
			label: "Keep cash buffer",
			amount,
			category: "cushion_buffer",
		});

		remaining = roundMoney(remaining - amount);
	}

	// §2.0.b uncertainty holdback (2.4.6.1.3): with the floor already reserved, `remaining` IS the
	// above-floor headroom. While bill-completeness / a variable lean are unproven, hold a fraction of
	// it back BEFORE any deploy (EF / snowball / goals), so the whole plan is dampened — not just the
	// engine's snowball line. The held cash stays PROTECTED cushion (`discovery_holdback` is a protected
	// bucket), never "put to work". `combinedHoldback` clamps it so buckets 1+2+3 can never over-sum the
	// headroom (round-6 F1). All fractions default 0 → this is inert until §2.0 feeds it (free stays 0).
	if (shortfall === 0 && remaining > 0) {
		// §2.5 variable-bill buffer (2.5.3b): a fraction of THIS cycle's variable-flagged obligations,
		// held as extra cushion so a higher-than-typed bill doesn't breach the floor. An absolute (off the
		// bill amounts, not headroom), composed into the uncertainty `max` below — folded into the cushion,
		// never stacked on the discovery reserve.
		const variableBuffer = roundMoney(
			upcomingExpenses
				.filter((expense) => expense.expenseType === "variable")
				.reduce((sum, expense) => sum + expense.amount, 0) * clampFraction(variableBillBufferFraction)
		);
		const held = roundMoney(
			combinedHoldback({
				prefundedReserve: Math.max(0, prefundedReserve),
				discoveryHoldback: roundMoney(remaining * clampFraction(discoveryHoldbackFraction)),
				coldStartHoldback: roundMoney(remaining * clampFraction(coldStartHoldbackFraction)),
				variableBuffer,
				discretionary: remaining,
				floor: 0,
			})
		);

		// §2.5 waterfall: the held reserve splits into its two canonical buckets (2.4.7.6) — the pre-funded
		// reserve (a dated future need, §2.5) comes FIRST and gets its own bucket + framing; the §2.0
		// uncertainty reserve is the remainder. `prefunded WINS` the clamp collision, so this ordering
		// matches `combinedHoldback`. Both are protected cushion (never "put to work").
		const prefunded = roundMoney(Math.max(0, Math.min(prefundedReserve, remaining)));
		const uncertainty = roundMoney(Math.max(0, held - prefunded));

		if (prefunded > 0) {
			allocations.push({ label: "Held for an upcoming tight cycle", amount: prefunded, category: "prefunded_reserve" });
			remaining = roundMoney(remaining - prefunded);
		}
		if (uncertainty > 0) {
			// MF.7 — "Safety net" (the user-facing term) is honest for BOTH the temporary cold-start reserve
			// AND the permanent variable-bill buffer that composes into this bucket; "Settling-in" mislabeled
			// the latter once discovery decayed.
			allocations.push({ label: "Safety net", amount: uncertainty, category: "discovery_holdback" });
			remaining = roundMoney(remaining - uncertainty);
		}
	}

	const emergencyGoal = goals.find((goal) => goal.type === "emergency");

	// §2.5 waterfall (2.4.7.6): a small STARTER emergency fund funds BEFORE debt payoff (the standard
	// sequence — a buffer first, then attack debt, then finish the fund). Capped at `starterEmergencyTarget`
	// so a big EF goal can't stall debt for months. Skipped when the user has savings elsewhere (D5.3 gate)
	// → deploy straight to debt. Tracked so the fuller-EF rung (after debt) funds only the remainder.
	let starterEmergencyFunded = 0;
	if (emergencyGoal && !skipStarterEmergency && remaining > 0) {
		const starterCap = roundMoney(Math.min(Math.max(0, starterEmergencyTarget), emergencyGoal.targetAmount));
		const starterNeeded = roundMoney(Math.max(0, starterCap - emergencyGoal.currentAmount));
		const amount = roundMoney(Math.min(starterNeeded, remaining));

		if (amount > 0) {
			allocations.push({
				label: `Add to ${emergencyGoal.name}`,
				amount,
				category: "starter_emergency",
				targetId: emergencyGoal.id,
				goalId: emergencyGoal.id,
			});
			remaining = roundMoney(remaining - amount);
			starterEmergencyFunded = amount;
		}
	}

	// §2.9 sinking funds (priority goals): a savings goal the user chose to PRIORITIZE over debt (with
	// sign-off, having seen the debt-free-date cost) funds BEFORE the snowball, capped at its target — like
	// the starter-EF — so its "ready by {date}" promise holds. A non-priority savings goal still funds
	// AFTER debt (below). Opt-in per goal; absent `priority` → unchanged behavior.
	for (const goal of goals) {
		if (remaining <= 0) break;
		if (goal.priority !== true || goal.type !== "savings" || goal.currentAmount >= goal.targetAmount) continue;
		const needed = roundMoney(goal.targetAmount - goal.currentAmount);
		const amount = roundMoney(Math.min(remaining, needed));
		if (amount <= 0) continue;
		allocations.push({ label: `Add to ${goal.name}`, amount, category: "optional_goal", targetId: goal.id, goalId: goal.id });
		remaining = roundMoney(remaining - amount);
	}

	const sortedSnowballDebts = debts
		.filter((debt) => debt.balance - paidTowardDebt(debt.id) > 0)
		.sort((a, b) => {
			if (strategy === "avalanche") {
				return b.apr - a.apr;
			}

			return (
				a.balance -
				paidTowardDebt(a.id) -
				(b.balance - paidTowardDebt(b.id))
			);
		});

	for (const debt of sortedSnowballDebts) {
		if (remaining <= 0) break;

		const remainingDebtBalance = roundMoney(
			debt.balance - paidTowardDebt(debt.id)
		);

		const amount = roundMoney(Math.min(remaining, remainingDebtBalance));

		if (amount <= 0) continue;

		allocations.push({
			label: `Extra payment to ${debt.name}`,
			amount,
			category: "snowball",
			targetId: debt.id,
			debtId: debt.id,
		});

		remaining = roundMoney(remaining - amount);
	}

	// §2.5 fuller EF (2.4.7.6): finish the emergency goal AFTER debt payoff — the remainder beyond the
	// starter tranche already funded this cycle. `effectiveCurrent` = the goal's current + the starter
	// just added, so the two rungs never over-fund past the target.
	if (emergencyGoal && remaining > 0) {
		const effectiveCurrent = roundMoney(emergencyGoal.currentAmount + starterEmergencyFunded);
		const fullerNeeded = roundMoney(Math.max(0, emergencyGoal.targetAmount - effectiveCurrent));
		const amount = roundMoney(Math.min(fullerNeeded, remaining));

		if (amount > 0) {
			allocations.push({
				label: `Add to ${emergencyGoal.name}`,
				amount,
				category: "emergency",
				targetId: emergencyGoal.id,
				goalId: emergencyGoal.id,
			});
			remaining = roundMoney(remaining - amount);
		}
	}

	const savingsGoals = goals.filter(
		(goal) =>
			// §2.9: priority sinking funds already funded BEFORE debt (above) — exclude them here so they
			// aren't double-funded.
			goal.priority !== true && goal.type === "savings" && goal.currentAmount < goal.targetAmount
	);

	for (const goal of savingsGoals) {
		if (remaining <= 0) break;

		const needed = roundMoney(goal.targetAmount - goal.currentAmount);
		const amount = roundMoney(Math.min(remaining, needed));

		if (amount <= 0) continue;

		allocations.push({
			label: `Optional contribution to ${goal.name}`,
			amount,
			category: "optional_goal",
			targetId: goal.id,
			goalId: goal.id,
		});

		remaining = roundMoney(remaining - amount);
	}

	if (remaining > 0) {
		allocations.push({
			label: "Leftover cash",
			amount: roundMoney(remaining),
			category: "true_leftover",
		});
	}

	return {
		paycheckAmount,
		allocations,
		unfundedRequiredItems,
		remaining: roundMoney(remaining),
		totalRequired,
		livingExpenseReserve,
		shortfall,
		affordableUnpaidRequiredCount,
	};
}
