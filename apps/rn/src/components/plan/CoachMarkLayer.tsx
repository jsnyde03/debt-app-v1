import { useEffect, useState } from 'react';
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

  // The innermost host draws. Outside any sheet `hosts` is 0 and the root layer behaves exactly as before.
  if (!nested && hosts > 0) return null;
  if (!active || !rect) return null;
  const copy = COACH_MARKS[active];
  if (!copy) return null;

  // Below the control when there is room beneath it, above it otherwise. The subject is the point; a
  // callout that covers it explains something the user can no longer see.
  const below = rect.y + rect.height + 12;
  const roomBelow = winH - below - insets.bottom > 140;
  const top = roomBelow ? below : Math.max(insets.top + 8, rect.y - 132);

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
        <View accessible accessibilityRole="alert" accessibilityLabel={`${copy.title}. ${copy.body}`}>
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
