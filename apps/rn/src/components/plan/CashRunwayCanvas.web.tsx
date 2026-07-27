import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { ChartSkeleton } from '@/components/ui/ChartSkeleton';

import type { CashRunwaySkiaChartProps } from './CashRunwaySkiaChart';

/**
 * Web canvas — lazy-loads CanvasKit (wasm, served from public/) only when this chart mounts, so app boot
 * is never blocked. `locateFile` points the loader at the locally-served wasm ([[skia web canvaskit setup]]).
 */
export function CashRunwayCanvas(props: CashRunwaySkiaChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./CashRunwaySkiaChart')}
      opts={{ locateFile: (file: string) => `/${file}` }}
      componentProps={props}
      fallback={<ChartSkeleton shape="rect" width={props.width} height={props.height} />}
    />
  );
}
