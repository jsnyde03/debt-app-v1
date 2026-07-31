import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { CushionBarCanvas } from '@/components/plan/CushionBarCanvas';
import { CushionFloorSheet } from '@/components/plan/CushionFloorSheet';
import { GuardianProofStrip } from '@/components/plan/GuardianProofStrip';
import { RecoveryPlanSection } from '@/components/plan/RecoveryPlanSection';
import { PremiumInvite } from '@/components/premium/PremiumInvite';
import { useAppColors } from '@/hooks/use-app-colors';
import type { GuardianBrief, GuardianProofOfWork, GuardianState, TightTopUp } from '@/store/guardianSelectors';
import type { RecoveryPlan } from '@/store/recoverySelectors';
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
  onReplayTutorial,
  onSetFloor,
  attestation,
  onAttestBills,
  recovery,
  onDefer,
  onKeepEssential,
  bnplHeadsUp,
  proofOfWork,
  isExample,
}: {
  brief: GuardianBrief;
  isPremium: boolean;
  onSeeForecast?: () => void;
  /** §3.3.3 — the premium proof-of-work read for the clear-cycle strip; null for free / no data yet. */
  proofOfWork?: GuardianProofOfWork | null;
  /** §2.7.4 — a between-paycheck BNPL heads-up ("2 Klarna payments land before your next paycheck"),
   *  naming why a cycle reads tight. All tiers; null when no BNPL is lumpy this cycle. */
  bnplHeadsUp?: string | null;
  /** §2.6 Recovery — the built catch-up plan when this cycle is short (premium). Null otherwise; when
   *  present it replaces the generic safe-move line with the interactive cover-now/defer plan. */
  recovery?: RecoveryPlan | null;
  onDefer?: (id: string) => void;
  onKeepEssential?: (id: string) => void;
  /** §2.10 tight-case (2.4.11.2) — the "move $X from savings to hold your line" one-tap, when available. */
  topUp?: TightTopUp | null;
  onTopUp?: () => void;
  /** §2.0.c (2.4.11.4c) — the "bills complete" attestation affordance: shown while a discovery safety net
   *  is held; toggling reduces / restores the reserve. */
  attestation?: { show: boolean; attested: boolean };
  onAttestBills?: (value: boolean) => void;
  /** 3.5.1 — replay the Guardian walkthrough ("?" in the header). Always available, so the tutorial is
   *  never a one-shot a user can lose by dismissing it. Replaces the retired 2.4.11.3 static intro,
   *  which the tutorial absorbs. */
  onReplayTutorial?: () => void;
  /** 3.5.0.5 — commit a new cushion floor. The HOST owns this write (the app store's setter in the real
   *  app, the sandbox's in the tutorial) so the card can be used as a teaching prop without moving the
   *  user's real line. Omit it and the floor sheet simply isn't offered. */
  onSetFloor?: (value: number) => void;
  /** 3.5.3.2 — this card is showing EXAMPLE money (the tutorial sandbox), not the user's plan. Drives
   *  the persistent marker below. The host derives it from the acting store's sandbox brand rather than
   *  from "is a tutorial running", so the claim can never drift from what's actually on screen. */
  isExample?: boolean;
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

  // MF.3 — the free invite is state-aware: in a shortfall it sells the RECOVERY value (a catch-up plan),
  // not "cushion at your line" (there's no cushion to hold when you're short — that pitch reads off-context).
  const freeInvite =
    (brief.shortfall ?? 0) > 0
      ? 'Premium builds you a catch-up plan — what to cover first, and what (if anything) can safely wait.'
      : 'Premium keeps your cushion at your line automatically, all on your device — no deciding each paycheck.';

  return (
    <Card>
        <View
        {...groupLabel(
          // 3.5.3.2 — spoken FIRST, before the verdict. A VoiceOver user can't see the chip, and the
          // beat that most needs this marker is the one where the card says "you're at risk" about
          // money that isn't theirs. Whoever hears the warning must hear "example" ahead of it.
          isExample ? 'Example' : undefined,
          'Payday Guardian',
          brief.title,
          brief.detail,
          // MF.2 round-2: in recovery mode the visible safeMove is replaced by the (out-of-group) recovery
          // section and the lookahead renders as its own Text below — so drop both from the narrated label
          // here, else VoiceOver speaks a phantom safeMove + a double lookahead.
          // Free: the invite is NOT narrated here — it renders below as its own tappable "Premium…"
          // button (outside the group, per MF.2), so VoiceOver reaches it as an actionable element
          // rather than a buried, double-spoken line.
          isPremium ? (recovery ? undefined : brief.safeMove) : undefined,
          isPremium && !recovery ? brief.lookahead : undefined,
          bnplHeadsUp ?? undefined,
        )}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>PAYDAY GUARDIAN</Text>

        <View style={styles.head}>
          <AppIcon name={icon} size={22} color={color} />
          <Text style={[textStyles.title3, styles.title, { color }]}>{brief.title}</Text>
          {/* 3.5.3.2 — the persistent EXAMPLE marker, on every beat of the walkthrough.
              WHY it sits here and not in the eyebrow: the tutorial teaches over the user's real Today
              with figures scaled from their own income, and two of the beats put the card into tight /
              at-risk. A marker in the meta line above would read as a label for the section; next to
              the verdict it reads as a qualifier ON the verdict, which is the only thing that stops
              "You're short this paycheck" from landing as a real warning about their real money.
              It borrows the accent (never a state color) so it can't be mistaken for a verdict of its
              own, and it never renders outside the sandbox. */}
          {isExample ? (
            <View
              style={[styles.chip, { backgroundColor: c.accent.accentSoft, borderColor: c.accent.primary }]}
              testID="guardian-example-marker">
              <Text style={[textStyles.caption, styles.chipText, { color: c.accent.primary }]}>Example</Text>
            </View>
          ) : null}
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
          {/* COH-2: the held reserve is WITHIN cushion (buildGuardianBrief: heldReserve ≤ cushion). Show the
              non-reserve remainder here so Safety net + Cushion read as disjoint segments (matching the bar)
              and reconcile with the hero's Free above. */}
          <Stat swatch={color} amount={hasReserve ? brief.cushion - brief.heldReserve : brief.cushion} label="Cushion" />
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

        {/* §2.7.4 — the between-paycheck BNPL heads-up: names why the cycle reads tight (a biweekly plan
            landing 2+ installments before the next paycheck). Calm caption, all tiers. Inside the narrated
            group (the `accessible` group collapses it → it's spoken via the group label, not twice). */}
        {bnplHeadsUp ? (
          <Text style={[textStyles.caption, styles.bnplHeadsUp, { color: c.text.tertiary }]}>{bnplHeadsUp}</Text>
        ) : null}

        <View style={[styles.divider, { backgroundColor: c.border.subtle }]} />

        {/* READ-ONLY voice stays inside the narrated group. The INTERACTIVE controls (recovery / top-up /
            attestation) render OUTSIDE it, below — see MF.2. */}
        {isPremium && !recovery ? (
          <>
            {brief.safeMove ? <Text style={[textStyles.subhead, styles.move, { color: c.text.primary }]}>{brief.safeMove}</Text> : null}
            {/* 2.4.11.3 — the standing advice boundary: the decisive plan carries a light "your call"
                (the persistent half of the §2.1 boundary). 2.4.11.4a: suppressed when the move is already
                two-sided-with-a-why (its copy ends in "your call") so it never doubles up. */}
            {brief.safeMove && !/your call/i.test(brief.safeMove) ? (
              <Text style={[textStyles.caption, styles.yourCall, { color: c.text.tertiary }]}>Your call</Text>
            ) : null}
            {brief.lookahead ? <Text style={[textStyles.caption, styles.look, { color: c.text.tertiary }]}>{brief.lookahead}</Text> : null}
          </>
        ) : null}
      </View>

      {/* Free: the value-led invite as a real, tappable button → the paywall. Outside the narrated group
          (MF.2) so it's an actionable a11y element, and consistent with every other PremiumInvite. */}
      {!isPremium ? (
        <View style={styles.invite}>
          <PremiumInvite message={freeInvite} />
        </View>
      ) : null}

      {/* MF.2 (audit #2) — the INTERACTIVE controls live OUTSIDE the `accessible` group (which collapses its
          descendants into one VoiceOver utterance), so a screen reader reaches each as its own element,
          exactly like the "Adjust your line" control below. Recovery / top-up / attestation are mutually
          exclusive (different Guardian states), so at most one renders. */}
      {isPremium && recovery ? (
        <>
          {/* §2.6 — the shortfall card rolls up its sleeves: the built catch-up plan, then the next-cycle heads-up. */}
          <RecoveryPlanSection plan={recovery} onDefer={(id) => onDefer?.(id)} onKeepEssential={(id) => onKeepEssential?.(id)} />
          {brief.lookahead ? <Text style={[textStyles.caption, styles.look, { color: c.text.tertiary }]}>{brief.lookahead}</Text> : null}
        </>
      ) : null}
      {/* §2.10 tight-case one-tap (2.4.11.2): a REAL move to hold the line — only when the user has savings to tap. */}
      {isPremium && !recovery && topUp ? (
        <View style={styles.topUp}>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
            You have {money(topUp.available)} in {topUp.goalName} — moving {money(topUp.topUp)} over holds your line this paycheck.
          </Text>
          <Button label={`Move ${money(topUp.topUp)} from savings`} variant="secondary" onPress={() => onTopUp?.()} style={styles.topUpBtn} />
        </View>
      ) : null}
      {/* §2.0.c (2.4.11.4c) — while a discovery safety net is held, let an organized user confirm their bills.
          MF.2 round-2: gated behind `!topUp` so at most one of recovery/top-up/attestation ever renders (a
          cold-start tight cycle can satisfy both top-up + attestation; the urgent line-holding move wins). */}
      {isPremium && !recovery && !topUp && attestation?.show ? (
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

      {/* The adjust control lives OUTSIDE the narrated group so a screen reader reaches it as its own
          button (the group's `accessible` collapses its descendants into one utterance). */}
      {showAdjust ? (
        <Pressable onPress={() => setFloorSheet(true)} accessibilityRole="button" accessibilityLabel="Adjust your cushion line" hitSlop={8}>
          <Text style={[textStyles.subhead, styles.adjust, { color: c.accent.primary }]}>Adjust your line →</Text>
        </Pressable>
      ) : null}
      {/* 3.5.1 — the always-available replay. Also OUTSIDE the group, for the same reason. It's a quiet
          text link rather than a floating "?" glyph: the card is already dense, and restraint reads more
          premium than another piece of chrome. Available to BOTH tiers — free gets a real run. */}
      {onReplayTutorial ? (
        <Pressable
          testID="guardian-replay-tutorial"
          onPress={onReplayTutorial}
          accessibilityRole="button"
          accessibilityLabel="See how your Guardian works"
          hitSlop={8}>
          <Text style={[textStyles.caption, styles.adjust, { color: c.text.tertiary }]}>How this works</Text>
        </Pressable>
      ) : null}
      {/* §3.3.3 proof-of-work — the accumulating record of the automation's work, on calm/clear cycles only
          (where it otherwise goes invisible). Display-only; the forecast link below opens the full scorecard. */}
      {isPremium && !stale && brief.state === 'clear' && proofOfWork ? <GuardianProofStrip pow={proofOfWork} /> : null}
      {/* §2.6 drill-down (2.4.7.9) — a pushed route into the full cushion forecast; own a11y button. */}
      {isPremium && onSeeForecast && !stale && !brief.pausedDeploy ? (
        <Pressable onPress={onSeeForecast} accessibilityRole="button" accessibilityLabel="See your cushion forecast" hitSlop={8}>
          <Text style={[textStyles.subhead, styles.adjust, { color: c.accent.primary }]}>See your forecast →</Text>
        </Pressable>
      ) : null}

      {isPremium && onSetFloor ? (
        <CushionFloorSheet visible={floorSheet} floor={brief.floor} onClose={() => setFloorSheet(false)} onApply={onSetFloor} />
      ) : null}
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
  // flexWrap so a title long enough to squeeze the chips reflows instead of crushing them — the
  // Example marker losing its label is the one failure this row can't afford.
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  title: { flex: 1 },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontWeight: '600' },
  dimmed: { opacity: 0.4 },
  barWrap: { marginTop: spacing.md, height: BAR_H, justifyContent: 'center' },
  // flexWrap so the 3 stats reflow to a second row at large Dynamic-Type sizes instead of clipping /
  // overflowing off-screen (premium-a11y: degrade gracefully at AX sizes). Full AX3/AX5 QA → Phase 6.
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.md },
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
  bnplHeadsUp: { marginTop: spacing.sm, lineHeight: 18 },
  topUp: { marginTop: spacing.md, gap: spacing.sm },
  topUpBtn: { alignSelf: 'stretch' },
  attest: { marginTop: spacing.sm },
  adjust: { marginTop: spacing.md, fontWeight: '600' },
  invite: { marginTop: spacing.md },
  intro: { padding: spacing.md, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: spacing.md, gap: spacing.sm },
  introText: { lineHeight: 20 },
  introBtnWrap: { alignSelf: 'flex-end' },
  introBtn: { fontWeight: '700' },
  yourCall: { marginTop: spacing.xs },
});
