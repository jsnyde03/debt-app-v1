import { View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import type { CushionBarChartProps } from './CushionBarChart';

/** Web cushion-bar canvas — lazy-loads CanvasKit (served from public/) on mount. */
export function CushionBarCanvas(props: CushionBarChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./CushionBarChart')}
      opts={{ locateFile: (file: string) => `/${file}` }}
      componentProps={props}
      fallback={<View style={{ width: props.width, height: props.height }} />}
    />
  );
}
