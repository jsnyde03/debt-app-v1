import type { ReactNode } from 'react';

/**
 * One entry in a row's long-press menu. `systemIcon` is an SF Symbol name (iOS-only; ignored
 * elsewhere). `destructive` renders the action red. Shared by both the base and `.ios` implementations
 * — kept in this NON-platform-split file so `RowContextMenu.ios.tsx` can import it without the import
 * resolving back to itself (the platform-split re-export trap).
 */
export type RowMenuAction = {
  key: string;
  title: string;
  systemIcon?: string;
  destructive?: boolean;
  onPress: () => void;
};

export type RowContextMenuProps = {
  /** Title shown at the top of the iOS menu (typically the row's title). */
  title: string;
  actions: RowMenuAction[];
  children: ReactNode;
};
