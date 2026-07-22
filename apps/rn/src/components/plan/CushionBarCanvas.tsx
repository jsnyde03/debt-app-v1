import CushionBarChart, { type CushionBarChartProps } from './CushionBarChart';

/**
 * Base (native) cushion-bar canvas — Skia is compiled in, so render directly.
 * `CushionBarCanvas.web.tsx` overrides this on web to lazy-load CanvasKit first.
 */
export function CushionBarCanvas(props: CushionBarChartProps) {
  return <CushionBarChart {...props} />;
}
