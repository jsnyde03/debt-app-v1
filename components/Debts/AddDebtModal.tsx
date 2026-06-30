import { triggerLightHaptic } from "@/lib/mobile/haptics";
import type { Recurrence } from "@/lib/types/recurrence";

type AddDebtModalProps = {
    debtName: string;
    debtBalance: string;
    debtMinimumPayment: string;
    debtApr: string;
    debtDueDate: string;
    debtType: "debt" | "bnpl";
    debtRecurrence: Recurrence;
    debtIsAutopay: boolean;
    debtRemainingPayments: string;
    debtScheduledPaymentAmount: string;

    debtErrors: {
        name?: string;
        balance?: string;
        minimumPayment?: string;
        dueDate?: string;
        apr?: string;
    };

    debtWarnings: {
        minimumPayment?: string;
    };

    onDebtNameChange: (value: string) => void;
    onDebtBalanceChange: (value: string) => void;
    onDebtMinimumPaymentChange: (value: string) => void;
    onDebtAprChange: (value: string) => void;
    onDebtDueDateChange: (value: string) => void;
    onDebtTypeChange: (value: "debt" | "bnpl") => void;
    onDebtRecurrenceChange: (value: Recurrence) => void;
    onDebtIsAutopayChange: (value: boolean) => void;
    onDebtRemainingPaymentsChange: (value: string) => void;
    onDebtScheduledPaymentAmountChange: (value: string) => void;

    onAdd: () => void;
    onClose: () => void;
};

export function AddDebtModal({
    debtName,
    debtBalance,
    debtMinimumPayment,
    debtApr,
    debtDueDate,
    debtType,
    debtRecurrence,
    debtIsAutopay,
    debtRemainingPayments,
    debtScheduledPaymentAmount,
    debtErrors,
    debtWarnings,
    onDebtNameChange,
    onDebtBalanceChange,
    onDebtMinimumPaymentChange,
    onDebtAprChange,
    onDebtDueDateChange,
    onDebtTypeChange,
    onDebtRecurrenceChange,
    onDebtIsAutopayChange,
    onDebtRemainingPaymentsChange,
    onDebtScheduledPaymentAmountChange,
    onAdd,
    onClose,
}: AddDebtModalProps) {
    return (
        <div
            className="center-modal-overlay"
            onClick={() => { triggerLightHaptic(); onClose(); }}
        >
            <div
                className="center-modal debt-add-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="center-modal-header">
                    <div>
                        <h2>Add Debt</h2>
                        <p>Track A Loan, Credit Card, Or BNPL Balance.</p>
                    </div>

                    <button
                        type="button"
                        className="text-action-button"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                <div className="form-grid">
                    <div className="field">
                        <label>Debt Name</label>
                        <input
                            type="text"
                            placeholder="Debt Name"
                            value={debtName}
                            onChange={(event) => onDebtNameChange(event.target.value)}
                        />

                        {debtErrors.name && (
                            <p className="validation-error">
                                {debtErrors.name}
                            </p>
                        )}
                    </div>

                    <div className="field">
                        <label>Current Balance</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Total Balance Owed"
                            value={debtBalance}
                            onChange={(event) => onDebtBalanceChange(event.target.value)}
                        />

                        {debtErrors.balance && (
                            <p className="validation-error">
                                {debtErrors.balance}
                            </p>
                        )}
                    </div>

                    <div className="field">
                        <label>Minimum</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Minimum Payment"
                            value={debtMinimumPayment}
                            onChange={(event) => onDebtMinimumPaymentChange(event.target.value)}
                        />

                        {debtErrors.minimumPayment && (
                            <p className="validation-error">
                                {debtErrors.minimumPayment}
                            </p>
                        )}

                        {debtWarnings.minimumPayment && (
                            <p className="validation-warning">
                                {debtWarnings.minimumPayment}
                            </p>
                        )}
                    </div>

                    <div className="field">
                        <label>APR (%)</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="Example: 24.99"
                            value={debtApr}
                            onChange={(event) => onDebtAprChange(event.target.value)}
                        />

                        {debtErrors.apr && (
                            <p className="validation-error">
                                {debtErrors.apr}
                            </p>
                        )}
                    </div>

                    <div className="field">
                        <label>Due Date</label>
                        <div className="date-input-wrapper">
                            <input
                                type="date"
                                value={debtDueDate}
                                onChange={(event) => onDebtDueDateChange(event.target.value)}
                            />
                            {!debtDueDate && (
                                <span className="date-input-placeholder">MM/DD/YYYY</span>
                            )}
                        </div>

                        {debtErrors.dueDate && (
                            <p className="validation-error">
                                {debtErrors.dueDate}
                            </p>
                        )}
                    </div>

                    <div className="field">
                        <label>Type</label>
                        <select
                            value={debtType}
                            onChange={(event) => { triggerLightHaptic(); onDebtTypeChange(event.target.value as | "debt" | "bnpl"); }}
                        >
                            <option value="debt">Debt</option>
                            <option value="bnpl">BNPL</option>
                        </select>
                    </div>

                    {debtType === "bnpl" && (
                        <>
                            <div className="field">
                                <label>Remaining Payments</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Example: 4"
                                    value={debtRemainingPayments}
                                    onChange={(event) => onDebtRemainingPaymentsChange(event.target.value)}
                                />
                            </div>

                            <div className="field">
                                <label>Scheduled Payment Amount</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Example: 125"
                                    value={debtScheduledPaymentAmount}
                                    onChange={(event) => onDebtScheduledPaymentAmountChange(event.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="field">
                        <label>Recurrence</label>
                        <select
                            value={debtRecurrence}
                            onChange={(event) => { triggerLightHaptic(); onDebtRecurrenceChange(event.target.value as Recurrence); }}
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
                                checked={debtIsAutopay}
                                onChange={(event) => { triggerLightHaptic(); onDebtIsAutopayChange(event.target.checked); }}
                            />
                            Autopay
                        </label>
                    </div>

                    <button
                        type="button"
                        className="add-button modal-primary-action"
                        onClick={onAdd}
                    >
                        Add Debt
                    </button>
                </div>
            </div>
        </div>
    );
}
