import { useEffect } from 'react';

import { cancelAllNotifications, cancelRiskNotification, scheduleRiskNotification, syncNotifications } from '@/notifications/notifications';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian, selectRiskNotification } from '@/store/guardianSelectors';
import { appStore } from '@/store/appStore';
import { allowRealStoreWrite } from '@/store/realWriteGuard';
import { useAppStore } from '@/store/useAppStore';

/** Paycheck-eve, 8pm the night before payday — when the Guardian risk heads-up should land. */
function paycheckEve(nextPaycheckDate: string): Date {
  const d = new Date(`${nextPaycheckDate}T00:00:00`);
  d.setDate(d.getDate() - 1);
  d.setHours(20, 0, 0, 0);
  return d;
}

/**
 * Keeps the local notification schedule in sync with state (B.9). Reschedules the reminder set whenever
 * the paycheck date or the upcoming-bills set changes while notifications are enabled. Disabling cancels
 * everything. On web every call no-ops (the `.web` stub), so this is inert there.
 *
 * §2.8 (2.4.10.3) adds the proactive Guardian RISK push: on the risk-relevant state changing, evaluate
 * `selectRiskNotification` (premium; risk-only, escalate-on-change, ≤2/rolling-month) and schedule/cancel
 * accordingly — stamping the notify-state ONLY when a push actually delivered (web's stub returns false,
 * so it never falsely marks "notified"). A read that reconciled to clear pulls the pending heads-up.
 */
export function useNotificationSync(): void {
  const store = useAppStore((s) => s.store);
  const enabled = store.prefs.notificationsEnabled;
  const isPremium = store.subscriptionPlan === 'premium';
  const nextPaycheckDate = store.paycheck.nextPaycheckDate;
  const requiredExpenses = store.requiredExpenses;

  // A stable signature of only the fields that affect the reminder schedule (array identity churns).
  const billsSignature = requiredExpenses.map((e) => `${e.dueDate}:${e.isPaidThisCycle ? 1 : 0}:${e.name}`).join('|');

  useEffect(() => {
    if (!enabled) {
      void cancelAllNotifications();
      return;
    }
    void syncNotifications({ nextPaycheckDate, requiredExpenses });
    // requiredExpenses excluded in favor of its stable signature.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, nextPaycheckDate, billsSignature]);

  // §2.8 proactive risk push (premium). Signature captures every input the decision reads, so it fires
  // once per genuine change (and again after the stamp flips `fire` off → converges, no loop).
  const engineStore = withProjectedBalances(store, isPremium);
  const band = selectPaydayGuardian(engineStore)?.state ?? 'clear';
  const notify = store.currentCycleNotifyState;
  const riskSignature = `${enabled}:${isPremium}:${nextPaycheckDate}:${band}:${notify?.forCycleEndDate ?? ''}:${notify?.notifiedRiskLevel ?? ''}:${store.pushLog.length}`;

  useEffect(() => {
    if (!enabled || !isPremium) {
      void cancelRiskNotification();
      return;
    }
    const now = new Date().toISOString();
    const decision = selectRiskNotification(engineStore, now);
    if (decision.fire) {
      void scheduleRiskNotification(paycheckEve(nextPaycheckDate)).then((scheduled) => {
        // [R4] Declared. The heads-up is scheduled off a promise and the bookkeeping that records it
        // must land, whatever is on screen when it resolves — an undeclared write is now DROPPED, and a
        // dropped `applyRiskNotified` re-fires the same notification on the next evaluation.
        if (scheduled)
          allowRealStoreWrite(() => appStore.getState().applyRiskNotified(nextPaycheckDate, decision.level, now));
      });
    } else if (band === 'clear') {
      // Reconciled to clear before it fired — pull the pending heads-up (never cry wolf).
      void cancelRiskNotification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskSignature]);
}
