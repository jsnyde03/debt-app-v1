import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { deriveConfidenceContext } from '@/store/guardianPredictionCore';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import {
  personaScenario,
  personalScenario,
  SANDBOX_STATES,
  scenarioFor,
  scenarioForBeat,
  SCENARIO_BASE_DATE,
  type SandboxState,
} from '@/store/sandboxScenarios';
import { TUTORIAL_STEPS } from '@/store/tutorialPath';
import { createSandboxStore, seedSandbox, SANDBOX_MAX_GENUINE_CYCLES } from '@/store/sandboxStore';

/**
 * 3.5.0.3 — the scenario scripts.
 *
 * The load-bearing assertion is that a state NAME matches what the real Guardian engine actually reads
 * off it. A "tight" scenario that the engine calls clear would have the tutorial narrating one thing
 * while the UI shows another — the exact incoherence the Guardian audits kept hunting. So these drive
 * the shipped selectors rather than checking the numbers we just wrote.
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

/** Read a scenario through a real sandbox, exactly as the tutorial will. */
function read(scenario: ReturnType<typeof personaScenario>) {
  const sandbox = createSandboxStore(scenario);
  return { store: sandbox.getState().store, guardian: selectPaydayGuardian(sandbox.getState().store) };
}

/** A user mid-onboarding: a paycheck and one debt is ALL the app has captured by tutorial time. */
function thinUserStore(over: Partial<DebtStore> = {}): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    subscriptionPlan: 'premium',
    paycheck: { ...s.paycheck, amount: '3200', payCycle: 'monthly' },
    debts: [
      { id: 'mine', name: 'My card', balance: 3000, minimumPayment: 90, apr: 19, dueDate: s.paycheck.currentDate, type: 'debt', recurrence: 'monthly' } as DebtStore['debts'][number],
    ],
    ...over,
  };
}

