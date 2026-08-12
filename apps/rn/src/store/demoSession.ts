import { createStore } from 'zustand/vanilla';

import { track } from '@/analytics/funnel';

import { coachMarks } from './coachMarks';
import { DEMO_STAGES, demoScenario, playDemoRun } from './demoRun';
import { claimRun, clearStoryTimers, releaseRun } from './sandboxRun';
import { createSandboxStore, type SandboxStoreInstance } from './sandboxStore';

/**
 * 3.5.4 — the bounded demo's session.
 *
 * The same shape as `tutorialSession` and deliberately much smaller: the demo has no beats, no resume
 * position and no real-store bookkeeping, because [D18] made it a KIOSK — it owns the screen for its whole
 * length and both exits end it. What it shares with the walkthrough is the part that matters: an ephemeral
 * sandbox store, and an `active` flag the containment fences read through `useInBoundedRun`.
 *
 * **The persona, not the user's own numbers.** `personalScenario` seeds real debts by name and balance,
 * which is right for a walkthrough — the user is being taught about *their* plan. The demo's audience is
 * pre-purchase and frequently has no data at all, so there is nothing to personalise and a stand-in is
 * both honest and the only thing that works. It is also what makes the run identical on every device,
 * which is what the App-Preview capture (3.5.8) needs.
 *
 * Nothing here is persisted. `createSandboxStore` neuters hydrate/save and the sync seams refuse on
 * `isSandboxStore`, so a demo cannot touch the user's plan, their widgets, or their Live Activity.
 */
interface DemoSessionState {
  active: boolean;
  sandbox: SandboxStoreInstance | null;
  /** Which scripted stage is showing — for chrome (3.5.4.7) and for the capture to key its pacing on. */
  stage: string | null;
  /**
   * Whether the demo's own chrome renders. FALSE for the App-Preview capture.
   *
   * The dock exists to give a viewer a way out, and a capture has no viewer — meanwhile it covered the
   * payoff trajectory on the Progress beat and cut the Guardian card in half on the closing one, which
   * are two of the five frames the video is for. Kept as a flag rather than deleted because 3.5.7's
   * marketing embed does have a viewer, and will want it.
   */
  chrome: boolean;
  /**
   * 3.5.8.9 — the pending clock start, or null once it has run (or was never held).
   *
   * Non-null means the opening state is on screen and the script's timers have NOT begun. Only a capture
   * build holds it, and only `CaptureSlate` releases it — after the route has actually painted, which is
   * the guarantee cycle 8 proved the mount-time clock could not give.
   */
  startClock: (() => void) | null;
  /**
   * 3.5.10 — what this run IS.
   *
   * `'scripted'` drives itself through `DEMO_STAGES` on timers and holds the tabs: it is the App-Preview
   * vehicle and 3.5.7's embed, where the viewer watches. `'explore'` seeds the same persona money and then
   * gets out of the way: no script, no director, tabs live, the user drives.
   *
   * ⚠️ The two are not variations on a theme — they answer different questions. A 25-second video needs a
   * script; a person deciding whether to trust the app with their money needs to be able to poke at it.
   * One artifact was doing both jobs and the video's requirements won, because they came first.
   */
  mode: 'scripted' | 'explore';
  start: (opts?: { chrome?: boolean; holdClock?: boolean; mode?: 'scripted' | 'explore' }) => void;
  /** Begin the script's clock. Idempotent, and a no-op when nothing was held. */
  releaseClock: () => void;
  end: () => void;
}

/** 3.5.5.3 — releases this run's coach-mark suppression; see `start`. Module-scope because a run is a
 *  singleton (`claimRun`) and `end()` must release what `start()` took. */
let releaseCoachMarks: (() => void) | null = null;

