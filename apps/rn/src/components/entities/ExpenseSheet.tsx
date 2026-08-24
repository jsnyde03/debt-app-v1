import { useRef, useState } from 'react';

import type { Recurrence } from '@core/types/recurrence';

import { FormSheet } from '@/components/ui/FormSheet';
import { Select } from '@/components/ui/Select';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { DateField } from '@/components/ui/DateField';
import { TextField } from '@/components/ui/TextField';
import { todayLocalISO } from '@/data/defaults';
import type { RequiredExpense, RequiredExpenseCategory } from '@/data/models';
import { parseAmountField, parseOptionalAmount } from '@core/utils/amountField';
import { billCategoryOptions, FORM_ERRORS, recurrenceOptions } from '@/store/obligationForm';
import { useActiveStore } from '@/store/StoreContext';
import { confirmDelete } from '@/utils/confirm';
// [T8 · L2-5] the definition of an expense has ONE owner — the chooser that teaches it.
import { OBLIGATION_CLAUSE } from '@/components/entities/AddObligationSheet';

// ⛔ 'one-time' read "One time" HERE and "One-time" in DebtSheet + Money's section header — one object,
// two spellings, one screen apart. Settled at "One-time" in `obligationForm` (W1).
const RECURRENCE = recurrenceOptions(['monthly', 'weekly', 'biweekly', 'per-paycheck', 'one-time', 'quarterly', 'annually']);
const CATEGORY = billCategoryOptions();

/** Unified add/edit sheet for a required bill (one form, both modes). */
export function ExpenseSheet({ editing, onClose }: { editing: RequiredExpense | null; onClose: () => void }) {
  // [R4] Write to the store this subtree resolves to — the sandbox under a demo/walkthrough, the real
  // singleton otherwise. This sheet wrote through `appStore` while reading through the context, which is
  // the exact mix `useAppStore`'s docstring forbids: it edited an expense inside the demo and the write
  // landed on the user's real plan (found by Sentry from TestFlight).
  const store_ = useActiveStore();
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? '');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? todayLocalISO());
  const [recurrence, setRecurrence] = useState<Recurrence>(editing?.recurrence ?? 'monthly');
  const [category, setCategory] = useState<RequiredExpenseCategory>(editing?.category ?? 'other');
  const [autopay, setAutopay] = useState(editing?.isAutopay ?? false);
  const [variable, setVariable] = useState(editing?.expenseType === 'variable');
  // §2.5 trial / intro price: bills `amount` now (often $0 free trial), jumps to `fullAmount` on `fullChargeDate`.
  const [trial, setTrial] = useState(editing?.isTrial ?? false);
  const [fullAmount, setFullAmount] = useState(editing?.fullAmount != null ? String(editing.fullAmount) : '');
  const [fullChargeDate, setFullChargeDate] = useState(editing?.fullChargeDate ?? '');
  const [error, setError] = useState('');
  // 3.4.5.5 dirty-guard: confirm before discarding unsaved edits on tap/swipe dismiss.
  const snapshot = JSON.stringify({ name, amount, dueDate, recurrence, category, autopay, variable, trial, fullAmount, fullChargeDate });
  const initialSnapshot = useRef(snapshot);
  const dirty = snapshot !== initialSnapshot.current;

  function submit() {
    if (!name.trim()) return setError(FORM_ERRORS.nameRequired);
    // A free trial charges $0 now, so a blank intro amount is legitimately zero there; outside a trial
    // the bill has to carry a real amount.
    const amountN = trial ? parseOptionalAmount(amount) : parseAmountField(amount);
    const fullAmountN = parseAmountField(fullAmount);
    if (trial) {
      if (amountN == null) return setError('Enter the amount you pay now (0 for a free trial).');
      if (fullAmountN == null) return setError('Enter the full price after the trial.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fullChargeDate) || Number.isNaN(Date.parse(`${fullChargeDate}T00:00:00`)))
        return setError('Enter when the full price starts (YYYY-MM-DD).');
    } else if (amountN == null) {
      return setError(FORM_ERRORS.amountPositive);
    }
    const fields = {
      name: name.trim(),
      amount: amountN,
      dueDate,
      recurrence,
      category,
      isAutopay: autopay,
      expenseType: (variable ? 'variable' : 'fixed') as 'fixed' | 'variable',
      // Clear the trial fields when the toggle is off, so turning a trial off can't leave stale full-price data.
      isTrial: trial,
      fullAmount: trial ? fullAmountN ?? undefined : undefined,
      fullChargeDate: trial ? fullChargeDate : undefined,
    };
    if (isEdit && editing) store_.getState().updateExpense(editing.id, fields);
    else store_.getState().addExpense({ id: `expense-${Date.now()}`, isPaidThisCycle: false, ...fields });
    onClose();
  }
  // 3.5.6b — confirms, like every other delete path. See `DebtSheet.remove` for why the direct action
  // was retired: same destructive act, and the sheet was the one entry point that did not guard it.
  async function remove() {
    if (!editing) return;
    if (!(await confirmDelete(`Delete ${editing.name}?`))) return;
    store_.getState().removeExpense(editing.id);
    onClose();
  }

  return (
    <FormSheet
      visible
      // 3.7.A10.3 [D22d] — "expense", not "bill". A credit card BILL is a debt, so the word collided with
      // every item in the other list and invited the mis-file this whole item exists to stop. The clause
      // is the distinguishing one, not a description: what makes this not-a-debt is that it never ends.
      title={isEdit ? 'Edit expense' : 'Add an expense'}
      subtitle={OBLIGATION_CLAUSE.bills}
      submitLabel={isEdit ? 'Save' : 'Add expense'}
      onSubmit={submit}
      onRemove={isEdit ? remove : undefined}
      onClose={onClose}
      dirty={dirty}>
      <TextField testID="field-expense-name" label="Name" value={name} onChangeText={(t) => { setName(t); setError(''); }} placeholder="Rent, phone, utilities" />
      <TextField testID="field-expense-amount" label={trial ? 'Amount now (0 for a free trial)' : 'Amount'} value={amount} onChangeText={(t) => { setAmount(t); setError(''); }} placeholder={trial ? 'e.g. 0' : 'e.g. 850'} keyboardType="decimal-pad" error={error || undefined} />
      {/* The label no longer has to teach a format — the control produces one. */}
      <DateField testID="field-expense-due-date" label="Due date" value={dueDate} onChange={setDueDate} />
      <Select label="Recurrence" value={recurrence} options={RECURRENCE} onChange={setRecurrence} />
      <Select label="Category" value={category} options={CATEGORY} onChange={setCategory} />
      <SwitchRow label="Variable amount (estimate)" value={variable} onValueChange={setVariable} />
      <SwitchRow label="Free trial or intro price" value={trial} onValueChange={(v) => { setTrial(v); setError(''); }} />
      {trial ? (
        <>
          <TextField label="Full price after the trial" value={fullAmount} onChangeText={(t) => { setFullAmount(t); setError(''); }} placeholder="e.g. 15.99" keyboardType="decimal-pad" />
          <DateField testID="field-expense-full-price-date" label="Full price starts" value={fullChargeDate} onChange={(d) => { setFullChargeDate(d); setError(''); }} />
        </>
      ) : null}
      <SwitchRow label="Autopay" value={autopay} onValueChange={setAutopay} />
    </FormSheet>
  );
}
