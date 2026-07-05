import { allocatePaycheck } from "../engine/allocatePaycheck";
import type { Debt, RequiredExpense } from "../storage/debtPlannerStorage";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

export type CompletedRecommendedAction = {
    targetId: string;
    label: string;
    category: "emergency" | "snowball" | "optional_goal";
    actualAmount: number;
    paymentSource?: "paycheck" | "external";
};

export type TimelineItem = {
    date: string;
    label: string;
    amount: number;
    runningCash: number;
    type:
        | "paycheck"
        | "living_reserve"
        | "expense"
        | "autopay_expense"
        | "minimum_debt"
        | "autopay_debt"
        | "emergency"
        | "snowball"
        | "optional_goal"
        | "buffer";
    isExternal?: boolean;
    status?: "planned" | "paid" | "external";
    isPaid?: boolean;
    category?: string;
}

export function buildTimelineItems({
    result,
    requiredExpenses,
    debts,
    completedRecommendedActions = [],
    currentDate,
    nextPaycheckDate,
}: {
    result: AllocationResult;
    requiredExpenses: RequiredExpense[];
    debts: Debt[];
    completedRecommendedActions?: CompletedRecommendedAction[];
    currentDate: string;
    nextPaycheckDate: string;
}) {
    const items: Omit<TimelineItem, "runningCash">[] = [
        {
            date: currentDate,
            label: "Paycheck Received",
            amount: result.paycheckAmount,
            type: "paycheck",
        },
    ];

    if (result.livingExpenseReserve > 0) {
        items.push({
            date: currentDate,
            label: "Living Reserve",
            amount: result.livingExpenseReserve,
            type: "living_reserve",
        });
    }

    const isDueInCycle = (dueDate: string) => {
        const due = new Date(`${dueDate}T00:00:00`);
        const next = new Date(`${nextPaycheckDate}T00:00:00`);
        // A pay cycle runs [payday, next payday) — it ends the day BEFORE the next
        // payday, so an item due exactly on the next payday belongs to the next cycle.
        return due < next;
    };

    // Include expenses due this cycle OR already paid this cycle
    for (const expense of requiredExpenses) {
        const paidThisCycle = expense.isPaidThisCycle ?? false;
        if (!isDueInCycle(expense.dueDate) && !paidThisCycle) continue;

        items.push({
            date: expense.dueDate,
            label: expense.isAutopay
                ? `Reserve autopay for ${expense.name}`
                : `Pay ${expense.name}`,
            amount: expense.amount,
            type: expense.isAutopay ? "autopay_expense" : "expense",
            category: expense.category,
            isPaid: paidThisCycle,
        });
    }

    // Include debt minimums due this cycle OR already paid this cycle
    for (const debt of debts) {
        const paidThisCycle = debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false;
        if (!isDueInCycle(debt.dueDate) && !paidThisCycle) continue;
        if (debt.balance <= 0 && !paidThisCycle) continue;

        items.push({
            date: debt.dueDate,
            label: debt.isAutopay
                ? `Reserve minimum for ${debt.name}`
                : `Pay minimum on ${debt.name}`,
            amount: debt.minimumPayment,
            type: debt.isAutopay ? "autopay_debt" : "minimum_debt",
            isPaid: paidThisCycle,
        });
    }

    // Show the cash buffer reserve when the engine allocated one (shortfall = 0 and buffer > 0).
    // This makes the ending balance match the flexible-cash-available figure in the plan view.
    const bufferAllocation = result.allocations.find(
        (item) => item.category === "leftover" && item.label === "Keep cash buffer"
    );
    if (bufferAllocation) {
        items.push({
            date: nextPaycheckDate,
            label: "Cash Buffer",
            amount: bufferAllocation.amount,
            type: "buffer",
        });
    }

    // Only show extra payments (snowball/emergency/optional_goal) when the user has actually
    // marked them paid — they are optional and should not appear as planned items.
    for (const action of completedRecommendedActions) {
        if (action.paymentSource === "external") continue;
        items.push({
            date: nextPaycheckDate,
            label: action.label,
            amount: action.actualAmount,
            type: action.category as "emergency" | "snowball" | "optional_goal",
            isPaid: true,
        });
    }

    const sortedItems = [...items].sort((a, b) => {
        if (a.type === "paycheck" && b.type !== "paycheck") {
            return -1;
        }

        if (b.type === "paycheck" && a.type !== "paycheck") {
            return 1;
        }

        if (a.type === "living_reserve" && b.type !== "paycheck") {
            return -1;
        }

         if (b.type === "living_reserve" && a.type !== "paycheck") {
            return 1;
         }

        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    let runningCash = result.paycheckAmount;

    return sortedItems.map((item) => {
        if (item.type !== "paycheck" && !item.isExternal) {
            runningCash = Math.round((runningCash - item.amount) * 100) / 100;
        }

        return {
            ...item,
            runningCash: Math.max(0, runningCash),
        };
    });

}