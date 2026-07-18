import type { Debt } from "@/lib/storage/debtPlannerStorage";
import { calculateCycleInterest } from "./calculateMonthlyInterest";
import type { PayCycle } from "@core/payCycle/getNextPaycheckDate";

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

/**
 * Pure balance math for a single debt rolling into the next pay cycle:
 * accrue ONE pay cycle's interest (not a full month — a rollover is one
 * paycheck), then deduct whatever minimum/snowball payment was actually
 * completed this cycle. Extracted from app/page.tsx's handleRolloverPayCycle
 * so this real-money calculation has a test surface independent of React
 * state/effects.
 */
export function applyRolloverPayment(
    debt: Debt,
    completedSnowballAmount: number,
    payCycle: PayCycle
): Debt {
    if (debt.balance <= 0) {
        return debt;
    }

    const minimumWasPaid =
        debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false;

    // Honor the DISPLAYED payoff. The app recommends and shows interest-free
    // balances (getDebtsWithDisplayBalances), so a debt paid down to a $0 display
    // balance reads as "paid off" to the user. Accruing one final cycle's interest
    // here would leave a few-dollar residual — the debt reappearing next cycle with
    // no paid-off celebration (the display↔rollover seam). If this cycle's payment
    // clears the pre-interest balance, the debt is done. (Making the recommendation
    // itself interest-aware is the fuller fix, deferred to v1.7.)
    const paidMinimumPreInterest = minimumWasPaid
        ? Math.min(debt.minimumPayment, debt.balance)
        : 0;

    if (roundMoney(paidMinimumPreInterest + completedSnowballAmount) >= debt.balance) {
        return { ...debt, balance: 0 };
    }

    // BNPL is fixed-installment, interest-free by definition - never accrue
    // interest on it even if a nonzero APR was entered/defaulted. Accrue per
    // pay cycle so biweekly/weekly users don't over-pay a full month each roll.
    const interest = calculateCycleInterest(
        debt.balance,
        debt.type === "bnpl" ? 0 : debt.apr,
        payCycle
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
