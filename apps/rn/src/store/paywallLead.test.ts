import { BASE_PAYCHECK_BUFFER } from '@/store/selectors';
import { paywallLead } from '@/store/paywallLead';
import type { PlanSummary } from '@/store/planSelectors';

/**
 * T3B (audit L5-12) — the paywall leads with the reader's own money, and does NOT re-introduce the two
 * claims this screen has already retired.
 *
 * ⚠️ The last block is the load-bearing one. L1-2 removed "autopilot" from this screen (the product says
 * "your Guardian suggests — it never moves your money" twice elsewhere) and L1-3 removed the
 * unconditional "holds your cushion at your line", because the Recovery Plan bullet two rows down sells
 * the case where it does not hold. The finding that asked for this feature suggested copy containing
 * BOTH — so the risk here is the wording, not the mechanism, and it is pinned rather than trusted.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function summary(over: Partial<PlanSummary> = {}): PlanSummary {
  return {
    heroValue: 2000, heroLabel: 'cushion this paycheck', planned: 1500, cushion: 412,
    requiredTotal: 1500, shortfall: 0, remainingAfterRequired: 500, everydayReserve: 0,
    billsReserve: 0, cushionStatus: 'stable', debtFreeDate: 'Mar 2029', status: 'on-track',
    ...over,
  } as PlanSummary;
}

function run() {
  console.log('Running paywall-lead (T3B/L5-12) tests...');

  // ── No plan → no invented numbers. The route is deliberately open pre-onboarding. ──
  assert(paywallLead(null, BASE_PAYCHECK_BUFFER, true) === null, 'no live summary → null (the pre-onboarding viewer sees today’s paywall)');

  /**
   * ⛔ **S1.10.6.2 [pass-3 C-5] — A PLAN THE APP COULD NOT READ STATES NOTHING.**
   *
   * ⚡ Measured on the real chain: a user whose imported file lost one card's $400 minimum was told
   * *"This paycheck comes up $100 short."* on a cycle that is $500 short, and then sold a Recovery Plan
   * sized against a number wrong by 4×. ⛔ The `cushion` branch is asserted too, because it runs on the
   * NON-shortfall path — the same store can otherwise promise a cushion over a missing obligation.
   */
  assert(
    paywallLead(summary({ shortfall: 180 }), BASE_PAYCHECK_BUFFER, false) === null,
    '⛔ C-5 — a shortfall derived from arrays missing an unread obligation is not stated',
  );
  assert(
    paywallLead(summary(), BASE_PAYCHECK_BUFFER, false) === null,
    '⛔ C-5 — …and neither is the cushion, which is the branch that runs when the cycle looks fine',
  );
  assert(
    paywallLead(summary(), BASE_PAYCHECK_BUFFER, false, 'cushion-forecast') === null,
    '⛔ C-5 — …including the `from` branch, which is a third exit this function has',
  );
  // ⭐ THE CONTROL, and it is the whole point: a plan the app fully read still leads with the fact.
  assert(
    paywallLead(summary(), BASE_PAYCHECK_BUFFER, true) !== null,
    '⭐ control — a readable plan still states its fact, or the fix bought correctness by going silent',
  );

  // ── A shortfall outranks everything: it is the most urgent true thing about this cycle. ──
  const short = paywallLead(summary({ shortfall: 180 }), BASE_PAYCHECK_BUFFER, true);
  assert(short!.fact.includes('$180'), 'a short cycle leads with the shortfall, in their number');
  assert(/Recovery Plan/.test(short!.offer), '…and points at the feature built for it');

  // ── Otherwise: their cushion, and the real tier difference. ──
  const normal = paywallLead(summary(), BASE_PAYCHECK_BUFFER, true);
  assert(normal!.fact.includes('$412'), 'no shortfall → leads with their cushion');
  assert(normal!.offer.includes(`$${BASE_PAYCHECK_BUFFER}`), '…and names the flat amount the free tier actually protects');

  // ── `from` answers the thing they went looking for. ──
  const fromForecast = paywallLead(summary(), BASE_PAYCHECK_BUFFER, true, 'cushion-forecast');
  assert(/six paydays/.test(fromForecast!.offer), 'arriving from the forecast → the offer answers the forecast');
  assert(fromForecast!.offer !== normal!.offer, '…and is not the generic offer');

  // ── ⛔ THE RETIRED CLAIMS. Neither may reappear in any branch. ──
  const every = [
    paywallLead(summary({ shortfall: 180 }), BASE_PAYCHECK_BUFFER, true),
    paywallLead(summary(), BASE_PAYCHECK_BUFFER, true),
    paywallLead(summary(), BASE_PAYCHECK_BUFFER, true, 'cushion-forecast'),
  ].filter(Boolean) as { fact: string; offer: string }[];
  for (const l of every) {
    const text = `${l.fact} ${l.offer}`.toLowerCase();
    assert(!text.includes('automatic'), `L1-2 stays fixed — no "automatic" in: ${l.offer.slice(0, 40)}…`);
    assert(!text.includes('autopilot'), `L1-2 stays fixed — no "autopilot" in: ${l.offer.slice(0, 40)}…`);
    assert(!/keeps? (it|your cushion) at your line/.test(text), `L1-3 stays fixed — no unconditional hold in: ${l.offer.slice(0, 40)}…`);
    assert(!/every payday/.test(text), `L1-3 stays fixed — no "every payday" promise in: ${l.offer.slice(0, 40)}…`);
    // ⛔ T4.0 (glossary) — this function only ever prints `summary.cushion`. "Flexible" is PlanHero's
    // label for a DIFFERENT, smaller number, and it shipped here once: the screen called one figure
    // flexible and then said it was protected. "Buffer"/"breathing room" are the same retired synonyms.
    assert(!text.includes('flexible'), `T4.0 — "flexible" names PlanHero's remainder, not the cushion, in: ${l.fact}`);
    assert(!text.includes('buffer') && !text.includes('breathing room'), `T4.0 — retired cushion synonym in: ${l.fact}`);
  }

  console.log(`✅ Paywall-lead (T3B/L5-12) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
