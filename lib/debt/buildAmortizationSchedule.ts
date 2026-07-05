import { applyDebtPaymentProjection } from "./applyDebtPaymentProjection";
import { calculateMonthlyInterest } from "./calculateMonthlyInterest";

// One month of a single debt's payoff schedule.
export type AmortizationRow = {
    month: number; // 1-based month index
    startingBalance: number;
    interest: number;
    payment: number;
    principal: number; // payment applied to balance (payment - interest, never < 0)
    endingBalance: number;
};

export type AmortizationSchedule = {
    rows: AmortizationRow[];
    totalInterest: number;
    totalPaid: number;
    monthsToPayoff: number;
    // false when the monthly payment can't cover the first month's interest
    // (negative amortization) - mirrors projectDebtPayoff's cannotAmortize.
    payoffPossible: boolean;
};

// Match projectDebtPayoff's runaway guard so the two engines agree on the
// "can never be paid off" boundary as well as on the interest total.
const MAX_MONTHS = 600;

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

// Month-by-month payoff schedule for a SINGLE debt paid at a fixed monthly
// amount. Loops the shared applyDebtPaymentProjection single-month step (no
// reinvented interest math) so this reconciles, dollar-for-dollar, with
// projectDebtPayoff's totalInterestPaid for the same debt + payment - the
// non-negotiable reconciliation the v1.5 plan requires.
export function buildAmortizationSchedule(params: {
    balance: number;
    apr: number;
    monthlyPayment: number;
}): AmortizationSchedule {
    const rows: AmortizationRow[] = [];
    let balance = roundMoney(Math.max(0, params.balance));
    const apr = params.apr;
    const monthlyPayment = Math.max(0, params.monthlyPayment);

    // Already paid off - trivial empty schedule.
    if (balance <= 0) {
        return {
            rows,
            totalInterest: 0,
            totalPaid: 0,
            monthsToPayoff: 0,
            payoffPossible: true,
        };
    }

    // Negative amortization: if the payment can't cover this month's interest
    // the balance never falls. Bail out the same way projectDebtPayoff does
    // rather than spinning to MAX_MONTHS.
    if (monthlyPayment <= calculateMonthlyInterest(balance, apr)) {
        return {
            rows,
            totalInterest: 0,
            totalPaid: 0,
            monthsToPayoff: 0,
            payoffPossible: false,
        };
    }

    let month = 0;
    let totalInterest = 0;
    let totalPaid = 0;

    while (balance > 0 && month < MAX_MONTHS) {
        const step = applyDebtPaymentProjection({
            balance,
            apr,
            payment: monthlyPayment,
        });

        month += 1;
        // step.interest / step.payment are already cent-rounded, so summing
        // then re-rounding stays exact and matches projectDebtPayoff.
        totalInterest = roundMoney(totalInterest + step.interest);
        totalPaid = roundMoney(totalPaid + step.payment);

        rows.push({
            month,
            startingBalance: step.startingBalance,
            interest: step.interest,
            payment: step.payment,
            principal: roundMoney(step.payment - step.interest),
            endingBalance: step.projectedBalance,
        });

        balance = step.projectedBalance;
    }

    const payoffPossible = balance <= 0;

    return {
        rows,
        totalInterest,
        totalPaid,
        monthsToPayoff: payoffPossible ? month : 0,
        payoffPossible,
    };
}
