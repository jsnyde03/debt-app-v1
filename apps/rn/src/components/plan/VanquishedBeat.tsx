import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { CountUp, haptics, useReduceMotion } from '@/motion';
import { colors } from '@/theme/colors';
import { duration, spring } from '@/theme/motion';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

/**
 * The per-debt "vanquished" beat (3.3.1.2) — a CONTAINED celebratory overlay fired each time a debt is
 * confirmed to $0 (but NOT the last; the last triggers the full-screen finale). Because a snowball clears
 * several in a row, this stays light — Reanimated + a gold check-pop, on the constant navy beat panel — so
 * it satisfies without exhausting. Reduce Motion snaps to the final state but keeps the haptic (an a11y
 * channel). The heavy Skia particle spectacle is reserved for the finale.
 */
export function VanquishedBeat({
  visible,
  debtName,
  amountVanquished,
  freedPerMonth,
  nextDebtName,
  onDismiss,
}: {
  visible: boolean;
  debtName: string;
  /** Original balance cleared; `null` when it was never captured (show "Paid off" instead of a figure). */
  amountVanquished: number | null;
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityLabel={`${debtName} paid off. Tap to continue.`}>
        <Animated.View style={[styles.card, panelStyle]} pointerEvents="box-none">
          <LinearGradient colors={[surf.heroTop, surf.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardBg}>
            <Animated.View style={[styles.checkRing, checkStyle]}>
              <AppIcon name="check" size={34} color={colors.surface.goldPillInk.light} />
            </Animated.View>

            <Text style={[textStyles.footnote, styles.eyebrow, { color: surf.heroSub }]}>{debtName.toUpperCase()}</Text>
            <Text style={[styles.gone, { color: surf.heroText }]}>Vanquished</Text>

            {amountVanquished != null ? (
              <CountUp
                value={amountVanquished}
                format={(n) => formatWhole(n)}
                maxFontSizeMultiplier={1.4}
                style={[styles.amount, { color: surf.goldPill }]}
              />
            ) : (
              <Text style={[styles.amount, { color: surf.goldPill }]}>Paid off</Text>
            )}

            {showCascade ? (
              <Animated.Text style={[textStyles.subhead, styles.cascade, cascadeStyle, { color: surf.heroSub }]}>
                Freed {formatWhole(freedPerMonth)}/mo now flows to {nextDebtName}.
              </Animated.Text>
            ) : null}

            <Button label="Keep going" onPress={onDismiss} style={styles.cta} />
          </LinearGradient>
        </Animated.View>
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
  eyebrow: { letterSpacing: 1, fontWeight: '700' },
  gone: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  amount: { fontSize: 40, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'], marginTop: spacing.xs },
  cascade: { textAlign: 'center', marginTop: spacing.sm },
  cta: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
