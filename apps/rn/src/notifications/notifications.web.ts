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
