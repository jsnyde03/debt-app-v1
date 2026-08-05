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
 * Returns null while it has no usable answer — mid-scroll, or when every attempt came back empty.
 * Callers fall back to an un-cut scrim, which is a plain walkthrough rather than a broken one.
 *
 * It reports GEOMETRY and nothing else. Whether a beat's subject exists is settled at build time by the
 * arc invariant (`guardianSubjects.test.ts`), never inferred from a measurement here. That inference
 * cannot be allowed to reach the dock's copy: copy length decides the dock's height, and the dock's
 * height re-keys this measurement, so the two chase each other.
 */

/** A beat longer than the scroll animation, so the re-measure reads the end state. Under Reduce Motion
 *  there IS no animation — the scroll is instantaneous — and waiting anyway holds a fully-closed scrim
 *  over the screen for 380ms on every beat that scrolls, which reads as a flash rather than as travel. */
const SETTLE_MS = 380;
/** ~7 frames' grace before a null measure is believed — see `measureOnce`. */
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
}): { rect: TargetRect | null; measuredAt: number } {
  const targets = useTutorialTargets();
  const reduceMotion = useReducedMotion();
  const [rect, setRect] = useState<TargetRect | null>(null);
  // A scroll is in flight, so `rect` is deliberately null and the layout subscriber must not paint a
  // half-way position over it.
  const [settling, setSettling] = useState(false);
  // Bumped wherever a measurement sequence CONCLUDES — whether or not it produced a rect.
  //
  // The distinction is the point. A consumer that keys on the rect alone has no signal for "we finished
  // measuring and the answer was nothing", so a gate opened by a new rect stays shut forever after one
  // timed-out re-measure. That is not hypothetical here: the settle re-measure fires on the heaviest
  // frame of the beat, and the caller's rotation fence gates BOTH touch pass-through and the a11y fence.
  const [measuredAt, setMeasuredAt] = useState(0);
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
      setMeasuredAt((n) => n + 1);
      return;
    }

    void (async () => {
      const first = await measureOnce(targets, targetId, () => stale, setRect);
      if (stale) return;

      // Still nothing after the retry. The arc invariant (`guardianSubjects.test.ts`) proves every beat's
      // seeded state renders its subject, so this is a measurement problem, not an absent control: the
      // beat keeps its copy and loses only its ring. Nothing here may change what the dock SAYS —
      // a measurement must never decide what the dock says.
      if (!first) {
        setRect(null);
        setSettling(false);
        setMeasuredAt((n) => n + 1);
        return;
      }

      const delta = scrollDelta(first, stageTop, stageBottom);
      if (Math.abs(delta) < 1) {
        setRect(first);
        setSettling(false);
        setMeasuredAt((n) => n + 1);
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
          // The SAME retry as the first measure, and this is the site that needed it most: it fires
          // 380ms after a stage-scroll — the heaviest frame in the beat, the one the scroll itself
          // caused — so it's the likeliest to time out. Timing out here set `rect` null after a
          // *successful* first measure, losing the ring permanently.
          const settled = await measureOnce(targets, targetId, () => stale, setRect);
          if (stale) return;
          setRect(settled);
          setSettling(false);
          setMeasuredAt((n) => n + 1);
        })();
      }, reduceMotion ? 0 : SETTLE_MS);
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
        // The SAME retry as every other `measure` call site — a null here means "couldn't measure right
        // now" just as often as it means a miss, and this path has no other trigger to reschedule it.
        const next = await measureOnce(targets, targetId, () => stale || settlingRef.current, noop);
        // Re-checked AFTER the await, not just before it — the await is the window the race lives in.
        if (stale || settlingRef.current) return;
        // A null means "couldn't measure right now" — a 500ms timeout, or a subject mid-transition that
        // measures 0×0 — NOT "the subject is gone". Beat changes are the main effect's job, so nothing
        // here should ever DEMOTE a rect that was already good. It used to: `sameRect(prev, null)` is
        // false, so a null went straight through the setter below, and nothing rescheduled (revision
        // hasn't changed, and a settled screen fires no further layout). One timed-out reflow —
        // Dynamic Type, an iPad Split View drag, the card growing when Recovery renders, i.e. exactly
        // the events [E5]/[B4] added this subscriber FOR — permanently lost the ring and its cutout.
        if (next === null) return;
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

  // `settling` is deliberately NOT returned. It stays internal (the layout subscriber reads it through
  // `settlingRef` to avoid re-measuring mid-transit), but round 6 removed its only external consumer:
  // the overlay used it to tell a travelling null from an absent one, and now renders the same scrim for
  // both. A published value with no reader is the thing the next audit finds.
  return { rect, measuredAt };
}

/**
 * Measure, and RETRY ONCE before believing a null.
 *
 * `measure` resolves null on a 500ms timeout as well as on a genuine miss, and those deserve opposite
 * answers: a real absence is permanent, a timeout is almost always the heavy beat-transition frame.
 * Nothing schedules another attempt — `revision` doesn't change and a static screen fires no layout
 * event — so believing a timed-out null leaves the beat ringless for good, and on an interactive beat
 * that means no scrim at all, with the whole real screen live under copy saying "open it and move the
 * line" while pointing at nothing.
 *
 * `clearOnMiss` drops the PREVIOUS beat's rect before the retry window opens. Without it the old
 * subject's ring stays drawn — and its touch hole stays open at the old coordinates — for up to
 * 500 + 120 + 500ms, passing taps to whatever now occupies that region.
 */
async function measureOnce(
  targets: { measure(id: string): Promise<TargetRect | null> },
  targetId: string,
  isStale: () => boolean,
  clearOnMiss: (rect: TargetRect | null) => void,
): Promise<TargetRect | null> {
  const first = await targets.measure(targetId);
  if (isStale() || first) return first;
  clearOnMiss(null);
  await new Promise((r) => setTimeout(r, RETRY_MS));
  if (isStale()) return null;
  return targets.measure(targetId);
}

/** `measureOnce`'s clear-on-miss hook, for the caller that must NOT clear — see the layout subscriber. */
function noop() {}

function sameRect(a: TargetRect | null, b: TargetRect | null): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

