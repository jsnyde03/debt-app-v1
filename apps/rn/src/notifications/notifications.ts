import * as Notifications from 'expo-notifications';

import { toLocalISODate } from '@core/utils/localDate';

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
 * Interactive-notification categories (VIS-6) — each scheduled notification carries a category so it
 * shows an actionable button, not just a tappable banner. Every action opens the app to Today (where the
 * payday-capture auto-opens and the Guardian read lives), so acting from the notification is one tap.
 * `opensAppToForeground` keeps them foreground actions (no silent background mutation — the app decides).
 */
export const NOTIF_CATEGORY_PAYDAY = 'payday-actions';
export const NOTIF_CATEGORY_RISK = 'risk-actions';
export const NOTIF_CATEGORY_BILLS = 'bills-actions';
const CATEGORY_ACTIONS: Record<string, { identifier: string; buttonTitle: string }> = {
  [NOTIF_CATEGORY_PAYDAY]: { identifier: 'run-plan', buttonTitle: 'Run your plan' },
  [NOTIF_CATEGORY_RISK]: { identifier: 'review-plan', buttonTitle: 'Review your plan' },
  [NOTIF_CATEGORY_BILLS]: { identifier: 'review-bills', buttonTitle: 'Check your plan' },
};

/** Register the interactive-notification categories once at app init. Idempotent; native-only. */
export async function registerNotificationCategories(): Promise<void> {
  await Promise.all(
    Object.entries(CATEGORY_ACTIONS).map(([category, action]) =>
      Notifications.setNotificationCategoryAsync(category, [
        { identifier: action.identifier, buttonTitle: action.buttonTitle, options: { opensAppToForeground: true } },
      ]).catch(() => {}),
    ),
  );
}

/**
 * Listen for a notification tap / action press and route the app to Today (`onOpen`). Covers both an
 * action-button press and a plain tap (DEFAULT action) on any of our categories. Returns an unsubscribe.
 * Native-only (the web stub no-ops).
 */
export function addNotificationResponseListener(onOpen: () => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const category = response.notification.request.content.categoryIdentifier;
    if (category && category in CATEGORY_ACTIONS) onOpen();
  });
  return () => sub.remove();
}

import { RISK_NOTIFICATION } from './notificationCopy';

export { RISK_NOTIFICATION };

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

/**
 * The permission outcome with the one bit a boolean cannot carry: whether asking again does anything.
 *
 * ⚠️ iOS shows its permission alert **once, ever**. After a decline, `requestPermissionsAsync` returns
 * immediately with `denied` and no UI — so "the user just said no" and "the OS will never ask again"
 * are the same `false` to a caller reading a boolean, and the only honest response to the second is to
 * send them to Settings. `unsupported` is the web branch, where there is nothing to grant.
 */
export type NotificationPermission = 'granted' | 'blocked' | 'declined' | 'unsupported';

export async function requestNotificationPermissionDetailed(): Promise<NotificationPermission> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  // `canAskAgain === false` means the OS will not present the prompt — a retry is silently a no-op.
  if (!current.canAskAgain) return 'blocked';
  const next = await Notifications.requestPermissionsAsync();
  if (next.status === 'granted') return 'granted';
  return next.canAskAgain ? 'declined' : 'blocked';
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
    await schedule(ID_PAYCHECK_EVE, 'Paycheck tomorrow', 'Your paycheck arrives tomorrow — open Debt Planner to run your plan.', paycheckEve, NOTIF_CATEGORY_PAYDAY);
  }

  // Payday-morning capture prompt: 9am ON payday (brings the user in as the capture sheet auto-opens).
  const paydayMorning = new Date(paycheckDate);
  paydayMorning.setHours(9, 0, 0, 0);
  if (paydayMorning > now) {
    await schedule(ID_PAYDAY_CAPTURE, "It's payday", 'Open Debt Planner to confirm your plan for this paycheck.', paydayMorning, NOTIF_CATEGORY_PAYDAY);
  }

  // Bills alert: 8pm two days before the earliest upcoming unpaid bill, unless that's the eve day.
  const today = toLocalISODate(now);
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
      const title = count === 1 ? 'Upcoming expense' : `${count} upcoming expenses`;
      const body =
        count === 1
          ? `${earliest.name} is due soon — check your plan.`
          : `${earliest.name} and ${count - 1} more due soon — check your plan.`;
      await schedule(ID_BILLS_ALERT, title, body, billAlert, NOTIF_CATEGORY_BILLS);
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
  await schedule(ID_RISK, RISK_NOTIFICATION.title, RISK_NOTIFICATION.body, when, NOTIF_CATEGORY_RISK);
  return true;
}

export async function cancelRiskNotification(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID_RISK).catch(() => {});
}

function schedule(identifier: string, title: string, body: string, date: Date, categoryIdentifier?: string): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, ...(categoryIdentifier ? { categoryIdentifier } : {}) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}
