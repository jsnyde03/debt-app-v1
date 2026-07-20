import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getNextPaycheckDate, type PayCycle } from '@core/payCycle/getNextPaycheckDate';

import { FormSheet } from '@/components/ui/FormSheet';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { TextField } from '@/components/ui/TextField';
import { todayLocalISO } from '@/data/defaults';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
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
  const c = useAppColors();
  const paycheck = useAppStore((s) => s.store.paycheck);

  const [amount, setAmount] = useState(paycheck.amount ?? '');
  const [payCycle, setPayCycle] = useState<PayCycle>(paycheck.payCycle);
  const [firstDay, setFirstDay] = useState(paycheck.semiMonthlyFirstDay || '1');
  const [secondDay, setSecondDay] = useState(paycheck.semiMonthlySecondDay || '15');
  const [payDay, setPayDay] = useState(paycheck.monthlyPayDay || '1');
  const [error, setError] = useState('');

  const nextDate = computeNext(payCycle, firstDay, secondDay, payDay);

  function submit() {
    if (!amount || Number(amount) <= 0) return setError('Enter your paycheck amount.');
    appStore.getState().updatePaycheck({
      amount,
      payCycle,
      currentDate: todayLocalISO(),
      nextPaycheckDate: nextDate,
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
