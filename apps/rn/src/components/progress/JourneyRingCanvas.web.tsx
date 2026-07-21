import { View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import type { JourneyRingChartProps } from './JourneyRingChart';

/** Web journey-ring canvas — lazy-loads CanvasKit (served from public/) on mount. */
export function JourneyRingCanvas(props: JourneyRingChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./JourneyRingChart')}
      opts={{ locateFile: (file: string) => `/${file}` }}
      componentProps={props}
      fallback={<View style={{ width: props.size, height: props.size }} />}
    />
  );
}
