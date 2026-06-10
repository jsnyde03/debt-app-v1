export type ForecastStatus = 
    | "stable"
    | "warning"
    | "risk";

export type ForecastMonth = {
    monthLabel: string;
    projectedSafeCash: number;
    projectedDebtBalance: number;
    status: ForecastStatus;
};