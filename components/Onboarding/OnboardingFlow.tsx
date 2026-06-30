"use client";

import { useState } from "react";
import { applyDemoPlannerStateToStorage } from "@/lib/testing/seedPlannerState";
import { WelcomeStep } from "./WelcomeStep";
import { PaycheckStep } from "./PaycheckStep";
import { FirstDebtOrBillStep } from "./FirstDebtOrBillStep";
import { CompletionStep } from "./CompletionStep";

export function OnboardingFlow() {
    const [step, setStep] = useState(0);

    function handleDemoMode() {
        applyDemoPlannerStateToStorage(window.localStorage);
        window.location.reload();
    }

    return (
        <div className="onboarding-root">
            {step === 0 && (
                <WelcomeStep
                    onNext={() => setStep(1)}
                    onDemoMode={handleDemoMode}
                />
            )}
            {step === 1 && (
                <PaycheckStep
                    onNext={() => setStep(2)}
                    onSkip={() => setStep(3)}
                />
            )}
            {step === 2 && (
                <FirstDebtOrBillStep
                    onNext={() => setStep(3)}
                    onSkip={() => setStep(3)}
                />
            )}
            {step === 3 && (
                <CompletionStep />
            )}
        </div>
    );
}
