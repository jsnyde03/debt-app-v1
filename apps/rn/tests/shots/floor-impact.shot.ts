import path from 'path';

import { expect, test } from '@playwright/test';

import { scenario, seedStore } from '../e2e/helpers/seed';

const OUT = path.resolve(__dirname, '../../capture-ref');

/**
 * [L2c] — `FloorImpactBar` MID-FLIGHT.
 *
 * The 3.5.3.9 gate closed with premium criterion 5 (payoff choreography) judged from code and from END
 * states: three separate bar reviews looked at where the bar finished, never at how it travelled. That
 * is the one claim a still of the settled bar cannot support, because the whole point of [D4]'s change
 * from `withTiming` to a SPRING is what happens between the two ends.
 *
 * So this samples the transition. It asserts nothing — like the demo reference set beside it, it exists
 * to produce frames a human can look at, and adding ~20s to the release gate to re-shoot them every run
 * would be paying for evidence nobody is reading. `npx playwright test --config
 * apps/rn/playwright.shots.config.ts floor-impact`.
 *
 * ⚠️ The bar only renders when the line actually MOVED — an unchanged Save is a deliberate no-op. Hence
 * the wait on the sheet's displayed amount rather than a bare click; see `tutorial-invite.spec.ts`, where
 * the same race was the suite's one genuinely flaky step.
 */
const SAMPLES = [60, 140, 260, 420, 900];

test.use({ viewport: { width: 402, height: 874 } });

test('the floor impact bar, sampled through its spring', async ({ page }) => {
  await seedStore(page, scenario({ prefs: { onboardingComplete: true } }));
  await page.goto('/tutorial');

  await page.getByText('Next', { exact: true }).click(); // → 2 read the bar
  await page.getByText('Next', { exact: true }).click(); // → 3 your line (interactive)
  await page.getByText('Adjust your line').click();

  const amount = page.getByTestId('floor-sheet-value');
  const box = (await page.getByLabel('Cushion line amount').boundingBox())!;
  const before = await amount.textContent();
  await expect
    .poll(async () => {
      await page.mouse.click(box.x + box.width * 0.2, box.y + box.height / 2);
      return amount.textContent();
    }, { timeout: 10_000 })
    .not.toBe(before);

  // Save is the starting gun: the sheet dismisses and the bar springs in behind it.
  await page.getByText('Save', { exact: true }).click();

  for (const ms of SAMPLES) {
    await page.waitForTimeout(ms === SAMPLES[0] ? ms : ms - SAMPLES[SAMPLES.indexOf(ms) - 1]);
    await page.screenshot({ path: path.join(OUT, `floor-impact-${String(ms).padStart(4, '0')}ms.png`) });
  }
});
