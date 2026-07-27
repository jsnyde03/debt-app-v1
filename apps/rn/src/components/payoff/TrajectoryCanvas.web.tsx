import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { ChartSkeleton } from '@/components/ui/ChartSkeleton';

import type { TrajectorySkiaChartProps } from './TrajectorySkiaChart';

/**
 * Web canvas — lazy-loads CanvasKit (8MB wasm, served from public/) only when this chart mounts, so
 * app boot is never blocked. `locateFile` points the loader at the locally-served wasm.
 */
export function TrajectoryCanvas(props: TrajectorySkiaChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./TrajectorySkiaChart')}
      opts={{ locateFile: (file: string) => `/${file}` }}
      componentProps={props}
      fallback={<ChartSkeleton shape="rect" width={props.width} height={props.height} />}
    />
  );
}
