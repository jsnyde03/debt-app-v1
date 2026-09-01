import type { ThemeMode } from '@/data/models';
import path from 'path';

import { test } from '@playwright/test';

import { scenario, seedStore } from '../e2e/helpers/seed';

/**
 * 3.5.10 — the explore demo, on the screens a user can now reach.
 *
 * The assertions cover the fences; these cover the thing no assertion can — whether a screen carrying
 * fake money, a live tab bar and a quiet way out reads as an honest sandbox rather than a broken app.
 *
 * ⚠️ 3.7.B.2 — the clock is PINNED. Today's header is a time-of-day greeting now, so without this the
 * reference frame says "Good morning" or "Good evening" depending on when it was captured, and a
 * regenerated frame differs from its predecessor for a reason that is not a change to the app. That is
 * how the root `tests/visual` set's stale frames came to mask a real theme defect.
 */
const OUT = path.resolve(__dirname, '../../capture-ref/explore-demo');

/** A fixed, unremarkable mid-morning — see the clock note above. `setFixedTime`, never `install`. */
const PINNED_CLOCK = new Date('2026-08-11T09:30:00');

test.use({ viewport: { width: 402, height: 874 } });

const COLD = (theme: ThemeMode) =>
  scenario({ debts: [], paycheck: { amount: '' }, subscriptionPlan: 'free', prefs: { onboardingComplete: false, themeMode: theme } });

for (const theme of ['light', 'dark'] as const) {
  test(`explore: the three tabs a user can walk (${theme})`, async ({ page }) => {
    await page.clock.setFixedTime(PINNED_CLOCK);
    await seedStore(page, COLD(theme));
    await page.goto('/demo');
    await page.waitForURL(/money/, { timeout: 15_000 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `money-${theme}.png`) });

    await page.getByTestId('tab-today').click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, `today-${theme}.png`) });

    await page.getByTestId('tab-progress').click();
    await page.waitForTimeout(1200); // the ring + trajectory paint
    await page.screenshot({ path: path.join(OUT, `progress-${theme}.png`) });
  });
}
