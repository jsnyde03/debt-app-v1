import { SHARE_WIN_CTA } from '@core/copy/vocabulary';
import { useEffect, useRef } from 'react';
import { Modal, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JourneyRingCanvas } from '@/components/progress/JourneyRingCanvas';
import { MeshGradientCanvas } from '@/components/plan/MeshGradientCanvas';
import { ShareCard } from '@/components/plan/ShareCard';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { CountUp, haptics, useReduceMotion } from '@/motion';
import type { CelebrationStats } from '@/store/celebrationSelectors';
import { duration } from '@/theme/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';
import { reportError } from '@/utils/reportError';
import { shareDebtCard } from '@/utils/share-card';
import { playDebtFreeSound } from '@/utils/debtFreeSound';
import { useAppStore } from '@/store/useAppStore';
import { decorative } from '@/utils/a11y';

/**
 * The grand finale (3.3.1.3) — the once-ever full-screen spectacle when the LAST debt is confirmed to $0.
 * A navy takeover, the reused Skia journey ring at a gold 100% (with a "$0 balance" centre) behind a gold
 * BLOOM flash, a deepened two-wave gold confetti layer that keeps emerging so it BREATHES ~4.7s, the HONEST
 * count-up trio (total paid off · debts cleared · months to freedom — no fabricated interest-saved), and
 * the bespoke `haptics.finale()` Core-Haptics crescendo (VIS-1). Reduce Motion snaps to the final state +
 * keeps the finale haptic.
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
const CONFETTI = 64;
const GOLDS = ['#f7cf5f', '#fbe08a', '#ffd873', '#fff3cf'];

export function PaidOffFinale({ visible, stats, onDismiss }: { visible: boolean; stats: CelebrationStats; onDismiss: () => void }) {
  const c = useAppColors();
  const reduce = useReduceMotion();
  const surf = c.surface;
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const soundEnabled = useAppStore((s) => s.store.prefs.debtFreeSoundEnabled ?? false);

  const enter = useSharedValue(0);
  useEffect(() => {
    if (!visible) {
      enter.value = 0;
      return;
    }
    if (soundEnabled) playDebtFreeSound(); // opt-in chime (no-op on web / when off)
    enter.value = reduce ? 1 : withTiming(1, { duration: duration.slow });
    if (reduce) {
      haptics.finale();
      return;
    }
    // Fire near-immediately: the crescendo builds for ~0.9s so its peak lands as the ring reads 100%.
    const t = setTimeout(() => haptics.finale(), 80);
    return () => clearTimeout(t);
  }, [visible, reduce, enter, soundEnabled]);

  const contentStyle = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateY: 14 * (1 - enter.value) }] }));

  // VIS-2 — capture the off-screen branded ShareCard to a PNG + open the share sheet (native); on web
  // it shares text / alerts (share-card.web.ts). Failures are reported, never surfaced to the user.
  const shareRef = useRef<View>(null);
  async function onShare() {
    try {
      await shareDebtCard(shareRef, `I’m debt-free — I paid off ${formatWhole(stats.totalPaid)} with Debt Planner.`);
    } catch (e) {
      reportError(e, { subsystem: 'share', operation: 'finale-card' });
    }
  }

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <LinearGradient colors={[surf.heroTop, surf.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
        {/* Ambient mesh wash over the navy base — adds depth (static, calm; kept under Reduce Motion). */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <MeshGradientCanvas width={winW} height={winH} />
        </View>
        {!reduce ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {Array.from({ length: CONFETTI }, (_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </View>
        ) : null}

        {/* A3 — scrollable so AX Dynamic-Type can overflow instead of pushing the CTAs off-screen. */}
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, contentStyle]}>
          {/* Ring describes its OWN content ($0 balance); the headline below already says "debt-free"
              (avoids VoiceOver reading "debt-free" twice). */}
          <View style={styles.ringWrap} accessible accessibilityLabel="$0 balance">
            {!reduce ? <Bloom color={surf.goldPill} /> : null}
            <JourneyRingCanvas size={RING} stroke={14} pct={100} milestones={[{ t: 100, state: 'free' }]} palette={GOLD_PALETTE} />
            <View style={[StyleSheet.absoluteFill, styles.ringCenter]} pointerEvents="none" {...decorative}>
              <Text style={[styles.zero, { color: surf.goldPill }]} maxFontSizeMultiplier={1.3}>$0</Text>
              <Text style={[textStyles.caption, { color: surf.heroSub }]} maxFontSizeMultiplier={1.4}>balance</Text>
            </View>
          </View>

          <Text style={[styles.headline, { color: surf.heroText }]} maxFontSizeMultiplier={1.3}>You&rsquo;re debt-free</Text>

          <View style={styles.trio}>
            <FinaleStat value={stats.totalPaid} label="paid off" money surf={surf} reduce={reduce} />
            <FinaleStat value={stats.debtsCleared} label={stats.debtsCleared === 1 ? 'debt' : 'debts'} surf={surf} reduce={reduce} />
            {stats.monthsToFreedom != null ? (
              <FinaleStat value={stats.monthsToFreedom} label={stats.monthsToFreedom === 1 ? 'month' : 'months'} surf={surf} reduce={reduce} />
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button label={SHARE_WIN_CTA} variant="secondary" onDark onPress={onShare} />
            <Button label="Continue" onDark onPress={onDismiss} />
          </View>
        </Animated.View>
        </ScrollView>

        {/* Off-screen branded card — captured to a PNG by the Share action (native). Hidden from screen
            readers (a capture-only artifact) and non-interactive. */}
        <View
          ref={shareRef}
          collapsable={false}
          style={styles.offscreen}
          pointerEvents="none"
          aria-hidden
          {...decorative}>
          <ShareCard data={{ kind: 'finale', totalPaid: stats.totalPaid, debtsCleared: stats.debtsCleared, monthsToFreedom: stats.monthsToFreedom }} />
        </View>
      </LinearGradient>
    </Modal>
  );
}

