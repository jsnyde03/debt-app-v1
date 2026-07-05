import { triggerMediumHaptic } from "@/lib/mobile/haptics";
import { writeKey } from "@/lib/storage/safeStorage";

export function CompletionStep() {
    function handleComplete() {
        triggerMediumHaptic();
        writeKey("debtPlanner.hasCompletedOnboarding", true);
        window.location.reload();
    }

    return (
        <div className="onboarding-scroll">
            <div className="onboarding-progress">
                <span className="onboarding-dot" />
                <span className="onboarding-dot" />
                <span className="onboarding-dot" />
                <span className="onboarding-dot active" />
            </div>

            <div className="onboarding-completion-icon">🎉</div>

            <div className="onboarding-copy">
                <h2 className="onboarding-title">You&apos;re all set!</h2>
                <p className="onboarding-subtitle">
                    Your plan is ready. Tap below to see exactly what to do with your next paycheck.
                </p>
            </div>

            <div className="onboarding-completion-stats">
                <div className="onboarding-stat-row">
                    <span className="onboarding-stat-icon">🔒</span>
                    <span><span className="onboarding-stat-label">100% private</span> — everything stays on your device.</span>
                </div>
                <div className="onboarding-stat-row">
                    <span className="onboarding-stat-icon">✏️</span>
                    <span><span className="onboarding-stat-label">Always editable</span> — update amounts any time in Settings.</span>
                </div>
                <div className="onboarding-stat-row">
                    <span className="onboarding-stat-icon">📲</span>
                    <span><span className="onboarding-stat-label">Free to use</span> — core features never require a subscription.</span>
                </div>
            </div>

            <div className="onboarding-cta-stack">
                <button
                    type="button"
                    className="onboarding-primary-btn"
                    onClick={handleComplete}
                >
                    See My Plan →
                </button>
            </div>
        </div>
    );
}
