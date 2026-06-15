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
    let recoveryMonth: string | undefined;

    for (let index = 0; index < months; index++) {
        currentDebtBalance = Math.max(0, currentDebtBalance - monthlyDebtReduction);

        const projectedSafeCash = roundMoney(startingSafeCash + bufferTrendPerMonth * index);

        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() + index);
        const monthLabel = monthDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
        });

        const status = getForecastStatus(projectedSafeCash);

        if (!recoveryMonth && projectedSafeCash >= 200) {
            recoveryMonth = monthLabel;
        }

        results.push({
            monthLabel,
            projectedSafeCash,
            projectedDebtBalance: roundMoney(currentDebtBalance),
            status,
            recommendedAction: getRecommendedAction(status, projectedSafeCash),
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
                    : "Project cushion remains within a healthier range.",
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

function getRecommendedAction(status: ForecastStatus, projectedSafeCash: number) {
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

function formatForecastCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(Math.max(0, roundMoney(amount)));
}