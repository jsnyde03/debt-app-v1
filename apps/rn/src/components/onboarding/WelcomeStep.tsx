import { Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { textStyles } from '@/theme/typography';

import { OnboardingLayout, onboardingStyles as s } from './OnboardingLayout';

const FEATURES: { icon: IconGlyph; title: string; body: string }[] = [
  { icon: 'assignment', title: 'See your full payment plan', body: 'Every bill, minimum payment, and deadline — laid out per paycheck.' },
  { icon: 'trending-down', title: 'Know your debt-free date', body: 'Snowball or avalanche — see exactly when the last debt disappears.' },
  { icon: 'task-alt', title: 'Mark bills as you pay them', body: 'Swipe to pay, track your cushion, and roll over to the next cycle.' },
];

export function WelcomeStep({ onNext, onDemo }: { onNext: () => void; onDemo: () => void }) {
  const c = useAppColors();
  return (
    <OnboardingLayout
      step={0}
      total={4}
      ctas={
        <>
          <Button label="Get Started" onPress={onNext} />
          <Button label="Try with Sample Data" variant="secondary" onPress={onDemo} />
        </>
      }>
      <View style={[s.hero, { backgroundColor: c.background.secondary }]}>
        <AppIcon name="account-balance-wallet" size={34} color={c.accent.primary} />
      </View>
      <View style={s.copy}>
        <Text style={[textStyles.title1, { color: c.text.primary }]}>Your paycheck, organized.</Text>
        <Text style={[textStyles.body, { color: c.text.secondary }]}>
          Know exactly where every dollar goes and when you&apos;ll be debt-free.
        </Text>
      </View>
      <View style={s.list}>
        {FEATURES.map((f) => (
          <View key={f.title} style={s.row}>
            <View style={[s.rowIcon, { backgroundColor: c.background.tertiary }]}>
              <AppIcon name={f.icon} size={20} color={c.accent.primary} />
            </View>
            <View style={s.rowText}>
              <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>{f.title}</Text>
              <Text style={[textStyles.subhead, { color: c.text.secondary }]}>{f.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingLayout>
  );
}
