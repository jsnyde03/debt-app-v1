import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { PayoffStrategy } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { TrajectoryPoint } from '@/store/payoffSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

import { TrajectoryCanvas } from './TrajectoryCanvas';

const H = 150;
const PAD = { l: 6, r: 10, t: 14, b: 12 };

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
  strategy,
  debtFreeDate,
}: {
  snowball: TrajectoryPoint[];
  avalanche: TrajectoryPoint[];
  strategy: PayoffStrategy;
  debtFreeDate: string | null;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const [w, setW] = useState(0);

  const active = strategy === 'snowball' ? snowball : avalanche;
  const ghost = strategy === 'snowball' ? avalanche : snowball;
  const all = [...snowball, ...avalanche];
  const maxMonth = Math.max(1, ...all.map((p) => p.month));
  const maxBalance = Math.max(1, ...all.map((p) => p.balance));

  const mapX = (month: number) => PAD.l + (month / maxMonth) * (w - PAD.l - PAD.r);
  const mapY = (bal: number) => PAD.t + (1 - bal / maxBalance) * (H - PAD.t - PAD.b);
  const toPts = (traj: TrajectoryPoint[]): Pt[] => traj.map((p) => ({ x: mapX(p.month), y: mapY(p.balance) }));

  const activePts = w > 0 ? toPts(active) : [];
  const activePath = smoothPath(activePts);
  const ghostPath = w > 0 ? smoothPath(toPts(ghost)) : '';
  const areaPath =
    activePts.length >= 2
      ? `${activePath} L${activePts[activePts.length - 1].x.toFixed(1)},${H} L${activePts[0].x.toFixed(1)},${H} Z`
      : '';

  const endPoint = active.find((p) => p.balance <= 0);
  const endpoint = endPoint && w > 0 ? { x: mapX(endPoint.month), y: mapY(0) } : null;
  const start = activePts.length ? activePts[0] : null;

  const dark = scheme === 'dark';
  const gold = dark ? '#f7cf5f' : '#dca01f';
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
          <TrajectoryCanvas
            width={w}
            height={H}
            activePath={activePath}
            areaPath={areaPath}
            ghostPath={ghostPath}
            endpoint={endpoint}
            start={start}
            palette={palette}
          />
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Now</Text>
        {debtFreeDate ? (
          <Text style={[textStyles.caption, styles.dfLabel, { color: gold }]}>Debt-free {debtFreeDate}</Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.sm },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  dfLabel: { fontWeight: '700' },
});
