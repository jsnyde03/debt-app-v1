import type { Debt, RequiredExpense } from "../storage/debtPlannerStorage";
import { isAutopayPresumedPaid } from "./reconcileAutopay";

/**
 * The minimal shape shared by an allocation's required item AND the
 * `completedRequiredActions` rows ResultsSection builds — enough to resolve the
 * item to its underlying expense/debt and paid state.
 */
export type RequiredAllocationItem = {
    category: string; // expense | minimum_debt | autopay_expense | autopay_debt
    targetId?: string;
    debtId?: string;
    label: string;
    amount: number;
};

export type RequiredActionView = {
    expense?: RequiredExpense;
    debt?: Debt;
    isPaid: boolean;
    dueDate?: string;
    overdue: boolean;
    isAutopay: boolean;
    /** Autopay whose due date has passed (and not user-flagged failed) — presumed
     *  to have run. Drives the "Auto-paid" vs "Autopay" (upcoming) status. */
    presumedPaid: boolean;
    /** Autopay the user reported FAILED at the payday check-in. It stops presenting
     *  as autopay and behaves like a manual owed bill (Overdue + Mark-Paid) until
     *  resolved — but keeps `isAutopay`, so autopay resumes next cycle once paid. */
    autopayFailed: boolean;
};

export function isOverdue(dueDate: string, currentDate: string): boolean {
    return new Date(`${dueDate}T00:00:00`) < new Date(`${currentDate}T00:00:00`);
}

/**
 * Single source of truth for a required item's display state (paid / overdue /
 * autopay + its underlying expense or debt). Extracted from the three copies that
 * had drifted inside ResultsSection (`unpaidRequiredActions`, `hasOverdueItems`,
 * `renderRequiredAction`) and reused by the payday reconciliation view so the Plan
 * tab and the payday sheet can never disagree about whether a bill is paid.
 */
export function deriveRequiredActionView(
    item: RequiredAllocationItem,
    requiredExpenses: RequiredExpense[],
    debts: Debt[],
    currentDate: string
): RequiredActionView {
    const isExpenseItem =
        item.category === "expense" || item.category === "autopay_expense";
    const isDebtItem =
        item.category === "minimum_debt" || item.category === "autopay_debt";

    const expense = isExpenseItem
        ? requiredExpenses.find((e) => e.id === item.targetId)
        : undefined;

    const debt = isDebtItem
        ? debts.find((d) => d.id === (item.debtId ?? item.targetId))
        : undefined;

    const isPaid = isExpenseItem
        ? expense?.isPaidThisCycle ?? false
        : debt?.minimumPaidThisCycle ?? debt?.isPaidThisCycle ?? false;

    const dueDate = expense?.dueDate ?? debt?.dueDate;

    const isAutopay =
        item.category === "autopay_expense" || item.category === "autopay_debt";

    const source = expense ?? debt;
    const presumedPaid =
        isAutopay &&
        !!dueDate &&
        isAutopayPresumedPaid(
            {
                isAutopay: true,
                dueDate,
                autopayFailedThisCycle: source?.autopayFailedThisCycle,
            },
            currentDate
        );

    // A presumed-paid autopay is handled — it must NEVER read as overdue (the row
    // chip, hasOverdueItems, OR the hero "overdue payments requiring attention"
    // banner). A user-flagged FAILED autopay (presumedPaid false) DOES stay
    // overdue, correctly demanding action.
    const overdue =
        !!dueDate && !isPaid && !presumedPaid && isOverdue(dueDate, currentDate);

    // A reported-failed autopay: the user said it didn't run. It presents as a
    // manual owed bill (the render layer drops the autopay treatment), while
    // `isAutopay` stays true so the bill returns to autopay next cycle once paid.
    const autopayFailed = isAutopay && source?.autopayFailedThisCycle === true;

    return { expense, debt, isPaid, dueDate, overdue, isAutopay, presumedPaid, autopayFailed };
}

/**
 * A clean display label. Autopay allocation items come through as "Reserve autopay
 * for X" / "Reserve autopay minimum for X" — but the ⚡ Autopay chip already says
 * autopay, so show just the bill name (or "{name} minimum" for a debt). Non-autopay
 * items keep their allocation label ("Pay X" / "Pay minimum on X").
 */
export function requiredDisplayLabel(
    item: RequiredAllocationItem,
    view: RequiredActionView
): string {
    if (view.isAutopay) {
        const name = view.expense?.name ?? view.debt?.name;
        if (name) return view.debt ? `${name} minimum` : name;
    }
    return item.label;
}
