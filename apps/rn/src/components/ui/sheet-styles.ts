import { StyleSheet } from 'react-native';

import { layout, spacing } from '@/theme/spacing';

/**
 * 3.4.5 — the shared shell styles for premium bottom sheets (FormSheet + the display/capture sheets via
 * AnimatedSheet), so the frosted panel, grabber, dark luminous edge, and header read identically
 * everywhere. Colors are applied inline by the caller (theme-aware); this holds only the geometry.
 */
export const sheetStyles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' }, // dim + blur come from the animated <SheetScrim />
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: layout.cardRadiusLarge,
    borderTopRightRadius: layout.cardRadiusLarge,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  // Dark parity: a near-black backdrop can't separate a navy sheet by shadow, so it lifts by a luminous
  // top edge (the Elevation-language move, matching the hero panel).
  sheetDarkEdge: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  grabZone: { paddingTop: spacing.sm, gap: spacing.sm },
  grabber: { width: 36, height: 5, borderRadius: 3, opacity: 0.4, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
