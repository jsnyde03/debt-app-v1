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
  assert(paywallLead(null, BASE_PAYCHECK_BUFFER) === null, 'no live summary → null (the pre-onboarding viewer sees today’s paywall)');

  // ── A shortfall outranks everything: it is the most urgent true thing about this cycle. ──
  const short = paywallLead(summary({ shortfall: 180 }), BASE_PAYCHECK_BUFFER);
  assert(short!.fact.includes('$180'), 'a short cycle leads with the shortfall, in their number');
  assert(/Recovery Plan/.test(short!.offer), '…and points at the feature built for it');

  // ── Otherwise: their flexible money, and the real tier difference. ──
  const normal = paywallLead(summary(), BASE_PAYCHECK_BUFFER);
  assert(normal!.fact.includes('$412'), 'no shortfall → leads with their flexible money');
  assert(normal!.offer.includes(`$${BASE_PAYCHECK_BUFFER}`), '…and names the flat amount the free tier actually protects');

  // ── `from` answers the thing they went looking for. ──
  const fromForecast = paywallLead(summary(), BASE_PAYCHECK_BUFFER, 'cushion-forecast');
  assert(/six paydays/.test(fromForecast!.offer), 'arriving from the forecast → the offer answers the forecast');
  assert(fromForecast!.offer !== normal!.offer, '…and is not the generic offer');

  // ── ⛔ THE RETIRED CLAIMS. Neither may reappear in any branch. ──
  const every = [
    paywallLead(summary({ shortfall: 180 }), BASE_PAYCHECK_BUFFER),
    paywallLead(summary(), BASE_PAYCHECK_BUFFER),
    paywallLead(summary(), BASE_PAYCHECK_BUFFER, 'cushion-forecast'),
  ].filter(Boolean) as { fact: string; offer: string }[];
  for (const l of every) {
    const text = `${l.fact} ${l.offer}`.toLowerCase();
    assert(!text.includes('automatic'), `L1-2 stays fixed — no "automatic" in: ${l.offer.slice(0, 40)}…`);
    assert(!text.includes('autopilot'), `L1-2 stays fixed — no "autopilot" in: ${l.offer.slice(0, 40)}…`);
    assert(!/keeps? (it|your cushion) at your line/.test(text), `L1-3 stays fixed — no unconditional hold in: ${l.offer.slice(0, 40)}…`);
    assert(!/every payday/.test(text), `L1-3 stays fixed — no "every payday" promise in: ${l.offer.slice(0, 40)}…`);
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
