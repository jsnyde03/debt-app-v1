import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

import { TUTORIAL_MAX_CYCLES } from './sandboxBeats';
import { harnessScenario, publishSandbox, unpublishSandbox } from './sandboxHarness';
import { scenarioFor } from './sandboxScenarios';
import { createSandboxStore, type SandboxStoreInstance } from './sandboxStore';
import type { DebtStore } from '@/data/models';
import type { TutorialRun } from './tutorialSelectors';
import { appStore } from './appStore';
import { resumeIndex } from './tutorialPath';

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
}

interface TutorialSessionState extends TutorialSession {
  start(realStore: DebtStore, run: TutorialRun, startIndex: number): void;
  goTo(index: number): void;
  end(): void;
}

export const tutorialSession = createStore<TutorialSessionState>((set, get) => ({
  active: false,
  run: 'free',
  sandbox: null,
  index: 0,

  start(realStore, run, startIndex) {
    // A test may name the opening state (3.5.0.7); a real user always gets their own scaled scenario.
    const scenario =
      harnessScenario({ maxGenuineCycles: TUTORIAL_MAX_CYCLES }) ??
      scenarioFor(realStore, 'clear', { premium: run === 'premium', maxGenuineCycles: TUTORIAL_MAX_CYCLES });
    const sandbox = createSandboxStore(scenario);
    publishSandbox(sandbox, scenario.id);
    set({ active: true, run, sandbox, index: startIndex });
  },

  goTo(index) {
    if (get().active) set({ index });
  },

  end() {
    unpublishSandbox();
    // Drop the sandbox so it can be collected; a later session builds a fresh, deterministic one.
    set({ active: false, sandbox: null, index: 0 });
  },
}));

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
