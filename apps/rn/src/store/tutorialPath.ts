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
}

/**
 * PLACEHOLDER beats — 3.5.3 replaces the copy with the real arc (predict-then-reveal → read the bar →
 * drag the floor → the reserve → a Recovery glimpse → safe move → the hand-back finale). The COUNT and
 * shape are what 3.5.2 needs, so the path, its a11y and its e2e are provable now.
 */
export const TUTORIAL_STEPS: TutorialStepDef[] = [
  { id: 'intro', title: 'What your Guardian does', body: 'It protects a cushion from each paycheck before anything extra goes to debt.' },
  { id: 'bar', title: 'Reading your paycheck', body: 'The bar splits this paycheck into what is held back and what goes to debt.' },
  { id: 'line', title: 'Your line', body: 'You choose the cushion to keep. Move it and the plan re-solves around it.' },
  { id: 'reserve', title: 'The safety net', body: 'Early on, a little extra is held back while the app learns your bills.' },
  { id: 'recovery', title: 'When a paycheck is short', body: 'You get a plan: what to cover first, and what can safely wait.' },
  { id: 'yourcall', title: 'Always your call', body: 'The Guardian suggests. Nothing moves without you.' },
  { id: 'handback', title: 'Over to your plan', body: 'That was example money. Here is your own paycheck.' },
];

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length;

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
