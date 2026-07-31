import { useEffect, useState } from 'react';
import type { ScrollView } from 'react-native';

import { useTutorialTargets } from '@/store/tutorialTargets';
import { scrollDelta, type TargetRect } from './spotlightGeometry';

/**
 * 3.5.3.3.1 — put the beat's subject on screen, then report where it landed.
 *
 * The problem this solves is unglamorous and was going to bite on device: the coaching card docks at the
 * bottom, the Guardian card is tall (taller still once Recovery renders), and Today scrolls. So the
 * thing a beat is talking about is frequently below the fold or sitting behind the dock — the 3.5.3.2
 * at-risk screenshot showed exactly that, with the Recovery section hidden under the card that was
 * describing it.
 *
 * The sequence is measure → scroll → measure AGAIN, and the second measure is the point: the first one
 * tells us where the subject is now, the scroll moves it, and only the third step knows where to draw
 * the highlight. Drawing from the pre-scroll rect would leave the spotlight behind on screen.
 *
 * Returns null while it has no usable answer — mid-scroll, or when the subject isn't mounted at all
 * (a beat may point at something the current Guardian state doesn't render). Callers fall back to an
 * un-cut scrim, which is a plain walkthrough rather than a broken one.
 */

const SETTLE_MS = 380; // a beat longer than the scroll animation, so the re-measure reads the end state

export function useSpotlight({
  targetId,
  stageTop,
  stageBottom,
  scrollRef,
  offsetRef,
  revision = 0,
}: {
  /** Which registered subject this beat coaches. Null → no spotlight (a whole-screen beat). */
  targetId: string | null;
  /** Window-space band the subject must end up inside: below the header, above the coaching dock. */
  stageTop: number;
  stageBottom: number;
  scrollRef: React.RefObject<ScrollView | null>;
  /** Live scroll offset — `scrollTo` is absolute, so moving by a measured delta needs the current y. */
  offsetRef: React.RefObject<number>;
  /** Bump to force a re-measure when the subject itself changed size (state change, card grew). */
  revision?: number;
}): TargetRect | null {
  const targets = useTutorialTargets();
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    // Guards a race that is easy to hit and confusing to debug: stepping quickly leaves an earlier
    // beat's settle-timer pending, and without this it resolves LAST and paints the previous subject.
    let stale = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!targetId || !targets) {
      setRect(null);
      return;
    }

    void (async () => {
      const first = await targets.measure(targetId);
      if (stale) return;
      if (!first) return setRect(null);

      const delta = scrollDelta(first, stageTop, stageBottom);
      if (Math.abs(delta) < 1) return setRect(first);

      // Hide the old highlight while the screen is moving — a spotlight sliding across unrelated content
      // reads as a glitch, where a brief absence reads as "it's getting there".
      setRect(null);
      scrollRef.current?.scrollTo({ y: Math.max(0, (offsetRef.current ?? 0) + delta), animated: true });

      timer = setTimeout(() => {
        void (async () => {
          const settled = await targets.measure(targetId);
          if (!stale) setRect(settled);
        })();
      }, SETTLE_MS);
    })();

    return () => {
      stale = true; // invalidate any in-flight measure belonging to this run
      if (timer) clearTimeout(timer);
    };
  }, [targetId, targets, stageTop, stageBottom, scrollRef, offsetRef, revision]);

  return rect;
}

