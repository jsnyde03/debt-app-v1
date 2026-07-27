import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { ChartSkeleton } from '@/components/ui/ChartSkeleton';

import type { AllocationBarChartProps } from './AllocationBarChart';

/** Web allocation-bar canvas — lazy-loads CanvasKit (served from public/) on mount. */
export function AllocationBarCanvas(props: AllocationBarChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./AllocationBarChart')}
      opts={{ locateFile: (file: string) => `/${file}` }}
      componentProps={props}
      fallback={<ChartSkeleton shape="rect" width={props.width} height={props.height} />}
    />
  );
}
