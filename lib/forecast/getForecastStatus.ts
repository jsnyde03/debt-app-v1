import type { ForecastStatus } from "./types";

export function getForecastStatus(safeCash: number): ForecastStatus {
    if (safeCash < 0) {
        return "risk";
    }

    if (safeCash < 200) {
        return "warning"
    }

    return "stable";
}