import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cardElevation } from '@/theme/elevation';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

/** The free momentum layer — interest saved vs. minimums + total paid so far. (Streaks = Premium.) */
export function MomentumStats({ interestSaved, paid }: { interestSaved: number; paid: number }) {
  const c = useAppColors();
  const scheme = useColorScheme();
  return (
    <View style={styles.row}>
      <Tile label="Interest saved" value={formatCurrency(interestSaved)} tone={c.accent.success} scheme={scheme} />
      <Tile label="Paid so far" value={formatCurrency(paid)} tone={c.text.primary} scheme={scheme} />
    </View>
  );
}

function Tile({ label, value, tone, scheme }: { label: string; value: string; tone: string; scheme: 'light' | 'dark' }) {
  const c = useAppColors();
  return (
    <View
      {...groupLabel(label, value)}
      style={[styles.tile, cardElevation(scheme), { backgroundColor: c.background.secondary }]}>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{label}</Text>
      <Text style={[styles.value, { color: tone }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, borderRadius: 16, gap: 4, paddingHorizontal: spacing.base, paddingVertical: spacing.base },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
});
