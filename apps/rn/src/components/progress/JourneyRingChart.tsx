import { useEffect } from 'react';
import { BlurMask, Canvas, Circle, Group, Path, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { duration } from '@/theme/motion';

export type MilestoneState = 'passed' | 'next' | 'upcoming' | 'free';

export interface JourneyRingChartProps {
  size: number;
  stroke: number;
  pct: number; // 0–100
  milestones: { t: number; state: MilestoneState }[];
  palette: {
    track: string;
    from: string; // green (start of the sweep)
    to: string; // gold (approaching free)
    passed: string;
    next: string;
    dim: string;
    free: string;
  };
  /** 3.3.2.3 — a just-crossed milestone (25/50/75) whose node BREATHES (animated glow) until acknowledged. */
  pulseThreshold?: number;
}

/**
 * The journey ring — one Skia viz merging % paid + the milestones (DEBT_MOTION_SPEC). A full ring
 * starting at 12 o'clock, clockwise; the progress arc fills green→gold (a sweep gradient — you warm
 * toward freedom) with a GPU glow, sweeping 0→pct on mount. The 25/50/75/Free milestones are nodes
 * ON the arc — passed lit green, the next glowing gold, Free the gold finish at the top. No hooks/
 * context (lazy-loads cleanly under WithSkiaWeb). Reduce Motion snaps.
 */
export default function JourneyRingChart({ size, stroke, pct, milestones, palette, pulseThreshold }: JourneyRingChartProps) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const clamped = Math.min(100, Math.max(0, pct));

  const ring = Skia.Path.Make();
  ring.addArc({ x: cx - r, y: cy - r, width: 2 * r, height: 2 * r }, -90, 360);

  const reduce = useReducedMotion();
  const sweep = useSharedValue(reduce ? clamped / 100 : 0);
  useEffect(() => {
    sweep.value = reduce ? clamped / 100 : withTiming(clamped / 100, { duration: duration.chart, easing: Easing.out(Easing.cubic) }); // COH-6: token
  }, [clamped, reduce, sweep]);

  // 3.3.2.3 — a breathing pulse (0→1→0) for the just-crossed milestone node (static under Reduce Motion).
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value =
      pulseThreshold != null && !reduce
        ? withRepeat(withTiming(1, { duration: 950, easing: Easing.inOut(Easing.quad) }), -1, true)
        : 0;
  }, [pulseThreshold, reduce, pulse]);
  const pulseR = useDerivedValue(() => 9 + 7 * pulse.value);
  const pulseOpacity = useDerivedValue(() => 0.55 - 0.35 * pulse.value);

  const nodePos = (t: number) => {
    const f = t / 100;
    return { x: cx + r * Math.sin(2 * Math.PI * f), y: cy - r * Math.cos(2 * Math.PI * f) };
  };
  const colorFor = (s: MilestoneState) =>
    s === 'passed' ? palette.passed : s === 'next' ? palette.next : s === 'free' ? palette.free : palette.dim;

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* track */}
      <Path path={ring} style="stroke" strokeWidth={stroke} strokeCap="round" color={palette.track} />

      {/* progress arc — green→gold sweep, glow, trimmed 0→pct on mount */}
      <Path path={ring} style="stroke" strokeWidth={stroke} strokeCap="round" start={0} end={sweep}>
        <SweepGradient c={vec(cx, cy)} colors={[palette.from, palette.from, palette.to, palette.to]} />
        <BlurMask blur={4} style="solid" />
      </Path>

      {/* milestone nodes on the arc */}
      {milestones.map((m) => {
        const p = nodePos(m.t);
        const c = colorFor(m.state);
        const glow = m.state === 'next' || m.state === 'free';
        const pulsing = m.t === pulseThreshold;
        return (
          <Group key={m.t}>
            {pulsing ? (
              <Circle cx={p.x} cy={p.y} r={pulseR} color={palette.to} opacity={pulseOpacity}>
                <BlurMask blur={8} style="normal" />
              </Circle>
            ) : glow ? (
              <Circle cx={p.x} cy={p.y} r={9} color={c} opacity={0.4}>
                <BlurMask blur={7} style="normal" />
              </Circle>
            ) : null}
            <Circle cx={p.x} cy={p.y} r={m.state === 'free' ? 6 : 4.5} color={pulsing ? palette.to : c} />
          </Group>
        );
      })}
    </Canvas>
  );
}
