import { requireNativeViewManager } from 'expo-modules-core';
import { router } from 'expo-router';
import type { ComponentType } from 'react';
import { StyleSheet } from 'react-native';

import { requestAddDebt } from './keyCommandBus';

/**
 * 3.6.6 — mounts the native `KeyCommands` view (an invisible, non-interactive responder that declares the
 * ⌘-shortcuts) at the app root and routes each emitted command:
 *   ⌘N → Money + open the add-debt sheet (via the bus) · ⌘1/2/3 → Today / Progress / Money.
 * Rendered once from the root layout; on iPhone / touch there's no hardware keyboard, so it's inert.
 *
 * ⚠️ Device-QA (3.6.7): (1) the native view holding first responder inside RN's tree, and (2) whether a
 * root-level `router.navigate` to a tab lands cleanly (vs. the detached-tab-group blank screen that
 * `use-go-to-tab` guards against on device) — both are only verifiable on a real iPad with a keyboard.
 * If the tab switches misbehave on device, route them through the tab navigator's jumpTo instead.
 */
type NativeKeyCommandsProps = {
  style?: object;
  onCommand?: (event: { nativeEvent: { id: string } }) => void;
};

// This file is `.ios.tsx`, so metro only resolves it on iOS — web + Android get the no-op base. (An earlier
// `.native.tsx` split leaked onto web here and blanked every route; `.ios` is the codebase convention that
// doesn't. See KeyCommandListener.tsx.) The native lookup is still deferred out of module scope as cheap
// insurance, so importing this module is always side-effect-free.
let _nativeView: ComponentType<NativeKeyCommandsProps> | null = null;
function nativeKeyCommandsView(): ComponentType<NativeKeyCommandsProps> {
  return (_nativeView ??= requireNativeViewManager('KeyCommands') as ComponentType<NativeKeyCommandsProps>);
}

const TAB_ROUTES: Record<string, string> = {
  'tab-today': '/',
  'tab-progress': '/progress',
  'tab-money': '/money',
};

export function KeyCommandListener() {
  const NativeKeyCommands = nativeKeyCommandsView();
  return (
    <NativeKeyCommands
      style={styles.hidden}
      onCommand={({ nativeEvent }) => {
        if (nativeEvent.id === 'new-debt') {
          router.navigate('/money');
          requestAddDebt();
          return;
        }
        const to = TAB_ROUTES[nativeEvent.id];
        if (to) router.navigate(to as Parameters<typeof router.navigate>[0]);
      }}
    />
  );
}

const styles = StyleSheet.create({
  // Zero-footprint: it exists only to carry the key commands, never to draw or catch touches.
  hidden: { position: 'absolute', width: 0, height: 0 },
});
