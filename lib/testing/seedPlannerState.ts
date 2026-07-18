import type { PayCycle } from "@/lib/payCycle/getNextPaycheckDate";
import type { LivingExpense } from "@core/types/livingExpense";
import type { CompletedRecommendedAction, Debt, RequiredExpense } from "@/lib/storage/debtPlannerStorage";

export type DemoPlannerGoal = {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    originalCurrentAmount?: number;
    type: "emergency" | "savings";
};

export type DemoPlannerState = {
    amount: string;
    payCycle: PayCycle;
    currentDate: string;
    nextPaycheckDate: string;
    semiMonthlyFirstDay: string;
    semiMonthlySecondDay: string;
    monthlyPayDay: string;
    requiredExpenses: RequiredExpense[];
    livingExpenses: LivingExpense[];
    debts: Debt[];
    goals: DemoPlannerGoal[];
    completedRecommendedActions: CompletedRecommendedAction[];
    payoffStrategy: "snowball" | "avalanche";
    darkMode: boolean;
};

// Day offsets are relative to "today" at the moment demo data is applied, not
// hardcoded calendar dates - this is real, user-facing sample data (not just a
// dev tool anymore), so it needs to look current whenever someone taps it.
const CURRENT_DATE_OFFSET = 0;
const NEXT_PAYCHECK_OFFSET = 14;

function addDays(base: Date, days: number) {
    const result = new Date(base);
    result.setDate(result.getDate() + days);
    return result.toISOString().slice(0, 10);
}

export function buildDemoPlannerState(today: Date = new Date()): DemoPlannerState {
    const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    return {
        amount: "1950",
        payCycle: "biweekly",
        currentDate: addDays(anchor, CURRENT_DATE_OFFSET),
        nextPaycheckDate: addDays(anchor, NEXT_PAYCHECK_OFFSET),
        semiMonthlyFirstDay: "1",
        semiMonthlySecondDay: "15",
        monthlyPayDay: "1",

        requiredExpenses: [
            {
                id: "expense-cell-phone",
                name: "Cell Phone",
                amount: 330.41,
                dueDate: addDays(anchor, 2),
                originalDueDate: addDays(anchor, 2),
                recurrence: "monthly",
                expenseType: "fixed",
                isPaidThisCycle: false,
            },
            {
                id: "expense-capcut",
                name: "Streaming Subscription",
                amount: 20,
                dueDate: addDays(anchor, 3),
                originalDueDate: addDays(anchor, 3),
                recurrence: "monthly",
                expenseType: "fixed",
                isPaidThisCycle: false,
            },
            {
                id: "expense-electric",
                name: "Electric",
                amount: 145.32,
                dueDate: addDays(anchor, 7),
                originalDueDate: addDays(anchor, 7),
                recurrence: "monthly",
                expenseType: "variable",
                isPaidThisCycle: true,
            },
            {
                id: "expense-internet",
                name: "Internet",
                amount: 89.99,
                dueDate: addDays(anchor, 11),
                originalDueDate: addDays(anchor, 11),
                recurrence: "monthly",
                expenseType: "fixed",
                isPaidThisCycle: false,
            },
        ],

        livingExpenses: [
            {
                id: "living-groceries",
                name: "Groceries",
                amount: 250,
                enabled: true,
            },
            {
                id: "living-transportation",
                name: "Gas / Transportation",
                amount: 120,
                enabled: true,
            },
            {
                id: "living-dining",
                name: "Dining / Takeout",
                amount: 80,
                enabled: false,
            },
            {
                id: "living-household",
                name: "Household",
                amount: 60,
                enabled: true,
            },
            {
                id: "living-misc",
                name: "Misc Spending",
                amount: 100,
                enabled: false,
            },
        ],

        debts: [
            {
                id: "debt-paypal-underground",
                name: "PayPal Credit - Electronics",
                balance: 600,
                originalBalance: 600,
                minimumPayment: 30.15,
                apr: 24.99,
                dueDate: addDays(anchor, 1),
                originalDueDate: addDays(anchor, 1),
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
                minimumPaidThisCycle: false,
                snowballPaidThisCycle: false,
            },
            {
                id: "debt-klarna-arbys",
                name: "Klarna - Online Order",
                balance: 56.09,
                originalBalance: 56.09,
                minimumPayment: 18.7,
                apr: 0,
                dueDate: addDays(anchor, 5),
                originalDueDate: addDays(anchor, 5),
                type: "bnpl",
                recurrence: "monthly",
                isPaidThisCycle: false,
                minimumPaidThisCycle: false,
                snowballPaidThisCycle: false,
            },
            {
                id: "debt-capital-one",
                name: "Capital One Platinum",
                balance: 1420,
                originalBalance: 1420,
                minimumPayment: 75,
                apr: 29.99,
                dueDate: addDays(anchor, 8),
                originalDueDate: addDays(anchor, 8),
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
                minimumPaidThisCycle: false,
                snowballPaidThisCycle: false,
            },
            {
                id: "debt-affirm-long-name",
                name: "Affirm - Furniture & Home Office Setup",
                balance: 315.44,
                originalBalance: 315.44,
                minimumPayment: 42.5,
                apr: 15.99,
                dueDate: addDays(anchor, 10),
                originalDueDate: addDays(anchor, 10),
                type: "bnpl",
                recurrence: "monthly",
                isPaidThisCycle: false,
                minimumPaidThisCycle: false,
                snowballPaidThisCycle: false,
            },
        ],

        goals: [
            {
                id: "goal-emergency",
                name: "Emergency Fund",
                targetAmount: 1000,
                currentAmount: 325,
                originalCurrentAmount: 250,
                type: "emergency",
            },
            {
                id: "goal-car-repair",
                name: "Car Repair Buffer",
                targetAmount: 750,
                currentAmount: 100,
                originalCurrentAmount: 100,
                type: "savings",
            },
        ],

        completedRecommendedActions: [
            {
                targetId: "goal-emergency",
                label: "Add to Emergency Fund",
                category: "emergency",
                recommendedAmount: 75,
                actualAmount: 75,
            },
        ],

        payoffStrategy: "snowball",
        darkMode: false,
    };
}

