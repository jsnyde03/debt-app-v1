import { triggerLightHaptic } from "@/lib/mobile/haptics";

type WelcomeStepProps = {
    onNext: () => void;
    onDemoMode: () => void;
};

export function WelcomeStep({ onNext, onDemoMode }: WelcomeStepProps) {
    return (
        <div className="onboarding-scroll">
            <div className="onboarding-progress">
                <span className="onboarding-dot active" />
                <span className="onboarding-dot" />
                <span className="onboarding-dot" />
                <span className="onboarding-dot" />
            </div>

            <div className="onboarding-icon">💳</div>

            <div className="onboarding-copy">
                <h1 className="onboarding-title">Your paycheck,<br />organized.</h1>
                <p className="onboarding-subtitle">
                    Know exactly where every dollar goes and when you'll be debt-free.
                </p>
            </div>

            <div className="onboarding-features">
                <div className="onboarding-feature">
                    <span className="onboarding-feature-icon">📋</span>
                    <div className="onboarding-feature-text">
                        <strong>See your full payment plan</strong>
                        Every bill, minimum payment, and deadline — laid out per paycheck.
                    </div>
                </div>
                <div className="onboarding-feature">
                    <span className="onboarding-feature-icon">🏔️</span>
                    <div className="onboarding-feature-text">
                        <strong>Know your debt-free date</strong>
                        Snowball or avalanche — see exactly when the last debt disappears.
                    </div>
                </div>
                <div className="onboarding-feature">
                    <span className="onboarding-feature-icon">✅</span>
                    <div className="onboarding-feature-text">
                        <strong>Mark bills as you pay them</strong>
                        Swipe to pay, track your cushion, and roll over to the next cycle.
                    </div>
                </div>
            </div>

            <div className="onboarding-cta-stack">
                <button
                    type="button"
                    className="onboarding-primary-btn"
                    onClick={() => { triggerLightHaptic(); onNext(); }}
                >
                    Get Started
                </button>
                <button
                    type="button"
                    className="onboarding-secondary-btn"
                    onClick={() => { triggerLightHaptic(); onDemoMode(); }}
                >
                    Try with Sample Data
                </button>
            </div>
        </div>
    );
}
