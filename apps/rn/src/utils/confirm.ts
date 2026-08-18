import { Alert, Platform } from 'react-native';

/**
 * A cross-platform destructive confirm. `Alert.alert` is a no-op on react-native-web, so web falls back
 * to the native `window.confirm`; iOS/Android get a proper destructive Alert. Resolves true on confirm.
 * Used by EVERY destructive entry point: swipe-to-delete (3.4.4), the iOS long-press menu (3.5.2), and
 * — since 3.5.6b — the entity sheets' own Remove. That last one used to be a deliberate direct action;
 * a Maestro tap on the Simulator destroyed a debt through it in one touch, which retired the argument.
 * `WindfallSheet` is the deliberate exception: its Remove zeroes an amount, it deletes no record.
 */
export function confirmDelete(message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm(message) : true);
  }
  return new Promise((resolve) => {
    Alert.alert('Delete?', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/**
 * Tell the user something, on every platform. The one-way sibling of `confirmDelete`.
 *
 * ⛔ **`Alert.alert` is `static alert() {}` in react-native-web — an EMPTY FUNCTION.** Measured in
 * `react-native-web@0.21`. So a message written with it is delivered on iOS and silently discarded on
 * web, and no Playwright assertion can see the difference between that and a message nobody wrote. This
 * file already knew it for the *confirm* direction; the one-way direction had no owner, so eleven call
 * sites used the raw API.
 *
 * `actionLabel`/`onAction` add an optional second button (iOS), which degrades on web to a `confirm`
 * whose OK runs the action — the same shape `confirmDelete` uses.
 */
export function notify(title: string, message: string, action?: { label: string; onPress: () => void }): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    if (action && typeof window.confirm === 'function') {
      if (window.confirm(`${title}\n\n${message}`)) action.onPress();
      return;
    }
    if (typeof window.alert === 'function') window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message, action
    ? [{ text: 'Not now', style: 'cancel' }, { text: action.label, onPress: action.onPress }]
    : undefined);
}

/** Confirm discarding unsaved edits before a sheet is dismissed by tap/swipe (3.4.5.5 dirty-guard). */
export function confirmDiscard(): Promise<boolean> {
  const message = 'Discard your changes?';
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && typeof window.confirm === 'function' ? window.confirm(message) : true);
  }
  return new Promise((resolve) => {
    Alert.alert('Discard changes?', message, [
      { text: 'Keep editing', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Discard', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
