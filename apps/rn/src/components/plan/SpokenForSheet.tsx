import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import type { ExpenseReserveOffer } from '@/store/expenseReserveSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * 3.8.5 — what "Spoken for" is made of, and the two doors out of it.
 *
 * ⭐ This also closes 🎯's second report — *"living expenses are hidden in More"*. Two doors already
 * existed (More's settings row and a `LivingReserve` card on Money), but the Money card was gated on
 * `livingTotal > 0`, so it appeared only to people who had already found the feature. This one is
 * unconditional: it is reached from the Today hero, which every user sees on every open.
 *
 * A sheet rather than an inline expand: it carries two navigation doors AND an action, which will not fit
 * under a gradient hero without crowding it, and `AnimatedSheet` is the established pattern (3.4.5.7).
 */
export function SpokenForSheet({
  visible,
  onClose,
  everyday,
  billsReserve,
  offer,
  onManageEveryday,
  onReserve,
}: {
  visible: boolean;
  onClose: () => void;
  everyday: number;
  billsReserve: number;
  offer: ExpenseReserveOffer | null;
  onManageEveryday: () => void;
  onReserve: (amount: number) => void;
}) {
  const c = useAppColors();
  const total = everyday + billsReserve;

  return (
    <AnimatedSheet visible={visible} onClose={onClose} title="Spoken for">
      <View style={styles.echo}>
        <Text style={[styles.echoNum, { color: c.text.primary }]}>{formatCurrency(total)}</Text>
        <Text style={[textStyles.subhead, { color: c.text.tertiary }]}>of this paycheck is already accounted for</Text>
      </View>

      <Row
        label="Everyday spending"
        hint="Groceries, gas, fun money — reserved every paycheck."
        amount={everyday}
        onPress={onManageEveryday}
        actionLabel="Manage everyday spending"
      />
      <Row
        label="Upcoming bills"
        hint="Money you've set by for bills that land in a later cycle."
        amount={billsReserve}
      />

      {offer && offer.offer > 0 ? (
        <View style={[styles.offer, { borderColor: c.border.subtle, backgroundColor: c.background.secondary }]}>
          <Text style={[textStyles.body, { color: c.text.primary }]}>
            {/* ⛔ [A3.6] The copy states what this paycheck can ACTUALLY do. When the offer is capped by
                what is spare, it must not quote the full recommendation — promising $231 and reserving
                $150 is the promise-an-outcome-deliver-less defect this app has already shipped twice. */}
            {offer.coversRecommendation
              ? `Set by ${formatCurrency(offer.offer)} for your upcoming bills?`
              : `This paycheck can spare ${formatCurrency(offer.offer)} toward your upcoming bills.`}
          </Text>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
            {offer.coversRecommendation
              ? `That's the full ${formatCurrency(offer.recommended)} your bills average out to.`
              : `Less than the ${formatCurrency(offer.recommended)} they average out to — but it's what's genuinely free after your bills and your cushion.`}
          </Text>
          <Pressable
            onPress={() => onReserve(offer.alreadyReserved + offer.offer)}
            accessibilityRole="button"
            accessibilityLabel={`Set by ${formatCurrency(offer.offer)} for upcoming bills`}
            style={[styles.cta, { backgroundColor: c.accent.primary }]}>
            <Text style={[textStyles.body, styles.ctaText]}>Set by {formatCurrency(offer.offer)}</Text>
          </Pressable>
          {/* Never required: the plan is correct at every contribution level, including none. */}
          <Text style={[textStyles.caption, styles.optional, { color: c.text.tertiary }]}>Optional — your plan works either way.</Text>
        </View>
      ) : null}

      {billsReserve > 0 ? (
        <Pressable
          onPress={() => onReserve(0)}
          accessibilityRole="button"
          accessibilityLabel="Undo this paycheck's bill reserve"
          style={styles.undo}>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Undo this paycheck’s reserve</Text>
        </Pressable>
      ) : null}
    </AnimatedSheet>
  );
}

function Row({
  label,
  hint,
  amount,
  onPress,
  actionLabel,
}: {
  label: string;
  hint: string;
  amount: number;
  onPress?: () => void;
  actionLabel?: string;
}) {
  const c = useAppColors();
  const body = (
    <>
      <View style={styles.flex}>
        <Text style={[textStyles.body, { color: c.text.primary }]}>{label}</Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{hint}</Text>
      </View>
      <Text style={[textStyles.numericBody, { color: c.text.secondary }]}>{formatCurrency(amount)}</Text>
      {onPress ? <AppIcon name="chevron-right" size={16} color={c.text.tertiary} /> : null}
    </>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${actionLabel}. ${formatCurrency(amount)}.`}
      style={styles.row}>
      {body}
    </Pressable>
  ) : (
    <View style={styles.row} accessible accessibilityLabel={`${label}. ${formatCurrency(amount)}. ${hint}`}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  echo: { gap: 2 },
  echoNum: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  flex: { flex: 1 },
  offer: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: spacing.md, gap: spacing.sm, marginTop: spacing.xs },
  cta: { borderRadius: 12, paddingVertical: spacing.sm, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
  optional: { textAlign: 'center' },
  undo: { paddingVertical: spacing.sm, alignItems: 'center' },
});
