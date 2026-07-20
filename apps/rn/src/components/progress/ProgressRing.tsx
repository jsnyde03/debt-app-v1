import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

/**
 * A calm circular progress ring (react-native-svg — web-proven; the GPU glow/celebration ring is
 * Skia, per the motion spec). `percent` 0–100; the sweep starts at 12 o'clock. Children render
 * centered (e.g. the % label). Reanimated can drive `percent` later for the fill-on-enter.
 */
export function ProgressRing({
  percent,
  size = 104,
  stroke = 10,
  trackColor,
  color,
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  trackColor: string;
  color: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circ * (1 - clamped / 100);
  const c = size / 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