function run() {
  console.log('3.5.0.3 — sandbox scenarios (named states · personal seed · determinism)...');

  // ── Every named state is reachable and READS as its name through the real engine. ─────────────
  const reads: Record<SandboxState, ReturnType<typeof read>> = {
    clear: read(personaScenario('clear')),
    tight: read(personaScenario('tight')),
    'at-risk': read(personaScenario('at-risk')),
  };
  for (const state of SANDBOX_STATES) {
    assert(reads[state].guardian !== null, `${state}: the Guardian produces a real read`);
  }

  const clear = reads.clear.guardian!;
  const tight = reads.tight.guardian!;
  const atRisk = reads['at-risk'].guardian!;

  // The states must be genuinely ordered by how much room the cycle has — that ordering IS the lesson.
  assert(clear.cushion > tight.cushion, 'clear leaves more cushion than tight');
  assert(tight.cushion > atRisk.cushion, 'tight leaves more cushion than at-risk');
  assert((atRisk.shortfall ?? 0) > 0, 'at-risk is genuinely SHORT (a real gap for Recovery to solve)');
  assert(!(clear.shortfall ?? 0), 'clear has no shortfall');
  // The NAME must match what the engine reads, or the tutorial narrates one thing over another.
  // Assert the EXACT band, not "not at-risk". The looser form is what let an earlier version ship a
  // "tight" scenario the engine actually read as `clear` — the tutorial would have narrated one thing
  // while the card it points at said another.
  eq(clear.state, 'clear', 'the clear scenario reads as clear to the real engine');
  eq(tight.state, 'tight', 'the tight scenario reads as TIGHT to the real engine');
  eq(atRisk.state, 'at-risk', 'the at-risk scenario reads as at-risk to the real engine');

  // ── Day-one honesty: authored inside the 3.5.0.2 ceiling, not merely clamped by it. ───────────
  for (const state of SANDBOX_STATES) {
    const s = reads[state].store;
    eq(s.genuineCycleCount, 0, `${state}: authored at zero genuine cycles`);
    eq(s.cycleHistory.length, 0, `${state}: no seeded cycle history`);
    assert(s.genuineCycleCount <= SANDBOX_MAX_GENUINE_CYCLES, `${state}: inside the honesty ceiling`);
    eq(deriveConfidenceContext(s).discoveryHoldbackActive, true, `${state}: the safety net is held (cold-start honest)`);
  }

  // ── The personal seed stands on the user's OWN numbers. ───────────────────────────────────────
  const mine = thinUserStore();
  const personal = read(personalScenario(mine, 'tight'));
  eq(personal.store.paycheck.amount, '3200', 'personal: the user\'s real paycheck carries over');
  eq(personal.store.paycheck.payCycle, 'monthly', "personal: …and their real cadence, not the base default");
  // Monthly on day 1 → the next payday after the frozen 2026-03-02 is Apr 1 (NOT a biweekly +14, and
  // not the same day-of-month as the base date).
  eq(
    personal.store.paycheck.nextPaycheckDate,
    '2026-04-01',
    'personal: next payday is re-derived from THEIR cadence (not the base biweekly)',
  );
  eq(personal.store.debts[0].name, 'My card', 'personal: their real debt carries over');
  assert(personal.store.requiredExpenses.length > 0, 'personal: bills are filled in from the persona (onboarding captures none)');

  // A thin plan is the NORM at tutorial time, so it must still produce a usable read.
  assert(personal.guardian !== null, 'personal: a thin real plan still produces a Guardian read');

  // No debts yet? Still tell a payoff story rather than showing an empty plan.
  const noDebts = read(personalScenario(thinUserStore({ debts: [] }), 'clear'));
  assert(noDebts.store.debts.length > 0, 'personal: with no debts entered, the persona supplies one');

  // No usable income → fall back to the persona outright.
  const noIncome = personalScenario(thinUserStore({ paycheck: { ...createDefaultStore().paycheck, amount: '' } }), 'clear');
  assert(noIncome.id.startsWith('persona-'), 'personal: no usable income falls back to the persona');
  const nanIncome = personalScenario(thinUserStore({ paycheck: { ...createDefaultStore().paycheck, amount: 'abc' } }), 'clear');
  assert(nanIncome.id.startsWith('persona-'), 'personal: a non-numeric income falls back too (no NaN plan)');

  // `scenarioFor` picks for the caller.
  assert(scenarioFor(null, 'clear').id.startsWith('persona-'), 'scenarioFor(null) → persona');
  assert(scenarioFor(mine, 'clear').id.startsWith('personal-'), 'scenarioFor(store) → personal');

  // ── The states hold across real incomes, not just the persona's. ─────────────────────────────
  // The solver calibrates against the live engine, so this is the guard that the calibration works at
  // the extremes: the after-scan found a fixed-cost version where a small paycheck collapsed all three
  // states into one identical read, which would have walked a low earner through three "different"
  // states that were the same screen.
  for (const income of ['900', '2600', '5000']) {
    const user = thinUserStore({ paycheck: { ...createDefaultStore().paycheck, amount: income }, debts: [] });
    const seen = new Set<string>();
    for (const state of SANDBOX_STATES) {
      const g = read(personalScenario(user, state)).guardian;
      eq(g?.state, state, `income ${income}: the ${state} scenario reads as ${state}`);
      seen.add(String(g?.state));
    }
    eq(seen.size, 3, `income ${income}: the three states are genuinely DISTINCT reads`);
  }

  // ── Determinism across every scenario (replay + the tutorial e2e depend on it). ───────────────
  for (const state of SANDBOX_STATES) {
    const a = personaScenario(state);
    const first = JSON.stringify(read(a).store);
    const second = JSON.stringify(read(personaScenario(state)).store);
    assert(first === second, `${state}: two builds are byte-identical (pure)`);
  }
  const replay = createSandboxStore(personaScenario('tight'));
  const opening = JSON.stringify(replay.getState().store);
  replay.getState().setCushionFloor(875);
  seedSandbox(replay, personaScenario('tight'));
  assert(JSON.stringify(replay.getState().store) === opening, 're-seeding a scenario restores it exactly');

  // The frozen base date is shared, so scenarios can be swapped mid-tutorial without the clock jumping.
  for (const state of SANDBOX_STATES) {
    eq(personaScenario(state).baseDate, SCENARIO_BASE_DATE, `${state}: shares the frozen base date`);
  }

  // ── Free vs premium: the demo's free-at-risk contrast needs the tier to be scriptable. ────────
  const free = read(personaScenario('at-risk', { premium: false }));
  eq(free.store.subscriptionPlan, 'free', 'a scenario can be scripted FREE (the demo contrast)');

  // ── 3.5.3.3.2 — beat staging policy ───────────────────────────────────────────────────────────
  // Every beat's declared state has to be one the scenario builder actually knows. A typo here would
  // throw mid-walkthrough, on the user's screen, on whichever beat nobody happened to step through.
  for (const step of TUTORIAL_STEPS) {
    assert(!step.state || SANDBOX_STATES.includes(step.state), `beat "${step.id}" declares a real state`);
  }
  // The arc has to leave trouble behind it: handing a user back to their own money with a red card as
  // the last thing they saw would undo the point of the walkthrough.
  eq(TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].state, 'clear', 'the arc ends on a clear card, not a scary one');
  assert(TUTORIAL_STEPS.some((s) => s.state === 'at-risk'), 'the arc does show trouble somewhere (the Recovery glimpse)');

  const real = createDefaultStore();
  eq(scenarioForBeat(real, undefined), null, 'a beat with no declared state leaves the stage untouched');
  eq(scenarioForBeat(real, 'at-risk')?.label, personaScenario('at-risk').label, 'a declared state stages that state');

  // The pin: a harness-named scenario governs the WHOLE run. Without it, beat 1's `clear` would
  // silently override what a test or a screenshot script asked to see — and it would still LOOK like a
  // working tutorial, which is why this is asserted rather than trusted.
  eq(scenarioForBeat(real, 'clear', { pinned: 'at-risk' })?.id, 'persona-at-risk', 'a harness pin overrides the beat state');
  eq(scenarioForBeat(real, 'at-risk', { pinned: 'clear' })?.id, 'persona-clear', '…in both directions');
  eq(scenarioForBeat(real, undefined, { pinned: 'at-risk' }), null, '…but a stateless beat still stages nothing');

  // Idempotence is what makes Back exact: entering a beat re-seeds rather than mutating forward.
  const s1 = createSandboxStore(scenarioForBeat(real, 'at-risk')!);
  const afterFirst = JSON.stringify(s1.getState().store);
  seedSandbox(s1, scenarioForBeat(real, 'clear')!);
  seedSandbox(s1, scenarioForBeat(real, 'at-risk')!);
  eq(JSON.stringify(s1.getState().store), afterFirst, 'stepping away and back re-stages byte-identical state');

  console.log(`✅ sandbox scenarios: ${passed} assertions passed.\n`);
}

run();
