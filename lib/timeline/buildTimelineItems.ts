import type { allocatePaycheck } from "../engine/allocatePaycheck";
import type { Debt, RequiredExpense } from "../storage/debtPlannerStorage";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

export type TimelineItem = {
    date: string;
    label: string;
    amount: number;
    runningCash: number;
    isExternal?: boolean;
    type:
        | "paycheck"
        | "expense"
        | "autopay_expense"
        | "minimum_debt"
        | "autopay_debt"
        | "emergency"
        | "snowball"
        | "optional_goal";
}

export type TimelineRecommendedAction = {
    targetId: string;
    label: string;
    category: "emergency" | "snowball" | "optional_goal";
    recommendedAmount: number;
    actualAmount: number;
    paymentSource?: "paycheck" | "external";
}

export function buildTimelineItems({ result, requiredExpenses, debts, currentDate, completedRecommendedActions = []}: { result: AllocationResult; requiredExpenses: RequiredExpense[]; debts: Debt[]; currentDate: string; completedRecommendedActions?: TimelineRecommendedAction[]}) {
    const items: Omit<TimelineItem, "runningCash">[] = [
        {
            date: currentDate,
            label: "Paycheck Received",
            amount: result.paycheckAmount,
            type: "paycheck",
        },
    ];

    for (const allocation of result.allocations) {
        if (
            allocation.category !== "expense" &&
            allocation.category !== "autopay_expense" &&
            allocation.category !== "minimum_debt" &&
            allocation.category !== "autopay_debt" &&
            allocation.category !== "emergency" &&
            allocation.category !== "snowball"
        ) {
            continue;
        }

        const expense =
            allocation.category === "expense" ||
            allocation.category === "autopay_expense"
                ? requiredExpenses.find((item) => item.id === allocation.targetId)
                : undefined;
        
        const debt =
            allocation.category === "minimum_debt" || 
            allocation.category === "autopay_debt" ||
            allocation.category === "snowball"
                ? debts.find((item) => item.id === (allocation.debtId ?? allocation.targetId))
                : undefined;

        items.push({
            date: expense?.dueDate ?? debt?.dueDate ?? currentDate,
            label: allocation.label,
            amount: allocation.amount,
            type: allocation.category,
        });
    }

    for (const action of completedRecommendedActions) {

        items.push({
            date: currentDate,
            label: action.paymentSource === "external" ? `Outside money: ${action.label}` : `Paid: ${action.label}`,
            amount: action.actualAmount,
            type: action.category,
            isExternal: action.paymentSource === "external",
        })
    }

    const sortedItems = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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