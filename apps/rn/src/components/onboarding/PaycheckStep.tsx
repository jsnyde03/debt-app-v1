import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getNextPaycheckDate, type PayCycle } from '@core/payCycle/getNextPaycheckDate';

import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { TextField } from '@/components/ui/TextField';
import { todayLocalISO } from '@/data/defaults';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

import { OnboardingLayout, onboardingStyles as s } from './OnboardingLayout';

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
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function PaycheckStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const c = useAppColors();
  const [amount, setAmount] = useState('');
  const [payCycle, setPayCycle] = useState<PayCycle>('biweekly');
  const [firstDay, setFirstDay] = useState('1');
  const [secondDay, setSecondDay] = useState('15');
  const [payDay, setPayDay] = useState('1');
  const [error, setError] = useState('');

  const nextDate = computeNext(payCycle, firstDay, secondDay, payDay);

  function handleNext() {
    if (!amount || Number(amount) <= 0) {
      setError('Enter your paycheck amount to continue.');
      return;
    }
    setError('');
    appStore.getState().updatePaycheck({
      amount,
      payCycle,
      currentDate: todayLocalISO(),
      nextPaycheckDate: nextDate,
      ...(payCycle === 'semimonthly' ? { semiMonthlyFirstDay: firstDay, semiMonthlySecondDay: secondDay } : {}),
      ...(payCycle === 'monthly' ? { monthlyPayDay: payDay } : {}),
    });
    onNext();
  }

  return (
    <OnboardingLayout
      step={1}
      total={4}
      ctas={
        <>
          <Button label="Continue" onPress={handleNext} />
          <Button label="Skip for now" variant="text" onPress={onSkip} />
        </>
      }>
      <View style={s.copy}>
        <Text style={[textStyles.title1, { color: c.text.primary }]}>When do you get paid?</Text>
        <Text style={[textStyles.body, { color: c.text.secondary }]}>
          This sets up your pay cycle so your plan knows which bills are due next.
        </Text>
      </View>

      <TextField
        label="Paycheck amount"
        value={amount}
        onChangeText={(t) => {
          setAmount(t);
          setError('');
        }}
        placeholder="e.g. 1500"
        keyboardType="decimal-pad"
        error={error}
      />

      <View style={styles.cycleGroup}>
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
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  cycleGroup: { gap: spacing.sm },
  groupLabel: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  pair: { flexDirection: 'row', gap: spacing.md },
  pairItem: { flex: 1 },
  nextCard: { borderRadius: layout.inputRadius, borderWidth: StyleSheet.hairlineWidth, padding: spacing.base, gap: 2 },
});
