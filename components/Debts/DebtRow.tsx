import type { Debt } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { SwipeActionCard } from "../SwipeActionCard";

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
            className={`saved-item saved-item-button debt-list-item ${isPaidOff ? "debt-list-item-paid" : ""} ${isHighApr && !isPaidOff ? "debt-list-item-priority" : ""} ${debt.type === "bnpl" ? "debt-list-item-bnpl" : ""}`}
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
                    triggerLightHaptic();
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
                        {debt.name} {isPaidOff ? "✔" : ""}
                        {debt.isAutopay && <span className="autopay-pill">Autopay</span>}
                    </div>

                    <div className="saved-meta debt-card-meta">
                        <span>Balance: {formatCurrency(displayBalance)}</span>

                        <span>APR {debt.apr}%</span>

                        <span>
                            Due: {new Date(debt.dueDate).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric"
                            })}
                        </span>
                    </div>
                </div>

                <div className="saved-item-right">
                    <strong className="saved-amount">
                        {formatCurrency(debt.minimumPayment)}
                        <span className="amount-suffix">/mo</span>
                    </strong>

                    <span className="row-chevron">›</span>
                </div>
            </button>
        </SwipeActionCard>
    );
}
