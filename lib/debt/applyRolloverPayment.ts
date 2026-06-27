import type { Debt } from "../storage/debtPlannerStorage";
import { calculateMonthlyInterest } from "./calculateMonthlyInterest";

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

/**
 * Pure balance math for a single debt rolling into the next pay cycle:
 * accrue interest, then deduct whatever minimum/snowball payment was
 * actually completed this cycle. Extracted from app/page.tsx's
 * handleRolloverPayCycle so this real-money calculation has a test
 * surface independent of React state/effects.
 */
export function applyRolloverPayment(
    debt: Debt,
    completedSnowballAmount: number
): Debt {
    if (debt.balance <= 0) {
        return debt;
    }

    const minimumWasPaid =
        debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false;

    // BNPL is fixed-installment, interest-free by definition - never accrue
    // interest on it even if a nonzero APR was entered/defaulted.
    const interest = calculateMonthlyInterest(
        debt.balance,
        debt.type === "bnpl" ? 0 : debt.apr
    );

    const balanceWithInterest = roundMoney(debt.balance + interest);

    const minimumPaymentAmount = minimumWasPaid
        ? Math.min(debt.minimumPayment, balanceWithInterest)
        : 0;

    const totalPayment = roundMoney(minimumPaymentAmount + completedSnowballAmount);

    return {
        ...debt,
        balance: roundMoney(Math.max(0, balanceWithInterest - totalPayment)),
    };
}
