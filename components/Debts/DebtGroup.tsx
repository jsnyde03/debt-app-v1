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

    visibleCount: number;
    onLoadMore: () => void;

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

export function DebtGroup({
    title,
    count,
    debts,
    emptyText,
    isExpanded,
    onToggleExpanded,
    visibleCount,
    onLoadMore,
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
    const visibleDebts = debts.slice(0, visibleCount);

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

                        {debts.length > visibleCount && (
                            <div className="load-more-actions">
                                <button
                                    type="button"
                                    className="load-more-button"
                                    onClick={() => {
                                        triggerLightHaptic();
                                        onLoadMore();
                                    }}
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </>
                ))}
        </div>
    );
}
