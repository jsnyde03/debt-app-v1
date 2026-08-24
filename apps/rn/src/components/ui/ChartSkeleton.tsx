import { View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';

/**
 * Faint placeholder shown while a Skia canvas's CanvasKit bundle loads on **web** (the `.web` canvases'
 * `fallback`), so a chart card never flashes empty. Native compiles Skia in, so this path isn't hit there.
 * A ghosted ring or a few gridlines — evokes the chart's shape at rest, in the subtlest border tint.
 */

/**
 * ⛔ **THE TESTID IS AN INSTRUMENT CONTRACT, AND IT EXISTS BECAUSE THIS COMPONENT IS INVISIBLE TO A
 * SCREENSHOT.** P6.8.9.7.5, 2026-08-24.
 *
 * Under worker contention the shot matrix photographed THIS — four faint hairlines — while every RN
 * overlay above it (axis labels, waypoint bead, end pill) had already rendered at its geometrically
 * correct position, because `useSkiaReady` opens on the CanvasKit promise while `WithSkiaWeb` awaits a
 * SECOND chunk. The result reads as a finished chart that happens to have no curve. **10 of 10 frames of
 * two different portfolios came back like that when four browsers competed on a 4-core box**, and it is
 * not distinguishable by eye from a real rendering defect — a whole audit's chart findings may have been
 * read off it.
 *
 * ⚡ The matrix used to wait `1_800` ms and hope. This is the signal that number was guessing at: a chart
 * still loading SAYS SO, and the instrument waits for the saying rather than for the clock. Making the app
 * state its own readiness is cheaper than the debugging the guess costs — measured three times in this repo
 * now (3.5.8's fourteen CI cycles, 3.5.5.5's coach mark, and this).
 *
 * ⚠️ **Do not remove or rename without changing `p6.8-matrix.shot.ts`.** Losing it does not fail a build;
 * it silently returns the matrix to timing-dependent frames, which is the one failure mode that produces
 * confident, wrong evidence.
 */
export const CHART_SKELETON_TESTID = 'chart-skeleton';

export function ChartSkeleton(
  props: { shape: 'ring'; size: number; stroke?: number } | { shape: 'rect'; width: number; height: number },
) {
  const c = useAppColors();
  const tint = c.border.subtle;

  if (props.shape === 'ring') {
    const s = props.size;
    return (
      <View
        testID={CHART_SKELETON_TESTID}
        style={{ width: s, height: s, borderRadius: s / 2, borderWidth: props.stroke ?? 12, borderColor: tint }}
      />
    );
  }

  const { width, height } = props;
  return (
    <View testID={CHART_SKELETON_TESTID} style={{ width, height, justifyContent: 'space-between', paddingVertical: height * 0.12 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ height: 1, backgroundColor: tint }} />
      ))}
    </View>
  );
}
