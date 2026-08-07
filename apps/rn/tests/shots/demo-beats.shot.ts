import path from 'path';

import { test } from '@playwright/test';

import { scenario, seedStore } from '../e2e/helpers/seed';

/**
 * Anchored on THIS file, not on the cwd. A relative `capture-ref/…` resolves against wherever the runner
 * was invoked from — so `npm run shots:demo` at the repo root wrote the set to the repo root, outside the
 * `apps/rn/.gitignore` that was meant to cover it. The output location of an evidence tool should not
 * depend on which directory you happened to be standing in.
 */
const OUT = path.resolve(__dirname, '../../capture-ref');

/**
 * 3.5.8.7 — the WEB reference set for the App-Preview capture.
 *
 * Not a test and deliberately not in `tests/e2e`: it asserts nothing, it produces evidence, and adding
 * ~50s of screenshotting to the release gate would be paying for it on every run. `npm run shots:demo`.
 *
 * **Why a reference set exists at all.** The plan names an honest risk it cannot resolve by reasoning:
 * the simulator may not render Skia, `expo-blur` UIKit material or the finale mesh-gradient faithfully.
 * "Faithfully" is a comparison, and until now there was nothing to compare against — the 3.5.4.11 beats
 * were shot ad-hoc and not kept. This shoots the same five beats, at the same phone size, in the same
 * capture mode, with filenames that MIRROR the CI artifact's, so the native capture and the web render
 * can be put side by side without anyone re-deriving which frame is which.
 *
 * It also isolates 3.5.8.4b. The unpainted-canvas defect was seen on web and the native Skia path painted
 * correctly under Maestro — so if the web FIRST frames are blank here and the native ones are not, that
 * is the answer, and it is web-only.
 *
 * ⚠️ The offsets mirror `app-preview.yml`'s: FIRST at beat+0.20s, settled at beat+3.30s. The CI side adds
 * a 3s recorder pre-roll on top; there is none here because the page starts the run itself.
 */

const BEATS = [
  { name: '1-debts', at: 0 },
  { name: '2-held', at: 4000 },
  { name: '3-absorbed', at: 9000 },
  { name: '4-trajectory', at: 14000 },
  { name: '5-payoff', at: 20000 },
] as const;

const FIRST_MS = 200;
const SETTLED_MS = 3300;

test.use({ viewport: { width: 402, height: 874 } });

// The whole run is 20s plus a settled tail, and the default 60s timeout leaves no room for the export.
test.describe.configure({ timeout: 180_000 });

const NOT_ONBOARDED = scenario({
  debts: [],
  paycheck: { amount: '' },
  subscriptionPlan: 'free',
  prefs: { onboardingComplete: false },
});

for (const theme of ['dark', 'light'] as const) {
  // Dark first, and dark is the one that matters: store assets are captured dark ([[feedback_dark_mode_screenshots]]),
  // and the CI capture forces `simctl ui booted appearance dark`. Light is shot anyway because a beat
  // that only works in one theme is a defect this project has shipped before.
  test(`demo beats · ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await seedStore(page, NOT_ONBOARDED);

    await page.goto('/demo?capture=1');
    // t0 AFTER navigation resolves, so the run's clock and ours start together. Sampling from before the
    // goto would drift by however long the SPA took to boot — which is exactly the interval that varies.
    const t0 = Date.now();

    const shootAt = async (offset: number, file: string) => {
      const wait = offset - (Date.now() - t0);
      if (wait > 0) await page.waitForTimeout(wait);
      await page.screenshot({ path: path.join(OUT, theme, `${file}.png`) });
    };

    for (const beat of BEATS) {
      await shootAt(beat.at + FIRST_MS, `beat-${beat.name}-FIRST`);
      await shootAt(beat.at + SETTLED_MS, `beat-${beat.name}-settled`);
    }
  });
}
