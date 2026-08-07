import { useEffect } from 'react';
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
  /**
   * How many screens are currently showing an interruption of their own (an ack, the walkthrough
   * invitation, a celebration). A COUNT rather than a boolean because two surfaces can be mounted at once
   * — Today under an iPad detail pane, a screen behind a sheet — and a boolean would let whichever
   * unmounted second clear a suppression the other still needs.
   */
  suppressors: number;
  show(id: string): void;
  dismiss(): void;
  addSuppressor(): () => void;
}

export const coachMarks = createStore<CoachMarkState>((set, get) => ({
  active: null,
  suppressors: 0,

  show(id) {
    // Refused, not queued. A mark that waits its turn arrives detached from whatever prompted it, and a
    // user who dismissed one hint does not want a second appearing in its place.
    if (get().active) return;
    // 3.5.5.2 — and refused while any screen is already interrupting.
    if (get().suppressors > 0) return;
    set({ active: id });
  },

  dismiss() {
    set({ active: null });
  },

  addSuppressor() {
    set((s) => ({ suppressors: s.suppressors + 1 }));
    return () => set((s) => ({ suppressors: Math.max(0, s.suppressors - 1) }));
  },
}));

/** Is THIS target the one currently marked? Subscribes narrowly so an unrelated mark re-renders nothing. */
export function useIsCoachMarked(id: string): boolean {
  return useStore(coachMarks, (s) => s.active === id);
}

export function useActiveCoachMark(): string | null {
  return useStore(coachMarks, (s) => s.active);
}

/**
 * 3.5.5.2 — "one interruption at a time", enforced centrally and known locally.
 *
 * ⚠️ The parked decomposition said "register in the VIS-4 single-ack slot". That is not possible as
 * written, and the drift is worth stating: the VIS-4 slot is a **ternary chain inside Today's component**,
 * not an app-wide coordinator — and its own comment records that the ranking "only governs the FALLBACK
 * now", since [D5] moved the walkthrough invitation out from under it, where it can already render beside
 * an ack. Coach-marks live on Money, Progress and More, which that slot cannot see at all.
 *
 * Building a real app-wide interruption authority would be the thorough answer, and it would be
 * speculative: coach-marks are the only cross-screen interruption that exists, so the authority would have
 * exactly one subject. The honest smaller claim is this — **a screen declares while it is interrupting,
 * and a mark refuses to fire during one.** Central enforcement (the store decides), local knowledge (Today
 * knows what an ack is; the store must not have to).
 *
 * Call it with `true` while the screen is showing an ack, the invitation, or a celebration.
 */
export function useSuppressCoachMarks(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return coachMarks.getState().addSuppressor();
  }, [active]);
}
