import { useEffect, useState } from 'react';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

import { canvasKitOpts } from './canvaskit';
import { reportError } from './reportError';

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

/**
 * ⛔ **[V4-8 · P6.8.9.7.5] THE WASM WAS ONLY HALF THE WAIT, AND THE DOCSTRING ABOVE ALREADY SAID SO.**
 *
 * It names the cause — *"the trajectory canvas carries an extra dynamic chunk on top of the shared 8 MB
 * wasm fetch"* — and then gated on the wasm alone. `WithSkiaWeb` awaits `LoadSkiaWeb` **and then**
 * `getComponent()`, its own separate chunk, plus a Suspense re-render and a first paint. **The labels could
 * therefore only ever win**, which is the exact race this hook exists to prevent.
 *
 * Measured at P6.8.9.7.8 from pixel geometry: the "blank chart" frames were `ChartSkeleton` (hairlines
 * spanning the full canvas box, x=41→360) under a complete set of correctly-positioned RN overlays, while a
 * real render puts its gridlines at x=79→346. Under four-way worker contention, **10 of 10 frames** of two
 * different portfolios came back that way.
 *
 * ⚠️ `chunk` is passed by the CALLER because each canvas has a different one, and a hook that awaited every
 * chart's chunk would make the cheapest card wait for the most expensive. Passing the SAME specifier the
 * canvas passes to `getComponent` is what makes this free: a repeated dynamic `import()` of one specifier
 * returns the module registry's existing promise rather than fetching again.
 */
export function useSkiaReady(chunk?: () => Promise<unknown>): boolean {
  const [ready, setReady] = useState(resolved && !chunk);

  useEffect(() => {
    let alive = true;
    loading ??= LoadSkiaWeb(canvasKitOpts).then((value) => {
      resolved = true;
      return value;
    });
    /**
     * ⛔ **A REJECTION USED TO HANG THE GATE FOREVER**, leaving the card permanently in its skeleton with
     * no label, no curve and nothing said — flagged by the verification pass as V4-8's other half. The gate
     * stays CLOSED on failure, deliberately: opening it would restore the original defect (a confident axis
     * over an empty plot), and a skeleton is the honest picture of "this did not load".
     *
     * ⛔ **ON WEB THE FAILURE IS SWALLOWED, NOT REPORTED.** [P6.8.9.7.10 · D-1] `reportError`'s default
     * sink is a **dev-only** `console.warn` (`reportError.ts:16-19`), and web never registers a real one —
     * `sentry.web.ts:7-9` is a no-op whose own docstring says it *"keeps the default `reportError` console
     * sink"*. This file only ever runs on web. So with `__DEV__` false, **nothing happens.**
     *
     * ⚠️ **The `catch` does not change the gate, and saying it did would be a second false claim.** On a
     * rejection `setReady(true)` is skipped either way, and `loading ??=` caches the rejected promise for
     * every later mount — so the card stays in its skeleton with or without it. What the `catch` buys is
     * the absence of an unhandled rejection in the console, and what is missing is the telemetry, exactly
     * where it would matter most: `canvaskit.ts:15-20` documents a real wasm 404 on the marketing embed,
     * which is this rejection.
     * ⛔ Deliberately not fixed by wiring a web reporter: Sentry is kept out of the web bundle on purpose,
     * so that is a scope decision rather than a defect. Filed as an observability gap.
     */
    /**
     * ⛔ **SEQUENTIAL, NOT `Promise.all` — and the first cut got this wrong and cost eleven tests.**
     *
     * `WithSkiaWeb` awaits `LoadSkiaWeb` and **then** calls `getComponent()`. That ordering is the
     * library's contract, not an accident: the chart module imports `@shopify/react-native-skia`, whose
     * module body expects CanvasKit to exist. Racing the two with `Promise.all` starts the component import
     * before the wasm has landed — the import rejects, the `catch` below swallows it, and **the gate never
     * opens**, so every label on the card disappears. Six chart specs and both `strategy-compare` clicks
     * went red together, which is what a permanently-closed gate looks like from the outside.
     *
     * ⚡ The fix for V4-8 was to await MORE, and awaiting more in the wrong order is its own defect.
     */
    void loading
      .then(() => chunk?.())
      .then(() => {
        if (alive) setReady(true);
      })
      .catch((error: unknown) => {
        reportError(error, { seam: 'skia', op: 'load' });
      });
    return () => {
      alive = false;
    };
  }, [chunk]);

  return ready;
}
