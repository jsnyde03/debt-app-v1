import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

/**
 * 3.5.3.3.1 — the coached-SUBJECT registry.
 *
 * A beat says "look at the cushion bar"; something has to know where the cushion bar physically is, on
 * this device, at this scroll position, in this Guardian state. This is that: a component wraps itself
 * in `<TutorialTarget id="bar">` and the overlay can then measure it.
 *
 * Two constraints shaped the design:
 *
 *  1. **It has to be inert when no tutorial is running.** Today renders this on every launch for every
 *     user, so registration is a ref write and an `onLayout` — nothing on the layout path costs a
 *     non-tutorial user anything. The guarantee rests on MOUNTING, not on statelessness: the provider
 *     lives only inside a running session, so with no provider above it `useTutorialTargets()` returns a
 *     null registry, `TutorialTarget` degrades to a plain `View`, and there is no state to change.
 *     (`activeId` below is React state — verified round 6 as not violating this, for that reason.)
 *
 *  2. **3.5.5 needs the same thing.** The feature-discovery coach-marks point at controls all over the
 *     app, so this is deliberately not tutorial-arc-specific: ids are free-form strings and nothing here
 *     knows about beats. Building it as a one-off for the walkthrough would mean writing it twice.
 *
 * Measurement is by `measure()` (window coordinates) rather than `onLayout` geometry, because what the
 * overlay needs is where the subject is ON SCREEN — which depends on scroll offset, and `onLayout`
 * reports layout-relative position that has no idea scrolling happened.
 */

import type { TargetRect } from '@/hooks/spotlightGeometry';
import { a11yHidden } from '@/utils/a11y';

export type { TargetRect };

/** Long enough that a slow device measures normally; short enough that a dropped callback doesn't
 *  outlast the beat it would freeze. See `measure`. */
const MEASURE_TIMEOUT_MS = 500;

interface TargetRegistry {
  register(id: string, node: View | null): void;
  /** Measure a registered subject in window coordinates. Null when it isn't mounted (a beat can point
   *  at something the current Guardian state doesn't render — the caller degrades, it doesn't crash). */
  measure(id: string): Promise<TargetRect | null>;
  /** Is this subject MOUNTED? `measure` resolving null does not answer that — it also means "timed out"
   *  or "measured 0×0 mid-transition". Callers that act on absence need the fact, not the inference. */
  has(id: string): boolean;
  /** [E5] A registered subject just laid out — its measured rect is stale. See `subscribe`. */
  invalidate(id: string): void;
  /** Watch for `invalidate`. Deliberately a listener set held in a ref, NOT React state: this fires on
   *  every layout of every coached subject, and a `setState` here would re-render Today on every layout
   *  pass. A ref write plus a walk of an empty Set is nothing. Returns an unsubscribe.
   *  (`activeId` below IS state, which does not contradict this: the constraint that matters is "nothing
   *  on the LAYOUT path", and `activeId` changes once per beat, not once per layout. Constraint 1 at the
   *  top of the file — inert outside a session — also still holds, but for a different reason than
   *  statelessness: the provider is mounted only inside a running session.) */
  subscribe(listener: (id: string) => void): () => void;
  /** Which subject the current beat coaches, or null outside a session. Published by the screen and read
   *  by `TutorialTarget` so a control that ISN'T this beat's subject can fence itself — see `control`. */
  activeId: string | null;
  setActiveId(id: string | null): void;
}

const TutorialTargetsContext = createContext<TargetRegistry | null>(null);

