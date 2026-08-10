import path from 'path';

import { test, type Locator, type Page } from '@playwright/test';

import { scenario, seedStore } from '../e2e/helpers/seed';

const OUT = path.resolve(__dirname, '../../capture-ref');

/**
 * [L2a · L2b · L2d] — the three spacing items the 3.5.3.9-L ledger left open, MEASURED.
 *
 * All three are geometry claims made from looking at a picture: round 4 asked for "4–6pt more" clearance
 * under beat 4's ring (L2a) and called the card's bottom padding "~37pt against a ~48pt rhythm" (L2b),
 * and the 2026-08-06 device capture reported a gap where beat 1 withholds the replay link (L2d, filed
 * explicitly as *unconfirmed — measure before treating it as a defect*).
 *
 * ⚠️ L2a and L2b already have code fixes — `66782de` (2026-08-04) raised `attest` to `sm` and added
 * `lastRowSpacer`, both citing these two nits by name — which landed two days BEFORE the ledger recorded
 * them open. What was never done is the re-judge: the fixes were never put back in front of the geometry
 * that produced the complaint. Reading the diff again cannot settle that, and neither can another
 * screenshot judged by eye. Hence numbers.
 *
 * Asserts nothing, like `floor-impact.shot.ts` beside it: it exists to produce measurements + frames a
 * human decides from, and pinning a pt value as a gate would freeze a judgement call as a contract.
 * `npx playwright test --config apps/rn/playwright.shots.config.ts guardian-spacing`.
 */

type Box = { x: number; y: number; width: number; height: number };

const rows: string[] = [];

function say(line: string) {
  rows.push(line);
  console.log(line);
}

/** Bounding box or null — a withheld row is a legitimate answer here, not a failure. */
async function box(loc: Locator): Promise<Box | null> {
  if ((await loc.count()) === 0) return null;
  return await loc.first().boundingBox();
}

/** The gap between two stacked boxes, from the bottom of the upper to the top of the lower. */
function gap(upper: Box | null, lower: Box | null): string {
  if (!upper || !lower) return 'n/a';
  return `${(lower.y - (upper.y + upper.height)).toFixed(1)}pt`;
}

test.use({ viewport: { width: 402, height: 874 } });

test('the three ledger spacing items, measured', async ({ page }: { page: Page }) => {
  await seedStore(page, scenario({ prefs: { onboardingComplete: true } }));
  await page.goto('/tutorial');

  const card = page.getByTestId('tutorial-target-guardian-card');
  const ring = page.getByTestId('tutorial-spotlight');

  // ── BEAT 1 — the whole card is the subject, and the replay link is withheld (`isExample`). ─────────
  await page.getByTestId('tutorial-step-title').waitFor();
  await page.waitForTimeout(600); // the iris spring + the ring's 180ms fade have to settle before measuring

  const b1Card = await box(card);
  const b1Adjust = await box(page.getByText('Adjust your line →'));
  const b1Attest = await box(page.getByTestId('tutorial-target-guardian-reserve'));
  const b1Replay = await box(page.getByTestId('guardian-replay-tutorial'));
  const b1Forecast = await box(page.getByText('See your forecast →'));

  say('── BEAT 1 · the card tail (L2b card bottom padding · L2d the withheld replay row) ──');
  say(`  card                 ${b1Card ? `y=${b1Card.y.toFixed(1)} h=${b1Card.height.toFixed(1)}` : 'ABSENT'}`);
  say(`  attest target        ${b1Attest ? `y=${b1Attest.y.toFixed(1)} h=${b1Attest.height.toFixed(1)}` : 'ABSENT'}`);
  say(`  "Adjust your line →" ${b1Adjust ? `y=${b1Adjust.y.toFixed(1)} h=${b1Adjust.height.toFixed(1)}` : 'ABSENT'}`);
  say(`  replay link          ${b1Replay ? `y=${b1Replay.y.toFixed(1)} h=${b1Replay.height.toFixed(1)}` : 'ABSENT (withheld — expected in sandbox)'}`);
  say(`  "See your forecast →"${b1Forecast ? ` y=${b1Forecast.y.toFixed(1)} h=${b1Forecast.height.toFixed(1)}` : ' ABSENT'}`);
  // L2d: if withholding leaves the row's space behind, it shows up as an oversized gap ACROSS the point
  // where the link used to be — i.e. between the adjust row and the forecast row.
  say(`  ▸ L2d gap adjust→forecast (the withheld row's slot): ${gap(b1Adjust, b1Forecast)}`);
  say(`  ▸ L2b card bottom below the last text:               ${b1Card && b1Forecast ? `${(b1Card.y + b1Card.height - (b1Forecast.y + b1Forecast.height)).toFixed(1)}pt` : 'n/a'}`);
  say(`  ▸ L2b inter-row rhythm for comparison (attest→adjust): ${gap(b1Attest, b1Adjust)}`);

  await page.screenshot({ path: path.join(OUT, 'spacing-beat1.png') });

  // ── BEAT 4 — the ring frames the attestation; "Your call" is the copy directly above it. ───────────
  for (let i = 0; i < 3; i++) await page.getByText('Next', { exact: true }).click();
  await page.waitForTimeout(900); // the hole + ring spring to the new subject; measuring mid-transit is meaningless

  const b4Ring = await box(ring);
  const b4Attest = await box(page.getByTestId('tutorial-target-guardian-reserve'));
  const b4YourCall = await box(page.getByText('Your call', { exact: true }));
  const b4Look = await box(page.getByTestId('tutorial-step-title')); // sanity: which beat are we on

  say('');
  say('── BEAT 4 · the ring under "Your call" (L2a) ──');
  say(`  beat title           ${b4Look ? await page.getByTestId('tutorial-step-title').textContent() : 'ABSENT'}`);
  say(`  "Your call"          ${b4YourCall ? `y=${b4YourCall.y.toFixed(1)} h=${b4YourCall.height.toFixed(1)}` : 'ABSENT'}`);
  say(`  attest target        ${b4Attest ? `y=${b4Attest.y.toFixed(1)} h=${b4Attest.height.toFixed(1)}` : 'ABSENT'}`);
  say(`  ring                 ${b4Ring ? `y=${b4Ring.y.toFixed(1)} h=${b4Ring.height.toFixed(1)}` : 'ABSENT'}`);
  // Round 4's complaint, stated as a number: how much clear air is there between the bottom of the copy
  // and the top edge of the ring. `RING_INSET` is 6, so this is (attest marginTop − 6) plus whatever
  // slack the text box leaves below its glyphs.
  say(`  ▸ L2a clearance "Your call" bottom → ring top: ${gap(b4YourCall, b4Ring)}`);
  say(`  ▸ ring inset actually applied (attest top − ring top): ${b4Ring && b4Attest ? `${(b4Attest.y - b4Ring.y).toFixed(1)}pt` : 'n/a'}`);

  await page.screenshot({ path: path.join(OUT, 'spacing-beat4.png') });

  say('');
  say(`frames → ${OUT}`);
});
