import type { PayCycle } from "@/lib/payCycle/getNextPaycheckDate";
import type { Recurrence } from "@/lib/types/recurrence";

export type RequiredExpense = {
	id: string;
	name: string;
	amount: number;
	dueDate: string;
	originalDueDate?: string;
	recurrence: Recurrence;
	isPaidThisCycle?: boolean;
	expenseType?: "fixed" | "variable";
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
};

export type Goal = {
	id: string;
	name: string;
	targetAmount: number;
	currentAmount: number;
	type: "emergency" | "savings";
};

export type SavedDebtPlannerState = {
	amount: string;
	payCycle: PayCycle;
	semiMonthlyFirstDay: string;
	semiMonthySecondDay: string;
	monthlyPayDay: string;
	expenses: RequiredExpense[];
	debt: Debt[];
	goals: Goal[];
};

const STORAGE_KEY = "debt-planner-v1";

export function loadDebtPlannerState(): SavedDebtPlannerState | null {
	const saved = localStorage.getItem(STORAGE_KEY);
	
	if (!saved) {
		return null;
	}
	
	try {
		return JSON.parse(saved) as SavedDebtPlannerState;
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		return null;
	}
}

export function saveDebtPlannerState(state: SavedDebtPlannerState) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}