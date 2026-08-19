import { useState } from "react";
import { formatCurrency } from "@core/utils/formatCurrency";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import type { ActiveRecommendedAction } from "@core/engine/recommendedActions";
import {
    buildPaydayCaptureItems,
    captureKey,
    type PaydayCaptureOverride,
} from "@core/debt/buildPaydayCaptureItems";
import { requiredDisplayLabel, type RequiredActionView } from "@core/debt/deriveRequiredActionView";
import type { RequiredReconciliation } from "@core/debt/bulkMarkRequired";
import type { CompletedRecommendedAction } from "@core/storage/debtPlannerStorage";

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
    const [editingExtraKey, setEditingExtraKey] = useState<string | null>(null);
    const [overrides, setOverrides] = useState<Record<string, PaydayCaptureOverride>>({});
    // Brief "Payday captured ✓" success beat before the sheet commits + closes.
    const [captured, setCaptured] = useState(false);

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
    // Snapshot of requiredPaid taken right before "Mark all paid" — non-null means
    // the bulk action is active and the button reads "Undo", restoring this exact
    // prior state (preserving the truth). Cleared by any manual row toggle.
    const [preMarkAllPaid, setPreMarkAllPaid] = useState<Record<string, boolean> | null>(null);

    const requiredCount = requiredRows.length;

    const carryForward = requiredRows.reduce((sum, row) => {
        const id = rowId(row);
        return id && requiredPaid[id] === false ? sum + row.item.amount : sum;
    }, 0);

    const plannedTotal = activeRecommendedActions.reduce((sum, a) => {
        const o = overrides[captureKey(a)] ?? {};
        if (o.skipped) return sum;
        return sum + (o.actualAmount ?? a.actualAmount);
    }, 0);

    // Any extra the user edited / skipped / marked external — used (with the required
    // adjustments) to label the confirm button honestly.
    const extrasAdjusted = activeRecommendedActions.some((a) => {
        const o = overrides[captureKey(a)];
        return !!o && (o.skipped || o.actualAmount !== undefined || o.external);
    });

    function setOverride(key: string, patch: Partial<PaydayCaptureOverride>) {
        setOverrides((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
    }

    function toggleRequired(id: string | undefined) {
        if (!id) return;
        triggerLightHaptic();
        setRequiredPaid((cur) => ({ ...cur, [id]: !(cur[id] ?? true) }));
        setHasAdjustedRequired(true);
        // A manual edit ends the bulk-mark session — "Undo" no longer cleanly
        // applies, so the button reverts to "Mark all paid".
        setPreMarkAllPaid(null);
    }

    // "Mark all paid" ⇄ "Undo": the first press snapshots the current per-row state
    // and marks everything paid; pressing "Undo" restores that exact snapshot
    // (preserving the truth). A manual toggle (above) ends the session.
    function toggleMarkAllRequired() {
        triggerLightHaptic();
        if (preMarkAllPaid) {
            setRequiredPaid(preMarkAllPaid);
            setPreMarkAllPaid(null);
            return;
        }
        setPreMarkAllPaid(requiredPaid);
        setRequiredPaid(() => {
            const next: Record<string, boolean> = {};
            for (const row of requiredRows) {
                const id = rowId(row);
                if (id) next[id] = true;
            }
            return next;
        });
        setHasAdjustedRequired(true);
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
        if (captured) return;
        triggerMediumHaptic();
        const items = buildPaydayCaptureItems(
            activeRecommendedActions
                .filter((a) => !overrides[captureKey(a)]?.skipped)
                .map((a) => ({
                    targetId: a.targetId,
                    label: a.label,
                    category: a.category,
                    recommendedAmount: a.recommendedAmount,
                    actualAmount: a.actualAmount,
                })),
            overrides
        );
        const decisions = hasAdjustedRequired ? buildRequiredDecisions() : undefined;
        // Show the success beat, then commit the capture + close the sheet.
        setCaptured(true);
        setTimeout(() => onCapture(items, decisions), 850);
    }

    // Closing the reconcile view does NOT itself count as an adjustment — only an
    // actual toggle / mark-all does (via setHasAdjustedRequired above). So opening
    // Adjust out of curiosity and backing out unchanged leaves the happy-path
    // "mark everything paid" intact instead of silently flipping bills to unpaid.
    function closeReconcile() {
        setAdjustingRequired(false);
    }

    // ── Success beat after confirming (before the sheet commits + closes) ──
    if (captured) {
        return (
            <div className="settings-overlay">
                <div
                    className="settings-sheet payday-sheet payday-captured"
                    role="dialog"
                    aria-label="Payday captured"
                >
                    <div className="payday-captured-check" aria-hidden="true">
                        ✓
                    </div>
                    <h2>Payday captured</h2>
                    <p className="section-collapse-subtitle">
                        Nice work — your plan&rsquo;s up to date.
                    </p>
                </div>
            </div>
        );
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

                    <div className="payday-reconcile-toolbar">
                        <button
                            type="button"
                            className="text-action-button payday-mark-all"
                            onClick={toggleMarkAllRequired}
                        >
                            {preMarkAllPaid ? "Undo" : "Mark all paid"}
                        </button>
                    </div>

                    <div className="payday-reconcile-list">
                        {requiredRows.map((row) => {
                            const id = rowId(row);
                            const paid = id ? requiredPaid[id] ?? true : true;
                            return (
                                // A <div role="button">, NOT a <button>: iOS WKWebView renders a
                                // native <button> at ~its min-height and will not grow the box to
                                // fit multi-line content, so a two-line bill label spilled its
                                // "Due …" meta down over the next card. A plain <div> grows to its
                                // content in every engine. Keyboard a11y kept via role + onKeyDown.
                                <div
                                    role="button"
                                    tabIndex={0}
                                    key={id ?? row.item.label}
                                    className={`payday-reconcile-row ${paid ? "paid" : "unpaid"}`}
                                    onClick={() => toggleRequired(id)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            toggleRequired(id);
                                        }
                                    }}
                                    aria-pressed={paid}
                                >
                                    <span className="payday-reconcile-text">
                                        <span className="payday-reconcile-label">
                                            {requiredDisplayLabel(row.item, row.view)}
                                        </span>
                                        <span className="payday-reconcile-meta">
                                            {/* ⛔ [L3-7] The same presumption-as-event the RN sheet carried.
                                                Found by the retired-string sweep, NOT by the finding, which
                                                listed only the RN site — this tree dies at 5.5.1 but ships
                                                behind the public embed until then. */}
                                            {row.view.isAutopay
                                                ? row.view.presumedPaid
                                                    ? "⚡ Autopay · should have run"
                                                    : "⚡ Autopay"
                                                : row.view.dueDate
                                                    ? `Due ${row.view.dueDate}`
                                                    : "Required"}
                                        </span>
                                    </span>
                                    <span className="payday-reconcile-amount">
                                        {formatCurrency(row.item.amount)}
                                    </span>
                                    <span className="payday-reconcile-state">
                                        {paid ? "Paid" : "Didn’t pay"}
                                    </span>
                                </div>
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
        : `${requiredCount} due this paycheck`;

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

                <div className="payday-extras-list">
                    {activeRecommendedActions.map((action) => {
                        const key = captureKey(action);
                        const o = overrides[key] ?? {};
                        const skipped = !!o.skipped;
                        const external = !!o.external;
                        const amount = o.actualAmount ?? action.actualAmount;
                        const editing = editingExtraKey === key;
                        return (
                            <div
                                className={`payday-extra-row${skipped ? " skipped" : ""}`}
                                key={action.key}
                            >
                                <div className="payday-extra-text">
                                    <span className="payday-extra-label">{action.label}</span>
                                    <button
                                        type="button"
                                        className={`payday-extra-chip${external ? " on" : ""}`}
                                        onClick={() => {
                                            triggerLightHaptic();
                                            setOverride(key, { external: !external });
                                        }}
                                        aria-pressed={external}
                                    >
                                        {external ? "From savings ✓" : "From savings"}
                                    </button>
                                </div>

                                <div className="payday-extra-right">
                                    {editing ? (
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="payday-extra-input"
                                            aria-label={`Amount paid for ${action.label}`}
                                            autoFocus
                                            value={amount}
                                            min={0}
                                            onChange={(event) =>
                                                setOverride(key, {
                                                    actualAmount: Math.max(0, Number(event.target.value) || 0),
                                                })
                                            }
                                            onBlur={() => setEditingExtraKey(null)}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            className="payday-extra-amount"
                                            onClick={() => setEditingExtraKey(key)}
                                            disabled={skipped}
                                        >
                                            {formatCurrency(amount)}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={`payday-extra-state ${skipped ? "skipped" : "paid"}`}
                                        onClick={() => {
                                            triggerLightHaptic();
                                            setOverride(key, { skipped: !skipped });
                                        }}
                                        aria-pressed={!skipped}
                                    >
                                        {skipped ? "Skipped" : "Paid"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {activeRecommendedActions.length > 0 && (
                    <div className="payday-plan-total">
                        <span>You paid</span>
                        <strong>{formatCurrency(plannedTotal)}</strong>
                    </div>
                )}

                <div className="payday-actions">
                    <button type="button" className="payday-primary-button" onClick={handleCapture}>
                        {hasAdjustedRequired || extrasAdjusted
                            ? "Confirm what I paid"
                            : "I followed the plan"}
                    </button>
                    <button type="button" className="text-action-button payday-secondary" onClick={onDismiss}>
                        Skip this payday
                    </button>
                </div>
            </div>
        </div>
    );
}