function FinaleStat({ value, label, money, surf, reduce }: { value: number; label: string; money?: boolean; surf: { goldPill: string; heroSub: string }; reduce: boolean }) {
  const fmt = (n: number) => (money ? formatWhole(n) : String(Math.round(n)));
  return (
    // A4 — one utterance ("$4,200 paid off"), not two disconnected reads.
    <View style={styles.stat} accessible accessibilityLabel={`${fmt(value)} ${label}`}>
      {reduce ? (
        <Text style={[styles.statVal, { color: surf.goldPill }]} maxFontSizeMultiplier={1.3}>{fmt(value)}</Text>
      ) : (
        <CountUp value={value} format={fmt} durationMs={900} maxFontSizeMultiplier={1.3} style={[styles.statVal, { color: surf.goldPill }]} />
      )}
      <Text style={[textStyles.caption, styles.statLabel, { color: surf.heroSub }]} maxFontSizeMultiplier={1.3}>{label}</Text>
    </View>
  );
}

/** A soft gold flash that blooms out from behind the ring as the crescendo crests. */
function Bloom({ color }: { color: string }) {
  const b = useSharedValue(0);
  useEffect(() => {
    b.value = withDelay(650, withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }));
  }, [b]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(b.value, [0, 0.25, 1], [0, 0.3, 0]),
    transform: [{ scale: 0.4 + 1.7 * b.value }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.bloom, style, { backgroundColor: color }]} />;
}

function ConfettiPiece({ index }: { index: number }) {
  // Two waves (the second a beat behind) so particles keep emerging → the layer breathes ~4.7s.
  const half = CONFETTI / 2;
  const wave = index >= half ? 1 : 0;
  const inWave = index % half;
  const angle = (index / CONFETTI) * 2 * Math.PI + (index % 3) * 0.3;
  const dist = 150 + (index % 9) * 34; // wider spread → fills the screen, not a mid-band cluster (B6)
  const delay = wave * 850 + inWave * 45;
  const fall = 1900 + (index % 5) * 200; // 1900–2700ms per piece
  const spin = wave ? -400 : 460;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: fall, easing: Easing.out(Easing.cubic) }));
  }, [p, delay, fall]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.1, 0.75, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: Math.cos(angle) * dist * p.value + Math.sin(p.value * 6) * 6 }, // spread + wobble
      { translateY: Math.sin(angle) * dist * p.value + 90 * p.value * p.value }, // gravity
      { rotate: `${p.value * spin}deg` },
      { scale: 0.6 + 0.6 * p.value },
    ],
  }));
  // Shape variety: streamer / square / dot.
  const shapeStyle = index % 3 === 0 ? styles.streamer : index % 3 === 1 ? styles.square : styles.dot;
  return <Animated.View style={[styles.confetti, shapeStyle, style, { backgroundColor: GOLDS[index % GOLDS.length] }]} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  content: { alignItems: 'center', gap: spacing.md, width: '100%', maxWidth: 420 },
  ringWrap: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  bloom: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2 },
  zero: { fontSize: 44, fontWeight: '800', letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  headline: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: spacing.sm },
  trio: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.xl, marginTop: spacing.sm },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  statLabel: { textTransform: 'uppercase', letterSpacing: 0.6 },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.xl },
  offscreen: { position: 'absolute', left: -9999, top: 0 },
  confetti: { position: 'absolute', left: '50%', top: '40%', marginLeft: -5 },
  streamer: { width: 11, height: 5, borderRadius: 1.5 },
  square: { width: 7, height: 7, borderRadius: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
