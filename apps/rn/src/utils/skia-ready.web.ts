import { useEffect, useState } from 'react';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { canvasKitOpts } from './canvaskit';

/**
 * Has CanvasKit resolved? The web charts need this because their labels are NOT drawn by Skia.
 *
 * ⛔ A trajectory card mid-load renders its complete y-axis, every year tick, the `Now` marker, the gold
 * milestone pill and a legend confidently naming two lines — over an empty plot. The curve, the area, the
 * endpoint **and the chart's own gridlines** are all Skia-drawn and all absent together, while every label
 * around them is React Native and present. That does not read as *loading*; it reads as a chart that
 * FAILED, which is a worse thing for a money app to look like than a spinner.
 *
 * ⚠️ It reproduces in a race, not a state — the trajectory canvas carries an extra dynamic chunk on top of
 * the shared 8 MB wasm fetch, so it is the one that loses often enough to be photographed.
 *
 * The load is shared and idempotent: `WithSkiaWeb` awaits the same CanvasKit singleton, so asking here does
 * not fetch it twice — it subscribes to the fetch that is already happening.
 */
let resolved = false;
let loading: Promise<unknown> | null = null;

export function useSkiaReady(): boolean {
  const [ready, setReady] = useState(resolved);

  useEffect(() => {
    if (resolved) return;
    loading ??= LoadSkiaWeb(canvasKitOpts).then((value) => {
      resolved = true;
      return value;
    });
    let alive = true;
    void loading.then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return ready;
}