export function applyDemoPlannerStateToStorage(storage: Storage) {
    const demoPlannerState = buildDemoPlannerState();

    // Demo Mode is a DATA showcase, not a theme override. Capture whatever theme
    // preference the user already has so it survives the reset below — if they
    // never chose one, useDarkMode has already persisted "system", so preserving
    // the key makes demo load on Auto/System (following the OS) instead of being
    // forced to light. (buildDemoPlannerState().darkMode stays boolean only for
    // deterministic screenshot seeds; it is intentionally NOT applied here.)
    const existingTheme = storage.getItem("debtPlanner.darkMode");

    storage.clear();

    storage.setItem("debtPlanner.amount", JSON.stringify(demoPlannerState.amount));
    storage.setItem("debtPlanner.payCycle", JSON.stringify(demoPlannerState.payCycle));
    storage.setItem("debtPlanner.currentDate", JSON.stringify(demoPlannerState.currentDate));
    storage.setItem("debtPlanner.nextPaycheckDate", JSON.stringify(demoPlannerState.nextPaycheckDate));
    storage.setItem("debtPlanner.semiMonthlyFirstDay", JSON.stringify(demoPlannerState.semiMonthlyFirstDay));
    storage.setItem("debtPlanner.semiMonthlySecondDay", JSON.stringify(demoPlannerState.semiMonthlySecondDay));
    storage.setItem("debtPlanner.monthlyPayDay", JSON.stringify(demoPlannerState.monthlyPayDay));

    storage.setItem("debtPlanner.requiredExpenses", JSON.stringify(demoPlannerState.requiredExpenses));
    storage.setItem("debtPlanner.livingExpenses", JSON.stringify(demoPlannerState.livingExpenses));
    storage.setItem("debtPlanner.debts", JSON.stringify(demoPlannerState.debts));
    storage.setItem("debtPlanner.goals", JSON.stringify(demoPlannerState.goals));
    storage.setItem("debtPlanner.completedRecommendedActions", JSON.stringify(demoPlannerState.completedRecommendedActions));
    storage.setItem("debtPlanner.payoffStrategy", JSON.stringify(demoPlannerState.payoffStrategy));

    // Restore the pre-existing theme choice (dark / light / system). Absent ⇒
    // left unset ⇒ useDarkMode falls back to "system" (Auto).
    if (existingTheme !== null) {
        storage.setItem("debtPlanner.darkMode", existingTheme);
    }

    storage.setItem("debtPlanner.isDemoMode", JSON.stringify(true));
}
