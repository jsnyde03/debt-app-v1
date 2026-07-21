import { useState } from 'react';

import { FormSheet } from '@/components/ui/FormSheet';
import { TextField } from '@/components/ui/TextField';
import { appStore } from '@/store/appStore';

/**
 * Add one-time extra income to THIS paycheck (a bonus, refund, or side gig). Sets the per-cycle
 * `windfall`, which the allocation adds on top of the recurring paycheck and clears on rollover —
 * so it never permanently inflates the recurring take-home.
 */
export function WindfallSheet({ current, onClose }: { current: number; onClose: () => void }) {
  const [amount, setAmount] = useState(current > 0 ? String(current) : '');
  const [error, setError] = useState('');

  function submit() {
    const n = Number(amount);
    if (!amount || !Number.isFinite(n) || n <= 0) return setError('Enter an amount greater than 0.');
    appStore.getState().setWindfall(n);
    onClose();
  }
  function remove() {
    appStore.getState().setWindfall(0);
    onClose();
  }

  return (
    <FormSheet
      visible
      title="Extra income"
      subtitle="A bonus, refund, or side gig — added to this paycheck only."
      submitLabel="Add"
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
    </FormSheet>
  );
}
