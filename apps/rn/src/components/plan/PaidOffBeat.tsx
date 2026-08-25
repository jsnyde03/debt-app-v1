import { PAID_OFF_LABEL, SHARE_WIN_CTA } from '@core/copy/vocabulary';
import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ShareCard } from '@/components/plan/ShareCard';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { CountUp, haptics, useReduceMotion } from '@/motion';
import { colors } from '@/theme/colors';
import { duration, spring } from '@/theme/motion';
import { layout, spacing } from '@/theme/spacing';
import { eyebrow, textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';
import { reportError } from '@/utils/reportError';
import { shareDebtCard } from '@/utils/share-card';
import { decorative } from '@/utils/a11y';

/**
 * The per-debt "paid off" beat (3.3.1.2) — a CONTAINED celebratory overlay fired each time a debt is
 * confirmed to $0 (but NOT the last; the last triggers the full-screen finale). Because a snowball clears
 * several in a row, this stays light — Reanimated + a gold check-pop, on the constant navy beat panel — so
 * it satisfies without exhausting. Reduce Motion snaps to the final state but keeps the haptic (an a11y
 * channel). The heavy Skia particle spectacle is reserved for the finale.
 */
export function PaidOffBeat({
  visible,
  debtName,
  amountPaidOff,
  freedPerMonth,
  nextDebtName,
  onDismiss,
}: {
  visible: boolean;
  debtName: string;
  /** Original balance cleared; `null` when it was never captured (show "Paid off" instead of a figure). */
  amountPaidOff: number | null;
  /** Freed minimum that now cascades to the next debt; only shown with a `nextDebtName`. */
  freedPerMonth: number;
  nextDebtName: string | null;
  onDismiss: () => void;
}) {
  const c = useAppColors();
  const reduce = useReduceMotion();
  const surf = c.surface;

  const panel = useSharedValue(0);
  const check = useSharedValue(0);
  const cascade = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      panel.value = 0;
      check.value = 0;
      cascade.value = 0;
      return;
    }
    if (reduce) {
      panel.value = 1;
      check.value = 1;
      cascade.value = 1;
      haptics.success();
      return;
    }
    panel.value = withSpring(1, spring.default);
    check.value = withDelay(200, withSpring(1, spring.bouncy));
    cascade.value = withDelay(700, withTiming(1, { duration: duration.default }));
    const t = setTimeout(() => haptics.success(), 200); // sync the pop with the check
    return () => clearTimeout(t);
  }, [visible, reduce, panel, check, cascade]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: panel.value,
    transform: [{ scale: 0.96 + 0.04 * panel.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.value, transform: [{ scale: check.value }] }));
  const cascadeStyle = useAnimatedStyle(() => ({ opacity: cascade.value, transform: [{ translateY: 8 * (1 - cascade.value) }] }));

  const showCascade = nextDebtName != null && freedPerMonth > 0;

  // B2 — the per-debt win is shareable too (the moment users hit repeatedly, not just the finale).
  const shareRef = useRef<View>(null);
  async function onShare() {
    try {
      await shareDebtCard(
        shareRef,
        `I just paid off ${debtName}${amountPaidOff != null ? ` — ${formatWhole(amountPaidOff)}` : ''} on my way to debt-free with Debt Planner.`,
        SHARE_WIN_CTA,
      );
    } catch (e) {
      reportError(e, { subsystem: 'share', operation: 'paid-off-beat' });
    }
  }

  // R3-A1 — one VoiceOver utterance for the whole card (name · amount · cascade), which also suppresses
  // the animated CountUp reading mid-roll (a11y.ts's "final value, never mid-roll" doctrine).
  const beatA11y = `${debtName} paid off${amountPaidOff != null ? `, ${formatWhole(amountPaidOff)} paid off` : ' — paid off'}${
    showCascade ? `. ${formatWhole(freedPerMonth)} a month now flows to ${nextDebtName}.` : ''
  }`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      {/* R2-A1 — `accessible={false}` so the backdrop doesn't COLLAPSE the card into one VoiceOver element
          (that made the new Share button unreachable). Backdrop-tap dismiss still works for touch; VO users
          use the Share / Keep going buttons (now individually focusable) or the Modal escape gesture. */}
      <Pressable style={styles.backdrop} onPress={onDismiss} accessible={false}>
        <Animated.View style={[styles.card, panelStyle]} pointerEvents="box-none">
          <LinearGradient colors={[surf.heroTop, surf.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardBg}>
            <Animated.View style={[styles.checkRing, checkStyle]}>
              <AppIcon name="check" size={34} color={colors.surface.goldPillInk.light} />
            </Animated.View>

            <View style={styles.textGroup} accessible accessibilityLabel={beatA11y}>
              <Text style={[textStyles.footnote, styles.eyebrow, { color: surf.heroSub }]} maxFontSizeMultiplier={1.4}>{debtName.toUpperCase()}</Text>
              <Text style={[styles.gone, { color: surf.heroText }]} maxFontSizeMultiplier={1.3}>{PAID_OFF_LABEL}</Text>

              {amountPaidOff != null ? (
                <CountUp
                  value={amountPaidOff}
                  format={(n) => formatWhole(n)}
                  maxFontSizeMultiplier={1.4}
                  style={[styles.amount, { color: surf.goldPill }]}
                />
              ) : (
                <Text style={[styles.amount, { color: surf.goldPill }]} maxFontSizeMultiplier={1.4}>{PAID_OFF_LABEL}</Text>
              )}

              {showCascade ? (
                <Animated.Text style={[textStyles.subhead, styles.cascade, cascadeStyle, { color: surf.heroSub }]} maxFontSizeMultiplier={1.4}>
                  Freed {formatWhole(freedPerMonth)}/mo now flows to {nextDebtName}.
                </Animated.Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <Button label="Share" variant="secondary" onDark onPress={onShare} />
              <Button label="Keep going" onDark onPress={onDismiss} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Off-screen branded card — captured to a PNG by Share (native). A11y-hidden capture artifact. */}
        <View
          ref={shareRef}
          collapsable={false}
          style={styles.offscreen}
          pointerEvents="none"
          aria-hidden
          {...decorative}>
          <ShareCard data={{ kind: 'debt', debtName, amount: amountPaidOff, freedPerMonth }} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(3, 8, 20, 0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 380, borderRadius: layout.cardRadiusLarge, overflow: 'hidden' },
  cardBg: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.sm },
  checkRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surface.goldPill.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  // ⚠️ [P6.8.9.7.11.14.5] Display tracking on the navy takeover, kept deliberately — see `ShareCard`.
  eyebrow: { ...eyebrow, letterSpacing: 1, fontWeight: '700' },
  gone: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  amount: { fontSize: 40, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  cascade: { textAlign: 'center', marginTop: spacing.sm },
  textGroup: { alignItems: 'center', gap: spacing.sm, alignSelf: 'stretch' },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
  offscreen: { position: 'absolute', left: -9999, top: 0 },
});
