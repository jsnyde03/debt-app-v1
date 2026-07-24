import { useEffect } from 'react';
import { BlurMask, Canvas, Circle, DashPathEffect, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Pure Skia plot for the Cash Runway (2.4.9.6R) — no app hooks/context so it lazy-loads under
 * `WithSkiaWeb`. The premium view free structurally can't show: the UN-CLAMPED projected cushion across
 * the next paychecks, the user's floor line, and the moments it dips BELOW that line (crunches) — which
 * the free clamped-at-$0 bars erase. Geometry + colors are computed by the wrapper; drawn primitives only.
 */
export interface CashRunwaySkiaChartProps {
  width: number;
  height: number;
  /** The runway line (SVG path through each cycle's carriedBalance). */
  runwayPath: string;
  /** The area under the runway, closed to the floor line. */
  areaPath: string;
  /** Y of the user's cushion floor line (drawn dashed across the plot). */
  floorY: number;
  plotLeft: number;
  plotRight: number;
  /** Every cycle's plotted point; `crunch` marks a below-floor dip. */
  points: { x: number; y: number; crunch: boolean }[];
  /** The tapped cycle's point — drawn as a ring. */
  selected?: { x: number; y: number } | null;
  palette: {
    lineFrom: string;
    lineTo: string;
    areaTop: string;
    areaBottom: string;
    floor: string;
    crunch: string;
    dot: string;
    ring: string;
    ringCore: string;
  };
}

export default function CashRunwaySkiaChart({
  width,
  height,
  runwayPath,
  areaPath,
  floorY,
  plotLeft,
  plotRight,
  points,
  selected,
  palette,
}: CashRunwaySkiaChartProps) {
  const line = Skia.Path.MakeFromSVGString(runwayPath);
  const area = Skia.Path.MakeFromSVGString(areaPath);

  const reduce = useReducedMotion();
  const progress = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    progress.value = reduce ? 1 : withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [reduce, progress]);
  const areaOpacity = useDerivedValue(() => Math.min(1, progress.value / 0.7));

  return (
    <Canvas style={{ width, height }}>
      {/* area wash under the runway — fades in behind the line */}
      {area ? (
        <Path path={area} style="fill" opacity={areaOpacity}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[palette.areaTop, palette.areaBottom]} />
        </Path>
      ) : null}

      {/* the floor line — the user's cushion line, dashed so it reads as a reference, not data */}
      <Line p1={vec(plotLeft, floorY)} p2={vec(plotRight, floorY)} color={palette.floor} strokeWidth={1.5}>
        <DashPathEffect intervals={[5, 4]} />
      </Line>

      {/* the runway — accent gradient, GPU glow, trims 0→1 on draw-on */}
      {line ? (
        <Path path={line} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" start={0} end={progress}>
          <LinearGradient start={vec(0, 0)} end={vec(width, 0)} colors={[palette.lineFrom, palette.lineTo]} />
          <BlurMask blur={2.5} style="solid" />
        </Path>
      ) : null}

      {/* per-cycle dots — a crunch dip gets the warning color + a larger mark (never color alone: the
          wrapper labels it too) */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={p.crunch ? 5 : 3} color={p.crunch ? palette.crunch : palette.dot} />
      ))}

      {/* the tapped cycle — a ring so the selection is unmistakable */}
      {selected ? (
        <>
          <Circle cx={selected.x} cy={selected.y} r={8} color={palette.ring} style="stroke" strokeWidth={2.5} />
          <Circle cx={selected.x} cy={selected.y} r={3} color={palette.ringCore} />
        </>
      ) : null}
    </Canvas>
  );
}
