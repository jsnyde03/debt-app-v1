import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * §2.11.4 Premium paywall (web). No SDK on web → the static-price fallback renders, which is exactly
 * what proves the layout + Apple 3.1.2 elements (billed price per plan, restore, auto-renew disclosure,
 * Terms/Privacy links) and lets us screenshot both themes. Real purchase/restore is device-only.
 */

const free = (themeMode: 'light' | 'dark') =>
  scenario({ subscriptionPlan: 'free', prefs: { onboardingComplete: true, themeMode } });

async function openPaywall(page: import('@playwright/test').Page, themeMode: 'light' | 'dark') {
  await seedStore(page, free(themeMode));
  await page.goto('/paywall');
  await expect(page.getByText('Debt payoff on autopilot')).toBeVisible();
}

test('paywall renders the three plans + Guideline 3.1.2 elements', async ({ page }) => {
  await openPaywall(page, 'light');

  // All three billed prices are shown (the most prominent element per plan). $29.99 also appears in
  // the CTA (the preselected Annual), so scope to the first (the plan row) to avoid a strict clash.
  await expect(page.getByText('$29.99').first()).toBeVisible();
  await expect(page.getByText('$79.99')).toBeVisible();
  await expect(page.getByText('$4.99')).toBeVisible();

  // Annual leads and is preselected → the CTA reflects it.
  await expect(page.getByRole('button', { name: /Start Premium/ })).toBeVisible();

  // 3.1.2 required affordances.
  await expect(page.getByText('Restore purchases')).toBeVisible();
  await expect(page.getByText('Terms of Use (EULA)')).toBeVisible();
  await expect(page.getByText('Privacy Policy')).toBeVisible();

  // Selecting Lifetime switches the CTA to the one-time wording.
  await page.getByText('Lifetime').first().click();
  await expect(page.getByRole('button', { name: /Unlock Premium/ })).toBeVisible();

  await page.screenshot({ path: 'test-results/paywall-light.png', fullPage: true });
});

test('paywall renders in dark theme', async ({ page }) => {
  await openPaywall(page, 'dark');
  await expect(page.getByText('$29.99').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/paywall-dark.png', fullPage: true });
});
