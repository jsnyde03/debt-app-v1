import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { canvasKitOpts } from '@/utils/canvaskit';

import type { CashRunwaySkiaChartProps } from './CashRunwaySkiaChart';

/**
 * Web canvas — lazy-loads CanvasKit (wasm, served from public/) only when this chart mounts, so app boot
 * is never blocked ([[skia web canvaskit setup]]). ⚠️ Where the wasm lives is `canvasKitOpts`'s job — see
 * 3.5.7.8, where the marketing embed's base path would have broken three hand-maintained copies.
 */
export function CashRunwayCanvas(props: CashRunwaySkiaChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./CashRunwaySkiaChart')}
      opts={canvasKitOpts}
      componentProps={props}
      fallback={<ChartSkeleton shape="rect" width={props.width} height={props.height} />}
    />
  );
}
