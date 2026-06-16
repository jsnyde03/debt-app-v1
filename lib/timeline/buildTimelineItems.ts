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

export function buildTimelineItems({
    result,
    requiredExpenses,
    debts,
    currentDate,
    nextPaycheckDate,
}: {
    result: AllocationResult;
    requiredExpenses: RequiredExpense[];
    debts: Debt[];
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

    const isDueBeforeNextPaycheck = (dueDate: string) => {
        const due = new Date(`${dueDate}T00:00:00`);
        const next = new Date(`${nextPaycheckDate}T00:00:00`);

        return due < next;
    };

    for (const expense of requiredExpenses.filter((item) => isDueBeforeNextPaycheck(item.dueDate))) {
        items.push({
            date: expense.dueDate,
            label: expense.isAutopay
                ? `Reserve autopay for ${expense.name}`
                : `Pay ${expense.name}`,
            amount: expense.amount,
            type: expense.isAutopay ? "autopay_expense" : "expense",
            category: expense.category,
        });
    }

    for (const debt of debts.filter((item) => isDueBeforeNextPaycheck(item.dueDate))) {
        if (debt.balance <= 0) continue;

        items.push({
            date: debt.dueDate,
            label: debt.isAutopay
                ? `Reserve minimum for ${debt.name}`
                : `Pay minimum on ${debt.name}`,
            amount: debt.minimumPayment,
            type: debt.isAutopay ? "autopay_debt" : "minimum_debt",
        });
    }

    const allocationCategories = new Set(["emergency", "snowball", "optional_goal"]);
    for (const allocation of result.allocations) {
        if (!allocationCategories.has(allocation.category)) continue;
        items.push({
            date: nextPaycheckDate,
            label: allocation.label,
            amount: allocation.amount,
            type: allocation.category as "emergency" | "snowball" | "optional_goal",
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