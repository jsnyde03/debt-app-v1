import { PAYCHECK_SEGMENT } from '@core/copy/vocabulary';
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
import { eyebrow, textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

// On-navy semantics: the hero panel is deep navy in BOTH themes, so its accents are the dark-tuned
// token values (they read on navy) — constant, never theme-resolved.
const onNavy = {
  essential: colors.accent.success.dark, // green family — money that's accounted for (required + everyday)
  free: '#dbe6f5', // free-to-spend — a light neutral (truly leftover, not a semantic state)
  suggest: colors.accent.primary.dark, // the recommended move — a suggestion, never an obligation
  warning: colors.accent.warning.dark,
  danger: colors.accent.danger.dark,
};

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
  /**
   * ⛔ **MINUS THE SHORTFALL — the segment is what this paycheck FUNDED, not what is OWED.**
   * [S1 · pass 1 · M4] `requiredTotal` is the request. In a shortfall it exceeds the headline, which is
   * exactly `paycheckAmount`, so the parts summed to more than the whole and the bar — drawn with
   * `flexGrow`, which normalises whatever it is given to the full track — gave no sign of it. Measured:
   *
   *     healthy                        hero 2000 · Required  1000 · Spoken for 400 · Flexible 600 → 2000 ✓
   *     short ($1,000 · bills 1,330)   hero 1000 · Required  1330                                 → 1330 ⛔
   *     short + everyday reserve       hero 1000 · Required  1450 · Spoken for 300                → 1750 ⛔
   *
   * `requiredTotal − shortfall` conserves in all three, and `shortfall` is 0 on every covered cycle, so
   * **no on-track hero can move.** ⚠️ Same shape and same remedy as T6.3 · L4-1 below — take the HELD
   * figure, never the REQUEST — which closed the living-expense route into non-conservation and left the
   * shortfall route open. Two doors, one invariant.
   *
   * ⚠️ The gap itself is not this bar's job and is stated elsewhere on the screen: `statusLabel` renders
   * *"Short this paycheck"* directly beneath, and the Guardian card names the amount.
   */
  const required = Math.max(0, summary.requiredTotal - summary.shortfall);
  // 3.8 [D36] — "Everyday" became "Spoken for": the segment now carries everyday spending AND the money set
  // aside for upcoming bills. Both are accounted-for-but-not-yet-spent, which is what the translucent green
  // has always meant. ⛔ Named "Spoken for" and not "Set aside" — that is the gig app's brand term, which
  // this app deliberately does not borrow (see `PaydayGuardianCard`) — nor "Reserved", which would name a
  // different figure than the Money tab's hero does.
  // ⛔ [T6.3 · L4-1] `everydayHeld`, NOT `everydayReserve`. The reserve is the REQUEST (the enabled items'
  // raw sum); the engine clamps it to what the paycheck can actually hold and absorbs the rest silently.
  // Two things broke on the difference:
  //   1. This hero PARTITIONS the paycheck, and the request is not part of it — with a $300 paycheck and a
  //      $400 request the segments summed to $400 of a $300 paycheck, so the bar overflowed and `free`
  //      clamped to 0 to hide it. A partition that does not conserve is not a partition.
  //   2. T5 moved `SpokenForSheet` onto the held figure while this stayed on the request, so the legend
  //      and the sheet it opens disagreed by the whole shortfall — L4-1 as a $486/$486.34 rounding
  //      mismatch, but an order of magnitude worse and immune to any formatter fix.
  const everyday = Math.max(0, summary.everydayHeld);
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
    { key: 'required', label: PAYCHECK_SEGMENT.required, value: required, color: onNavy.essential, ring: false, fill: 1 },
    { key: 'spokenFor', label: PAYCHECK_SEGMENT.spokenFor, value: spokenFor, color: onNavy.essential, ring: true, fill: 0.5 },
    // T4.2 — the words live in @core/copy/vocabulary, which also states the cushion/safety-net disjointness rule.
    { key: 'free', label: PAYCHECK_SEGMENT.flexible, value: free, color: onNavy.free, ring: true, fill: 0.5 },
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
    `This paycheck ${formatWhole(paycheck)}.`,
    segments.map((seg) => `${seg.label} ${formatWhole(seg.value)}`).join(', ') + '.',
    suggestLabel ? `Suggested: ${suggestLabel}, ${formatWhole(suggestTotal)}.` : '',
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
          format={formatWhole}
          // At AX5 an unbounded 40pt figure scales past anything the layout can hold. `lint:type-scale`
          // is what keeps that true of every large figure rather than of the ones somebody remembered.
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
              Suggested · {formatWhole(suggestTotal)} · {suggestLabel}
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
              <Text style={[styles.legendValue, { color: s.heroText }]}>{formatWhole(seg.value)}</Text>
            </>
          );
          return tappable ? (
            <Pressable
              key={seg.key}
              onPress={onOpenSpokenFor}
              accessibilityRole="button"
              // Names the split it opens, so the control says what it does rather than repeating the total.
              accessibilityLabel={`${PAYCHECK_SEGMENT.spokenFor} ${formatWhole(seg.value)}. Everyday ${formatWhole(everyday)}, expenses ${formatWhole(billsReserve)}. See the breakdown.`}
              hitSlop={8}
              style={styles.legendItem}>
              {body}
            </Pressable>
          ) : (
            <View key={seg.key} style={styles.legendItem} accessible accessibilityLabel={`${seg.label} ${formatWhole(seg.value)}`}>
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
          accessibilityLabel={windfall > 0 ? `Extra income ${formatWhole(windfall)} this paycheck, edit` : 'Add extra income'}
          style={styles.windfallRow}>
          <AppIcon name="add-circle-outline" size={15} color={windfall > 0 ? s.goldPill : s.heroSub} />
          <Text style={[textStyles.caption, { color: windfall > 0 ? s.goldPill : s.heroSub, fontWeight: windfall > 0 ? '700' : '400' }]}>
            {windfall > 0 ? `${formatWhole(windfall)} extra this paycheck` : 'Add extra income'}
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
  eyebrow: { ...eyebrow, fontWeight: '700' },
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
