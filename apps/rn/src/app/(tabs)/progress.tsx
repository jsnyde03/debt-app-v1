import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { MoreButton } from '@/components/more-button';
import { DriftCard } from '@/components/payoff/DriftCard';
import { TrajectoryChart } from '@/components/payoff/TrajectoryChart';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { useAppColors } from '@/hooks/use-app-colors';
import { useGoToTab } from '@/hooks/use-go-to-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { appStore } from '@/store/appStore';
import { selectDrift, selectPayoffView } from '@/store/payoffSelectors';
import { useAppStore } from '@/store/useAppStore';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const HERO_BG = { light: '#f1f0fb', dark: '#0e1a2e' } as const;

/**
 * Progress tab — TEMPORARY: still renders the old Payoff free-surface. Rebuilt as the journey
 * (navy ring · milestones · momentum · the debt-paid-off celebration) in 1.4.
 */
export default function ProgressScreen() {
  const c = useAppColors();
  const scheme = useColorScheme();
  const goToTab = useGoToTab();
  const store = useAppStore((s) => s.store);
  const strategy = store.payoffStrategy;
  const view = selectPayoffView(store);
  const drift = selectDrift(store);
  // Placeholder gate — C.2 replaces this with `hasFeatureAccess(plan, 'drift')` + the real paywall entry.
  const isPremiumPlus = store.subscriptionPlan === 'premium_plus';

  if (!view.hasDebts) {
    return (
      <Screen title="Progress" right={<MoreButton />}>
        <EmptyState
          icon="trending-down"
          title="No debts to pay off"
          body="Add a debt to see your payoff order, timeline, and interest saved."
          cta="Add a debt"
          onCta={() => goToTab('money')}
        />
      </Screen>
    );
  }

  const savedText =
    view.interestSaved.kind === 'saving'
      ? `Saves ${formatCurrency(view.interestSaved.interestSaved)} in interest vs. minimums`
      : view.interestSaved.kind === 'payoff-enabling'
        ? 'Minimums alone would never clear it — your plan does.'
        : null;

  return (
    <Screen title="Progress" right={<MoreButton />}>
      <View style={[styles.hero, { backgroundColor: HERO_BG[scheme], borderColor: c.border.default }]}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: c.accent.primary }]}>DEBT-FREE DATE</Text>
        <Text style={[styles.heroDate, { color: c.text.primary }]}>{view.debtFreeDate ?? '—'}</Text>
        {savedText ? <Text style={[textStyles.subhead, { color: c.text.secondary }]}>{savedText}</Text> : null}
      </View>

      <TrajectoryChart snowball={view.snowball} avalanche={view.avalanche} strategy={strategy} debtFreeDate={view.debtFreeDate} />

      <DriftCard drift={drift} isPremiumPlus={isPremiumPlus} />

      <View style={styles.stratBlock}>
        <SegmentedToggle
          value={strategy}
          onChange={(s) => appStore.getState().setPayoffStrategy(s)}
          options={[
            { value: 'snowball', label: 'Snowball' },
            { value: 'avalanche', label: 'Avalanche' },
          ]}
        />
        <Text style={[textStyles.caption, styles.stratDesc, { color: c.text.tertiary }]}>
          {strategy === 'snowball' ? 'Smallest balance first — quick wins for momentum.' : 'Highest APR first — least interest paid.'}
        </Text>
      </View>

      {view.focus ? (
        <Card>
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.secondary }]}>FOCUS DEBT</Text>
          <View style={styles.focusRow}>
            <Text style={[textStyles.title3, { color: c.text.primary }]} numberOfLines={1}>
              {view.focus.name}
            </Text>
            <Text style={[textStyles.numericBody, { color: c.text.primary, fontWeight: '700' }]}>{formatCurrency(view.focus.balance)}</Text>
          </View>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Highest-priority target · {view.focus.apr}% APR</Text>
          {view.focus.originalBalance && view.focus.originalBalance > 0 ? (
            <View style={[styles.track, { backgroundColor: c.background.tertiary }]}>
              <View
                style={[
                  styles.fill,
                  { backgroundColor: c.accent.success, width: `${Math.min(100, Math.max(0, (1 - view.focus.balance / view.focus.originalBalance) * 100))}%` },
                ]}
              />
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card padded={false}>
        <Text style={[textStyles.title3, styles.orderTitle, { color: c.text.primary }]}>Payoff order</Text>
        {view.order.map((d, i) => (
          <View
            key={d.id}
            style={[styles.orderRow, i < view.order.length - 1 && { borderBottomColor: c.border.subtle, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <Text style={[textStyles.numericBody, styles.rank, { color: c.text.tertiary }]}>{i + 1}</Text>
            <View style={styles.flex}>
              <Text style={[textStyles.bodyMedium, { color: c.text.primary }]} numberOfLines={1}>
                {d.name}
              </Text>
              <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                {d.apr}% APR · min {formatCurrency(d.minimumPayment)}
              </Text>
            </View>
            <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(d.balance)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: layout.cardRadiusLarge, borderWidth: StyleSheet.hairlineWidth, padding: layout.cardPaddingH + 2, gap: spacing.xs },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  heroDate: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  stratBlock: { gap: spacing.xs },
  stratDesc: { textAlign: 'center' },
  focusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.xs },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: spacing.sm },
  fill: { height: 6, borderRadius: 3 },
  orderTitle: { paddingHorizontal: layout.cardPaddingH, paddingTop: layout.cardPaddingV, paddingBottom: spacing.sm },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: layout.cardPaddingH, paddingVertical: spacing.md },
  rank: { width: 20, textAlign: 'center', fontWeight: '700' },
  flex: { flex: 1, gap: 2 },
});
