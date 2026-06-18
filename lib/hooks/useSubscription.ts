import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { initializeRevenueCat, getSubscriptionPlan } from "@/lib/subscription/revenueCat";
import { scheduleNotifications, hasNotificationPermission } from "@/lib/notifications/scheduleNotifications";
import type { RequiredExpense } from "@/lib/storage/debtPlannerStorage";

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
                if (process.env.NODE_ENV === "development") {
                    const mock = localStorage.getItem("debtPlanner.mockSubscription");
                    if (mock === "premium") {
                        setSubscriptionPlan("premium");

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

                if (plan === "premium" && notificationsEnabled && nextPaycheckDate) {
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
