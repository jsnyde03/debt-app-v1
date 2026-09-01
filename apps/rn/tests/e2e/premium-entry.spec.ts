import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * §2.11.5 — the paths into the paywall. The MOST important is the always-visible More-hub entry (the
 * App Review reviewer's reliable path — the fix for v1.1's "couldn't find the paywall" rejections); the
 * in-context Guardian invite is the at-the-moment-of-need entry. Both must be free-tier and tappable.
 */

const free = (over: Record<string, unknown> = {}) => scenario({ subscriptionPlan: 'free', ...over });

test('More hub shows an always-visible "Unlock Premium" entry that opens the paywall', async ({ page }) => {
  await seedStore(page, free({ prefs: { onboardingComplete: true } }));
  await page.goto('/more');
  const entry = page.getByText('Unlock Premium');
  await expect(entry).toBeVisible();
  await page.screenshot({ path: 'test-results/more-premium-entry-light.png', fullPage: true });
  await entry.click();
  await expect(page.getByText('Every payday, worked out for you')).toBeVisible(); // the paywall
});

test('free Guardian invite is a tappable button that opens the paywall', async ({ page }) => {
  await seedStore(page, free({ prefs: { onboardingComplete: true } }));
  await page.goto('/');
  const invite = page.getByText(/Premium works out how much to keep back/i);
  await expect(invite).toBeVisible();
  await page.screenshot({ path: 'test-results/guardian-free-invite-light.png', fullPage: true });
  await invite.click();
  await expect(page.getByText('Every payday, worked out for you')).toBeVisible();
});

test('free Guardian invite renders in dark theme', async ({ page }) => {
  await seedStore(page, free({ prefs: { onboardingComplete: true, themeMode: 'dark' } }));
  await page.goto('/');
  await expect(page.getByText(/Premium works out how much to keep back/i)).toBeVisible();
  await page.screenshot({ path: 'test-results/guardian-free-invite-dark.png', fullPage: true });
});
