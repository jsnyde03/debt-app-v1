import { PRIVACY_CLAIM, SEE_IT_IN_ACTION_CTA } from '@core/copy/vocabulary';
import { Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { textStyles } from '@/theme/typography';

import { OnboardingLayout, onboardingStyles as s } from './OnboardingLayout';

// 3.3.6.3 — first-run leads with the uncopyable job (the payday cushion Guardian), not table stakes.
// Honest across tiers: the free read genuinely tells you what's safe; premium automates the moves.
const FEATURES: { icon: IconGlyph; title: string; body: string }[] = [
  // ⛔ [L1-18] "your cushion, protected" stated the outcome as done, in the first screen a user reads —
  // which is where every later hedge has to walk back from. "Comes first" is the same reassurance and is
  // literally true: the cushion floor is reserved ahead of any extra payoff, by the allocation order.
  { icon: 'savings', title: 'A guardian for every payday', body: "Know what’s safe to spend and what to pay down — your cushion comes first." },
  { icon: 'trending-down', title: 'A real debt-free date', body: 'Snowball or avalanche — see exactly when your last debt disappears.' },
  // ⛔ [A4 · M1-9] This slot used to promise "Check any purchase against your plan before you buy" — the
  // affordability check, which is PREMIUM, on the first screen a free user reads. The free branch then
  // quotes the user's own spare figure back at them and withholds the verdict, so the promise was not
  // merely early: it was answered with a refusal at the one moment it was invoked.
  //
  // ⭐ [C6 · T3] What replaces it is the trust stance, which `DEBT_BENCH_TRUST_FIRSTRUN` §R1 calls the
  // single highest-leverage trust change and which appeared nowhere in the app. Naming the ABSENCE is the
  // move — the thing this app refuses to do — and it is the one claim a debt app's competitors cannot copy.
  //
  // ⚠️ Both halves are the CONSTANT, never a literal: `PRIVACY_CLAIM` is the single owner of this promise
  // and `noSelling` is deliberately passive (T7/L1-11 retired the corporate "we"). Writing the words here
  // would create a second place stating one rule — and `lint:copy` reads literals, so the duplicate would
  // be invisible to the gate built to catch exactly that.
  { icon: 'lock', title: PRIVACY_CLAIM.headline, body: `No account needed — and ${PRIVACY_CLAIM.noSelling}.` },
];

export function WelcomeStep({ onNext, onDemo }: { onNext: () => void; onDemo?: () => void }) {
  const c = useAppColors();
  return (
    <OnboardingLayout
      step={0}
      total={4}
      ctas={
        <>
          <Button label="Get started" onPress={onNext} />
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
          {onDemo ? <Button label={SEE_IT_IN_ACTION_CTA} variant="secondary" onPress={onDemo} /> : null}
        </>
      }>
      <View style={[s.hero, { backgroundColor: c.background.secondary }]}>
        <AppIcon name="gpp-good" size={34} color={c.accent.primary} />
      </View>
      <View style={s.copy}>
        <Text style={[textStyles.title1, { color: c.text.primary }]}>Will you make it to payday?</Text>
        <Text style={[textStyles.body, { color: c.text.secondary }]}>
          {/* ⛔ [L1-18] "you always know" — the watching is real and every-paycheck; the ALWAYS-knowing
              depends on the user's data being current, which the app's own balance surfaces spend their
              time asking for. Dropping one word costs the sentence nothing. */}
          Debt Planner watches your cushion every paycheck — so you know what’s safe to spend and what to pay down.
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
