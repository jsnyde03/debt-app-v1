import MeshGradientChart, { type MeshGradientChartProps } from './MeshGradientChart';

/**
 * Base (native) mesh-gradient canvas — Skia compiled in, render directly.
 * `MeshGradientCanvas.web.tsx` overrides this on web to lazy-load CanvasKit first.
 */
export function MeshGradientCanvas(props: MeshGradientChartProps) {
  return <MeshGradientChart {...props} />;
}
