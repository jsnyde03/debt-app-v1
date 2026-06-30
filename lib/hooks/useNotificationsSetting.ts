import { useEffect, useState } from "react";
import { loadStoredState } from "@/lib/storage/loadStoredState";
import { triggerLightHaptic } from "@/lib/mobile/haptics";
import { scheduleNotifications, cancelAllNotifications, requestNotificationPermission } from "@/lib/notifications/scheduleNotifications";
import type { RequiredExpense } from "@/lib/storage/debtPlannerStorage";

export function useNotificationsSetting(nextPaycheckDate: string, requiredExpenses: RequiredExpense[]) {
    const [notificationsEnabled, setNotificationsEnabled] = useState(() =>
        loadStoredState("debtPlanner.notificationsEnabled", false)
    );

    useEffect(() => {
        localStorage.setItem("debtPlanner.notificationsEnabled", JSON.stringify(notificationsEnabled));
    }, [notificationsEnabled]);

    async function handleNotificationsToggle() {
        triggerLightHaptic();

        if (notificationsEnabled) {
            await cancelAllNotifications();
            setNotificationsEnabled(false);
        } else {
            const granted = await requestNotificationPermission();
            if (granted) {
                setNotificationsEnabled(true);
                if (nextPaycheckDate) {
                    void scheduleNotifications({ nextPaycheckDate, requiredExpenses });
                }
            }
        }
    }

    return {
        notificationsEnabled,
        setNotificationsEnabled,
        handleNotificationsToggle,
    };
}
