import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { CushionBarCanvas } from '@/components/plan/CushionBarCanvas';
import { CushionFloorSheet } from '@/components/plan/CushionFloorSheet';
import { useAppColors } from '@/hooks/use-app-colors';
import type { GuardianBrief, GuardianState, TightTopUp } from '@/store/guardianSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

const BAR_H = 14;

/**
 * Payday Cushion Guardian card (2.4) — the premium headline on Today, and an ACTOR: premium holds your
 * cushion at your line before any extra payoff, and this card shows what it did. Centerpiece is the
 * Skia cushion bar ([cushion held] + [to payoff], with your floor drawn as a line). Calm register — the
 * bar's one quiet fill, no count-up/haptic ([[match motion to surface job]]). Gating is value-led:
 * free sees the real read + the line it isn't held to, with an honest invitation — never a lock.
 */
export function PaydayGuardianCard({
  brief,
  isPremium,
  onSeeForecast,
  topUp,
  onTopUp,
}: {
  brief: GuardianBrief;
  isPremium: boolean;
  onSeeForecast?: () => void;
  /** §2.10 tight-case (2.4.11.2) — the "move $X from savings to hold your line" one-tap, when available. */
  topUp?: TightTopUp | null;
  onTopUp?: () => void;
}) {
  const c = useAppColors();
  const [barW, setBarW] = useState(0);
  const [floorSheet, setFloorSheet] = useState(false);

  const tone: Record<GuardianState, { color: string; icon: IconGlyph }> = {
    clear: { color: c.text.secondary, icon: 'gpp-good' }, // slate — green means progress elsewhere
    tight: { color: c.accent.warning, icon: 'gpp-maybe' },
    'at-risk': { color: c.accent.danger, icon: 'gpp-bad' },
  };
  // §2.0.d stale cutoff: no color-coded verdict. Neutral shield + a dimmed bar (its proportions rest on
  // stale inputs) + an "Update needed" chip — the card says "I can't see far enough", not clear/tight/at-risk.
  const stale = brief.staleAdvisory === true;
  const { color, icon } = stale ? { color: c.text.tertiary, icon: 'update' as IconGlyph } : tone[brief.state];

  // Bar domain reaches at least the floor, so the line is always on the bar (the under-floor gap shows).
  const domain = Math.max(brief.cushion + brief.deployedToDebt, brief.floor, 1);
  const hasPayoff = brief.deployedToDebt > 0;
  const hasReserve = brief.heldReserve > 0;
  // "Adjust your line" only makes sense when you're covered — hidden in at-risk/shortfall (lowering your
  // safety line is the wrong move) and while stale (the move is "update your numbers", not "adjust").
  const showAdjust = isPremium && !stale && brief.state !== 'at-risk';

  return (
    <Card>
      <View
        {...groupLabel(
          'Payday Guardian',
          brief.title,
          brief.detail,
          isPremium ? brief.safeMove : 'Premium keeps your cushion at your line automatically, all on your device',
          isPremium ? brief.lookahead : undefined,
        )}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>PAYDAY GUARDIAN</Text>

        <View style={styles.head}>
          <AppIcon name={icon} size={22} color={color} />
          <Text style={[textStyles.title3, styles.title, { color }]}>{brief.title}</Text>
          {stale ? (
            <View style={[styles.chip, { backgroundColor: c.background.secondary, borderColor: c.border.subtle }]}>
              <Text style={[textStyles.caption, styles.chipText, { color: c.text.tertiary }]}>Update needed</Text>
            </View>
          ) : null}
        </View>

        {/* The cushion bar — the automation made visible. Dimmed while stale (numbers aren't trustworthy). */}
        <View
          style={[styles.barWrap, stale && styles.dimmed]}
          onLayout={(e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width)}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {barW > 0 ? (
            <CushionBarCanvas
              width={barW}
              height={BAR_H}
              cushionFrac={brief.cushion / domain}
              reserveFrac={brief.heldReserve / domain}
              payoffFrac={brief.deployedToDebt / domain}
              floorFrac={brief.floor / domain}
              cushionColor={color}
              payoffColor={c.accent.primary}
              trackColor={c.border.subtle}
              lineColor={c.text.primary}
            />
          ) : null}
        </View>
        {/* 2.4.11.1 presentation reshape — the numbers ARE the read (a stat row, not a paragraph). Each
            stat is its bar zone made legible; the prose detail is kept only where the message matters. */}
        <View
          style={[styles.stats, stale && styles.dimmed]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <Stat dot={color} amount={brief.cushion} label={hasReserve ? `Cushion · ${money(brief.heldReserve)} set aside` : 'Cushion'} />
          {hasPayoff ? <Stat dot={c.accent.primary} amount={brief.deployedToDebt} label={brief.debtFree ? 'To savings' : 'To debt'} /> : null}
          <Stat dot={c.text.primary} tick amount={brief.floor} label="Your line" />
        </View>

        {/* The Guardian's voice — one short line for the states where it carries weight; the calm
            clear/tight reads are told by the title + the stats, so their paragraph is dropped. */}
        {stale || brief.pausedDeploy || brief.state === 'at-risk' ? (
          <Text style={[textStyles.subhead, styles.detail, { color: c.text.secondary }]}>{brief.detail}</Text>
        ) : null}

        <View style={[styles.divider, { backgroundColor: c.border.subtle }]} />

        {isPremium ? (
          <>
            {brief.safeMove ? <Text style={[textStyles.subhead, styles.move, { color: c.text.primary }]}>{brief.safeMove}</Text> : null}
            {brief.lookahead ? <Text style={[textStyles.caption, styles.look, { color: c.text.tertiary }]}>{brief.lookahead}</Text> : null}
            {/* §2.10 tight-case one-tap (2.4.11.2): a REAL move to hold the line — only when the user has
                savings to tap (else the read stays the honest "rebuilds next paycheck"). */}
            {topUp ? (
              <View style={styles.topUp}>
                <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                  You have {money(topUp.available)} in {topUp.goalName} — moving {money(topUp.topUp)} over holds your line this paycheck.
                </Text>
                <Button label={`Move ${money(topUp.topUp)} from savings`} variant="secondary" onPress={() => onTopUp?.()} style={styles.topUpBtn} />
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.invite} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <AppIcon name="workspace-premium" size={18} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.inviteText, { color: c.accent.primary }]}>
              Premium keeps your cushion at your line automatically, all on your device — no deciding each paycheck.
            </Text>
          </View>
        )}
      </View>

      {/* The adjust control lives OUTSIDE the narrated group so a screen reader reaches it as its own
          button (the group's `accessible` collapses its descendants into one utterance). */}
      {showAdjust ? (
        <Pressable onPress={() => setFloorSheet(true)} accessibilityRole="button" accessibilityLabel="Adjust your cushion line" hitSlop={8}>
          <Text style={[textStyles.subhead, styles.adjust, { color: c.accent.primary }]}>Adjust your line →</Text>
        </Pressable>
      ) : null}
      {/* §2.6 drill-down (2.4.7.9) — a pushed route into the full cushion forecast; own a11y button. */}
      {isPremium && onSeeForecast && !stale && !brief.pausedDeploy ? (
        <Pressable onPress={onSeeForecast} accessibilityRole="button" accessibilityLabel="See your cushion forecast" hitSlop={8}>
          <Text style={[textStyles.subhead, styles.adjust, { color: c.accent.primary }]}>See your forecast →</Text>
        </Pressable>
      ) : null}

      {isPremium ? <CushionFloorSheet visible={floorSheet} floor={brief.floor} onClose={() => setFloorSheet(false)} /> : null}
    </Card>
  );
}

