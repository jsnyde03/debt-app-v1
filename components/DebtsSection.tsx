import { useMemo, useState } from "react";
import type { Debt } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type DebtSortOption = "dueDate" | "balance" | "apr" | "minimumPayment" | "name";

type DebtSectionProps = {
    activeDebts: Debt[];
    paidOffDebts: Debt[];

    debtName: string;
    debtBalance: string;
    debtMinimumPayment: string;
    debtApr: string;
    debtDueDate: string;
    debtType: "debt" | "bnpl";
    debtRecurrence: Recurrence;
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

    formatRecurrence: (recurrence: Recurrence) => string;

    onDebtNameChange: (value: string) => void;
    onDebtBalanceChange: (value: string) => void;
    onDebtMinimumPaymentChange: (value: string) => void;
    onDebtAprChange: (value: string) => void;
    onDebtDueDateChange: (value: string) => void;
    onDebtTypeChange: (value: "debt" | "bnpl") => void;
    onDebtRecurrenceChange: (value: Recurrence) => void;
    onDebtRemainingPaymentsChange: (value: string) => void;
    onDebtScheduledPaymentAmountChange: (value: string) => void;
    onImportDebtsCsv?: (event: React.ChangeEvent<HTMLInputElement>) => void;

    onAddDebt: () => void;
    onRemoveDebt: (id: string) => void;
    onUpdateDebt: (
        id: string,
        updates: Partial<Pick<Debt, "balance" | "minimumPayment" | "dueDate" | "apr">>) => void;
};

