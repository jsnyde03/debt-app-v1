import { useMemo, useState } from "react";
import type { Debt } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { useScrollFabVisible } from "@/lib/mobile/useScrollFabVisible";
import { SwipeActionCard } from "./SwipeActionCard";

type DebtSortOption = "dueDate" | "balance" | "apr" | "minimumPayment" | "name";

type DebtWithDisplayBalance = Debt & {
    displayBalance?: number;
};

type DebtSectionProps = {
    activeDebts: DebtWithDisplayBalance[];
    paidOffDebts: DebtWithDisplayBalance[];

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
    }

    debtWarnings: {
        minimumPayment?: string;
    }

    formatRecurrence: (recurrence: Recurrence) => string;

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
    onImportDebtsCsv?: (vent: React.ChangeEvent<HTMLInputElement>) => void;

    onAddDebt: () => void;
    onRemoveDebt: (id: string) => void;
    onUpdateDebt: (
        id: string,
        updates: Partial<Pick<Debt, "balance" | "minimumPayment" | "dueDate" | "apr" | "isAutopay" | "recurrence">>) => void;
};

function sortDebts(debts: DebtWithDisplayBalance[], sortBy: DebtSortOption, direction: "asc" | "desc") {
    const dir = direction === "asc" ? 1 : -1;
    return [...debts].sort((a, b) => {
        switch (sortBy) {
            case "balance":
                return (a.balance - b.balance) * dir;
            case "apr":
                return (a.apr - b.apr) * dir;
            case "minimumPayment":
                return (a.minimumPayment - b.minimumPayment) * dir;
            case "name":
                return a.name.localeCompare(b.name) * dir;
            case "dueDate":
            default:
                return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir;
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
    debtIsAutopay,
    debtErrors,
    debtWarnings,
    formatRecurrence,
    onDebtNameChange,
    onDebtBalanceChange,
    onDebtAprChange,
    onDebtMinimumPaymentChange,
    onDebtDueDateChange,
    onDebtRecurrenceChange,
    onDebtIsAutopayChange,
    onDebtTypeChange,
    onAddDebt,
    onRemoveDebt,
    onUpdateDebt,
    debtRemainingPayments,
    debtScheduledPaymentAmount,
    onDebtRemainingPaymentsChange,
    onDebtScheduledPaymentAmountChange,
}: DebtSectionProps) {
    const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
    const [editBalance, setEditBalance] = useState("");
    const [editMinimumPayment, setEditMinimumPayment] = useState("");
    const [editApr, setEditApr] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [editIsAutopay, setEditIsAutopay] = useState(false);
    const [editRecurrence, setEditRecurrence] = useState<Recurrence>("monthly");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<DebtSortOption>("dueDate");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
    const [showAddDebtModal, setShowAddDebtModal] = useState(false);
    const showFab = useScrollFabVisible();

    const [expandedSections, setExpandedSections] = useState({
        active: false,
        paidOff: false,
    });

    const [debtPages, setDebtPages] = useState({
        active: 1,
        paidOff: 1,
    });

    const allDebts = useMemo(() => {
        const map = new Map<string, Debt>();

        [...activeDebts, ...paidOffDebts].forEach((debt) => {
            map.set(debt.id, debt);
        });

        return Array.from(map.values());
    }, [activeDebts, paidOffDebts]);

    const filteredActiveDebts = sortDebts(activeDebts.filter((debt) => debt.name.toLowerCase().includes(searchTerm.toLowerCase())), sortBy, sortDirection);
    const filteredPaidOffDebts = sortDebts(paidOffDebts.filter((debt) => debt.name.toLowerCase().includes(searchTerm.toLowerCase())), sortBy, sortDirection);

    const totalDebt = activeDebts.reduce((sum, debt) => sum + (debt.displayBalance ?? debt.balance), 0);
    const totalMinimums = activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const highestApr = activeDebts.reduce((highest, debt) => Math.max(highest, debt.apr), 0);

    function toggleSection(section: keyof typeof expandedSections) {
        triggerLightHaptic();
        setExpandedSections((current) => ({
            ...current,
            [section]: !current[section],
        }));
    }

    function startEditing(debt: Debt) {
        triggerLightHaptic();
        setEditingDebtId(debt.id);
        setEditBalance(String(debt.balance));
        setEditMinimumPayment(String(debt.minimumPayment));
        setEditApr(String(debt.apr));
        setEditDueDate(debt.dueDate);
        setEditIsAutopay(debt.isAutopay ?? false);
        setEditRecurrence(debt.recurrence ?? "monthly");
    }

    function cancelEditing() {
        triggerLightHaptic();
        setEditingDebtId(null);
        setEditBalance("");
        setEditMinimumPayment("");
        setEditApr("");
        setEditDueDate("");
        setEditIsAutopay(false);
        setEditRecurrence("monthly");
    }

    function saveEditing(id: string) {
        const balance = Number(editBalance);
        const minimumPayment = Number(editMinimumPayment);
        const apr = Number(editApr || 0);

        if (balance < 0 || minimumPayment < 0 || apr < 0 || !editDueDate) {
            return;
        }

        triggerMediumHaptic();

        onUpdateDebt(id, {
            balance,
            minimumPayment,
            apr,
            dueDate: editDueDate,
            isAutopay: editIsAutopay,
            recurrence: editRecurrence,
        });

        cancelEditing();
    }

    function handleAddDebt() {
        triggerMediumHaptic();
        onAddDebt();
        setShowAddDebtModal(false);
    }

    function renderDebt(debt: DebtWithDisplayBalance) {
        const isEditing = editingDebtId === debt.id;
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
                                onChange={(event) => setEditBalance(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Minimum Payment</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={editMinimumPayment}
                                onChange={(event) =>
                                    setEditMinimumPayment(event.target.value)
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

                            <div className="field">
                                <label>Recurrence</label>
                                <select
                                    value={editRecurrence}
                                    onChange={(event) => { triggerLightHaptic(); setEditRecurrence(event.target.value as Recurrence); }}
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
                                            setEditIsAutopay(event.target.checked);
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
                                onClick={cancelEditing}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="add-button debt-save-button"
                                onClick={() => saveEditing(debt.id)}
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
                        startEditing(debt);
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
                        startEditing(debt);
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


    function renderPagination(sectionKey: keyof typeof debtPages, totalItems: number) {
        const pageSize = 10;
        const currentPage = debtPages[sectionKey];
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

        if (totalItems <= pageSize) {
            return null;
        }

        return (
            <div className="pagination-actions pagination-compact">
                <button
                    type="button"
                    className="text-action-button"
                    disabled={currentPage <= 1}
                    onClick={() => {
                        triggerLightHaptic(), setDebtPages((current) => ({
                            ...current,
                            [sectionKey]: Math.max(1, current[sectionKey] - 1),
                        }))
                    }}
                >
                    ‹
                </button>

                <span className="pagination-status">
                    Page {currentPage} of {totalPages}
                </span>

                <button
                    type="button"
                    className="text-action-button"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                        triggerLightHaptic(), setDebtPages((current) => ({
                            ...current,
                            [sectionKey]: Math.min(totalPages, current[sectionKey] + 1)
                        }))
                    }}
                >
                    ›
                </button>
            </div>
        )
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
                    className="section-collapse-button"
                    onClick={() => toggleSection(sectionKey)}
                >
                    <div className="section-collapse-left">
                        <h2>{title}</h2>

                        <span className="section-count-pill">{count}</span>
                    </div>

                    <span
                        className={
                            expandedSections[sectionKey]
                                ? "collapse-chevron-expanded"
                                : "collapse-chevron"
                        }
                    >
                        ▼
                    </span>
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
        <>
            <section className="card debts-polish-card">
                <div className="section-heading-row">
                    <div>
                        <h2>Debts</h2>

                        <p className="section-collapse-subtitle">
                            Track Balances, APRs and Payoff Order.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="add-button compact-add-button debts-add-button"
                        onClick={() => { triggerLightHaptic(); setShowAddDebtModal(true); }}
                    >
                        + Add
                    </button>
                </div>

                <div className="debt-summary-strip">
                    <strong>{formatCurrency(totalDebt)} debt</strong>
                    <span>·</span>
                    <strong>{formatCurrency(totalMinimums)} minimums</strong>
                    <span>·</span>
                    <strong>{activeDebts.length} active</strong>
                </div>

                <div className="debt-controls">
                    <input
                        type="text"
                        placeholder="Search debts..."
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value)
                            setDebtPages({ active: 1, paidOff: 1 });
                        }}
                    />

                    <div className="sort-row">
                        <select
                            value={sortBy}
                            onChange={(event) => {
                                setSortBy(event?.target.value as DebtSortOption);
                                setSortDirection("asc");
                                setDebtPages({ active: 1, paidOff: 1 });
                            }}
                        >
                            <option value="dueDate">Sort By Due Date</option>
                            <option value="balance">Sort By Balance</option>
                            <option value="apr">Sort By APR</option>
                            <option value="minimumPayment">Sort By Minimum Payment</option>
                            <option value="name">Sort By Name</option>
                        </select>
                        <button
                            className="sort-direction-btn"
                            onClick={() => {
                                triggerLightHaptic();
                                setSortDirection((d) => d === "asc" ? "desc" : "asc");
                                setDebtPages({ active: 1, paidOff: 1 });
                            }}
                            aria-label={sortDirection === "asc" ? "Sort descending" : "Sort ascending"}
                            title={sortDirection === "asc" ? "Sort descending" : "Sort ascending"}
                        >
                            {sortDirection === "asc" ? "↑" : "↓"}
                        </button>
                    </div>
                </div>

                {allDebts.length === 0 && (
                    <div className="empty-debt-state">
                        <strong>No Debts Added Yet.</strong>
                        <p>Add Loans, Credit Cards, Or BNPL Balances To Start Tracking Payoff Progress.</p>
                    </div>
                )}

                {allDebts.length > 0 && (
                    <>
                        {renderDebtGroup(
                            "Active Debts",
                            filteredActiveDebts.length,
                            "active",
                            "active",
                            filteredActiveDebts,
                            "No Active Debts."
                        )}

                        {renderDebtGroup(
                            "Paid Off Debts",
                            filteredPaidOffDebts.length,
                            "paidOff",
                            "paidOff",
                            filteredPaidOffDebts,
                            "No Paid Off Debts."
                        )}
                    </>
                )}
            </section>

            {showAddDebtModal && (
                <div
                    className="center-modal-overlay"
                    onClick={() => { triggerLightHaptic(); setShowAddDebtModal(false); }}
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
                                onClick={handleAddDebt}
                            >
                                Add Debt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFab && !showAddDebtModal && (
                <button
                    type="button"
                    className="add-button floating-add-button debts-add-button"
                    onClick={() => {
                        triggerLightHaptic();
                        setShowAddDebtModal(true);
                    }}
                    aria-label="Add Debt"
                >
                    + Add
                </button>
            )}
        </>
    );
}