import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';

export interface MeshGradientChartProps {
  width: number;
  height: number;
}

/**
 * VIS-6 — a soft "mesh" gradient built from overlapping blurred radial blobs (Skia), layered behind the
 * finale content to give the navy takeover depth. A faux-mesh on purpose: real SwiftUI `MeshGradient` is
 * iOS-18-only + a native surface, whereas these radial blobs render on EVERY iOS version AND on web
 * (CanvasKit) with no new native module and no version gate. Static (no animation) — a calm ambient wash,
 * not a beat. The base navy comes from the finale's own LinearGradient underneath.
 */
export default function MeshGradientChart({ width: W, height: H }: MeshGradientChartProps) {
  return (
    <Canvas style={{ width: W, height: H }}>
      {/* warm gold glow, top-right — echoes the debt-free gold */}
      <Circle cx={W * 0.84} cy={H * 0.12} r={W * 0.72}>
        <RadialGradient c={vec(W * 0.84, H * 0.12)} r={W * 0.72} colors={['rgba(247,207,95,0.34)', 'rgba(247,207,95,0)']} />
      </Circle>
      {/* cool blue glow, mid-left */}
      <Circle cx={W * 0.08} cy={H * 0.42} r={W * 0.68}>
        <RadialGradient c={vec(W * 0.08, H * 0.42)} r={W * 0.68} colors={['rgba(88,132,224,0.28)', 'rgba(88,132,224,0)']} />
      </Circle>
      {/* soft violet glow, bottom */}
      <Circle cx={W * 0.55} cy={H * 0.96} r={W * 0.82}>
        <RadialGradient c={vec(W * 0.55, H * 0.96)} r={W * 0.82} colors={['rgba(122,92,200,0.22)', 'rgba(122,92,200,0)']} />
      </Circle>
    </Canvas>
  );
}
