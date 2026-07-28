// Typed shim for `react-native-ios-context-menu`, which we pin at 3.1.3 (see the 3.5.2 note in
// docs/DEBT_ELEVATION_PLAN.md). 3.1.3 ships built JS (lib/commonjs + lib/module) so Metro/runtime
// resolve fine, but it publishes NO `.d.ts` (its `types` field dangles), so tsc has nothing to go on.
// 3.2.x is worse — source-only, also typeless. This declares only the surface RowContextMenu.ios.tsx
// touches, giving real type-safety on our usage without depending on the package's missing types. If a
// future version ships proper declarations, delete this file.
declare module 'react-native-ios-context-menu' {
  import type { ComponentType, ReactNode } from 'react';
  import type { NativeSyntheticEvent, ViewProps } from 'react-native';

  /** Maps to `UIMenuElement.Attributes`. */
  export type MenuAttributes = 'hidden' | 'disabled' | 'destructive' | 'keepsMenuPresented';

  /** SF Symbol icon for a menu action (the modern `ImageItemConfig` shape). */
  export type ImageSystemConfig = { type: 'IMAGE_SYSTEM'; imageValue: { systemName: string } };

  /** A single tappable menu action (subset of the lib's `MenuActionConfig`). */
  export type MenuActionConfig = {
    type?: 'action';
    actionKey: string;
    actionTitle: string;
    actionSubtitle?: string;
    menuState?: 'on' | 'off' | 'mixed';
    menuAttributes?: MenuAttributes[];
    icon?: ImageSystemConfig;
  };

  export type MenuConfig = {
    menuTitle: string;
    menuItems?: MenuActionConfig[];
  };

  export type OnPressMenuItemEventObject = NativeSyntheticEvent<MenuActionConfig>;

  export interface ContextMenuViewProps extends ViewProps {
    menuConfig?: MenuConfig;
    onPressMenuItem?: (event: OnPressMenuItemEventObject) => void;
    children?: ReactNode;
  }

  export const ContextMenuView: ComponentType<ContextMenuViewProps>;
}
