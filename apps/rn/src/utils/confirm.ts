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
