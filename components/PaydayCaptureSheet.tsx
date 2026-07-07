import { useState } from "react";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import type { ActiveRecommendedAction } from "@/lib/engine/recommendedActions";
import {
    buildPaydayCaptureItems,
    captureKey,
    type PaydayCaptureOverride,
} from "@/lib/debt/buildPaydayCaptureItems";
import { requiredDisplayLabel, type RequiredActionView } from "@/lib/debt/deriveRequiredActionView";
import type { RequiredReconciliation } from "@/lib/debt/bulkMarkRequired";
import type { CompletedRecommendedAction } from "@/lib/storage/debtPlannerStorage";

/** One required item (bill or debt minimum) + its derived display state — the rows
 *  the [Adjust] reconciliation view renders in their CURRENT state. */
export type RequiredCaptureRow = {
    item: { targetId?: string; debtId?: string; category: string; label: string; amount: number };
    view: RequiredActionView;
};

type PaydayCaptureSheetProps = {
    /** The cycle's active recommended allocation (from selectActiveRecommendedActions). */
    activeRecommendedActions: ActiveRecommendedAction[];
    /** The cycle's required bills + minimums (with derived state) for the checkpoint. */
    requiredRows: RequiredCaptureRow[];
    /** Total $ of required bills + minimums due this cycle. */
    requiredTotal: number;
    /**
     * Persist the capture. `requiredDecisions` is provided only when the user used
     * [Adjust]; otherwise the parent marks ALL required paid (the happy path).
     */
    onCapture: (
        items: CompletedRecommendedAction[],
        requiredDecisions?: RequiredReconciliation
    ) => void;
    /** Close + mark this payday handled (no re-prompt). */
    onDismiss: () => void;
    /** Close without capturing — re-offers next app open. */
    onClose: () => void;
};

function isExpenseRow(row: RequiredCaptureRow): boolean {
    return row.item.category === "expense" || row.item.category === "autopay_expense";
}

function rowId(row: RequiredCaptureRow): string | undefined {
    return isExpenseRow(row) ? row.item.targetId : row.item.debtId ?? row.item.targetId;
}

/**
 * Payday Autopilot's capture sheet. On payday it confirms the whole paycheck:
 * the required bills + minimums (one-tap, or itemized via [Adjust]) AND the extra
 * payments. The keystone that feeds the Interest-Saved Ledger + Drift Tracker.
 */
