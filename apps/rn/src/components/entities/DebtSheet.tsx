import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import type { Recurrence } from '@core/types/recurrence';

import { AmortizationSheet } from '@/components/entities/AmortizationSheet';
import { FormSheet } from '@/components/ui/FormSheet';
import { Select } from '@/components/ui/Select';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import { todayLocalISO } from '@/data/defaults';
import type { Debt } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { selectDebtBalanceView } from '@/store/balanceSelectors';
import { useAppStore } from '@/store/useAppStore';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const RECURRENCE: { value: Recurrence; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'per-paycheck', label: 'Every paycheck' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Yearly' },
];

/** Unified add/edit sheet for a debt. BNPL fields are now editable in both modes (redesign fix). */
export function DebtSheet({ editing, onClose }: { editing: Debt | null; onClose: () => void }) {
  const c = useAppColors();
  const currentDate = useAppStore((s) => s.store.paycheck.currentDate);
  const isPremium = useAppStore((s) => s.store.subscriptionPlan === 'premium');
  const estimate = editing ? selectDebtBalanceView(editing, currentDate, isPremium) : null;
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? '');
  const [balance, setBalance] = useState(editing ? String(editing.balance) : '');
  const [minimumPayment, setMinimumPayment] = useState(editing ? String(editing.minimumPayment) : '');
  const [apr, setApr] = useState(editing?.apr != null ? String(editing.apr) : '');
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? todayLocalISO());
  const [type, setType] = useState<'debt' | 'bnpl'>(editing?.type ?? 'debt');
  const [recurrence, setRecurrence] = useState<Recurrence>(editing?.recurrence ?? 'monthly');
  const [autopay, setAutopay] = useState(editing?.isAutopay ?? false);
  const [remainingPayments, setRemainingPayments] = useState(editing?.remainingPayments != null ? String(editing.remainingPayments) : '');
  const [scheduledPaymentAmount, setScheduledPaymentAmount] = useState(editing?.scheduledPaymentAmount != null ? String(editing.scheduledPaymentAmount) : '');
  const [error, setError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  function submit() {
    if (!name.trim()) return setError('Enter a name.');
    if (!balance || Number(balance) <= 0) return setError('Enter the current balance.');
    if (!minimumPayment || Number(minimumPayment) <= 0) return setError('Enter the minimum payment.');
    if (Number(minimumPayment) > Number(balance)) return setError('Minimum payment can’t exceed the balance.');
    const fields = {
      name: name.trim(),
      balance: Number(balance),
      minimumPayment: Number(minimumPayment),
      apr: Number(apr) || 0,
      dueDate,
      type,
      recurrence,
      isAutopay: autopay,
      remainingPayments: type === 'bnpl' && remainingPayments ? Number(remainingPayments) : undefined,
      scheduledPaymentAmount: type === 'bnpl' && scheduledPaymentAmount ? Number(scheduledPaymentAmount) : undefined,
    };
    if (isEdit && editing) appStore.getState().updateDebt(editing.id, fields);
    else appStore.getState().addDebt({ id: `debt-${Date.now()}`, originalBalance: Number(balance), isPaidThisCycle: false, minimumPaidThisCycle: false, ...fields });
    onClose();
  }
  function remove() {
    if (editing) {
      appStore.getState().removeDebt(editing.id);
      onClose();
    }
  }

  return (
    <>
    <FormSheet
      visible
      title={isEdit ? 'Edit debt' : 'Add a debt'}
      subtitle="A loan, credit card, or BNPL balance."
      submitLabel={isEdit ? 'Save' : 'Add debt'}
      onSubmit={submit}
      onRemove={isEdit ? remove : undefined}
      onClose={onClose}
      headerAction={
        isEdit ? (
          <Pressable onPress={() => setShowSchedule(true)} accessibilityRole="button" hitSlop={6}>
            <Text style={[textStyles.subhead, { color: c.accent.primary }]}>View Payoff Schedule</Text>
          </Pressable>
        ) : undefined
      }>
      <TextField label="Name" value={name} onChangeText={(t) => { setName(t); setError(''); }} placeholder="Visa, Car Loan" />
      <TextField label="Current balance" value={balance} onChangeText={(t) => { setBalance(t); setError(''); }} placeholder="e.g. 2400" keyboardType="decimal-pad" />
      {isEdit && estimate?.isEstimate ? (
        // Premium estimate: offer the projected value in one tap (Save re-anchors it) — never pre-fill
        // it silently. Typing the real number is the correction path; both re-anchor lastVerifiedDate.
        // Stacked + left-aligned so the action never hides behind a scroll bar on wide/iPad layouts.
        <Pressable
          onPress={() => { setBalance(String(estimate.currentBalance)); setError(''); }}
          accessibilityRole="button"
          accessibilityLabel={`Use the estimated balance, ${formatWhole(estimate.currentBalance)}`}
          style={{ marginTop: -4, gap: 2, alignSelf: 'flex-start' }}>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
            Estimated {formatWhole(estimate.currentBalance)} today
            {estimate.lastVerifiedDate ? ` · verified ${shortDate(estimate.lastVerifiedDate)}` : ''}
          </Text>
          <Text style={[textStyles.caption, { color: c.accent.primary }]}>Use estimate →</Text>
        </Pressable>
      ) : isEdit && !isPremium && estimate?.lastVerifiedDate ? (
        <Text style={[textStyles.caption, { color: c.text.tertiary, marginTop: -4 }]}>Updated {shortDate(estimate.lastVerifiedDate)}</Text>
      ) : null}
      <TextField label="Minimum payment" value={minimumPayment} onChangeText={(t) => { setMinimumPayment(t); setError(''); }} placeholder="e.g. 65" keyboardType="decimal-pad" />
      <TextField label="APR %" value={apr} onChangeText={setApr} placeholder="e.g. 22.99" keyboardType="decimal-pad" />
      <TextField label="Due date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} placeholder="2026-07-01" />
      <Select
        label="Type"
        value={type}
        options={[{ value: 'debt', label: 'Debt / loan' }, { value: 'bnpl', label: 'BNPL (buy now, pay later)' }]}
        onChange={setType}
      />
      {type === 'bnpl' ? (
        <>
          <TextField label="Remaining payments" value={remainingPayments} onChangeText={setRemainingPayments} placeholder="e.g. 4" keyboardType="number-pad" />
          <TextField label="Scheduled payment" value={scheduledPaymentAmount} onChangeText={setScheduledPaymentAmount} placeholder="e.g. 100" keyboardType="decimal-pad" />
        </>
      ) : null}
      <Select label="Recurrence" value={recurrence} options={RECURRENCE} onChange={setRecurrence} />
      <SwitchRow label="Autopay" value={autopay} onValueChange={setAutopay} />
      {error ? <Text style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
    </FormSheet>
    {isEdit && editing ? (
      <AmortizationSheet visible={showSchedule} debtId={editing.id} onClose={() => setShowSchedule(false)} />
    ) : null}
    </>
  );
}
