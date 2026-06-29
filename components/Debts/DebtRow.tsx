import { useEffect, useRef, useState } from "react";
import type { Debt } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { calculateMonthlyInterest } from "@/lib/debt/calculateMonthlyInterest";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { SwipeActionCard } from "../SwipeActionCard";
import { Check, ChevronRight, CreditCard } from "@/lib/icons";

type DebtWithDisplayBalance = Debt & {
    displayBalance?: number;
};

type DebtRowProps = {
    debt: DebtWithDisplayBalance;
    isEditing: boolean;

    editBalance: string;
    editMinimumPayment: string;
    editApr: string;
    editDueDate: string;
    editIsAutopay: boolean;
    editRecurrence: Recurrence;

    onEditBalanceChange: (value: string) => void;
    onEditMinimumPaymentChange: (value: string) => void;
    onEditAprChange: (value: string) => void;
    onEditDueDateChange: (value: string) => void;
    onEditIsAutopayChange: (value: boolean) => void;
    onEditRecurrenceChange: (value: Recurrence) => void;

    onStartEditing: (debt: Debt) => void;
    onCancelEditing: () => void;
    onSaveEditing: (id: string) => void;
    onRemoveDebt: (id: string) => void;
};

export function DebtRow({
    debt,
    isEditing,
    editBalance,
    editMinimumPayment,
    editApr,
    editDueDate,
    editIsAutopay,
    editRecurrence,
    onEditBalanceChange,
    onEditMinimumPaymentChange,
    onEditAprChange,
    onEditDueDateChange,
    onEditIsAutopayChange,
    onEditRecurrenceChange,
    onStartEditing,
    onCancelEditing,
    onSaveEditing,
    onRemoveDebt,
}: DebtRowProps) {
    const displayBalance = debt.displayBalance ?? debt.balance;
    const isPaidOff = displayBalance <= 0;
    const isHighApr = debt.apr >= 20;

    const [isAnimatingPaid, setIsAnimatingPaid] = useState(false);
    const prevIsPaidOff = useRef(isPaidOff);

    useEffect(() => {
        const wasUnpaid = !prevIsPaidOff.current;
        prevIsPaidOff.current = isPaidOff;
        if (isPaidOff && wasUnpaid) {
            setIsAnimatingPaid(true);
            const t = window.setTimeout(() => setIsAnimatingPaid(false), 400);
            return () => window.clearTimeout(t);
        }
    }, [isPaidOff]);

    if (isEditing) {
        return (
            <div key={debt.id} className="saved-item debt-edit-card compact-debt-edit-card">
                <div className="saved-item-left">
                    <div className="saved-title">{debt.name}</div>
                </div>

                <div className="compact-debt-edit-grid">
                    <div className="field">
                        <label>Balance</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={editBalance}
                            onChange={(event) => onEditBalanceChange(event.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Minimum Payment</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={editMinimumPayment}
                            onChange={(event) =>
                                onEditMinimumPaymentChange(event.target.value)
                            }
                        />
                    </div>
                </div>

                <details className="debt-advanced-edit">
                    <summary>Advanced</summary>

                    <div className="compact-debt-edit-grid advanced-grid">
                        <div className="field">
                            <label>APR (%)</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={editApr}
                                onChange={(event) => onEditAprChange(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Due Date</label>
                            <input
                                type="date"
                                value={editDueDate}
                                onChange={(event) => onEditDueDateChange(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Recurrence</label>
                            <select
                                value={editRecurrence}
                                onChange={(event) => { triggerLightHaptic(); onEditRecurrenceChange(event.target.value as Recurrence); }}
                            >
                                <option value="one-time">One Time</option>
                                <option value="per-paycheck">Every Paycheck</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Every 2 Weeks</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="annually">Yearly</option>
                            </select>
                        </div>

                        <div className="field checkbox-field">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={editIsAutopay}
                                    onChange={(event) => {
                                        triggerLightHaptic();
                                        onEditIsAutopayChange(event.target.checked);
                                    }}
                                />
                                Autopay
                            </label>
                        </div>
                    </div>
                </details>

                <div className="debt-edit-actions">
                    <button
                        type="button"
                        className="text-action-button danger-action"
                        onClick={() => {
                            triggerMediumHaptic();
                            onRemoveDebt(debt.id);
                        }}
                    >
                        Remove
                    </button>

                    <div className="debt-edit-actions-right">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onCancelEditing}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="add-button debt-save-button"
                            onClick={() => onSaveEditing(debt.id)}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <SwipeActionCard
            key={debt.id}
            className={`saved-item saved-item-button debt-list-item ${isPaidOff ? "debt-list-item-paid" : ""} ${isHighApr && !isPaidOff ? "debt-list-item-priority" : ""} ${debt.type === "bnpl" ? "debt-list-item-bnpl" : ""} ${isAnimatingPaid ? "animating-paid" : ""}`}
            leftAction={{
                label: "Edit",
                tone: "warning",
                onTrigger: () => {
                    triggerLightHaptic();
                    onStartEditing(debt);
                },

            }}

            rightAction={{
                label: "Remove",
                tone: "danger",
                onTrigger: () => {
                    triggerMediumHaptic();
                    onRemoveDebt(debt.id);
                },
            }}
        >
            <button
                type="button"
                className="saved-item-inner-button"
                onClick={() => {
                    triggerLightHaptic();
                    onStartEditing(debt);
                }}
            >
                <div className="saved-item-left">
                    <div className="saved-title">
                        {debt.name} {isPaidOff && <Check size={14} className="paid-off-icon" aria-hidden="true" />}
                        {debt.isAutopay && <span className="autopay-pill">Autopay</span>}
                        {debt.type === "bnpl"
                            ? <span className="bnpl-badge">BNPL</span>
                            : <span className="debt-type-icon" aria-label="Credit card debt"><CreditCard size={12} aria-hidden="true" /></span>
                        }
                    </div>

                    <div className="saved-meta debt-card-meta">
                        <span>Balance: {formatCurrency(displayBalance)}</span>

                        {debt.type === "bnpl" && debt.remainingPayments != null ? (
                            <span>{debt.remainingPayments} payments left</span>
                        ) : (
                            <span>APR {debt.apr}%</span>
                        )}

                        <span>
                            Due: {new Date(debt.dueDate).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric"
                            })}
                        </span>
                    </div>

                    {(() => {
                        const monthlyInterest = !isPaidOff && debt.apr > 0 && debt.type !== "bnpl"
                            ? calculateMonthlyInterest(displayBalance, debt.apr)
                            : 0;
                        return monthlyInterest > 0 ? (
                            <span className="debt-interest-callout">
                                ~{formatCurrency(monthlyInterest)}/mo in interest
                            </span>
                        ) : null;
                    })()}

                    {debt.originalBalance && debt.originalBalance > 0 && displayBalance > 0 && displayBalance < debt.originalBalance && (
                        <div className="debt-progress-track">
                            <div
                                className="debt-progress-fill"
                                style={{
                                    width: `${Math.min(100, Math.max(0, ((debt.originalBalance - displayBalance) / debt.originalBalance) * 100))}%`,
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="saved-item-right">
                    <strong className="saved-amount">
                        {formatCurrency(debt.minimumPayment)}
                        <span className="amount-suffix">/mo</span>
                    </strong>

                    <ChevronRight size={18} className="row-chevron" aria-hidden="true" />
                </div>
            </button>
        </SwipeActionCard>
    );
}
