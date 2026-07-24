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
/** The "set aside" swatch matches the bar's tinted reserve zone (cushion color at this opacity). */
const RESERVE_OPACITY = 0.5;

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
  showIntro,
  onDismissIntro,
  attestation,
  onAttestBills,
}: {
  brief: GuardianBrief;
  isPremium: boolean;
  onSeeForecast?: () => void;
  /** §2.10 tight-case (2.4.11.2) — the "move $X from savings to hold your line" one-tap, when available. */
  topUp?: TightTopUp | null;
  onTopUp?: () => void;
  /** §2.0.c (2.4.11.4c) — the "bills complete" attestation affordance: shown while a discovery safety net
   *  is held; toggling reduces / restores the reserve. */
  attestation?: { show: boolean; attested: boolean };
  onAttestBills?: (value: boolean) => void;
  /** 2.4.11.3 (§2.0.d/§2.1) — the one-time premium first-run intro: floor-protected-from-today +
   *  earns-trust-as-it-learns + the advice boundary. Shown once, then dismissed to `guardianIntroSeen`. */
  showIntro?: boolean;
  onDismissIntro?: () => void;
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
      {/* 2.4.11.3 — one-time premium first-run intro: reframes cold-start as protection (acting from
          day one) + the earns-trust-as-it-learns story + the advice boundary. Calm, inline, dismissible
          (never a modal). Wording is non-monotonic ("more precisely") + non-surveillance ("as you log"). */}
      {showIntro ? (
        <View
          style={[styles.intro, { backgroundColor: c.background.secondary, borderColor: c.border.subtle }]}
          accessibilityRole="summary">
          <Text style={[textStyles.subhead, styles.introText, { color: c.text.secondary }]}>
            <Text style={{ color: c.text.primary, fontWeight: '600' }}>Your floor is protected from today.</Text> As you
            log each paycheck, I learn your floor and put your money to work more precisely. Guidance from your numbers —
            not financial advice. Your call.
          </Text>
          <Pressable
            onPress={() => onDismissIntro?.()}
            accessibilityRole="button"
            accessibilityLabel="Got it, dismiss the Guardian intro"
            hitSlop={8}
            style={styles.introBtnWrap}>
            <Text style={[textStyles.subhead, styles.introBtn, { color: c.accent.primary }]}>Got it</Text>
          </Pressable>
        </View>
      ) : null}
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
        {/* 2.4.11.1 / 2.4.11.4b.0 — the numbers ARE the read, in the hero card's compact legend style
            (swatch + label on top, value below). Each swatch keys a zone of the cushion bar above. */}
        <View
          style={[styles.stats, stale && styles.dimmed]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {/* Order matches the bar's fixed left→right shading: Set aside (tinted, far-left) → Cushion →
              To debt. The "set aside" reserve is only present for a settling-in (cold-start) user. */}
          {hasReserve ? <Stat swatch={color} dim amount={brief.heldReserve} label="Safety net" /> : null}
          <Stat swatch={color} amount={brief.cushion} label="Cushion" />
          {hasPayoff ? <Stat swatch={c.accent.primary} amount={brief.deployedToDebt} label={brief.debtFree ? 'To savings' : 'To debt'} /> : null}
        </View>
        {/* Your line (the floor) is a reference marker, not a flow amount, so it sits below the amounts as
            a keyed sub-line (the vertical tick matches the floor line drawn in the bar). */}
        <View
          style={styles.lineKey}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          <View style={[styles.tick, { backgroundColor: c.text.primary }]} />
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{money(brief.floor)} · Your line</Text>
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
            {/* 2.4.11.3 — the standing advice boundary: the decisive plan carries a light "your call"
                (the persistent half of the §2.1 boundary). 2.4.11.4a: suppressed when the move is already
                two-sided-with-a-why (its copy ends in "your call") so it never doubles up. */}
            {brief.safeMove && !/your call/i.test(brief.safeMove) ? (
              <Text style={[textStyles.caption, styles.yourCall, { color: c.text.tertiary }]}>Your call</Text>
            ) : null}
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
            {/* §2.0.c (2.4.11.4c) — while a discovery safety net is held, let an organized user confirm
                their bills are all entered to hold less (a surprise walks it back). Toggle. */}
            {attestation?.show ? (
              <Pressable
                onPress={() => onAttestBills?.(!attestation.attested)}
                accessibilityRole="button"
                accessibilityLabel={attestation.attested ? 'Bills confirmed — tap to undo and restore the safety net' : 'Confirm your regular bills are all entered to hold a smaller safety net'}
                hitSlop={8}
                style={styles.attest}>
                <Text style={[textStyles.caption, { color: c.accent.primary }]}>
                  {attestation.attested
                    ? 'Bills confirmed — holding a smaller safety net. Undo'
                    : "All your regular bills entered? I'll hold a smaller safety net."}
                </Text>
              </Pressable>
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

/** One legend item from the cushion bar, in the hero card's compact style — a bar-zone-keyed swatch +
 *  label on top, the value below. */
function Stat({ swatch, dim, amount, label }: { swatch: string; dim?: boolean; amount: number; label: string }) {
  const c = useAppColors();
  return (
    <View style={styles.stat}>
      <View style={styles.statHead}>
        <View style={[styles.dot, { backgroundColor: swatch }, dim ? { opacity: RESERVE_OPACITY } : null]} />
        <Text style={[textStyles.caption, { color: c.text.tertiary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={[styles.statValue, { color: c.text.primary }]}>{money(amount)}</Text>
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
  stats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  stat: { gap: 3 },
  statHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statValue: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'] }, // hero-legend scale
  lineKey: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  dot: { width: 14, height: 6, borderRadius: 3 }, // a mini bar SEGMENT (matches the cushion/payoff zones)
  tick: { width: 3, height: 12, borderRadius: 1.5 }, // a vertical LINE (matches the floor line in the bar)
  detail: { marginTop: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  move: { fontWeight: '600' },
  look: { marginTop: spacing.sm },
  topUp: { marginTop: spacing.md, gap: spacing.sm },
  topUpBtn: { alignSelf: 'stretch' },
  attest: { marginTop: spacing.sm },
  adjust: { marginTop: spacing.md, fontWeight: '600' },
  invite: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inviteText: { flex: 1, fontWeight: '600' },
  intro: { padding: spacing.md, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.md, gap: spacing.sm },
  introText: { lineHeight: 20 },
  introBtnWrap: { alignSelf: 'flex-end' },
  introBtn: { fontWeight: '700' },
  yourCall: { marginTop: spacing.xs },
});
