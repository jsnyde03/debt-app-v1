import { useState } from 'react';

import { CompletionStep } from '@/components/onboarding/CompletionStep';
import { FirstDebtOrBillStep } from '@/components/onboarding/FirstDebtOrBillStep';
import { PaycheckStep } from '@/components/onboarding/PaycheckStep';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { demoStore } from '@/data/demoSeed';
import { appStore } from '@/store/appStore';

/**
 * First-run onboarding — the 4-step flow (Welcome → Paycheck → First Debt/Bill → Completion),
 * rebuilt at parity with premium icons. Steps write to the store as they go; `completeOnboarding`
 * (or the demo seed) flips `onboardingComplete`, and the root `_layout` route-guard swaps this out
 * for the tabs automatically.
 */
export default function OnboardingScreen() {
  const [step, setStep] = useState(0);

  return (
    <>
      {step === 0 ? (
        <WelcomeStep onNext={() => setStep(1)} onDemo={() => appStore.getState().importStore(demoStore())} />
      ) : null}
      {step === 1 ? <PaycheckStep onNext={() => setStep(2)} onSkip={() => setStep(3)} /> : null}
      {step === 2 ? <FirstDebtOrBillStep onNext={() => setStep(3)} onSkip={() => setStep(3)} /> : null}
      {step === 3 ? <CompletionStep onComplete={() => appStore.getState().completeOnboarding()} /> : null}
    </>
  );
}
