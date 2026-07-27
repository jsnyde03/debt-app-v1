import { Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { textStyles } from '@/theme/typography';

import { OnboardingLayout, onboardingStyles as s } from './OnboardingLayout';

const STATS: { icon: IconGlyph; label: string; body: string }[] = [
  { icon: 'lock', label: 'Private by design', body: 'your financial data stays on your device.' },
  { icon: 'edit', label: 'Always editable', body: 'update amounts any time.' },
  { icon: 'phone-iphone', label: 'Free to use', body: 'core features never require a subscription.' },
];

export function CompletionStep({ onComplete }: { onComplete: () => void }) {
  const c = useAppColors();
  return (
    <OnboardingLayout step={3} total={4} ctas={<Button label="See My Plan  →" onPress={onComplete} />}>
      <View style={[s.hero, { backgroundColor: c.background.secondary }]}>
        <AppIcon name="celebration" size={34} color={c.accent.success} />
      </View>
      <View style={s.copy}>
        <Text style={[textStyles.title1, { color: c.text.primary }]}>You&apos;re all set!</Text>
        <Text style={[textStyles.body, { color: c.text.secondary }]}>
          Your plan is ready. Tap below to see exactly what to do with your next paycheck.
        </Text>
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
