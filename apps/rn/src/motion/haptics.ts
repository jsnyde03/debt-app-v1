import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback — reserved for commit / success / snap only (never scroll or passive state), per
 * DEBT_MOTION_SPEC §6. No-op on web. The bespoke debt-paid-off Core Haptics pattern lands with the
 * 1.4 celebration; `success()` is the interim.
 */
const on = Platform.OS !== 'web';

export const haptics = {
  light: () => on && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => on && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
  error: () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};
