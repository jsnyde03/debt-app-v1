import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cardElevation } from '@/theme/elevation';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const MILES = [
  { label: '25%', t: 25 },
  { label: '50%', t: 50 },
  { label: '75%', t: 75 },
  { label: 'Free', t: 100 },
] as const;

/** The payoff milestones — 25/50/75% and debt-free. Hit = filled check (gold star for Free). */
export function MilestonesRow({ pct, debtFreeLabel }: { pct: number; debtFreeLabel?: string }) {
  const c = useAppColors();
  const scheme = useColorScheme();
  return (
    <View style={styles.row}>
      {MILES.map((m) => {
        const hit = pct >= m.t;
        const isFree = m.t === 100;
        const mark = isFree ? c.accent.gold : c.accent.success;
        return (
          <View
            key={m.label}
            {...{ accessible: true, accessibilityLabel: `${m.label}${hit ? ', reached' : ', not yet'}` }}
            style={[styles.chip, cardElevation(scheme), { backgroundColor: c.background.secondary }]}>
            <View style={[styles.mk, hit ? { backgroundColor: mark, borderColor: mark } : { borderColor: c.border.strong }]}>
              {hit ? <AppIcon name={isFree ? 'star' : 'check'} size={12} color={c.text.onAccent} /> : null}
            </View>
            <Text style={[textStyles.footnote, styles.v, { color: c.text.primary }]}>{m.label}</Text>
            {isFree && debtFreeLabel ? (
              <Text style={[textStyles.caption, { color: c.text.tertiary }]} numberOfLines={1}>
                {debtFreeLabel}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: { flex: 1, borderRadius: 14, alignItems: 'center', gap: 4, paddingVertical: spacing.md, paddingHorizontal: spacing.xs },
  mk: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  v: { fontWeight: '700' },
});
