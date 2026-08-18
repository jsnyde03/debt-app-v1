import { combinedHoldback } from "@core/guardian/holdbackComposition";
import type { LivingExpense } from "@core/types/livingExpense";
import type { Recurrence } from "@core/types/recurrence";
import { toLocalISODate } from "@core/utils/localDate";

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
	/** §2.9 sinking-fund PACE — the most to put toward a priority goal per paycheck, so a chosen pace
	 *  ("$50/paycheck for 10 paychecks") is real, not greedily funded at once. Absent → no cap (funds as
	 *  fast as spare allows). Only meaningful with `priority`. */
	priorityPerPaycheck?: number;
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
	| "expense_reserve"    // 2b · 3.8 — cash the USER set aside this cycle for upcoming recurring bills
	                       //      (distinct from 2: the Guardian decides that one, the user decides this one)
	| "discovery_holdback" // 3 · the §2.0 uncertainty reserve
	| "starter_emergency"  // 4 · the gated starter EF
	| "emergency"          // 5 · the fuller EF
	| "snowball"           // 6 · debt (extra beyond minimums)
	| "optional_goal"      // 7 · goals
	| "true_leftover";     // 8 · genuine residual liquid cash

/** Displayed "protected" cushion = held/kept buckets (1+2+2b+3+8). NOT `cushion_buffer` alone (round-6
 *  F1: held reserves must count as cushion or "put to work" over-counts them).
 *  3.8: `expense_reserve` belongs here because it is money KEPT, not deployed — and the membership is not
 *  optional: `testGuardianPartition` reconciles PROTECTED + PUT_TO_WORK as EXHAUSTIVE of discretionary, so
 *  a category in neither list silently breaks the partition. */
export const PROTECTED_CUSHION_CATEGORIES = [
	"cushion_buffer",
	"prefunded_reserve",
	"expense_reserve",
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
	/** 3.8 — how much of this obligation the expense reserve already covers. `amount` is what THIS PAYCHECK
	 *  puts in; the biller is owed `amount + reserveCovered`. Any row rendering `amount` alone understates
	 *  the bill, so the two travel together. */
	reserveCovered?: number;
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
	/** 3.8 — the expense-reserve POT carried in from earlier cycles. Draws down against whatever falls
	 *  due THIS cycle, in due-date order, so the money set aside earlier actually reduces this cycle's
	 *  demand. 0 = no pot (every pre-3.8 caller). */
	expenseReservePot?: number;
	/** 3.8 — what the user chose to set aside from THIS paycheck. Held out of discretionary into
	 *  `expense_reserve`, AFTER the cushion floor, and clamped to what is actually left — a contribution
	 *  larger than the paycheck can spare must never invent money. 0 = nothing held. */
	expenseReserveContribution?: number;
};

/** ⚠️ Here a UTC round-trip would shift an expanded occurrence's due date by a day and therefore reorder
 *  the due-date sort below — i.e. silently change WHICH bill the 3.8 reserve pays. */
