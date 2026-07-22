import { useEffect } from 'react';
import { Canvas, Group, Rect, RoundedRect, rect, rrect } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

export interface CushionBarChartProps {
  width: number;
  height: number;
  /** Share of the bar that is protected cushion (0–1). */
  cushionFrac: number;
  /** Share of the bar deployed to debt payoff (0–1). */
  payoffFrac: number;
  /** Position of the floor line (0–1) — the user's "alert line". */
  floorFrac: number;
  cushionColor: string;
  payoffColor: string;
  trackColor: string;
  lineColor: string;
  radius?: number;
}

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

/**
 * The Guardian's cushion bar — this paycheck's discretionary money split into [cushion held] +
 * [sent to payoff], with the user's floor drawn as a fixed line. Calm data-viz (no count-up/haptic):
 * one quiet left→right fill on mount shows the cushion rising to hold the line; the floor line stays
 * put (it's the target the fill grows toward). Reduce Motion snaps to full. Colors come from the
 * cushion system (slate/amber/red) so it reads as one language with the Progress bars.
 */
export default function CushionBarChart({
  width, height, cushionFrac, payoffFrac, floorFrac, cushionColor, payoffColor, trackColor, lineColor, radius,
}: CushionBarChartProps) {
  const r = radius ?? height / 2;
  const reduce = useReducedMotion();
  const grow = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    grow.value = reduce ? 1 : withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [reduce, grow, width, cushionFrac, payoffFrac]);

  // Reveal clip grows left→right; the track stays full underneath, so the segments "fill" the bar.
  const clip = useDerivedValue(() => rrect(rect(0, 0, grow.value * width, height), r, r));

  const cushionW = clamp01(cushionFrac) * width;
  const pFrac = clamp01(payoffFrac);
  const gap = pFrac > 0 && cushionW > 0 ? 2 : 0; // hairline divider only between two real segments
  const payoffW = Math.max(0, pFrac * width - gap);
  const lineX = Math.max(1, Math.min(width - 2, clamp01(floorFrac) * width));

  return (
    <Canvas style={{ width, height }}>
      <RoundedRect x={0} y={0} width={width} height={height} r={r} color={trackColor} />
      <Group clip={clip}>
        {cushionW > 0 ? <Rect x={0} y={0} width={cushionW} height={height} color={cushionColor} /> : null}
        {payoffW > 0 ? <Rect x={cushionW + gap} y={0} width={payoffW} height={height} color={payoffColor} /> : null}
      </Group>
      {/* The floor line — always visible (not clipped): the target the fill grows toward. */}
      <Rect x={lineX} y={0} width={2} height={height} color={lineColor} />
    </Canvas>
  );
}
