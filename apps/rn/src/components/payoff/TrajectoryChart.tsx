import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { Card } from '@/components/ui/Card';
import type { PayoffStrategy } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import type { TrajectoryPoint } from '@/store/payoffSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const W = 300;
const H = 120;
const PAD = 10;

function toPolyline(traj: TrajectoryPoint[], maxMonth: number, maxBalance: number): string {
  if (traj.length < 2 || maxMonth <= 0 || maxBalance <= 0) return '';
  return traj
    .map((p) => {
      const x = PAD + (p.month / maxMonth) * (W - 2 * PAD);
      const y = PAD + (1 - p.balance / maxBalance) * (H - 2 * PAD);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/**
 * The payoff trajectory: total balance over time. The ACTIVE strategy is drawn bold; the other is
 * a faint ghost. Since the store's `payoffStrategy` picks the active line, the Snowball/Avalanche
 * toggle visibly redraws it (fixing the Capacitor disconnect). Stroke-draw animation → B.9.
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
  const active = strategy === 'snowball' ? snowball : avalanche;
  const ghost = strategy === 'snowball' ? avalanche : snowball;

  const all = [...snowball, ...avalanche];
  const maxMonth = Math.max(1, ...all.map((p) => p.month));
  const maxBalance = Math.max(1, ...all.map((p) => p.balance));

  const activeLine = toPolyline(active, maxMonth, maxBalance);
  const ghostLine = toPolyline(ghost, maxMonth, maxBalance);

  const endPoint = active.find((p) => p.balance <= 0);
  const endX = endPoint ? PAD + (endPoint.month / maxMonth) * (W - 2 * PAD) : 0;

  return (
    <Card>
      <View style={styles.head}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.secondary }]}>PAYOFF TRAJECTORY</Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Balance over time</Text>
      </View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={c.border.subtle} strokeWidth={1} />
        {ghostLine ? <Polyline points={ghostLine} fill="none" stroke={c.text.tertiary} strokeWidth={1.5} strokeOpacity={0.35} /> : null}
        {activeLine ? <Polyline points={activeLine} fill="none" stroke={c.accent.primary} strokeWidth={2.5} /> : null}
        {endPoint ? <Circle cx={endX} cy={H - PAD} r={4} fill={c.accent.success} /> : null}
      </Svg>
      <View style={styles.footer}>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Now</Text>
        {debtFreeDate ? (
          <Text style={[textStyles.caption, styles.dfLabel, { color: c.accent.success }]}>Debt-free {debtFreeDate}</Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.sm },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  dfLabel: { fontWeight: '600' },
});
