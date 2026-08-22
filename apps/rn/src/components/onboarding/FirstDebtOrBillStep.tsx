import { DEBT_FIELD, PRIVACY_CLAIM } from '@core/copy/vocabulary';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { toLocalISODate } from '@core/utils/localDate';

import { Button } from '@/components/ui/Button';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { TextField } from '@/components/ui/TextField';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { FORM_ERRORS } from '@/store/obligationForm';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

import { OnboardingLayout, onboardingStyles as s } from './OnboardingLayout';

type EntryType = 'debt' | 'expense';

/** First of next month — a safe default due date; the user refines it later on the Bills screen. */
function nextMonthFirst(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return toLocalISODate(d);
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
      setError(FORM_ERRORS.nameRequired);
      return;
    }
    if (type === 'debt') {
      if (!balance || Number(balance) <= 0) {
        setError(FORM_ERRORS.balanceRequired);
        return;
      }
      if (!minimumPayment || Number(minimumPayment) <= 0) {
        setError(FORM_ERRORS.minimumRequired);
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
          <Button label="Skip, I’ll add later" variant="text" onPress={onSkip} />
        </>
      }>
      <View style={s.copy}>
        <Text style={[textStyles.title1, { color: c.text.primary }]}>Add your first debt or expense</Text>
        <Text style={[textStyles.body, { color: c.text.secondary }]}>
          See your plan come to life right away. You can add more any time.
        </Text>
        {/* [C6 · T1] Repeated from `PaycheckStep` on purpose, and the reason is the SKIP path: that step
            offers "Skip for now", so a user can arrive here having never seen the promise and then type a
            balance — the exact moment §R1 names. Both screens ask for money, so both state it. */}
        <Text style={[textStyles.footnote, { color: c.text.tertiary }]}>{PRIVACY_CLAIM.atEntry}</Text>
      </View>

      {/* 3.7.A10.3 — the SAME fork the Money chooser asks, at the moment the user has the least context.
          A10.1 replaced Money's entry points and left this one, which is the FIRST classification anyone
          makes; unexplained, it is the most likely place to mis-file. It stays a toggle rather than
          becoming the chooser — onboarding is a guided single-purpose step, not a menu — but it now says
          which is which in the same words, because the distinction is the app's to explain either way. */}
      <SegmentedToggle
        options={[
          { value: 'debt', label: 'Debt' },
          { value: 'expense', label: 'Expense' },
        ]}
        value={type}
        onChange={(v) => {
          setType(v);
          setError('');
        }}
      />

      {/* ⚠️ [T8 · L2-5] These are NOT `OBLIGATION_CLAUSE` and deliberately so — a judgment reversed after
          `lint:selectors` red on it. They read like a third copy of the definition, but they are a
          different SENTENCE: the clause and its examples are interleaved ("…doesn't end — rent, phone, a
          subscription"), where the chooser states them separately. Deriving them from the owner silently
          reordered the debt line ("It ends." moved) and re-cased the examples, changing shipped copy for
          no drift benefit — and broke a Maestro flow that taps this text, which no web test can see.
          L2-5's real sites were the two BYTE-IDENTICAL ones (the chooser and `ExpenseSheet`); they are
          fixed. A variant is not a duplicate. */}
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
        {type === 'debt'
          ? 'Something with a balance you’re paying down — a card, a loan, a mortgage. It ends.'
          : 'An ongoing cost that doesn’t end — rent, phone, a subscription.'}
      </Text>

      <TextField
        testID="field-onboarding-name"
        label={type === 'debt' ? 'Debt name' : 'Expense name'}
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
            testID="field-onboarding-balance"
            label={DEBT_FIELD.balanceLabel}
            value={balance}
            onChangeText={(t) => {
              setBalance(t);
              setError('');
            }}
            placeholder={DEBT_FIELD.balancePlaceholder}
            keyboardType="decimal-pad"
          />
          <View style={styles.pair}>
            <View style={styles.pairItem}>
              <TextField
                testID="field-onboarding-minimum"
                label={DEBT_FIELD.minimumLabel}
                value={minimumPayment}
                onChangeText={(t) => {
                  setMinimumPayment(t);
                  setError('');
                }}
                placeholder={DEBT_FIELD.minimumPlaceholder}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.pairItem}>
              <TextField testID="field-onboarding-apr" label="APR % (optional)" value={apr} onChangeText={setApr} placeholder={DEBT_FIELD.aprPlaceholder} keyboardType="decimal-pad" />
            </View>
          </View>
        </>
      ) : (
        <TextField
          testID="field-onboarding-amount"
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
