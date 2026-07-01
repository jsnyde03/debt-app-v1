import { allocatePaycheck } from "../engine/allocatePaycheck";
import { buildTimelineItems, type TimelineItem, type CompletedRecommendedAction } from "./buildTimelineItems";
import { getNextPaycheckDate, type PayCycle } from "../payCycle/getNextPaycheckDate";
import { rolloverRequiredExpenses, rolloverDebts } from "../recurrence/rolloverPayCycle";
import type { Debt, RequiredExpense, Goal } from "../storage/debtPlannerStorage";
import type { LivingExpense } from "../types/livingExpense";

export type CushionStatus = "stable" | "tight" | "pressure";

export type TimelineCycle = {
    cycleStart: string;
    cycleEnd: string;
    paycheckAmount: number;
    items: TimelineItem[];
    endingBalance: number;
    cushionStatus: CushionStatus;
    isProjected: boolean;
};

export type MultiCycleTimelineConfig = {
    payCycle: PayCycle;
    semiMonthlyFirstDay?: number;
    semiMonthlySecondDay?: number;
    monthlyPayDay?: number;
};

type AllocationResult = ReturnType<typeof allocatePaycheck>;

export function buildMultiCycleTimeline({
    result,
    requiredExpenses,
    debts,
    goals,
    livingExpenses = [],
    completedRecommendedActions = [],
    currentDate,
    nextPaycheckDate,
    payCycleConfig,
    strategy,
    paycheckBuffer = 50,
    maxCycles = 3,
}: {
    result: AllocationResult;
    requiredExpenses: RequiredExpense[];
    debts: Debt[];
    goals: Goal[];
    livingExpenses?: LivingExpense[];
    completedRecommendedActions?: CompletedRecommendedAction[];
    currentDate: string;
    nextPaycheckDate: string;
    payCycleConfig: MultiCycleTimelineConfig;
    strategy: "snowball" | "avalanche";
    paycheckBuffer?: number;
    maxCycles?: number;
}): TimelineCycle[] {
    const cycles: TimelineCycle[] = [];

    // Cycle 0: current cycle (result already computed by caller)
    const cycle0Items = buildTimelineItems({
        result,
        requiredExpenses,
        debts,
        completedRecommendedActions,
        currentDate,
        nextPaycheckDate,
    });

    const cycle0Balance = getEndingBalance(cycle0Items, result.paycheckAmount);

    cycles.push({
        cycleStart: currentDate,
        cycleEnd: nextPaycheckDate,
        paycheckAmount: result.paycheckAmount,
        items: cycle0Items,
        endingBalance: cycle0Balance,
        cushionStatus: toCushionStatus(cycle0Balance),
        isProjected: false,
    });

    // Project future cycles so the user can see their full bill schedule.
    // For the initial rollover, treat all in-cycle bills as paid so that recurring
    // items advance their due dates and one-time items are not carried forward.
    let projCurrentDate = nextPaycheckDate;
    const initialPaid = markInCycleBillsAsPaid(requiredExpenses, debts, nextPaycheckDate);
    let projExpenses = rolloverRequiredExpenses(initialPaid.expenses, nextPaycheckDate)
        .filter((e) => e.recurrence !== "one-time" || !isPastDue(e.dueDate, nextPaycheckDate));
    let projDebts = rolloverDebts(initialPaid.debts, nextPaycheckDate)
        .filter((d) => d.recurrence !== "one-time" || !isPastDue(d.dueDate, nextPaycheckDate));
    const projGoals = [...goals];

    for (let i = 1; i < maxCycles; i++) {
        let projNextDate: string;
        try {
            projNextDate = getNextPaycheckDate({
                payCycle: payCycleConfig.payCycle,
                currentDate: projCurrentDate,
                semiMonthlyFirstDay: payCycleConfig.semiMonthlyFirstDay,
                semiMonthlySecondDay: payCycleConfig.semiMonthlySecondDay,
                monthlyPayDay: payCycleConfig.monthlyPayDay,
            });
        } catch {
            break;
        }

        const projResult = allocatePaycheck({
            paycheckAmount: result.paycheckAmount,
            currentDate: projCurrentDate,
            nextPaycheckDate: projNextDate,
            expenses: projExpenses,
            livingExpenses,
            debts: projDebts,
            goals: projGoals,
            strategy,
            paycheckBuffer,
        });

        const cycleItems = buildTimelineItems({
            result: projResult,
            requiredExpenses: projExpenses,
            debts: projDebts,
            completedRecommendedActions: [],
            currentDate: projCurrentDate,
            nextPaycheckDate: projNextDate,
        });

        const endingBalance = getEndingBalance(cycleItems, projResult.paycheckAmount);

        cycles.push({
            cycleStart: projCurrentDate,
            cycleEnd: projNextDate,
            paycheckAmount: result.paycheckAmount,
            items: cycleItems,
            endingBalance,
            cushionStatus: toCushionStatus(endingBalance),
            isProjected: true,
        });

        projCurrentDate = projNextDate;

        // For projected cycles, simulate that in-cycle bills were paid so that rollover
        // advances their due dates correctly and the same bill doesn't appear in every
        // subsequent cycle.
        const paidForRollover = markInCycleBillsAsPaid(projExpenses, projDebts, projNextDate);
        projExpenses = rolloverRequiredExpenses(paidForRollover.expenses, projNextDate)
            .filter((e) => e.recurrence !== "one-time" || !isPastDue(e.dueDate, projNextDate));
        projDebts = rolloverDebts(paidForRollover.debts, projNextDate)
            .filter((d) => d.recurrence !== "one-time" || !isPastDue(d.dueDate, projNextDate));
    }

    return cycles;
}

function isPastDue(dueDate: string, cycleStart: string): boolean {
    return new Date(`${dueDate}T00:00:00`) < new Date(`${cycleStart}T00:00:00`);
}

function markInCycleBillsAsPaid(
    expenses: RequiredExpense[],
    debts: Debt[],
    cycleEnd: string,
): { expenses: RequiredExpense[]; debts: Debt[] } {
    // `cycleEnd` here is the next payday. A cycle runs [payday, next payday), so a
    // bill due strictly before the next payday belongs to this cycle (mark it paid so
    // rollover advances it); one due exactly on the next payday belongs to the next
    // cycle and must NOT be advanced past it. Hence `<`, consistent with the boundary
    // used in allocatePaycheck and buildTimelineItems.
    const nextPayday = new Date(`${cycleEnd}T00:00:00`);
    const dueBeforeNextPayday = (dueDate: string) =>
        new Date(`${dueDate}T00:00:00`) < nextPayday;

    return {
        expenses: expenses.map((e) => ({
            ...e,
            isPaidThisCycle: dueBeforeNextPayday(e.dueDate) ? true : (e.isPaidThisCycle ?? false),
        })),
        debts: debts.map((d) => ({
            ...d,
            minimumPaidThisCycle: dueBeforeNextPayday(d.dueDate) ? true : (d.minimumPaidThisCycle ?? false),
        })),
    };
}

function getEndingBalance(items: TimelineItem[], fallback: number): number {
    if (items.length === 0) return fallback;
    return items[items.length - 1].runningCash;
}

function toCushionStatus(balance: number): CushionStatus {
    if (balance >= 200) return "stable";
    if (balance >= 100) return "tight";
    return "pressure";
}
