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
};

export function allocatePaycheck({
	paycheckAmount,
	nextPaycheckDate,
	expenses,
	livingExpenses = [],
	debts,
	goals,
	strategy,
	paycheckBuffer = 50,
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

	const emergencyGoal = goals.find((goal) => goal.type === "emergency");

	if (
		emergencyGoal &&
		emergencyGoal.currentAmount < emergencyGoal.targetAmount &&
		remaining > 0
	) {
		const emergencyNeeded = roundMoney(
			emergencyGoal.targetAmount - emergencyGoal.currentAmount
		);

		const amount = roundMoney(Math.min(emergencyNeeded, remaining));

		allocations.push({
			label: `Add to ${emergencyGoal.name}`,
			amount,
			category: "emergency",
			targetId: emergencyGoal.id,
			goalId: emergencyGoal.id,
		});

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

	const savingsGoals = goals.filter(
		(goal) =>
			goal.type === "savings" && goal.currentAmount < goal.targetAmount
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
