import type { ForecastStatus } from "./types";

export function getForecastStatus(projectedSafeCash: number) : ForecastStatus {
    if (projectedSafeCash < 0) {
        return "recovery";
    }

    if (projectedSafeCash < 100) {
        return "pressure";
    }

    if (projectedSafeCash < 200) {
        return "tight";
    }

    return "stable";
}