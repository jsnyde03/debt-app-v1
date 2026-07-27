import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import type { GuardianProofOfWork } from '@/store/guardianSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

/**
 * §3.3.3.2 — the Guardian proof-of-work strip: a calm, VISUAL footer on the CLEAR-cycle premium card that
 * makes the automation's accumulating work visible where it otherwise disappears (the churn-hole fix). A
 * shield glyph + factual chips (held-your-line streak · $ to debt · proven accuracy). Reference surface —
 * tonal, no count-up / haptic. Renders nothing until there's real data (never a hollow "0 paychecks"); the
 * adjacent "See your forecast →" link opens the full scorecard.
 */
export function GuardianProofStrip({ pow }: { pow: GuardianProofOfWork }) {
  const c = useAppColors();

  const chips: string[] = [];
  if (pow.heldStreak >= 1) chips.push(`held your line ${pow.heldStreak} ${pow.heldStreak === 1 ? 'paycheck' : 'paychecks'}`);
  if (pow.totalToDebt > 0) chips.push(`${formatWhole(pow.totalToDebt)} to debt`);
  if (pow.score.proven && pow.score.matchRate != null) chips.push(`reads matched ${pow.score.matches}/${pow.score.n}`);
  if (chips.length === 0) return null;

  const line = chips.join(' · ');
  const display = line.charAt(0).toUpperCase() + line.slice(1);

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`The Guardian's record so far: ${display}`}>
      <AppIcon name="verified-user" size={15} color={c.text.tertiary} />
      <Text style={[textStyles.footnote, styles.text, { color: c.text.tertiary }]} numberOfLines={2}>
        {display}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  text: { flex: 1 },
});
