import type { Debt } from "@core/storage/debtPlannerStorage";
import { calculateCycleInterest } from "./calculateMonthlyInterest";
import { effectiveMinimumInWindow, isInstallmentNative } from "./bnplInstallment";
import type { PayCycle } from "@core/payCycle/getNextPaycheckDate";

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

/**
 * Keep an installment-native BNPL's `remainingPayments` count in sync with the balance a rollover
 * just reduced (2.7.2) — the count is derived from the current balance so "payment 2 of 4" stays
 * truthful as the plan pays down. A no-op for every other debt.
 */
function syncBnplRemaining(debt: Debt): Debt {
    if (!isInstallmentNative(debt)) return debt;
    // ⛔ S1.13.7.6 [pass-6 A2-2] — `ceil`, matching normalizeBnplInstallment: a part-installment still
    // owed is a payment the user has to make, and `round` shed it from the count.
    const remaining = Math.max(0, Math.ceil(debt.balance / (debt.scheduledPaymentAmount as number)));
    return remaining === debt.remainingPayments ? debt : { ...debt, remainingPayments: remaining };
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
    payCycle: PayCycle,
    windowStartISO?: string,
    windowEndISO?: string
): Debt {
    if (debt.balance <= 0) {
        return debt;
    }

    const minimumWasPaid =
        debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false;

    // The minimum actually due this cycle. For an installment-native BNPL, more than one installment can
    // fall inside the pay-cycle window (a biweekly plan for a monthly earner charges ~2×) — the allocator
    // already RESERVES that full in-window amount (scaleBnplMinimumsForWindow), so the balance must pay
    // down by the same or it drifts high forever (after-scan AS.2). `minimumPayment` (the per-installment)
    // stays untouched — this is only how much the balance drops. No window → 1 installment (unchanged).
    // ⛔ ONE PRODUCER (S1P3-A2). This expression used to live here and nowhere else, and
    // `buildCycleSnapshot` re-derived the cycle's paid total from the raw per-installment
    // `minimumPayment` instead — so History reported half of what the balance actually paid down.
    const effectiveMinimum = effectiveMinimumInWindow(debt, windowStartISO, windowEndISO);

    // Honor the DISPLAYED payoff. The app recommends and shows interest-free
    // balances (getDebtsWithDisplayBalances), so a debt paid down to a $0 display
    // balance reads as "paid off" to the user. Accruing one final cycle's interest
    // here would leave a few-dollar residual — the debt reappearing next cycle with
    // no paid-off celebration (the display↔rollover seam). If this cycle's payment
    // clears the pre-interest balance, the debt is done. (Making the recommendation
    // itself interest-aware is the fuller fix, deferred to v1.7.)
    const paidMinimumPreInterest = minimumWasPaid
        ? Math.min(effectiveMinimum, debt.balance)
        : 0;

    if (roundMoney(paidMinimumPreInterest + completedSnowballAmount) >= debt.balance) {
        return syncBnplRemaining({ ...debt, balance: 0 });
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
        ? Math.min(effectiveMinimum, balanceWithInterest)
        : 0;

    const totalPayment = roundMoney(minimumPaymentAmount + completedSnowballAmount);

    return syncBnplRemaining({
        ...debt,
        balance: roundMoney(Math.max(0, balanceWithInterest - totalPayment)),
    });
}
