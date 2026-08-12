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
 *  1. **It has to be inert when nothing is coaching.** Today renders this on every launch for every user,
 *     so registration is a ref write and an `onLayout` — nothing on the layout path costs a non-coached
 *     user anything.
 *
 *     ⚠️ **The guarantee no longer rests on MOUNTING, and that sentence is rewritten rather than moved.**
 *     It used to read "the provider lives only inside a running session, so with no provider above it
 *     `useTutorialTargets()` returns a null registry" — true until 3.5.5, and false the moment the
 *     provider went app-wide so coach-marks could point at controls on Money, Progress and More. A stale
 *     claim about WHY something is safe is worse than no claim: the next reader trusts it.
 *
 *     What holds now: `register` is a ref write into a `Map`, `subscribe`/`invalidate` are a ref-held
 *     listener set, and the only React state — `activeId` — stays `null` unless something is actively
 *     coaching. So an ordinary launch mounts the provider, registers nodes into a ref, and changes no
 *     state at all. Unmount clears each entry through the same ref callback, so the map does not grow.
 *
 *  2. **3.5.5 needs the same thing, and now uses it.** The feature-discovery coach-marks point at controls
 *     all over the app, so this is deliberately not tutorial-arc-specific: ids are free-form strings and
 *     nothing here knows about beats. Building it as a one-off for the walkthrough would have meant
 *     writing it twice — the provider moved to the root layout at 3.5.5.1 and both consumers share it.
 *
 * Measurement is by `measure()` (window coordinates) rather than `onLayout` geometry, because what the
 * overlay needs is where the subject is ON SCREEN — which depends on scroll offset, and `onLayout`
 * reports layout-relative position that has no idea scrolling happened.
 */

import type { TargetRect } from '@/hooks/spotlightGeometry';
import { useInert } from '@/hooks/use-inert';
import { useTutorialSession } from '@/store/tutorialSession';
import { a11yHidden } from '@/utils/a11y';

export type { TargetRect };

/** Long enough that a slow device measures normally; short enough that a dropped callback doesn't
 *  outlast the beat it would freeze. See `measure`. */
const MEASURE_TIMEOUT_MS = 500;

interface TargetRegistry {
  register(id: string, node: View | null): void;
  /** Measure a registered subject in window coordinates. Null on a miss or a timeout; the caller falls
   *  back to an uncut scrim and keeps the beat's copy, which the arc invariant already proved honest. */
  measure(id: string): Promise<TargetRect | null>;
  /** [E5] A registered subject just laid out — its measured rect is stale. See `subscribe`. */
  invalidate(id: string): void;
  /** Watch for `invalidate`. Deliberately a listener set held in a ref, NOT React state: this fires on
   *  every layout of every coached subject, and a `setState` here would re-render Today on every layout
   *  pass. A ref write plus a walk of an empty Set is nothing. Returns an unsubscribe.
   *  (`activeId` below IS state, which does not contradict this: the constraint that matters is "nothing
   *  on the LAYOUT path", and `activeId` changes once per beat, not once per layout. Constraint 1 at the
   *  top of the file — inert outside a session — also still holds, and for the reason given THERE: the
   *  provider is app-wide since 3.5.5.1, so what keeps it inert is that registration touches only refs,
   *  NOT that it goes unmounted.)
   *
   *  ⚠️ 3.5.5.5 — `subscribe` has a second consumer now: `useCoachMark` waits on it to learn that a
   *  subject has laid out, replacing a 600ms timer that guessed. So this fires for marks as well as
   *  beats, and the "nothing on the layout path" constraint above is what makes that free. */
  subscribe(listener: (id: string) => void): () => void;
  /** Which subject the current beat coaches, or null outside a session. Published by the screen and read
   *  by `TutorialTarget` so a control that ISN'T this beat's subject can fence itself — see `control`. */
  activeId: string | null;
  setActiveId(id: string | null): void;
}

const TutorialTargetsContext = createContext<TargetRegistry | null>(null);

