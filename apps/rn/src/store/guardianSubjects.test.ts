import { selectBillsAttestation, selectPaydayGuardian, selectTightTopUp } from '@/store/guardianSelectors';
import { guardianSubjects, GUARDIAN_CARD_SUBJECTS } from '@/store/guardianSubjects';
import { selectRecoveryPlan } from '@/store/recoverySelectors';
import { personaScenario, personalScenario, type SandboxState } from '@/store/sandboxScenarios';
import { createSandboxStore } from '@/store/sandboxStore';
import { TUTORIAL_STEPS } from '@/store/tutorialPath';

/**
 * 3.5.3.9 — THE ARC'S BUILD-TIME INVARIANT.
 *
 * Every beat that coaches a subject must have that subject on screen when its own seeded state is solved
 * by the real Guardian. This is the assertion that replaced the runtime degraded path ([D15]) — the beat
 * used to measure its subject and, on an empty measurement, swap in copy that doesn't ask for the missing
 * control. That made the copy a function of the layout and the layout a function of the copy, which
 * oscillated. Whether a scripted state renders a control is knowable here, without a browser, so it is
 * settled here.
 *
 * The subjects are read through the SAME predicate the card renders from (`guardianSubjects`), not
 * re-derived. Two hand-written lists agreeing with each other proves only that the same person wrote
 * both — an assertion against a copy of the render conditions passes while the render conditions move.
 *
 * ⚠️ If this fails, the fix is the ARC or the SCENARIO — not a runtime fallback. A beat pointing at
 * something its own state doesn't render is a script bug, and the honest repair is to change the script.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

/** The subjects on screen for a beat's seeded state, through the real engine and the real predicate. */
function subjectsForState(state: SandboxState, personal: boolean) {
  // [D9] the sandbox runs premium for EVERY audience — the walkthrough teaches a premium Guardian and
  // the finale settles up about it. So the invariant is checked under the conditions the arc actually
  // runs in, which is the only reading that means anything.
  const base = createSandboxStore(personaScenario('clear', { premium: true }));
  const seeded = personal
    ? // 3.5.3.11 — `personalScenario` seeds the user's REAL debts by name into fabricated states. Same
      // states, different debt set, so the render conditions must hold for both or the invariant only
      // covers the persona the tests happen to use.
      createSandboxStore(personalScenario(base.getState().store, state, { premium: true }))
    : createSandboxStore(personaScenario(state, { premium: true }));
  const store = seeded.getState().store;
  const brief = selectPaydayGuardian(store);
  assert(brief !== null, `[${personal ? 'personal' : 'persona'}/${state}] the Guardian has a brief to render at all`);
  return guardianSubjects({
    isPremium: true,
    state: brief!.state,
    stale: brief!.staleAdvisory === true,
    hasRecovery: !!selectRecoveryPlan(store),
    hasTopUp: !!selectTightTopUp(store),
    attestationShown: !!selectBillsAttestation(store)?.show,
  });
}

function run() {
  console.log('3.5.3.9 — the arc invariant (every beat renders its own subject)...');

  for (const personal of [false, true]) {
    const label = personal ? 'personal' : 'persona';
    for (const step of TUTORIAL_STEPS) {
      if (!step.target) continue; // a whole-screen beat coaches nothing in particular — nothing to prove
      // `guardian-card` is registered by the host around the card; the rest are the card's own. Both are
      // covered by the predicate's inventory.
      const subjects = subjectsForState(step.state ?? 'clear', personal);
      assert(
        subjects.has(step.target),
        `[${label}] beat "${step.id}" (state ${step.state ?? 'clear'}) renders its subject ${step.target}`,
      );
    }
  }

  // The invariant is only meaningful if the predicate can actually say NO — a function returning every id
  // unconditionally would pass every assertion above while proving nothing. These pin the two gates.
  const atRisk = guardianSubjects({
    isPremium: true, state: 'at-risk', stale: false, hasRecovery: true, hasTopUp: false, attestationShown: true,
  });
  assert(!atRisk.has('guardian-adjust'), 'the predicate CAN say no: a shortfall withdraws "adjust your line"');
  assert(!atRisk.has('guardian-reserve'), '…and a built Recovery plan replaces the attestation');
  const free = guardianSubjects({
    isPremium: false, state: 'clear', stale: false, hasRecovery: false, hasTopUp: false, attestationShown: true,
  });
  assert(!free.has('guardian-adjust') && !free.has('guardian-reserve'), '…and a free card offers neither premium control');

  // No beat may coach a subject that isn't a real registered target — the arc and the registry drift
  // apart silently otherwise, and a beat pointing at nothing is invisible until someone runs it.
  //
  // Derived from the predicate's own inventory, not hand-written. A literal list is a second copy of the
  // truth, and this file's whole argument is that the second copy is where the drift lives. `today-ack`
  // is added explicitly because it is the one coached subject the CARD does not own — it renders in
  // Today's ack slot on a runtime event (the reserve release / walkback), which is not a seeded state and
  // so is deliberately outside this invariant's reach. Its coverage is beat 4's e2e.
  const known = new Set<string>([...GUARDIAN_CARD_SUBJECTS, 'today-ack']);
  for (const step of TUTORIAL_STEPS) {
    if (step.target) assert(known.has(step.target), `beat "${step.id}" coaches a known subject`);
    if (step.payoffTarget) assert(known.has(step.payoffTarget), `beat "${step.id}"'s payoff target is known`);
  }

  console.log(`✅ arc invariant: ${passed} assertions passed.\n`);
}

run();
