import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * L3 render probe 2 — Progress's cash-flow bars over (M) an unread minimum and (L) an unread cushion line, each beside its
 * readable twin. MEASURES, does not judge: waits for the section's own caption, then logs it and the bar labels, so the
 * file runs unchanged at the pin and at c7df99c2.
 */
const log = (tag: string, v: unknown) => console.log(`L3PROBE ${tag} :: ${JSON.stringify(v)}`);

const UNREAD_BASE = {
  cushionFloor: 400,
  genuineCycleCount: 6,
  paycheck: { amount: '1650', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(31) },
  debts: [
    { id: 'd0', name: 'Visa', balance: 6200, originalBalance: 8000, minimumPayment: 160, apr: 22, dueDate: day(10), type: 'debt', recurrence: 'monthly' },
    { id: 'd2', name: 'Car', balance: 11000, originalBalance: 14000, minimumPayment: 320, apr: 6, dueDate: day(20), type: 'debt', recurrence: 'monthly' },
  ],
  prefs: { onboardingComplete: true, coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'] },
};

const STORES: Record<string, Record<string, unknown>> = {
  'M premium · Visa minimum unread': scenario({ ...UNREAD_BASE, debts: [{ ...UNREAD_BASE.debts[0], minimumPayment: '' }, UNREAD_BASE.debts[1]] }),
  'M premium · readable twin': scenario({ ...UNREAD_BASE }),
  'M free · Visa minimum unread': scenario({ ...UNREAD_BASE, subscriptionPlan: 'free', debts: [{ ...UNREAD_BASE.debts[0], minimumPayment: '' }, UNREAD_BASE.debts[1]] }),
  'M free · readable twin': scenario({ ...UNREAD_BASE, subscriptionPlan: 'free' }),
  'L premium · cushion line unread (set was $350)': scenario({ ...UNREAD_BASE, cushionFloor: 'abc' }),
  'L premium · readable twin ($350)': scenario({ ...UNREAD_BASE, cushionFloor: 350 }),
};

for (const [name, blob] of Object.entries(STORES)) {
  test(`L3 P4 progress cash-flow · ${name}`, async ({ page }) => {
    await seedStore(page, blob);
    await page.goto('/progress');
    await expect(page.getByTestId('progress-hero-journey')).toBeVisible({ timeout: 15_000 });
    const caption = page.getByText(/room after each paycheck/).first();
    const present = await caption.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!present) {
      await caption.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => undefined);
    }
    log(`P4 ${name} caption`, await caption.innerText({ timeout: 10_000 }).catch(() => '(no cash-flow caption rendered)'));
    // ⚠️ The first cut located the section by xpath ancestry and logged "" at c7df99c2 (`14-…`). The screen's own text is
    // unambiguous: the bar figures sit between the section heading and the caption.
    await page.waitForTimeout(2500); // CanvasKit lazy-load, as cushion-forecast.spec does
    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    const m = body.match(/CASH FLOW[^]*?room after each paycheck[^.]*\.?[^.]*\./);
    log(`P4 ${name} section`, m ? m[0].slice(0, 500) : `(no CASH FLOW section) ${body.slice(0, 300)}`);
    log(`P4 ${name} progress date`, await page.getByTestId('progress-hero-date').innerText());
  });
}
