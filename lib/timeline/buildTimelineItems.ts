import { allocatePaycheck } from "../engine/allocatePaycheck";
import type { Debt, RequiredExpense } from "../storage/debtPlannerStorage";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

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
        | "optional_goal";
    isExternal?: boolean;
    status?: "planned" | "paid" | "external";
    isPaid?: boolean;
    category?: string;
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

    if (result.livingExpenseReserve > 0) {
        items.push({
            date: currentDate,
            label: "Living Reserve",
            amount: result.livingExpenseReserve,
            type: "living_reserve",
            status: "planned",
        })
    }

    for (const allocation of result.allocations) {
        if (
            allocation.category !== "expense" &&
            allocation.category !== "autopay_expense" &&
            allocation.category !== "minimum_debt" &&
            allocation.category !== "autopay_debt"
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
            allocation.category === "autopay_debt"
                ? debts.find((item) => item.id === (allocation.debtId ?? allocation.targetId))
                : undefined;

        const isPaid = allocation.category === "expense" || allocation.category === "autopay_expense" ? expense?.isPaidThisCycle ?? false : debt?.minimumPaidThisCycle ?? debt?.isPaidThisCycle ?? false;

        items.push({
            date: expense?.dueDate ?? debt?.dueDate ?? currentDate,
            label: allocation.label,
            amount: allocation.amount,
            type: allocation.category,
            status: isPaid ? "paid" : "planned",
            isPaid,
            category: expense?.category,
        });
    }

    for (const expense of requiredExpenses) {
        if (!expense.isPaidThisCycle) {
            continue;
        }

        const alreadyIncluded = items.some((item) => item.type === (expense.isAutopay ? "autopay_expense" : "expense") && item.label === `Pay ${expense.name}`);

        if (alreadyIncluded) {
            continue;
        }

        items.push({
            date: expense.dueDate,
            label: `Pay ${expense.name}`,
            amount: expense.amount,
            type: expense.isAutopay ? "autopay_expense" : "expense",
            status: "paid",
            isPaid: true,
            category: expense.category,
        });
    }

    for (const debt of debts) {
        if (!debt.isPaidThisCycle) {
            continue;
        }

        const alreadyIncluded = items.some((item) => item.type === (debt.isAutopay ? "autopay_debt" : "minimum_debt") && item.label === `Pay minimum on ${debt.name}`);

        if (alreadyIncluded) {
            continue;
        }

        items.push({
            date: debt.dueDate,
            label: `Pay minimum on ${debt.name}`,
            amount: debt.minimumPayment,
            type: debt.isAutopay ? "autopay_debt" : "minimum_debt",
            status: "paid",
            isPaid: true,
        });
    }



    for (const action of completedRecommendedActions) {

        items.push({
            date: currentDate,
            label: action.label,
            amount: action.actualAmount,
            type: action.category,
            isExternal: action.paymentSource === "external",
            status: action.paymentSource === "external" ? "external" : "paid",
        })
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