export function TutorialTargetsProvider({ children }: { children: ReactNode }) {
  const nodes = useRef(new Map<string, View>());

  const register = useCallback((id: string, node: View | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);

  const measure = useCallback((id: string) => {
    return new Promise<TargetRect | null>((resolve) => {
      const node = nodes.current.get(id);
      if (!node?.measureInWindow) return resolve(null);

      // `measureInWindow` is a callback into native with no failure path: if the view is detached
      // between the lookup above and the native call, the callback can simply never fire and this
      // promise never settles. That is not a hypothetical inconvenience — `useSpotlight` resets its
      // `settling` flag inside the awaiting code, and an interactive beat renders a FULL scrim while
      // settling. A dropped callback therefore seals the user away from the control the beat is asking
      // them to use, with no way forward. A timeout converts an unresolvable promise into an honest
      // "couldn't measure", which every caller already handles.
      let settled = false;
      const done = (rect: TargetRect | null) => {
        if (settled) return;
        settled = true;
        resolve(rect);
      };
      const timer = setTimeout(() => done(null), MEASURE_TIMEOUT_MS);

      // A subject mid-transition can measure as 0×0; treat that as "not ready" rather than spotlighting
      // an empty rect, which would read as a bug rather than as a highlight.
      node.measureInWindow((x, y, width, height) => {
        clearTimeout(timer);
        done(width > 0 && height > 0 ? { x, y, width, height } : null);
      });
    });
  }, []);

  const has = useCallback((id: string) => nodes.current.has(id), []);

  const listeners = useRef(new Set<(id: string) => void>());
  const invalidate = useCallback((id: string) => {
    listeners.current.forEach((fn) => fn(id));
  }, []);
  const subscribe = useCallback((listener: (id: string) => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  // State, unlike the listener set — `TutorialTarget` has to RE-RENDER when the active subject changes.
  // It stays null outside a session, so a non-tutorial user never sees a state change here.
  const [activeId, setActiveId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ register, measure, has, invalidate, subscribe, activeId, setActiveId }),
    [register, measure, has, invalidate, subscribe, activeId],
  );
  return <TutorialTargetsContext.Provider value={value}>{children}</TutorialTargetsContext.Provider>;
}

export function useTutorialTargets(): TargetRegistry | null {
  return useContext(TutorialTargetsContext);
}

/**
 * Mark a subtree as a coachable subject. Renders a plain `View` — the wrapper must not change layout,
 * because these wrap real product UI that ships to every user whether or not they ever run a tutorial.
 */
export function TutorialTarget({
  id,
  children,
  onLayout,
  style,
  control,
}: {
  id: string;
  children: ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
  style?: View['props']['style'];
  /**
   * This target wraps an ACTIONABLE control, not just a region to look at.
   *
   * While a session is running, a COACHED control that isn't the current beat's subject leaves the
   * accessibility tree. The scrim already fences it for touch — the hole is cut over one subject — but a
   * VoiceOver double-tap dispatches straight to the focused element and never goes through hit-testing,
   * so on the two interactive beats (where the screen is deliberately left exposed so the user CAN reach
   * the coached control) every other control was still activatable. Concretely: on beat 3 the attestation
   * fired beat 4's entire scripted story; on beat 4 the adjust row opened the floor sheet mid-beat.
   * (Round 5 wrote that second one as opening the sheet "carrying the wrong beat's coaching line". It
   * cannot: `coachLine` resolves off the CURRENT index and only beat 3 declares a `coach`, so on beat 4
   * the sheet opens with no coaching line at all. The defect was real, the symptom was invented — worth
   * recording, because a narrated symptom is exactly what a later reader takes on trust.)
   *
   * ⚠️ SCOPE — read this before trusting it. Round 5 introduced this and claimed it "covers every current
   * and future coached control at once". It covers every control that is a `TutorialTarget`, which today
   * is two: the attestation and the adjust row. The other leaks round 5 listed in the same paragraph —
   * the hero's Edit-paycheck / Add-windfall sheets and the action-list toggles — are ordinary Today
   * controls, not coached subjects, so this wrapper structurally cannot reach them. That fix belongs to
   * the SCREEN's `screenReachable` fence, not here. Recording the boundary because the claim of totality
   * is precisely what stops the next reviewer from checking: round 5 committed the one-member fix inside
   * the commit that condemned it, and the overstated comment is why it read as closed.
   *
   * Still fixed here rather than at each coached control, because that half HAD been patched one member
   * at a time — More, then the tabs, then the forecast link, one per audit round. The wrapper that marks
   * a coachable subject is the one place that knows both which coached controls exist and which one the
   * beat means, and the card stays unaware of the walkthrough (3.5.3.3.1).
   */
  control?: boolean;
}) {
  const targets = useTutorialTargets();
  // Only when a session is actually running (`activeId` non-null) — outside one this is always false and
  // costs nothing. Never fences the ACTIVE control, which is the whole point of the beat.
  const fenced = !!control && !!targets?.activeId && targets.activeId !== id;
  return (
    <View
      {...a11yHidden(fenced)}
      ref={(node) => targets?.register(id, node)}
      // [E5] This used to claim it "re-registers on layout", and did no such thing — it forwarded the
      // caller's handler and nothing else, so a spotlight only ever re-measured when the beat's own
      // `revision` key changed. The claim was worth making TRUE rather than deleting: a ref callback
      // fires once at mount, but a subject genuinely moves afterwards — the Guardian card grows when
      // Recovery renders, Dynamic Type reflows it, and [B4] an iPad Split View drag re-lays out the whole
      // screen while the ring stays parked at pre-resize coordinates. Layout is the one signal that
      // covers all three, so it now invalidates the measurement.
      onLayout={(e) => {
        targets?.invalidate(id);
        onLayout?.(e);
      }}
      style={style}
      collapsable={false} // else Android may flatten the view away and there's nothing left to measure
    >
      {children}
    </View>
  );
}
