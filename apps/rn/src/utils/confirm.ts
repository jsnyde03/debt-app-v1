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
