import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { JourneyRingCanvas } from '@/components/progress/JourneyRingCanvas';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { CountUp, haptics, useReduceMotion } from '@/motion';
import type { CelebrationStats } from '@/store/celebrationSelectors';
import { duration } from '@/theme/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

/**
 * The grand finale (3.3.1.3) — the once-ever full-screen spectacle when the LAST debt is confirmed to $0.
 * A navy takeover, the reused Skia journey ring sweeping to a gold 100% (with a "$0 balance" centre), a
 * Reanimated gold confetti burst, and the HONEST count-up trio (total vanquished · debts cleared · months
 * to freedom — no fabricated interest-saved). Reduce Motion snaps to the final state + keeps the haptic.
 */

const RING = 208;
const GOLD_PALETTE = {
  track: 'rgba(255,255,255,0.12)',
  from: '#f7cf5f',
  to: '#fbe08a',
  passed: '#f7cf5f',
  next: '#fbe08a',
  dim: 'rgba(255,255,255,0.2)',
  free: '#fbe08a',
};
const CONFETTI = 24;

export function PaidOffFinale({ visible, stats, onDismiss }: { visible: boolean; stats: CelebrationStats; onDismiss: () => void }) {
  const c = useAppColors();
  const reduce = useReduceMotion();
  const surf = c.surface;

  const enter = useSharedValue(0);
  useEffect(() => {
    if (!visible) {
      enter.value = 0;
      return;
    }
    enter.value = reduce ? 1 : withTiming(1, { duration: duration.slow });
    if (reduce) {
      haptics.success();
      return;
    }
    const t = setTimeout(() => haptics.success(), 300); // the crescendo lands with the ring sweep
    return () => clearTimeout(t);
  }, [visible, reduce, enter]);

  const contentStyle = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateY: 14 * (1 - enter.value) }] }));

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <LinearGradient colors={[surf.heroTop, surf.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        {!reduce ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {Array.from({ length: CONFETTI }, (_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </View>
        ) : null}

        <Animated.View style={[styles.content, contentStyle]}>
          <View style={styles.ringWrap} accessible accessibilityLabel="You're debt-free.">
            <JourneyRingCanvas size={RING} stroke={14} pct={100} milestones={[{ t: 100, state: 'free' }]} palette={GOLD_PALETTE} />
            <View style={[StyleSheet.absoluteFill, styles.ringCenter]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text style={[styles.zero, { color: surf.goldPill }]}>$0</Text>
              <Text style={[textStyles.caption, { color: surf.heroSub }]}>balance</Text>
            </View>
          </View>

          <Text style={[styles.headline, { color: surf.heroText }]}>You&rsquo;re debt-free</Text>

          <View style={styles.trio}>
            <FinaleStat value={stats.totalPaid} label="vanquished" money surf={surf} reduce={reduce} />
            <FinaleStat value={stats.debtsCleared} label={stats.debtsCleared === 1 ? 'debt' : 'debts'} surf={surf} reduce={reduce} />
            {stats.monthsToFreedom != null ? (
              <FinaleStat value={stats.monthsToFreedom} label={stats.monthsToFreedom === 1 ? 'month' : 'months'} surf={surf} reduce={reduce} />
            ) : null}
          </View>

          <Button label="Continue" onPress={onDismiss} style={styles.cta} />
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
}

function FinaleStat({ value, label, money, surf, reduce }: { value: number; label: string; money?: boolean; surf: { goldPill: string; heroSub: string }; reduce: boolean }) {
  const fmt = (n: number) => (money ? formatWhole(n) : String(Math.round(n)));
  return (
    <View style={styles.stat}>
      {reduce ? (
        <Text style={[styles.statVal, { color: surf.goldPill }]} maxFontSizeMultiplier={1.3}>{fmt(value)}</Text>
      ) : (
        <CountUp value={value} format={fmt} durationMs={900} maxFontSizeMultiplier={1.3} style={[styles.statVal, { color: surf.goldPill }]} />
      )}
      <Text style={[textStyles.caption, styles.statLabel, { color: surf.heroSub }]}>{label}</Text>
    </View>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  const angle = (index / CONFETTI) * 2 * Math.PI;
  const dist = 150 + (index % 5) * 24;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(index * 12, withTiming(1, { duration: 1150, easing: Easing.out(Easing.quad) }));
  }, [p, index]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: Math.cos(angle) * dist * p.value },
      { translateY: Math.sin(angle) * dist * p.value + 60 * p.value * p.value }, // a little gravity
      { rotate: `${p.value * 420}deg` },
      { scale: 0.7 + 0.5 * p.value },
    ],
  }));
  return <Animated.View style={[styles.confetti, style, { backgroundColor: index % 2 ? '#f7cf5f' : '#fbe08a' }]} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  content: { alignItems: 'center', gap: spacing.md, width: '100%', maxWidth: 420 },
  ringWrap: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  zero: { fontSize: 44, fontWeight: '800', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  headline: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: spacing.sm },
  trio: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.xl, marginTop: spacing.sm },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  statLabel: { textTransform: 'uppercase', letterSpacing: 0.6 },
  cta: { marginTop: spacing.xl, alignSelf: 'stretch' },
  confetti: { position: 'absolute', left: '50%', top: '40%', width: 10, height: 6, borderRadius: 1.5, marginLeft: -5 },
});
