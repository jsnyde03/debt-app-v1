import { View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import type { TrajectorySkiaChartProps } from './TrajectorySkiaChart';

/**
 * Web canvas — lazy-loads CanvasKit (8MB wasm, served from public/) only when this chart mounts, so
 * app boot is never blocked. `locateFile` points the loader at the locally-served wasm.
 */
export function TrajectoryCanvas(props: TrajectorySkiaChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./TrajectorySkiaChart')}
      opts={{ locateFile: (file: string) => `/${file}` }}
      componentProps={props}
      fallback={<View style={{ width: props.width, height: props.height }} />}
    />
  );
}
