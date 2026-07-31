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
}

/**
 * PLACEHOLDER beats — 3.5.3 replaces the copy with the real arc (predict-then-reveal → read the bar →
 * drag the floor → the reserve → a Recovery glimpse → safe move → the hand-back finale). The COUNT and
 * shape are what 3.5.2 needs, so the path, its a11y and its e2e are provable now.
 */
export const TUTORIAL_STEPS: TutorialStepDef[] = [
  { id: 'intro', title: 'What your Guardian does', body: 'It protects a cushion from each paycheck before anything extra goes to debt.', target: 'guardian-card', state: 'clear' },
  { id: 'bar', title: 'Reading your paycheck', body: 'The bar splits this paycheck into what is held back and what goes to debt.', target: 'guardian-bar', state: 'clear' },
  { id: 'line', title: 'Your line', body: 'You choose the cushion to keep. Move it and the plan re-solves around it.', target: 'guardian-line', state: 'clear' },
  { id: 'reserve', title: 'The safety net', body: 'Early on, a little extra is held back while the app learns your bills.', target: 'guardian-bar', state: 'clear' },
  // The one beat that deliberately puts the card into trouble — the Recovery glimpse. It's also the
  // beat the Example marker was built for: a real-looking shortfall, on figures scaled from their pay.
  { id: 'recovery', title: 'When a paycheck is short', body: 'You get a plan: what to cover first, and what can safely wait.', target: 'guardian-card', state: 'at-risk' },
  // …and back out of trouble deliberately: nobody should be handed back to their own money while the
  // last thing they saw was a red card.
  { id: 'yourcall', title: 'Always your call', body: 'The Guardian suggests. Nothing moves without you.', target: 'guardian-card', state: 'clear' },
  { id: 'handback', title: 'Over to your plan', body: 'That was example money. Here is your own paycheck.', target: 'guardian-card', state: 'clear' },
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
