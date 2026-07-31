import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
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
 *     user, so registration is a ref write and an `onLayout` — no state, no re-render, nothing that
 *     costs a non-tutorial user anything. With no provider above it, `useTutorialTargets()` returns a
 *     null registry and `TutorialTarget` degrades to a plain `View`.
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

export type { TargetRect };

interface TargetRegistry {
  register(id: string, node: View | null): void;
  /** Measure a registered subject in window coordinates. Null when it isn't mounted (a beat can point
   *  at something the current Guardian state doesn't render — the caller degrades, it doesn't crash). */
  measure(id: string): Promise<TargetRect | null>;
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
      // A subject mid-transition can measure as 0×0; treat that as "not ready" rather than spotlighting
      // an empty rect, which would read as a bug rather than as a highlight.
      node.measureInWindow((x, y, width, height) => {
        resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
      });
    });
  }, []);

  const value = useMemo(() => ({ register, measure }), [register, measure]);
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
}: {
  id: string;
  children: ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
  style?: View['props']['style'];
}) {
  const targets = useTutorialTargets();
  return (
    <View
      ref={(node) => targets?.register(id, node)}
      // Re-register on layout too: a ref callback fires once at mount, but a subject can move (the card
      // grows when Recovery appears) and web in particular needs a nudge to re-measure.
      onLayout={onLayout}
      style={style}
      collapsable={false} // else Android may flatten the view away and there's nothing left to measure
    >
      {children}
    </View>
  );
}
