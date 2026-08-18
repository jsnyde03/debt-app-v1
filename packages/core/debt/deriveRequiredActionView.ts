import type { Debt, RequiredExpense } from "@core/storage/debtPlannerStorage";
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
    /** 3.8 — the share of this obligation already covered by the expense reserve. `amount` is what THIS
     *  PAYCHECK contributes; the biller is owed `amount + reserveCovered`. Absent on every non-expense row
     *  and every pre-3.8 path. */
    reserveCovered?: number;
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
    /**
     * 3.7.A4 — when this row's amount is MORE than one BNPL installment, what it is actually made of.
     *
     * §2.7.4 scales an installment-native BNPL's minimum to the number of installments falling inside
     * the pay window, so a biweekly Klarna plan under a monthly paycheck shows $200 on a row the user
     * knows as a $100 payment. The figure is right and the row said nothing about why — measured at 2×
     * on a monthly cycle, 3× when the window catches a third charge. `undefined` for everything else,
     * including a final installment capped by the remaining balance (there is no clean "N × $X" to
     * state, and inventing one would be the inverse error).
     */
    installments?: { count: number; each: number };
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

    // 3.7.A4 — `debts` here is the UNSCALED store list, while `item.amount` came off the window-scaled
    // allocation, so the ratio between them IS the in-window installment count. Only stated when it
    // divides exactly: a balance-capped final installment has no honest "N × $X" form.
    const scheduled = debt?.scheduledPaymentAmount;
    let installments: { count: number; each: number } | undefined;
    if (typeof scheduled === "number" && scheduled > 0 && item.amount > scheduled) {
        const count = Math.round(item.amount / scheduled);
        if (count >= 2 && Math.abs(count * scheduled - item.amount) < 0.005) {
            installments = { count, each: scheduled };
        }
    }

    return { expense, debt, isPaid, dueDate, overdue, isAutopay, presumedPaid, autopayFailed, installments };
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
