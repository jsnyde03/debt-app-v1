import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { PayoffStrategy } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { InterestSaved, TrajectoryPoint } from '@/store/payoffSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

import { TrajectoryCanvas } from './TrajectoryCanvas';

const H = 200;
// Left gutter holds the balance labels; bottom gutter holds the time ticks.
const PAD = { l: 38, r: 14, t: 16, b: 26 };

/** Whole-dollar currency (no cents) — a big saved figure reads cleaner than "$1,222.00". */
function formatWhole(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(safe);
}

function formatMonths(months: number): string {
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  return `${Math.round(months / 12)} years`;
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
  minimums,
  strategy,
  debtFreeDate,
  interestSaved,
  startDate,
}: {
  snowball: TrajectoryPoint[];
  avalanche: TrajectoryPoint[];
  minimums: TrajectoryPoint[];
  strategy: PayoffStrategy;
  debtFreeDate: string | null;
  interestSaved: InterestSaved;
  startDate: string;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const [w, setW] = useState(0);

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
  };

  return (
    <Card>
      <View style={styles.head}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.secondary }]}>PAYOFF TRAJECTORY</Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Balance over time</Text>
      </View>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H }}>
        {w > 0 && activePath ? (
          <>
            <TrajectoryCanvas
              width={w}
              height={H}
              activePath={activePath}
              areaPath={areaPath}
              ghostPath={ghostPath}
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
          </>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Now</Text>
        {debtFreeDate ? (
          <Text style={[textStyles.caption, styles.dfLabel, { color: gold }]}>Debt-free {debtFreeDate}</Text>
        ) : null}
      </View>

      {showMinimums ? (
        <View style={styles.legend}>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: c.accent.primary }]} />
              <Text style={[textStyles.caption, { color: c.text.secondary }]}>Your plan</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: c.text.tertiary, opacity: 0.55 }]} />
              <Text style={[textStyles.caption, { color: c.text.secondary }]}>Minimum payments</Text>
            </View>
          </View>
          <Text style={[textStyles.caption, styles.saved, { color: c.accent.success }]}>
            {interestSaved.kind === 'saving'
              ? `${formatWhole(interestSaved.interestSaved)} · ${formatMonths(interestSaved.monthsSaved)} saved`
              : 'Minimums never pay it off'}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.sm },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  yLabel: { position: 'absolute', left: 0, width: PAD.l - 6, textAlign: 'right', fontSize: 10 },
  xLabel: { position: 'absolute', width: 40, textAlign: 'center', fontSize: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  dfLabel: { fontWeight: '700' },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(127,127,127,0.18)',
  },
  legendItems: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 14, height: 3, borderRadius: 2 },
  saved: { fontWeight: '800' },
});
