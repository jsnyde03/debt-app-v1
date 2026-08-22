import { LOG_PAYMENT_ENTRY } from '@core/copy/vocabulary';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import type { Debt } from '@/data/models';
import { parseAmountField } from '@/store/amountField';
import { useActiveStore } from '@/store/StoreContext';
import { spacing } from '@/theme/spacing';

/**
 * 3.5.5.2 — the in-app "Log payment" twin: the mutation's VISIBLE home (the voice log-a-payment intent
 * shares the same `logManualPayment` action). A tiny amount entry → reduces the debt's balance + re-anchors
 * its verified date, and the Undo card lands on Today. Overpaying clears the debt to $0 (clamped).
 */
export function LogPaymentSheet({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  // [R4] The store this subtree resolves to. Not in R4's original site table — the demo's Money tab
  // offers "Log payment" on every persona debt, so this wrote a real payment against a scripted balance.
  const store_ = useActiveStore();
  const [amount, setAmount] = useState('');
  // ⛔ **Not `parseFloat`.** This was the one money field parsed that way, and `parseFloat` stops at the
  // first character it cannot read — so a pasted `"1,200"` logged a **$1** payment against the debt,
  // silently and plausibly, where every other field would have refused it outright.
  const parsed = parseAmountField(amount);
  const valid = parsed != null;
  const over = parsed != null && parsed > debt.balance;

  const submit = () => {
    if (parsed == null) return;
    store_.getState().logManualPayment(debt.id, parsed);
    onClose();
  };

  return (
    <AnimatedSheet
      visible
      onClose={onClose}
      title={LOG_PAYMENT_ENTRY}
      subtitle={`${debt.name} · ${formatCurrency(debt.balance)} owed`}
      dirty={amount.length > 0}>
      <View style={styles.body}>
        <TextField
          label="Amount paid"
          value={amount}
          onChangeText={setAmount}
          placeholder="$0"
          keyboardType="decimal-pad"
          // [P6.4.5 · audit L6-9] `note`, not `error`. Paying more than the balance is a legitimate
          // thing to do — the sheet accepts it and the submit button stays enabled — so describing it
          // in the danger treatment contradicted the control the user is looking at.
          note={over ? 'More than the balance — this will clear it to $0.' : undefined}
        />
        <Button label="Log payment" variant="primary" onPress={submit} disabled={!valid} />
      </View>
    </AnimatedSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.base, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
