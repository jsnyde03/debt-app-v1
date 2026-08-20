import { expect, test } from '@playwright/test';

import { scenario, seedStore } from './helpers/seed';

/**
 * TEST-1 (closeout) — every route renders NON-BLANK. This project's nastiest regression class is a blank
 * route caused by a native import leaking into a web chunk (the `/more` LiveActivity-bridge crash + the
 * KeyCommandListener `.native.tsx` crash — each first read as a "harness quirk"). A blanked screen otherwise
 * passes silently; this locks it — a crash fails the heading assertion AND the non-blank body check.
 */
const ROUTES: { path: string; text?: string; onboarded: boolean }[] = [
  { path: '/', onboarded: true }, // Today (custom screen — body-content check)
  { path: '/progress', text: 'Progress', onboarded: true },
  { path: '/money', text: 'Money', onboarded: true },
  { path: '/more', text: 'Preferences', onboarded: true },
  { path: '/history', text: 'Pay cycle history', onboarded: true },
  { path: '/living-expenses', text: 'Everyday spending', onboarded: true },
  { path: '/cushion-forecast', text: 'Your cushion forecast', onboarded: true },
  { path: '/schedule/d0', text: 'Payoff schedule', onboarded: true }, // 3.7.A0 — the seeded debt's id

  { path: '/paywall', text: 'Every payday, worked out for you', onboarded: true },
  { path: '/onboarding', onboarded: false }, // guarded by !onboardingComplete
];

// ⛔ The populated plan this suite needs now lives in `scenario()` itself (2026-08-18), so every spec gets
// it rather than this one. Kept as a note because the reason is easy to lose: Today rendered blank for
// every user with a bill while all ten of these passed, because the fixture seeded none.
for (const { path, text, onboarded } of ROUTES) {
  test(`route smoke: ${path} renders (non-blank)`, async ({ page }) => {
    await seedStore(page, scenario({ prefs: { onboardingComplete: onboarded } }));
    await page.goto(path);
    if (text) await expect(page.getByText(text).first()).toBeVisible();
    // The crash class is a BLANK route (bodyTextLen ~0); assert real content rendered.
    await page.waitForTimeout(600);
    const len = await page.evaluate(() => (document.body.innerText || '').length);
    expect(len, `${path} should render non-blank content`).toBeGreaterThan(40);
  });
}
