import { CUSHION_LABEL } from "@core/copy/vocabulary";
import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import type { CompletedRecommendedAction, Debt, RequiredExpense } from "@core/storage/debtPlannerStorage";

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
            /**
             * ⛔ **S1.13.7.6 [pass-6 `A3-18`] — ON THE LAST PAYMENT OF EVERY DEBT THIS CHARGED THE FULL
             * STATED MINIMUM INSTEAD OF THE BALANCE.**
             *
             * `allocatePaycheck` caps the real payment at the balance in two places — you cannot pay $50
             * against a $12 balance — so the ledger the user reads was a different number from the money
             * the engine actually moves, on the final payment of **every** debt.
             *
             * ⚠️ The cap is what the engine already does; this makes the row agree rather than inventing
             * a third rule.
             */
            amount: Math.min(debt.minimumPayment, debt.balance),
            type: debt.isAutopay ? "autopay_debt" : "minimum_debt",
            isPaid: paidThisCycle,
        });
    }

    // Show the cash buffer reserve when the engine allocated one (shortfall = 0 and buffer > 0).
    // This makes the ending balance match the flexible-cash-available figure in the plan view.
    const bufferAllocation = result.allocations.find(
        (item) => item.category === "cushion_buffer"
    );
    if (bufferAllocation) {
        items.push({
            date: nextPaycheckDate,
            label: CUSHION_LABEL,
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
            // ⛔ S1.12.9 [DECISION S1.12.7 — 🎯 2026-08-30] — UN-CLAMPED. This used to emit
            // `Math.max(0, runningCash)`, so a user $800 short read three identical `$0` rows and a
            // screen-reader heard "Pay Phone, −$200, balance $0". `formatCurrency.ts:21` states this
            // codebase's own rule — "if a value cannot legitimately go negative, clamp it at the
            // SELECTOR; if it can, show it" — and this one can.
            // ⚠️ The ACCUMULATOR above was never clamped, only the emitted field was, so nothing about
            // how the balance carries changes here. The clamp moved to `getEndingBalance`, which is the
            // one consumer that genuinely needs it: `endingBalance` seeds the next cycle and the
            // water-fill reads the un-clamped dip from `net`/`carriedBalance` instead.
            runningCash,
        };
    });

}