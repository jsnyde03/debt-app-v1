import type { RequiredExpense } from '@/data/models';

/**
 * Web no-op stub for the native notifications module. Local notifications are a native-only feature;
 * on web these all no-op so the web bundle never pulls in `expo-notifications`. Must export the SAME
 * surface as `notifications.ts` ([[feedback_platform_split_reexport_gap]]).
 */

export const RISK_NOTIFICATION = {
  title: 'Time to check this paycheck',
  body: 'Take a quick look at your plan before this one lands.',
} as const;

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export type NotificationPermission = 'granted' | 'blocked' | 'declined' | 'unsupported';

/** Web has nothing to grant — `unsupported`, so the caller says that rather than "open Settings". */
export async function requestNotificationPermissionDetailed(): Promise<NotificationPermission> {
  return 'unsupported';
}

export async function cancelAllNotifications(): Promise<void> {}

/** Web no-op — returns false so the caller never stamps the notify-state without a delivered push. */
export async function scheduleRiskNotification(_fireAt: Date): Promise<boolean> {
  return false;
}

export async function cancelRiskNotification(): Promise<void> {}

export async function syncNotifications(_params: {
  nextPaycheckDate: string;
  requiredExpenses: RequiredExpense[];
}): Promise<void> {}

// VIS-6 interactive-notification surface — web no-ops (same exports as the native module).
export const NOTIF_CATEGORY_PAYDAY = 'payday-actions';
export const NOTIF_CATEGORY_RISK = 'risk-actions';
export const NOTIF_CATEGORY_BILLS = 'bills-actions';

export async function registerNotificationCategories(): Promise<void> {}

export function addNotificationResponseListener(_onOpen: () => void): () => void {
  return () => {};
}
