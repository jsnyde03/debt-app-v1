import { useEffect } from 'react';

import { cancelAllNotifications, syncNotifications } from '@/notifications/notifications';
import { useAppStore } from '@/store/useAppStore';

/**
 * Keeps the local notification schedule in sync with state (B.9). Reschedules whenever the paycheck
 * date or the upcoming-bills set changes while notifications are enabled — which covers rollover,
 * paycheck edits, and bill edits without hooking each mutation site. Disabling cancels everything.
 * On web every call no-ops (the `.web` notifications stub), so this is inert there.
 */
export function useNotificationSync(): void {
  const enabled = useAppStore((s) => s.store.prefs.notificationsEnabled);
  const nextPaycheckDate = useAppStore((s) => s.store.paycheck.nextPaycheckDate);
  const requiredExpenses = useAppStore((s) => s.store.requiredExpenses);

  // A stable signature of only the fields that affect the schedule, so we don't reschedule on
  // unrelated store writes (array identity changes every action).
  const billsSignature = requiredExpenses
    .map((e) => `${e.dueDate}:${e.isPaidThisCycle ? 1 : 0}:${e.name}`)
    .join('|');

  useEffect(() => {
    if (!enabled) {
      void cancelAllNotifications();
      return;
    }
    void syncNotifications({ nextPaycheckDate, requiredExpenses });
    // requiredExpenses is intentionally excluded from deps in favor of its stable signature.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nextPaycheckDate, billsSignature]);
}
