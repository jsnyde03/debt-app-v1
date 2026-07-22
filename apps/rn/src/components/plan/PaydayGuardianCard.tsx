import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import type { GuardianBrief, GuardianState } from '@/store/guardianSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

/**
 * Payday Cushion Guardian card (2.4) — the premium headline on Today. Answers "am I going to make it
 * THIS paycheck?" from the projected cushion, risk-framed and hedged (never a false-precise verdict).
 *
 * Calm register: this is risk information, so no beats/haptics/count-up ([[match motion to surface
 * job]]) — it rides Today's entrance stagger, nothing more. Premium gating is value-led ([[premium
 * gating value_led]]): a free user sees the REAL read for this paycheck (the taste) with an honest
 * invitation to the ongoing watch + the specific move — never a blurred lock.
 */
export function PaydayGuardianCard({ brief, isPremium }: { brief: GuardianBrief; isPremium: boolean }) {
  const c = useAppColors();
  const tone: Record<GuardianState, { color: string; icon: IconGlyph }> = {
    clear: { color: c.text.secondary, icon: 'gpp-good' }, // slate — green means progress elsewhere
    tight: { color: c.accent.warning, icon: 'gpp-maybe' },
    'at-risk': { color: c.accent.danger, icon: 'gpp-bad' },
  };
  const { color, icon } = tone[brief.state];

  return (
    <Card>
      <View
        {...groupLabel(
          'Payday Guardian',
          brief.title,
          brief.detail,
          isPremium ? brief.safeMove : 'Premium tells you the safe move and watches every paycheck',
          isPremium ? brief.lookahead : undefined,
        )}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>PAYDAY GUARDIAN</Text>

        <View style={styles.head}>
          <AppIcon name={icon} size={22} color={color} />
          <Text style={[textStyles.title3, styles.title, { color }]}>{brief.title}</Text>
        </View>

        <Text style={[textStyles.subhead, styles.detail, { color: c.text.secondary }]}>{brief.detail}</Text>

        <View style={[styles.divider, { backgroundColor: c.border.subtle }]} />

        {isPremium ? (
          <>
            <Text style={[textStyles.subhead, styles.move, { color: c.text.primary }]}>{brief.safeMove}</Text>
            {brief.lookahead ? (
              <Text style={[textStyles.caption, styles.look, { color: c.text.tertiary }]}>{brief.lookahead}</Text>
            ) : null}
          </>
        ) : (
          <View style={styles.invite} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <AppIcon name="workspace-premium" size={18} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.inviteText, { color: c.accent.primary }]}>
              Premium tells you the exact safe move and watches every paycheck for you.
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  eyebrow: { letterSpacing: 0.8, marginBottom: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  detail: { marginTop: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  move: { fontWeight: '600' },
  look: { marginTop: spacing.sm },
  invite: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inviteText: { flex: 1, fontWeight: '600' },
});
