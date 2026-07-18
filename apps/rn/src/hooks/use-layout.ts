import { useWindowDimensions } from 'react-native';

import { layout } from '@/theme/spacing';
import { resolveIsExpanded, resolveSizeClass, type SizeClass } from '@/utils/sizeClass';

export interface LayoutInfo {
  width: number;
  height: number;
  sizeClass: SizeClass;
  isRegular: boolean;
  isCompact: boolean;
  /** True on a wide window (landscape iPad / wide Stage Manager) — screens may reflow to two columns. */
  isExpanded: boolean;
  /** Max width for a centered single content column on the roomy (regular) layout. */
  maxContentWidth: number;
}

/**
 * Reactive layout info for adaptive (iPad) screens. Uses `useWindowDimensions` so it re-renders on
 * Split View / Stage Manager resize. On iPhone this is always `compact`.
 */
export function useLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();
  const sizeClass = resolveSizeClass(width);
  return {
    width,
    height,
    sizeClass,
    isRegular: sizeClass === 'regular',
    isCompact: sizeClass === 'compact',
    isExpanded: resolveIsExpanded(width),
    maxContentWidth: layout.maxContentWidth,
  };
}
