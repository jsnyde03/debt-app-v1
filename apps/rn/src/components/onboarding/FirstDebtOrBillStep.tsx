import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { TextField } from '@/components/ui/TextField';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

import { OnboardingLayout, onboardingStyles as s } from './OnboardingLayout';

type EntryType = 'debt' | 'expense';

/** First of next month — a safe default due date; the user refines it later on the Bills screen. */
function nextMonthFirst(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function FirstDebtOrBillStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const c = useAppColors();
  const [type, setType] = useState<EntryType>('debt');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [apr, setApr] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  function handleAdd() {
    if (!name.trim()) {
      setError('Enter a name.');
      return;
    }
    if (type === 'debt') {
      if (!balance || Number(balance) <= 0) {
        setError('Enter the current balance.');
        return;
      }
      if (!minimumPayment || Number(minimumPayment) <= 0) {
        setError('Enter the minimum payment.');
        return;
      }
    } else if (!amount || Number(amount) <= 0) {
      setError('Enter the amount.');
      return;
    }
    setError('');
    const dueDate = nextMonthFirst();
    if (type === 'debt') {
      appStore.getState().addDebt({
        id: `debt-${Date.now()}`,
        name: name.trim(),
        balance: Number(balance),
        minimumPayment: Number(minimumPayment),
        apr: Number(apr) || 0,
        dueDate,
        type: 'debt',
        recurrence: 'monthly',
        isPaidThisCycle: false,
        minimumPaidThisCycle: false,
        isAutopay: false,
      });
    } else {
      appStore.getState().addExpense({
        id: `expense-${Date.now()}`,
        name: name.trim(),
        amount: Number(amount),
        dueDate,
        recurrence: 'monthly',
        isPaidThisCycle: false,
        isAutopay: false,
        category: 'other',
      });
    }
    onNext();
  }

  return (
    <OnboardingLayout
      step={2}
      total={4}
      ctas={
        <>
          <Button label="Add & Continue" onPress={handleAdd} />
          <Button label="Skip, I'll add later" variant="text" onPress={onSkip} />
        </>
      }>
      <View style={s.copy}>
        <Text style={[textStyles.title1, { color: c.text.primary }]}>Add your first debt or bill</Text>
        <Text style={[textStyles.body, { color: c.text.secondary }]}>
          See your plan come to life right away. You can add more any time.
        </Text>
      </View>

      <SegmentedToggle
        options={[
          { value: 'debt', label: 'Debt' },
          { value: 'expense', label: 'Bill' },
        ]}
        value={type}
        onChange={(v) => {
          setType(v);
          setError('');
        }}
      />

      <TextField
        label={type === 'debt' ? 'Debt name' : 'Bill name'}
        value={name}
        onChangeText={(t) => {
          setName(t);
          setError('');
        }}
        placeholder={type === 'debt' ? 'e.g. Visa Card' : 'e.g. Rent'}
      />

      {type === 'debt' ? (
        <>
          <TextField
            label="Current balance"
            value={balance}
            onChangeText={(t) => {
              setBalance(t);
              setError('');
            }}
            placeholder="e.g. 2400"
            keyboardType="decimal-pad"
          />
          <View style={styles.pair}>
            <View style={styles.pairItem}>
              <TextField
                label="Minimum payment"
                value={minimumPayment}
                onChangeText={(t) => {
                  setMinimumPayment(t);
                  setError('');
                }}
                placeholder="e.g. 35"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.pairItem}>
              <TextField label="APR % (optional)" value={apr} onChangeText={setApr} placeholder="e.g. 22.99" keyboardType="decimal-pad" />
            </View>
          </View>
        </>
      ) : (
        <TextField
          label="Amount"
          value={amount}
          onChangeText={(t) => {
            setAmount(t);
            setError('');
          }}
          placeholder="e.g. 1200"
          keyboardType="decimal-pad"
        />
      )}

      {error ? <Text style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: spacing.md },
  pairItem: { flex: 1 },
});
