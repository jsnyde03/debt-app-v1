import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MoreButton } from '@/components/more-button';
import { TrajectoryChart } from '@/components/payoff/TrajectoryChart';
import { useCoachMark } from '@/hooks/use-coach-mark';
import { useTutorialTargets } from '@/store/tutorialTargets';
import { CashFlowSection } from '@/components/progress/CashFlowSection';
import { type JourneyRingChartProps, type MilestoneState } from '@/components/progress/JourneyRingChart';
import { JourneyRingCanvas } from '@/components/progress/JourneyRingCanvas';
import { PaidOffArchive } from '@/components/progress/PaidOffArchive';
import { Screen } from '@/components/screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppColors } from '@/hooks/use-app-colors';
import { useGoToTab } from '@/hooks/use-go-to-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLayout } from '@/hooks/use-layout';
import { CountUp } from '@/motion';
import { selectWhatIf, selectWhatIfBaseline } from '@/store/analysisSelectors';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaidOffDebts } from '@/store/celebrationSelectors';
import { selectCashTimeline, selectPayoffView } from '@/store/payoffSelectors';
import { selectOnPlanStreakLabel } from '@/store/planSelectors';
import { effectivePaycheckBuffer } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { decorative, groupLabel } from '@/utils/a11y';
import { formatWhole } from '@/utils/format';

const RING_SIZE = 112;

/**
 * The hero date's fitting props, shared by both hero variants because they share the style and the hazard.
 *
 * ⛔ At the DEFAULT iPhone width this line loses its year. The slot beside the ring is 186 pt
 * (`402 − 2×20 screen − 2×22 card − 112 ring − 20 gap`), and `October 2026` uses 165 of it while
 * `September 2026` needs more than the box has — so an entirely ordinary first-run user, one $1,200 debt,
 * reads `September 2…` as the app's headline number. It is the month NAME's advance width, not the payoff
 * distance: `April 2034` is a further-away date and renders whole.
 *
 * Two lines rather than one, because a break at the space reads correctly (`September` / `2026`) and losing
 * the year does not. `adjustsFontSizeToFit` then covers the small-phone slot, which is 104 pt and cannot
 * hold any full month name at this weight.
 *
 * ⚠️ `adjustsFontSizeToFit` is a no-op in react-native-web, so on the harness the wrap does all the work and
 * the shrink is only ever seen on a device. The 320 pt guarantee is an iOS one and is filed as a P6.14 row.
 */
const heroDateFit = {
  maxFontSizeMultiplier: 1.3,
  numberOfLines: 2,
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.7,
} as const;
const MILE_TS = [25, 50, 75, 100] as const;

/** The green→gold ring palette — constants (the navy panel is theme-invariant, so its colors are too). */
const RING_PALETTE: JourneyRingChartProps['palette'] = {
  track: 'rgba(255,255,255,0.14)',
  from: colors.accent.success.dark, // green — start of the sweep
  to: colors.accent.gold.dark, // gold — approaching freedom
  passed: colors.accent.success.dark,
  next: colors.accent.gold.dark,
  dim: 'rgba(255,255,255,0.28)',
  free: colors.accent.gold.dark,
};

/**
 * Progress tab — the journey. Navy Skia ring hero merging % paid + the 25/50/75/Free milestones
 * (green→gold sweep, count-up); momentum · cash-cushion timeline; the Skia trajectory below.
 * Celebration (debt-paid-off spectacle) lands next.
 */
