import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  isLastStep,
  nextIndex,
  prevIndex,
  resumeIndex,
  stepAnnouncement,
  stepBody,
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
  // 3.5.3.11 — spoken on EVERY beat, in the same slot the dock shows it. The user who can't see the
  // Example chip is the one who most needs telling, and by beat 5 the screen is reciting their real
  // debts inside an invented shortfall.
  for (let s = 0; s < TUTORIAL_STEP_COUNT; s++) {
    assert(stepAnnouncement(s).includes('Example money'), `step ${s + 1} announces that the money is an example`);
  }
  assert(first.includes(TUTORIAL_STEPS[0].title), '…then the step title');
  assert(first.includes(TUTORIAL_STEPS[0].body), '…then the body, so nothing is spoken-only-visually');
  for (let s = 0; s < TUTORIAL_STEP_COUNT; s++) {
    assert(stepAnnouncement(s).length > 0, `step ${s + 1} has a non-empty announcement`);
  }
  eq(stepAnnouncement(99), '', 'an out-of-range step announces nothing rather than throwing');

  // ── 3.5.3.6.2 — the finale differs by AUDIENCE, and VoiceOver must hear the same line. ────────
  // `announceForAccessibility` is a no-op on web, so no e2e can ever check this: if the announcement
  // resolved the body separately from the screen, a free user would be READ the premium line and no
  // test would notice. Pinning it here is the only place it can be pinned.
  const last = TUTORIAL_STEP_COUNT - 1;
  assert(stepBody(TUTORIAL_STEPS[last], 'free') !== stepBody(TUTORIAL_STEPS[last], 'premium'), 'the finale says something different to each audience');
  // These matched the literal phrase "premium is the part", which the [A1/A2] copy fix replaced — so the
  // test failed on a change that made the copy MORE honest, not less. A test that pins wording blocks the
  // wording audit and pins nothing worth pinning. What [D9] actually rests on is the shape below.
  const freeFinale = stepBody(TUTORIAL_STEPS[last], 'free');
  const premiumFinale = stepBody(TUTORIAL_STEPS[last], 'premium');
  assert(/premium/i.test(freeFinale), '…naming, to a FREE user, that premium is what did it ([D9] rests on this)');
  assert(!/premium/i.test(premiumFinale), '…and never selling premium to someone who already pays for it');
  // [A2] and naming ALL THREE premium behaviours the walkthrough demonstrated, not just the holding —
  // a finale that shows three and credits one is the bait-and-switch [D9] has to avoid.
  // ⚠️ [T5.4] This was `/line/i` — and it red on a copy change that made the sentence MORE honest, which
  // is the second time this block has done that (see the comment above about "premium is the part"). The
  // shape [A2] needs is "behaviour 1 is named at all"; the NOUN for that concept has moved twice in this
  // audit alone (floor → line → cushion, T4/L1-14), so pinning one spelling of it pins the vocabulary
  // work, not the claim. Either noun satisfies it.
  assert(/cushion|line/i.test(freeFinale), '…the cushion-holding behaviour is named');
  assert(/learn/i.test(freeFinale), '…the extra held while it learns your bills');
  assert(/catch-up|comes up short/i.test(freeFinale), '…the catch-up plan when a paycheck is short');
  assert(stepAnnouncement(last, 'free').includes(stepBody(TUTORIAL_STEPS[last], 'free')), 'the free announcement carries the free body');
  assert(stepAnnouncement(last, 'premium').includes(stepBody(TUTORIAL_STEPS[last], 'premium')), 'the premium announcement carries the premium body');
  eq(stepBody(TUTORIAL_STEPS[0], 'free'), TUTORIAL_STEPS[0].body, 'a beat with no per-audience copy reads the same to everyone');

  // ── 3.5.3.3.4.1 — the announcement must actually be CALLED, not merely correct. ───────────────
  // This exists because it already went wrong: 3.5.3.1 moved the overlay off the /tutorial route and
  // the announce call went with it. Every assertion above kept passing, because they cover the pure
  // function rather than its wiring — and the failure is invisible to sighted testing and unobservable
  // on web (`announceForAccessibility` is a no-op in react-native-web). So the guard is a source check
  // on the component that renders a beat, in the spirit of the repo's existing `lint:webkit` scan.
  const overlay = readFileSync(join(__dirname, '../components/plan/TutorialOverlay.tsx'), 'utf8');
  assert(/stepAnnouncement\s*\(/.test(overlay), 'TutorialOverlay CALLS stepAnnouncement (a beat with no announcement is silent to VoiceOver)');
  assert(/announce\s*\(/.test(overlay), '…through `announce`, so the utterance actually reaches the platform');

  console.log(`✅ tutorial path: ${passed} assertions passed.\n`);
}

run();
