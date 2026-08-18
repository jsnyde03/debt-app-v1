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
import { duration } from '@/theme/motion';
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
  windfall = 0,
  onAddWindfall,
  onEditPaycheck,
  onOpenSpokenFor,
}: {
  summary: PlanSummary;
  recommended: ActiveRecommendedAction[];
  nextPaycheckDate: string;
  windfall?: number;
  onAddWindfall?: () => void;
  onEditPaycheck?: () => void;
  /** 3.8.5 — opens the "Spoken for" split (everyday vs bills). Omitted → the legend item is inert. */
  onOpenSpokenFor?: () => void;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const s = c.surface;

  const paycheck = summary.requiredTotal + summary.remainingAfterRequired;
  const required = Math.max(0, summary.requiredTotal);
  // 3.8 [D36] — "Everyday" became "Spoken for": the segment now carries everyday spending AND the money set
  // aside for upcoming bills. Both are accounted-for-but-not-yet-spent, which is what the translucent green
  // has always meant. ⛔ Named "Spoken for" and not "Set aside" — that is the gig app's brand term, which
  // this app deliberately does not borrow (see `PaydayGuardianCard`) — nor "Reserved", which would name a
  // different figure than the Money tab's hero does.
  const everyday = Math.max(0, summary.everydayReserve);
  const billsReserve = Math.max(0, summary.billsReserve);
  const spokenFor = everyday + billsReserve;
  const free = Math.max(0, summary.remainingAfterRequired - spokenFor);

  // Draw-on: the total rolls up from 0 and the split bar wipes in from the left. Reduce Motion snaps.
  const reduce = useReducedMotion();
  const [shownPaycheck, setShownPaycheck] = useState(0);
  const grow = useSharedValue(0);
  useEffect(() => {
    setShownPaycheck(paycheck);
    grow.value = reduce ? 1 : withTiming(1, { duration: duration.slow, easing: Easing.out(Easing.cubic) }); // COH-6: token
  }, [paycheck, reduce, grow]);
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.value }] }));

  // Three buckets summing to the paycheck, two hues: the green "accounted-for" family (Required =
  // solid/fixed, Everyday = translucent/variable-but-reserved) + the neutral truly-free remainder.
  const segments = [
    { key: 'required', label: 'Required', value: required, color: onNavy.essential, ring: false, fill: 1 },
    { key: 'spokenFor', label: 'Spoken for', value: spokenFor, color: onNavy.essential, ring: true, fill: 0.5 },
    { key: 'free', label: 'Flexible', value: free, color: onNavy.free, ring: true, fill: 0.5 }, // VIS-4/Guardian Tier-3: "Free"→"Flexible" (Jason ✓) — names the discretionary money, distinct from the Guardian's protected "Cushion"
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
        ? 'Short this paycheck'
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
      testID="plan-hero"
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
        <CountUp
          value={shownPaycheck}
          format={money0}
          // T3B (audit L5-7) — the three tab heroes were the ONLY large figures with no font-scale cap,
          // while 13 other large-number sites already carry one. At AX5 a 40pt figure scales unbounded.
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={[styles.amount, { color: s.heroText }]}
        />

        {/* the split — Required (solid, mandatory) + Safe (translucent, flexible); wipes in on mount */}
        <Animated.View style={[styles.bar, barStyle]}>
          {segments.map((seg) => (
            <View key={seg.key} style={[styles.seg, { flexGrow: seg.value, backgroundColor: seg.color, opacity: seg.fill }]} />
          ))}
        </Animated.View>

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

      {/* 3.8.5 — the legend sits OUTSIDE the `accessible` summary above, deliberately.
          ⛔ That block is a single a11y node, so a button nested inside it is unreachable to VoiceOver —
          a WCAG 2.2 AA failure, and exactly the "guard covers 2 of 4" shape this app keeps re-learning.
          The summary still announces every segment and its value, so nothing is lost by moving the legend
          out; what is gained is that "Spoken for" can be a real, focusable button. */}
      <View style={styles.legend}>
        {segments.map((seg) => {
          const tappable = seg.key === 'spokenFor' && !!onOpenSpokenFor;
          const body = (
            <>
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
                {tappable ? <AppIcon name="chevron-right" size={13} color={s.heroSub} /> : null}
              </View>
              <Text style={[styles.legendValue, { color: s.heroText }]}>{money0(seg.value)}</Text>
            </>
          );
          return tappable ? (
            <Pressable
              key={seg.key}
              onPress={onOpenSpokenFor}
              accessibilityRole="button"
              // Names the split it opens, so the control says what it does rather than repeating the total.
              accessibilityLabel={`Spoken for ${money0(seg.value)}. Everyday ${money0(everyday)}, bills ${money0(billsReserve)}. See the breakdown.`}
              hitSlop={8}
              style={styles.legendItem}>
              {body}
            </Pressable>
          ) : (
            <View key={seg.key} style={styles.legendItem} accessible accessibilityLabel={`${seg.label} ${money0(seg.value)}`}>
              {body}
            </View>
          );
        })}
      </View>

      <View style={styles.statusRow}>
        <AppIcon name={summary.status === 'on-track' ? 'check-circle' : 'error-outline'} size={15} color={statusColor} />
        <Text style={[textStyles.footnote, styles.status, { color: statusColor }]}>{reassurance}</Text>
      </View>

      {onAddWindfall ? (
        <Pressable
          onPress={onAddWindfall}
          accessibilityRole="button"
          accessibilityLabel={windfall > 0 ? `Extra income ${money0(windfall)} this paycheck, edit` : 'Add extra income'}
          style={styles.windfallRow}>
          <AppIcon name="add-circle-outline" size={15} color={windfall > 0 ? s.goldPill : s.heroSub} />
          <Text style={[textStyles.caption, { color: windfall > 0 ? s.goldPill : s.heroSub, fontWeight: windfall > 0 ? '700' : '400' }]}>
            {windfall > 0 ? `${money0(windfall)} extra this paycheck` : 'Add extra income'}
          </Text>
        </Pressable>
      ) : null}
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
  // T3B (audit L5-7): `flexWrap` + per-item `flexShrink`. Three 17pt five-digit values do not fit one
  // 375pt row, and with no wrap and no shrink the third was pushed off rather than reflowed.
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.md },
  legendItem: { gap: 3, flexShrink: 1 },
  legendHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendValue: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  suggestText: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  status: { fontWeight: '600' },
  windfallRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
});
