import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { canvasKitOpts } from '@/utils/canvaskit';

import type { MeshGradientChartProps } from './MeshGradientChart';

/** Web mesh-gradient canvas — lazy-loads CanvasKit (served from public/) on mount. Transparent fallback
 *  (the finale's LinearGradient base shows through until CanvasKit resolves — no skeleton for a bg). */
export function MeshGradientCanvas(props: MeshGradientChartProps) {
  return (
    <WithSkiaWeb
      getComponent={() => import('./MeshGradientChart')}
      opts={canvasKitOpts}
      componentProps={props}
      fallback={null}
    />
  );
}
