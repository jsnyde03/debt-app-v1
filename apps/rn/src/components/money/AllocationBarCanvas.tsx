import AllocationBarChart, { type AllocationBarChartProps } from './AllocationBarChart';

/**
 * Base (native) allocation-bar canvas — Skia compiled in, render directly.
 * `AllocationBarCanvas.web.tsx` overrides this on web to lazy-load CanvasKit first.
 */
export function AllocationBarCanvas(props: AllocationBarChartProps) {
  return <AllocationBarChart {...props} />;
}
