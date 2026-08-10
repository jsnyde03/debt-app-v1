import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { parseStatementText } from '@core/scan/parseStatementText';
import type { Recurrence } from '@core/types/recurrence';

import { isScanAvailable, scanStatement } from '@/lib/scan';
import { AppIcon } from '@/components/ui/AppIcon';
import { FormSheet } from '@/components/ui/FormSheet';
import { Select } from '@/components/ui/Select';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import { todayLocalISO } from '@/data/defaults';
import type { Debt } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useActiveStore } from '@/store/StoreContext';
import { useCoachMark } from '@/hooks/use-coach-mark';
import { TutorialTarget } from '@/store/tutorialTargets';
import { selectDebtBalanceView } from '@/store/balanceSelectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { confirmDelete } from '@/utils/confirm';
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
export function DebtSheet({
  editing,
  onClose,
  prefill,
  inline,
  onViewSchedule,
  onLogPayment,
  convertingExpenseId,
}: {
  editing: Debt | null;
  onClose: () => void;
  prefill?: Partial<Debt> | null;
  inline?: boolean;
  /** 3.7.A0 — hand the payoff schedule to the HOST rather than opening it here. Money decides: push the
   *  route (compact) or swap the iPad detail pane. Opening it from inside this sheet is what failed on
   *  device twice; the sheet no longer owns that presentation at all. */
  onViewSchedule: (debtId: string) => void;
  /** 3.5.5.4 — same contract as `onViewSchedule`: the HOST decides the presentation and closes this
   *  sheet first, so a log-payment sheet is never presented over this one.
   *
   *  OPTIONAL, and the row renders only when it is supplied — a host that cannot log a payment should not
   *  offer the entry. Today opens this sheet add-only and owns no log-payment sheet, so it passes nothing
   *  rather than carrying a handler that routes somewhere to do the work. */
  onLogPayment?: (debt: Debt) => void;
  /**
   * 3.7.A10.2 — the id of a mis-filed EXPENSE this debt is replacing.
   *
   * Set it and saving converts instead of adding: one store write moves the money out of
   * `requiredExpenses` and into `debts`. The form is unchanged — an expense has no balance and no APR,
   * which are exactly the two fields that make an obligation payoff-able, so the user has to supply them
   * and a silent re-file would be a guess about their money ([D22c]).
   */
  convertingExpenseId?: string;
}) {
  // 3.5.3.0 — write to the store this subtree resolves to (sandbox under the tutorial, real otherwise).
  const store_ = useActiveStore();
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
  // 3.4.5.5 dirty-guard: a tap/swipe dismiss confirms before discarding unsaved edits.
  const snapshot = JSON.stringify({ name, balance, minimumPayment, apr, dueDate, type, recurrence, autopay, remainingPayments, scheduledPaymentAmount, bnplProvider });
  const initialSnapshot = useRef(snapshot);
  const dirty = snapshot !== initialSnapshot.current;

  // 3.5.5.5 — offer the payoff-schedule mark once the edit sheet is up. Editing only: on an ADD there is
  // no schedule to point at, and the row itself is not rendered.
  useCoachMark('payoff-schedule', isEdit);

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
      if (isEdit && editing) store_.getState().updateDebt(editing.id, fields);
      else store_.getState().addDebt({ id: `debt-${Date.now()}`, originalBalance: derived, isPaidThisCycle: false, minimumPaidThisCycle: false, ...fields });
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
    const fresh = { id: `debt-${Date.now()}`, originalBalance: Number(balance), isPaidThisCycle: false, minimumPaidThisCycle: false, ...fields };
    if (isEdit && editing) store_.getState().updateDebt(editing.id, fields);
    // 3.7.A10.2 — a conversion is ONE write, not an add followed by a delete: two writes leave a window
    // where the same money is reserved as an expense and projected as a debt at the same time.
    else if (convertingExpenseId) store_.getState().convertExpenseToDebt(convertingExpenseId, fresh);
    else store_.getState().addDebt(fresh);
    onClose();
  }
  // 3.5.6b — the Remove in the sheet's sticky action bar now confirms, like every other delete path.
  // It used to be a direct action by design; the native lane retired that call with evidence rather than
  // argument. A Maestro tap aimed at the schedule row landed on this button (the row sits below the fold)
  // and permanently destroyed a $2,400 debt and its history in one touch, with no dialog and no undo —
  // while the swipe and the long-press menu, the SAME destructive action on the SAME debt, both guard.
  async function remove() {
    if (!editing) return;
    if (!(await confirmDelete(`Delete ${editing.name}?`))) return;
    store_.getState().removeDebt(editing.id);
    onClose();
  }

  return (
    <>
    <FormSheet
      visible
      inline={inline}
      title={isEdit ? 'Edit debt' : prefill ? 'Add from scan' : 'Add a debt'}
      subtitle={isEdit ? undefined : prefill ? 'Review the scanned details, then add.' : 'A loan, credit card, or BNPL balance.'}
      submitLabel={isEdit ? 'Save' : 'Add debt'}
      onSubmit={submit}
      onRemove={isEdit ? remove : undefined}
      onClose={onClose}
      dirty={dirty}
      // 3.7.A0 — the cross-platform way into the payoff schedule (the iOS row long-press menu is the fast
      // path, but RowContextMenu is a passthrough on web/Android). This NAVIGATES rather than opening a
      // sheet-from-a-sheet: close this sheet first, then push, so nothing can be occluded by a presented
      // Modal — the failure that killed the old header button on device.
      //
      // [L5] It rides `footerAccessory` rather than sitting last in the scroll. As a scrolling child it
      // was off-screen at default type on the largest iPhone — 3.7.A0 moved it here FOR discoverability,
      // and on the biggest phone Apple sells you could not see it — with the destructive Remove as its
      // nearest neighbour. Pinned, the submit button separates the two.
      footerAccessory={
        isEdit && editing ? (
          <>
            {/* 3.5.5.4 — the cross-platform way to log a payment. It had exactly one trigger before this:
                the row long-press menu, which is a passthrough off iOS — so on Android and web a primary
                action had no path at all. Same shape as the schedule row above it, and for the same
                reason: the host closes this sheet first, so no sheet is ever presented over a sheet. */}
            {onLogPayment ? (
            <Pressable
              testID="debt-log-payment"
              onPress={() => onLogPayment(editing)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.scheduleRow, { borderColor: c.border.subtle, opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[textStyles.body, { color: c.accent.primary }]}>Log a payment</Text>
              <AppIcon name="chevron-right" size={20} color={c.accent.primary} />
            </Pressable>
            ) : null}
            {/* 3.5.5.5 — and this one is a coach-mark subject. `TutorialTarget` is a bare measuring
                wrapper; the mark itself is rendered by the layer FormSheet mounts inside its Modal. */}
            <TutorialTarget id="payoff-schedule">
              <Pressable
                testID="debt-view-schedule"
                onPress={() => onViewSchedule(editing.id)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.scheduleRow, { borderColor: c.border.subtle, opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[textStyles.body, { color: c.accent.primary }]}>View payoff schedule</Text>
                <AppIcon name="chevron-right" size={20} color={c.accent.primary} />
              </Pressable>
            </TutorialTarget>
          </>
        ) : null
      }
      >
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
    </>
  );
}

const styles = StyleSheet.create({
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
