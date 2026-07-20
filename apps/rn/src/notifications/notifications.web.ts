import type { RequiredExpense } from '@/data/models';

/**
 * Web no-op stub for the native notifications module. Local notifications are a native-only feature;
 * on web these all no-op so the web bundle never pulls in `expo-notifications`. Must export the SAME
 * surface as `notifications.ts` ([[feedback_platform_split_reexport_gap]]).
 */

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function cancelAllNotifications(): Promise<void> {}

export async function syncNotifications(_params: {
  nextPaycheckDate: string;
  requiredExpenses: RequiredExpense[];
}): Promise<void> {}
