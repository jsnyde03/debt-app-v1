import path from 'path';

import { test, type Page } from '@playwright/test';

import { scenario, seedStore } from '../e2e/helpers/seed';

/**
 * 3.5.6.2 — the whole-3.5 both-theme sweep, in ONE reproducible place.
 *
 * The 3.5.6.2.1 inventory found the coverage was not what the docs implied:
 *
 * - the 7-beat arc + the finales DO have both-theme frames, but from `tests/visual/*.cjs` — a parallel,
 *   root-level screenshot mechanism that predates this harness — and they are **stale**: the arc set is
 *   2026-08-05 and the finale set 2026-08-04, while [E4] changed what an upgrader is shown on 08-08 and
 *   3.5.6.1 moved the Guardian card's spacing on 08-10;
 * - the **coach-marks have no frames anywhere in the repo**, although `coach-marks.spec.ts:34` says "the
 *   both-theme screenshots show the card correctly placed". They were shot during 3.5.5 and never
 *   committed, so the comment cites evidence a reader cannot open — the same shape as the lost round-10
 *   lens outputs (L4);
 * - ⚠️ **nothing exercises the walkthrough at an iPad viewport at any width.** `tutorial-invite.spec.ts`
 *   is pinned to 402×874 and `coach-marks.spec.ts` to 440×956, yet `TutorialOverlay` carries bespoke iPad
 *   math — the tab bar becomes a left RAIL, so the overlay's origin sits ~700pt right of the window's and
 *   every ring was drawn that far off its subject. Its own comment says *"Caught by shooting the
 *   walkthrough at 1024×768; a phone-only screenshot pass would have shipped it"* — and then no test was
 *   left behind. That regression is currently protected by nothing.
 *
 * So this shoots what has no coverage and re-shoots what went stale. It asserts nothing (evidence, like
 * `floor-impact.shot.ts` and `guardian-spacing.shot.ts`): appearance is judged by looking, and a pixel
 * assertion here would fail on every deliberate change. What it DOES do is print the spotlight rect at
 * each iPad beat, because "the ring is on its subject" is the one iPad claim a still cannot make on its
 * own — a ring drawn 700pt right is still a perfectly plausible-looking screenshot of a different card.
 *
 * `npx playwright test --config apps/rn/playwright.shots.config.ts phase35-themes`
 * Frames → `apps/rn/capture-ref/phase35/<theme>/`.
 */

const OUT = path.resolve(__dirname, '../../capture-ref/phase35');
const THEMES = ['light', 'dark'] as const;

const PHONE = { width: 402, height: 874 };
const IPAD_LANDSCAPE = { width: 1194, height: 834 };
const IPAD_PORTRAIT = { width: 834, height: 1194 };

/** Every seed here is the real one plus a pinned theme — `themeMode` is what the app reads. */
function seed(theme: string, over: Record<string, unknown> = {}) {
  const { prefs, ...rest } = over as { prefs?: Record<string, unknown> };
  return scenario({
    prefs: { onboardingComplete: true, themeMode: theme, ...(prefs ?? {}) },
    ...rest,
  });
}

const shot = (page: Page, theme: string, name: string) =>
  page.screenshot({ path: path.join(OUT, theme, `${name}.png`) });

/** The beat has to finish measuring → scrolling → re-measuring before a frame means anything. */
const settle = (page: Page) => page.waitForTimeout(650);

