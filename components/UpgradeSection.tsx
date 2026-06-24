import { premiumFeatureLabels } from "@/lib/subscription/features";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import type { PremiumPackageInfo } from "@/lib/subscription/revenueCat";

type UpgradeSectionProps = {
    packageInfo?: PremiumPackageInfo | null;
    onClose?: () => void;
    onUpgradeClick?: () => void;
    onRestoreClick?: () => void;
};

export function UpgradeSection({ packageInfo, onClose, onUpgradeClick, onRestoreClick, }: UpgradeSectionProps) {
    return (
        <div
            className="upgrade-modal-backdrop"
            onClick={() => {
                triggerLightHaptic();
                onClose?.();
            }}
        >
            <section
                id="upgrade-section"
                className="card upgrade-card upgrade-modal-card"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="upgrade-modal-orb" />

                <div className="upgrade-header">
                    <div className="upgrade-title-stack">
                        <div>
                            <span className="premium-pill">Premium</span>

                            <h2>Unlock Smart Forecasting</h2>

                            <p>Stay ahead of tight pay cycles, forecast upcoming cash pressure, and get adaptive payoff guidance before problems happen.</p>
                        </div>
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            className="text-action-button"
                            onClick={() => {
                                triggerLightHaptic();
                                onClose();
                            }}
                        >
                            Close
                        </button>
                    )}
                </div>

                <div className="upgrade-price-block" aria-live="polite">
                    {packageInfo ? (
                        <>
                            <div className="upgrade-price-amount">
                                {packageInfo.priceString}
                                <span className="upgrade-price-period">/{packageInfo.periodLabel}</span>
                            </div>
                            <div className="upgrade-price-subtext">
                                {packageInfo.title} · billed every {packageInfo.periodLabel}, auto-renews until cancelled
                            </div>
                        </>
                    ) : (
                        <div className="upgrade-price-loading">Loading price…</div>
                    )}
                </div>

                <div className="upgrade-feature-list">
                    {Object.values(premiumFeatureLabels).map((label) => (
                        <div
                            key={label}
                            className="upgrade-features-item"
                        >
                            <strong>{label}</strong>
                        </div>
                    ))}
                </div>

                <div className="upgrade-action-stack">
                    <button
                        type="button"
                        className="primary-button upgrade-button"
                        disabled={!packageInfo}
                        onClick={() => {
                            triggerMediumHaptic();
                            onUpgradeClick?.();
                        }}
                    >
                        {packageInfo
                            ? `Upgrade to Premium — ${packageInfo.priceString}/${packageInfo.periodLabel}`
                            : "Upgrade to Premium"}
                    </button>

                    <button
                        type="button"
                        className="restore-button"
                        onClick={() => {
                            triggerLightHaptic();
                            onRestoreClick?.();
                        }}
                    >
                        Restore Purchases
                    </button>

                    <div className="upgrade-legal-row">
                        <a
                            href="https://github.com/jsnyde03/debt-planner-stie/blob/main/privacy.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="legal-link"
                        >
                            Privacy Policy
                        </a>
                        <span className="legal-separator">·</span>
                        <a
                            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="legal-link"
                        >
                            Terms of Use
                        </a>
                        <span className="legal-separator">·</span>
                        <a
                            href="https://github.com/jsnyde03/debt-planner-stie/blob/main/Paycheck%20Debt%20Planner%20Support"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="legal-link"
                        >
                            Support
                        </a>
                        <span className="legal-separator">·</span>
                        <a
                            href="https://apps.apple.com/account/subscriptions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="legal-link"
                        >
                            Manage Subscription
                        </a>
                    </div>
                </div>
            </section>
        </div>
    )
}
