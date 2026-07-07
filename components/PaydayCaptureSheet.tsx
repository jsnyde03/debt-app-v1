import { useState } from "react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import type { ActiveRecommendedAction } from "@/lib/engine/recommendedActions";
import {
    buildPaydayCaptureItems,
    captureKey,
    type PaydayCaptureOverride,
} from "@/lib/debt/buildPaydayCaptureItems";
import type { CompletedRecommendedAction } from "@/lib/storage/debtPlannerStorage";

type PaydayCaptureSheetProps = {
    /** The cycle's active recommended allocation (from selectActiveRecommendedActions). */
    activeRecommendedActions: ActiveRecommendedAction[];
    /** Total $ of required bills + minimums due this cycle (the checkpoint section). */
    requiredTotal: number;
    /** How many required items are due — drives the section subtitle / visibility. */
    requiredCount: number;
    /** Persist the captured actions (bulk-applied in page.tsx). */
    onCapture: (items: CompletedRecommendedAction[]) => void;
    /** Close + mark this payday handled (no re-prompt). */
    onDismiss: () => void;
    /** Close without capturing — re-offers next app open. */
    onClose: () => void;
};

/**
 * Payday Autopilot's capture sheet. On payday it surfaces the plan the user set
 * for this paycheck and captures what they actually did — the keystone that feeds
 * the Interest-Saved Ledger and Drift Tracker. One-tap "I followed the plan"
 * (zero friction), or Adjust for a real amount / "paid from elsewhere".
 */
export function PaydayCaptureSheet({
    activeRecommendedActions,
    requiredTotal,
    requiredCount,
    onCapture,
    onDismiss,
    onClose,
}: PaydayCaptureSheetProps) {
    const [adjusting, setAdjusting] = useState(false);
    const [overrides, setOverrides] = useState<Record<string, PaydayCaptureOverride>>({});

    const plannedTotal = activeRecommendedActions.reduce((sum, a) => {
        const o = overrides[captureKey(a)] ?? {};
        return sum + (o.actualAmount ?? a.actualAmount);
    }, 0);

    function setOverride(key: string, patch: Partial<PaydayCaptureOverride>) {
        setOverrides((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
    }

    function handleCapture() {
        triggerMediumHaptic();
        const items = buildPaydayCaptureItems(
            activeRecommendedActions.map((a) => ({
                targetId: a.targetId,
                label: a.label,
                category: a.category,
                recommendedAmount: a.recommendedAmount,
                actualAmount: a.actualAmount,
            })),
            overrides
        );
        onCapture(items);
    }

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div
                className="settings-sheet payday-sheet"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-label="Payday plan"
            >
                <div className="settings-sheet-header">
                    <div>
                        <h2>It&rsquo;s payday</h2>
                        <p className="section-collapse-subtitle">
                            Here&rsquo;s the plan you set for this paycheck. Confirm what you actually paid.
                        </p>
                    </div>
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
                </div>

                {requiredCount > 0 && (
                    <div className="payday-required">
                        <div className="payday-required-main">
                            <div className="payday-required-text">
                                <span className="payday-required-label">
                                    Required bills &amp; minimums
                                </span>
                                <span className="payday-required-sub">
                                    {requiredCount} due this paycheck · confirmed paid
                                </span>
                            </div>
                            <strong className="payday-required-amount">
                                {formatCurrency(requiredTotal)}
                            </strong>
                        </div>
                    </div>
                )}

                {activeRecommendedActions.length > 0 && (
                    <div className="payday-section-label">Extra payments</div>
                )}

                <div className="payday-plan-list">
                    {activeRecommendedActions.map((action) => {
                        const key = captureKey(action);
                        const override = overrides[key] ?? {};
                        return (
                            <div className="payday-plan-row" key={action.key}>
                                <div className="payday-plan-row-main">
                                    <span className="payday-plan-label">{action.label}</span>
                                    {adjusting ? (
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="payday-plan-input"
                                            aria-label={`Amount paid for ${action.label}`}
                                            value={override.actualAmount ?? action.actualAmount}
                                            min={0}
                                            onChange={(event) =>
                                                setOverride(key, {
                                                    actualAmount: Math.max(0, Number(event.target.value) || 0),
                                                })
                                            }
                                        />
                                    ) : (
                                        <span className="payday-plan-amount">
                                            {formatCurrency(override.actualAmount ?? action.actualAmount)}
                                        </span>
                                    )}
                                </div>
                                {adjusting && (
                                    <label className="payday-external-toggle">
                                        <input
                                            type="checkbox"
                                            checked={!!override.external}
                                            onChange={(event) => setOverride(key, { external: event.target.checked })}
                                        />
                                        Paid from elsewhere (not this paycheck)
                                    </label>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="payday-plan-total">
                    <span>{adjusting ? "Total you paid" : "Recommended this paycheck"}</span>
                    <strong>{formatCurrency(plannedTotal)}</strong>
                </div>

                <div className="payday-actions">
                    <button type="button" className="payday-primary-button" onClick={handleCapture}>
                        {adjusting ? "Save what I paid" : "I followed the plan"}
                    </button>
                    {!adjusting && (
                        <button
                            type="button"
                            className="text-action-button payday-secondary"
                            onClick={() => {
                                triggerLightHaptic();
                                setAdjusting(true);
                            }}
                        >
                            Adjust amounts
                        </button>
                    )}
                    <button type="button" className="text-action-button payday-secondary" onClick={onDismiss}>
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
}
