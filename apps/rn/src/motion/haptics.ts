import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { requireNativeModule } from 'expo-modules-core';

/**
 * Haptic feedback — reserved for commit / success / snap only (never scroll or passive state), per
 * DEBT_MOTION_SPEC §6. No-op on web.
 *
 * `finale()` is the bespoke debt-free celebration haptic (VIS-1): a real Core Haptics crescendo via the
 * `FinaleHaptics` local module on iOS, an expo-haptics crescendo on Android, no-op on web.
 */
const on = Platform.OS !== 'web';

// Lazy native lookup (never at import — the 3.6.6 phase-wide invariant). iOS-only module; `undefined` =
// not yet resolved, `null` = unavailable (Android / lookup failed) → use the primitive crescendo.
let _finaleNative: { playFinale: () => void } | null | undefined;
function finaleNative(): { playFinale: () => void } | null {
  if (_finaleNative !== undefined) return _finaleNative;
  if (Platform.OS !== 'ios') return (_finaleNative = null);
  try {
    _finaleNative = requireNativeModule<{ playFinale: () => void }>('FinaleHaptics');
  } catch {
    _finaleNative = null;
  }
  return _finaleNative;
}

// The Android / fallback crescendo, composed from expo-haptics primitives — a rising
// light → medium → heavy tap sequence that crests into a success notification (~700ms).
function crescendoFallback() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 180);
  setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 380);
  setTimeout(() => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 560);
}

export const haptics = {
  light: () => on && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => on && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
  error: () => on && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
  /** The bespoke debt-free FINALE crescendo — native Core Haptics (iOS) / primitive crescendo (Android). */
  finale: () => {
    if (!on) return;
    const native = finaleNative();
    if (native) {
      try {
        native.playFinale();
        return;
      } catch {
        // fall through to the primitive crescendo
      }
    }
    crescendoFallback();
  },
};
