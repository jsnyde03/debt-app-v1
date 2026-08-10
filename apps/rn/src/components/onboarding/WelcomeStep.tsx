import { Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { textStyles } from '@/theme/typography';

import { OnboardingLayout, onboardingStyles as s } from './OnboardingLayout';

// 3.3.6.3 — first-run leads with the uncopyable job (the payday cushion Guardian), not table stakes.
// Honest across tiers: the free read genuinely tells you what's safe; premium automates the moves.
const FEATURES: { icon: IconGlyph; title: string; body: string }[] = [
  { icon: 'savings', title: 'A guardian for every payday', body: "Know what's safe to spend and what to pay down — your cushion, protected." },
  { icon: 'trending-down', title: 'A real debt-free date', body: 'Snowball or avalanche — see exactly when your last debt disappears.' },
  { icon: 'shopping-cart', title: 'Spend without the guilt', body: 'Check any purchase against your plan before you buy.' },
];

export function WelcomeStep({ onNext, onDemo }: { onNext: () => void; onDemo?: () => void }) {
  const c = useAppColors();
  return (
    <OnboardingLayout
      step={0}
      total={4}
      ctas={
        <>
          <Button label="Get Started" onPress={onNext} />
          {/* Optional since 3.5.4.8: withheld where the demo isn't reachable, rather than rendered dead.
              A secondary CTA that does nothing is the "nothing renders dead" rule from the round-8
              overlay-less review, one screen earlier. */}
          {/* 🎯 Jason 2026-08-10 — "Try with Sample Data" was a fossil of the LEGACY demo, which imported a
              fabricated plan into the real store and could therefore genuinely be tried. What it opens now
              is a scripted, self-driving demonstration: five timed beats, the tab bar hidden, More
              disabled. You watch it.

              "See it in action" is the paywall's existing wording for this same destination, so both doors
              now promise the same thing. ⚠️ Deliberately NOT "see how it works" — that collides with the
              WALKTHROUGH ("How this works" on the Guardian card, "How the Guardian works" in More), and
              the walkthrough is the surface a user actually operates. The two had their words backwards. */}
          {onDemo ? <Button label="See it in action" variant="secondary" onPress={onDemo} /> : null}
        </>
      }>
      <View style={[s.hero, { backgroundColor: c.background.secondary }]}>
        <AppIcon name="gpp-good" size={34} color={c.accent.primary} />
      </View>
      <View style={s.copy}>
        <Text style={[textStyles.title1, { color: c.text.primary }]}>Will you make it to payday?</Text>
        <Text style={[textStyles.body, { color: c.text.secondary }]}>
          Debt Planner watches your cushion every paycheck — so you always know what&apos;s safe to spend and what to pay down.
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
