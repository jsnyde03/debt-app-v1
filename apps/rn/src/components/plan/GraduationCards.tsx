import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { eyebrow, textStyles } from '@/theme/typography';
import { openFinancialFreedom } from '@/utils/ecosystem';

/**
 * Graduation surface (2.4.8) — what Today shows once every balance is cleared. Two calm, PERMANENT cards
 * that sit above the (still-running) autopilot: a dignified debt-free banner and the ecosystem "next
 * chapter" invite. The one-time celebration spectacle + the debts-paid-off archive are Phase 3 (gated
 * on the confirmed-$0 signal); this is the steady-state, so it stays calm — no count-up, no confetti.
 */

/** The permanent "you're debt-free" banner — a quiet, earned statement, not a one-time burst. */
export function GraduationBanner() {
  const c = useAppColors();
  return (
    <Card>
      <View style={styles.bannerRow}>
        <View style={[styles.icon, { backgroundColor: c.background.tertiary }]}>
          <AppIcon name="celebration" size={26} color={c.accent.success} />
        </View>
        <View style={styles.bannerText}>
          <Text style={[textStyles.title3, { color: c.text.primary }]}>You’re debt-free</Text>
          <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
            Every balance is cleared. Your paycheck now builds your future instead of paying down the past.
          </Text>
        </View>
      </View>
    </Card>
  );
}

/**
 * The earned "next chapter" invite — hands the graduate to Financial Freedom (build wealth / Freedom
 * Date). Honest framing (§2.7): a convenient next step, never "the accurate version" and never required.
 */
export function FreedomNextChapterCard() {
  const c = useAppColors();
  return (
    <Card tone="accent">
      <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>YOUR NEXT CHAPTER</Text>
      <View style={styles.head}>
        <AppIcon name="trending-up" size={22} color={c.accent.primary} />
        <Text style={[textStyles.title3, styles.headTitle, { color: c.text.primary }]}>Ready to build wealth?</Text>
      </View>
      <Text style={[textStyles.subhead, styles.body, { color: c.text.secondary }]}>
        Financial Freedom picks up where this leaves off — turn the money you were sending to debt into a plan for
        your Freedom Date. A convenient next step, not a required one.
      </Text>
      <Button label="Explore Financial Freedom →" variant="secondary" onPress={openFinancialFreedom} style={styles.cta} />
    </Card>
  );
}

const styles = StyleSheet.create({
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, gap: spacing.xs },
  eyebrow: { ...eyebrow, marginBottom: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headTitle: { flex: 1 },
  body: { marginTop: spacing.sm },
  cta: { alignSelf: 'stretch', marginTop: spacing.md },
});
