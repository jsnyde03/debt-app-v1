import JourneyRingChart, { type JourneyRingChartProps } from './JourneyRingChart';

/**
 * Base (native) journey-ring canvas — Skia compiled in, render directly.
 * `JourneyRingCanvas.web.tsx` overrides this on web to lazy-load CanvasKit first.
 */
export function JourneyRingCanvas(props: JourneyRingChartProps) {
  return <JourneyRingChart {...props} />;
}
