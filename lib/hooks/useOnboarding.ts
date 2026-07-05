import { useState } from "react";
import { readKeyValue } from "@/lib/storage/safeStorage";

export function useOnboarding() {
    // Existing users (pre-v1.4) who already have a paycheck configured are treated
    // as onboarded — they must never see the new flow on upgrade.
    const [hasCompletedOnboarding] = useState<boolean>(() => {
        if (readKeyValue<boolean>("debtPlanner.hasCompletedOnboarding", false)) return true;
        const amount = readKeyValue<string>("debtPlanner.amount", "");
        return amount !== "" && Number(amount) > 0;
    });

    return { hasCompletedOnboarding };
}
