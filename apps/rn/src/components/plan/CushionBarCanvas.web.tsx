import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { ChartSkeleton } from '@/components/ui/ChartSkeleton';

import type { CushionBarChartProps } from './CushionBarChart';

/** Web cushion-bar canvas — lazy-loads CanvasKit (served from public/) on mount. */
export function CushionBarCanvas(props: CushionBarChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./CushionBarChart')}
      opts={{ locateFile: (file: string) => `/${file}` }}
      componentProps={props}
      fallback={<ChartSkeleton shape="rect" width={props.width} height={props.height} />}
    />
  );
}
