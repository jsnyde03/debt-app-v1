import { premiumFeatureLabels } from "@/lib/subscription/features";

type UpgradeSectionProps = {
    onClose?: () => void;
};

export function UpgradeSection({ onClose }: UpgradeSectionProps) {
    return (
        <section id="upgrade-section" className="card upgrade-card">
            <div className="upgrade-header">
                <div>
                    <span className="premium-pill">Premium</span>
                    <h2>Unlock Premium Planning</h2>
                    <p>
                        Go beyond tracking.  Compare strategies, simulate extra payments, and forecast future debt progress.
                    </p>
                </div>

                {onClose && (
                    <button
                        type="button"
                        className="text-action-button"
                        onClick={onClose}
                    >
                        Close
                    </button>
                )}
            </div>

            <div className="upgrade-feature-list">
                {Object.values(premiumFeatureLabels).map((label) => (
                    <div key={label} className="upgrade-feature-item">
                        <strong>{label}</strong>
                    </div>
                ))}
            </div>

            <button type="button" className="primary-button upgrade-button">
                Upgrade Coming Soon
            </button>
        </section>
    );
}