const localISODate = toLocalISODate;

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
	expenseReservePot = 0,
	expenseReserveContribution = 0,
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

	/**
	 * [A2] How many times does this obligation come due inside THIS pay cycle?
	 *
	 * The window is `[dueDate, nextPaycheckDate)`. A monthly bill under a monthly payer answers 1, which
	 * is what every caller assumed before this existed — but a WEEKLY bill under a monthly payer answers
	 * 4, and the allocator was reserving for one of them. That is not a rounding difference: the Guardian
	 * called a paycheck clear while three of the four occurrences were unfunded, and the user found out
	 * by going short.
	 *
	 * Counted by stepping the real calendar rather than dividing days by a nominal period, so months of
	 * different lengths and a cycle that straddles one behave correctly.
	 */
	const occurrencesThisCycle = (dueDate: string, recurrence: Recurrence): number => {
		if (!isDueBeforeNextPaycheck(dueDate)) return 0;
		// Cadences at or above the cycle length can only land once in it. Stepping them would be
		// harmless but pointless, and `one-time` must never repeat by definition.
		if (
			recurrence === "one-time" ||
			recurrence === "monthly" ||
			recurrence === "quarterly" ||
			recurrence === "annually"
		) {
			return 1;
		}

		const stepDays = recurrence === "weekly" ? 7 : 14; // biweekly and per-paycheck both step a fortnight
		const next = new Date(`${nextPaycheckDate}T00:00:00`);
		const cursor = new Date(`${dueDate}T00:00:00`);
		let count = 0;
		// A guard, not a limit: 60 fortnights is >2 years, so hitting it means the dates are nonsense
		// rather than that the loop needs to run longer.
		while (cursor < next && count < 60) {
			count++;
			cursor.setDate(cursor.getDate() + stepDays);
		}
		return count;
	};

	// [A2] Expanded into ONE ENTRY PER OCCURRENCE, deliberately, rather than by multiplying the amount.
	// Everything downstream — the unfunded-item list, the partial-coverage ordering, the affordable-skip
	// count — reads these as discrete items, and a single row carrying 4× the money would fund
	// "Groceries" all-or-nothing instead of one shop at a time.
	const upcomingExpenses = expenses
		.flatMap((expense) => {
			const times = occurrencesThisCycle(expense.dueDate, expense.recurrence);
			return Array.from({ length: times }, (_, i) => {
				if (i === 0) return expense;
				const when = new Date(`${expense.dueDate}T00:00:00`);
				when.setDate(when.getDate() + i * (expense.recurrence === "weekly" ? 7 : 14));
				// A distinct id per occurrence: `isPaidThisCycle` and the unfunded list are keyed by it,
				// so reusing the original would mark every occurrence paid when one of them was.
				return {
					...expense,
					id: `${expense.id}__occ${i}`,
					dueDate: localISODate(when),
				};
			});
		})
		.sort(
			(a, b) =>
				new Date(a.dueDate).getTime() -
				new Date(b.dueDate).getTime()
		);

	/**
	 * 3.8 — THE DRAW-DOWN. Money set aside in an earlier cycle is spent here, against whatever falls due
	 * now, across ALL categories. Rent is an example, never the case: the Expenses hero smooths the whole
	 * recurring load, so a per-bill model is wrong the first time two bills land in one cycle.
	 *
	 * ⚠️ The order is NOT invented here — it reuses `upcomingExpenses` exactly as built above: one entry
	 * per OCCURRENCE (a fortnightly bill is two draws) sorted by due date. Deriving a second order would
	 * let the reserve and the funding disagree about which bill got paid.
	 *
	 * ⚠️ Paid and unpaid occurrences draw alike. The pot was earmarked against the cycle's DEMAND, and
	 * skipping already-ticked bills would mean a user who pays early never discharges the pot — it would
	 * grow forever while they paid full price every cycle, which is the exact defect 3.8 exists to fix.
	 */
	let potRemaining = roundMoney(Math.max(0, expenseReservePot));
	const reserveDrawById = new Map<string, number>();
	for (const expense of upcomingExpenses) {
		if (potRemaining <= 0) break;
		const draw = roundMoney(Math.min(expense.amount, potRemaining));
		if (draw <= 0) continue;
		reserveDrawById.set(expense.id, draw);
		potRemaining = roundMoney(potRemaining - draw);
	}
	const expenseReserveDrawn = roundMoney(Math.max(0, expenseReservePot) - potRemaining);
	/** What this occurrence still needs FROM THIS PAYCHECK — its amount less whatever the pot covered.
	 *  Every expense figure below reads this, never `.amount`, so the demand drops exactly once. */
	const owedFromPaycheck = (expense: Expense) =>
		roundMoney(expense.amount - (reserveDrawById.get(expense.id) ?? 0));

	const upcomingMinimums = debts
		.filter((debt) => isDueBeforeNextPaycheck(debt.dueDate))
		.sort(
			(a, b) =>
				new Date(a.dueDate).getTime() -
				new Date(b.dueDate).getTime()
		);

	const expenseRequiredTotal = upcomingExpenses.reduce(
		(sum, expense) => sum + owedFromPaycheck(expense),
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
		.reduce((sum, expense) => sum + owedFromPaycheck(expense), 0);

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
		unpaidExpenses.reduce((sum, expense) => sum + owedFromPaycheck(expense), 0) +
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
		// 3.8: what this paycheck owes, i.e. net of the pot. A bill the pot covers in full owes 0 here —
		// it needs no allocation line, and it must not be counted as an affordable skip.
		const owed = owedFromPaycheck(expense);
		const coveredAmount = roundMoney(Math.min(owed, remaining));
		const unfundedAmount = roundMoney(owed - coveredAmount);

		// "Affordable and skipped" drives the on-plan streak. ⛔ 3.8: the old test was `coveredAmount > 0`,
		// which silently STOPS counting a bill the pot covers in full — `owed` is 0, so nothing is allocated
		// and the user banks an "on plan" cycle without paying rent. A pot-covered bill is the MOST
		// affordable kind: the money is already sitting there. What matters is that the obligation is fully
		// funded from somewhere and still unpaid, so the pot's share counts as funding like any other.
		const potShare = reserveDrawById.get(expense.id) ?? 0;
		if (!expense.isAutopay && unfundedAmount <= 0 && (coveredAmount > 0 || potShare > 0)) {
			affordableUnpaidRequiredCount += 1;
		}

		// ⛔ 3.8: `coveredAmount > 0` alone made a bill the pot covers IN FULL disappear. `owed` is 0, so
		// nothing was pushed, nothing landed in `unfundedRequiredItems` either — and the row vanished from
		// Today. The user could not tick a bill they still owe the biller, while it counted as an affordable
		// skip and quietly broke the streak, with no row on screen to explain why. `potShare > 0` keeps the
		// row, carrying `amount: 0` from this paycheck — which is the truth, not an absence.
		if (coveredAmount > 0 || potShare > 0) {
			allocations.push({
				label:
					coveredAmount === owed
						? expense.isAutopay
							? `Reserve autopay for ${expense.name}`
							: `Pay ${expense.name}`
						: expense.isAutopay
							? `Reserve autopay for ${expense.name} (partial)`
							: `Pay ${expense.name} (partial)`,
				amount: coveredAmount,
				category: expense.isAutopay ? "autopay_expense" : "expense",
				targetId: expense.id,
				...(potShare > 0 ? { reserveCovered: potShare } : {}),
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

	// 3.8 — THE HOLD. What the user chose to set aside from THIS paycheck for upcoming recurring bills.
	//
	// Placed AFTER `cushion_buffer` so the floor wins: reserving for next month's rent must never push the
	// user under the line they said they cannot go below. Placed BEFORE the §2.0 holdbacks so the user's
	// explicit choice takes precedence over the automatic dampener, which then applies to what is genuinely
	// left. ⚠️ Clamped to `remaining` — an offer sized against a different cycle (or an oversized manual
	// entry) must never invent money it can then "reserve".
	const expenseReserveHeld = roundMoney(
		Math.max(0, Math.min(expenseReserveContribution, Math.max(0, remaining)))
	);
	if (expenseReserveHeld > 0) {
		allocations.push({
			label: "Reserved for upcoming bills",
			amount: expenseReserveHeld,
			category: "expense_reserve",
		});
		remaining = roundMoney(remaining - expenseReserveHeld);
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
		// ⚠️ 3.8: deliberately reads GROSS `.amount`, not `owedFromPaycheck`. This buffer hedges a bill coming
		// in HIGHER than typed, and that swing is against the real bill — the pot having pre-paid part of it
		// does not shrink the overshoot. Netting it here would under-hold precisely when a variable bill
		// spikes, and under-holding a safety buffer is the worse of the two failures.
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
		// The per-paycheck pace cap (if any) keeps a chosen "$X/paycheck" plan real instead of greedy.
		const pace = goal.priorityPerPaycheck != null && goal.priorityPerPaycheck > 0 ? goal.priorityPerPaycheck : Infinity;
		const amount = roundMoney(Math.min(remaining, needed, pace));
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
		/** 3.8 — how much of the pot this cycle's obligations consumed. ⚠️ Deliberately NOT an
		 *  `AllocationItem`: the allocations partition THIS PAYCHECK, and the pot is not this paycheck's
		 *  money. Surfaced separately as "…covered by your reserve". */
		expenseReserveDrawn,
		/** 3.8 — what was ACTUALLY held, after the clamp against `remaining`. The rollover folds THIS,
		 *  never the requested contribution: one rule, one owner. Honouring the request instead would
		 *  credit the pot money the paycheck never had. */
		expenseReserveHeld,
		/** 3.8 — the pot after this cycle's draw, before the hold is folded in at rollover. */
		expenseReservePotAfterDraw: potRemaining,
	};
}
