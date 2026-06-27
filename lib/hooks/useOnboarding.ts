import { useState } from "react";
import { loadStoredState } from "@/lib/storage/loadStoredState";

export function useOnboarding() {
    // Existing users (pre-v1.4) who already have a paycheck configured are treated
    // as onboarded — they must never see the new flow on upgrade.
    const [hasCompletedOnboarding] = useState<boolean>(() => {
        if (loadStoredState<boolean>("debtPlanner.hasCompletedOnboarding", false)) return true;
        const amount = loadStoredState<string>("debtPlanner.amount", "");
        return amount !== "" && Number(amount) > 0;
    });

    return { hasCompletedOnboarding };
}
