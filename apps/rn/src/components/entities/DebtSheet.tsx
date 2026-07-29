import { useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';

import { parseStatementText } from '@core/scan/parseStatementText';
import type { Recurrence } from '@core/types/recurrence';

import { isScanAvailable, scanStatement } from '@/lib/scan';
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

// BNPL payment cadence — how often an installment is due. A plan's LENGTH is the number of payments
// (a "48-month" Affirm plan = Monthly × 48), so this list stays the realistic set of intervals plus
// one-time (Klarna pay-in-30), not a per-duration enum. Covers biweekly pay-in-4 → long financing.
const BNPL_CADENCE: { value: Recurrence; label: string }[] = [
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'one-time', label: 'One-time' },
];

// BNPL plans a user is likely to hold; '' = not specified (the row falls back to a generic "BNPL").
const PROVIDERS: { value: string; label: string }[] = [
  { value: '', label: 'Not specified' },
  { value: 'Klarna', label: 'Klarna' },
  { value: 'Affirm', label: 'Affirm' },
  { value: 'Afterpay', label: 'Afterpay' },
  { value: 'PayPal', label: 'PayPal Pay in 4' },
  { value: 'Zip', label: 'Zip' },
  { value: 'Sezzle', label: 'Sezzle' },
  { value: 'Other', label: 'Other' },
];

/** Unified add/edit sheet for a debt. BNPL fields are now editable in both modes (redesign fix).
 *  `prefill` (§2.8) seeds a NEW debt's fields from a scanned statement — the user reviews/edits, then Adds. */
