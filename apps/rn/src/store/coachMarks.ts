import { useEffect } from 'react';
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

import { appStore } from '@/store/appStore';
import { probeCoachMark, resetCoachMarkProbe } from '@/store/coachMarkProbe';

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
   * How many things are currently interrupting: a screen showing an interruption of its own (an ack, the
   * walkthrough invitation, a celebration), or a BOUNDED RUN. A COUNT rather than a boolean because two
   * surfaces can be mounted at once — Today under an iPad detail pane, a screen behind a sheet — and a
   * boolean would let whichever unmounted second clear a suppression the other still needs.
   *
   * ⚠️ 3.5.5.3 — the walkthrough and the demo declare themselves HERE rather than being special-cased
   * inside `show`. Two reasons, and the second is load-bearing:
   *  - it is the same claim a screen already makes ("I am interrupting"), so there is one mechanism
   *    rather than three;
   *  - `show` would otherwise have to READ `tutorialSession`, which imports `expo-router` — and this
   *    store is imported by the app-layer test runner, which runs under `tsx` with no React Native
   *    runtime. A store that reaches for a session is a store that can no longer be tested cheaply.
   *
   * What each run protects: the walkthrough owns the whole surface for seven beats, so a hint landing
   * mid-beat covers the subject the beat is explaining. The demo is a SANDBOX — a mark records itself to
   * the REAL store, which `useNoRealWritesGuard` would rightly call a bug — and it is also the
   * App-Preview capture vehicle, so an unguarded mark would appear in the store video on the next
   * re-shoot, teaching a viewer about a control the footage never uses.
   */
  suppressors: number;
  /**
   * Ids already offered in this app run, backing the once-per-RUN refusal. `prefs.coachMarksSeen` is
   * what makes it once-EVER; this set is what stops a mark returning within a single launch, and both
   * are needed — see `resetCoachMarks`.
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
  /**
   * 4.1.4c — WHO is suppressing, in the order they registered.
   *
   * ⛔ The probe measured `refused(suppressors=1)` and could not say which of three holders it was —
   * Today's own interruption, a bounded demo run, or a walkthrough session. A count answers "was it
   * suppressed"; only a name answers "by what", and this defect has already consumed five confident
   * guesses. The reason is carried rather than inferred.
   */
  suppressorReasons: string[];
  show(id: string): void;
  /** Record the once-ever offer — called by the LAYER when the callout renders. See the implementation. */
  markDrawn(id: string): void;
  dismiss(): void;
  addSuppressor(reason?: string): () => void;
  addHost(): () => void;
}

