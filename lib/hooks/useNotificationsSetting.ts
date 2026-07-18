import { usePersistedState } from "@/lib/storage/usePersistedState";
import { triggerLightHaptic } from "@/lib/mobile/haptics";
import { scheduleNotifications, cancelAllNotifications, requestNotificationPermission } from "@/lib/notifications/scheduleNotifications";
import type { RequiredExpense } from "@core/storage/debtPlannerStorage";

export function useNotificationsSetting(nextPaycheckDate: string, requiredExpenses: RequiredExpense[]) {
    const [notificationsEnabled, setNotificationsEnabled] = usePersistedState(
        "debtPlanner.notificationsEnabled",
        false
    );

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
