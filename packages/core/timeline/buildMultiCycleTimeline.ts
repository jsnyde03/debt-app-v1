import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { applyRolloverPayment } from "@core/debt/applyRolloverPayment";
import { scaleBnplMinimumsForWindow } from "@core/debt/bnplInstallment";
import { buildTimelineItems, type TimelineItem } from "./buildTimelineItems";
import { computeState } from "@core/guardian/computeState";
import type { GuardianState } from "@core/guardian/buildGuardianBrief";
import { getNextPaycheckDate, type PayCycle } from "@core/payCycle/getNextPaycheckDate";
import { resolveTrialAmounts } from "@core/obligations/effectiveObligationAmount";
import { rolloverRequiredExpenses, rolloverDebts } from "@core/recurrence/rolloverPayCycle";
import type { CompletedRecommendedAction, Debt, RequiredExpense, Goal } from "@core/storage/debtPlannerStorage";
import type { LivingExpense } from "@core/types/livingExpense";

export type CushionStatus = "stable" | "tight" | "pressure";

/** Map the unified Guardian band → the forecast's display vocabulary (2.4.6.1.2). The band is the
 *  single source (computed by `computeState` off floor-relative headroom); `cushionStatus` is its alias
 *  so the existing cash-flow-bar / lookahead consumers keep working. */
export function toCushionStatus(state: GuardianState): CushionStatus {
    return state === "clear" ? "stable" : state === "tight" ? "tight" : "pressure";
}

