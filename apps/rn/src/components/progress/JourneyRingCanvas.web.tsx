import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { canvasKitOpts } from '@/utils/canvaskit';

import type { JourneyRingChartProps } from './JourneyRingChart';

/** Web journey-ring canvas — lazy-loads CanvasKit (served from public/) on mount. */
export function JourneyRingCanvas(props: JourneyRingChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./JourneyRingChart')}
      opts={canvasKitOpts}
      componentProps={props}
      fallback={<ChartSkeleton shape="ring" size={props.size} stroke={props.stroke} />}
    />
  );
}
