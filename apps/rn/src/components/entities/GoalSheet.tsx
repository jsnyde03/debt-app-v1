import { useRef, useState } from 'react';
import { Text } from 'react-native';

import { FormSheet } from '@/components/ui/FormSheet';
import { Select } from '@/components/ui/Select';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import type { Goal } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { fundsAsSinkingFund, primaryEmergencyGoal } from '@core/engine/emergencyFund';
import { parseAmountField, parseOptionalAmount } from '@core/utils/amountField';
import { FORM_ERRORS } from '@/store/obligationForm';
import { useActiveStore } from '@/store/StoreContext';
import { textStyles } from '@/theme/typography';
import { confirmDelete } from '@/utils/confirm';

/** Unified add/edit sheet for a savings goal (type is now editable in both modes — redesign fix). */
export function GoalSheet({ editing, onClose }: { editing: Goal | null; onClose: () => void }) {
  // [R4] The store this subtree resolves to — sandbox under a demo/walkthrough, real singleton otherwise.
  // Both the write AND the dedupe READ below went through `appStore`, so inside a demo this sheet added a
  // goal to the user's real plan and checked the new name against the user's real goals.
  const store_ = useActiveStore();
  const c = useAppColors();
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? '');
  const [target, setTarget] = useState(editing ? String(editing.targetAmount) : '');
  const [current, setCurrent] = useState(editing ? String(editing.currentAmount) : '');
  const [type, setType] = useState<'emergency' | 'savings'>(editing?.type ?? 'savings');
  /**
   * ⛔ **[P6.8.9.7.11.13.4] THE PACE HAD EXACTLY ONE WRITER, AND IT WAS UNREACHABLE AFTER CREATION.**
   * `priorityPerPaycheck` was written only at `SaveForItSheet.tsx:109`, reachable only through
   * `AffordabilityCard.openSaveSheet`, which refuses a name a surviving goal already holds. So when
   * `runMigrations` stands a goal down for an unreadable pace, the repair card's *"until you set it
   * again"* named an action the app did not have — and two of `.11.13`'s findings are that sentence.
   * **This is the route.** It has to exist before anything can honestly promise it.
   */
  const [priority, setPriority] = useState(editing?.priority === true);
  const [pace, setPace] = useState(editing?.priorityPerPaycheck != null ? String(editing.priorityPerPaycheck) : '');
  const [error, setError] = useState('');
  // 3.4.5.5 dirty-guard: confirm before discarding unsaved edits on tap/swipe dismiss.
  const snapshot = JSON.stringify({ name, target, current, type, priority, pace });
  const initialSnapshot = useRef(snapshot);
  const dirty = snapshot !== initialSnapshot.current;

  /**
   * ⛔ **DOES THIS GOAL'S PACE GOVERN ANYTHING?** [P6.8.9.7.11.13.4] THE emergency fund is funded by the
   * starter-EF rung, which consults neither `priority` nor the pace — so offering these controls there
   * would be offering a control that does nothing, the *"built UI that is dead"* class P6.10 exists to
   * catch. `@core/engine/emergencyFund` is the one owner of that rule (`.11.12.3`), so this asks it rather
   * than testing `type === 'savings'` — which is the test that would quietly go wrong for a SECOND
   * emergency-typed goal, since that one DOES fund through the sinking-fund rung.
   *
   * ⚠️ Asked of the store **as it would be after this save**, because `type` is editable on this sheet:
   * switching the only emergency fund to Savings makes its pace start governing.
   * ⚠️ Compared by id rather than by reference — `primaryEmergencyGoal` is given a freshly-mapped array,
   * so the reference identity its own docblock relies on is not available here.
   */
  const paceGoverns = (() => {
    const live = store_.getState().store.goals;
    // ⚠️ A new goal is APPENDED (`store.ts:504`) and the primary is *the FIRST* emergency-typed goal in
    // store order — so where the draft lands is what decides the answer, and the draft has to be in the
    // array rather than reasoned about beside it.
    const draft = { id: '', type };
    const after = editing
      ? live.map((g) => ({ id: g.id, type: g.id === editing.id ? type : g.type }))
      : [...live.map((g) => ({ id: g.id, type: g.type })), draft];
    const self = (editing ? after.find((g) => g.id === editing.id) : after[after.length - 1]) ?? draft;
    return fundsAsSinkingFund(self, primaryEmergencyGoal(after));
  })();

  function submit() {
    if (!name.trim()) return setError(FORM_ERRORS.nameRequired);
    const targetN = parseAmountField(target);
    const currentN = parseOptionalAmount(current);
    if (targetN == null) return setError('Enter a target amount.');
    if (currentN == null) return setError('Enter what you have saved so far, or leave it blank.');
    // 3.7.A3.8 — dedupe goal names, matching the save-for-it flow (`AffordabilityCard.tsx:56`). Two
    // creation paths write the SAME namespace, and only one of them guarded it — so "New couch" could be
    // created here beside an identical sinking fund, and the two would then compete for the same
    // priority-capped funding while reading as one goal to the user. Case-insensitive, trimmed; an EDIT
    // ignores itself so renaming a goal to its own name is not a collision.
    const effName = name.trim();
    const clash = store_
      .getState()
      .store.goals.some((g) => g.id !== editing?.id && g.name.trim().toLowerCase() === effName.toLowerCase());
    if (clash) return setError(`You already have a goal called "${effName}".`);
    /**
     * ⛔ **A PACE OF `0` IS THE UNCAPPED STATE, so it must never leave this form.** `allocatePaycheck.ts`
     * reads `priorityPerPaycheck != null && > 0 ? pace : Infinity` — so a prioritised goal saved with `0`
     * funds at full speed ahead of the debt, which is exactly the corruption `runMigrations` stands goals
     * down for. ⚡ Same value, opposite meaning to every other amount on this sheet: a target of `0` is
     * merely wrong, a pace of `0` is unlimited.
     *
     * ⚠️ **`parseAmountField` is what enforces that**, and the distinction matters when choosing the
     * parser: it returns `null` unless `n > 0`, while its sibling `parseOptionalAmount` accepts `0` and
     * would hand this exact defect straight through. ⛔ A `paceN <= 0` clause stood here and was
     * **unreachable** — the parser can never return a non-positive number — so it read as the guard while
     * being dead. Found by planting its removal and watching the test still pass. `goal-pace-edit.spec.ts`
     * now plants the parser swap instead, which is the mutation that can actually happen.
     */
    const paceN = priority ? parseAmountField(pace) : null;
    if (priority && paceGoverns && paceN == null) return setError('Enter how much to put toward this each paycheck.');
    const fields = { name: effName, targetAmount: targetN, currentAmount: currentN, type };
    /**
     * ⚠️ **Written only when the pace GOVERNS.** For the primary emergency fund these two fields decide
     * nothing (see `paceGoverns`), so including them would silently rewrite state the user was never shown
     * a control for.
     */
    const funding = paceGoverns ? { priority, priorityPerPaycheck: priority ? (paceN ?? undefined) : undefined } : {};
    if (isEdit && editing) store_.getState().updateGoal(editing.id, { ...fields, ...funding });
    else store_.getState().addGoal({ id: `goal-${Date.now()}`, ...fields, ...funding });
    onClose();
  }
  // 3.5.6b — confirms, like every other delete path. See `DebtSheet.remove` for why the direct action
  // was retired: same destructive act, and the sheet was the one entry point that did not guard it.
  async function remove() {
    if (!editing) return;
    if (!(await confirmDelete(`Delete ${editing.name}?`))) return;
    store_.getState().removeGoal(editing.id);
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
      {/* ⚠️ Hidden entirely for THE emergency fund rather than disabled — see `paceGoverns`. A disabled
          control still says "this is a thing you could set", and for that goal it is not. */}
      {paceGoverns ? (
        <>
          <SwitchRow label="Fund this ahead of my debt" value={priority} onValueChange={(v) => { setPriority(v); setError(''); }} />
          {priority ? (
            <TextField
              label="Cap per paycheck"
              value={pace}
              onChangeText={(t) => { setPace(t); setError(''); }}
              placeholder="e.g. 100"
              keyboardType="decimal-pad"
            />
          ) : null}
        </>
      ) : null}
      {error ? <Text style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
    </FormSheet>
  );
}
