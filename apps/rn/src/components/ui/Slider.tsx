import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useAppColors } from '@/hooks/use-app-colors';
import { haptics } from '@/motion';
import { a11yAdjustableValue } from '@/utils/a11y';
import { formatWhole } from '@/utils/format';

const THUMB = 26;
const TRACK_H = 6;
// [C4] The touch strip, independent of the thumb's size. Kept as a constant because the thumb is
// ABSOLUTELY positioned inside it — `justifyContent` doesn't reach an absolute child, so the moment the
// strip stopped being exactly thumb-height the thumb needed its own explicit centring or it would have
// silently ridden up to the top edge while the track stayed centred.
const HIT_H = 44;

/**
 * A themed value slider (track + accent fill + thumb). Drag or tap anywhere on the track to set the
 * value; snaps to `step`. Gesture callbacks run on the JS thread (`runOnJS(true)`) so it needs no
 * worklets and behaves the same on web and native. Controlled: `value` in → thumb position out.
 */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  accessibilityLabel,
  testID,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  accessibilityLabel?: string;
  /** For the native (Maestro) suite. The root is `accessible`, which collapses its descendants into one
   *  composite element on iOS — and a composite's LABEL is not reliably matchable there, which is why the
   *  tab bar needed ids for the same reason. A drag is the one gesture the web suite cannot really
   *  perform, so the native flow needs a dependable handle on this control. */
  testID?: string;
}) {
  const c = useAppColors();
  const [w, setW] = useState(0);
  // Track the last emitted value so a drag ticks the haptic once PER step crossed (a detent), not per pixel.
  const lastRef = useRef(value);

  const setFromX = (x: number) => {
    if (w <= 0) return;
    const ratio = Math.max(0, Math.min(1, x / w));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));
    if (clamped !== lastRef.current) {
      haptics.light();
      lastRef.current = clamped;
    }
    onChange(clamped);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin((e) => setFromX(e.x))
    .onUpdate((e) => setFromX(e.x));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => setFromX(e.x));
  const gesture = Gesture.Simultaneous(tap, pan);

  const pct = max > min ? (value - min) / (max - min) : 0;
  const fillW = w * pct;
  const thumbX = Math.max(0, Math.min(w - THUMB, fillW - THUMB / 2));

  const clampStep = (v: number) => Math.max(min, Math.min(max, Math.round(v / step) * step));

  return (
    <GestureDetector gesture={gesture}>
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={styles.hit}
        // `accessible` is what makes this a focusable a11y ELEMENT. Without it the role, value and
        // actions below are inert: the View isn't in the tree at all, and its children are bare Views
        // with no text, so nothing inside is focusable either. The slider was simply absent to
        // VoiceOver — which made the tutorial's "move the line" beat impossible to complete, and any
        // premium user's cushion line unadjustable. Found by the 3.5.3.9 audit; a previous review had
        // seen the three props below and concluded the capability was met without checking this one.
        accessible
        testID={testID}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        // ⛔ VIA THE HELPER, NOT `accessibilityValue`. That prop is native-only — react-native-web's
        // allowlist drops it silently, so this rendered `role="slider"` with no `aria-valuenow`: a
        // slider that never reports its value, a WCAG AA failure, and invisible to `a11y-axe`. It
        // matters now because 3.5.7's public embed is the surface that makes it public.
        // `text` is load-bearing, not decoration: `now` alone is spoken as a bare number ("200"),
        // which is meaningless for money. See `a11yAdjustableValue`.
        //
        // ⛔ [P6.4.2] This said `$${value}` and it was a REAL VoiceOver defect, not a tidy-up: the
        // what-if slider runs to $5,000 (`sliderMax`, `analysisSelectors`), so a screen reader was
        // being handed "$5000" with no thousands separator — byte-for-byte the defect that justified
        // `lint:money` in the first place, sitting under a comment reasoning about how money should
        // sound. ⚠️ Both consumers are money (`WhatIfControls`, `CushionFloorSheet`); if a non-money
        // slider is ever added, this takes a `formatValue` prop rather than losing the formatter.
        {...a11yAdjustableValue(min, max, value, formatWhole(value))}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(ev) => {
          if (ev.nativeEvent.actionName === 'increment') onChange(clampStep(value + step));
          else if (ev.nativeEvent.actionName === 'decrement') onChange(clampStep(value - step));
        }}>
        <View style={[styles.track, { backgroundColor: c.background.tertiary }]}>
          <View style={[styles.fill, { width: fillW, backgroundColor: c.accent.primary }]} />
        </View>
        {w > 0 ? (
          <View
            style={[
              styles.thumb,
              { left: thumbX, backgroundColor: c.accent.primary, borderColor: c.background.secondary },
            ]}
          />
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // [C4] 44pt, not the 26pt thumb. The touch strip used to be exactly as tall as the thumb, so a drag
  // that started a few points high or low missed entirely — on the one control the walkthrough REQUIRES
  // the user to operate, and on the control a premium user sets their cushion with. The thumb and track
  // are absolutely/centre-positioned within this, so nothing moves visually; only the strip that accepts
  // the touch gets taller.
  hit: { height: HIT_H, justifyContent: 'center' },
  track: { height: TRACK_H, borderRadius: TRACK_H / 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: TRACK_H / 2 },
  thumb: {
    position: 'absolute',
    top: (HIT_H - THUMB) / 2, // see HIT_H — absolute children don't get the container's centring
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    // A subtle lift so the thumb reads as a control above the track.
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
