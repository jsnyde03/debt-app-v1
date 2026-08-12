import { useRef, useState } from 'react';
import { Text } from 'react-native';

import { FormSheet } from '@/components/ui/FormSheet';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import type { Goal } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { FORM_ERRORS } from '@/store/obligationForm';
import { appStore } from '@/store/appStore';
import { textStyles } from '@/theme/typography';
import { confirmDelete } from '@/utils/confirm';

/** Unified add/edit sheet for a savings goal (type is now editable in both modes — redesign fix). */
export function GoalSheet({ editing, onClose }: { editing: Goal | null; onClose: () => void }) {
  const c = useAppColors();
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? '');
  const [target, setTarget] = useState(editing ? String(editing.targetAmount) : '');
  const [current, setCurrent] = useState(editing ? String(editing.currentAmount) : '');
  const [type, setType] = useState<'emergency' | 'savings'>(editing?.type ?? 'savings');
  const [error, setError] = useState('');
  // 3.4.5.5 dirty-guard: confirm before discarding unsaved edits on tap/swipe dismiss.
  const snapshot = JSON.stringify({ name, target, current, type });
  const initialSnapshot = useRef(snapshot);
  const dirty = snapshot !== initialSnapshot.current;

  function submit() {
    if (!name.trim()) return setError(FORM_ERRORS.nameRequired);
    if (!target || Number(target) <= 0) return setError('Enter a target amount.');
    // 3.7.A3.8 — dedupe goal names, matching the save-for-it flow (`AffordabilityCard.tsx:56`). Two
    // creation paths write the SAME namespace, and only one of them guarded it — so "New couch" could be
    // created here beside an identical sinking fund, and the two would then compete for the same
    // priority-capped funding while reading as one goal to the user. Case-insensitive, trimmed; an EDIT
    // ignores itself so renaming a goal to its own name is not a collision.
    const effName = name.trim();
    const clash = appStore
      .getState()
      .store.goals.some((g) => g.id !== editing?.id && g.name.trim().toLowerCase() === effName.toLowerCase());
    if (clash) return setError(`You already have a goal called "${effName}".`);
    const fields = { name: effName, targetAmount: Number(target), currentAmount: Number(current) || 0, type };
    if (isEdit && editing) appStore.getState().updateGoal(editing.id, fields);
    else appStore.getState().addGoal({ id: `goal-${Date.now()}`, ...fields });
    onClose();
  }
  // 3.5.6b — confirms, like every other delete path. See `DebtSheet.remove` for why the direct action
  // was retired: same destructive act, and the sheet was the one entry point that did not guard it.
  async function remove() {
    if (!editing) return;
    if (!(await confirmDelete(`Delete ${editing.name}?`))) return;
    appStore.getState().removeGoal(editing.id);
    onClose();
  }

  return (
    <FormSheet
      visible
      title={isEdit ? 'Edit goal' : 'Add a goal'}
      subtitle="A savings or emergency-fund target."
      submitLabel={isEdit ? 'Save' : 'Add goal'}
      onSubmit={submit}
      onRemove={isEdit ? remove : undefined}
      onClose={onClose}
      dirty={dirty}>
      <TextField label="Name" value={name} onChangeText={(t) => { setName(t); setError(''); }} placeholder="Emergency Fund, Vacation" />
      <TextField label="Target amount" value={target} onChangeText={(t) => { setTarget(t); setError(''); }} placeholder="e.g. 1000" keyboardType="decimal-pad" />
      <TextField label="Current amount saved" value={current} onChangeText={setCurrent} placeholder="e.g. 250" keyboardType="decimal-pad" />
      <Select
        label="Type"
        value={type}
        options={[{ value: 'emergency', label: 'Emergency fund' }, { value: 'savings', label: 'Savings' }]}
        onChange={setType}
      />
      {error ? <Text style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
    </FormSheet>
  );
}
