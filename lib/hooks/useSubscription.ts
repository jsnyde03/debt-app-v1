import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { initializeRevenueCat, getSubscriptionPlan } from "@/lib/subscription/revenueCat";
import { scheduleNotifications, hasNotificationPermission } from "@/lib/notifications/scheduleNotifications";
import type { RequiredExpense } from "@core/storage/debtPlannerStorage";

export function useSubscription(
    notificationsEnabled: boolean,
    nextPaycheckDate: string,
    requiredExpenses: RequiredExpense[],
    setNotificationsEnabled: (value: boolean) => void
) {
    const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("free");
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState("");

    useEffect(() => {
        async function loadSubscription() {
            try {
                // Dev-only test seam for simulating a paid plan. Also enabled when
                // NEXT_PUBLIC_E2E=1 so the e2e harness (which runs against a *production*
                // build — see playwright.config.ts) can exercise premium flows. The real
                // shipped build (codemagic `npm run build`, no flag) sets neither, so this
                // whole branch compiles out — users can never fake premium via localStorage.
                if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_E2E === "1") {
                    const mock = localStorage.getItem("debtPlanner.mockSubscription");
                    if (mock === "premium" || mock === "premium_plus") {
                        setSubscriptionPlan(mock);

                        if (notificationsEnabled && nextPaycheckDate) {
                            const permitted = await hasNotificationPermission();
                            if (permitted) {
                                void scheduleNotifications({ nextPaycheckDate, requiredExpenses });
                            } else {
                                setNotificationsEnabled(false);
                            }
                        }

                        return;
                    }
                }

                await initializeRevenueCat();

                const plan = await getSubscriptionPlan();
                setSubscriptionPlan(plan);
                console.log("Loaded subscription plan:", plan);

                if (notificationsEnabled && nextPaycheckDate) {
                    const permitted = await hasNotificationPermission();
                    if (permitted) {
                        void scheduleNotifications({ nextPaycheckDate, requiredExpenses });
                    } else {
                        setNotificationsEnabled(false);
                    }
                }
            } catch (error) {
                console.log("RevenueCat init failed", error)
            }
        }

        void loadSubscription();
        // Mount-only init: RevenueCat setup + one initial notification-permission
        // check. Intentionally runs once — re-running whenever notificationsEnabled /
        // nextPaycheckDate / requiredExpenses change would re-initialize RevenueCat
        // on every data change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        subscriptionPlan,
        setSubscriptionPlan,
        showUpgrade,
        setShowUpgrade,
        purchaseStatus,
        setPurchaseStatus,
    };
}
