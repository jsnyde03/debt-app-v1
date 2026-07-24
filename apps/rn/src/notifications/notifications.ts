import * as Notifications from 'expo-notifications';

import type { RequiredExpense } from '@/data/models';

/**
 * Local-only notifications (B.9). No remote push — everything is scheduled on-device, so the app
 * needs no `aps-environment` entitlement (see the local-only config; keeps the App ID clean).
 * Faithful rebuild of the Capacitor `scheduleNotifications` schedule: paycheck-eve reminder,
 * payday-morning capture prompt, and an upcoming-bills alert.
 *
 * ⚠️ Native-only — scheduling/permissions verify on a real device/TestFlight build (Phase E), never
 * on web (the `.web` stub no-ops so the web bundle stays clean, [[feedback_native_module_verification_gap]]).
 */

const ID_PAYCHECK_EVE = 'paycheck-eve';
const ID_PAYDAY_CAPTURE = 'payday-capture';
const ID_BILLS_ALERT = 'bills-alert';
const ID_RISK = 'guardian-risk';
const ALL_IDS = [ID_PAYCHECK_EVE, ID_PAYDAY_CAPTURE, ID_BILLS_ALERT, ID_RISK];

/**
 * §2.8 Guardian risk push (2.4.10.2) — a NEUTRAL prompt, never a verdict a reconcile-to-clear would turn
 * into cried-wolf, and never a figure (the hedged number stays in-app). It under-claims by design: a
 * never-opened user gets exactly this, so it must be safe even if the read later reconciles to clear.
 */
export const RISK_NOTIFICATION = {
  title: 'Time to check this paycheck',
  body: 'Take a quick look at your plan before this one lands.',
} as const;

// Show notifications while the app is foregrounded (banner + list).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function cancelKnown(): Promise<void> {
  await Promise.all(ALL_IDS.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

export async function cancelAllNotifications(): Promise<void> {
  await cancelKnown();
}

type SyncParams = {
  nextPaycheckDate: string;
  requiredExpenses: RequiredExpense[];
};

/** Re-derive the full local schedule from current state (call on enable, paycheck change, rollover). */
export async function syncNotifications({ nextPaycheckDate, requiredExpenses }: SyncParams): Promise<void> {
  await cancelKnown();
  if (!nextPaycheckDate) return;

  const now = new Date();
  const paycheckDate = new Date(`${nextPaycheckDate}T00:00:00`);

  // Paycheck-eve reminder: 8pm the night before payday.
  const paycheckEve = new Date(paycheckDate);
  paycheckEve.setDate(paycheckEve.getDate() - 1);
  paycheckEve.setHours(20, 0, 0, 0);
  if (paycheckEve > now) {
    await schedule(ID_PAYCHECK_EVE, 'Paycheck Tomorrow', 'Your paycheck arrives tomorrow — open Debt Planner to run your plan.', paycheckEve);
  }

  // Payday-morning capture prompt: 9am ON payday (brings the user in as the capture sheet auto-opens).
  const paydayMorning = new Date(paycheckDate);
  paydayMorning.setHours(9, 0, 0, 0);
  if (paydayMorning > now) {
    await schedule(ID_PAYDAY_CAPTURE, "It's payday", 'Open Debt Planner to confirm your plan for this paycheck.', paydayMorning);
  }

  // Bills alert: 8pm two days before the earliest upcoming unpaid bill, unless that's the eve day.
  const today = now.toISOString().slice(0, 10);
  const upcomingUnpaid = requiredExpenses
    .filter((e) => !e.isPaidThisCycle && e.dueDate > today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const earliest = upcomingUnpaid[0];
  if (earliest) {
    const billAlert = new Date(`${earliest.dueDate}T00:00:00`);
    billAlert.setDate(billAlert.getDate() - 2);
    billAlert.setHours(20, 0, 0, 0);
    const sameDayAsEve = billAlert.toDateString() === paycheckEve.toDateString();
    if (billAlert > now && !sameDayAsEve) {
      const count = upcomingUnpaid.length;
      const title = count === 1 ? 'Upcoming Bill' : `${count} Upcoming Bills`;
      const body =
        count === 1
          ? `${earliest.name} is due soon — check your plan.`
          : `${earliest.name} and ${count - 1} more due soon — check your plan.`;
      await schedule(ID_BILLS_ALERT, title, body, billAlert);
    }
  }
}

/**
 * §2.8 (2.4.10.4) — schedule the Guardian RISK push for `fireAt` (paycheck-eve). Returns whether a push
 * was actually scheduled, so the caller only stamps the notify-state / push-log when one really went out
 * (on web the stub returns false → the state is never falsely marked "notified"). A fire time already in
 * the past delivers promptly, so a never-opened at-risk user still gets the heads-up. Native-only.
 */
export async function scheduleRiskNotification(fireAt: Date): Promise<boolean> {
  await Notifications.cancelScheduledNotificationAsync(ID_RISK).catch(() => {});
  const now = new Date();
  const when = fireAt > now ? fireAt : new Date(now.getTime() + 5_000);
  await schedule(ID_RISK, RISK_NOTIFICATION.title, RISK_NOTIFICATION.body, when);
  return true;
}

export async function cancelRiskNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID_RISK).catch(() => {});
}

function schedule(identifier: string, title: string, body: string, date: Date): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}
