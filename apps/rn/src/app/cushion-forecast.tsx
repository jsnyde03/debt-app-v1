import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CashFlowSection } from '@/components/progress/CashFlowSection';
import { Screen } from '@/components/screen';
import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { selectCashTimeline } from '@/store/payoffSelectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { announce } from '@/utils/a11y';

/**
 * §2.6 drill-down (2.4.7.9) — a PUSHED route (not a silent tab-jump) into the elevated cushion forecast,
 * so "came from Today" + back are preserved. Adds a Guardian-SOURCED header the standalone Progress
 * visitor doesn't get (the nearest upcoming tight cycle, from the same brief the card shows), then reuses
 * the Progress `CashFlowSection` (Cushion lens + the per-cycle "why" TimelineLedger). Announced on open.
 */
export default function CushionForecastScreen() {
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  const isPremium = store.subscriptionPlan === 'premium';
  const engineStore = withProjectedBalances(store, isPremium);
  const cycles = selectCashTimeline(engineStore);
  const brief = selectPaydayGuardian(engineStore);

  useEffect(() => {
    announce('Cushion forecast');
  }, []);

  const tight = brief?.lookahead;

  return (
    <Screen title="Your cushion forecast" onBack={() => router.back()}>
      {/* Guardian-sourced header — the context the standalone Progress view doesn't carry. */}
      <View style={[styles.header, { backgroundColor: c.background.tertiary, borderColor: c.border.subtle }]}>
        <View style={styles.headerRow}>
          <AppIcon name={tight ? 'gpp-maybe' : 'gpp-good'} size={20} color={tight ? c.accent.warning : c.text.secondary} />
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>PAYDAY GUARDIAN</Text>
        </View>
        <Text style={[textStyles.subhead, styles.headerText, { color: c.text.secondary }]}>
          {tight ?? 'Clear for the cycles ahead — no crunch in sight. Here’s how each paycheck lands.'}
        </Text>
      </View>

      <CashFlowSection cycles={cycles} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: spacing.md, marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrow: { letterSpacing: 0.8 },
  headerText: { marginTop: spacing.xs },
});
