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
  if (pow.heldStreak >= 1) chips.push(`Held your line · ${pow.heldStreak} ${pow.heldStreak === 1 ? 'paycheck' : 'paychecks'}`);
  if (pow.totalToDebt > 0) chips.push(`${formatWhole(pow.totalToDebt)} to debt`);
  if (pow.score.proven && pow.score.matchRate != null) chips.push(`Reads matched · ${pow.score.matches}/${pow.score.n}`);
  if (chips.length === 0) return null;

  // VIS-3 — the proof of work reads as distinct visual TOKENS (calm pills), not a single tertiary prose
  // line, so the "what am I paying for" record has real presence. Reference surface: tonal, no motion.
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`The Guardian's record so far: ${chips.join(', ')}`}>
      <AppIcon name="verified-user" size={15} color={c.accent.primary} />
      <View style={styles.chips}>
        {chips.map((chip) => (
          <View key={chip} style={[styles.chip, { backgroundColor: c.background.tertiary }]}>
            {/* A2 — text.primary on the tertiary chip clears WCAG AA in BOTH themes (secondary was 4.25:1 in light). */}
            <Text style={[textStyles.caption, { color: c.text.primary }]} numberOfLines={1}>
              {chip}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: spacing.md },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 8 },
});
