import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

import { TUTORIAL_MAX_CYCLES } from './sandboxBeats';
import { harnessScenario, publishSandbox, unpublishSandbox } from './sandboxHarness';
import { SANDBOX_STATES, scenarioForBeat, type SandboxState } from './sandboxScenarios';
import { createSandboxStore, seedSandbox, type SandboxStoreInstance } from './sandboxStore';
import type { DebtStore } from '@/data/models';
import type { TutorialRun } from './tutorialSelectors';
import { appStore } from './appStore';
import { resumeIndex, TUTORIAL_STEPS } from './tutorialPath';

/**
 * 3.5.3.1 — the live tutorial SESSION.
 *
 * The walkthrough runs **over the real Today tab**, not in a screen of its own. That's forced, not
 * stylistic: `useGoToTab` calls `useNavigation()` and only behaves inside the TABS navigator — from a
 * Stack route it resolves up through the root and lands as a detached tab group, which is a blank
 * screen on device (the hook's own doc cites Freedom RN lesson #7). Hosting a copy of Today inside the
 * `/tutorial` route would have shipped that failure straight into the tutorial.
 *
 * So the session lives here, outside React: the Today route wrapper subscribes and, while a session is
 * active, wraps its content in `StoreProvider(sandbox)` and mounts the overlay. `/tutorial` becomes the
 * launcher (and the deep-link/e2e entry) rather than the host.
 *
 * Its own tiny store rather than a field on `appStore`: a tutorial session is transient UI state, and
 * putting it in the persisted blob would mean a migration plus the risk of a half-finished walkthrough
 * being restored on a later launch.
 */

export interface TutorialSession {
  active: boolean;
  run: TutorialRun;
  /** The ephemeral store every coached surface reads and writes while the session runs. */
  sandbox: SandboxStoreInstance | null;
  /** Which beat is showing (index into `TUTORIAL_STEPS`). */
  index: number;
  /**
   * 3.5.3.4.4 — what the plan looked like immediately BEFORE the user moved their line, so the payoff
   * can show the change rather than just the result. Captured at the moment of the write because by the
   * time anything renders, the "before" is gone — the store has already re-solved.
   */
  floorBefore: { cushion: number; floor: number } | null;
}

interface TutorialSessionState extends TutorialSession {
  start(realStore: DebtStore, run: TutorialRun, startIndex: number): void;
  goTo(index: number): void;
  end(): void;
  /** Record the pre-change read so the impact payoff has a "before" to show. */
  noteFloorBefore(before: { cushion: number; floor: number }): void;
}

/**
 * 3.5.3.3.2 — what a session needs in order to re-stage itself, held outside the store because none of
 * it is rendered: the user's real plan (every scripted state is scaled from THEIR paycheck, so it has
 * to survive `start`, which previously used it and dropped it), and the harness pin.
 */
let staging: { realStore: DebtStore; opts: { premium: boolean; maxGenuineCycles: number }; pinned: SandboxState | null } | null = null;

export const tutorialSession = createStore<TutorialSessionState>((set, get) => ({
  active: false,
  run: 'free',
  sandbox: null,
  index: 0,
  floorBefore: null,

  start(realStore, run, startIndex) {
    const opts = { premium: run === 'premium', maxGenuineCycles: TUTORIAL_MAX_CYCLES };
    // A test may name the opening state (3.5.0.7); a real user always gets their own scaled scenario.
    // When it IS named, it pins every later beat too — see `scenarioForBeat`.
    const pinnedScenario = harnessScenario(opts);
    const pinned = (pinnedScenario ? harnessState(pinnedScenario.id) : null) ?? null;
    staging = { realStore, opts, pinned };

    // Opening through the SAME policy `stageBeat` uses, not a parallel copy of it. The after-scan
    // caught the divergence: a user who interrupt-RESUMES at beat 5 enters through here, while a user
    // who STEPS to beat 5 enters through `goTo` — two code paths for one question ("what state is
    // beat 5?") is exactly how those two users end up looking at different cards.
    // The `?? clear` is the one honest difference: a sandbox has to be created from something, whereas
    // stepping onto a stateless beat correctly leaves the stage as it found it.
    const opening =
      scenarioForBeat(realStore, TUTORIAL_STEPS[startIndex]?.state, { ...opts, pinned }) ??
      scenarioForBeat(realStore, 'clear', { ...opts, pinned })!;
    const sandbox = createSandboxStore(opening);
    publishSandbox(sandbox, opening.id);
    set({ active: true, run, sandbox, index: startIndex, floorBefore: null });
  },

  goTo(index) {
    if (!get().active) return;
    stageBeat(index);
    // The payoff belongs to the beat that produced it — carrying it forward would show a stale "before".
    set({ index, floorBefore: null });
  },

  noteFloorBefore(before) {
    if (get().active) set({ floorBefore: before });
  },

  end() {
    unpublishSandbox();
    staging = null;
    // Drop the sandbox so it can be collected; a later session builds a fresh, deterministic one.
    set({ active: false, sandbox: null, index: 0, floorBefore: null });
  },
}));

/** Recover the state a harness scenario id names (`persona-at-risk` → `at-risk`). */
function harnessState(id: string): SandboxState | null {
  const state = id.replace(/^persona-/, '') as SandboxState;
  return SANDBOX_STATES.includes(state) ? state : null;
}

/**
 * 3.5.3.3.2 — put the sandbox into the state the beat NARRATES.
 *
 * Re-seeding rather than mutating forward is what makes stepping reversible: `build` is pure and the
 * clock is frozen, so entering beat 5 always produces byte-identical state whether you arrived from
 * beat 4 or stepped back from beat 6. Nothing accumulates, so no beat can inherit a mess.
 *
 * Re-publishing the harness view is not incidental: `publishSandbox` captures the scenario id in a
 * closure, so without this the snapshot would keep reporting the OPENING scenario for the rest of the
 * run — a test asserting "the card is at-risk on this beat" would read a stale id and pass on the wrong
 * evidence. (Found in this leaf's before-scan.)
 */
function stageBeat(index: number): void {
  const { sandbox } = tutorialSession.getState();
  if (!sandbox || !staging) return;
  const scenario = scenarioForBeat(staging.realStore, TUTORIAL_STEPS[index]?.state, { ...staging.opts, pinned: staging.pinned });
  if (!scenario) return; // a beat with no declared state leaves the stage exactly as it found it
  seedSandbox(sandbox, scenario);
  publishSandbox(sandbox, scenario.id);
}

/** React binding for the session. */
export function useTutorialSession<T>(selector: (s: TutorialSessionState) => T): T {
  return useStore(tutorialSession, selector);
}

/**
 * Start a walkthrough from anywhere in the app.
 *
 * In-app entry points call this DIRECTLY rather than routing to `/tutorial`. That indirection cost real
 * time: the launcher had to hand off to the Today tab from three different stack depths (the Guardian
 * card is on Today, the More row is its own Stack route, a deep link has none), and every router verb
 * failed a different one — `replace` re-mounted the tab group into two Todays, `back`/`dismissAll`
 * landed wherever the caller happened to be. Since the session is global state, the caller can simply
 * start it and let Today render the overlay when it's on screen. The route survives for deep links only.
 */
export function startTutorial(run: TutorialRun): void {
  const real = appStore.getState().store;
  tutorialSession.getState().start(real, run, resumeIndex(real.prefs.tutorialStep));
}
