import { router } from 'expo-router';
import { useState } from 'react';

import { CompletionStep } from '@/components/onboarding/CompletionStep';
import { FirstDebtOrBillStep } from '@/components/onboarding/FirstDebtOrBillStep';
import { PaycheckStep } from '@/components/onboarding/PaycheckStep';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { isDemoReachable } from '@/config/qa';
import { appStore } from '@/store/appStore';

/**
 * First-run onboarding — the 4-step flow (Welcome → Paycheck → First Debt/Bill → Completion),
 * rebuilt at parity with premium icons. Steps write to the store as they go; `completeOnboarding`
 * flips `onboardingComplete`, and the root `_layout` route-guard swaps this out for the tabs
 * automatically.
 */
export default function OnboardingScreen() {
  const [step, setStep] = useState(0);

  return (
    <>
      {step === 0 ? (
        <WelcomeStep
          onNext={() => setStep(1)}
          // [D-B] 3.5.4.8 — one honest demo system. This used to be
          // `importStore(demoStore())`: it wrote a fabricated plan into the user's REAL store and set
          // `onboardingComplete` to get past the route guard, so "see a demo" and "start using the app
          // with invented data" were the same action, and there was no way back to an empty plan.
          //
          // Now it opens the sandbox demo, which writes nothing real and ends by handing the user their
          // own empty plan. Withheld entirely where the demo isn't reachable — an offer that opens
          // nothing is worse than no offer.
          onDemo={isDemoReachable() ? () => router.push('/demo?from=welcome') : undefined}
        />
      ) : null}
      {/* T3B (audit L5-10) — `onSkip` went to step 3, so "Skip for now" did not defer ONE question, it
          deleted the rest of setup: the debt/expense step was never offered, the progress dots jumped
          from the 2nd to the 4th, and the user landed on Today with `no-paycheck` and a single prompt.
          A skip defers the question in front of you; it does not decide the next one for you. */}
      {step === 1 ? <PaycheckStep onNext={() => setStep(2)} onSkip={() => setStep(2)} /> : null}
      {step === 2 ? <FirstDebtOrBillStep onNext={() => setStep(3)} onSkip={() => setStep(3)} /> : null}
      {step === 3 ? <CompletionStep onComplete={() => appStore.getState().completeOnboarding()} /> : null}
    </>
  );
}
