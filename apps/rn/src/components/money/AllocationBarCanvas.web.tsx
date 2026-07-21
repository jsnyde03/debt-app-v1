import { View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import type { AllocationBarChartProps } from './AllocationBarChart';

/** Web allocation-bar canvas — lazy-loads CanvasKit (served from public/) on mount. */
export function AllocationBarCanvas(props: AllocationBarChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./AllocationBarChart')}
      opts={{ locateFile: (file: string) => `/${file}` }}
      componentProps={props}
      fallback={<View style={{ width: props.width, height: props.height }} />}
    />
  );
}
