import { formatCurrency } from "@/lib/utils/formatCurrency";
import { triggerMediumHaptic } from "@/lib/mobile/haptics";
import { SwipeActionCard } from "./SwipeActionCard";
import type {
    RequiredAllocationItem,
    RequiredActionView,
} from "@/lib/debt/deriveRequiredActionView";

type RequiredActionItemProps = {
    item: RequiredAllocationItem;
    /** Derived display state (from deriveRequiredActionView) — single source of truth. */
    view: RequiredActionView;
    onMarkExpensePaid: (id: string) => void;
    onMarkDebtMinimumPaid: (id: string) => void;
};

/**
 * The Plan tab's required-action row (bill or debt minimum) — a swipeable
 * Mark-Paid/Undo card. Extracted verbatim from ResultsSection.renderRequiredAction
 * so the required-list rendering has a component home; the derivation now comes from
 * the shared deriveRequiredActionView helper (also used by the payday view).
 */
export function RequiredActionItem({
    item,
    view,
    onMarkExpensePaid,
    onMarkDebtMinimumPaid,
}: RequiredActionItemProps) {
    const { isPaid, dueDate, overdue, isAutopay, presumedPaid } = view;
    // Autopay pays itself — once due it's presumed run. Either way the Plan tab
    // shows a status, never a Mark-Paid nag (Option A). Failure reporting lives
    // in the payday checkpoint, not here.
    const autopayHandled = isAutopay && (isPaid || presumedPaid);

    function handleToggle() {
        if (item.category === "expense" || item.category === "autopay_expense") {
            if (item.targetId) {
                onMarkExpensePaid(item.targetId);
            }
            return;
        }

        if (item.category === "minimum_debt" || item.category === "autopay_debt") {
            const debtId = item.debtId ?? item.targetId;
            if (debtId) {
                onMarkDebtMinimumPaid(debtId);
            }
        }
    }

    return (
        <SwipeActionCard
            className={[
                "saved-item",
                isPaid ? "completed-item" : "",
                overdue && !isAutopay ? "overdue-item" : "",
                isAutopay ? "autopay-item" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            leftAction={
                !isAutopay && !isPaid
                    ? { label: "Mark Paid", tone: "positive", onTrigger: handleToggle }
                    : undefined
            }
            rightAction={
                !isAutopay && isPaid
                    ? { label: "Undo", tone: "warning", onTrigger: handleToggle }
                    : undefined
            }
        >
            <div className="saved-item-left">
                <div className="saved-title">{item.label}</div>

                {overdue && !isAutopay && (
                    <div className="status-chip overdue">Overdue</div>
                )}

                <div className="saved-meta">
                    {dueDate ? `Due ${dueDate}` : "Required Payment"}
                </div>
            </div>

            <div className="saved-item-right">
                <strong className="saved-amount">{formatCurrency(item.amount)}</strong>

                {isAutopay ? (
                    <span
                        className={`autopay-status${autopayHandled ? " paid" : ""}`}
                        aria-label={
                            autopayHandled
                                ? "Paid automatically by autopay"
                                : "Scheduled to pay automatically"
                        }
                    >
                        {autopayHandled ? "Auto-paid" : "Autopay"}
                    </span>
                ) : (
                    <button
                        type="button"
                        className={isPaid ? "action-pill completed" : "action-pill"}
                        onClick={() => {
                            triggerMediumHaptic();
                            handleToggle();
                        }}
                    >
                        {isPaid ? "Undo" : "Mark Paid"}
                    </button>
                )}
            </div>
        </SwipeActionCard>
    );
}