export function PaydayCaptureSheet({
    activeRecommendedActions,
    requiredRows,
    requiredTotal,
    onCapture,
    onDismiss,
    onClose,
}: PaydayCaptureSheetProps) {
    const [adjustingExtras, setAdjustingExtras] = useState(false);
    const [overrides, setOverrides] = useState<Record<string, PaydayCaptureOverride>>({});

    // Reconciliation view state. requiredPaid opens in each item's EXACT current
    // state (manual → real paid flag, autopay → presumed-paid) — never an invented
    // all-green default. hasAdjusted gates whether the confirm uses these per-item
    // decisions or the "mark everything paid" happy path.
    const [adjustingRequired, setAdjustingRequired] = useState(false);
    const [hasAdjustedRequired, setHasAdjustedRequired] = useState(false);
    const [requiredPaid, setRequiredPaid] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        for (const row of requiredRows) {
            const id = rowId(row);
            if (id) init[id] = row.view.isPaid || row.view.presumedPaid;
        }
        return init;
    });

    const requiredCount = requiredRows.length;

    const carryForward = requiredRows.reduce((sum, row) => {
        const id = rowId(row);
        return id && requiredPaid[id] === false ? sum + row.item.amount : sum;
    }, 0);

    const plannedTotal = activeRecommendedActions.reduce((sum, a) => {
        const o = overrides[captureKey(a)] ?? {};
        return sum + (o.actualAmount ?? a.actualAmount);
    }, 0);

    function setOverride(key: string, patch: Partial<PaydayCaptureOverride>) {
        setOverrides((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
    }

    function toggleRequired(id: string | undefined) {
        if (!id) return;
        triggerLightHaptic();
        setRequiredPaid((cur) => ({ ...cur, [id]: !(cur[id] ?? true) }));
    }

    function buildRequiredDecisions(): RequiredReconciliation {
        const expensePaid: Record<string, boolean> = {};
        const debtPaid: Record<string, boolean> = {};
        for (const row of requiredRows) {
            const id = rowId(row);
            if (!id) continue;
            const paid = requiredPaid[id] ?? true;
            if (isExpenseRow(row)) expensePaid[id] = paid;
            else debtPaid[id] = paid;
        }
        return { expensePaid, debtPaid };
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
        onCapture(items, hasAdjustedRequired ? buildRequiredDecisions() : undefined);
    }

    function closeReconcile() {
        setAdjustingRequired(false);
        setHasAdjustedRequired(true);
    }

    // ── The focused reconciliation view (content SWAP — one screen at a time) ──
    if (adjustingRequired) {
        return (
            <div className="settings-overlay" onClick={onClose}>
                <div
                    className="settings-sheet payday-sheet payday-reconcile"
                    onClick={(event) => event.stopPropagation()}
                    role="dialog"
                    aria-label="Confirm required bills"
                >
                    <div className="settings-sheet-header">
                        <div>
                            <button
                                type="button"
                                className="text-action-button payday-back"
                                onClick={() => {
                                    triggerLightHaptic();
                                    closeReconcile();
                                }}
                            >
                                ‹ Back
                            </button>
                            <h2>Which bills got paid?</h2>
                            <p className="section-collapse-subtitle">
                                Tap to mark what you actually paid — anything left carries to next cycle.
                            </p>
                        </div>
                    </div>

                    <div className="payday-reconcile-list">
                        {requiredRows.map((row) => {
                            const id = rowId(row);
                            const paid = id ? requiredPaid[id] ?? true : true;
                            return (
                                <button
                                    type="button"
                                    key={id ?? row.item.label}
                                    className={`payday-reconcile-row ${paid ? "paid" : "unpaid"}`}
                                    onClick={() => toggleRequired(id)}
                                    aria-pressed={paid}
                                >
                                    <div className="payday-reconcile-text">
                                        <span className="payday-reconcile-label">
                                            {requiredDisplayLabel(row.item, row.view)}
                                        </span>
                                        <span className="payday-reconcile-meta">
                                            {row.view.isAutopay
                                                ? row.view.presumedPaid
                                                    ? "⚡ Autopay · ran"
                                                    : "⚡ Autopay"
                                                : row.view.dueDate
                                                    ? `Due ${row.view.dueDate}`
                                                    : "Required"}
                                        </span>
                                    </div>
                                    <span className="payday-reconcile-amount">
                                        {formatCurrency(row.item.amount)}
                                    </span>
                                    <span className="payday-reconcile-state">
                                        {paid ? "Paid" : "Didn’t pay"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {carryForward > 0 && (
                        <div className="payday-reconcile-carry">
                            <strong>{formatCurrency(carryForward)}</strong> carries to next cycle
                        </div>
                    )}

                    <div className="payday-actions">
                        <button
                            type="button"
                            className="payday-primary-button"
                            onClick={() => {
                                triggerMediumHaptic();
                                closeReconcile();
                            }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── The main checkpoint view ──
    const requiredSub = hasAdjustedRequired
        ? carryForward > 0
            ? `${formatCurrency(requiredTotal - carryForward)} paid · ${formatCurrency(carryForward)} carries`
            : "All confirmed paid"
        : `${requiredCount} bill${requiredCount === 1 ? "" : "s"} & minimums due this paycheck`;

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
                                <span className="payday-required-sub">{requiredSub}</span>
                            </div>
                            <strong className="payday-required-amount">
                                {formatCurrency(requiredTotal)}
                            </strong>
                        </div>
                        <button
                            type="button"
                            className="payday-required-adjust"
                            onClick={() => {
                                triggerLightHaptic();
                                setAdjustingRequired(true);
                            }}
                        >
                            Adjust
                        </button>
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
                                    {adjustingExtras ? (
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
                                {adjustingExtras && (
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

                {activeRecommendedActions.length > 0 && (
                    <div className="payday-plan-total">
                        <span>{adjustingExtras ? "Total you paid" : "Recommended this paycheck"}</span>
                        <strong>{formatCurrency(plannedTotal)}</strong>
                    </div>
                )}

                <div className="payday-actions">
                    <button type="button" className="payday-primary-button" onClick={handleCapture}>
                        {hasAdjustedRequired ? "Confirm what I paid" : "I followed the plan"}
                    </button>
                    {!adjustingExtras && activeRecommendedActions.length > 0 && (
                        <button
                            type="button"
                            className="text-action-button payday-secondary"
                            onClick={() => {
                                triggerLightHaptic();
                                setAdjustingExtras(true);
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
