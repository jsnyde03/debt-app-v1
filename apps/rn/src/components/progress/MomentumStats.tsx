import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { InterestSaved } from '@/store/payoffSelectors';
import { cardElevation } from '@/theme/elevation';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

function formatMonths(months: number): string {
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  return `${Math.round(months / 12)} years`;
}

/**
 * The free momentum layer — the motivating "your plan beats minimums" story. Three states from
 * `computeInterestSaved`: **payoff-enabling** (minimums alone would NEVER clear the debt — the
 * strongest case, a full-width banner), **saving** (interest + months saved vs. minimums), and
 * none. Restores the Capacitor narrative RN had flattened to a bare "$0" number. (Streaks = Premium.)
 */
export function MomentumStats({ interestSaved, paid }: { interestSaved: InterestSaved; paid: number }) {
  const c = useAppColors();
  const scheme = useColorScheme();

  // The strongest motivator: the plan is what makes payoff possible at all.
  if (interestSaved.kind === 'payoff-enabling') {
    return (
      <View
        {...groupLabel(
          'Your plan is working',
          `Minimum payments alone would never clear your debt; your plan gets you debt-free by ${interestSaved.debtFreeDate}`,
        )}
        style={[styles.enabling, cardElevation(scheme), { backgroundColor: c.background.secondary }]}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.accent.success }]}>YOUR PLAN IS WORKING</Text>
        <Text style={[textStyles.subhead, { color: c.text.primary }]}>
          Minimum payments alone would <Text style={styles.bold}>never</Text> clear your debt — your plan gets you debt-free by{' '}
          <Text style={[styles.bold, { color: c.accent.success }]}>{interestSaved.debtFreeDate}</Text>.
        </Text>
      </View>
    );
  }

  const savedAmount = interestSaved.kind === 'saving' ? interestSaved.interestSaved : 0;
  const monthsSaved = interestSaved.kind === 'saving' ? interestSaved.monthsSaved : 0;

  return (
    <View style={styles.row}>
      <Tile
        label="Interest saved"
        value={formatCurrency(savedAmount)}
        sub={monthsSaved > 0 ? `${formatMonths(monthsSaved)} sooner` : undefined}
        tone={c.accent.success}
        scheme={scheme}
      />
      <Tile label="Paid so far" value={formatCurrency(paid)} tone={c.text.primary} scheme={scheme} />
    </View>
  );
}

function Tile({
  label,
  value,
  sub,
  tone,
  scheme,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: string;
  scheme: 'light' | 'dark';
}) {
  const c = useAppColors();
  return (
    <View {...groupLabel(label, value, sub)} style={[styles.tile, cardElevation(scheme), { backgroundColor: c.background.secondary }]}>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{label}</Text>
      <Text style={[styles.value, { color: tone }]}>{value}</Text>
      {sub ? <Text style={[textStyles.caption, { color: c.accent.success }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, borderRadius: 16, gap: 4, paddingHorizontal: spacing.base, paddingVertical: spacing.base },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  enabling: { borderRadius: 16, gap: spacing.xs, paddingHorizontal: spacing.base, paddingVertical: spacing.base },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  bold: { fontWeight: '800' },
});
