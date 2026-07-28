import { useRef, useState } from 'react';
import { Text } from 'react-native';

import { FormSheet } from '@/components/ui/FormSheet';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import type { Goal } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { textStyles } from '@/theme/typography';

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
    if (!name.trim()) return setError('Enter a name.');
    if (!target || Number(target) <= 0) return setError('Enter a target amount.');
    const fields = { name: name.trim(), targetAmount: Number(target), currentAmount: Number(current) || 0, type };
    if (isEdit && editing) appStore.getState().updateGoal(editing.id, fields);
    else appStore.getState().addGoal({ id: `goal-${Date.now()}`, ...fields });
    onClose();
  }
  function remove() {
    if (editing) {
      appStore.getState().removeGoal(editing.id);
      onClose();
    }
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
