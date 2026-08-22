import { EMERGENCY_FUND_NOUN } from '@core/copy/vocabulary';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { FormSheet } from '@/components/ui/FormSheet';
import { PremiumInvite } from '@/components/premium/PremiumInvite';
import { TextField } from '@/components/ui/TextField';
import { useAppColors } from '@/hooks/use-app-colors';
import { haptics } from '@/motion';
import { useActiveStore } from '@/store/StoreContext';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectWindfallSplit, type WindfallBucketKey } from '@/store/guardianSelectors';
import { FORM_ERRORS } from '@/store/obligationForm';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

/** Display meta per windfall bucket — the label + glyph (all in the iOS SF-symbol map, `@/theme/icons`). */
const BUCKET_META: Record<WindfallBucketKey, { label: string; icon: IconGlyph }> = {
  bills: { label: 'Covers your expenses & essentials first', icon: 'check-circle' },
  debt: { label: 'Extra to your debt', icon: 'trending-down' },
  emergency: { label: `To ${EMERGENCY_FUND_NOUN}`, icon: 'savings' },
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
  // 3.5.3.0 — write to the store this subtree resolves to (sandbox under the tutorial, real otherwise).
  const store_ = useActiveStore();
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
    if (!validAmount) return setError(FORM_ERRORS.amountPositive);
    store_.getState().setWindfall(n);
    haptics.success(); // a windfall landing is a positive beat
    onClose();
  }
  function remove() {
    store_.getState().setWindfall(0);
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
            HERE’S HOW THE APP WILL ROUTE {formatWhole(split.amount)}
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
        // ⛔ [P1-10] THE OLD INVITE WAS TRUE AND STILL MISLED. It read "Premium shows exactly where your
        // $500 lands", which is literally correct — premium renders the itemised split — but to a free
        // user standing in front of it, it reads as though the money is not routed until they pay. It is:
        // `selectors.ts:54` folds the windfall into the paycheck with NO tier gate, and the identical
        // waterfall allocates it either way.
        //
        // ⚠️ So the sentence now leads with what already happened, and sells only what is actually bought:
        // the itemisation. Saying it in this order costs the paywall nothing it was entitled to.
        //
        // ⛔ **This is the COPY half of P1-10 and not its fix.** The finding is that the tier is inverted —
        // free does the WORK and premium reports it, which is the premium spec's own price test upside
        // down ("removing it must remove WORK, not just info"). Correcting that is a monetisation change
        // and 🎯's call; it is filed on the plan, unbuilt, and must clear P6.10 if it happens.
        <View style={styles.split}>
          <PremiumInvite message={`Your ${formatWhole(n)} is already in the plan. Premium itemizes where it lands — expenses, debt, and savings — before you confirm.`} />
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
