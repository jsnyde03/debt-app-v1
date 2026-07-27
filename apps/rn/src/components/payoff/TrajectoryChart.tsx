import { useRef, useState } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import type { PayoffStrategy } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { haptics } from '@/motion';
import type { WhatIfResult } from '@/store/analysisSelectors';
import type { DebtClearPoint, InterestSaved, TrajectoryPoint } from '@/store/payoffSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

import { TrajectoryCanvas } from './TrajectoryCanvas';
import { WhatIfControls } from './WhatIfControls';

const H = 200;
// Left gutter holds the balance labels; bottom gutter holds the time ticks.
const PAD = { l: 38, r: 14, t: 16, b: 26 };

function formatMonths(months: number): string {
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  return `${Math.round(months / 12)} years`;
}

/** The savings suffix shared by both legend rows: " · $1,666, 22 months saved" / " · $309, 7 months sooner". */
function deltaSuffix(interestSaved: number, monthsSaved: number, word: string): string {
  if (interestSaved > 0 && monthsSaved > 0) return ` · ${formatWhole(interestSaved)}, ${formatMonths(monthsSaved)} ${word}`;
  if (interestSaved > 0) return ` · ${formatWhole(interestSaved)} less interest`;
  if (monthsSaved > 0) return ` · ${formatMonths(monthsSaved)} ${word}`;
  return '';
}

/** "January 2028" → "Jan 2028" for a compact endpoint label. */
function shortDate(full: string): string {
  const [month, year] = full.split(' ');
  return year ? `${month.slice(0, 3)} ${year}` : full;
}

