import { expect, test } from '@playwright/test';

/**
 * 3.5.7.4 — [D32]'s THREE PRIVACY CLAIMS, HELD BY A TEST.
 *
 * 🎯 The stance is *"a gate, not a promise"*: the embed is the one surface where "financial data never
 * leaves your device" is easiest to doubt, because it is a web page. Per [D31], a finding that becomes a
 * test is paid for once — this re-proves the claim on every push instead of at review time.
 *
 * ⚠️ RUNS AGAINST THE EMBED BUILD, NOT THE APP BUILD. `EXPO_PUBLIC_EMBED` is inlined by the bundler, so
 * the two are different artifacts; `playwright.embed.config.ts` builds this one with the flag set. A
 * spec in the main suite would have tested the build that does not ship publicly.
 */

/** Requests that are not network egress: the page's own origin, and in-document schemes. */
function isLocal(url: string, origin: string): boolean {
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) return true;
  try {
    return new URL(url).origin === origin;
  } catch {
    return true; // unparseable is not a host we reached
  }
}

test.describe('the embed is private by construction', () => {
  test('makes NO request beyond its own static assets', async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const foreign: string[] = [];

    // ⛔ `request`, not `response`. A blocked or failed request never produces a response, and a request
    // that LEAVES is the thing the claim is about — whether anyone answered is not the user's concern.
    page.on('request', (r) => {
      if (!isLocal(r.url(), origin)) foreign.push(`${r.method()} ${r.url()}`);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Exercise it rather than only booting it: a page that egresses on interaction would pass a
    // load-only check. CanvasKit in particular loads lazily, on a chart's first mount.
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1500);

    expect(foreign, `the embed reached ${foreign.length} foreign host(s)`).toEqual([]);
  });

  test('writes NO persistent storage — sessionStorage only', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Give the store's debounced autosave (500 ms, `persistence.ts:14`) room to actually fire, or this
    // asserts nothing: an empty localStorage before the first write is not evidence of anything.
    await page.waitForTimeout(2000);

    const storage = await page.evaluate(async () => {
      const dbs =
        typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function'
          ? await indexedDB.databases()
          : [];
      return {
        localKeys: Object.keys(localStorage),
        sessionKeys: Object.keys(sessionStorage),
        idb: dbs.map((d) => d.name ?? '(unnamed)'),
      };
    });

    expect(storage.localKeys, 'the embed wrote persistent localStorage').toEqual([]);
    expect(storage.idb, 'the embed opened an IndexedDB database').toEqual([]);

    // ⭐ THE POSITIVE HALF, and it is what stops the two assertions above passing vacuously. A build that
    // simply never persisted anything — a broken store, a crashed boot — would satisfy "no localStorage"
    // perfectly. Requiring the state to be in `sessionStorage` proves the app IS running and storing,
    // and that 3.5.7.3's flag routed it to the ephemeral store rather than switching persistence off.
    expect(
      storage.sessionKeys.length,
      'nothing was stored at all — the flag may be routing to a no-op rather than sessionStorage',
    ).toBeGreaterThan(0);
  });

  test('carries no analytics or crash-reporter transport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // ⚠️ 3.5.7.2's before-scan established there is nothing to omit: the funnel has no sink and no vendor
    // SDK, Sentry's `.web.ts` keeps the SDK out of the web bundle, and RevenueCat is stubbed. This holds
    // that TRUE rather than re-asserting it — the claim is cheap to keep and expensive to notice losing.
    const globals = await page.evaluate(() => ({
      sentry: typeof (window as Record<string, unknown>).Sentry !== 'undefined',
      ga: typeof (window as Record<string, unknown>).ga !== 'undefined',
      gtag: typeof (window as Record<string, unknown>).gtag !== 'undefined',
      dataLayer: Array.isArray((window as Record<string, unknown>).dataLayer),
    }));

    expect(globals, 'an analytics or crash-reporter global reached the embed bundle').toEqual({
      sentry: false,
      ga: false,
      gtag: false,
      dataLayer: false,
    });
  });
});
