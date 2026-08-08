import { useEffect } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

import { tutorialSession } from '@/store/tutorialSession';
import { useTutorialTargets } from '@/store/tutorialTargets';

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
  /**
   * Ids already offered in this app run. 3.5.5.3 replaces this with a persisted pref so a mark is
   * once-EVER rather than once-per-launch; until then it is at least not a nag within a session.
   *
   * ⚠️ Session-scoped on purpose, not a stand-in that quietly ships: a mark that reappears every launch
   * is worse than no mark, so .3 is what makes this feature honest.
   */
  shown: Set<string>;
  /**
   * 3.5.5.5 — how many NESTED coach-mark hosts are mounted (a `FormSheet` Modal mounts one, because a
   * root-level overlay renders behind a presented Modal on device).
   *
   * The root layer stands down while one exists. Without this both layers render the same callout: on
   * device the root copy is merely hidden behind the sheet, but it is still a live `alert` in the
   * accessibility tree, so VoiceOver meets the hint twice.
   */
  hosts: number;
  show(id: string): void;
  dismiss(): void;
  addSuppressor(): () => void;
  addHost(): () => void;
}

export const coachMarks = createStore<CoachMarkState>((set, get) => ({
  active: null,
  suppressors: 0,
  shown: new Set<string>(),
  hosts: 0,

  show(id) {
    // Refused, not queued. A mark that waits its turn arrives detached from whatever prompted it, and a
    // user who dismissed one hint does not want a second appearing in its place.
    if (get().active) return;
    // 3.5.5.2 — and refused while any screen is already interrupting.
    if (get().suppressors > 0) return;
    // 3.5.5.5 — and never DURING the walkthrough. The suppressor mechanism is declared by screens for
    // their own acks, and the walkthrough is not a screen: it is an arc that owns the whole surface for
    // seven beats. A discovery hint landing mid-beat covers the subject the beat is explaining — which
    // is exactly how the e2e suite caught this, by failing "a user who actually DOES the interactive
    // beats completes the whole arc" the moment a real mark existed to fire.
    if (tutorialSession.getState().active) return;
    // Offered once. The caller is a mount effect, so without this the mark returns every time the user
    // reopens the sheet — which is the definition of nagging about a thing they have already been told.
    if (get().shown.has(id)) return;
    set((s) => ({ active: id, shown: new Set(s.shown).add(id) }));
  },

  dismiss() {
    set({ active: null });
  },

  addSuppressor() {
    set((s) => ({ suppressors: s.suppressors + 1 }));
    return () => set((s) => ({ suppressors: Math.max(0, s.suppressors - 1) }));
  },

  addHost() {
    set((s) => ({ hosts: s.hosts + 1 }));
    return () => set((s) => ({ hosts: Math.max(0, s.hosts - 1) }));
  },
}));

/** Is THIS target the one currently marked? Subscribes narrowly so an unrelated mark re-renders nothing. */
export function useIsCoachMarked(id: string): boolean {
  return useStore(coachMarks, (s) => s.active === id);
}

export function useActiveCoachMark(): string | null {
  return useStore(coachMarks, (s) => s.active);
}

/** How many nested hosts are mounted — the root layer stands down while any is. */
export function useCoachMarkHosts(): number {
  return useStore(coachMarks, (s) => s.hosts);
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
/**
 * Offer a mark when its subject has actually LAID OUT.
 *
 * ⚠️ This was a 600ms mount timer, and the timer was the defect. `CoachMarkLayer` renders nothing on a
 * miss or a 0×0 measure, so a mark asked for too early silently never appears — which made "has the sheet
 * finished presenting?" a question answered by a wall-clock guess. Under load the guess drifts, and the
 * suite found it: the mark landed mid-walkthrough and covered the subject a beat was explaining, and the
 * gate failed where an isolated run did not.
 *
 * `invalidate(id)` is the fact the guess was approximating — [E5] made `TutorialTarget` fire it on every
 * layout precisely because layout is the one signal that covers mount, reflow and resize. Asking then is
 * not merely better-timed; it is asking a question the app can answer, which is the same correction
 * 3.5.8 applied fourteen times to the capture pipeline.
 *
 * Fires ONCE per mount of the subject. The store's own `shown` set is what makes it once per run, and
 * 3.5.5.3's persisted pref is what will make it once ever.
 */
export function useCoachMark(id: string, ready: boolean): void {
  const targets = useTutorialTargets();
  useEffect(() => {
    if (!ready || !targets) return;
    let asked = false;
    const unsubscribe = targets.subscribe((laidOut) => {
      if (asked || laidOut !== id) return;
      asked = true;
      coachMarks.getState().show(id);
    });
    return unsubscribe;
  }, [id, ready, targets]);
}

export function useSuppressCoachMarks(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return coachMarks.getState().addSuppressor();
  }, [active]);
}
