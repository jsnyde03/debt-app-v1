import { DEBT_FREE_DATE_UNPAYABLE, projectDebtPayoff } from "./projectDebtPayoff";
import type { Debt } from "@core/storage/debtPlannerStorage";
import { roundMoney } from "@core/utils/money";

type PayoffStrategy = "snowball" | "avalanche";

/**
 * What the current payoff plan saves vs. paying only minimums.
 * - `saving`          — both plans pay off; the interest + months the extra saves.
 * - `payoff-enabling` — minimum payments alone would NEVER clear the debt, but the
 *                       plan does (the ledger's most compelling message).
 * - `none`            — nothing to claim (no live debt, no extra, or the plan still
 *                       can't pay it off).
 */
export type InterestSaved =
    | { kind: "saving"; interestSaved: number; monthsSaved: number }
    | { kind: "payoff-enabling"; debtFreeDate: string }
    | { kind: "none" };

/**
 * The Interest-Saved Momentum Ledger's core computation — an exact counterfactual
 * (current plan vs. minimum-only) over the tested payoff engine. Runs
 * `projectDebtPayoff` twice; the difference is the saving.
 *
 * NOTE: `projectDebtPayoff` returns `totalInterestPaid: 0` as a SENTINEL when a
 * plan can't amortize (estimatedDebtFreeDate === DEBT_FREE_DATE_UNPAYABLE) — NOT a
 * real zero — so we branch on that flag, never on a raw `0` interest total, to
 * avoid computing a garbage "saving" for the unpayable-minimums case.
 */
export function computeInterestSaved({
    debts,
    monthlyExtraPayment,
    strategy,
    startDate,
}: {
    debts: Debt[];
    monthlyExtraPayment: number;
    strategy: PayoffStrategy;
    startDate: string;
}): InterestSaved {
    const liveDebts = debts.filter((d) => d.balance > 0);
    if (liveDebts.length === 0 || monthlyExtraPayment <= 0) return { kind: "none" };

    const minPlan = projectDebtPayoff({ debts: liveDebts, monthlyExtraPayment: 0, strategy, startDate });
    const actualPlan = projectDebtPayoff({ debts: liveDebts, monthlyExtraPayment, strategy, startDate });

    const minUnpayable = minPlan.estimatedDebtFreeDate === DEBT_FREE_DATE_UNPAYABLE;
    const actualUnpayable = actualPlan.estimatedDebtFreeDate === DEBT_FREE_DATE_UNPAYABLE;

    // Even with the extra it never clears → no motivating claim to make.
    if (actualUnpayable) return { kind: "none" };

    // Minimums alone never clear it, but the plan does — the killer message.
    if (minUnpayable) return { kind: "payoff-enabling", debtFreeDate: actualPlan.estimatedDebtFreeDate };

    // Both payable → the interest + months the extra buys back.
    const interestSaved = roundMoney(minPlan.totalInterestPaid - actualPlan.totalInterestPaid);
    const monthsSaved = minPlan.monthsToDebtFree - actualPlan.monthsToDebtFree;

    if (interestSaved <= 0 && monthsSaved <= 0) return { kind: "none" };

    return {
        kind: "saving",
        interestSaved: Math.max(0, interestSaved),
        monthsSaved: Math.max(0, monthsSaved),
    };
}
