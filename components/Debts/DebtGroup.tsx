import type { Debt } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { triggerLightHaptic } from "@/lib/mobile/haptics";
import { DebtRow } from "./DebtRow";

type DebtWithDisplayBalance = Debt & {
    displayBalance?: number;
};

type DebtGroupProps = {
    title: string;
    count: number;
    debts: DebtWithDisplayBalance[];
    emptyText: string;

    isExpanded: boolean;
    onToggleExpanded: () => void;

    currentPage: number;
    onPageChange: (page: number) => void;

    editingDebtId: string | null;
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

const PAGE_SIZE = 10;

export function DebtGroup({
    title,
    count,
    debts,
    emptyText,
    isExpanded,
    onToggleExpanded,
    currentPage,
    onPageChange,
    editingDebtId,
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
}: DebtGroupProps) {
    const totalPages = Math.max(1, Math.ceil(debts.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const visibleDebts = debts.slice(startIndex, startIndex + PAGE_SIZE);

    return (
        <div className="debt-group collapsible-group">
            <button
                type="button"
                className="section-collapse-button"
                onClick={() => {
                    triggerLightHaptic();
                    onToggleExpanded();
                }}
            >
                <div className="section-collapse-left">
                    <h2>{title}</h2>

                    <span className="section-count-pill">{count}</span>
                </div>

                <span
                    className={
                        isExpanded
                            ? "collapse-chevron-expanded"
                            : "collapse-chevron"
                    }
                >
                    ▼
                </span>
            </button>

            {isExpanded &&
                (debts.length === 0 ? (
                    <p className="empty-state">{emptyText}</p>
                ) : (
                    <>
                        {visibleDebts.map((debt) => (
                            <DebtRow
                                key={debt.id}
                                debt={debt}
                                isEditing={editingDebtId === debt.id}
                                editBalance={editBalance}
                                editMinimumPayment={editMinimumPayment}
                                editApr={editApr}
                                editDueDate={editDueDate}
                                editIsAutopay={editIsAutopay}
                                editRecurrence={editRecurrence}
                                onEditBalanceChange={onEditBalanceChange}
                                onEditMinimumPaymentChange={onEditMinimumPaymentChange}
                                onEditAprChange={onEditAprChange}
                                onEditDueDateChange={onEditDueDateChange}
                                onEditIsAutopayChange={onEditIsAutopayChange}
                                onEditRecurrenceChange={onEditRecurrenceChange}
                                onStartEditing={onStartEditing}
                                onCancelEditing={onCancelEditing}
                                onSaveEditing={onSaveEditing}
                                onRemoveDebt={onRemoveDebt}
                            />
                        ))}

                        {debts.length > PAGE_SIZE && (
                            <div className="pagination-actions pagination-compact">
                                <button
                                    type="button"
                                    className="text-action-button"
                                    disabled={currentPage <= 1}
                                    onClick={() => {
                                        triggerLightHaptic();
                                        onPageChange(Math.max(1, currentPage - 1));
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
                                        triggerLightHaptic();
                                        onPageChange(Math.min(totalPages, currentPage + 1));
                                    }}
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </>
                ))}
        </div>
    );
}
