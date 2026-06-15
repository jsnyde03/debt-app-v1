import type { Debt } from "../storage/debtPlannerStorage";

export type SmartInsightSeverity = "good" | "warning" | "risk";

export type SmartInsight = {
    title: string;
    message: string;
    severity: SmartInsightSeverity;
    action?: string;
};

type BuildSmartInsightParams = {
    safeExtraPayment: number;
    projectedBuffer: number;
    requiredTotal: number;
    snowballDebtFreeDate: string;
    avalancheDebtFreeDate: string;
    snowballInterest: number;
    avalancheInterest: number;
    debts: Debt[];
};

export function buildSmartInsights({ safeExtraPayment, projectedBuffer, requiredTotal, snowballDebtFreeDate, avalancheDebtFreeDate, snowballInterest, avalancheInterest, debts}: BuildSmartInsightParams): SmartInsight[] {
    const insights: SmartInsight[] = [];

    const activeDebts = debts.filter((debt) => debt.balance > 0);

    const smallestDebt = [...activeDebts].sort((a, b) => a.balance - b.balance)[0];

    const highestAprDebt = [...activeDebts].sort((a, b) => b.apr - a.apr)[0];

    const bestCashFlowUnlockDebt = [...activeDebts].filter((debt) => debt.minimumPayment > 0).sort((a, b) => {
        const aScore = a.minimumPayment / Math.max(a.balance, 1);
        const bScore = b.minimumPayment / Math.max(b.balance, 1);

        if (bScore !== aScore) {
            return bScore - aScore;
        }

        return b.minimumPayment - a.minimumPayment;
    })[0];

    if (projectedBuffer < 0) {
        const recoveryAmount = Math.abs(projectedBuffer) + 200;

        insights.push({
            title: "Recovery Needed",
            message: `This plan is projected to run short by ${formatInsightCurrency(Math.abs(projectedBuffer))} after required payments. Extra payoff should pause until required bills and minimums are protected.`,
            action: `Find or free up about ${formatInsightCurrency(recoveryAmount)} to get back to a safer $200 cushion.`,
            severity: "risk",
        });
    } else if (projectedBuffer < 200) {
        const amountToHold = Math.min(safeExtraPayment, 200 - projectedBuffer);

        insights.push({
            title: "Tight Cycle Warning",
            message: `Your projected cushion is only ${formatInsightCurrency(projectedBuffer)} after this plan, leaving very little room for timing issues or surprise expenses.`,
            action: amountToHold > 0 ? `Hold back ${formatInsightCurrency(amountToHold)} from extra payoff to restore a safer $200 cushion` : "Run minimum-only until the next paycheck if any new expenses appear.",
            severity: "warning",
        });
    } else {
        insights.push({
            title: "Buffer looks stable",
            message: `Your projected cushion is ${formatInsightCurrency(projectedBuffer)} after required payments and planned payoff activity.`,
            action: "You can continue the current plan without needing a stablization adjustment.",
            severity: "good",
        });
    }

    if (safeExtraPayment > 0 && projectedBuffer >= 200) {
        const payoffTarget = smallestDebt ?? highestAprDebt;

        insights.push({
            title: "Safe Extra Payment",
            message: payoffTarget ? `You can safely apply ${formatInsightCurrency(safeExtraPayment)} toward ${payoffTarget.name} this cycle without touching required payments or your protected cushion.` : `You can safely apply ${formatInsightCurrency(safeExtraPayment)} toward debt this cycle without touching required payments or your protected cushion.`,
            action: projectedBuffer < 200 ? "Because the cycle is tight, use the reduced amount above before making the full extra payment." : "Make this payment only after required bills and minimums are handled.",
            severity: projectedBuffer < 200 ? "warning" : "good",
        });
    }

    if (bestCashFlowUnlockDebt && bestCashFlowUnlockDebt.balance <= safeExtraPayment + 100) {
        const gap = Math.max(0, bestCashFlowUnlockDebt.balance - safeExtraPayment);

        insights.push({
            title: "Near Payoff Opportunity",
            message: `${bestCashFlowUnlockDebt.name} is within ${formatInsightCurrency(gap)} of what your current extra payoff can cover. Paying it off would free ${formatInsightCurrency(bestCashFlowUnlockDebt.minimumPayment)} in future minimums.`,
            action: projectedBuffer < 200 ? "Focus on restoring cushion first, then target this payoff opportunity once cash pressure inmproves" : "Consider targeting this once the extra amount is available without weakening your buffer.",
            severity: projectedBuffer < 200 ? "warning" : "good",
        });
    }

    if (avalancheInterest < snowballInterest) {
        const estimatedSavings = snowballInterest - avalancheInterest;

        insights.push({
            title: "Interest Reduction Insight",
            message: `Using avalanche instead of snowball could reduce total interest by about ${formatInsightCurrency(estimatedSavings)} with your current balances.`,
            action: highestAprDebt ? `${highestAprDebt.name} is currently costing the most interest, making it the strongest avalanche target right now.` : "Prioritize the highest APR debt first to reduce long-term interest cost.",
            severity: "good",
        });
    } else if (snowballDebtFreeDate !== avalancheDebtFreeDate) {
        insights.push({
            title: "Payoff Timing Difference",
            message: "Snowball and avalanche produce different payoff timelines with your current balances and extra-payment plan.",
            action: "Use snowball for faster momentum or avalanche when interest reduction matters more.",
            severity: "warning",
        });
    }

    if (requiredTotal > projectedBuffer && projectedBuffer < 200) {
        insights.push({
            title: "Stability First",
            message: "This cycle shows elevated cash pressure after required payments and minimums.",
            action: "Treat staying current as the win for this cycle and avoid aggressive extra payoff until cushion improves.",
            severity: "warning",
        });
    }

    if (projectedBuffer >= 0) {
        insights.push({
            title: "Progress Still Continues",
            message: `Your current plan still keeps all required payments protected while continuing forward debt progress.`,
            action: "Even smaller progress cycles help stabilize long-term payoff momentum.",
            severity: "good",
        });
    }

    return insights;
}

function formatInsightCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Math.max(0, Math.round(amount * 100 ) / 100 ));
}