import { Debt } from "../storage/debtPlannerStorage";
import { calculateMonthlyInterest } from "./calculateMonthlyInterest";

type PayoffStrategy = "snowball" | "avalanche";

type ProjectDebtPayoffParams = {
    debts: Debt[];
    monthlyExtraPayment: number;
    strategy: PayoffStrategy;
    startDate: string;
};

type ProjectedDebt = {
    id: string;
    name: string;
    balance: number;
    minimumPayment: number;
    apr: number;
};

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

function normalizeBalance(balance: number) {
    return balance < 0.01 ? 0 : roundMoney(balance);
}

function formatMonthYear(date: Date) {
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function sortDebts(debts: ProjectedDebt[], strategy: PayoffStrategy) {
    return [...debts]
        .filter((debt) => debt.balance > 0)
        .sort((a, b) => {
            if (strategy === "avalanche") {
                return b.apr - a.apr;
            }

            return a.balance - b.balance;
        });
}

function cannotAmortize(
    debts: ProjectedDebt[],
    monthlyExtraPayment: number
) {
    const activeDebts = debts.filter((debt) => debt.balance > 0);

    const monthlyInterestTotal = activeDebts.reduce(
        (sum, debt) => sum + calculateMonthlyInterest(debt.balance, debt.apr),
        0
    );

    const monthlyPaymentTotal =
        activeDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0) +
        Math.max(0, monthlyExtraPayment);

    return monthlyInterestTotal >= monthlyPaymentTotal;
}

export function projectDebtPayoff({
    debts,
    monthlyExtraPayment,
    strategy,
    startDate,
}: ProjectDebtPayoffParams) {
    let projectedDebts: ProjectedDebt[] = debts
        .filter((debt) => debt.balance > 0)
        .map((debt) => ({
            id: debt.id,
            name: debt.name,
            balance: debt.balance,
            minimumPayment: debt.minimumPayment,
            apr: debt.apr,
        }));

    let months = 0;
    let totalInterestPaid = 0;

    const payoffOrder: string[] = [];
    const maxMonths = 600;

    while (
        projectedDebts.some((debt) => debt.balance > 0) &&
        months < maxMonths
    ) {
        if (cannotAmortize(projectedDebts, monthlyExtraPayment)) {
            return {
                strategy,
                monthsToDebtFree: months,
                estimatedDebtFreeDate: "Unable to estimate",
                totalInterestPaid: 0,
                payoffOrder,
            };
        }

        projectedDebts = projectedDebts.map((debt) => {
            if (debt.balance <= 0) {
                return debt;
            }

            const interest = calculateMonthlyInterest(debt.balance, debt.apr);
            totalInterestPaid = roundMoney(totalInterestPaid + interest);

            return {
                ...debt,
                balance: normalizeBalance(debt.balance + interest),
            };
        });

        projectedDebts = projectedDebts.map((debt) => {
            if (debt.balance <= 0) {
                return debt;
            }

            const payment = Math.min(debt.minimumPayment, debt.balance);
            const newBalance = normalizeBalance(debt.balance - payment);

            if (newBalance === 0 && !payoffOrder.includes(debt.name)) {
                payoffOrder.push(debt.name);
            }

            return {
                ...debt,
                balance: newBalance,
            };
        });

        let availableExtra = Math.max(0, monthlyExtraPayment);

        while (
            availableExtra > 0 &&
            projectedDebts.some((debt) => debt.balance > 0)
        ) {
            const target = sortDebts(projectedDebts, strategy)[0];

            if (!target) {
                break;
            }

            const payment = Math.min(availableExtra, target.balance);

            projectedDebts = projectedDebts.map((debt) => {
                if (debt.id !== target.id) {
                    return debt;
                }

                const newBalance = normalizeBalance(debt.balance - payment);

                if (newBalance === 0 && !payoffOrder.includes(debt.name)) {
                    payoffOrder.push(debt.name);
                }

                return {
                    ...debt,
                    balance: newBalance,
                };
            });

            availableExtra = roundMoney(availableExtra - payment);
        }

        months += 1;
    }

    const payoffDate = new Date(`${startDate}T00:00:00`);
    payoffDate.setMonth(payoffDate.getMonth() + months);

    return {
        strategy,
        monthsToDebtFree: months,
        estimatedDebtFreeDate:
            months >= maxMonths ? "Unable to estimate" : formatMonthYear(payoffDate),
        totalInterestPaid:
            months >= maxMonths ? 0 : roundMoney(totalInterestPaid),
        payoffOrder,
    };
}
