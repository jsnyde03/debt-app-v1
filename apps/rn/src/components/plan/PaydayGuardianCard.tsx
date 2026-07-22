import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Card } from '@/components/ui/Card';
import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { CushionBarCanvas } from '@/components/plan/CushionBarCanvas';
import { CushionFloorSheet } from '@/components/plan/CushionFloorSheet';
import { useAppColors } from '@/hooks/use-app-colors';
import type { GuardianBrief, GuardianState } from '@/store/guardianSelectors';
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
export function PaydayGuardianCard({ brief, isPremium }: { brief: GuardianBrief; isPremium: boolean }) {
  const c = useAppColors();
  const [barW, setBarW] = useState(0);
  const [floorSheet, setFloorSheet] = useState(false);

  const tone: Record<GuardianState, { color: string; icon: IconGlyph }> = {
    clear: { color: c.text.secondary, icon: 'gpp-good' }, // slate — green means progress elsewhere
    tight: { color: c.accent.warning, icon: 'gpp-maybe' },
    'at-risk': { color: c.accent.danger, icon: 'gpp-bad' },
  };
  const { color, icon } = tone[brief.state];

  // Bar domain reaches at least the floor, so the line is always on the bar (the under-floor gap shows).
  const domain = Math.max(brief.cushion + brief.deployedToDebt, brief.floor, 1);
  const hasPayoff = brief.deployedToDebt > 0;

  return (
    <Card>
      <View
        {...groupLabel(
          'Payday Guardian',
          brief.title,
          brief.detail,
          isPremium ? brief.safeMove : 'Premium holds your cushion at your line automatically',
          isPremium ? brief.lookahead : undefined,
        )}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>PAYDAY GUARDIAN</Text>

        <View style={styles.head}>
          <AppIcon name={icon} size={22} color={color} />
          <Text style={[textStyles.title3, styles.title, { color }]}>{brief.title}</Text>
        </View>

        {/* The cushion bar — the automation made visible. */}
        <View
          style={styles.barWrap}
          onLayout={(e: LayoutChangeEvent) => setBarW(e.nativeEvent.layout.width)}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {barW > 0 ? (
            <CushionBarCanvas
              width={barW}
              height={BAR_H}
              cushionFrac={brief.cushion / domain}
              payoffFrac={brief.deployedToDebt / domain}
              floorFrac={brief.floor / domain}
              cushionColor={color}
              payoffColor={c.accent.primary}
              trackColor={c.border.subtle}
              lineColor={c.text.primary}
            />
          ) : null}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Cushion</Text>
          </View>
          {hasPayoff ? (
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: c.accent.primary }]} />
              <Text style={[textStyles.caption, { color: c.text.tertiary }]}>To debt</Text>
            </View>
          ) : null}
          <View style={styles.legendItem}>
            <View style={[styles.tick, { backgroundColor: c.text.primary }]} />
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Your line</Text>
          </View>
        </View>

        <Text style={[textStyles.subhead, styles.detail, { color: c.text.secondary }]}>{brief.detail}</Text>

        <View style={[styles.divider, { backgroundColor: c.border.subtle }]} />

        {isPremium ? (
          <>
            {brief.safeMove ? <Text style={[textStyles.subhead, styles.move, { color: c.text.primary }]}>{brief.safeMove}</Text> : null}
            {brief.lookahead ? <Text style={[textStyles.caption, styles.look, { color: c.text.tertiary }]}>{brief.lookahead}</Text> : null}
            <Pressable onPress={() => setFloorSheet(true)} accessibilityRole="button" accessibilityLabel="Adjust your cushion line" hitSlop={8}>
              <Text style={[textStyles.subhead, styles.adjust, { color: c.accent.primary }]}>Adjust your line →</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.invite} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <AppIcon name="workspace-premium" size={18} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.inviteText, { color: c.accent.primary }]}>
              Premium holds your cushion at your line automatically — no deciding each paycheck.
            </Text>
          </View>
        )}
      </View>

      {isPremium ? <CushionFloorSheet visible={floorSheet} floor={brief.floor} onClose={() => setFloorSheet(false)} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  eyebrow: { letterSpacing: 0.8, marginBottom: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  barWrap: { marginTop: spacing.md, height: BAR_H, justifyContent: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tick: { width: 2, height: 10, borderRadius: 1 },
  detail: { marginTop: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  move: { fontWeight: '600' },
  look: { marginTop: spacing.sm },
  adjust: { marginTop: spacing.md, fontWeight: '600' },
  invite: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inviteText: { flex: 1, fontWeight: '600' },
});
