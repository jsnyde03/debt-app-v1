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
/** One frame's grace before a null measure is believed — see the retry in the effect below. */
const RETRY_MS = 120;

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
      let first = await targets.measure(targetId);
      if (stale) return;

      // RETRY ONCE before concluding the subject isn't there. `measure` now resolves null on a 500ms
      // timeout as well as on a genuine miss, and those deserve different answers: a real absence is
      // permanent, but a timeout is most likely the heavy beat-transition frame, and treating it as
      // permanent is expensive. Nothing schedules another attempt — `revision` doesn't change and a
      // static screen fires no layout event — so the beat would sit there ringless for good, and on an
      // interactive beat that means NO SCRIM at all, with the whole real screen live underneath copy
      // saying "open it and move the line" while pointing at nothing.
      //
      // The retry costs one frame in the case that was already broken and nothing in the normal case.
      if (!first) {
        await new Promise((r) => setTimeout(r, RETRY_MS));
        if (stale) return;
        first = await targets.measure(targetId);
        if (stale) return;
      }

      // Still nothing: the subject genuinely isn't mounted for this beat (a beat can point at something
      // the current Guardian state doesn't render). Not a transit.
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
    // The SAME stale guard the main effect carries, for the same reason — and its absence here was the
    // main effect's documented race reintroduced one hook lower. A layout event firing just before a
    // beat change resolves its measure AFTER the new beat's rect has landed, and `setRect`s the
    // PREVIOUS subject's geometry; nothing corrects it until the next layout or revision, so the ring
    // and (on an interactive beat) the touch hole sit over the wrong region for the whole beat.
    let stale = false;
    const unsubscribe = targets.subscribe((id) => {
      if (id !== targetId) return;
      // Never during a stage-scroll: the rect is deliberately null while the subject travels, and a
      // layout event landing mid-flight would paint the ring back at a half-way position — exactly the
      // sliding-highlight glitch 3.5.3.3.1 hides the ring to avoid. The settle re-measure owns that path.
      if (settlingRef.current) return;
      void (async () => {
        const next = await targets.measure(targetId);
        // Re-checked AFTER the await, not just before it — the await is the window the race lives in.
        if (stale || settlingRef.current) return;
        // Value-compare before setting. A layout pass can report identical geometry, and `measure`
        // resolves a NEW object every time — publishing it would re-render the shell (and everything
        // reading the spotlight) for no visual change, on a surface that gets a lot of layout events.
        setRect((prev) => (sameRect(prev, next) ? prev : next));
      })();
    });
    return () => {
      stale = true;
      unsubscribe();
    };
  }, [targetId, targets]);

  return { rect, settling };
}

function sameRect(a: TargetRect | null, b: TargetRect | null): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

