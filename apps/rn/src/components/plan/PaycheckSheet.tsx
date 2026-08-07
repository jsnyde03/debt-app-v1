import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getNextPaycheckDate, type PayCycle } from '@core/payCycle/getNextPaycheckDate';

import { FormSheet } from '@/components/ui/FormSheet';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import { todayLocalISO } from '@/data/defaults';
import { useAppColors } from '@/hooks/use-app-colors';
import { useActiveStore } from '@/store/StoreContext';
import { selectPaycheckMissed } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const CYCLES: { value: PayCycle; label: string; sublabel?: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'semimonthly', label: 'Semi-Monthly', sublabel: 'e.g. 1st & 15th' },
  { value: 'monthly', label: 'Monthly' },
];

function computeNext(payCycle: PayCycle, firstDay: string, secondDay: string, payDay: string): string {
  const currentDate = todayLocalISO();
  try {
    return getNextPaycheckDate({
      payCycle,
      currentDate,
      semiMonthlyFirstDay: Number(firstDay),
      semiMonthlySecondDay: Number(secondDay),
      monthlyPayDay: Number(payDay),
    });
  } catch {
    return getNextPaycheckDate({ payCycle: 'biweekly', currentDate });
  }
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Edit the paycheck + pay cycle from the Plan tab (the IA-EVOLVE "promote paycheck out of settings"
 * decision — paycheck is core model, so it lives on the home screen, not a settings hub). Prefilled
 * from the store; recomputes the next payday as inputs change, same as onboarding's PaycheckStep.
 */
export function PaycheckSheet({ onClose }: { onClose: () => void }) {
  // 3.5.3.0 — write to the store this subtree resolves to (sandbox under the tutorial, real otherwise).
  const store_ = useActiveStore();
  const c = useAppColors();
  const paycheck = useAppStore((s) => s.store.paycheck);
  const missed = useAppStore((s) => selectPaycheckMissed(s.store));

  const [amount, setAmount] = useState(paycheck.amount ?? '');
  const [payCycle, setPayCycle] = useState<PayCycle>(paycheck.payCycle);
  const [firstDay, setFirstDay] = useState(paycheck.semiMonthlyFirstDay || '1');
  const [secondDay, setSecondDay] = useState(paycheck.semiMonthlySecondDay || '15');
  const [payDay, setPayDay] = useState(paycheck.monthlyPayDay || '1');
  // 3.7.A9 — these two had NO user-facing control anywhere in the app until now. `incomeVaries` is read by
  // six engine modules and was written by nothing, so it sat `false` for every user and took the whole
  // variable-income feature set down with it (the VIS-5 band, income learning, §2.0.a lean verification,
  // the variable cold-start holdback). The e2e that "covers" VIS-5 seeds the flag straight into the store,
  // which is exactly why a green suite never noticed the front door was missing.
  const [varies, setVaries] = useState(paycheck.incomeVaries === true);
  const [lean, setLean] = useState(paycheck.leanAmount ? String(paycheck.leanAmount) : '');
  const [error, setError] = useState('');
  const [leanError, setLeanError] = useState('');

  const nextDate = computeNext(payCycle, firstDay, secondDay, payDay);

  function submit() {
    if (!amount || Number(amount) <= 0) return setError('Enter your paycheck amount.');
    // ⚠️ A lean figure is REQUIRED once the switch is on, and that is the point of the whole item rather
    // than form politeness. `selectDebtFreeBand` needs `incomeVaries && leanAmount > 0`; turn the switch on
    // without a floor and every downstream feature stays silent, so the user changes a setting, sees
    // nothing happen and concludes it is broken. That is the same defect A9 fixes, one layer in.
    if (varies) {
      if (!lean || Number(lean) <= 0) return setLeanError('Enter the amount you can count on.');
      if (Number(lean) > Number(amount)) return setLeanError('Your lean paycheck should be no more than a typical one.');
    }
    store_.getState().updatePaycheck({
      amount,
      payCycle,
      currentDate: todayLocalISO(),
      nextPaycheckDate: nextDate,
      incomeVaries: varies,
      // Cleared rather than left behind when the switch goes off: a stale floor would keep feeding the
      // engine a number the user has stopped standing behind.
      leanAmount: varies ? Number(lean) : 0,
      ...(payCycle === 'semimonthly' ? { semiMonthlyFirstDay: firstDay, semiMonthlySecondDay: secondDay } : {}),
      ...(payCycle === 'monthly' ? { monthlyPayDay: payDay } : {}),
    });
    onClose();
  }

  return (
    <FormSheet
      visible
      title="Paycheck & pay cycle"
      subtitle="Your income and when it lands — the foundation of every plan."
      submitLabel="Save paycheck"
      onSubmit={submit}
      onClose={onClose}>
      <TextField
        label="Paycheck amount"
        value={amount}
        onChangeText={(t) => { setAmount(t); setError(''); }}
        placeholder="e.g. 1500"
        keyboardType="decimal-pad"
        error={error || undefined}
      />

      {/* 3.7.A9 — directly under the amount it qualifies, and deliberately NOT beside "This paycheck
          didn't arrive": variability is a standing property of the job, a missed paycheck is a fact about
          this cycle, and a reader should not have to sort one from the other. */}
      <View style={styles.group}>
        <SwitchRow
          label="My income varies"
          value={varies}
          onValueChange={(v) => { setVaries(v); setLeanError(''); }}
        />
        {varies ? (
          <>
            <TextField
              label="The amount you can count on"
              value={lean}
              onChangeText={(t) => { setLean(t); setLeanError(''); }}
              placeholder="e.g. 1200"
              keyboardType="decimal-pad"
              error={leanError || undefined}
            />
            <Text style={[textStyles.footnote, { color: c.text.secondary }]}>
              Your plan runs on this floor, so a lighter paycheck never breaks it.
            </Text>
          </>
        ) : null}
      </View>

      <View style={styles.group}>
        <Text style={[textStyles.footnote, styles.groupLabel, { color: c.text.secondary }]}>Pay cycle</Text>
        <RadioGroup options={CYCLES} value={payCycle} onChange={setPayCycle} />
      </View>

      {payCycle === 'semimonthly' ? (
        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <TextField label="First payday" value={firstDay} onChangeText={setFirstDay} placeholder="1" keyboardType="number-pad" />
          </View>
          <View style={styles.pairItem}>
            <TextField label="Second payday" value={secondDay} onChangeText={setSecondDay} placeholder="15" keyboardType="number-pad" />
          </View>
        </View>
      ) : null}

      {payCycle === 'monthly' ? (
        <TextField label="Payday (day of month)" value={payDay} onChangeText={setPayDay} placeholder="1" keyboardType="number-pad" />
      ) : null}

      <View style={[styles.nextCard, { backgroundColor: c.background.tertiary, borderColor: c.border.subtle }]}>
        <Text style={[textStyles.footnote, styles.groupLabel, { color: c.text.secondary }]}>Next paycheck</Text>
        <Text style={[textStyles.title3, { color: c.text.primary }]}>{formatDate(nextDate)}</Text>
      </View>

      {/* §2.3.1 (2.4.7.7): report a missed paycheck → the Guardian pauses deploy + protects the cushion
          instead of planning on income that didn't land. Auto-resumes when the cycle rolls over. */}
      <View style={styles.group}>
        <SwitchRow
          label="This paycheck didn't arrive"
          value={missed}
          onValueChange={(v) => (v ? store_.getState().declareMissedPaycheck() : store_.getState().undoMissedPaycheck())}
        />
      </View>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  groupLabel: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  pair: { flexDirection: 'row', gap: spacing.md },
  pairItem: { flex: 1 },
  nextCard: { borderRadius: layout.inputRadius, borderWidth: StyleSheet.hairlineWidth, padding: spacing.base, gap: 2 },
});
