import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { MAX_DISPLAY_NAME, normalizeDisplayName } from '@/store/greeting';
import { selectPayoffView } from '@/store/payoffSelectors';
import { useAppStore } from '@/store/useAppStore';
import { textStyles } from '@/theme/typography';

import { OnboardingLayout, onboardingStyles as s } from './OnboardingLayout';

const STATS: { icon: IconGlyph; label: string; body: string }[] = [
  { icon: 'lock', label: 'Private by design', body: 'your financial data stays on your device.' },
  { icon: 'edit', label: 'Always editable', body: 'update amounts any time.' },
  { icon: 'phone-iphone', label: 'Free to use', body: 'core features never require a subscription.' },
];

export function CompletionStep({ onComplete }: { onComplete: () => void }) {
  const c = useAppColors();
  // 3.7.B.2 (F10.1) — an OPTIONAL name, asked at the one moment the setup is already done, so skipping it
  // costs nothing and answering it costs one field. Held locally and committed on the CTA rather than
  // written per keystroke: every keystroke would be a persisted store write for a value nothing reads
  // until Today renders. Editable afterwards in More → Preferences.
  const [name, setName] = useState('');
  // 3.3.6a — land the aspirational anchor at the finish: their real projected debt-free date (the onboarding
  // has already written the paycheck + first debt to the store). Falls back gracefully if there's no date yet.
  const store = useAppStore((st) => st.store);
  const debtFreeDate = selectPayoffView(store).debtFreeDate;
  return (
    <OnboardingLayout
      step={3}
      total={4}
      ctas={
        <Button
          label="See My Plan  →"
          onPress={() => {
            const displayName = normalizeDisplayName(name);
            if (displayName) appStore.getState().updatePrefs({ displayName });
            onComplete();
          }}
        />
      }>
      <View style={[s.hero, { backgroundColor: c.background.secondary }]}>
        <AppIcon name="celebration" size={34} color={c.accent.success} />
      </View>
      <View style={s.copy}>
        <Text style={[textStyles.title1, { color: c.text.primary }]}>
          {debtFreeDate ? `You could be debt-free by ${debtFreeDate}` : "You're all set"}
        </Text>
        <Text style={[textStyles.body, { color: c.text.secondary }]}>
          {debtFreeDate
            ? "That's your target — stay the course. Tap below to see exactly what to do with your next paycheck."
            : 'Your plan is ready. Tap below to see exactly what to do with your next paycheck.'}
        </Text>
      </View>
      <View style={s.list}>
        <TextField
          testID="field-onboarding-display-name"
          label="What should we call you? (optional)"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          maxLength={MAX_DISPLAY_NAME}
          autoCapitalize="words"
        />
      </View>
      <View style={s.list}>
        {STATS.map((stat) => (
          <View key={stat.label} style={s.row}>
            <AppIcon name={stat.icon} size={18} color={c.text.tertiary} />
            <Text style={[textStyles.subhead, { color: c.text.secondary, flex: 1 }]}>
              <Text style={{ color: c.text.primary, fontWeight: '600' }}>{stat.label}</Text> — {stat.body}
            </Text>
          </View>
        ))}
      </View>
    </OnboardingLayout>
  );
}
