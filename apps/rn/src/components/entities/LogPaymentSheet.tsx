import { LOG_PAYMENT_ENTRY } from '@core/copy/vocabulary';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import type { Debt } from '@/data/models';
import { parseAmountField } from '@core/utils/amountField';
import { useActiveStore } from '@/store/StoreContext';
import { logPaymentOverNote, logPaymentSubtitle } from '@/store/logPaymentCopy';
import { useAppStore } from '@/store/useAppStore';
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
  /**
   * ⛔ **S1.12.5.6 [pass-5 `C5-3`] — THIS SHEET SAID "$0 owed" ON A CARD THE USER OWES $12,000 ON, ONE
   * TAP BELOW A ROW THAT CORRECTLY PRINTED AN EM DASH.**
   *
   * ⚡ Restore a backup where Chase's balance could not be read: Money puts it under **BALANCE UNREAD**
   * and the row prints `—`, exactly as pass-3 `C-1` intended. Open it, tap **Log payment**, and the
   * header reads **"Chase · $0 owed"**; type the $500 actually paid and the field says **"More than the
   * balance — this will clear it to $0."** Two false statements in the one flow where the user is telling
   * the app what they paid.
   *
   * ⚠️ **The write is NOT damaged, and that was checked rather than assumed** — `logManualPayment` clamps
   * to `0`, the repair record survives because the value did not move, and no celebration fires. **The
   * defect is the two sentences.** *"A remedy that deletes a debt from the screen"* is this round's named
   * hazard and it would have been easy to report a data-loss that is not there.
   *
   * ⛔ **`'row-figures'` is the claim this asks**, the same one the row beside it asks. Its population was
   * taken to be *"rows in a list"*, so every SHEET restating the same row's money was outside it by
   * construction — `lint:trust-claims` reports 0 open claim sites while eight sheets reference no trust
   * selector at all. ⚠️ Lane C measured only this one and listed the rest as a population to check;
   * they are named in `C-screens.md`, not treated as findings here.
   */
  const store = useAppStore((st) => st.store);
  const [amount, setAmount] = useState('');
  // ⛔ **Not `parseFloat`.** This was the one money field parsed that way, and `parseFloat` stops at the
  // first character it cannot read — so a pasted `"1,200"` logged a **$1** payment against the debt,
  // silently and plausibly, where every other field would have refused it outright.
  const parsed = parseAmountField(amount);
  const valid = parsed != null;
  const overNote = logPaymentOverNote(store, debt, parsed);

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
      subtitle={logPaymentSubtitle(store, debt)}
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
          note={overNote}
        />
        <Button label="Log payment" variant="primary" onPress={submit} disabled={!valid} />
      </View>
    </AnimatedSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.base, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