export default function ProgressScreen() {
  const c = useAppColors();
  const scheme = useColorScheme();
  const goToTab = useGoToTab();
  const { isExpanded } = useLayout(); // 3.6.4 — a wider column on iPad so the ring + timeline charts breathe
  const store = useAppStore((s) => s.store);
  const strategy = store.payoffStrategy;
  // 2.4 — forward-looking computations (debt-free date, trajectory, cushion, what-if) read projected-
  // current balances for premium; free is a no-op wrap. Backward-looking "% paid" below stays on the
  // raw/confirmed balances (progress is what you've actually paid, not a projection).
  // Memoized on the store (not on `extra`): the projection + the 3 payoff trajectories are expensive and
  // don't depend on the What-If input, so a keystroke in the extra field must NOT re-run them. `store` is a
  // stable zustand reference between renders, so these recompute only when the plan actually changes.
  const isPremium = store.subscriptionPlan === 'premium';
  const engineStore = useMemo(() => withProjectedBalances(store, isPremium), [store, isPremium]);
  const view = useMemo(() => selectPayoffView(engineStore), [engineStore]);

  // 3.5.5.4 — the trajectory scrub. Unlike the row long-press this is cross-platform (the chart handles
  // touch and pointer alike), so there is no platform gate; the mark simply waits for the chart to lay
  // out, which on an empty portfolio never happens and is exactly right.
  useCoachMark('trajectory-scrub', true);

  // What-If state — folded into the projection card (the extra drives its overlay + controls). Only THIS
  // recomputes per keystroke now, off the stable engineStore.
  const [extra, setExtra] = useState('');
  // PERF-2: the What-If baseline sim is invariant of `extra` — memoize it on the store so a keystroke runs
  // only the "with extra" sim, not both.
  const whatIfBaseline = useMemo(() => selectWhatIfBaseline(engineStore), [engineStore]);
  const whatIf = useMemo(() => selectWhatIf(engineStore, Number(extra) || 0, whatIfBaseline), [engineStore, extra, whatIfBaseline]);
  // Same rule as above: the cash-cushion forecast is expensive and doesn't depend on `extra`, so it must
  // be memoized off the stable engineStore rather than rebuilt inline on every keystroke.
  const cashCycles = useMemo(() => selectCashTimeline(engineStore), [engineStore]);
  // The cushion floor for the cash-flow bars' reference line (free = BASE buffer · premium = your line).
  const cushionFloor = effectivePaycheckBuffer(engineStore);
  // The permanent trophy shelf of confirmed-cleared debts (raw store — a cleared debt is cleared).
  const paidOff = selectPaidOffDebts(store);

  /**
   * ⛔ **[V2-6 · P6.8.9.7.3] THE OFFER TO MAKE ROOM FOR A COACH MARK.**
   *
   * When `trajectory-scrub` still wrapped the whole trajectory card, it started at y≈570 at 402×874 and
   * ran off the bottom — so its callout had nowhere to go that covered nothing, and the above-branch
   * landed on the cash-flow card's date axis, legend and verdict. Scrolling is the only move that keeps
   * both guarantees.
   * ⚠️ **Present tense was wrong from `.7.3` onward:** the subject is now the 200 pt scrub view inside
   * `TrajectoryChart`, not the 362 pt card. The reveal is still needed; the arithmetic is history.
   * (P6.8.9.7.10 · D-5.)
   *
   * ⚡ **Nothing new was invented for this.** `Screen`'s `scrollRef`/`onScroll` pair already exists for
   * exactly this errand — its own docstring reads *"a handle on the body scroller, so an overlay can bring
   * a coached subject into view"* — and Today already drives it this way for the walkthrough. The offset
   * ref is required because, as `screen.tsx` says, **`scrollTo` takes an ABSOLUTE offset**, so moving by a
   * measured delta means knowing where the scroller is now.
   */
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const targets = useTutorialTargets();
  /**
   * ⛔ **DEREGISTERING ON UNMOUNT IS DEREGISTERING NEVER — TAB SCREENS DO NOT UNMOUNT.**
   * [P6.8.9.7.11.5] The cleanup below stated the intent exactly — *"or a backgrounded Progress keeps
   * answering for whatever screen is up"* — and could not deliver it: `_layout.tsx` sets no
   * `unmountOnBlur`, so this effect's cleanup never runs and a backgrounded Progress stayed the one
   * registered scroll host. A mark on Money or inside a sheet then got `true` from `requestReveal`,
   * silently scrolled an invisible list, and spent its one-shot latch.
   *
   * ⚡ **The repo had already written this down, three directories away** — `use-coach-mark.ts:42-45`:
   * *"it was fixed by gating on focus — because Today never unmounts. The offer was left on mount
   * semantics, so the identical confusion (mount ≠ visible) survived."* Same confusion, third recorded
   * time, and the corrected pattern (`useIsFocused`) was in the file that describes it.
   */
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!targets || !isFocused) return;
    targets.registerScrollHost((dy) => {
      // ⚠️ NOT animated. An animated reveal makes every downstream measurement timing-dependent: the
      // callout is positioned from a rect that is still moving, so it transiently overlaps BOTH its
      // neighbour and its own subject — and `coach-marks.spec.ts:117` caught exactly that, measuring
      // mid-glide. An instant adjustment before the hint settles has no such window.
      scrollRef.current?.scrollTo({ y: Math.max(0, offsetRef.current + dy), animated: false });
    });
    // ⚠️ Deregister on BLUR — see above. On unmount alone this never ran.
    return () => targets.registerScrollHost(null);
  }, [targets, isFocused]);

  if (!view.hasDebts) {
    // Debt-free WITH a history → the calm resting state (the finale already fired the spectacle) + the
    // archive. Only a truly-empty user (never any debt) gets the "add a debt" prompt.
    if (paidOff.length > 0) {
      return (
        <Screen title="Progress" right={<MoreButton />}>
          <LinearGradient
            colors={[c.surface.heroTop, c.surface.heroBottom]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, elevation.hero[scheme]]}>
            <Text style={[textStyles.footnote, styles.eyebrow, { color: c.surface.heroSub }]}>DEBT-FREE</Text>
            <Text {...heroDateFit} style={[styles.heroDate, { color: c.surface.heroText }]}>Every balance paid off</Text>
            <Text style={[textStyles.subhead, { color: c.surface.heroSub }]}>Your trophy shelf is below.</Text>
          </LinearGradient>
          <PaidOffArchive debts={paidOff} />
        </Screen>
      );
    }
    return (
      <Screen title="Progress" right={<MoreButton />}>
        <EmptyState
          icon="trending-down"
          title="Your payoff journey starts here"
          body="Add a debt to see your payoff order, timeline, and interest saved."
          cta="Add a debt"
          onCta={() => goToTab('money')}
        />
      </Screen>
    );
  }

  const totalOriginal = store.debts.reduce((sum, d) => sum + (d.originalBalance ?? d.balance), 0);
  const totalCurrent = store.debts.reduce((sum, d) => sum + d.balance, 0);
  const totalPaid = Math.max(0, totalOriginal - totalCurrent);
  const pct = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;
  const surf = c.surface;

  // Milestone states for the on-ring nodes: passed (green) · next (gold glow, the pull-forward) ·
  // upcoming (dim) · Free (the gold destination at 12 o'clock).
  const nextT = MILE_TS.find((t) => pct < t);
  const milestones = MILE_TS.map<{ t: number; state: MilestoneState }>((t) => ({
    t,
    state: t === 100 ? 'free' : pct >= t ? 'passed' : t === nextT ? 'next' : 'upcoming',
  }));

  // 3.4.2.1 — legible milestones. On a 112px ring, per-node text crowds the arc (it collides with the
  // center %), and the nodes already GLOW to mark next/passed/Free. So the ring stays clean and the next
  // checkpoint reads as a caption in the meta column (which has room). Suppressed past 75%, where the
  // next milestone IS Free and the DEBT-FREE date already says it.
  const nextMilestoneLabel = nextT && nextT < 100 ? `Next milestone: ${nextT}%` : null;

  // 3.7.B.3 (F10.3) — the free on-plan streak. Read from the RAW store: the streak is a fact about what
  // the user did in past cycles, so the projected-balance wrapper has no bearing on it.
  const onPlanStreakLabel = selectOnPlanStreakLabel(store);

  // One collapsed screen-reader utterance for the ring (which is otherwise a decorative canvas).
  const reached = MILE_TS.filter((t) => pct >= t && t < 100).map((t) => `${t}%`);
  const ringA11y = groupLabel(
    `${pct}% paid`,
    reached.length ? `${reached.join(', ')} reached` : 'no milestones reached yet',
    nextT ? `next milestone ${nextT === 100 ? 'debt-free' : `${nextT}%`}` : 'all milestones reached',
    view.debtFreeDate ? `debt-free projected ${view.debtFreeDate}` : undefined,
  );

  return (
    // 3.6.4 — a wider centered column on iPad (not two-column): the timeline charts (trajectory · cash
    // flow) read better with width than split, and the ring hero + stats get room. "Using the room."
    // [V2-6] Only THIS branch carries the trajectory card, so only this one needs the scroll handle — the
    // two debt-free branches above have no coached subject at all.
    <Screen
      title="Progress"
      right={<MoreButton />}
      maxWidth={isExpanded ? 980 : undefined}
      scrollRef={scrollRef}
      onScroll={(e) => {
        offsetRef.current = e.nativeEvent.contentOffset.y;
        // [V2-6] The measured rect is in WINDOW coordinates, so scrolling makes it stale. Telling the
        // registry that re-points the callout at its subject — which is also what stops a hand-scroll
        // leaving the hint behind.
        targets?.invalidate('trajectory-scrub');
      }}>
      <LinearGradient
        colors={[surf.heroTop, surf.heroBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, elevation.hero[scheme]]}>
        <View style={styles.ringRow}>
          <View style={styles.ringWrap} {...ringA11y}>
            <JourneyRingCanvas size={RING_SIZE} stroke={12} pct={pct} milestones={milestones} palette={RING_PALETTE} pulseThreshold={store.pendingMilestone?.threshold} />
            <View
              style={[StyleSheet.absoluteFill, styles.ringCenter]}
              pointerEvents="none"
              {...decorative}>
              <CountUp value={pct} format={(n) => `${Math.round(n)}%`} maxFontSizeMultiplier={1.4} style={[styles.ringPct, { color: surf.heroText }]} />
              <Text style={[textStyles.caption, { color: surf.heroSub }]}>paid</Text>
            </View>
          </View>
          <View style={styles.ringMeta}>
            <Text style={[textStyles.footnote, styles.eyebrow, { color: surf.heroSub }]}>DEBT-FREE</Text>
            <Text testID="progress-hero-date" {...heroDateFit} style={[styles.heroDate, { color: surf.heroText }]}>{view.debtFreeDate ?? '—'}</Text>
            <Text style={[textStyles.subhead, { color: surf.heroSub }]}>
              {/* 3.3.6b — early on, lead FORWARD (the remaining as a goal) instead of a deflating "$0 paid". */}
              {/* HON-1: whole dollars on the headline journey figure — matches every other Phase-3 surface (formatWhole). */}
              {totalPaid > 0 ? `${formatWhole(totalPaid)} of ${formatWhole(totalOriginal)} paid` : `${formatWhole(totalOriginal)} to go`}
            </Text>
            {/* 3.4.2.1 — the next milestone, read as a clean caption (the ring's glowing node marks it visually). */}
            {nextMilestoneLabel ? (
              <Text style={[textStyles.caption, styles.nextMile, { color: surf.heroSub }]}>{nextMilestoneLabel}</Text>
            ) : null}
            {/* 3.7.B.3 (F10.3) [D27] — the free on-plan streak, ported from the Capacitor app WITHOUT its
                flame + count badge: a caption in the same voice as the line above it, not gamification
                chrome. Lives here rather than on Today, where the premium "Held your line" strip already
                states a (different) streak — see `selectOnPlanStreakLabel`. Null below 2 cycles. */}
            {onPlanStreakLabel ? (
              <Text style={[textStyles.caption, styles.nextMile, { color: surf.heroSub }]}>{onPlanStreakLabel}</Text>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      <CashFlowSection cycles={cashCycles} floor={cushionFloor} />

      {/* 3.5.5.4 — the scrub is the premium interaction on this screen and it is invisible until touched.
          ⛔ [V2-6 · P6.8.9.7.3] THE TARGET MOVED INSIDE `TrajectoryChart`, onto the scrub surface itself.
          Here it wrapped the WHOLE card and measured 362 pt — What-If row, compare row and legend included —
          so "scroll until the callout has room" needed 263 px against a maxScroll of 196 and was impossible
          by arithmetic. The subject of "Drag the curve" is the view that handles the drag. */}
      <TrajectoryChart
        snowball={view.snowball}
        avalanche={view.avalanche}
        snowballClears={view.snowballClears}
        avalancheClears={view.avalancheClears}
        minimums={view.minimums}
        lean={view.lean}
        band={view.band}
        strategy={strategy}
        debtFreeDate={view.debtFreeDate}
        interestSaved={view.interestSaved}
        startDate={store.paycheck.currentDate}
        whatIf={whatIf}
        extra={extra}
        onExtraChange={setExtra}
      />

      <PaidOffArchive debts={paidOff} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: layout.cardRadiusLarge, padding: layout.cardPaddingH + 2, overflow: 'hidden' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringWrap: { width: RING_SIZE, height: RING_SIZE },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  ringMeta: { flex: 1, gap: 3 },
  ringPct: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  nextMile: { marginTop: 2 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  heroDate: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
});