export type TimelineCycle = {
    cycleStart: string;
    cycleEnd: string;
    paycheckAmount: number;
    items: TimelineItem[];
    endingBalance: number;
    cushionStatus: CushionStatus;
    /** The canonical unified Guardian band for this cycle (§2.2 / round-4 F4). `cushionStatus` is its
     *  display alias. Driven by floor-relative headroom (`net`), NOT `endingBalance`. */
    guardianState: GuardianState;
    isProjected: boolean;
    // v1.7 Guardian cross-cycle carry (2.4.D.6) — the substrate for §2.5 water-fill smoothing.
    // `net` = income − required − living for THIS cycle, UN-CLAMPED (negative on a lumpy-bill cycle;
    // the plain per-cycle flow, before any buffer/deploy). `carriedBalance` = the running balance at
    // this cycle's END if nothing is deployed: startingBalance + Σ net (also un-clamped, so a genuine
    // future crunch — carriedBalance dipping below the floor — is visible instead of erased by the
    // `endingBalance` max(0,·) clamp). Deploy-independent by construction → the water-fill (2.4.7)
    // detects crunches on this fixed track in a single pass.
    net: number;
    carriedBalance: number;
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
    startingBalance,
    priorBand,
    projectedPaycheckAmount,
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
    /** The retained balance at the START of cycle 0 (before its net) — the §2.5 water-fill's `bal_0`.
     *  Defaults to the protected floor (`paycheckBuffer`). */
    startingBalance?: number;
    /** The persisted prior Guardian band (2.4.6.1.2) — seeds the projection's cycle-to-cycle hysteresis
     *  so a value hovering on a boundary doesn't flap the forecast's state. */
    priorBand?: GuardianState | null;
    /** The RECURRING paycheck for PROJECTED cycles (2.4.6.1.4) — cycle 0 uses `result.paycheckAmount`
     *  (which may include a one-time windfall), but a windfall must NOT repeat across future cycles.
     *  Defaults to `result.paycheckAmount` (correct when there's no windfall). */
    projectedPaycheckAmount?: number;
}): TimelineCycle[] {
    const cycles: TimelineCycle[] = [];
    // §2.5 trials: price each obligation at what it will actually charge in the cycle its due date falls
    // in (intro until the kick-in date, then full). Keyed off the obligation's own due date — which
    // rollover advances per cycle — so a trial converts in the correct projected cycle. Resolving cycle 0
    // here keeps its timeline items consistent with the caller's already-resolved `result`; each projected
    // cycle re-resolves its rolled obligations below (a no-op until conversion, idempotent after).
    const resolvedRequiredExpenses = resolveTrialAmounts(requiredExpenses);
    // Future cycles project on the recurring paycheck, never a one-time windfall folded into cycle 0.
    const recurringPaycheck = projectedPaycheckAmount ?? result.paycheckAmount;
    // The un-clamped cross-cycle running balance (2.4.D.6). Seeded at the retained floor, then each
    // cycle's net is added — negatives preserved, so a lumpy-bill crunch survives into the forecast.
    let carriedBalance = startingBalance ?? paycheckBuffer;
    // The unified band (2.4.6.1.2), threaded cycle-to-cycle for hysteresis. `paycheckBuffer` is the
    // forecast's floor. The band is driven by floor-relative headroom (`net`), never `endingBalance`.
    let band: GuardianState | null | undefined = priorBand;

    // Cycle 0: current cycle (result already computed by caller)
    const cycle0Items = buildTimelineItems({
        result,
        requiredExpenses: resolvedRequiredExpenses,
        debts,
        completedRecommendedActions,
        currentDate,
        nextPaycheckDate,
    });

    const cycle0Balance = getEndingBalance(cycle0Items, result.paycheckAmount);
    const cycle0Net = cycleNet(result);
    carriedBalance += cycle0Net;
    const cycle0State = computeState(Math.max(0, cycle0Net), paycheckBuffer, band);
    band = cycle0State;

    cycles.push({
        cycleStart: currentDate,
        cycleEnd: nextPaycheckDate,
        paycheckAmount: result.paycheckAmount,
        items: cycle0Items,
        endingBalance: cycle0Balance,
        cushionStatus: toCushionStatus(cycle0State),
        guardianState: cycle0State,
        isProjected: false,
        net: cycle0Net,
        carriedBalance,
    });

    // Project future cycles so the user can see their full bill schedule.
    // For the initial rollover, treat all in-cycle bills as paid so that recurring
    // items advance their due dates and one-time items are not carried forward.
    let projCurrentDate = nextPaycheckDate;
    const initialPaid = markInCycleBillsAsPaid(resolvedRequiredExpenses, debts, nextPaycheckDate);
    let projExpenses = resolveTrialAmounts(
        rolloverRequiredExpenses(initialPaid.expenses, nextPaycheckDate)
            .filter((e) => e.recurrence !== "one-time" || !isPastDue(e.dueDate, nextPaycheckDate)),
    );
    // State-thread cycle 0 → 1 (2.4.7.1): reduce balances by cycle 0's min+snowball and advance funded
    // goals, so cycle 1 projects on the SHRUNK debts (a paid-off debt drops out, freeing its minimum).
    let projDebts = rolloverDebts(stateThreadDebts(initialPaid.debts, result, payCycleConfig.payCycle), nextPaycheckDate)
        .filter((d) => d.balance > 0 && (d.recurrence !== "one-time" || !isPastDue(d.dueDate, nextPaycheckDate)));
    let projGoals = advanceGoals([...goals], result);

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

        // §2.7.4: reflect the FULL in-window BNPL outflow (a biweekly BNPL charges ~2× before a monthly
        // paycheck) for this cycle's allocation + items. A TRANSIENT view — `projDebts` (unscaled) is what
        // rolls forward, so the scaling is never compounded across cycles; paid-flags/rollover untouched.
        const scaledProjDebts = scaleBnplMinimumsForWindow(projDebts, projCurrentDate, projNextDate);

        const projResult = allocatePaycheck({
            paycheckAmount: recurringPaycheck,
            currentDate: projCurrentDate,
            nextPaycheckDate: projNextDate,
            expenses: projExpenses,
            livingExpenses,
            debts: scaledProjDebts,
            goals: projGoals,
            strategy,
            paycheckBuffer,
        });

        const cycleItems = buildTimelineItems({
            result: projResult,
            requiredExpenses: projExpenses,
            debts: scaledProjDebts,
            completedRecommendedActions: [],
            currentDate: projCurrentDate,
            nextPaycheckDate: projNextDate,
        });

        const endingBalance = getEndingBalance(cycleItems, projResult.paycheckAmount);
        const projNet = cycleNet(projResult);
        carriedBalance += projNet;
        const projState = computeState(Math.max(0, projNet), paycheckBuffer, band);
        band = projState;

        cycles.push({
            cycleStart: projCurrentDate,
            cycleEnd: projNextDate,
            paycheckAmount: projResult.paycheckAmount,
            items: cycleItems,
            endingBalance,
            cushionStatus: toCushionStatus(projState),
            guardianState: projState,
            isProjected: true,
            net: projNet,
            carriedBalance,
        });

        projCurrentDate = projNextDate;

        // For projected cycles, simulate that in-cycle bills were paid so that rollover
        // advances their due dates correctly and the same bill doesn't appear in every
        // subsequent cycle.
        const paidForRollover = markInCycleBillsAsPaid(projExpenses, projDebts, projNextDate);
        projExpenses = resolveTrialAmounts(
            rolloverRequiredExpenses(paidForRollover.expenses, projNextDate)
                .filter((e) => e.recurrence !== "one-time" || !isPastDue(e.dueDate, projNextDate)),
        );
        // State-thread (2.4.7.1): apply this cycle's min+snowball to balances + advance funded goals
        // before rolling, so the next cycle sees shrunk debts and a retired debt frees its minimum.
        projDebts = rolloverDebts(stateThreadDebts(paidForRollover.debts, projResult, payCycleConfig.payCycle), projNextDate)
            .filter((d) => d.balance > 0 && (d.recurrence !== "one-time" || !isPastDue(d.dueDate, projNextDate)));
        projGoals = advanceGoals(projGoals, projResult);
    }

    return cycles;
}

