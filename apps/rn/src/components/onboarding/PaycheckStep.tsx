import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PRIVACY_CLAIM } from '@core/copy/vocabulary';
import { type PayCycle } from '@core/payCycle/getNextPaycheckDate';

import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import { todayLocalISO } from '@/data/defaults';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { formatPaycheckDate, nextPaycheckFrom, paydayFieldError, PAY_CYCLE_OPTIONS, PAYCHECK_ERRORS, PAYCHECK_FIELDS, PAYCHECK_LEAN_HELP, PAYCHECK_SECTIONS } from '@/store/paycheckForm';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

import { OnboardingLayout, onboardingStyles as s } from './OnboardingLayout';

export function PaycheckStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const c = useAppColors();
  const [amount, setAmount] = useState('');
  const [payCycle, setPayCycle] = useState<PayCycle>('biweekly');
  const [firstDay, setFirstDay] = useState('1');
  const [secondDay, setSecondDay] = useState('15');
  const [payDay, setPayDay] = useState('1');
  // 3.7.A9 — asked at SETUP, because income variability is a property of the job and someone who is never
  // asked will not go looking. `PaycheckSheet` carries the same control for everyone already onboarded —
  // onboarding alone would have stranded the entire installed base at `false` forever, which is how this
  // gap existed in the first place.
  const [varies, setVaries] = useState(false);
  const [lean, setLean] = useState('');
  const [error, setError] = useState('');
  const [leanError, setLeanError] = useState('');
  const [paydayError, setPaydayError] = useState('');

  const nextDate = nextPaycheckFrom(payCycle, firstDay, secondDay, payDay);

  function handleNext() {
    if (!amount || Number(amount) <= 0) {
      setError('Enter your paycheck amount to continue.');
      return;
    }
    setError('');
    // The cycle's day fields are as load-bearing as the amount: without them there is no next payday,
    // and this used to continue anyway on a biweekly-derived date the user never chose.
    const dayError = paydayFieldError(payCycle, firstDay, secondDay, payDay);
    if (dayError || !nextDate) {
      setPaydayError(dayError ?? PAYCHECK_ERRORS.paydayRequired);
      return;
    }
    setPaydayError('');
    // Required once the switch is on — see `PaycheckSheet`. A floor of 0 leaves every variable-income
    // feature silent, which reads as "I turned it on and nothing happened."
    if (varies) {
      if (!lean || Number(lean) <= 0) { setLeanError(PAYCHECK_ERRORS.leanRequired); return; }
      if (Number(lean) > Number(amount)) { setLeanError(PAYCHECK_ERRORS.leanAboveTypical); return; }
    }
    setLeanError('');
    appStore.getState().updatePaycheck({
      amount,
      payCycle,
      currentDate: todayLocalISO(),
      nextPaycheckDate: nextDate,
      incomeVaries: varies,
      leanAmount: varies ? Number(lean) : 0,
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
          This sets up your pay cycle so your plan knows which expenses are due next.
        </Text>
      </View>

      <TextField
        testID="field-paycheck-amount"
        label={PAYCHECK_FIELDS.amount.label}
        value={amount}
        onChangeText={(t) => {
          setAmount(t);
          setError('');
        }}
        placeholder={PAYCHECK_FIELDS.amount.placeholder}
        keyboardType="decimal-pad"
        error={error}
      />

      {/* [C6 · T1] The trust line sits HERE — under the first field that asks for money — and not on the
          debt step §R1 names. The doc says "about to type debt balances"; in this app's flow the paycheck
          comes first, so following the words rather than the principle would reassure the user one step
          AFTER they had already handed over their income. Apple's rule is the promise at the moment of
          data use, and this is that moment.

          ⚠️ The constant, never a literal — `PRIVACY_CLAIM` owns this promise, and its docstring records
          why the wording is not §R1's own. */}
      <Text style={[textStyles.footnote, { color: c.text.tertiary }]}>{PRIVACY_CLAIM.atEntry}</Text>

      {/* 3.7.A9 — one switch, and the floor field only when it is on, so the step does not grow a third
          question for the fixed-income majority. */}
      <SwitchRow
        label={PAYCHECK_FIELDS.varies.label}
        value={varies}
        onValueChange={(v) => { setVaries(v); setLeanError(''); }}
      />
      {varies ? (
        <>
          <TextField
            label={PAYCHECK_FIELDS.lean.label}
            value={lean}
            onChangeText={(t) => { setLean(t); setLeanError(''); }}
            placeholder={PAYCHECK_FIELDS.lean.placeholder}
            keyboardType="decimal-pad"
            error={leanError}
          />
          <Text style={[textStyles.footnote, { color: c.text.secondary }]}>{PAYCHECK_LEAN_HELP}</Text>
        </>
      ) : null}

      <View style={styles.cycleGroup}>
        <Text style={[textStyles.footnote, styles.groupLabel, { color: c.text.secondary }]}>{PAYCHECK_SECTIONS.cycle}</Text>
        <RadioGroup options={PAY_CYCLE_OPTIONS} value={payCycle} onChange={setPayCycle} />
      </View>

      {payCycle === 'semimonthly' ? (
        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <TextField label={PAYCHECK_FIELDS.firstPayday.label} value={firstDay} onChangeText={(t) => { setFirstDay(t); setPaydayError(''); }} placeholder={PAYCHECK_FIELDS.firstPayday.placeholder} keyboardType="number-pad" />
          </View>
          <View style={styles.pairItem}>
            <TextField label={PAYCHECK_FIELDS.secondPayday.label} value={secondDay} onChangeText={(t) => { setSecondDay(t); setPaydayError(''); }} placeholder={PAYCHECK_FIELDS.secondPayday.placeholder} keyboardType="number-pad" />
          </View>
        </View>
      ) : null}

      {/* One message under the PAIR rather than an `error` on each field: every reason the pair can be
          wrong ("must be different", one of them blank) is a fact about the two together, and printing
          it twice reads as two problems. Monthly has a single field, so it carries its error inline. */}
      {payCycle === 'semimonthly' && paydayError ? (
        <Text style={[textStyles.caption, { color: c.accent.danger }]}>{paydayError}</Text>
      ) : null}

      {payCycle === 'monthly' ? (
        <TextField label={PAYCHECK_FIELDS.monthlyPayday.label} value={payDay} onChangeText={(t) => { setPayDay(t); setPaydayError(''); }} placeholder={PAYCHECK_FIELDS.monthlyPayday.placeholder} keyboardType="number-pad" error={paydayError} />
      ) : null}

      <View style={[styles.nextCard, { backgroundColor: c.background.tertiary, borderColor: c.border.subtle }]}>
        <Text style={[textStyles.footnote, styles.groupLabel, { color: c.text.secondary }]}>{PAYCHECK_SECTIONS.next}</Text>
        <Text style={[textStyles.title3, { color: c.text.primary }]}>{formatPaycheckDate(nextDate)}</Text>
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
