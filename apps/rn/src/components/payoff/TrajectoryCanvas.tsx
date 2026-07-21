import TrajectorySkiaChart, { type TrajectorySkiaChartProps } from './TrajectorySkiaChart';

/**
 * Base (native) canvas — Skia is compiled in, so render directly (no CanvasKit/wasm step).
 * `TrajectoryCanvas.web.tsx` overrides this on web to lazy-load CanvasKit first.
 */
export function TrajectoryCanvas(props: TrajectorySkiaChartProps) {
  return <TrajectorySkiaChart {...props} />;
}
