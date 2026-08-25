import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/hooks/use-app-colors';
import { COACH_MARKS } from '@/store/coachMarkCopy';
import { probeCoachMark } from '@/store/coachMarkProbe';
import { coachMarks, useActiveCoachMark, useCoachMarkHosts } from '@/store/coachMarks';
import { useTutorialTargets, type TargetRect } from '@/store/tutorialTargets';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * 3.5.5.1 — the coach-mark primitive: one calm sentence, anchored near the control it names.
 *
 * **Not a spotlight, and that is the design.** The walkthrough dims the screen and cuts a hole, because it
 * is teaching a mental model and needs your whole attention for seven beats. A discovery hint is the
 * opposite errand: you are mid-task on your real money, and the app is mentioning something you might not
 * know exists. So there is no scrim, nothing is fenced, and the control stays live underneath — if the
 * user ignores this entirely and taps the thing, that is a success, not a dismissal.
 *
 * ⚠️ **Mounted at the ROOT, outside the gesture handlers**, alongside `TutorialCoach`. A callout rendered
 * inside a screen sits under the tab bar and inside whatever pan handler owns that screen; the walkthrough
 * already paid for that lesson twice (its overlay began inside Today, then inside the tabs layout, where
 * wrapping `<Tabs>` in a container broke tab presses outright).
 *
 * **iOS-16-safe by omission** — plain `View`/`Text`/`Pressable`, no blur, no material, no newer layout
 * API. `expo-blur` renders nothing on Android without `experimentalBlurMethod` and would make the hint's
 * legibility platform-dependent, which for a one-sentence explanation is a poor trade.
 *
 * Renders nothing unless something is actively marked.
 */