function sortDebts(debts: Debt[], sortBy: DebtSortOption) {
    return [...debts].sort((a, b) => {
        switch (sortBy) {
            case "balance":
                return b.balance - a.balance;
            case "apr":
                return b.apr - a.apr;
            case "minimumPayment":
                return b.minimumPayment - a.minimumPayment;
            case "name":
                return a.name.localeCompare(b.name);
            case "dueDate":
            default:
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
    });
}

export function DebtsSection({
    activeDebts,
    paidOffDebts,
    debtName,
    debtBalance,
    debtMinimumPayment,
    debtApr,
    debtDueDate,
    debtType,
    debtRecurrence,
    debtErrors,
    debtWarnings,
    formatRecurrence,
    onDebtNameChange,
    onDebtBalanceChange,
    onDebtAprChange,
    onDebtMinimumPaymentChange,
    onDebtDueDateChange,
    onDebtRecurrenceChange,
    onDebtTypeChange,
    onAddDebt,
    onRemoveDebt,
    onUpdateDebt,
    debtRemainingPayments,
    debtScheduledPaymentAmount,
    onDebtRemainingPaymentsChange,
    onDebtScheduledPaymentAmountChange,
    onImportDebtsCsv,
}: DebtSectionProps) {
    const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
    const [editBalance, setEditBalance] = useState("");
    const [editMinimumPayment, setEditMinimumPayment] = useState("");
    const [editApr, setEditApr] = useState("");
    const [editDueDate, setEditDueDate] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<DebtSortOption>("dueDate");

    const [expandedSections, setExpandedSections] = useState({
        active: false,
        paidOff: false,
    });

    const [debtPages, setDebtPages] = useState({
        active: 1,
        paidOff: 1,
    });

    const [showAddDebtForm, setShowAddDebtForm] = useState(false);
    const [showAddDebtModal, setShowAddDebtModal] = useState(false);

    const allDebts = useMemo(() => {
        const map = new Map<string, Debt>();

        [...activeDebts, ...paidOffDebts].forEach((debt) => {
            map.set(debt.id, debt);
        });

        return Array.from(map.values());
    }, [activeDebts, paidOffDebts]);

    const filteredActiveDebts = sortDebts(activeDebts.filter((debt) => debt.name.toLowerCase().includes(searchTerm.toLowerCase())),
        sortBy
    );

    const filteredPaidOffDebts = sortDebts(
        paidOffDebts.filter((debt) => debt.name.toLowerCase().includes(searchTerm.toLowerCase())),
        sortBy
    );

    const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.balance, 0);

    const totalMinimums = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

    const highestApr = activeDebts.reduce((highest, debt) => Math.max(highest, debt.apr), 0);

    function toggleSection(section: keyof typeof expandedSections) {
        setExpandedSections((current) => ({
            ...current,
            [section]: !current[section],
        }));
    }

    function startEditing(debt: Debt) {
        setEditingDebtId(debt.id);
        setEditBalance(String(debt.balance));
        setEditMinimumPayment(String(debt.minimumPayment));
        setEditApr(String(debt.apr));
        setEditDueDate(debt.dueDate);
    }

    function cancelEditing() {
        setEditingDebtId(null);
        setEditBalance("");
        setEditMinimumPayment("");
        setEditApr("");
        setEditDueDate("");
    }

    function saveEditing(id: string) {
        const balance = Number(editBalance);
        const minimumPayment = Number(editMinimumPayment);
        const apr = Number(editApr || 0);

        if (!balance || balance < 0 || minimumPayment < 0 || minimumPayment > balance || apr < 0 || !editDueDate) {
            return;
        }

        onUpdateDebt(id, {
            balance,
            minimumPayment,
            apr,
            dueDate: editDueDate,
        });

        cancelEditing();
    }

    function renderDebt(debt: Debt) {
        const isEditing = editingDebtId === debt.id;

        return (
            <div key={debt.id} className="saved-item debt-list-item">
                {isEditing ? (
                    <>
                        <div className="field">
                            <label>Current Balance</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={editBalance}
                                onChange={(event) => setEditBalance(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Minimum Payment</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={editMinimumPayment}
                                onChange={(event) => setEditMinimumPayment(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>APR (%)</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={editApr}
                                onChange={(event) => setEditApr(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Due Date</label>
                            <input
                                type="date"
                                value={editDueDate}
                                onChange={(event) => setEditDueDate(event.target.value)}
                            />
                        </div>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => saveEditing(debt.id)}
                        >
                            Save
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={cancelEditing}
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <>
                        <div>
                            <div className="saved-title">
                                {debt.name} {debt.balance <= 0 ? "✔" : ""}
                            </div>

                            <div className="saved-meta">
                                {formatCurrency(debt.balance)} balance ·{" "}
                                {formatCurrency(debt.minimumPayment)} min ·{" "}
                                {debt.apr}% APR · Due {debt.dueDate} ·{" "}
                                {formatRecurrence(debt.recurrence)}

                                {debt.type === "bnpl" && debt.remainingPayments ? (
                                    <> · {debt.remainingPayments} payments left</>
                                ) : null}

                                {debt.type === "bnpl" && debt.scheduledPaymentAmount ? (
                                    <>
                                        {" "}
                                        · {formatCurrency(debt.scheduledPaymentAmount)}/payment
                                    </>
                                ) : null}
                            </div>
                        </div>

                        <div className="saved-amount">
                            {formatCurrency(debt.minimumPayment)}
                        </div>

                        <div className="saved-actions">
                            <button
                                type="button"
                                className="text-action-button"
                                onClick={() => startEditing(debt)}
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                className="text-action-button danger-action"
                                onClick={() => onRemoveDebt(debt.id)}
                            >
                                Remove
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    function renderPagination(sectionKey: keyof typeof debtPages, totalItems: number) {
        const pageSize = 10;
        const currentPage = debtPages[sectionKey];
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

        if (totalItems <= pageSize) {
            return null;
        }

        return (
            <div className="pagination-actions">
                <button
                    type="button"
                    className="secondary-button"
                    disabled={currentPage === 1}
                    onClick={() => setDebtPages((current) => ({
                        ...current,
                        [sectionKey]: Math.max(1, current[sectionKey] - 1),
                    }))
                    }
                >
                    Previous
                </button>

                <span className="pagination-status">
                    Page {currentPage} of {totalPages}
                </span>

                <button
                    type="button"
                    className="secondary-button"
                    disabled={currentPage === totalPages}
                    onClick={() => setDebtPages((current) => ({
                        ...current,
                        [sectionKey]: Math.min(totalPages, current[sectionKey] + 1),
                    }))}
                >
                    Next
                </button>
            </div>
        );
    }

    function renderDebtGroup(title: string, count: number, sectionKey: keyof typeof expandedSections, pageKey: keyof typeof debtPages, debts: Debt[], emptyText: string) {
        const pageSize = 10;
        const currentPage = debtPages[pageKey];
        const startIndex = (currentPage - 1) * pageSize;
        const visibleDebts = debts.slice(startIndex, startIndex + pageSize);

        return (
            <div className="debt-group collapsible-group">
                <button
                    type="button"
                    className="collapsible-header"
                    onClick={() => toggleSection(sectionKey)}
                >
                    <span>{title} <strong className="section-count">({count})</strong></span>

                    <span>{expandedSections[sectionKey] ? "-" : "+"}</span>
                </button>

                {expandedSections[sectionKey] &&
                    (debts.length === 0 ? (
                        <p className="empty-state">{emptyText}</p>
                    ) : (
                        <>
                            {visibleDebts.map(renderDebt)}
                            {renderPagination(pageKey, debts.length)}
                        </>
                    ))}
            </div>
        );
    }

    return (
        <section className="card">
            <h2>Debts</h2>

            <div className="debt-summary-grid">
                <div className="summary-card">
                    <span>Total Debt</span>
                    <strong>{formatCurrency(totalDebt)}</strong>
                </div>

                <div className="summary-card">
                    <span>Total Minimums</span>
                    <strong>{formatCurrency(totalMinimums)}</strong>
                </div>

                <div className="summary-card">
                    <span>Active Debts</span>
                    <strong>{activeDebts.length}</strong>
                </div>

                <div className="summary-card">
                    <span>Highest APR</span>
                    <strong>{highestApr}%</strong>
                </div>
            </div>

            <div className="debt-controls">
                <input
                    type="text"
                    placeholder="Search debts..."
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setDebtPages({ active: 1, paidOff: 1 });
                    }}
                />

                <select
                    value={sortBy}
                    onChange={(event) => {
                        setSortBy(event.target.value as DebtSortOption);
                        setDebtPages({ active: 1, paidOff: 1 });
                    }}
                >
                    <option value="dueDate">Sort By Due Date</option>
                    <option value="balance">Sort By Balance</option>
                    <option value="apr">Sort by APR</option>
                    <option value="minimumPayment">Sort By Minimum Payment</option>
                    <option value="name">Sort By Name</option>
                </select>
            </div>

            {/*onImportDebtsCsv && (
                <div className="debt-import-actions">
                    <label className="secondary-button import-button">
                        Import Debts CSV

                        <input
                            type="file"
                            accept=".csv"
                            onChange={onImportDebtsCsv}
                            hidden
                        />
                    </label>
                </div>
            )*/}



            <button
                type="button"
                className="compact-action-button"
                onClick={() => setShowAddDebtModal(true)}
            >
                + Add Debt
            </button>

            {showAddDebtModal && (
                <div
                    className="center-modal-overlay"
                    onClick={() => setShowAddDebtModal(false)}
                >
                    <div
                        className="center-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="center-modal-header">
                            <div>
                                <h2>Add Debt</h2>
                                <p>Track a loan, credit card, or BNPL balance.</p>
                            </div>

                            <button
                                type="button"
                                className="text-action-button"
                                onClick={() => setShowAddDebtModal(false)}
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
                                    <p className="validation-error">{debtErrors.name}</p>
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
                                    <p className="validation-error">{debtErrors.balance}</p>
                                )}
                            </div>

                            <div className="field">
                                <label>Minimum Payment</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Minimum Payment"
                                    value={debtMinimumPayment}
                                    onChange={(event) => onDebtMinimumPaymentChange(event.target.value)}
                                />

                                {debtErrors.minimumPayment && (
                                    <p className="validation-error">{debtErrors.minimumPayment}</p>
                                )}

                                {debtWarnings.minimumPayment && (
                                    <p className="validation-error">{debtWarnings.minimumPayment}</p>
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
                                    <p className="validation-error">{debtErrors.apr}</p>
                                )}
                            </div>

                            <div className="field">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={debtDueDate}
                                    onChange={(event) => onDebtDueDateChange(event.target.value)}
                                />

                                {debtErrors.dueDate && (
                                    <p className="validation-error">{debtErrors.dueDate}</p>
                                )}
                            </div>

                            <div className="field">
                                <label>Type</label>
                                <select
                                    value={debtType}
                                    onChange={(event) => onDebtTypeChange(event.target.value as "debt" | "bnpl")}
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
                                    onChange={(event) => onDebtRecurrenceChange(event.target.value as Recurrence)}
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Every 2 Weeks</option>
                                    <option value="per-paycheck">Per Paycheck</option>
                                    <option value="one-time">One Time</option>
                                </select>
                            </div>


                        </div>
                    </div>
                </div>

            )}

            {renderDebtGroup(
                "Active Debts",
                filteredActiveDebts.length,
                "active",
                "active",
                filteredActiveDebts,
                "No active debts.",
            )}

            {renderDebtGroup(
                "Paid Off Debts",
                filteredPaidOffDebts.length,
                "paidOff",
                "paidOff",
                filteredPaidOffDebts,
                "No paid off debts.",
            )}
        </section>
    );
}