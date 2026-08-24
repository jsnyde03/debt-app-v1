import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * P6.8.9.7.7 [V2-1] — **the Progress hero date is not visually truncated, measured rather than read.**
 *
 * ⛔ **Why this needed a new spec.** V2-1 came back `CLOSED-UNPINNED` for a reason no better assertion could
 * have solved: the only month-year test in the suite (`demo-containment.spec.ts:386`) uses `innerText()`,
 * **which returns the full string straight through a line-clamp.** A hero reading `September 2…` on screen
 * hands that test `September 2026`, so it passes on the exact defect V2-1 found.
 *
 * ⚡ The finding itself: at the DEFAULT iPhone width the slot beside the ring is 186 pt, `October 2026` uses
 * 165 of it, and `September 2026` needs more than the box has — so an ordinary first-run user reads the
 * app's headline number cut in half. It is the month NAME's advance width, not the payoff distance:
 * `April 2034` is further away and renders whole.
 *
 * ⚠️ **WHAT THIS CATCHES, AND WHAT IT DOES NOT — measured with a plant, not assumed.** Reverting
 * `heroDateFit` to one unshrunk line reds the **320 pt** case immediately: *"October 2026 overflows
 * horizontally (content 166px in a 104px box)"* — and 104 pt is exactly the slot width V2-1 measured
 * independently. The **402 pt** case PASSED under the same plant, because `October 2026` happens to fit
 * there (165 of 186 pt) while `September 2026` does not. So the 402 assertion catches this only when the
 * calendar lands on a wide month name, and 320 is what makes the spec reliable.
 * ⚡ That is a property of the defect, not a weakness to paper over: V2-1's own evidence is that the month
 * NAME's advance width decides it, so the narrow width is the one that always tells the truth.
 *
 * ⚠️ **Measures OVERFLOW, not equality with an expected string.** `heroDateFit` sets `numberOfLines: 2`, so
 * a too-long value is clipped rather than wrapped past its box — and clipped content is exactly what
 * `scrollHeight > clientHeight` reports and what reading text cannot. This asserts the property (it fits)
 * rather than a value (it says X), so it keeps working when the date changes with the calendar.
 */
test.use({ viewport: { width: 402, height: 874 } });

/** Comfortably solvable, so Progress renders its populated hero rather than an empty state. */
const PLAN = () =>
  scenario({
    genuineCycleCount: 6,
    debts: [{ id: 'd0', name: 'Card', balance: 1200, minimumPayment: 60, apr: 18, dueDate: day(9), type: 'debt', recurrence: 'monthly' }],
    paycheck: { amount: '2600', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(20) },
    prefs: {
      onboardingComplete: true,
      guardianIntroSeen: true,
      coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'],
    },
  });

for (const width of [402, 320]) {
  test(`V2-1 — the hero debt-free date fits its box at ${width}pt`, async ({ page }) => {
    await page.setViewportSize({ width, height: 874 });
    await seedStore(page, PLAN());
    await page.goto('/progress');

    const hero = page.getByTestId('progress-hero-date');
    await expect(hero).toBeVisible({ timeout: 15_000 });

    // The control: a real date, not the `—` placeholder. Without this the overflow check below is
    // trivially satisfied by an em-dash, which is the one value guaranteed to fit.
    const text = (await hero.innerText()).trim();
    expect(text, 'the hero shows a real debt-free date, not the placeholder').toMatch(/\w+\s+\d{4}/);

    const fit = await hero.evaluate((el) => ({
      scrollH: el.scrollHeight,
      clientH: el.clientHeight,
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
    }));

    // ⛔ THE ASSERTION `innerText()` CANNOT MAKE. A clamped element still reports its whole string; only
    // the geometry says whether the user can see it.
    expect(
      fit.scrollH,
      `"${text}" is clipped vertically at ${width}pt (content ${fit.scrollH}px in a ${fit.clientH}px box) — ` +
        'the app\'s headline number is cut off',
    ).toBeLessThanOrEqual(fit.clientH);
    expect(
      fit.scrollW,
      `"${text}" overflows horizontally at ${width}pt (content ${fit.scrollW}px in a ${fit.clientW}px box)`,
    ).toBeLessThanOrEqual(fit.clientW);
  });
}
