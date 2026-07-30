import { useEffect, useMemo } from 'react';
import { BlurMask, Canvas, Circle, DashPathEffect, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { Easing, interpolate, useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Pure Skia plot for the payoff trajectory — no app hooks/context (so it lazy-loads cleanly under
 * `WithSkiaWeb` on web). Geometry + colors are computed by the wrapper and passed as primitives.
 * Owns its own draw-on: the line trims 0→1, the area fades in behind it, the gold "debt-free" bead
 * blooms as the line lands. Reduce Motion snaps straight to the finished state.
 */
export interface TrajectorySkiaChartProps {
  width: number;
  height: number;
  activePath: string;
  areaPath: string;
  ghostPath: string;
  /** VIS-5 — the cone of outcomes: a faint fill between the typical + lean curves, with a dashed lean edge. */
  bandPath?: string;
  leanPath?: string;
  leanEndpoint?: { x: number; y: number } | null;
  /** Optional What-If overlay — the payoff curve WITH the simulated extra (dashed, drawn instantly). */
  simulatedPath?: string;
  simulatedEndpoint?: { x: number; y: number } | null;
  endpoint: { x: number; y: number } | null;
  start: { x: number; y: number } | null;
  /** Faint horizontal balance gridlines (y-positions) spanning [plotLeft, plotRight]. */
  gridLines?: number[];
  plotLeft?: number;
  plotRight?: number;
  axisColor?: string;
  palette: {
    lineFrom: string;
    lineMid: string;
    lineTo: string;
    areaTop: string;
    areaBottom: string;
    ghost: string;
    glow: string;
    core: string;
    startDot: string;
    /** The What-If overlay color (green) — distinct from the plan's gold debt-free finish. */
    simulated: string;
    /** VIS-5 cone: faint fill (band) + dashed edge (lean). */
    band?: string;
    lean?: string;
  };
}

export default function TrajectorySkiaChart({
  width,
  height,
  activePath,
  areaPath,
  ghostPath,
  bandPath,
  leanPath,
  leanEndpoint,
  simulatedPath,
  simulatedEndpoint,
  endpoint,
  start,
  gridLines,
  plotLeft = 0,
  plotRight = width,
  axisColor,
  palette,
}: TrajectorySkiaChartProps) {
  // Parse the SVG path strings into Skia paths only when a string actually changes — otherwise every
  // parent re-render (e.g. a What-If keystroke redrawing the simulated curve) needlessly re-parsed all four.
  const line = useMemo(() => Skia.Path.MakeFromSVGString(activePath), [activePath]);
  const area = useMemo(() => Skia.Path.MakeFromSVGString(areaPath), [areaPath]);
  const ghost = useMemo(() => (ghostPath ? Skia.Path.MakeFromSVGString(ghostPath) : null), [ghostPath]);
  const simulated = useMemo(() => (simulatedPath ? Skia.Path.MakeFromSVGString(simulatedPath) : null), [simulatedPath]);
  const bandArea = useMemo(() => (bandPath ? Skia.Path.MakeFromSVGString(bandPath) : null), [bandPath]);
  const leanLine = useMemo(() => (leanPath ? Skia.Path.MakeFromSVGString(leanPath) : null), [leanPath]);

  const reduce = useReducedMotion();
  const progress = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    progress.value = reduce ? 1 : withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) });
  }, [reduce, progress]);

  const areaOpacity = useDerivedValue(() => interpolate(progress.value, [0, 0.7], [0, 1], 'clamp'));
  const beadCore = useDerivedValue(() => interpolate(progress.value, [0.9, 1], [0, 1], 'clamp'));
  const beadGlow = useDerivedValue(() => 0.55 * interpolate(progress.value, [0.9, 1], [0, 1], 'clamp'));

  return (
    <Canvas style={{ width, height }}>
      {/* balance gridlines — faint, behind everything (the Y-scale) */}
      {gridLines && axisColor
        ? gridLines.map((y, i) => (
            <Line key={i} p1={vec(plotLeft, y)} p2={vec(plotRight, y)} color={axisColor} strokeWidth={1} />
          ))
        : null}

      {/* area body — luminous wash fading to transparent (contrasts the card) */}
      {area ? (
        <Path path={area} style="fill" opacity={areaOpacity}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[palette.areaTop, palette.areaBottom]} />
        </Path>
      ) : null}

      {/* VIS-5 cone — the range of outcomes: a faint plan-tinted fill between the typical + lean curves,
          behind the lines; the lean (safe-floor) edge as a dashed stroke. Variable income only. */}
      {bandArea && palette.band ? <Path path={bandArea} style="fill" color={palette.band} opacity={areaOpacity} /> : null}
      {leanLine && palette.lean ? (
        <Path path={leanLine} style="stroke" strokeWidth={1.5} strokeCap="round" color={palette.lean} opacity={0.7}>
          <DashPathEffect intervals={[6, 5]} />
        </Path>
      ) : null}
      {leanEndpoint && palette.lean ? <Circle cx={leanEndpoint.x} cy={leanEndpoint.y} r={4} color={palette.lean} /> : null}

      {/* the other strategy — faint ghost, no glow */}
      {ghost ? <Path path={ghost} style="stroke" strokeWidth={1.5} strokeCap="round" color={palette.ghost} opacity={0.3} /> : null}

      {/* active line — blue accent, blooming to gold near freedom; trims 0→1 on draw-on. Two layers so
          the primary stroke stays CRISP: a wide blurred underglow behind (the luminosity), a sharp
          un-blurred stroke on top (the line itself — previously a `BlurMask style="solid"` on the sole
          stroke softened its edges). */}
      {line ? (
        <>
          <Path path={line} style="stroke" strokeWidth={7} strokeCap="round" strokeJoin="round" start={0} end={progress} opacity={0.3}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, 0)}
              colors={[palette.lineFrom, palette.lineMid, palette.lineTo]}
              positions={[0, 0.65, 1]}
            />
            <BlurMask blur={6} style="normal" />
          </Path>
          <Path path={line} style="stroke" strokeWidth={3.5} strokeCap="round" strokeJoin="round" start={0} end={progress}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, 0)}
              colors={[palette.lineFrom, palette.lineMid, palette.lineTo]}
              positions={[0, 0.65, 1]}
            />
          </Path>
        </>
      ) : null}

      {/* What-If overlay — the "with extra" curve: dashed gold, drawn instantly (no trim) so it
          updates live as the user types, landing left of the active endpoint = the visible shift. */}
      {simulated ? (
        <Path path={simulated} style="stroke" strokeWidth={2.5} strokeCap="round" strokeJoin="round" color={palette.simulated}>
          <DashPathEffect intervals={[7, 5]} />
        </Path>
      ) : null}
      {simulatedEndpoint ? (
        <Circle cx={simulatedEndpoint.x} cy={simulatedEndpoint.y} r={4.5} color={palette.simulated} />
      ) : null}

      {/* "Now" anchor */}
      {start ? <Circle cx={start.x} cy={start.y} r={3.5} color={palette.startDot} /> : null}

      {/* debt-free finish — gold glow bead, blooms as the line lands */}
      {endpoint ? (
        <>
          <Circle cx={endpoint.x} cy={endpoint.y} r={9} color={palette.glow} opacity={beadGlow}>
            <BlurMask blur={8} style="normal" />
          </Circle>
          <Circle cx={endpoint.x} cy={endpoint.y} r={5} color={palette.core} opacity={beadCore} />
        </>
      ) : null}
    </Canvas>
  );
}
