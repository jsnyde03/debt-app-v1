import { getForecastStatus } from "./getForecastStatus";
import type { ForecastMonth } from "./types";

type ProjectForecastParams = {
    startingSafeCash: number;
    startingDebtBalance: number;
    monthlyDebtReduction: number;
    months: number;
};

export function projectForecast({ startingSafeCash, startingDebtBalance, monthlyDebtReduction, months, }: ProjectForecastParams): ForecastMonth[] {
    const results: ForecastMonth[] = [];

    let currentDebtBalance = startingDebtBalance;

    for ( let index = 0; index < months; index++ ){
        currentDebtBalance = Math.max(0, currentDebtBalance - monthlyDebtReduction);
        const projectedSafeCash = startingSafeCash;
        const monthDate = new Date();

        monthDate.setMonth(monthDate.getMonth() + index);

        results.push({
            monthLabel: monthDate.toLocaleString("default", { month: "long", year: "numeric" }),
            projectedSafeCash,
            projectedDebtBalance: Math.round(currentDebtBalance * 100) / 100,
            status: getForecastStatus(projectedSafeCash),
        });
     }

     return results;
}