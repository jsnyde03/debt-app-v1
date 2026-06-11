import { premiumFeatureLabels } from "@/lib/subscription/features";

type UpgradeSectionProps = {
    onClose?: () => void;
    onUpgradeClick?: () => void;
    onRestoreClick?: () => void;
};

export function UpgradeSection({ onClose, onUpgradeClick, onRestoreClick }: UpgradeSectionProps) {
    return (
        <section id="upgrade-section" className="card upgrade-card">
            <div className="upgrade-header">
                <div>
                    <span className="premium-pill">Premium</span>
                    <h2>Unlock Smart Forecasting</h2>
                        Stay ahead of tight pay cycles, forecast upcoming cash pressure, and get adaptive payoff guidance before problems happen.
                    <p>
                       
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

            <button type="button" className="primary-button upgrade-button" onClick={onUpgradeClick}>
                Upgrade to Premium
            </button>

            <button
                className="restore-button"
                onClick={onRestoreClick}
            >
                Restore Purchases
            </button>
        </section>

        
    );
}