export const demoSession = createStore<DemoSessionState>((set, get) => ({
  active: false,
  sandbox: null,
  stage: null,
  chrome: true,
  mode: 'scripted',
  startClock: null,

  start(opts) {
    if (get().active) return; // re-entry is a no-op, not a second sandbox
    // ⚠️ Refuse if a walkthrough owns the shared timer registry. Not reachable through the UI today — the
    // replay link and the invite are both withheld while `isExample` — but `/tutorial` sits inside the
    // block this demo's own route guard opens, so a deep link can reach it.
    if (!claimRun('demo')) return;
    // 3.5.5.3 — declare the run an interruption, on the same seam a screen uses for its acks. A demo is a
    // SANDBOX and a coach-mark records itself to the REAL store, which `useNoRealWritesGuard` would
    // rightly call a bug; it is also the App-Preview capture vehicle, so an unguarded mark would appear
    // in the store video on the next re-shoot.
    releaseCoachMarks = coachMarks.getState().addSuppressor('demo-run');
    const sandbox = createSandboxStore(demoScenario(DEMO_STAGES[0]));
    const hold = opts?.holdClock === true;
    const mode = opts?.mode ?? 'scripted';
    set({ active: true, sandbox, stage: DEMO_STAGES[0].id, chrome: opts?.chrome !== false, startClock: null, mode });

    // 3.5.10 — EXPLORE stops here. The sandbox is seeded with the same persona money the script opens on,
    // and then nothing drives it: no timers, no `DemoDirector` navigation, no stage changes. Returning
    // before `playDemoRun` is what makes that true — a mode flag checked inside the run would leave the
    // timers scheduled and merely ignored, which is the shape that strands a run when one of them fires.
    if (mode === 'explore') return;
    // Scheduled against THIS sandbox: if the demo ends and another starts, the old run's steps must not
    // land on the new one's store.
    //
    // ⚠️ Called AFTER the `set` above, not before, and the ordering is the one this file already argues
    // for: `playDemoRun` applies stage 0 synchronously, which fires `onStage` — and that must not land
    // while `active` is still false. `startClock` is set in a second `set` below because it is the one
    // field that cannot be known until this call returns; a frame where the run is live and the clock is
    // merely not-yet-holdable is inert (the slate simply has not been offered its cue), which is not true
    // of `active`/`sandbox`.
    const startClock = playDemoRun(
      sandbox,
      () => demoSession.getState().sandbox === sandbox,
      (s) => {
        set({ stage: s.id });
        track({ name: 'demo_stage', stage: s.id });
        // The last stage IS completion: the run has no further beat to reach, and treating "watched to
        // the end" as a separate later signal would only ever be inferred from an exit that never came.
        if (s.id === DEMO_STAGES[DEMO_STAGES.length - 1].id) track({ name: 'demo_completed' });
      },
      { holdClock: hold },
    );
    if (hold) set({ startClock });
  },

  releaseClock() {
    const start = get().startClock;
    if (!start) return;
    set({ startClock: null });
    start();
  },

  /**
   * ONE `set` for both fields. Round 8's lens C verified this shape on `tutorialSession` and the reason
   * is load-bearing: `active` gates the fences and `sandbox` supplies the money, so a frame in which one
   * is true without the other is a frame showing sandbox figures on an unfenced screen, or a fenced
   * screen with the user's real plan behind it. Neither is allowed to be reachable, even for a tick.
   */
  end() {
    // Cancel the script BEFORE clearing the session, so no scheduled stage can observe a half-torn-down
    // run. The staleness guard would refuse it anyway; this makes the ordering the reason rather than the
    // backstop.
    clearStoryTimers();
    releaseRun('demo');
    releaseCoachMarks?.();
    releaseCoachMarks = null;
    // `startClock` is cleared here too: a held clock outliving its session would be a starter that
    // schedules a whole script over a sandbox that no longer exists. Its own staleness guard refuses that
    // anyway — this makes the teardown the reason rather than the backstop, exactly as the ordering above.
    set({ active: false, sandbox: null, stage: null, chrome: true, startClock: null, mode: 'scripted' });
  },
}));

/**
 * [D18] — the exits are TERMINAL: `end()` FIRST, then navigate. The destination must never be reached
 * with the sandbox still mounted, because `/paywall` writes the real store by design
 * (`setSubscriptionPlan`) and `useNoRealWritesGuard` is deliberately strict for both bounded runs.
 * Reverse the order and every purchase is reported as a sandbox leak.
 *
 * ⚠️ Lives in its own module (`demoExit`) rather than here, because `expo-router` pulls in react-native
 * and this file is dependency-free on purpose — that is what lets the headless suite assert its
 * invariants at all.
 */
