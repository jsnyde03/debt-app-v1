import { useRef, useState } from 'react';

import { FormSheet } from '@/components/ui/FormSheet';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import type { LivingExpense } from '@/data/models';
import { useActiveStore } from '@/store/StoreContext';
import { parseAmountField } from '@/store/amountField';
import { FORM_ERRORS } from '@/store/obligationForm';
import { confirmDelete } from '@/utils/confirm';

/**
 * Unified add/edit sheet for an everyday-spending item (the living-expenses reserve). One form drives
 * both modes (the B.6 sheet pattern). `enabled` toggles whether it counts toward the reserve set aside
 * each paycheck without deleting the item.
 */
export function LivingExpenseSheet({ editing, onClose }: { editing: LivingExpense | null; onClose: () => void }) {
  // [R4] The store this subtree resolves to. Not in R4's original site table — the demo reaches
  // Everyday spending through Money, so this sheet writes real data from inside a demo exactly as
  // `ExpenseSheet` did.
  const store_ = useActiveStore();
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
    const amountN = parseAmountField(amount);
    if (amountN == null) return setError(FORM_ERRORS.amountPositive);
    const fields = { name: name.trim(), amount: amountN, enabled };
    if (isEdit && editing) store_.getState().updateLivingExpense(editing.id, fields);
    else store_.getState().addLivingExpense({ id: `living-${Date.now()}`, ...fields });
    onClose();
  }
  // 3.5.6b — confirms, like every other delete path. See `DebtSheet.remove` for why the direct action
  // was retired: same destructive act, and the sheet was the one entry point that did not guard it.
  async function remove() {
    if (!editing) return;
    if (!(await confirmDelete(`Delete ${editing.name}?`))) return;
    store_.getState().removeLivingExpense(editing.id);
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
      <SwitchRow label="Count toward your reserve" value={enabled} onValueChange={setEnabled} />
    </FormSheet>
  );
}
