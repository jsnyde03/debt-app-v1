import { createDefaultStore } from '@/data/defaults';
import { appStore } from '@/store/appStore';
import { coachMarks, resetCoachMarks } from '@/store/coachMarks';

/**
 * 3.5.5.3 — a coach-mark is offered ONCE, and every way that can go wrong is silent.
 *
 * Nobody reports a hint they were never shown, and nobody reports a hint that came back — they just stop
 * reading them. So the refusals are pinned here rather than trusted: the persisted record, the two
 * session fences (walkthrough, demo), and the reset that has to clear BOTH records to work at all.
 *
 * Throw-based (the runner aggregates); run via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function freshStore() {
  appStore.setState({ store: createDefaultStore() });
  coachMarks.setState({ active: null, shown: new Set<string>(), suppressors: 0, hosts: 0 });
}

function run() {
  console.log('\n▶ coach-marks');

  // The default has to be an EMPTY list, not undefined — `show` does an `.includes` on it, and a blob
  // migrated forward without the field would throw on the first mark rather than offer it.
  freshStore();
  assert(Array.isArray(appStore.getState().store.prefs.coachMarksSeen), 'coachMarksSeen defaults to an array');
  assert(appStore.getState().store.prefs.coachMarksSeen.length === 0, '…and it starts empty, so every mark is eligible');

  // ⛔ 4.1.4c — OFFERED IS NOT SHOWN. The record is written when the callout DRAWS, not when `show()`
  // accepts it. This changed: it used to be written inside `show()`, and run 31700074087 measured the
  // cost — the payoff-schedule subject laid out while its sheet was still a full sheet-height below its
  // seated position (y=1702 on a 956pt screen), so the mark was recorded as seen and then drawn
  // off-screen. The user lost that hint permanently, having never seen a pixel of it.
  coachMarks.getState().show('payoff-schedule');
  assert(coachMarks.getState().active === 'payoff-schedule', 'a first offer becomes the active mark');
  assert(
    appStore.getState().store.prefs.coachMarksSeen.length === 0,
    '…and is NOT yet recorded: an offer the layer may fail to draw must stay owed to the user',
  );

  // The layer reports back once it has actually rendered. THAT is what spends the once-ever offer.
  coachMarks.getState().markDrawn('payoff-schedule');
  assert(
    appStore.getState().store.prefs.coachMarksSeen.includes('payoff-schedule'),
    '…and drawing records it immediately, without waiting for a dismissal',
  );
  // Idempotent — the layer re-renders on every host/rect change and must not append a duplicate.
  coachMarks.getState().markDrawn('payoff-schedule');
  assert(
    appStore.getState().store.prefs.coachMarksSeen.filter((m) => m === 'payoff-schedule').length === 1,
    '…once, however many times the layer re-renders',
  );

  // Dismissing does not un-record it: the user has been told.
  coachMarks.getState().dismiss();
  coachMarks.getState().show('payoff-schedule');
  assert(coachMarks.getState().active === null, 'a dismissed mark is not re-offered in the same run');

  // …nor after a relaunch, which is the whole point of persisting it. A fresh session state with the
  // pref intact is exactly what a cold start looks like.
  coachMarks.setState({ shown: new Set<string>(), active: null });
  coachMarks.getState().show('payoff-schedule');
  assert(coachMarks.getState().active === null, 'nor across a relaunch — the persisted list is what makes it once EVER');

  // A DIFFERENT mark is unaffected: the record is per-id, so shipping a new mark later does not require
  // clearing the old ones.
  coachMarks.getState().show('cash-runway-scrub');
  assert(coachMarks.getState().active === 'cash-runway-scrub', 'an unseen mark still fires while another is recorded');

  // The reset has to clear BOTH records. Clearing only the pref leaves the session set swallowing every
  // mark until the app is quit, which reads as a replay entry that does nothing.
  resetCoachMarks();
  assert(appStore.getState().store.prefs.coachMarksSeen.length === 0, 'reset clears the persisted list');
  assert(coachMarks.getState().shown.size === 0, '…and the session set, or the replay silently no-ops');
  coachMarks.getState().show('payoff-schedule');
  assert(coachMarks.getState().active === 'payoff-schedule', '…so a previously-seen mark is offered again after a reset');

  // ── The fences ──────────────────────────────────────────────────────────────────────────────────
  // A BOUNDED RUN (the walkthrough, the demo) declares itself through the same suppressor seam a screen
  // uses for its acks — so this asserts the seam, not each caller. The callers are wired in
  // `tutorialSession.start`/`end` and `demoSession.start`/`end`, which cannot be imported here:
  // `tutorialSession` pulls in `expo-router`, and this runner has no React Native runtime. That
  // limitation is exactly why the fence lives on this seam rather than as a session lookup inside `show`.
  // A run starting while a mark is UP must clear it, not merely block the next one — the mark would
  // otherwise sit over the arc it is supposed to yield to. Found by the tutorial e2e, which failed the
  // moment a Progress mark existed to still be on screen when the walkthrough began.
  freshStore();
  coachMarks.getState().show('trajectory-scrub');
  assert(coachMarks.getState().active === 'trajectory-scrub', 'a mark is up before the run starts');
  const clearing = coachMarks.getState().addSuppressor();
  assert(coachMarks.getState().active === null, '…and starting an interruption dismisses it');
  clearing();

  freshStore();
  const releaseRun = coachMarks.getState().addSuppressor();
  coachMarks.getState().show('payoff-schedule');
  assert(coachMarks.getState().active === null, 'no mark fires while a bounded run is interrupting');
  assert(
    appStore.getState().store.prefs.coachMarksSeen.length === 0,
    '…and a refused mark is NOT recorded, so it is still owed to the user afterwards',
  );
  releaseRun();
  coachMarks.getState().show('payoff-schedule');
  assert(coachMarks.getState().active === 'payoff-schedule', '…and it is offered once the run ends');

  // One at a time (3.5.5.1), re-pinned here because the persistence branch added early returns above it.
  freshStore();
  coachMarks.getState().show('payoff-schedule');
  coachMarks.getState().show('cash-runway-scrub');
  assert(coachMarks.getState().active === 'payoff-schedule', 'a second mark is refused, not queued, while one is up');

  freshStore();
  const release = coachMarks.getState().addSuppressor();
  coachMarks.getState().show('payoff-schedule');
  assert(coachMarks.getState().active === null, 'no mark fires while a screen declares its own interruption');
  release();
  coachMarks.getState().show('payoff-schedule');
  assert(coachMarks.getState().active === 'payoff-schedule', '…and it is offered once that interruption clears');

  freshStore();
  console.log(`✅ coach-marks: ${passed} assertions passed.\n`);
}

run();
