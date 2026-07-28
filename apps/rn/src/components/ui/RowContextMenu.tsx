import type { RowContextMenuProps } from './RowContextMenu.types';

/**
 * Long-press → native iOS context menu (a UIMenu with a row preview) — the standard premium iOS
 * affordance (Mail / Files) added in 3.5.2. This base file is a transparent passthrough: on web and
 * Android the row keeps only tap-to-edit + swipe-to-delete, unchanged. The real implementation lives in
 * `RowContextMenu.ios.tsx`, which Metro selects on iOS.
 */
export function RowContextMenu({ children }: RowContextMenuProps) {
  return <>{children}</>;
}
