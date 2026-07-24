import CashRunwaySkiaChart, { type CashRunwaySkiaChartProps } from './CashRunwaySkiaChart';

/** Native canvas — Skia is linked in the binary, so render the chart directly. */
export function CashRunwayCanvas(props: CashRunwaySkiaChartProps) {
  return <CashRunwaySkiaChart {...props} />;
}
