import { addMonthsToDate } from "@core/utils/addMonths";
import { formatCurrency } from "@core/utils/formatCurrency";

import { getForecastStatus } from "./getForecastStatus";
import type { ForecastMonth, ForecastStatus } from "./types";

type ProjectForecastParams = {
    startingSafeCash: number;
    startingDebtBalance: number;
    monthlyDebtReduction: number;
    months: number;
    bufferTrendPerMonth?: number;
    requiredPaymentCount?: number;
    monthlyMinimumTotal?: number;
    nextDebtName?: string;
    nextDebtMinimum?: number;
};

export function projectForecast({ startingSafeCash, startingDebtBalance, monthlyDebtReduction, months, bufferTrendPerMonth = 0, requiredPaymentCount = 0, monthlyMinimumTotal = 0, nextDebtName, nextDebtMinimum} : ProjectForecastParams): ForecastMonth[] {
    const results: ForecastMonth[] = [];

    let currentDebtBalance = startingDebtBalance;

    // Pre-calculate the first month where cash recovers to >= $200 so non-stable
    // months earlier in the loop can reference it.
    let recoveryMonth: string | undefined;
    for (let i = 0; i < months; i++) {
        if (roundMoney(startingSafeCash + bufferTrendPerMonth * i) >= 200) {
            const d = addMonthsToDate(new Date(), i);
            recoveryMonth = d.toLocaleString("default", { month: "long", year: "numeric" });
            break;
        }
    }

    for (let index = 0; index < months; index++) {
        currentDebtBalance = Math.max(0, currentDebtBalance - monthlyDebtReduction);

        const projectedSafeCash = roundMoney(startingSafeCash + bufferTrendPerMonth * index);

        // ⛔ Clamped, not `setMonth`. Run on the 31st, the overflow skips a month name entirely and
        // prints the next one twice, so a forecast read on the last of the month names the wrong months.
        const monthDate = addMonthsToDate(new Date(), index);
        const monthLabel = monthDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
        });

        const status = getForecastStatus(projectedSafeCash);

        results.push({
            monthLabel,
            projectedSafeCash,
            projectedDebtBalance: roundMoney(currentDebtBalance),
            status,
            recommendedAction: getRecommendedAction(status),
            riskDrivers: buildRiskDrivers({
                projectedSafeCash,
                requiredPaymentCount,
                monthlyMinimumTotal,
                index,
            }),
            recoveryMonth,
            recoveryTrend: 
                projectedSafeCash < 200
                    ? index === months - 1
                        ? "Recovery is not currently projected within the visible forecast window."
                        : "Cash pressure is projected to gradually improve across upcoming cycles."
                    : "Projected cushion remains within a healthier range.",
            reliefPoint: nextDebtName && nextDebtMinimum
                ? `${nextDebtName} payoff may free ${formatForecastCurrency(nextDebtMinimum)}/month` : undefined,
        });
    }

    return results;
}


function buildRiskDrivers({ projectedSafeCash, requiredPaymentCount, monthlyMinimumTotal, index,}: { projectedSafeCash: number; requiredPaymentCount: number; monthlyMinimumTotal: number; index: number}) {
    const drivers: string[] = [];

    if (projectedSafeCash < 200) {
        const lowCushionDrivers = [
            "Projected cushion remains below target",
            "Available cushion stays under the recommended safety threshold",
            "Cash reserve remains tighter than recommended",
        ];
        
        drivers.push(lowCushionDrivers[index % lowCushionDrivers.length]);
    }

    if (requiredPaymentCount >= 4) {
        drivers.push(`${requiredPaymentCount} required payments occur before the next paycheck`);
    }

    if (monthlyMinimumTotal >= 100) {
        drivers.push("Debt minimum obligations remain elevated");
    }

    return drivers;
}

function getRecommendedAction(status: ForecastStatus) {
    if (status === "recovery") {
        return "Pause aggressive payoff and protect required payments first.";
    }

    if (status === "pressure") {
        return `Run minimum-only until cushion improves above ${formatForecastCurrency(100)}.`;
    }

    if (status === "tight") {
        return `Limit extra payoff until cushion improves above ${formatForecastCurrency(200)}.`;
    }

    return "Current payoff pace appears sustainable.";
}

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

/**
 * ⛔ **S1.10.6.5 [pass-3 B1] — ONE OF THE TWO LIVE HAND-ROLLED FORMATTERS THE MONEY GATE COULD NOT SEE.**
 *
 * ⚡ It rendered a THIRD cents convention: `Intl` defaults USD to a minimum of two fraction digits, so
 * this printed *"$100.00"* on a screen whose rows go through `formatCurrency` and read *"$100"*. That
 * convention is settled in `formatCurrency`'s own docblock — found on the App Preview's opening frame,
 * fixed at its root rather than per call site — and this file was outside it because a dead regex meant
 * nothing objected.
 *
 * ⚠️ **The `Math.max(0, …)` clamp is dropped, and it is provably dead here rather than merely unwanted:**
 * the callers pass the literals `100` and `200` and a debt's `minimumPayment`. ⛔ The clamp is also named
 * in `B1`'s own text as part of the defect it describes — it renders `$0.00` over a negative figure,
 * which is a false statement, not a safe default. `formatCurrency` guards non-finite values instead.
 */
function formatForecastCurrency(amount: number) {
    return formatCurrency(roundMoney(amount));
}