/** A compact axis balance label: $0 · $4k · $12k. */
function formatAxisBalance(v: number): string {
  if (v === 0) return '$0';
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${Math.round(v)}`;
}

/** Pick a "nice" gridline step so the Y-axis has ~3–4 lines (never a cramped 6). */
function niceStep(max: number): number {
  for (const s of [1000, 2000, 2500, 4000, 5000, 10000, 20000, 50000]) {
    if (max / s <= 3.5) return s;
  }
  return 100000;
}

type Pt = { x: number; y: number };

/** Catmull-Rom → cubic-bezier SVG path (smooth curve through the points). */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * The payoff trajectory: total balance melting to zero. Skia — a blue→gold gradient line with a GPU
 * glow, a luminous area wash, and a gold "debt-free" finish (navy identity → gold freedom; green
 * stays reserved for "paid"). The ACTIVE strategy is drawn bold; the other is a faint ghost, so the
 * Snowball/Avalanche toggle visibly redraws it. Draw-on animation lands next.
 */
export function TrajectoryChart({
  snowball,
  avalanche,
  snowballClears,
  avalancheClears,
  minimums,
  strategy,
  debtFreeDate,
  interestSaved,
  startDate,
  whatIf,
  extra,
  onExtraChange,
}: {
  snowball: TrajectoryPoint[];
  avalanche: TrajectoryPoint[];
  snowballClears: DebtClearPoint[];
  avalancheClears: DebtClearPoint[];
  minimums: TrajectoryPoint[];
  strategy: PayoffStrategy;
  debtFreeDate: string | null;
  interestSaved: InterestSaved;
  startDate: string;
  /** The What-If simulation folded into this card — drives both the overlay curve and the controls. */
  whatIf: WhatIfResult;
  extra: string;
  onExtraChange: (value: string) => void;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const [w, setW] = useState(0);
  // What-If is a secondary, opt-in tool — collapsed by default so the resting card stays calm.
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  // Touch-scrub: the point under the finger (px position + its month/balance) — null when not scrubbing.
  const [scrub, setScrub] = useState<{ x: number; y: number; month: number; balance: number } | null>(null);
  const lastScrubMonth = useRef<number | null>(null);

  // The What-If overlay: the "with extra" curve — only while the tool is open (collapsing returns the
  // chart to its calm resting state). The plan-vs-minimums "saved" line below is NEVER overridden by
  // it — the with-extra debt-free DATE lives in the What-If controls, not this slot.
  const simulated = whatIfOpen ? whatIf.simulatedTrajectory : [];

  const active = strategy === 'snowball' ? snowball : avalanche;
  // The ghost is the minimum-payments baseline — but only when there's a real gap to show. In the
  // "none" case (no extra reaches the debt) the minimums curve IS the active plan, so we hide it.
  const showMinimums = interestSaved.kind === 'saving' || interestSaved.kind === 'payoff-enabling';
  const ghost = showMinimums ? minimums : [];
  const all = [...active, ...ghost];
  const maxMonth = Math.max(1, ...all.map((p) => p.month));
  const rawMax = Math.max(1, ...all.map((p) => p.balance));
  const step = niceStep(rawMax);
  const niceMax = Math.ceil(rawMax / step) * step; // Y-axis top, rounded to a gridline.

  const mapX = (month: number) => PAD.l + (month / maxMonth) * (w - PAD.l - PAD.r);
  const mapY = (bal: number) => PAD.t + (1 - bal / niceMax) * (H - PAD.t - PAD.b);
  const toPts = (traj: TrajectoryPoint[]): Pt[] => traj.map((p) => ({ x: mapX(p.month), y: mapY(p.balance) }));
  const baselineY = mapY(0);

  const activePts = w > 0 ? toPts(active) : [];
  const activePath = smoothPath(activePts);
  const ghostPath = w > 0 ? smoothPath(toPts(ghost)) : '';
  const areaPath =
    activePts.length >= 2
      ? `${activePath} L${activePts[activePts.length - 1].x.toFixed(1)},${baselineY.toFixed(1)} L${activePts[0].x.toFixed(1)},${baselineY.toFixed(1)} Z`
      : '';

  const endPoint = active.find((p) => p.balance <= 0);
  const endpoint = endPoint && w > 0 ? { x: mapX(endPoint.month), y: baselineY } : null;
  const start = activePts.length ? activePts[0] : null;

  // Per-debt waypoints — a small bead where each debt falls away, sitting ON the curve. The LAST clear
  // IS the debt-free endpoint (already the bead + date pill), so only intermediate debts get a waypoint.
  // Labels collision-avoid (skip any within ~48px of the previous shown label) so 3+ debts don't crowd.
  const endMonth = endPoint?.month ?? Infinity;
  const activeClears = strategy === 'snowball' ? snowballClears : avalancheClears;
  let lastLabelX = -Infinity;
  const waypoints =
    w > 0
      ? activeClears
          .filter((cl) => cl.month > 0 && cl.month < endMonth)
          .map((cl) => {
            const pt = active.find((p) => p.month === cl.month);
            return { name: cl.name ?? '', x: mapX(cl.month), y: pt ? mapY(pt.balance) : baselineY };
          })
          .sort((a, b) => a.x - b.x)
          .map((wp) => {
            const showLabel = !!wp.name && wp.x - lastLabelX >= 48;
            if (showLabel) lastLabelX = wp.x;
            return { ...wp, showLabel };
          })
      : [];

  // What-If overlay geometry (same scale — the simulated curve ends earlier, so it fits as-is).
  const showSimulated = simulated.length > 1 && w > 0;
  const simulatedPath = showSimulated ? smoothPath(toPts(simulated)) : undefined;
  const simEnd = showSimulated ? simulated.find((p) => p.balance <= 0) : undefined;
  const simulatedEndpoint = simEnd ? { x: mapX(simEnd.month), y: baselineY } : null;

  // Y-scale: balance gridlines 0 → niceMax. X-scale: year marks (each January) between Now and the end.
  const gridVals: number[] = [];
  for (let v = 0; v <= niceMax + 1; v += step) gridVals.push(v);
  const monthDate = (m: number) => {
    const d = new Date(`${startDate}T00:00:00`);
    d.setMonth(d.getMonth() + m);
    return d;
  };
  const xTicks: { m: number; label: string }[] = [];
  if (w > 0) {
    for (let m = 1; m < maxMonth; m++) {
      const d = monthDate(m);
      if (d.getMonth() === 0) xTicks.push({ m, label: String(d.getFullYear()) });
    }
  }

  // The minimums-only payoff date (from the ghost trajectory, same month scale) — or "Never" when
  // minimums can't clear the debt. Gives the baseline row a date, uniform with the plan/with-extra.
  const minEnd = minimums.find((p) => p.balance <= 0);
  const minimumsDateLabel =
    interestSaved.kind === 'saving' && minEnd
      ? monthDate(minEnd.month).toLocaleString('en-US', { month: 'short', year: 'numeric' })
      : 'Never';

  // Touch-scrub: map the finger's x to the nearest trajectory point, snap the readout to it, and tick a
  // light haptic each time the snapped month changes (a subtle detent, like the Slider). All on existing
  // geometry — no engine data needed.
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const handleScrub = (e: GestureResponderEvent) => {
    if (!(w > 0) || active.length === 0) return;
    const plotW = w - PAD.l - PAD.r;
    const x = clamp(e.nativeEvent.locationX, PAD.l, w - PAD.r);
    const targetMonth = ((x - PAD.l) / plotW) * maxMonth;
    let nearest = active[0];
    for (const p of active) {
      if (Math.abs(p.month - targetMonth) < Math.abs(nearest.month - targetMonth)) nearest = p;
    }
    if (nearest.month !== lastScrubMonth.current) {
      lastScrubMonth.current = nearest.month;
      haptics.light();
    }
    setScrub({ x: mapX(nearest.month), y: mapY(nearest.balance), month: nearest.month, balance: nearest.balance });
  };
  const endScrub = () => {
    lastScrubMonth.current = null;
    setScrub(null);
  };
  // Estimate the debt-free pill's width (no layout round-trip) so it clamps on-screen at either chart edge.
  const endPillW = 20 + (debtFreeDate ? shortDate(debtFreeDate).length : 8) * 6.5;

  const dark = scheme === 'dark';
  const gold = dark ? '#f7cf5f' : '#dca01f';
  const axisColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(16,38,84,0.07)';
  const palette = {
    lineFrom: c.accent.primary,
    lineMid: c.accent.primary,
    lineTo: gold,
    areaTop: dark ? 'rgba(91,157,255,0.26)' : 'rgba(47,102,234,0.18)',
    areaBottom: dark ? 'rgba(91,157,255,0)' : 'rgba(47,102,234,0)',
    ghost: c.text.tertiary,
    glow: dark ? 'rgba(247,207,95,0.55)' : 'rgba(220,160,31,0.5)',
    core: dark ? '#ffe9a8' : '#eeb42e',
    startDot: c.accent.primary,
    simulated: c.accent.success, // green "with extra" overlay — distinct from the gold plan finish
  };

  return (
    <Card>
      <View style={styles.head}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.secondary }]}>PAYOFF TRAJECTORY</Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Balance over time</Text>
      </View>
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height: H }}
        onStartShouldSetResponder={() => w > 0}
        onMoveShouldSetResponder={() => w > 0}
        onResponderGrant={handleScrub}
        onResponderMove={handleScrub}
        onResponderRelease={endScrub}
        onResponderTerminate={endScrub}>
        {w > 0 && activePath ? (
          <>
            <TrajectoryCanvas
              width={w}
              height={H}
              activePath={activePath}
              areaPath={areaPath}
              ghostPath={ghostPath}
              simulatedPath={simulatedPath}
              simulatedEndpoint={simulatedEndpoint}
              endpoint={endpoint}
              start={start}
              gridLines={gridVals.map(mapY)}
              plotLeft={PAD.l}
              plotRight={w - PAD.r}
              axisColor={axisColor}
              palette={palette}
            />
            {/* balance labels — left gutter, aligned to each gridline */}
            {gridVals.map((v) => (
              <Text
                key={`y${v}`}
                style={[textStyles.caption, styles.yLabel, { top: mapY(v) - 7, color: c.text.tertiary }]}>
                {formatAxisBalance(v)}
              </Text>
            ))}
            {/* year marks — bottom gutter, between Now and debt-free */}
            {xTicks.map((t) => (
              <Text
                key={`x${t.m}`}
                style={[textStyles.caption, styles.xLabel, { left: mapX(t.m) - 20, top: baselineY + 6, color: c.text.tertiary }]}>
                {t.label}
              </Text>
            ))}
            {/* per-debt waypoints — a bead on the curve where each intermediate debt clears, with a small
                name label (collision-avoided). Direct absolute children of the plot container (NOT wrapped
                in a flow View, or their coords would resolve against a zero-height wrapper). Hidden while
                scrubbing so the readout owns the overlay. */}
            {!scrub
              ? waypoints.flatMap((wp, i) => [
                  <View
                    key={`wpd${i}`}
                    testID="traj-waypoint"
                    pointerEvents="none"
                    style={[styles.waypointDot, { left: wp.x - 4, top: wp.y - 4, backgroundColor: gold, borderColor: c.background.primary }]}
                  />,
                  wp.showLabel ? (
                    <Text
                      key={`wpl${i}`}
                      pointerEvents="none"
                      style={[textStyles.caption, styles.waypointLabel, { left: wp.x - 40, top: wp.y - 22, color: c.text.tertiary }]}
                      numberOfLines={1}>
                      {wp.name} ✓
                    </Text>
                  ) : null,
                ])
              : null}
            {/* debt-free date pill — read the payoff date off the bead itself. Hidden while scrubbing so
                the readout owns the overlay. */}
            {endpoint && debtFreeDate && !scrub ? (
              <View
                testID="traj-endpoint-pill"
                pointerEvents="none"
                style={[styles.endPill, { left: clamp(endpoint.x - endPillW / 2, PAD.l, w - PAD.r - endPillW), top: baselineY - 30, backgroundColor: gold }]}>
                <Text style={styles.endPillText}>{shortDate(debtFreeDate)}</Text>
              </View>
            ) : null}
            {/* touch-scrub — vertical guide + a dot on the curve + a floating date/balance/months readout */}
            {scrub ? (
              <>
                <View
                  pointerEvents="none"
                  style={[styles.scrubLine, { left: scrub.x, top: PAD.t, height: baselineY - PAD.t, backgroundColor: c.text.tertiary }]}
                />
                <View
                  pointerEvents="none"
                  style={[styles.scrubDot, { left: scrub.x - 5, top: scrub.y - 5, borderColor: c.accent.primary, backgroundColor: c.background.primary }]}
                />
                <View
                  testID="traj-scrub-readout"
                  pointerEvents="none"
                  style={[styles.scrubReadout, { left: clamp(scrub.x - 60, PAD.l, w - PAD.r - 132), top: PAD.t, backgroundColor: c.background.secondary, borderColor: c.border.subtle }]}>
                  <Text style={[textStyles.caption, styles.scrubReadoutText, { color: c.text.primary }]} numberOfLines={1}>
                    {monthDate(scrub.month).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                    {'  ·  '}
                    {formatWhole(scrub.balance)}
                    {'  ·  '}
                    {scrub.month === 0 ? 'now' : `${scrub.month} mo`}
                  </Text>
                </View>
              </>
            ) : null}
          </>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Now</Text>
      </View>

      {showMinimums || showSimulated ? (
        <View style={styles.legend}>
          {/* Order mirrors the chart's line stacking (top→bottom): minimums rides highest, then the
              plan, then with-extra dips lowest. */}
          {/* Minimum payments — the baseline you beat; no date (it's the reference, or never pays off). */}
          {showMinimums ? (
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: c.text.tertiary, opacity: 0.55 }]} />
                <Text style={[textStyles.caption, { color: c.text.secondary }]}>Minimum payments</Text>
              </View>
              <Text style={[textStyles.caption, styles.rowData, { color: c.text.secondary }]} numberOfLines={1}>
                {minimumsDateLabel}
              </Text>
            </View>
          ) : null}
          {/* Your plan — its payoff date + savings-vs-minimums, grouped in gold (one "plan" thing). */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: c.accent.primary }]} />
              <Text style={[textStyles.caption, { color: c.text.secondary }]}>Your plan</Text>
            </View>
            {debtFreeDate ? (
              <Text style={[textStyles.caption, styles.rowData, { color: c.accent.primary }]} numberOfLines={1}>
                {shortDate(debtFreeDate)}
                {interestSaved.kind === 'saving'
                  ? deltaSuffix(interestSaved.interestSaved, interestSaved.monthsSaved, 'saved')
                  : ''}
              </Text>
            ) : null}
          </View>
          {/* With extra — the what-if payoff date, green (the contrast to the gold plan). */}
          {showSimulated ? (
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.swatch, styles.swatchDashed, { backgroundColor: c.accent.success }]} />
                <Text style={[textStyles.caption, { color: c.text.secondary }]}>With extra</Text>
              </View>
              {whatIf.simulatedDate ? (
                <Text style={[textStyles.caption, styles.rowData, { color: c.accent.success }]} numberOfLines={1}>
                  {shortDate(whatIf.simulatedDate)}
                  {deltaSuffix(whatIf.interestSaved, whatIf.monthsSaved, 'sooner')}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => setWhatIfOpen((o) => !o)}
        style={[styles.whatIfToggle, { borderTopColor: c.border.subtle }]}
        accessibilityRole="button"
        accessibilityLabel="What if you paid extra?"
        accessibilityState={{ expanded: whatIfOpen }}>
        <Text style={[textStyles.subhead, styles.whatIfLabel, { color: c.text.secondary }]}>
          What if you paid extra?
        </Text>
        <AppIcon name={whatIfOpen ? 'expand-less' : 'expand-more'} size={22} color={c.text.tertiary} />
      </Pressable>
      {whatIfOpen ? <WhatIfControls result={whatIf} extra={extra} onExtraChange={onExtraChange} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.sm },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  yLabel: { position: 'absolute', left: 0, width: PAD.l - 6, textAlign: 'right', fontSize: 10 },
  xLabel: { position: 'absolute', width: 40, textAlign: 'center', fontSize: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  legend: {
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127,127,127,0.18)',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  swatch: { width: 14, height: 3, borderRadius: 2 },
  swatchDashed: { width: 8 }, // shorter → reads as a dash segment (the overlay line is dashed)
  rowData: { fontWeight: '800', letterSpacing: -0.2, flexShrink: 1, textAlign: 'right' },
  whatIfToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  whatIfLabel: { fontWeight: '600' },
  waypointDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  waypointLabel: { position: 'absolute', width: 80, textAlign: 'center', fontSize: 9, fontWeight: '700' },
  endPill: { position: 'absolute', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  endPillText: { fontSize: 11, fontWeight: '800', letterSpacing: -0.2, color: '#10264f' },
  scrubLine: { position: 'absolute', width: 1, opacity: 0.5 },
  scrubDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  scrubReadout: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 172,
  },
  scrubReadoutText: { fontWeight: '700', fontSize: 11 },
});