for (const theme of THEMES) {
  test.describe(`${theme}`, () => {
    test.use({ viewport: PHONE });

    test(`the 7-beat arc, phone (${theme})`, async ({ page }) => {
      await seedStore(page, seed(theme));
      await page.goto('/tutorial');
      await page.getByTestId('tutorial-step-title').waitFor();
      await page.waitForTimeout(900);

      for (let beat = 1; beat <= 7; beat++) {
        await settle(page);
        const title = await page.getByTestId('tutorial-step-title').innerText();
        const ring = await page.getByTestId('tutorial-spotlight').boundingBox();
        console.log(`  ${theme} beat ${beat}: ${title}${ring ? '' : '  ⚠ NO SPOTLIGHT'}`);
        await shot(page, theme, `arc-${beat}`);
        if (beat < 7) await page.getByText('Next', { exact: true }).click();
      }
    });

    test(`the finale, both audiences (${theme})`, async ({ page }) => {
      // A FREE user's hand-back names what premium just did; the premium one must not sell to someone
      // who already paid. Two different paragraphs on the same beat — the pair only reads as a pair
      // when both frames are shot from the same run.
      for (const plan of ['premium', 'free'] as const) {
        await seedStore(page, seed(theme, { subscriptionPlan: plan }));
        await page.goto('/tutorial');
        await page.getByTestId('tutorial-step-title').waitFor();
        for (let i = 0; i < 6; i++) await page.getByText('Next', { exact: true }).click();
        await settle(page);
        await shot(page, theme, `finale-${plan}`);
      }
    });

    test(`[E4] what an UPGRADER is shown (${theme})`, async ({ page }) => {
      // The finale alone — no step counter, no Back. Shot because [E4] landed after the last both-theme
      // sweep, so this composition has never been looked at in either theme.
      await seedStore(page, seed(theme, { subscriptionPlan: 'premium', prefs: { tutorialSeen: 'free' } }));
      await page.goto('/');
      await page.getByTestId('tutorial-invite').waitFor();
      await page.getByText('Show me').click();
      await page.getByTestId('tutorial-step-title').waitFor();
      await settle(page);
      await shot(page, theme, 'e4-upgrader-finale');
    });

    test(`the coach-marks (${theme})`, async ({ page }) => {
      // FIRST frames these have ever had. The third mark — `debt-row-actions` — is `Platform.OS === 'ios'`
      // and cannot render on web at all, so it stays device-owed rather than being quietly counted here.
      await seedStore(page, seed(theme));
      await page.goto('/money');
      await page.getByText('Card', { exact: true }).first().click();
      await page.getByText('Edit debt').waitFor();
      await settle(page);
      await shot(page, theme, 'coach-payoff-schedule');
      // ⚠️ WHERE it lands, not merely that it exists. `coach-marks.spec.ts` asserts `toBeVisible()` on
      // this text, which RN-web satisfies with a node anywhere in the document — so the assertion and the
      // frame can disagree, and they do. Print the number rather than argue from the picture.
      const inSheet = await page.getByText('See the whole payoff').boundingBox();
      console.log(`  ${theme} coach payoff-schedule: ${inSheet ? `y=${inSheet.y.toFixed(0)} (viewport h=${PHONE.height})` : 'NOT IN DOM'}`);

      await seedStore(page, seed(theme));
      await page.goto('/progress');
      await page.waitForTimeout(1200); // the ring + trajectory paint before the mark is worth a frame
      await shot(page, theme, 'coach-trajectory-scrub');
      const mark = await page.getByText('Drag the curve').boundingBox();
      const subject = await page.getByText('PAYOFF TRAJECTORY').boundingBox();
      console.log(
        `  ${theme} coach trajectory-scrub: mark y=${mark?.y.toFixed(0) ?? 'NONE'} · subject y=${subject?.y.toFixed(0) ?? 'NONE'}`,
      );
    });
  });

  // ── iPad. The gap the inventory found: bespoke origin math, no test at any width. ──────────────────
  for (const [label, viewport] of [
    ['ipad-landscape', IPAD_LANDSCAPE],
    ['ipad-portrait', IPAD_PORTRAIT],
  ] as const) {
    test.describe(`${theme} · ${label}`, () => {
      test.use({ viewport });

      test(`the walkthrough on ${label} (${theme})`, async ({ page }) => {
        await seedStore(page, seed(theme));
        await page.goto('/tutorial');
        await page.getByTestId('tutorial-step-title').waitFor();
        await page.waitForTimeout(900);

        for (let beat = 1; beat <= 7; beat++) {
          await settle(page);
          const ring = await page.getByTestId('tutorial-spotlight').boundingBox();
          // The number that matters. On the regular layout the tab bar is a left rail, so a ring drawn
          // in window coords instead of local ones lands ~700pt right of its subject — and still
          // photographs as a tidy spotlight on the wrong card.
          //
          // ⚠️ These frames CANNOT guard that fix, and an assertion here was written and then deleted for
          // claiming it could. Measured 2026-08-10: deleting the `- origin.x` correction and re-running at
          // 1194×834 changes nothing, because the overlay's origin is 0 on RN-web at every width — the
          // rail offset is a native layout, not a viewport one. The invariant is real and is held by
          // NOTHING automated; it belongs to the Maestro/iPad lane. Routed to the Phase-6 device ledger.
          console.log(
            `  ${theme} ${label} beat ${beat}: ring ${ring ? `x=${ring.x.toFixed(0)} y=${ring.y.toFixed(0)} w=${ring.width.toFixed(0)} h=${ring.height.toFixed(0)}` : '⚠ NONE'}`,
          );
          await shot(page, theme, `${label}-arc-${beat}`);
          if (beat < 7) await page.getByText('Next', { exact: true }).click();
        }
      });
    });
  }
}
