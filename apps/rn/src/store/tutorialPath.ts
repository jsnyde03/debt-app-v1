import type { SandboxState } from './sandboxScenarios';

/**
 * 3.5.2 — the tutorial PATH: step sequencing, skip, and interrupt-resume, as pure logic.
 *
 * Deliberately content-agnostic. The beats themselves are 3.5.3's — this owns only "where am I, how do
 * I move, and where do I come back to". Keeping it pure means the whole path is testable without
 * rendering anything, which matters because the failure mode here is a step you can't leave or can't
 * reach, and that's exactly what a render test tends to miss.
 */

export interface TutorialStepDef {
  /** Stable id — used for resume and as the e2e's handle on a step. */
  id: string;
  /** Shown as a heading AND announced on entry (screen-reader users get the same signal sighted ones do). */
  title: string;
  /** One line of body copy. */
  body: string;
  /**
   * 3.5.3.3.1 — the registered subject this beat coaches (see `tutorialTargets`). Omitted for a beat
   * that addresses the whole screen; the overlay then falls back to an uncut scrim rather than
   * spotlighting something arbitrary.
   */
  target?: string;
  /**
   * 3.5.3.3.2 — the Guardian state this beat NARRATES. Entering the beat re-seeds the sandbox to it,
   * which is what lets one arc show a clear paycheck, then a short one, then a clear one again without
   * the user having to produce those states themselves.
   *
   * Declared per beat rather than accumulated, so entering a beat is idempotent: stepping Back and
   * forward lands on byte-identical state, and a beat can never inherit a mess left by the one before.
   * (The trade, accepted: a change the user made on an interactive beat doesn't survive stepping away
   * and returning — each beat is a fresh scripted stage.)
   */
  state?: SandboxState;
  /**
   * 3.5.3.4.2 — guidance to carry into a modal this beat sends the user into. Declared here so the
   * walkthrough's copy stays in one file rather than being smuggled into the component that happens to
   * present the sheet.
   */
  coach?: string;
}

/**
 * 3.5.3.3.3 — the arc's copy.
 *
 * Two rules it is written to, both learned the hard way in this phase:
 *
 *  1. **Every line must be true of what is actually on the screen behind it.** The placeholder copy
 *     promised "what to cover first, and what can safely wait" over a card reading "Nothing here can
 *     safely wait this paycheck" — the scenario had no deferrable bill. Copy that describes a screen it
 *     doesn't match teaches the user to distrust the screen.
 *  2. **True on BOTH tiers.** The Recovery section is premium-gated, so a free user on the Recovery beat
 *     sees the honest shortfall read and an invitation, not a built plan. So the beat promises what the
 *     GUARDIAN does ("it works out what can wait"), never what the user is about to see rendered.
 *
 * Deliberately not word-perfect: the whole-app wording/voice audit polishes every string in one pass
 * ([[don't over-lock wording mid-build]]). These are solid, professional, and honest — that's the bar here.
 */
export const TUTORIAL_STEPS: TutorialStepDef[] = [
  // Opens on the card itself rather than on a claim about it — the first thing to establish is that
  // this number is decided BEFORE payoff, which is the one genuinely unfamiliar idea in the app.
  { id: 'intro', title: 'Money set aside first', body: 'Every payday, your Guardian keeps a cushion back before anything extra goes to your debt.', target: 'guardian-card', state: 'clear' },
  { id: 'bar', title: 'Where this paycheck went', body: 'The bar is the whole paycheck: what stayed as your cushion, and what went to debt.', target: 'guardian-bar', state: 'clear' },
  // "Your line" is the app's own term for the floor, so the beat teaches the word as well as the control.
  // Interactive. Spotlights the CONTROL, not the readout — on a beat where the user has to do something,
  // pointing at the number tells them where to look but not what to do.
  {
    id: 'line',
    title: 'Your line',
    body: 'This is the least you want to keep. Open it and move the line — the whole plan re-solves around it.',
    target: 'guardian-adjust',
    state: 'clear',
    coach: 'Drag the line, then Save — your plan re-solves around it.',
  },
  // Interactive ([D10]). A surprise is an EVENT, not a control — the real app records one at the payday
  // check-in — so the thing the user DOES here is the real Guardian control that changes the reserve:
  // confirming their bills. The surprise, the absorb and the release then play as the scripted payoff.
  {
    id: 'reserve',
    title: 'A little extra, at first',
    body: 'While your Guardian is learning your bills it holds a bit more back. Tell it your bills are all in and it holds less — then watch what that net is for.',
    target: 'guardian-reserve',
    state: 'clear',
  },
  // The one beat that deliberately puts the card into trouble — the Recovery glimpse. It's also the
  // beat the Example marker was built for: a real-looking shortfall, on figures scaled from their pay.
  // Says what the GUARDIAN does, not what is about to render: the built plan is premium, so a free user
  // sees this same shortfall with an invitation instead. Both readings of this sentence are true.
  { id: 'recovery', title: "When it won't stretch", body: 'Some paychecks come up short. Your Guardian works out what has to be covered now, and what can safely wait.', target: 'guardian-card', state: 'at-risk' },
  // …and back out of trouble deliberately: nobody should be handed back to their own money while the
  // last thing they saw was a red card.
  { id: 'yourcall', title: 'Always your call', body: 'Your Guardian suggests — it never moves your money. Every number here is yours to overrule.', target: 'guardian-card', state: 'clear' },
  { id: 'handback', title: 'Over to your plan', body: 'That was example money. This is your own paycheck, and your Guardian is already watching it.', target: 'guardian-card', state: 'clear' },
];

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length;

/**
 * 3.5.3 gate (Jason 2026-07-31) — the TWO beats where the user actually does something; the other five
 * are scripted reveals. On these the overlay stops blocking touches so the real control underneath is
 * reachable, and each must be VoiceOver-OPERABLE, not merely readable — which is precisely why the
 * count is two: every added control multiplies that obligation and the ways a step can trap someone.
 */
export const INTERACTIVE_STEP_IDS: string[] = ['line', 'reserve'];

/** Clamp a persisted resume point back into range — a shorter arc must never strand a returning user. */
export function resumeIndex(saved: number | null | undefined, count: number = TUTORIAL_STEP_COUNT): number {
  if (saved == null || !Number.isFinite(saved)) return 0;
  const i = Math.floor(saved);
  if (i <= 0) return 0;
  // Resuming ON the last step is fine; past it means the arc shrank → start over rather than dead-end.
  return i < count ? i : 0;
}

export function isLastStep(index: number, count: number = TUTORIAL_STEP_COUNT): boolean {
  return index >= count - 1;
}

export function nextIndex(index: number, count: number = TUTORIAL_STEP_COUNT): number {
  return Math.min(index + 1, count - 1);
}

export function prevIndex(index: number): number {
  return Math.max(index - 1, 0);
}

/**
 * What a screen reader hears on entering a step. Position is spoken FIRST because a VoiceOver user has
 * no progress dots to glance at — without it they can't tell whether they're two steps in or six.
 */
export function stepAnnouncement(index: number, steps: TutorialStepDef[] = TUTORIAL_STEPS): string {
  const step = steps[index];
  if (!step) return '';
  return `Step ${index + 1} of ${steps.length}. ${step.title}. ${step.body}`;
}