/** Exact whole-dollar — the stats match the plan's real figures (the hero shows them exact too); a
 *  concrete amount the user acts on must be correct, not hedged to the nearest $5/$10. */
function money(n: number): string {
  return `$${Math.round(Math.max(0, Number.isFinite(n) ? n : 0)).toLocaleString('en-US')}`;
}

/** One figure from the cushion bar, made legible — a colored marker + the amount + its label. */
function Stat({ dot, tick, amount, label }: { dot: string; tick?: boolean; amount: number; label: string }) {
  const c = useAppColors();
  return (
    <View style={styles.stat}>
      <View style={styles.statHead}>
        <View style={[tick ? styles.tick : styles.dot, { backgroundColor: dot }]} />
        <Text style={[textStyles.title3, styles.statAmount, { color: c.text.primary }]}>{money(amount)}</Text>
      </View>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { letterSpacing: 0.8, marginBottom: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontWeight: '600' },
  dimmed: { opacity: 0.4 },
  barWrap: { marginTop: spacing.md, height: BAR_H, justifyContent: 'center' },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  stat: { flex: 1, gap: 2 },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statAmount: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  dot: { width: 14, height: 6, borderRadius: 3 }, // a mini bar SEGMENT (matches the cushion/payoff zones)
  tick: { width: 3, height: 12, borderRadius: 1.5 }, // a vertical LINE (matches the floor line in the bar)
  detail: { marginTop: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  move: { fontWeight: '600' },
  look: { marginTop: spacing.sm },
  topUp: { marginTop: spacing.md, gap: spacing.sm },
  topUpBtn: { alignSelf: 'stretch' },
  adjust: { marginTop: spacing.md, fontWeight: '600' },
  invite: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inviteText: { flex: 1, fontWeight: '600' },
});
