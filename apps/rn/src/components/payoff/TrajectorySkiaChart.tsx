import { useEffect } from 'react';
import { BlurMask, Canvas, Circle, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
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
  endpoint: { x: number; y: number } | null;
  start: { x: number; y: number } | null;
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
  };
}

export default function TrajectorySkiaChart({
  width,
  height,
  activePath,
  areaPath,
  ghostPath,
  endpoint,
  start,
  palette,
}: TrajectorySkiaChartProps) {
  const line = Skia.Path.MakeFromSVGString(activePath);
  const area = Skia.Path.MakeFromSVGString(areaPath);
  const ghost = ghostPath ? Skia.Path.MakeFromSVGString(ghostPath) : null;

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
      {/* area body — luminous wash fading to transparent (contrasts the card) */}
      {area ? (
        <Path path={area} style="fill" opacity={areaOpacity}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[palette.areaTop, palette.areaBottom]} />
        </Path>
      ) : null}

      {/* the other strategy — faint ghost, no glow */}
      {ghost ? <Path path={ghost} style="stroke" strokeWidth={1.5} strokeCap="round" color={palette.ghost} opacity={0.3} /> : null}

      {/* active line — blue accent, blooming to gold near freedom; GPU glow; trims 0→1 on draw-on */}
      {line ? (
        <Path path={line} style="stroke" strokeWidth={3.5} strokeCap="round" strokeJoin="round" start={0} end={progress}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, 0)}
            colors={[palette.lineFrom, palette.lineMid, palette.lineTo]}
            positions={[0, 0.65, 1]}
          />
          <BlurMask blur={3} style="solid" />
        </Path>
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
