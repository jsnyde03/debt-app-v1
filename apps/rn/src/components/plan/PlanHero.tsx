import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { CountUp } from '@/motion';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ActiveRecommendedAction, PlanSummary } from '@/store/planSelectors';
import { colors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

// On-navy semantics: the hero panel is deep navy in BOTH themes, so its accents are the dark-tuned
// token values (they read on navy) — constant, never theme-resolved.
const onNavy = {
  essential: colors.accent.success.dark, // green family — money that's accounted for (required + everyday)
  free: '#dbe6f5', // free-to-spend — a light neutral (truly leftover, not a semantic state)
  suggest: colors.accent.primary.dark, // the recommended move — a suggestion, never an obligation
  warning: colors.accent.warning.dark,
  danger: colors.accent.danger.dark,
};

const money0 = (n: number) => `$${Math.round(Math.max(0, n)).toLocaleString('en-US')}`;

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The Today hero (Allocation Hero, 2026-07-21): the hero IS this paycheck, split into where it goes.
 * The bar shows the two REAL buckets — **Required** (bills + minimums, the one obligation, solid) and
 * **Safe** (what's left, flexible, translucent) — which sum to the paycheck. The engine's recommended
 * move is shown *beneath* as a clearly-optional suggestion (never a bar segment competing with the
 * obligation), tied in blue to the Recommended card below. Debt-free date is demoted to a slim line
 * (Progress owns it as a headline). Answers "what do I do with THIS paycheck" — Today's uncopyable job.
 */
export function PlanHero({
  summary,
  recommended,
  nextPaycheckDate,
  onEditPaycheck,
}: {
  summary: PlanSummary;
  recommended: ActiveRecommendedAction[];
  nextPaycheckDate: string;
  onEditPaycheck?: () => void;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const s = c.surface;

  const paycheck = summary.requiredTotal + summary.remainingAfterRequired;
  const required = Math.max(0, summary.requiredTotal);
  const everyday = Math.max(0, summary.everydayReserve);
  const free = Math.max(0, summary.remainingAfterRequired - everyday);

  // Draw-on: the total rolls up from 0 and the split bar wipes in from the left. Reduce Motion snaps.
  const reduce = useReducedMotion();
  const [shownPaycheck, setShownPaycheck] = useState(0);
  const grow = useSharedValue(0);
  useEffect(() => {
    setShownPaycheck(paycheck);
    grow.value = reduce ? 1 : withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
  }, [paycheck, reduce, grow]);
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.value }] }));

  // Three buckets summing to the paycheck, two hues: the green "accounted-for" family (Required =
  // solid/fixed, Everyday = translucent/variable-but-reserved) + the neutral truly-free remainder.
  const segments = [
    { key: 'required', label: 'Required', value: required, color: onNavy.essential, ring: false, fill: 1 },
    { key: 'everyday', label: 'Everyday', value: everyday, color: onNavy.essential, ring: true, fill: 0.5 },
    { key: 'free', label: 'Free', value: free, color: onNavy.free, ring: true, fill: 0.5 },
  ].filter((seg) => seg.value > 0);

  // The recommendation is a SUGGESTED use of the safe money — shown as its real (small) self, from
  // the actual recommended action, not derived from the allocation cushion.
  const suggestTotal = recommended.reduce((sum, a) => sum + a.actualAmount, 0);
  const suggestLabel =
    recommended.length === 1 ? recommended[0].label : recommended.length > 1 ? `${recommended.length} suggested moves` : null;

  const statusColor =
    summary.status === 'on-track' ? onNavy.essential : summary.status === 'short' ? onNavy.warning : onNavy.danger;
  const statusLabel =
    summary.status === 'overdue'
      ? 'Overdue payments need attention'
      : summary.status === 'short'
        ? 'Short this cycle'
        : 'On track';
  const reassurance = summary.debtFreeDate ? `${statusLabel} · debt-free by ${summary.debtFreeDate}` : statusLabel;

  const a11y = [
    `This paycheck ${money0(paycheck)}.`,
    segments.map((seg) => `${seg.label} ${money0(seg.value)}`).join(', ') + '.',
    suggestLabel ? `Suggested: ${suggestLabel}, ${money0(suggestTotal)}.` : '',
    reassurance,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <LinearGradient
      colors={[s.heroTop, s.heroBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, elevation.hero[scheme]]}>
      <Pressable
        onPress={onEditPaycheck}
        disabled={!onEditPaycheck}
        accessibilityRole={onEditPaycheck ? 'button' : undefined}
        accessibilityLabel={onEditPaycheck ? 'Edit paycheck' : undefined}
        style={styles.eyebrowRow}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: s.heroSub }]}>
          THIS PAYCHECK · {shortDate(nextPaycheckDate)}
        </Text>
        {onEditPaycheck ? <AppIcon name="edit" size={14} color={s.heroSub} /> : null}
      </Pressable>

      <View accessible accessibilityLabel={a11y}>
        <CountUp value={shownPaycheck} format={money0} style={[styles.amount, { color: s.heroText }]} />

        {/* the split — Required (solid, mandatory) + Safe (translucent, flexible); wipes in on mount */}
        <Animated.View style={[styles.bar, barStyle]}>
          {segments.map((seg) => (
            <View key={seg.key} style={[styles.seg, { flexGrow: seg.value, backgroundColor: seg.color, opacity: seg.fill }]} />
          ))}
        </Animated.View>

        {/* legend — solid dot = obligation, ring = flexible */}
        <View style={styles.legend}>
          {segments.map((seg) => (
            <View key={seg.key} style={styles.legendItem}>
              <View style={styles.legendHead}>
                <View
                  style={[
                    styles.dot,
                    seg.ring
                      ? { borderWidth: 1.5, borderColor: seg.color, backgroundColor: 'transparent' }
                      : { backgroundColor: seg.color },
                  ]}
                />
                <Text style={[textStyles.caption, { color: s.heroSub }]}>{seg.label}</Text>
              </View>
              <Text style={[styles.legendValue, { color: s.heroText }]}>{money0(seg.value)}</Text>
            </View>
          ))}
        </View>

        {/* the suggested move — clearly optional, tied (blue) to the Recommended card below */}
        {suggestLabel && suggestTotal > 0 ? (
          <View style={styles.suggestRow}>
            <View style={[styles.dot, { borderWidth: 1.5, borderColor: onNavy.suggest, backgroundColor: 'transparent' }]} />
            <Text style={[textStyles.caption, styles.suggestText, { color: s.heroSub }]} numberOfLines={1}>
              Suggested · {money0(suggestTotal)} · {suggestLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statusRow}>
        <AppIcon name={summary.status === 'on-track' ? 'check-circle' : 'error-outline'} size={15} color={statusColor} />
        <Text style={[textStyles.footnote, styles.status, { color: statusColor }]}>{reassurance}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: layout.cardRadiusLarge,
    padding: layout.cardPaddingH + 2,
    gap: spacing.md,
    overflow: 'hidden',
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  amount: { fontSize: 40, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'], marginBottom: spacing.sm },
  bar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 3, transformOrigin: 'left' },
  seg: { height: 12, borderRadius: 3, minWidth: 6 },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  legendItem: { gap: 3 },
  legendHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendValue: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  suggestText: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  status: { fontWeight: '600' },
});
