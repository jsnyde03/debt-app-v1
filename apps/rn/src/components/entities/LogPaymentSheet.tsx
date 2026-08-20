import { LOG_PAYMENT_ENTRY } from '@core/copy/vocabulary';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import type { Debt } from '@/data/models';
import { appStore } from '@/store/appStore';
import { spacing } from '@/theme/spacing';

/**
 * 3.5.5.2 — the in-app "Log payment" twin: the mutation's VISIBLE home (the voice log-a-payment intent
 * shares the same `logManualPayment` action). A tiny amount entry → reduces the debt's balance + re-anchors
 * its verified date, and the Undo card lands on Today. Overpaying clears the debt to $0 (clamped).
 */
export function LogPaymentSheet({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const parsed = Number.parseFloat(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;
  const over = valid && parsed > debt.balance;

  const submit = () => {
    if (!valid) return;
    appStore.getState().logManualPayment(debt.id, parsed);
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
          error={over ? 'More than the balance — this will clear it to $0.' : undefined}
        />
        <Button label="Log payment" variant="primary" onPress={submit} disabled={!valid} />
      </View>
    </AnimatedSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.base, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
