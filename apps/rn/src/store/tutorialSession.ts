import { router } from 'expo-router';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

import { runBeats, scriptSurprise, TUTORIAL_MAX_CYCLES } from './sandboxBeats';
import { harnessScenario, publishSandbox, unpublishSandbox } from './sandboxHarness';
import { selectPaydayGuardian } from './guardianSelectors';
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
 * active, wraps its content in `StoreProvider(sandbox)`. `/tutorial` becomes the launcher (and the
 * deep-link/e2e entry) rather than the host.
 *
 * ⚠️ Today does NOT mount the overlay — this said it did, and stopped being true at 3.5.3.5.7, when the
 * coaching layer was hoisted to the ROOT layout so its scrim could cover the iPad sidebar rail. Today
 * now only publishes geometry up through `TutorialShell`. The files that moved were all updated; this
 * one merely described them, which is how the claim survived.
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
  /** 3.5.3.5 — play the scripted reserve story after the user confirms their bills. */
  playReserveStory(): void;
  /** …and stop it if they take the confirmation back before it has played out. */
  cancelReserveStory(): void;
}

/**
 * 3.5.3.3.2 — what a session needs in order to re-stage itself, held outside the store because none of
 * it is rendered: the user's real plan (every scripted state is scaled from THEIR paycheck, so it has
 * to survive `start`, which previously used it and dropped it), and the harness pin.
 */
let staging: { realStore: DebtStore; opts: { premium: boolean; maxGenuineCycles: number }; pinned: SandboxState | null } | null = null;

/**
 * 3.5.3.5 — pending timers for the scripted reserve story. Held module-level and cleared by every route
 * that invalidates the story: a beat change, `end()`, `cancelReserveStory()` (the user un-attests), and
 * the top of `playReserveStory()` itself (a re-attest restarts rather than overlapping). A user who
 * skips out mid-story would otherwise have rollovers land on a sandbox that is no longer on screen — or,
 * worse, on the NEXT session's sandbox.
 */
let storyTimers: ReturnType<typeof setTimeout>[] = [];
function clearStoryTimers() {
  storyTimers.forEach(clearTimeout);
  storyTimers = [];
}