function isPastDue(dueDate: string, cycleStart: string): boolean {
    return new Date(`${dueDate}T00:00:00`) < new Date(`${cycleStart}T00:00:00`);
}

/**
 * State-thread the projection (2.4.7.1 / §2.5 C5): reduce each debt's balance by the minimum (its paid
 * flag is set by `markInCycleBillsAsPaid`) + the snowball this cycle's allocation deployed to it,
 * accruing one pay cycle's interest via the shared `applyRolloverPayment`. Without this the forecast
 * re-ran `allocatePaycheck` on frozen balances every cycle, so debts never shrank or retired.
 */
function stateThreadDebts(debts: Debt[], result: AllocationResult, payCycle: PayCycle): Debt[] {
    const snowballByDebt = new Map<string, number>();
    for (const a of result.allocations) {
        if (a.category === "snowball" && a.debtId) {
            snowballByDebt.set(a.debtId, (snowballByDebt.get(a.debtId) ?? 0) + a.amount);
        }
    }
    return debts.map((d) => applyRolloverPayment(d, snowballByDebt.get(d.id) ?? 0, payCycle));
}

/**
 * Advance each goal by what this cycle's allocation funded (EF / starter EF / optional goal), clamped
 * to its target — so a fully-funded goal stops pulling money in later cycles and it redirects to debt.
 */
function advanceGoals(goals: Goal[], result: AllocationResult): Goal[] {
    return goals.map((g) => {
        const added = result.allocations
            .filter(
                (a) =>
                    (a.category === "emergency" || a.category === "starter_emergency" || a.category === "optional_goal") &&
                    a.goalId === g.id,
            )
            .reduce((s, a) => s + a.amount, 0);
        return added > 0 ? { ...g, currentAmount: Math.min(g.targetAmount, g.currentAmount + added) } : g;
    });
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

/** This cycle's UN-CLAMPED net flow (income − required − living) — the §2.5 carry increment (2.4.D.6).
 *  Negative on a cycle whose bills+living exceed income (a lumpy-bill crunch), which the water-fill needs
 *  to see. Excludes the buffer/deploy (deploy-independence is what makes crunch detection a single pass). */
function cycleNet(r: AllocationResult): number {
    return r.paycheckAmount - r.totalRequired - r.livingExpenseReserve;
}
