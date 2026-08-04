import { isSubjectMissing, shouldDegradeToScripted } from './spotlightPolicy';

/**
 * The walkthrough's unmeasurable-subject policy.
 *
 * This exists because the mechanism it covers shipped with NO test at all and immediately produced the
 * only SHOW-STOPPER of the gate: a boolean verdict outlived the beat it belonged to, and since `line`
 * and `reserve` are adjacent interactive beats, one slow measurement on beat 3 deleted beat 4 as well —
 * a beat that was never measured. Assertions here pin the PROPERTY (a verdict belongs to one subject),
 * not any wording or step number.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`❌ ${label}`);
  passed++;
  console.log(`  ✓ ${label}`);
}

export function run() {
  console.log('\n▶ spotlight policy (unmeasurable subject)');

  // ── The cascade. This is the show-stopper, stated directly. ───────────────────────────────────
  assert(
    !isSubjectMissing({ targetId: 'guardian-reserve', unmeasurableFor: 'guardian-adjust' }),
    "a verdict reached for a PREVIOUS beat's subject does not apply to this one",
  );
  assert(
    isSubjectMissing({ targetId: 'guardian-adjust', unmeasurableFor: 'guardian-adjust' }),
    '…and it does apply to the subject it was actually reached for',
  );
  assert(
    !isSubjectMissing({ targetId: 'guardian-adjust', unmeasurableFor: null }),
    'no verdict means no verdict — the not-yet-measured frames every beat opens with are not a failure',
  );
  assert(
    !isSubjectMissing({ targetId: null, unmeasurableFor: 'guardian-adjust' }),
    'a beat with no subject at all cannot have a missing one',
  );

  // ── Degrading, and the two things that must never trigger it. ─────────────────────────────────
  assert(
    shouldDegradeToScripted({ interactive: true, acted: false, targetId: 'guardian-adjust', unmeasurableFor: 'guardian-adjust' }),
    'an interactive beat whose subject is genuinely gone drops its ask',
  );
  assert(
    !shouldDegradeToScripted({ interactive: false, acted: false, targetId: 'guardian-card', unmeasurableFor: 'guardian-card' }),
    'a scripted beat has no ask to drop',
  );
  assert(
    !shouldDegradeToScripted({ interactive: true, acted: true, targetId: 'guardian-adjust', unmeasurableFor: 'guardian-adjust' }),
    'a beat the user has already acted on keeps its ask — their payoff is never taken away',
  );
  assert(
    !shouldDegradeToScripted({ interactive: true, acted: false, targetId: 'guardian-reserve', unmeasurableFor: 'guardian-adjust' }),
    'the cascade again, through the real entry point: beat 4 is not degraded by beat 3 failing',
  );

  console.log(`✅ spotlight policy: ${passed} assertions passed.\n`);
}

run();
