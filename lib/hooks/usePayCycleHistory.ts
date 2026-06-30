import { useEffect, useState } from "react";
import { loadStoredState } from "@/lib/storage/loadStoredState";
import {
    CYCLE_HISTORY_STORAGE_KEY,
    type PayCycleSnapshot,
} from "@/lib/storage/debtPlannerStorage";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { hasFeatureAccess } from "@/lib/subscription/hasFeatureAccess";
import {
    PREMIUM_HISTORY_CAP,
    selectVisibleHistory,
} from "@/lib/history/selectVisibleHistory";

// Owns the appended cycleHistory array + its persistence, and exposes
// tier-aware views over it. Snapshots are recorded by the rollover
// handler in app/page.tsx via recordCycleSnapshot.
export function usePayCycleHistory(subscriptionPlan: SubscriptionPlan) {
    const [cycleHistory, setCycleHistory] = useState<PayCycleSnapshot[]>(() =>
        loadStoredState(CYCLE_HISTORY_STORAGE_KEY, [])
    );

    useEffect(() => {
        localStorage.setItem(
            CYCLE_HISTORY_STORAGE_KEY,
            JSON.stringify(cycleHistory)
        );
    }, [cycleHistory]);

    function recordCycleSnapshot(snapshot: PayCycleSnapshot) {
        setCycleHistory((current) => [...current, snapshot]);
    }

    // Whether the user can open the history view at all (Premium+).
    const canAccessHistory = hasFeatureAccess(
        subscriptionPlan,
        "pay_cycle_history"
    );

    // Premium+ removes the cap; Premium is limited to the most recent 6.
    const hasUnlimitedHistory = hasFeatureAccess(
        subscriptionPlan,
        "unlimited_history"
    );

    const visibleHistory = selectVisibleHistory(cycleHistory, subscriptionPlan);

    // True when real cycles exist beyond what a capped (Premium) tier can
    // see - drives the "upgrade for full history" upsell row at the cap.
    const isHistoryCapped =
        !hasUnlimitedHistory && cycleHistory.length > PREMIUM_HISTORY_CAP;

    // Most recent snapshot (or null) - used by the Since-Last-Cycle delta (#13).
    const previousSnapshot =
        cycleHistory.length > 0
            ? cycleHistory[cycleHistory.length - 1]
            : null;

    return {
        cycleHistory,
        setCycleHistory,
        recordCycleSnapshot,
        visibleHistory,
        previousSnapshot,
        canAccessHistory,
        hasUnlimitedHistory,
        isHistoryCapped,
    };
}
