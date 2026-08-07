import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

/**
 * 3.5.5.1 — the feature-discovery coach-marks' session state.
 *
 * Deliberately tiny, and deliberately NOT the walkthrough's session. The walkthrough is an arc with an
 * order, a resume point and a sandbox; a coach-mark is one sentence pointing at one control that already
 * exists on the real screen, with the user's real money behind it. Sharing `tutorialSession` would have
 * meant teaching it a second concept it has no use for — and every fence in the app reads that flag, so a
 * coach-mark would have silently inherited the walkthrough's containment (tabs held, More withheld). A
 * discovery hint that fences the app is a worse hint than none.
 *
 * **One at a time is enforced HERE, by shape.** `active` is a single id rather than a list, so a second
 * `show()` while one is up is refused rather than queued into a stack of callouts. Whether it can fire
 * alongside a DIFFERENT kind of interruption — an ack, the walkthrough invitation — is a separate and
 * larger question that the Today-local VIS-4 slot cannot answer for the whole app; that is 3.5.5.2.
 */
export interface CoachMarkState {
  /** The target id currently being marked, or null. Never a queue — see the note above. */
  active: string | null;
  show(id: string): void;
  dismiss(): void;
}

export const coachMarks = createStore<CoachMarkState>((set, get) => ({
  active: null,

  show(id) {
    // Refused, not queued. A mark that waits its turn arrives detached from whatever prompted it, and a
    // user who dismissed one hint does not want a second appearing in its place.
    if (get().active) return;
    set({ active: id });
  },

  dismiss() {
    set({ active: null });
  },
}));

/** Is THIS target the one currently marked? Subscribes narrowly so an unrelated mark re-renders nothing. */
export function useIsCoachMarked(id: string): boolean {
  return useStore(coachMarks, (s) => s.active === id);
}

export function useActiveCoachMark(): string | null {
  return useStore(coachMarks, (s) => s.active);
}
