import { expect, test } from '@playwright/test';

import { scenario, seedStore, day } from './helpers/seed';

/**
 * P6.8.9.7.7 [A1-2] — **what a screen reader is TOLD, compared against the shipped glossary.**
 *
 * ⛔ **The defect:** the cash-flow columns spoke `cushionStatus` — the ENGINE's token — so a VoiceOver user
 * heard their money described as `pressure` or `stable` while a sighted user read *"Very tight"*. Cluster f
 * fixed it to read `GUARDIAN_STATE_LABEL[...]`, and the verification pass returned it `CLOSED-UNPINNED`
 * with a precise reason: **nothing in this repo reads a label's CONTENTS.** `check-glossary.ts` scans string
 * literals and the fix's whole point is that the words come from an interpolated identifier — so the gate
 * built to catch shipped-vocabulary drift is structurally blind to the one place it mattered most.
 *
 * ⚡ The site's own comment said so before this existed: *"no gate in the repo compares a spoken string to
 * the shipped glossary."* This is that comparison.
 *
 * ⚠️ Asserts on the RENDERED `aria-label`, not on the source. A source check would pass on a component that
 * builds the right string and never puts it on the node — which is the shape of half the defects in this
 * audit.
 */
test.use({ viewport: { width: 402, height: 874 } });

/** The engine's internal vocabulary. None of these is a word any user should ever hear. */
const ENGINE_TOKENS = ['stable', 'pressure', 'at-risk', 'atRisk', 'cushionStatus', 'guardianState'];

/** What the glossary actually ships — `GUARDIAN_STATE_LABEL`'s values. */
const SPOKEN_LABELS = ['Clear', 'Tight', 'Very tight'];

const PLAN = () =>
  scenario({
    genuineCycleCount: 6,
    paycheck: { amount: '2000', payCycle: 'monthly', currentDate: day(0), nextPaycheckDate: day(14) },
    prefs: {
      onboardingComplete: true,
      guardianIntroSeen: true,
      coachMarksSeen: ['payoff-schedule', 'debt-row-actions', 'trajectory-scrub'],
    },
  });

test('A1-2 — the cash-flow columns speak the glossary, never the engine token', async ({ page }) => {
  await seedStore(page, PLAN());
  await page.goto('/progress');

  // ⛔ The control. An "no engine token anywhere" assertion is trivially true of a page that never rendered
  // the section — the absence trap this repo has been bitten by twice — so the card is proven present and
  // proven to have labelled columns before anything is compared.
  await expect(page.getByTestId('cash-flow-section')).toBeVisible({ timeout: 15_000 });

  const labels = await page.locator('[aria-label]').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('aria-label') ?? '').filter((l) => l.includes('of room')),
  );
  expect(labels.length, 'the cash-flow columns carry spoken labels at all').toBeGreaterThan(0);

  for (const label of labels) {
    for (const token of ENGINE_TOKENS) {
      expect(
        label.toLowerCase(),
        `a screen reader is told "${label}" — "${token}" is the engine's word, not the user's`,
      ).not.toContain(token.toLowerCase());
    }
    // ⚠️ And the positive half: a label stripped of its state entirely would satisfy every check above.
    expect(
      SPOKEN_LABELS.some((l) => label.includes(l)),
      `"${label}" names no shipped state — it must end in one of ${SPOKEN_LABELS.join(' / ')}`,
    ).toBe(true);
  }
});
