import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { FormSheet } from '@/components/ui/FormSheet';
import { PremiumInvite } from '@/components/premium/PremiumInvite';
import { TextField } from '@/components/ui/TextField';
import { useAppColors } from '@/hooks/use-app-colors';
import { haptics } from '@/motion';
import { appStore } from '@/store/appStore';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectWindfallSplit, type WindfallBucketKey } from '@/store/guardianSelectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

/** Display meta per windfall bucket — the label + glyph (all in the iOS SF-symbol map, `@/theme/icons`). */
const BUCKET_META: Record<WindfallBucketKey, { label: string; icon: IconGlyph }> = {
  bills: { label: 'Covers your bills & essentials first', icon: 'check-circle' },
  debt: { label: 'Extra to your debt', icon: 'trending-down' },
  emergency: { label: 'To your emergency fund', icon: 'savings' },
  goals: { label: 'Toward your goals', icon: 'star' },
  safetyNet: { label: 'Held as your safety net', icon: 'shield' },
  cash: { label: 'Left as spare cash', icon: 'account-balance-wallet' },
};

/**
 * Add one-time extra income to THIS paycheck (a bonus, refund, or side gig). Sets the per-cycle
 * `windfall`, which the allocation adds on top of the recurring paycheck and clears on rollover — so it
 * never permanently inflates the recurring take-home.
 *
 * Premium = the **Windfall Autopilot** beat: as the amount is entered, the app itemizes exactly where the
 * extra will land (the honest marginal split) so "Confirm" routes it in one tap — the automation identity
 * ("the app does the work, you confirm"). Free still adds the windfall (uncrippled), with a value-led
 * invite to the routing view (never a locked preview).
 */
export function WindfallSheet({ current, onClose }: { current: number; onClose: () => void }) {
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  const isPremium = store.subscriptionPlan === 'premium';
  const [amount, setAmount] = useState(current > 0 ? String(current) : '');
  const [error, setError] = useState('');

  const n = Number(amount);
  const validAmount = !!amount.trim() && Number.isFinite(n) && n > 0;

  // Memoize the projected store off the raw store so typing doesn't re-project balances each keystroke —
  // only the split (which genuinely depends on the amount) recomputes. Mirrors AffordabilityCard.
  const engineStore = useMemo(() => withProjectedBalances(store, isPremium), [store, isPremium]);
  const split = useMemo(
    () => (isPremium && validAmount ? selectWindfallSplit(engineStore, n) : null),
    [isPremium, validAmount, engineStore, n],
  );
  // C3 — only treat the split as renderable when it has rows (a sub-dollar windfall rounds to nothing).
  const hasSplit = split != null && split.items.length > 0;

  function submit() {
    if (!validAmount) return setError('Enter an amount greater than 0.');
    appStore.getState().setWindfall(n);
    haptics.success(); // a windfall landing is a positive beat
    onClose();
  }
  function remove() {
    appStore.getState().setWindfall(0);
    onClose();
  }

  const toneFor = (key: WindfallBucketKey): string =>
    key === 'debt' ? c.accent.primary : key === 'emergency' ? c.accent.success : c.text.secondary;

  return (
    <FormSheet
      visible
      title="Extra income"
      subtitle="A bonus, refund, or side gig — added to this paycheck only."
      submitLabel={isPremium && hasSplit ? 'Confirm' : 'Add'}
      onSubmit={submit}
      onRemove={current > 0 ? remove : undefined}
      onClose={onClose}>
      <TextField
        label="Amount"
        value={amount}
        onChangeText={(t) => {
          setAmount(t);
          setError('');
        }}
        placeholder="e.g. 500"
        keyboardType="decimal-pad"
        error={error || undefined}
      />

      {/* Premium: the autopilot routing — where every dollar of the windfall lands, before you confirm. */}
      {isPremium && hasSplit ? (
        <View style={styles.split}>
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>
            HERE&apos;S HOW THE APP WILL ROUTE {formatWhole(split.amount)}
          </Text>
          {split.items.map((item) => (
            // A4 — one utterance ("To your emergency fund, $700"), not icon + label + amount separately.
            <View key={item.key} style={styles.row} accessible accessibilityLabel={`${BUCKET_META[item.key].label}, ${formatWhole(item.amount)}`}>
              <AppIcon name={BUCKET_META[item.key].icon} size={18} color={toneFor(item.key)} />
              <Text style={[textStyles.subhead, styles.rowLabel, { color: c.text.primary }]}>{BUCKET_META[item.key].label}</Text>
              <Text style={[textStyles.numericBody, { color: toneFor(item.key) }]}>{formatWhole(item.amount)}</Text>
            </View>
          ))}
          <Text style={[textStyles.caption, styles.footHint, { color: c.text.tertiary }]}>
            Confirm to route it this way — your whole plan updates. Your call.
          </Text>
        </View>
      ) : !isPremium && validAmount ? (
        // Free adds the windfall as always; the invite sells the routing view, never a locked preview.
        <View style={styles.split}>
          <PremiumInvite message={`Premium shows exactly where your ${formatWhole(n)} lands — bills, debt, and savings — before you confirm.`} />
        </View>
      ) : null}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  split: { marginTop: spacing.md, gap: spacing.sm },
  eyebrow: { letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabel: { flex: 1, fontWeight: '600' },
  footHint: { marginTop: spacing.xs },
});
