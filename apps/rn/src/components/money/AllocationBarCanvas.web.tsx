import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { canvasKitOpts } from '@/utils/canvaskit';

import type { AllocationBarChartProps } from './AllocationBarChart';

/** Web allocation-bar canvas — lazy-loads CanvasKit (served from public/) on mount. Where the wasm lives
 *  is `canvasKitOpts`'s job, not this file's — see 3.5.7.8. */
export function AllocationBarCanvas(props: AllocationBarChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./AllocationBarChart')}
      opts={canvasKitOpts}
      componentProps={props}
      fallback={<ChartSkeleton shape="rect" width={props.width} height={props.height} />}
    />
  );
}
