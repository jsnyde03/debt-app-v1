import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { deriveConfidenceContext } from '@/store/guardianPredictionCore';
import { advanceSandboxCycle, runBeats, scriptSurprise, TUTORIAL_MAX_CYCLES } from '@/store/sandboxBeats';
import { personaScenario } from '@/store/sandboxScenarios';
import { createSandboxStore, SANDBOX_MAX_GENUINE_CYCLES } from '@/store/sandboxStore';

/**
 * 3.5.0.4 — the scripted payday beats.
 *
 * The load-bearing assertions here are about PROVENANCE, not appearance: the absorb and release visuals
 * must be produced by the real engine, because a hand-set flag looks identical on day one and then
 * drifts silently from real behaviour. So these drive `rolloverPayCycle` and assert the engine's own
 * `pendingReserveRelease` arrives — the beat layer never writes it.
 *
 * They also pin the two ends of the per-purpose ceiling (3.5.0.4.1): the tutorial can cross the
 * discovery gate; the DEMO still cannot, at any number of beats.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

/** A tutorial-ceilinged sandbox, onboarded so the substrate is stamped like a real first run. */
function tutorialSandbox() {
  const sb = createSandboxStore(personaScenario('clear', { maxGenuineCycles: TUTORIAL_MAX_CYCLES }));
  sb.getState().completeOnboarding();
  return sb;
}

function run() {
  console.log('3.5.0.4 — sandbox beats (scripted paydays · absorb · release)...');

  // ── A beat drives the REAL rollover: the cycle advances and time moves. ───────────────────────
  const sb = tutorialSandbox();
  const startDate = sb.getState().store.paycheck.currentDate;
  const first = advanceSandboxCycle(sb);
  eq(first.cycle, 1, 'one beat = one genuine cycle lived');
  assert(first.date > startDate, '…and the scripted today advances to the next payday');
  assert(first.reserveHeld, '…with the safety net still held this early');
  eq(first.released, null, '…and no release yet (the gate has not been crossed)');

  // ── The RELEASE is an engine event, reached by scripting real paydays. ────────────────────────
  const beats = runBeats(sb, TUTORIAL_MAX_CYCLES + 1);
  const releaseBeat = beats.find((b) => b.released !== null);
  assert(releaseBeat !== undefined, 'scripted paydays DO reach the safety-net release (the arc\'s payoff)');
  eq(
    deriveConfidenceContext(sb.getState().store).discoveryHoldbackActive,
    false,
    '…because the discovery gate genuinely retired — not because a flag was set',
  );
  assert(releaseBeat!.cycle >= TUTORIAL_MAX_CYCLES, '…and it lands at the real gate, not before it');

  // ── A surprise makes "absorbed" a fact, and branches the release ack. ─────────────────────────
  const tapped = tutorialSandbox();
  advanceSandboxCycle(tapped);
  scriptSurprise(tapped, 120);
  assert(tapped.getState().store.surpriseOutflowLog.length > 0, 'the surprise beat records a REAL outflow');
  const tappedRelease = runBeats(tapped, TUTORIAL_MAX_CYCLES + 1).find((b) => b.released !== null);
  assert(tappedRelease !== undefined, 'a tapped run still reaches the release');
  eq(tappedRelease!.released!.tapped, true, '…and the ack knows the net was actually drawn on');
  assert(tappedRelease!.released!.covered > 0, '…crediting what it genuinely covered');

  // An untouched run releases too, but on the neutral branch — no invented "covered a surprise".
  const untouched = tutorialSandbox();
  const untouchedRelease = runBeats(untouched, TUTORIAL_MAX_CYCLES + 1).find((b) => b.released !== null);
  assert(untouchedRelease !== undefined, 'an untapped run reaches the release as well');
  eq(untouchedRelease!.released!.tapped, false, '…on the neutral branch (nothing drew on it)');
  eq(untouchedRelease!.released!.covered, 0, '…claiming nothing covered');

  // ── The DEMO's day-one bound is untouched by any of this. ─────────────────────────────────────
  const demo = createSandboxStore(personaScenario('clear')); // no ceiling override = day-one
  demo.getState().completeOnboarding();
  const demoBeats = runBeats(demo, 8);
  eq(demo.getState().store.genuineCycleCount, SANDBOX_MAX_GENUINE_CYCLES, 'the demo still caps at one genuine cycle');
  eq(
    deriveConfidenceContext(demo.getState().store).discoveryHoldbackActive,
    true,
    '…so its safety net can never mature away, however many beats run',
  );
  assert(demoBeats.every((b) => b.released === null), '…and the demo NEVER reaches a release');

  // Raising the cycle ceiling must not buy a track record on the other channels.
  const t = sb.getState().store;
  assert(t.cycleHistory.length <= 1, 'a raised ceiling still cannot build a multi-cycle history');
  assert(t.incomeActualsLog.length <= 1, '…nor accumulate lean confirmations');

  // ── Determinism: same scenario + same script ⇒ same beats. ────────────────────────────────────
  const a = runBeats(tutorialSandbox(), 4);
  const b = runBeats(tutorialSandbox(), 4);
  assert(JSON.stringify(a) === JSON.stringify(b), 'a scripted sequence is byte-identical across runs');

  // ── 3.5.3.5.6 — a scripted payday must be a payday that was ATTENDED. ─────────────────────────
  // The beats used to roll without checking in, which is not a payday — it's a payday nobody turned up
  // to. Three of those left the taught plan reading "Overdue payments need attention" with the debt-free
  // date months later: the walkthrough's own story quietly degrading the example it was teaching on.
  // Nothing threw, and every assertion above still passed, which is exactly why this one exists.
  const attended = tutorialSandbox();
  const before = selectPaydayGuardian(attended.getState().store)?.state;
  runBeats(attended, TUTORIAL_MAX_CYCLES, 120);
  const after = attended.getState().store;
  eq(before, 'clear', 'the story opens on a clear paycheck');
  assert(
    selectPaydayGuardian(after)?.state !== 'at-risk',
    '…and three scripted paydays never leave the taught plan at risk',
  );
  assert(
    !after.requiredExpenses.some((e) => e.autopayFailedThisCycle),
    '…with nothing left flagged as a failed/unattended obligation',
  );

  console.log(`✅ sandbox beats: ${passed} assertions passed.\n`);
}

run();
