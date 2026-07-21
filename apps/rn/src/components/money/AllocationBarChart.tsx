import { useEffect } from 'react';
import { Canvas, Group, Rect, RoundedRect, rect, rrect } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

export interface AllocationSegment {
  fraction: number; // share of the whole (0–1)
  opacity: number; // tonal step of the single accent hue (largest = most opaque)
}
export interface AllocationBarChartProps {
  width: number;
  height: number;
  segments: AllocationSegment[]; // sorted largest → smallest
  color: string; // the one accent hue (tone comes from opacity)
  trackColor: string;
  gap?: number;
  radius?: number;
}

/**
 * The Money "where it goes" allocation bar — a single rounded bar segmented by category share of the
 * per-paycheck set-aside. Deliberately calm data-viz, NOT a beat: one accent hue stepped by opacity
 * (no rainbow), a quiet left→right draw-on on mount, and no count-up/haptic (those stay on
 * Today/Progress). Reduce Motion snaps to full. No hooks/context beyond reanimated (lazy-loads clean
 * under WithSkiaWeb).
 */
export default function AllocationBarChart({ width, height, segments, color, trackColor, gap = 2, radius }: AllocationBarChartProps) {
  const r = radius ?? height / 2;
  const reduce = useReducedMotion();
  const grow = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    grow.value = reduce ? 1 : withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [reduce, grow, width]);

  // Reveal clip grows left→right; the track stays full underneath, so segments "fill" the bar.
  const clip = useDerivedValue(() => rrect(rect(0, 0, grow.value * width, height), r, r));

  let x = 0;
  const rects = segments.map((s, i) => {
    const full = s.fraction * width;
    const w = Math.max(0, full - (i < segments.length - 1 ? gap : 0)); // gap → track shows as a hairline divider
    const seg = { x, w, opacity: s.opacity };
    x += full;
    return seg;
  });

  return (
    <Canvas style={{ width, height }}>
      <RoundedRect x={0} y={0} width={width} height={height} r={r} color={trackColor} />
      <Group clip={clip}>
        {rects.map((s, i) => (
          <Rect key={i} x={s.x} y={0} width={s.w} height={height} color={color} opacity={s.opacity} />
        ))}
      </Group>
    </Canvas>
  );
}
