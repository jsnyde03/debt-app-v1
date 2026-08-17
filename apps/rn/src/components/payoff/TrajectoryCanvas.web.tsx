import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { canvasKitOpts } from '@/utils/canvaskit';

import type { TrajectorySkiaChartProps } from './TrajectorySkiaChart';

/**
 * Web canvas — lazy-loads CanvasKit (8MB wasm, served from public/) only when this chart mounts, so
 * app boot is never blocked. ⚠️ Where the wasm lives is owned by `canvasKitOpts`, not by this file — it
 * was three identical copies until 3.5.7.8, and the marketing embed's base path is what would have made
 * them diverge.
 */
export function TrajectoryCanvas(props: TrajectorySkiaChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./TrajectorySkiaChart')}
      opts={canvasKitOpts}
      componentProps={props}
      fallback={<ChartSkeleton shape="rect" width={props.width} height={props.height} />}
    />
  );
}
