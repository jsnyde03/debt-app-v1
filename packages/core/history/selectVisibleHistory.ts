import type { PayCycleSnapshot } from "@core/storage/debtPlannerStorage";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { hasFeatureAccess } from "@/lib/subscription/hasFeatureAccess";

// Premium sees the last 6 cycles; Premium+ sees them all.
export const PREMIUM_HISTORY_CAP = 6;

// Tier-aware history slice, returned most-recent-first for display.
// - Premium+: the full history.
// - Premium: the PREMIUM_HISTORY_CAP most recent cycles.
// - Free: also capped, but the UI gates the whole view behind
//   pay_cycle_history access (see HistorySection), so free users never
//   reach this list - they see the upsell instead.
export function selectVisibleHistory(
    cycleHistory: PayCycleSnapshot[],
    plan: SubscriptionPlan
): PayCycleSnapshot[] {
    const mostRecentFirst = [...cycleHistory].reverse();

    if (hasFeatureAccess(plan, "unlimited_history")) {
        return mostRecentFirst;
    }

    return mostRecentFirst.slice(0, PREMIUM_HISTORY_CAP);
}
