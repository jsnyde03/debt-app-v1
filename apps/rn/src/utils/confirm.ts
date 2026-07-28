import { Alert, Platform } from 'react-native';

/**
 * A cross-platform destructive confirm. `Alert.alert` is a no-op on react-native-web, so web falls back
 * to the native `window.confirm`; iOS/Android get a proper destructive Alert. Resolves true on confirm.
 * Used by swipe-to-delete (3.4.4) — the sheet's own Remove stays a direct action.
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
