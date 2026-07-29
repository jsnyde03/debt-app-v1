import { ContextMenuView, type MenuActionConfig } from 'react-native-ios-context-menu';

import type { RowContextMenuProps } from './RowContextMenu.types';

/**
 * iOS long-press context menu for a list row (3.5.2) — the standard premium iOS affordance
 * (Mail / Files). Builds a UIMenu from `actions`; a `destructive` action renders red. Tap → edit and
 * swipe → delete on the row are untouched — this only adds the long-press path (the menu passes taps
 * through to its child). Uses `react-native-ios-context-menu@3.1.3` (3.2.x publishes broken — see the
 * typed shim in `src/types/`).
 */
export function RowContextMenu({ title, actions, children }: RowContextMenuProps) {
  const menuItems: MenuActionConfig[] = actions.map((a) => ({
    actionKey: a.key,
    actionTitle: a.title,
    menuAttributes: a.destructive ? ['destructive'] : undefined,
    icon: a.systemIcon ? { type: 'IMAGE_SYSTEM', imageValue: { systemName: a.systemIcon } } : undefined,
  }));

  return (
    <ContextMenuView
      menuConfig={{ menuTitle: title, menuItems }}
      // Explicit DEFAULT preview with a TRANSPARENT platter — without this the preview's background can
      // render opaque and mask the system blur (device: menu showed but no blur/dim behind it). The
      // rounded corners match the row card so the lifted preview reads premium.
      previewConfig={{ previewType: 'DEFAULT', backgroundColor: 'transparent', borderRadius: 14 }}
      onPressMenuItem={({ nativeEvent }) => {
        actions.find((a) => a.key === nativeEvent.actionKey)?.onPress();
      }}>
      {children}
    </ContextMenuView>
  );
}
