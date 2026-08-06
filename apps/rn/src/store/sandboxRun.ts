/**
 * 3.5.4.4 — the scripted-story machinery, shared by every bounded run.
 *
 * Extracted at 3.5.4.6 rather than ahead of it, because the boundary is only knowable once there is a
 * second caller: the walkthrough's beat 4 story and the demo's run now both schedule a chain of timed
 * consequences over a sandbox. What is shared is exactly this — the TIMER REGISTRY and the rule that a
 * timer must not fire onto a sandbox that has been replaced. Staging, scenarios and teardown stayed with
 * the sessions, because those are genuinely session-shaped (the walkthrough has beats; the demo does not).
 *
 * ⚠️ The registry is module-level and shared ON PURPOSE. `_layout` cancels pending stories from a single
 * global background handler, and iOS suspends timers on background then releases them together on resume
 * — so a run whose timers lived somewhere else would come back to its whole sequence firing in one tick,
 * behind a handler that looked like it covered everything. One array means one cancel covers every run by
 * construction, instead of by remembering.
 */

/** Pending timers for every scripted story, across all bounded runs. */
let storyTimers: ReturnType<typeof setTimeout>[] = [];

/** Cancel every pending scripted step. Safe to call when nothing is scheduled. */
export function clearStoryTimers(): void {
  storyTimers.forEach(clearTimeout);
  storyTimers = [];
}

/**
 * Schedule one step of a scripted story.
 *
 * `isCurrent` is the staleness guard and it is not optional: a user who skips out mid-story would
 * otherwise have steps land on a sandbox that is no longer on screen — or, worse, on the NEXT run's
 * sandbox. Every caller passes an identity check against the store it scheduled for.
 */
export function scheduleStoryStep(ms: number, isCurrent: () => boolean, step: () => void): void {
  storyTimers.push(
    setTimeout(() => {
      if (isCurrent()) step();
    }, ms),
  );
}
