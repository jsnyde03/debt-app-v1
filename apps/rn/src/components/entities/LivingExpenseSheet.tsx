import { useRef, useState } from 'react';

import { FormSheet } from '@/components/ui/FormSheet';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import type { LivingExpense } from '@/data/models';
import { appStore } from '@/store/appStore';
import { FORM_ERRORS } from '@/store/obligationForm';
import { confirmDelete } from '@/utils/confirm';

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
  // 3.4.5.5 dirty-guard: confirm before discarding unsaved edits on tap/swipe dismiss.
  const snapshot = JSON.stringify({ name, amount, enabled });
  const initialSnapshot = useRef(snapshot);
  const dirty = snapshot !== initialSnapshot.current;

  function submit() {
    if (!name.trim()) return setError(FORM_ERRORS.nameRequired);
    if (!amount || Number(amount) <= 0) return setError(FORM_ERRORS.amountPositive);
    const fields = { name: name.trim(), amount: Number(amount), enabled };
    if (isEdit && editing) appStore.getState().updateLivingExpense(editing.id, fields);
    else appStore.getState().addLivingExpense({ id: `living-${Date.now()}`, ...fields });
    onClose();
  }
  // 3.5.6b — confirms, like every other delete path. See `DebtSheet.remove` for why the direct action
  // was retired: same destructive act, and the sheet was the one entry point that did not guard it.
  async function remove() {
    if (!editing) return;
    if (!(await confirmDelete(`Delete ${editing.name}?`))) return;
    appStore.getState().removeLivingExpense(editing.id);
    onClose();
  }

  return (
    <FormSheet
      visible
      title={isEdit ? 'Edit spending item' : 'Add a spending item'}
      subtitle="Everyday spending you reserve each paycheck (groceries, gas, fun)."
      submitLabel={isEdit ? 'Save' : 'Add item'}
      onSubmit={submit}
      onRemove={isEdit ? remove : undefined}
      onClose={onClose}
      dirty={dirty}>
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