export const tutorialSession = createStore<TutorialSessionState>((set, get) => ({
  active: false,
  run: 'free',
  sandbox: null,
  index: 0,
  floorBefore: null,

  start(realStore, run, startIndex) {
    // [D9] (Jason 2026-07-31) — the SANDBOX runs premium for every audience, whatever the user's own
    // tier. It used to mirror them (`run === 'premium'`), and verification showed what that cost: a free
    // Guardian is never held to its floor and its cold-start hedges are premium-only by design, so a free
    // walkthrough had a line that did nothing when dragged (beat 3), no safety net to point at (beat 4)
    // and no reserve to absorb a surprise (beat 5) — three of seven beats teaching nothing, over copy
    // that said otherwise.
    //
    // This is what E1 always described: the walkthrough shows what the Guardian DOES, and the hand-back
    // to the user's own card is the conversion moment ("free lands on the real free card + invite = the
    // app's best paywall"). `run` still carries the audience — it drives `tutorialSeen` and is the
    // finale's input for naming what changes.
    //
    // ⚠️ The honesty of this rests ENTIRELY on two things: the persistent "Example" marker, and 3.5.3.6
    // saying plainly that premium is what did the holding. Without the second, this becomes exactly the
    // thing the standing rule forbids — dressing free as premium.
    const opts = { premium: true, maxGenuineCycles: TUTORIAL_MAX_CYCLES };
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
    // A story still mid-flight belongs to the beat being left — let it land on the next one and the
    // user sees rollovers they didn't ask for, on a card that's now talking about something else.
    clearStoryTimers();
    stageBeat(index);
    // The payoff belongs to the beat that produced it — carrying it forward would show a stale "before".
    set({ index, floorBefore: null });
  },

  noteFloorBefore(before) {
    if (get().active) set({ floorBefore: before });
  },

  /**
   * 3.5.3.5 — the reserve story, played AFTER the user's own tap ([D10]).
   *
   * Three moments, spaced so they read as a sequence rather than a jump-cut: the net has just shrunk
   * because they confirmed their bills → a surprise lands and the net absorbs it → three paydays roll
   * and the net retires, releasing what's left to the debt. Every one of those is the REAL engine:
   * `recordSurpriseOutflow` is the same producer the payday check-in calls, and the release is written
   * by `applyRollover`, not by this function. That matters — the closing ack a user sees here is the
   * genuine one, so it can never drift from what the app would actually say on their third payday.
   *
   * `DISCOVERY_CYCLES` is 3, which is why it rolls three times and not once: the reserve retires when
   * the discovery window closes, and a single rollover would leave the beat promising a release that
   * never arrives.
   */
  playReserveStory() {
    const { active, sandbox } = get();
    if (!active || !sandbox) return;
    clearStoryTimers();

    // Sized from the net itself so it is always absorbable, whatever the user's paycheck scaled it to —
    // a surprise that overflowed the net would teach the opposite of this beat's point.
    //
    // [E6] …which is what the code claimed and did not do. It was `max(25, round((held || 100) * 0.8))`,
    // and BOTH halves of that broke the invariant at the small end: the $25 floor exceeds any net under
    // ~$31, and the `|| 100` fallback scripted an $80 surprise against a net of ZERO. The sandbox scales
    // from the user's own pay, so a low-income plan lands exactly there — and it fails silently and
    // convincingly, because the beat still plays; it just shows the net being overrun in the one beat
    // whose whole point is that the net holds. `min` is the guarantee the comment was always asserting.
    const held = selectPaydayGuardian(sandbox.getState().store)?.heldReserve ?? 0;
    const amount = Math.min(held, Math.max(25, Math.round(held * 0.8)));

    storyTimers.push(
      // The surprise lands first, on its own, so the user sees the net absorb it before anything else
      // moves. `scriptSurprise` is the same producer the payday check-in uses.
      //
      // With no net held there is nothing to absorb anything, so the surprise is SKIPPED rather than
      // scaled to zero — but the rollovers below still run, so the beat degrades to the release story
      // instead of going inert.
      setTimeout(() => {
        if (amount > 0 && tutorialSession.getState().sandbox === sandbox) scriptSurprise(sandbox, amount);
      }, 900),
      // …then three paydays close properly — each one CHECKED IN and rolled (3.5.3.5.6), which is what
      // stops the story from leaving the taught plan in arrears.
      setTimeout(() => {
        if (tutorialSession.getState().sandbox === sandbox) runBeats(sandbox, TUTORIAL_MAX_CYCLES);
      }, 2100),
    );
  },

  /**
   * The user took their confirmation back. Nothing scripted should follow.
   *
   * The story is a consequence of an action, and the timers ran on regardless of whether that action
   * still stood: tap "my bills are all in", tap **Undo** within 900ms, and the surprise still landed, the
   * walkback ack still announced that the Guardian had "restored your safety net" — restoring what the
   * user had already restored themselves — and three paydays still rolled. The beat's whole payoff
   * narrated over the top of the user's most recent decision, which is the opposite of the thing this
   * beat exists to say. Timers were cleared on `goTo`/`end`/replay but not on the one input that
   * actually contradicts them.
   */
  cancelReserveStory() {
    clearStoryTimers();
  },

  end() {
    unpublishSandbox();
    clearStoryTimers();
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
 * The two IN-APP entry points call this DIRECTLY rather than routing to `/tutorial`: the Guardian card's
 * replay link and the More row. (The third entry, a deep link, does NOT come through here — it hits the
 * `/tutorial` route, which starts the session itself. Round 5 relocated this rationale from that file to
 * this one as "still true"; it is true of the two callers here, and the member it named that made the
 * stack-depth problem interesting is the one that never arrives here. Neither file sees all three.)
 *
 * The indirection cost real time: the launcher had to hand off to the Today tab from different stack
 * depths — the Guardian card is on Today, the More row is its own Stack route — and every router verb
 * failed a different one: `replace` re-mounted the tab group into two Todays, `back`/`dismissAll` landed
 * wherever the caller happened to be. Since the session is global state, the caller can simply start it
 * and let Today render the overlay when it's on screen.
 */
export function startTutorial(run: TutorialRun, opts: { resume?: boolean } = {}): void {
  const real = appStore.getState().store;
  // RESUMING and REPLAYING are different intentions, and collapsing them broke the replay entries.
  //
  // Every exit that isn't Skip or Finish — a force-quit, a crash, iOS evicting the app overnight —
  // leaves `prefs.tutorialStep` set, because `leave()` is the only EXIT that clears it (this function
  // now clears it too, on an explicit replay — see below). This function always started at
  // that index, so "How this works" on the Guardian card (whose own hint promises it *replays* the
  // walkthrough) and the More row could drop the user onto **step 5 of 7** — the deliberately at-risk
  // beat, a "won't cover everything" shortfall scaled from their real paycheck and listing their real
  // debts — with none of beats 1–4's framing that any of it is an example. The app opening its own
  // explainer on a fabricated crisis is the single worst thing this feature could do to trust.
  //
  // So the caller says which it means. Resume stays the DEFAULT, because the invitation legitimately
  // picks up an interrupted first run; the explicit replay affordances opt out.
  const from = opts.resume === false ? 0 : resumeIndex(real.prefs.tutorialStep);
  // …and CLEAR the stale step, not just start past it. Starting at 0 left `prefs.tutorialStep` pointing
  // at the abandoned beat, so the original bug survived one exit away: replay from the card → quit on
  // beat 1 without pressing Next (which is what writes the pref) → the next invitation resumes onto the
  // at-risk beat 5 they were never on. Fixing where the session STARTS without fixing what the store
  // REMEMBERS just moved the trap one step further out.
  if (opts.resume === false) appStore.getState().updatePrefs({ tutorialStep: null });
  tutorialSession.getState().start(real, run, from);
  // 3.5.3.5.7 — land on Today, here rather than at each call site. Every caller happened to do this
  // already (the More row navigated after starting), but that was an invariant held by convention: once
  // the overlay mounts above the NAVIGATOR it renders whatever tab you are on, so a future entry point
  // that forgot would coach the user over Money. Same lesson as the dropped announce — put the
  // behaviour where it cannot be left out.
  router.navigate('/');
}
