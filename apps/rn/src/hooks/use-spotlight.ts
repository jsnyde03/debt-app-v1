import { useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

import { useReducedMotion } from 'react-native-reanimated';

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
  revision?: string | number;
}): { rect: TargetRect | null; settling: boolean } {
  const targets = useTutorialTargets();
  const reduceMotion = useReducedMotion();
  const [rect, setRect] = useState<TargetRect | null>(null);
  // [D4] TRANSIENTLY null (a scroll is in flight) vs PERMANENTLY null (the subject never measured) —
  // the caller has to tell them apart. On an interactive beat a permanent null must render no scrim, or
  // the user is sealed away from the control the beat is asking them to use; but a transient null must
  // KEEP the scrim, because dropping it for the ~380ms of travel re-opened the very leak 3.5.3.5.9
  // closed. Same value, opposite correct behaviour.
  const [settling, setSettling] = useState(false);
  // Mirrored in a ref so the layout subscriber below can read it without listing it as a dependency —
  // which would tear down and rebuild the subscription on every transit.
  const settlingRef = useRef(false);
  settlingRef.current = settling;

  useEffect(() => {
    // Guards a race that is easy to hit and confusing to debug: stepping quickly leaves an earlier
    // beat's settle-timer pending, and without this it resolves LAST and paints the previous subject.
    let stale = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!targetId || !targets) {
      setRect(null);
      setSettling(false);
      return;
    }

    void (async () => {
      const first = await targets.measure(targetId);
      if (stale) return;
      // Permanently null: the subject isn't mounted for this beat. Not a transit.
      if (!first) {
        setRect(null);
        setSettling(false);
        return;
      }

      const delta = scrollDelta(first, stageTop, stageBottom);
      if (Math.abs(delta) < 1) {
        setRect(first);
        setSettling(false);
        return;
      }

      // Hide the old highlight while the screen is moving — a spotlight sliding across unrelated content
      // reads as a glitch, where a brief absence reads as "it's getting there".
      setRect(null);
      setSettling(true);
      // Reduce Motion gets the jump, not the glide. A programmatic scroll the user didn't initiate is
      // exactly the kind of movement the setting exists to suppress, and the destination is identical
      // either way — only the travel differs.
      scrollRef.current?.scrollTo({ y: Math.max(0, (offsetRef.current ?? 0) + delta), animated: !reduceMotion });

      timer = setTimeout(() => {
        void (async () => {
          const settled = await targets.measure(targetId);
          if (stale) return;
          setRect(settled);
          setSettling(false);
        })();
      }, SETTLE_MS);
    })();

    return () => {
      stale = true; // invalidate any in-flight measure belonging to this run
      if (timer) clearTimeout(timer);
    };
  }, [targetId, targets, stageTop, stageBottom, scrollRef, offsetRef, revision, reduceMotion]);

  // [E5/B4] Re-measure when the SUBJECT ITSELF re-lays-out. The effect above only re-runs on the beat's
  // `revision` key, which covers the changes the tutorial causes and nothing else — so an iPad Split View
  // drag, a Dynamic Type change, or any reflow the arc didn't ask for left the ring, the cutout and the
  // scroll target at pre-change coordinates. This runs only while a session is mounted, and measuring
  // doesn't itself cause layout, so there's no feedback loop.
  useEffect(() => {
    if (!targetId || !targets) return;
    return targets.subscribe((id) => {
      if (id !== targetId) return;
      // Never during a stage-scroll: the rect is deliberately null while the subject travels, and a
      // layout event landing mid-flight would paint the ring back at a half-way position — exactly the
      // sliding-highlight glitch 3.5.3.3.1 hides the ring to avoid. The settle re-measure owns that path.
      if (settlingRef.current) return;
      void (async () => {
        const next = await targets.measure(targetId);
        // Value-compare before setting. A layout pass can report identical geometry, and `measure`
        // resolves a NEW object every time — publishing it would re-render the shell (and everything
        // reading the spotlight) for no visual change, on a surface that gets a lot of layout events.
        setRect((prev) => (sameRect(prev, next) ? prev : next));
      })();
    });
  }, [targetId, targets]);

  return { rect, settling };
}

function sameRect(a: TargetRect | null, b: TargetRect | null): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

