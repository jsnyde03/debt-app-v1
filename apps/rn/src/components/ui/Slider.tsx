import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useAppColors } from '@/hooks/use-app-colors';

const THUMB = 26;
const TRACK_H = 6;

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
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  accessibilityLabel?: string;
}) {
  const c = useAppColors();
  const [w, setW] = useState(0);

  const setFromX = (x: number) => {
    if (w <= 0) return;
    const ratio = Math.max(0, Math.min(1, x / w));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, stepped)));
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
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value }}
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
  hit: { height: THUMB, justifyContent: 'center' },
  track: { height: TRACK_H, borderRadius: TRACK_H / 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: TRACK_H / 2 },
  thumb: {
    position: 'absolute',
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