export function CoachMarkLayer({
  nested = false,
  /**
   * 4.1.4c — flips when the host has finished PRESENTING, so the subject can be re-measured where it
   * actually came to rest. `onLayout` answers "does this exist"; it does not answer "has it arrived",
   * and a sheet that springs up from its own height apart makes those two very different questions.
   */
  remeasureOn,
}: { nested?: boolean; remeasureOn?: unknown } = {}) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const targets = useTutorialTargets();
  const active = useActiveCoachMark();
  const hosts = useCoachMarkHosts();
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [calloutH, setCalloutH] = useState(0);
  /** [V2-6] Which mark has already been given room. A ref: this must not cause a render. */
  const revealAskedFor = useRef<string | null>(null);

  // 3.5.5.5 — a nested host announces itself so the root layer can stand down. Both rendering the same
  // callout is not merely a duplicate drawing: the root copy hides behind the sheet on device but stays
  // a live `alert` in the accessibility tree, so the hint is met twice.
  useEffect(() => {
    if (!nested) return;
    return coachMarks.getState().addHost();
  }, [nested]);

  useEffect(() => {
    if (!active || !targets) {
      setRect(null);
      return;
    }
    let cancelled = false;
    // `measure` resolves null on a miss or a 500ms timeout — a subject mid-transition measures 0×0 and is
    // reported as not-ready rather than as an empty rect. A null here means the mark simply does not show,
    // which is the right failure: a hint pointing at nothing is worse than a hint that waited.
    void targets.measure(active).then((r) => {
      // 4.1.4c — the measure result, recorded whether or not this effect was cancelled. A cancelled
      // measurement is itself a candidate mechanism (the layer re-running and discarding the only rect it
      // ever got), so suppressing the record here would hide the thing it is meant to catch.
      probeCoachMark(
        `measure:${active}=${r ? `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}` : 'NULL'}${cancelled ? ' (cancelled)' : ''}`,
      );
      if (!cancelled) setRect(r);
    });
    return () => {
      cancelled = true;
    };
  }, [active, targets, remeasureOn]);

  /**
   * ⛔ **[V2-6] THE RECT IS IN WINDOW COORDINATES, SO A SCROLL INVALIDATES IT — and nothing re-measured.**
   *
   * Found while building V2-6's fix, and it is why the first two attempts failed with *identical* numbers:
   * the page scrolled (the neighbour moved y≈235 → 112) and the callout stayed at y415, because `top` is
   * derived from a `rect` measured once per `active`. ⚡ **The scroll worked; the reading of it did not.**
   *
   * ⚠️ This is a defect in its own right that no lens filed: with a mark up, **scrolling the page left the
   * callout behind while its subject moved out from under it.** V2-6 only made it reproducible on demand.
   *
   * `subscribe` already exists for exactly this ("a registered subject just laid out — its measured rect is
   * stale"); it simply had no scroll-driven caller. The in-flight latch keeps a 16 ms scroll throttle from
   * queueing a measurement per frame.
   */
  useEffect(() => {
    if (!active || !targets) return;
    let inFlight = false;
    let cancelled = false;
    const unsubscribe = targets.subscribe((id) => {
      if (id !== active || inFlight || cancelled) return;
      inFlight = true;
      void targets.measure(active).then((r) => {
        inFlight = false;
        if (!cancelled && r) setRect(r);
      });
    });
    /**
     * ⛔ **`cancelled` WAS DECLARED, READ TWICE, AND ASSIGNED NOWHERE.** [P6.8.9.7.11.5] The cleanup was
     * `subscribe`'s unsubscribe returned bare, so it stopped future notifications and never tripped the
     * flag — and an in-flight `measure()` for the PREVIOUS mark (up to 500 ms late) still resolved into
     * the shared `setRect`, drawing mark B at mark A's coordinates with nothing left to re-measure it.
     * ⚠️ The effect immediately above does this correctly, which is exactly why the shape read as done.
     */
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [active, targets]);

  // 4.1.4c — the layer's final verdict, recorded from an EFFECT rather than from the render body: this
  // component renders on every host/rect change, and a side effect in a render path is exactly the kind
  // of instrument that reports something other than what shipped. Mirrors the returns below.
  useEffect(() => {
    if (!active) return;
    const verdict = !nested && hosts > 0 ? `stoodDownFor(hosts=${hosts})` : !rect ? 'noRect' : !COACH_MARKS[active] ? 'noCopy' : 'DREW';
    probeCoachMark(`draw:${active}=${verdict} nested=${nested ? 1 : 0}`);
    // 4.1.4c — the once-ever record is written HERE, by the layer that actually put pixels on screen,
    // rather than by `show()` which only ever knew a mark had been asked for. `DREW` is the same verdict
    // the probe prints, so the trace and the record can never disagree about what happened.
    if (verdict === 'DREW') coachMarks.getState().markDrawn(active);
  }, [active, rect, hosts, nested]);

  /**
   * ⛔ **[V2-6 · P6.8.9.7.3] WHEN NEITHER PLACEMENT IS CLEAN, MOVE THE PAGE — NOT THE CALLOUT.**
   *
   * Measured at 402×874 on Progress **when `trajectory-scrub` still wrapped the whole card**: it started
   * at y≈570 and ran off the bottom, and the cash-flow card ended at y≈560. A 144 pt callout therefore had
   * **no position on that screen that covered nothing** — below is off-screen, above is the cash-flow
   * card's date axis, legend and verdict, and the top is the hero. V2-6 rated that major and was right.
   * ⚠️ **Those numbers are the ARGUMENT'S ORIGIN, not the current geometry.** `.7.3` moved the subject onto
   * the scrub view inside `TrajectoryChart`, so it is now the 200 pt plot rather than the 362 pt card.
   * Read them as why the reveal exists; do not re-derive placement from them. (P6.8.9.7.10 · D-5.)
   *
   * ⚡ **This is why cluster f's fix made it WORSE.** Correcting the height estimate (132 → 144) is a true
   * fix for the self-occlusion the refuter added — and it moved the callout **22 px further into the
   * neighbour** (y437 → y415), because the above-branch subtracts the height. The finding named the real
   * cure in its own last line: *"the vertical axis still has no neighbour-awareness."* No repositioning can
   * deliver that here; only changing the layout can.
   *
   * ⚠️ **IN AN EFFECT, NOT THE RENDER BODY**, and this file already paid for that lesson: the probe six
   * lines up was moved out of render because *"a side effect in a render path is exactly the kind of
   * instrument that reports something other than what shipped."* It is also what keeps
   * `react-hooks/purity` honest — `lint:rn` green does not mean the tree is purity-clean, since the
   * compiler stops analysing a component once an unanalysable call enters render scope.
   *
   * ⚠️ **Fires at most once per mark.** The scroll re-lays the subject out, `invalidate` re-measures, and
   * this runs again — so without the latch a screen already at its end would ask forever. Keyed on the
   * active mark, so a later mark still gets its turn.
   *
   * ⚠️ `requestReveal` returns false where no scrolling host is registered (a sheet, a short screen), and
   * there the existing placement stands — which is exactly the behaviour every mark had before.
   */
  useEffect(() => {
    if (!active || !rect || !targets) return;
    /**
     * ⛔ **A STOOD-DOWN LAYER MUST NOT ASK FOR A SCROLL.** [P6.8.9.7.11.5] This effect is declared above the
     * `return null` that stands the root layer down under a sheet, and it carried no guard — while the
     * verdict effect thirty lines up guards correctly. With a sheet open, BOTH the root layer and the
     * nested one called `requestReveal`, and there is a single global scroller slot, so a mark belonging to
     * a sheet scrolled **the tab underneath it** — invisibly, twice — while its own callout did not move
     * and the one-shot latch was spent. Mirrors the render guard exactly.
     */
    if (!nested && hosts > 0) return;
    if (revealAskedFor.current === active) return;
    /**
     * ⛔ **WAIT FOR THE MEASUREMENT INSTEAD OF LATCHING AHEAD OF IT.** [P6.8.9.7.11.5] The comment below
     * claimed the measured height and the control flow could never deliver it: `calloutH` is written only
     * from the card's `onLayout`, the card does not render until `rect` exists, and this effect fires on
     * the very commit `rect` arrives — so on the first mark `calloutH` is `0`, `need` took the 144 guess,
     * and the latch on the next line meant the corrected re-run returned immediately.
     * ⚡ **Placement (`roomBelow`, below) DID get the measurement**, because it is computed in the render
     * body and re-runs when the state lands — which is why the claim read true to its author. One value,
     * two consumers, only one of them reachable.
     * ⚠️ Returning here is safe because `calloutH` is a dependency: the layout pass that sets it re-runs
     * this effect, and *that* run does the work with a real number.
     */
    if (calloutH === 0) return;
    const belowY = rect.y + rect.height + 12;
    /**
     * `roomBelow`'s threshold is a hardcoded 140 while the callout measures **144**, so "there is room"
     * could be true of a gap the callout does not fit in. Asking for exactly that gap landed the reveal on
     * the boundary and the overlap survived. `+ 16` is margin, so the result CLEARS rather than ties.
     */
    const need = calloutH + ABOVE_GAP + 16;
    if (winH - belowY - insets.bottom > need) return; // there is already room; nothing to do
    revealAskedFor.current = active;
    /**
     * ⛔ **THE `+ REVEAL_MARGIN` IS THE WHOLE FIX, AND WITHOUT IT THIS TIES EVERY TIME.** Using `need` both
     * to compute the scroll AND to test for room lands the result exactly ON the boundary — `> need` is
     * strict, so it reads false and the callout stays in the above-branch. Measured: it scrolled 121 px of
     * an available 196 and left a 13 px overlap, then 134 px once the rect started tracking.
     * ⚡ Third bug in this one item from a height guess: `132`, `140`, and now a margin that cancelled.
     */
    const needed = belowY - (winH - insets.bottom - need) + REVEAL_MARGIN;
    if (needed > 0) targets.requestReveal(needed);
  }, [active, rect, targets, winH, insets.bottom, calloutH, nested, hosts]);

  // The innermost host draws. Outside any sheet `hosts` is 0 and the root layer behaves exactly as before.
  if (!nested && hosts > 0) return null;
  if (!active || !rect) return null;
  const copy = COACH_MARKS[active];
  if (!copy) return null;

  // Below the control when there is room beneath it, above it otherwise. The subject is the point; a
  // callout that covers it explains something the user can no longer see.
  //
  // ⛔ THE ABOVE-BRANCH USED A HARDCODED 132 AND IT BROKE THAT ONE GUARANTEE ON THE APP'S DEFAULT WIDTH.
  // Measured at 402 pt: the body wraps to two lines, the callout renders **144** px tall, and its bottom
  // edge lands **12 px inside** the trajectory card it exists to explain. At 1194 pt the same copy is one
  // line and 123 px, and clears by 9. So 132 matched neither height — it was the height of one particular
  // wrap of one particular sentence, and every later edit to the copy re-rolled the dice.
  //
  // ⚡ The height is now MEASURED rather than assumed, which is what makes the invariant hold for copy
  // nobody has written yet. The first frame still uses the estimate, because a layout pass has to happen
  // before there is anything to measure; it corrects on the next one, and only in the branch that needs it.
  const below = rect.y + rect.height + 12;
  // ⚠️ [V2-6] The MEASURED height, not a hardcoded 140 — which was less than the callout's real 144, so
  // "there is room" could be true of a gap the callout does not fit in. Same class as the `132` above.
  const roomBelow = winH - below - insets.bottom > (calloutH || ESTIMATED_CALLOUT_H) + ABOVE_GAP;
  const top = roomBelow ? below : Math.max(insets.top + 8, rect.y - (calloutH || ESTIMATED_CALLOUT_H) - ABOVE_GAP);

  // ⚠️ A 22-line copy of the reveal-effect docblock stood here, describing code that had moved into that
  // effect — so the render body carried an explanation of a mechanism it does not implement, and the two
  // copies could drift without either looking wrong. Deleted; the live one is above the effect.
  // (P6.8.9.7.10 · E-5.)

  // 4.1.5.5 — anchor the HORIZONTAL axis to the subject too.
  //
  // ⛔ The defect, measured at 1194×834 before it was explained: subject column `x=388..1166`, callout
  // `x=33..1161` — **the hint about the trajectory chart started 355px left of it, lying across the
  // sidebar rail.** Seen first on a real iPad (`ipad-04`), then reproduced in Chrome in seconds.
  //
  // ⚡ The cause reads clearly once the two axes are put side by side: `top` was derived from `rect` with
  // care, and `left`/`right` were `0`. **One axis was anchored to the subject and the other to the
  // window.** On a phone that is invisible, because the subject spans the full width and the two answers
  // coincide — which is exactly why it shipped and why only an iPad width could show it.
  //
  // ⚠️ A narrow subject must not squeeze the sentence into a ribbon, so the band widens evenly until it
  // can hold one, and never past the screen edge. `spacing.base` is the floor on both sides, which is
  // what `wrap`'s `paddingHorizontal` used to provide — it is removed there so the two cannot double up.
  const rawLeft = Math.max(spacing.base, rect.x);
  const rawRight = Math.max(spacing.base, winW - (rect.x + rect.width));
  const deficit = Math.max(0, MIN_CALLOUT_W - (winW - rawLeft - rawRight));
  const left = Math.max(spacing.base, rawLeft - deficit / 2);
  const right = Math.max(spacing.base, rawRight - deficit / 2);

  return (
    <View style={[styles.wrap, { top, left, right }]} pointerEvents="box-none">
      <View
        // 3.5.6.2 — the callout is identifiable so a test can count it. The nested-host handoff (3.5.5.5)
        // is a claim about there being exactly ONE of these, and a text lookup cannot express that
        // without also matching whatever the copy happens to say.
        testID="coach-mark"
        /**
         * ⛔ **[V2-6 · P6.8.9.7.3] `box-none` HERE TOO — the card was eating taps meant for the app.**
         *
         * This file's opening paragraph promises *"nothing is fenced, and the control stays live
         * underneath — if the user ignores this entirely and taps the thing, that is a success."* The outer
         * wrapper honoured that; **this card did not.** It only went unnoticed because the callout used to
         * land on a chart, where there is nothing to tap.
         *
         * ⚡ Giving the layer room to scroll moved it onto the trajectory card's own What-If and
         * Snowball-or-avalanche rows, and `strategy-compare.spec.ts` immediately timed out clicking a
         * toggle underneath it. **The hint was behaving as a modal after all**, exactly as
         * `coach-marks.spec.ts` says it must not.
         * ⛔ **`box-none` is NOT what fixed that spec.** The spec that ships was fixed by SEEDING
         * `coachMarksSeen`, so it no longer renders a mark at all, and it files the mis-tap as a live
         * residual. Two changes landed in one diff and only one of them was load-bearing — which is how
         * `box-none` came to look verified while nothing exercised it. (P6.8.9.7.10 · E-5.)
         *
         * ⛔ **`box-none` ALONE OPENED ONLY THE PADDING RING.** [P6.8.9.7.11.5] It exempts the card ITSELF
         * and leaves every direct child a hit target — and this card has two: the "Got it" `Pressable`,
         * which must stay live, and the **alert wrapper holding the sentence**, which is most of the
         * card's area. On web the RNW compiler emits `selector > * { pointer-events: auto }`; on iOS a
         * plain `View` is `userInteractionEnabled` and consumes the touch. So *"the control stays live
         * underneath"* was still false over the words, which is where the callout actually sits.
         * ⚠️ The sentence therefore carries `pointerEvents="none"` explicitly (see below). It is not
         * interactive by design — it is read, not touched — so nothing is lost, and VoiceOver is
         * unaffected: `pointerEvents` governs touch routing, not the accessibility tree.
         */
        pointerEvents="box-none"
        // The measurement that replaced the hardcoded offset above. Guarded on a real change so a layout
        // pass triggered by the new `top` cannot feed itself.
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && h !== calloutH) setCalloutH(h);
        }}
        style={[styles.card, { backgroundColor: c.background.secondary, borderColor: c.border.subtle }]}>
        {/* ⛔ `accessible` MOVED OFF THE CARD AND ONTO THE SENTENCE — it was swallowing the dismiss button.
            Marking a container `accessible` collapses its whole subtree into ONE element on iOS, so with
            it on the card the hierarchy showed `coach-mark` as a leaf: `children: 0`, one composed label,
            and **no "Got it" anywhere.** Measured in run 31636187156's dump, at the step that failed
            trying to tap it.

            Two things were broken by one prop, and only one of them was a test problem:
              • VoiceOver got a single `alert` and the dismiss control was neither focusable nor
                activatable — the container is not pressable, so a double-tap did nothing. The affordance
                `more.tsx` calls the whole discovery layer's escape hatch could not be operated.
              • Maestro could not address it either, which is how it was found.

            ⚠️ It stayed invisible because the mark had never RENDERED on a device: the suppressor defect
            meant every prior native run refused it, and the web suite cannot reach an iOS-only mark. A
            control can be unreachable for months if nothing ever draws it.

            The one-utterance property that `accessible` was there for is preserved — it just belongs on
            the TEXT, which is what should be read as one sentence, not on the card that also holds a
            button. */}
        {/* ⛔ The sentence is READ, never touched — and it is most of the card's area, so while it was a
            hit target the promise that "the control stays live underneath" was false wherever it counted.
            `box-none` on the parent does not reach here: it exempts the card itself and leaves its direct
            children interactive. (P6.8.9.7.10 · E-4.) */}
        <View
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${copy.title}. ${copy.body}`}
          pointerEvents="none">
          <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>{copy.title}</Text>
          <Text style={[textStyles.subhead, { color: c.text.secondary }]}>{copy.body}</Text>
        </View>
        <Pressable
          // Addressable in its own right. The label already existed; what it lacked was an element to
          // hang on — and a testID so a flow never has to match the word "Got it", which Today's acks
          // also use (`index.tsx:470/488/505`).
          testID="coach-mark-dismiss"
          onPress={() => coachMarks.getState().dismiss()}
          accessibilityRole="button"
          accessibilityLabel="Got it"
          hitSlop={10}
          style={styles.action}>
          <Text style={[textStyles.subhead, { color: c.accent.primary }]}>Got it</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Narrow enough for a phone gutter, wide enough that one sentence is not a ribbon. Only binds when the
 *  subject is narrower than this — a full-width card never reaches it. */
/**
 * ⚠️ A FIRST-FRAME ESTIMATE ONLY — the real height is measured on layout and takes over. It is deliberately
 * the TALLER of the two observed wraps, so a wrong first frame errs toward sitting too high rather than
 * toward covering the subject, which is the failure this whole branch exists to prevent.
 */
const ESTIMATED_CALLOUT_H = 144;

/** The breathing room between the callout's bottom edge and the subject it points at. */
const ABOVE_GAP = 10;
/** [V2-6] Scroll PAST the boundary, not onto it — see the note at the reveal request. */
const REVEAL_MARGIN = 24;

const MIN_CALLOUT_W = 260;

const styles = StyleSheet.create({
  // `box-none` on the wrapper and nothing full-screen behind it: the screen underneath stays fully
  // interactive, which is what makes this a hint rather than a modal.
  // ⚠️ NO `left`/`right`/`paddingHorizontal` here — they are computed per-mark from the subject's rect
  // (see the note above `rawLeft`). A static inset here is what put the callout across the iPad rail, and
  // leaving one would silently double the gutter on every phone.
  wrap: { position: 'absolute' },
  card: {
    gap: spacing.xxs,
    padding: spacing.base,
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // 44pt — a dismissal is still a tap target.
  action: { minHeight: 44, justifyContent: 'center' },
});
