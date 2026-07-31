import {
  isLastStep,
  nextIndex,
  prevIndex,
  resumeIndex,
  stepAnnouncement,
  TUTORIAL_STEPS,
  TUTORIAL_STEP_COUNT,
} from '@/store/tutorialPath';

/**
 * 3.5.2 — the tutorial path.
 *
 * The failure modes worth pinning are the ones that trap a user: an index that runs off the end, a
 * resume point that points at a step which no longer exists, or a step with nothing to announce. Each
 * of those is silent — the screen just sits there — and each is far likelier to strand a VoiceOver user
 * than a sighted one, since they have no visual cue that anything is wrong.
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

function run() {
  console.log('3.5.2 — tutorial path (stepping · skip · interrupt-resume · announcements)...');

  // ── The arc itself. ───────────────────────────────────────────────────────────────────────────
  assert(TUTORIAL_STEP_COUNT > 0, 'the arc has steps');
  assert(TUTORIAL_STEP_COUNT <= 7, 'the arc stays within its ≤7-beat budget');
  eq(new Set(TUTORIAL_STEPS.map((s) => s.id)).size, TUTORIAL_STEP_COUNT, 'every step id is unique (resume keys off it)');
  assert(TUTORIAL_STEPS.every((s) => s.title && s.body), 'every step has a title AND body (nothing renders blank)');

  // ── Stepping can't run off either end. ────────────────────────────────────────────────────────
  eq(prevIndex(0), 0, 'Back on the first step stays put (never negative)');
  eq(nextIndex(TUTORIAL_STEP_COUNT - 1), TUTORIAL_STEP_COUNT - 1, 'Next on the last step stays put (never past the end)');
  eq(nextIndex(0), 1, 'Next advances');
  eq(prevIndex(3), 2, 'Back retreats');
  eq(isLastStep(TUTORIAL_STEP_COUNT - 1), true, 'the last step is recognised (so it shows Finish, not Next)');
  eq(isLastStep(0), false, 'the first step is not the last');

  // Walking the whole arc forward terminates — a step you can't advance past is a trap.
  let i = 0;
  for (let guard = 0; guard < 50 && !isLastStep(i); guard++) i = nextIndex(i);
  eq(i, TUTORIAL_STEP_COUNT - 1, 'stepping forward reaches the final beat (no unreachable step)');

  // ── Interrupt-resume. ─────────────────────────────────────────────────────────────────────────
  eq(resumeIndex(null), 0, 'no saved point → start at the beginning');
  eq(resumeIndex(undefined), 0, 'undefined → start at the beginning');
  eq(resumeIndex(2), 2, 'a valid saved point resumes exactly there');
  eq(resumeIndex(TUTORIAL_STEP_COUNT - 1), TUTORIAL_STEP_COUNT - 1, 'resuming ON the last step is allowed');
  // The one that bites later: a future version shortens the arc and a stale pref points past the end.
  eq(resumeIndex(TUTORIAL_STEP_COUNT), 0, 'a saved point past the end restarts rather than dead-ending');
  eq(resumeIndex(999), 0, '…however far past');
  eq(resumeIndex(-3), 0, 'a negative saved point restarts');
  eq(resumeIndex(NaN), 0, 'a corrupt (NaN) saved point restarts');
  eq(resumeIndex(2.7), 2, 'a fractional saved point floors to a real step');

  // ── Announcements: the step change is motion-only, so this IS the signal. ─────────────────────
  const first = stepAnnouncement(0);
  assert(first.startsWith('Step 1 of '), 'the announcement leads with POSITION (no progress dots to glance at)');
  assert(first.includes(TUTORIAL_STEPS[0].title), '…then the step title');
  assert(first.includes(TUTORIAL_STEPS[0].body), '…then the body, so nothing is spoken-only-visually');
  for (let s = 0; s < TUTORIAL_STEP_COUNT; s++) {
    assert(stepAnnouncement(s).length > 0, `step ${s + 1} has a non-empty announcement`);
  }
  eq(stepAnnouncement(99), '', 'an out-of-range step announces nothing rather than throwing');

  console.log(`✅ tutorial path: ${passed} assertions passed.\n`);
}

run();
