import { useEffect } from 'react';
import { BlurMask, Canvas, Circle, Group, Path, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import { Easing, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

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
}

/**
 * The journey ring — one Skia viz merging % paid + the milestones (DEBT_MOTION_SPEC). A full ring
 * starting at 12 o'clock, clockwise; the progress arc fills green→gold (a sweep gradient — you warm
 * toward freedom) with a GPU glow, sweeping 0→pct on mount. The 25/50/75/Free milestones are nodes
 * ON the arc — passed lit green, the next glowing gold, Free the gold finish at the top. No hooks/
 * context (lazy-loads cleanly under WithSkiaWeb). Reduce Motion snaps.
 */
export default function JourneyRingChart({ size, stroke, pct, milestones, palette }: JourneyRingChartProps) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const clamped = Math.min(100, Math.max(0, pct));

  const ring = Skia.Path.Make();
  ring.addArc({ x: cx - r, y: cy - r, width: 2 * r, height: 2 * r }, -90, 360);

  const reduce = useReducedMotion();
  const sweep = useSharedValue(reduce ? clamped / 100 : 0);
  useEffect(() => {
    sweep.value = reduce ? clamped / 100 : withTiming(clamped / 100, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [clamped, reduce, sweep]);

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
        return (
          <Group key={m.t}>
            {glow ? (
              <Circle cx={p.x} cy={p.y} r={9} color={c} opacity={0.4}>
                <BlurMask blur={7} style="normal" />
              </Circle>
            ) : null}
            <Circle cx={p.x} cy={p.y} r={m.state === 'free' ? 6 : 4.5} color={c} />
          </Group>
        );
      })}
    </Canvas>
  );
}