export const coachMarks = createStore<CoachMarkState>((set, get) => ({
  active: null,
  suppressors: 0,
  suppressorReasons: [],
  shown: new Set<string>(),
  hosts: 0,

  show(id) {
    // 4.1.4c — every refusal below names ITSELF in the probe trace. Four wrong mechanisms for
    // `debt-row-actions` were all compatible with "show() was refused for some reason"; naming the guard
    // makes the four mutually exclusive. Inert outside a QA build.
    // Refused, not queued. A mark that waits its turn arrives detached from whatever prompted it, and a
    // user who dismissed one hint does not want a second appearing in its place.
    if (get().active) return probeCoachMark(`show:${id}=refused(active=${get().active})`);
    // 3.5.5.2 — and refused while any screen is already interrupting.
    if (get().suppressors > 0) {
      return probeCoachMark(
        `show:${id}=refused(suppressors=${get().suppressors}: ${get().suppressorReasons.join(' + ') || 'unnamed'})`,
      );
    }
    // Offered once. The caller is a layout signal, so without this the mark returns every time the user
    // reopens the sheet — which is the definition of nagging about a thing they have already been told.
    if (get().shown.has(id)) return probeCoachMark(`show:${id}=refused(shownThisRun)`);
    // 3.5.5.3 — and once EVER, not once per launch. Read from the REAL store deliberately, never the
    // active one: a mark met inside the Example world would otherwise burn the hint the real user has
    // not been shown. This is also why `coachMarksSeen` must never join `TUTORIAL_WRITABLE_PREFS`.
    const prefs = appStore.getState().store.prefs;
    if (prefs.coachMarksSeen.includes(id)) return probeCoachMark(`show:${id}=refused(seenPref)`);

    probeCoachMark(`show:${id}=ACCEPTED`);
    set((s) => ({ active: id, shown: new Set(s.shown).add(id) }));
  },

  /**
   * ⛔ 4.1.4c — THE ONCE-EVER RECORD IS WRITTEN WHEN THE CALLOUT ACTUALLY DRAWS, not when it is offered.
   *
   * It used to be written inside `show()`, and the difference is not academic: run 31700074087 measured
   * `payoff-schedule` at **y=1702 on a 956pt screen** — the sheet was still a full sheet-height below its
   * seated position when the subject laid out — so the mark was recorded as seen and then drawn where
   * nobody could ever see it. **Offered ≠ shown**, and the user lost that hint permanently.
   *
   * ⚡ The intent the old placement protected is UNCHANGED and still holds: recording does not wait for a
   * dismissal, because *"a user who saw the hint and ignored it has been told"*. Drawn-and-ignored still
   * counts as told. What no longer counts is drawn-into-the-void.
   *
   * Idempotent: the layer re-renders freely, and a mark already in the list is left alone.
   */
  markDrawn(id) {
    const prefs = appStore.getState().store.prefs;
    if (prefs.coachMarksSeen.includes(id)) return;
    probeCoachMark(`record:${id}`);
    appStore.getState().updatePrefs({ coachMarksSeen: [...prefs.coachMarksSeen, id] });
  },

  dismiss() {
    set({ active: null });
  },

  addSuppressor(reason = 'unnamed') {
    // ⚠️ Also DISMISSES whatever is up. Blocking new marks was not enough: a mark stays active until the
    // user dismisses it, so one raised on Progress was still on screen when the walkthrough started —
    // covering the arc it was supposed to yield to. Something more important taking over should clear the
    // hint, not queue behind it. The mark stays recorded as offered; it does not come back.
    probeCoachMark(`suppress+ ${reason}`);
    set((s) => ({ suppressors: s.suppressors + 1, suppressorReasons: [...s.suppressorReasons, reason], active: null }));
    let released = false;
    return () => {
      // ⚠️ Idempotent. The release is a React effect cleanup, and a double-invoked effect (StrictMode, a
      // remount) would otherwise decrement twice and free a suppression somebody else still holds — the
      // same class of bug the COUNT exists to prevent in the first place.
      if (released) return;
      released = true;
      probeCoachMark(`suppress- ${reason}`);
      set((s) => {
        const i = s.suppressorReasons.indexOf(reason);
        return {
          suppressors: Math.max(0, s.suppressors - 1),
          suppressorReasons: i < 0 ? s.suppressorReasons : [...s.suppressorReasons.slice(0, i), ...s.suppressorReasons.slice(i + 1)],
        };
      });
    };
  },

  addHost() {
    set((s) => ({ hosts: s.hosts + 1 }));
    return () => set((s) => ({ hosts: Math.max(0, s.hosts - 1) }));
  },
}));

/**
 * 3.5.5.3 — "Show feature tips again" (More).
 *
 * Clears BOTH records or it does not work: the persisted list is what survives a relaunch, and the
 * session `shown` set is what would otherwise swallow every mark until the user quit the app — so
 * resetting only the pref would produce a replay entry that appears to do nothing.
 */
export function resetCoachMarks(): void {
  appStore.getState().updatePrefs({ coachMarksSeen: [] });
  coachMarks.setState({ shown: new Set<string>(), active: null });
  // 4.1.4c — the trace describes ONE attempt. Carrying the pre-reset entries forward would make the
  // readout show a `refused(seenPref)` from before the reset beside the attempt that followed it, which
  // is precisely the ambiguity the probe exists to remove.
  resetCoachMarkProbe();
}

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
export function useSuppressCoachMarks(active: boolean, reason = 'screen'): void {
  useEffect(() => {
    if (!active) return;
    return coachMarks.getState().addSuppressor(reason);
  }, [active, reason]);
}
