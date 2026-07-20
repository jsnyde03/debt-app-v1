import { useState } from 'react';

import { FormSheet } from '@/components/ui/FormSheet';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import type { LivingExpense } from '@/data/models';
import { appStore } from '@/store/appStore';

/**
 * Unified add/edit sheet for an everyday-spending item (the living-expenses reserve). One form drives
 * both modes (the B.6 sheet pattern). `enabled` toggles whether it counts toward the reserve set aside
 * each paycheck without deleting the item.
 */
export function LivingExpenseSheet({ editing, onClose }: { editing: LivingExpense | null; onClose: () => void }) {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [enabled, setEnabled] = useState(editing?.enabled ?? true);
  const [error, setError] = useState('');

  function submit() {
    if (!name.trim()) return setError('Enter a name.');
    if (!amount || Number(amount) <= 0) return setError('Enter an amount greater than 0.');
    const fields = { name: name.trim(), amount: Number(amount), enabled };
    if (isEdit && editing) appStore.getState().updateLivingExpense(editing.id, fields);
    else appStore.getState().addLivingExpense({ id: `living-${Date.now()}`, ...fields });
    onClose();
  }
  function remove() {
    if (editing) {
      appStore.getState().removeLivingExpense(editing.id);
      onClose();
    }
  }

  return (
    <FormSheet
      visible
      title={isEdit ? 'Edit spending item' : 'Add a spending item'}
      subtitle="Everyday spending you set aside for each paycheck (groceries, gas, fun)."
      submitLabel={isEdit ? 'Save' : 'Add item'}
      onSubmit={submit}
      onRemove={isEdit ? remove : undefined}
      onClose={onClose}>
      <TextField label="Name" value={name} onChangeText={(t) => { setName(t); setError(''); }} placeholder="Groceries, gas, fun" />
      <TextField
        label="Amount per paycheck"
        value={amount}
        onChangeText={(t) => { setAmount(t); setError(''); }}
        placeholder="e.g. 300"
        keyboardType="decimal-pad"
        error={error || undefined}
      />
      <SwitchRow label="Count toward my reserve" value={enabled} onValueChange={setEnabled} />
    </FormSheet>
  );
}