export function DebtSheet({ editing, onClose, prefill }: { editing: Debt | null; onClose: () => void; prefill?: Partial<Debt> | null }) {
  const c = useAppColors();
  const currentDate = useAppStore((s) => s.store.paycheck.currentDate);
  const isPremium = useAppStore((s) => s.store.subscriptionPlan === 'premium');
  const estimate = editing ? selectDebtBalanceView(editing, currentDate, isPremium) : null;
  const isEdit = !!editing;
  // A new debt seeds from a scan prefill (if any); an existing debt seeds from itself.
  const seed = editing ?? prefill ?? null;
  const [name, setName] = useState(seed?.name ?? '');
  const [balance, setBalance] = useState(seed?.balance != null ? String(seed.balance) : '');
  const [minimumPayment, setMinimumPayment] = useState(seed?.minimumPayment != null ? String(seed.minimumPayment) : '');
  const [apr, setApr] = useState(seed?.apr != null ? String(seed.apr) : '');
  const [dueDate, setDueDate] = useState(seed?.dueDate ?? todayLocalISO());
  const [type, setType] = useState<'debt' | 'bnpl'>(seed?.type ?? 'debt');
  const [recurrence, setRecurrence] = useState<Recurrence>(editing?.recurrence ?? 'monthly');
  const [autopay, setAutopay] = useState(editing?.isAutopay ?? false);
  const [remainingPayments, setRemainingPayments] = useState(editing?.remainingPayments != null ? String(editing.remainingPayments) : '');
  const [scheduledPaymentAmount, setScheduledPaymentAmount] = useState(editing?.scheduledPaymentAmount != null ? String(editing.scheduledPaymentAmount) : '');
  const [bnplProvider, setBnplProvider] = useState(editing?.bnplProvider ?? '');
  const [error, setError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  // 3.4.5.5 dirty-guard: a tap/swipe dismiss confirms before discarding unsaved edits.
  const snapshot = JSON.stringify({ name, balance, minimumPayment, apr, dueDate, type, recurrence, autopay, remainingPayments, scheduledPaymentAmount, bnplProvider });
  const initialSnapshot = useRef(snapshot);
  const dirty = snapshot !== initialSnapshot.current;

  // A BNPL's balance is DERIVED from its plan (installment × payments left), not typed (2.7.3).
  const bnplSched = Number(scheduledPaymentAmount);
  const bnplRem = Number(remainingPayments);
  const bnplTotal = scheduledPaymentAmount && remainingPayments && bnplSched > 0 && bnplRem > 0 ? bnplSched * bnplRem : null;

  // BNPL is typically biweekly ("pay in 4 every 2 weeks") — default the cadence when the user
  // switches type and hasn't deliberately chosen one (still on the debt default). Fires on the user's
  // change only, never on mount, so an existing monthly BNPL keeps its saved cadence.
  function onTypeChange(next: 'debt' | 'bnpl') {
    setType(next);
    setError('');
    if (next === 'bnpl' && recurrence === 'monthly') setRecurrence('biweekly');
  }

  // §2.8 premium "keeps-current": re-scan a fresh statement to update this debt's balance (+ minimum)
  // without retyping — the ongoing automation half of scan-to-prefill. Premium + native-scanner only.
  const canRescan = isEdit && isPremium && isScanAvailable();
  async function handleRescan() {
    const text = await scanStatement();
    if (!text) return;
    const p = parseStatementText(text);
    if (p.balance != null) setBalance(String(p.balance));
    if (p.minimumPayment != null) setMinimumPayment(String(p.minimumPayment));
    setError('');
  }

  function submit() {
    if (!name.trim()) return setError('Enter a name.');

    if (type === 'bnpl') {
      // Installment-native (2.7.2/2.7.3): the plan is "N payments of $X" — capture those two and
      // DERIVE the balance (scheduled × remaining), minimum (= the installment), interest-free.
      if (bnplSched <= 0) return setError('Enter the payment amount.');
      if (bnplRem <= 0 || !Number.isInteger(bnplRem)) return setError('Enter how many payments are left.');
      const derived = Math.round(bnplSched * bnplRem * 100) / 100;
      const fields = {
        name: name.trim(),
        balance: derived,
        minimumPayment: bnplSched,
        apr: 0,
        dueDate,
        type,
        recurrence,
        isAutopay: autopay,
        remainingPayments: bnplRem,
        scheduledPaymentAmount: bnplSched,
        bnplProvider: bnplProvider || undefined,
      };
      if (isEdit && editing) appStore.getState().updateDebt(editing.id, fields);
      else appStore.getState().addDebt({ id: `debt-${Date.now()}`, originalBalance: derived, isPaidThisCycle: false, minimumPaidThisCycle: false, ...fields });
      onClose();
      return;
    }

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
      remainingPayments: undefined,
      scheduledPaymentAmount: undefined,
      bnplProvider: undefined,
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
      title={isEdit ? 'Edit debt' : prefill ? 'Add from scan' : 'Add a debt'}
      subtitle={isEdit ? undefined : prefill ? 'Review the scanned details, then add.' : 'A loan, credit card, or BNPL balance.'}
      submitLabel={isEdit ? 'Save' : 'Add debt'}
      onSubmit={submit}
      onRemove={isEdit ? remove : undefined}
      onClose={onClose}
      dirty={dirty}
      headerAction={
        isEdit ? (
          <Pressable onPress={() => setShowSchedule(true)} accessibilityRole="button" hitSlop={6}>
            <Text style={[textStyles.subhead, { color: c.accent.primary }]}>View Payoff Schedule</Text>
          </Pressable>
        ) : undefined
      }>
      <TextField label="Name" value={name} onChangeText={(t) => { setName(t); setError(''); }} placeholder={type === 'bnpl' ? 'Affirm — Sofa' : 'Visa, Car Loan'} />
      <Select
        label="Type"
        value={type}
        options={[{ value: 'debt', label: 'Debt / loan' }, { value: 'bnpl', label: 'BNPL (buy now, pay later)' }]}
        onChange={onTypeChange}
      />
      {type === 'bnpl' ? (
        // BNPL-native capture (2.7.3): the plan's terms, not a generic balance/APR. The balance is
        // derived (installment × payments left) and shown read-only — a BNPL is interest-free.
        <>
          <Select label="Provider" value={bnplProvider} options={PROVIDERS} onChange={setBnplProvider} />
          <TextField label="Payment amount" value={scheduledPaymentAmount} onChangeText={(t) => { setScheduledPaymentAmount(t); setError(''); }} placeholder="e.g. 100" keyboardType="decimal-pad" />
          <TextField label="Payments remaining" value={remainingPayments} onChangeText={(t) => { setRemainingPayments(t); setError(''); }} placeholder="e.g. 4" keyboardType="number-pad" />
          <Select label="How often" value={recurrence} options={BNPL_CADENCE} onChange={setRecurrence} />
          <TextField label="Next payment" value={dueDate} onChangeText={setDueDate} placeholder="2026-07-01" />
          {bnplTotal != null ? (
            <Text style={[textStyles.caption, { color: c.text.tertiary, marginTop: -4 }]}>
              {bnplRem} {bnplRem === 1 ? 'payment' : 'payments'} of {formatWhole(bnplSched)} · {formatWhole(bnplTotal)} left · interest-free
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <TextField label="Current balance" value={balance} onChangeText={(t) => { setBalance(t); setError(''); }} placeholder="e.g. 2400" keyboardType="decimal-pad" />
          {/* §2.8 premium keeps-current: re-scan a statement to update the balance without retyping. */}
          {canRescan ? (
            <Pressable onPress={handleRescan} accessibilityRole="button" accessibilityLabel="Re-scan a statement to update this balance" hitSlop={6} style={{ marginTop: -4, alignSelf: 'flex-start' }}>
              <Text style={[textStyles.caption, { color: c.accent.primary }]}>Re-scan to update →</Text>
            </Pressable>
          ) : null}
          {isEdit && estimate?.isEstimate ? (
            // Premium estimate: offer the projected value in one tap (Save re-anchors it) — never pre-fill
            // it silently. Typing the real number is the correction path; both re-anchor lastVerifiedDate.
            // Stacked + left-aligned so the action never hides behind a scroll bar on wide/iPad layouts.
            <Pressable
              onPress={() => { setBalance(String(estimate.currentBalance)); setError(''); }}
              accessibilityRole="button"
              accessibilityLabel={`Apply the estimated balance ${formatWhole(estimate.currentBalance)} to your plan`}
              style={{ marginTop: -4, gap: 2, alignSelf: 'flex-start' }}>
              <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                Estimated {formatWhole(estimate.currentBalance)} today
                {estimate.lastVerifiedDate ? ` · verified ${shortDate(estimate.lastVerifiedDate)}` : ''}
              </Text>
              <Text style={[textStyles.caption, { color: c.accent.primary }]}>Apply Estimate to Plan</Text>
            </Pressable>
          ) : isEdit && !isPremium && estimate?.lastVerifiedDate ? (
            <Text style={[textStyles.caption, { color: c.text.tertiary, marginTop: -4 }]}>Updated {shortDate(estimate.lastVerifiedDate)}</Text>
          ) : null}
          <TextField label="Minimum payment" value={minimumPayment} onChangeText={(t) => { setMinimumPayment(t); setError(''); }} placeholder="e.g. 65" keyboardType="decimal-pad" />
          <TextField label="APR %" value={apr} onChangeText={setApr} placeholder="e.g. 22.99" keyboardType="decimal-pad" />
          <TextField label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="2026-07-01" />
          <Select label="Recurrence" value={recurrence} options={RECURRENCE} onChange={setRecurrence} />
        </>
      )}
      <SwitchRow label="Autopay" value={autopay} onValueChange={setAutopay} />
      {error ? <Text style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
    </FormSheet>
    {isEdit && editing ? (
      <AmortizationSheet overlay visible={showSchedule} debtId={editing.id} onClose={() => setShowSchedule(false)} />
    ) : null}
    </>
  );
}
