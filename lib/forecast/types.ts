export type ForecastStatus =
    | "stable"
    | "tight"
    | "pressure"
    | "recovery";


export type ForecastMonth = {
    monthLabel: string;
    projectedSafeCash: number;
    projectedDebtBalance: number;
    status: ForecastStatus;
    recommendedAction: string;
    riskDrivers: string[];
    recoveryMonth?: string;
    recoveryTrend?: string;
    reliefPoint?: string;
};