export function TutorialTargetsProvider({ children }: { children: ReactNode }) {
  const nodes = useRef(new Map<string, View>());

  /**
   * Ids that have laid out and are still mounted — the replay backing `subscribe`.
   *
   * ⛔ WITHOUT THIS, A LATE SUBSCRIBER MISSES ITS ONLY EVENT, and one shipped hint never appeared.
   * `invalidate` fires into a plain listener Set, so a subscriber that arrives after the layout learns
   * nothing. `useCoachMark(id, ready)` subscribes only once `ready` is true, and
   * `money.tsx:259` makes `ready` depend on `view.order.length > 0` — which the async store hydration
   * flips AFTER the row has laid out. The mark was therefore never offered on iOS at all.
   *
   * ⚡ The contrast that identified it: `trajectory-scrub` is offered unconditionally, so its `ready`
   * never changes, its subscription exists from mount, and it works — proven green on web
   * (`a11y-axe.spec.ts:137`). `debt-row-actions` is the only mark whose `ready` is data-gated, and the
   * only one that never fires. Same code path, one structural difference.
   *
   * Replaying makes "has this laid out" a STATE a subscriber can ask about, rather than an instant it
   * had to be present for. Unregistering clears it, so an unmounted target is never replayed.
   */
  const laidOut = useRef(new Set<string>());

  const register = useCallback((id: string, node: View | null) => {
    if (node) nodes.current.set(id, node);
    else {
      nodes.current.delete(id);
      laidOut.current.delete(id);
    }
  }, []);

  const measure = useCallback((id: string) => {
    return new Promise<TargetRect | null>((resolve) => {
      const node = nodes.current.get(id);
      if (!node?.measureInWindow) return resolve(null);

      // `measureInWindow` is a callback into native with no failure path: a view detached between the
      // lookup above and the native call never fires it, so this promise would never settle. The timeout
      // turns that into an honest "couldn't measure", which every caller handles.
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

  
  const listeners = useRef(new Set<(id: string) => void>());
  const invalidate = useCallback((id: string) => {
    laidOut.current.add(id);
    listeners.current.forEach((fn) => fn(id));
  }, []);
  const subscribe = useCallback((listener: (id: string) => void) => {
    listeners.current.add(listener);
    // Replay what already happened. A re-measure request is idempotent, so a subscriber that was present
    // all along simply asks again for something it has already handled.
    laidOut.current.forEach((id) => listener(id));
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  // State, unlike the listener set — `TutorialTarget` has to RE-RENDER when the active subject changes.
  // It stays null outside a session, so a non-tutorial user never sees a state change here.
  const [activeId, setActiveId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ register, measure, invalidate, subscribe, activeId, setActiveId }),
    [register, measure, invalidate, subscribe, activeId],
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
   * the coached control) every other control was still activatable: on beat 3 the attestation fired beat
   * 4's entire scripted story; on beat 4 the adjust row opened the floor sheet mid-beat.
   *
   * ⚠️ SCOPE. This reaches every control that is a `TutorialTarget` — and nothing else. Ordinary Today
   * controls (the hero's Edit-paycheck / Add-windfall sheets, the action-list toggles) are not coached
   * subjects, so this wrapper structurally cannot fence them; that is the SCREEN's `screenReachable`
   * fence, not this.
   *
   * Fixed here rather than at each coached control because this wrapper is the one place that knows both
   * which coached controls exist and which one the beat means, and it keeps the card unaware of the
   * walkthrough (3.5.3.3.1).
   */
  control?: boolean;
}) {
  const targets = useTutorialTargets();
  // Fail-CLOSED. Keyed on the session rather than on `activeId`, because `activeId` is published by an
  // effect and is therefore null for the opening frames of every beat — keyed on it, a coached control
  // was briefly unfenced on exactly the beats where the screen fence is open, which is the leak this
  // prop exists to close. With no active subject yet, every coached control fences; the beat's own
  // subject un-fences as soon as it is published. Outside a session there is no provider, so this is
  // false and costs nothing.
  const inWalkthrough = useTutorialSession((s) => s.active);
  const fenced = !!control && inWalkthrough && targets?.activeId !== id;
  // `aria-hidden` leaves the control tabbable on web — the third and last fence in this feature to need
  // its tab-order half, alongside the screen fence and `TutorialFence`. See `useInert`.
  const nodeRef = useRef<View>(null);
  useInert(nodeRef, fenced);
  return (
    <View
      {...a11yHidden(fenced)}
      // Addressable from a test, so an assertion about the spotlight can take its reference box from the
      // SUBJECT rather than from the highlight. The ring and the scrim hole are both drawn from one
      // measured rect, so any assertion that compares them is comparing a value to itself and passes with
      // the whole mechanism deleted.
      testID={`tutorial-target-${id}`}
      ref={(node) => {
        nodeRef.current = node;
        targets?.register(id, node);
      }}
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
