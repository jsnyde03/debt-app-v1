import { useMemo, useState } from "react";
import type { Debt } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { useScrollFabVisible } from "@/lib/mobile/useScrollFabVisible";
import { DebtGroup } from "./Debts/DebtGroup";
import { AddDebtModal } from "./Debts/AddDebtModal";
import { ArrowUp, ArrowDown, SlidersHorizontal, Check, CreditCard } from "@/lib/icons";

type DebtSortOption = "dueDate" | "balance" | "apr" | "minimumPayment" | "name";

const SORT_OPTIONS: { value: DebtSortOption; label: string }[] = [
    { value: "dueDate", label: "Due Date" },
    { value: "balance", label: "Balance" },
    { value: "apr", label: "APR" },
    { value: "minimumPayment", label: "Min. Payment" },
    { value: "name", label: "Name" },
];

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
    const [showSortSheet, setShowSortSheet] = useState(false);
    const showFab = useScrollFabVisible();

    const [expandedSections, setExpandedSections] = useState({
        active: false,
        paidOff: false,
    });

    const DEBT_PAGE_SIZE = 10;

    const [debtVisibleCounts, setDebtVisibleCounts] = useState({
        active: DEBT_PAGE_SIZE,
        paidOff: DEBT_PAGE_SIZE,
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
                            setSearchTerm(event.target.value);
                            setDebtVisibleCounts({ active: DEBT_PAGE_SIZE, paidOff: DEBT_PAGE_SIZE });
                        }}
                    />
                    <button
                        type="button"
                        className={`debt-sort-btn${sortBy !== "dueDate" || sortDirection !== "asc" ? " debt-sort-btn-active" : ""}`}
                        aria-label="Sort options"
                        onClick={() => { triggerLightHaptic(); setShowSortSheet(true); }}
                    >
                        <SlidersHorizontal size={16} aria-hidden="true" />
                    </button>
                </div>

                {allDebts.length === 0 && (
                    <div className="empty-debt-state">
                        <CreditCard size={48} className="empty-state-icon" aria-hidden="true" />
                        <strong>No Debts Added Yet.</strong>
                        <p>Add Loans, Credit Cards, Or BNPL Balances To Start Tracking Payoff Progress.</p>
                    </div>
                )}

                {allDebts.length > 0 && (
                    <>
                        <DebtGroup
                            title="Active Debts"
                            count={filteredActiveDebts.length}
                            debts={filteredActiveDebts}
                            emptyText="No Active Debts."
                            isExpanded={expandedSections.active}
                            onToggleExpanded={() => setExpandedSections((current) => ({ ...current, active: !current.active }))}
                            visibleCount={debtVisibleCounts.active}
                            onLoadMore={() => setDebtVisibleCounts((current) => ({ ...current, active: current.active + DEBT_PAGE_SIZE }))}
                            editingDebtId={editingDebtId}
                            editBalance={editBalance}
                            editMinimumPayment={editMinimumPayment}
                            editApr={editApr}
                            editDueDate={editDueDate}
                            editIsAutopay={editIsAutopay}
                            editRecurrence={editRecurrence}
                            onEditBalanceChange={setEditBalance}
                            onEditMinimumPaymentChange={setEditMinimumPayment}
                            onEditAprChange={setEditApr}
                            onEditDueDateChange={setEditDueDate}
                            onEditIsAutopayChange={setEditIsAutopay}
                            onEditRecurrenceChange={setEditRecurrence}
                            onStartEditing={startEditing}
                            onCancelEditing={cancelEditing}
                            onSaveEditing={saveEditing}
                            onRemoveDebt={onRemoveDebt}
                        />

                        <DebtGroup
                            title="Paid Off Debts"
                            count={filteredPaidOffDebts.length}
                            debts={filteredPaidOffDebts}
                            emptyText="No Paid Off Debts."
                            isExpanded={expandedSections.paidOff}
                            onToggleExpanded={() => setExpandedSections((current) => ({ ...current, paidOff: !current.paidOff }))}
                            visibleCount={debtVisibleCounts.paidOff}
                            onLoadMore={() => setDebtVisibleCounts((current) => ({ ...current, paidOff: current.paidOff + DEBT_PAGE_SIZE }))}
                            editingDebtId={editingDebtId}
                            editBalance={editBalance}
                            editMinimumPayment={editMinimumPayment}
                            editApr={editApr}
                            editDueDate={editDueDate}
                            editIsAutopay={editIsAutopay}
                            editRecurrence={editRecurrence}
                            onEditBalanceChange={setEditBalance}
                            onEditMinimumPaymentChange={setEditMinimumPayment}
                            onEditAprChange={setEditApr}
                            onEditDueDateChange={setEditDueDate}
                            onEditIsAutopayChange={setEditIsAutopay}
                            onEditRecurrenceChange={setEditRecurrence}
                            onStartEditing={startEditing}
                            onCancelEditing={cancelEditing}
                            onSaveEditing={saveEditing}
                            onRemoveDebt={onRemoveDebt}
                        />
                    </>
                )}
            </section>

            {showSortSheet && (
                <div
                    className="settings-overlay"
                    onClick={() => setShowSortSheet(false)}
                    role="dialog"
                    aria-label="Sort debts"
                >
                    <div
                        className="settings-sheet sort-sheet"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sort-sheet-handle" aria-hidden="true" />
                        <h3 className="sort-sheet-title">Sort Debts</h3>

                        <div className="sort-sheet-options">
                            {SORT_OPTIONS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={`sort-sheet-option${sortBy === value ? " active" : ""}`}
                                    onClick={() => {
                                        triggerLightHaptic();
                                        setSortBy(value);
                                        setDebtVisibleCounts({ active: DEBT_PAGE_SIZE, paidOff: DEBT_PAGE_SIZE });
                                    }}
                                >
                                    <span>{label}</span>
                                    {sortBy === value && <Check size={16} aria-hidden="true" />}
                                </button>
                            ))}
                        </div>

                        <div className="sort-direction-group">
                            <button
                                type="button"
                                className={`sort-dir-btn${sortDirection === "asc" ? " active" : ""}`}
                                onClick={() => {
                                    triggerLightHaptic();
                                    setSortDirection("asc");
                                    setDebtVisibleCounts({ active: DEBT_PAGE_SIZE, paidOff: DEBT_PAGE_SIZE });
                                }}
                            >
                                <ArrowUp size={14} aria-hidden="true" /> Ascending
                            </button>
                            <button
                                type="button"
                                className={`sort-dir-btn${sortDirection === "desc" ? " active" : ""}`}
                                onClick={() => {
                                    triggerLightHaptic();
                                    setSortDirection("desc");
                                    setDebtVisibleCounts({ active: DEBT_PAGE_SIZE, paidOff: DEBT_PAGE_SIZE });
                                }}
                            >
                                <ArrowDown size={14} aria-hidden="true" /> Descending
                            </button>
                        </div>

                        <button
                            type="button"
                            className="primary-button sort-sheet-done"
                            onClick={() => { triggerLightHaptic(); setShowSortSheet(false); }}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {showAddDebtModal && (
                <AddDebtModal
                    debtName={debtName}
                    debtBalance={debtBalance}
                    debtMinimumPayment={debtMinimumPayment}
                    debtApr={debtApr}
                    debtDueDate={debtDueDate}
                    debtType={debtType}
                    debtRecurrence={debtRecurrence}
                    debtIsAutopay={debtIsAutopay}
                    debtRemainingPayments={debtRemainingPayments}
                    debtScheduledPaymentAmount={debtScheduledPaymentAmount}
                    debtErrors={debtErrors}
                    debtWarnings={debtWarnings}
                    onDebtNameChange={onDebtNameChange}
                    onDebtBalanceChange={onDebtBalanceChange}
                    onDebtMinimumPaymentChange={onDebtMinimumPaymentChange}
                    onDebtAprChange={onDebtAprChange}
                    onDebtDueDateChange={onDebtDueDateChange}
                    onDebtTypeChange={onDebtTypeChange}
                    onDebtRecurrenceChange={onDebtRecurrenceChange}
                    onDebtIsAutopayChange={onDebtIsAutopayChange}
                    onDebtRemainingPaymentsChange={onDebtRemainingPaymentsChange}
                    onDebtScheduledPaymentAmountChange={onDebtScheduledPaymentAmountChange}
                    onAdd={handleAddDebt}
                    onClose={() => setShowAddDebtModal(false)}
                />
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
