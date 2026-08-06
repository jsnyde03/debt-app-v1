import { createStore } from 'zustand/vanilla';

import { track } from '@/analytics/funnel';

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
  start: () => void;
  end: () => void;
}

export const demoSession = createStore<DemoSessionState>((set, get) => ({
  active: false,
  sandbox: null,
  stage: null,

  start() {
    if (get().active) return; // re-entry is a no-op, not a second sandbox
    // ⚠️ Refuse if a walkthrough owns the shared timer registry. Not reachable through the UI today — the
    // replay link and the invite are both withheld while `isExample` — but `/tutorial` sits inside the
    // block this demo's own route guard opens, so a deep link can reach it.
    if (!claimRun('demo')) return;
    const sandbox = createSandboxStore(demoScenario(DEMO_STAGES[0]));
    set({ active: true, sandbox, stage: DEMO_STAGES[0].id });
    // Scheduled against THIS sandbox: if the demo ends and another starts, the old run's steps must not
    // land on the new one's store.
    playDemoRun(
      sandbox,
      () => demoSession.getState().sandbox === sandbox,
      (s) => {
        set({ stage: s.id });
        track({ name: 'demo_stage', stage: s.id });
        // The last stage IS completion: the run has no further beat to reach, and treating "watched to
        // the end" as a separate later signal would only ever be inferred from an exit that never came.
        if (s.id === DEMO_STAGES[DEMO_STAGES.length - 1].id) track({ name: 'demo_completed' });
      },
    );
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
    set({ active: false, sandbox: null, stage: null });
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
