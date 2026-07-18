function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

type DebtInput = {
    id: string;
    name: string;
    balance: number;
    apr: number;
};

export type ExtraPaymentAllocationItem = {
    debtId: string;
    debtName: string;
    amount: number;
    remainingBalanceAfterPayment: number;
    isPaidOff: boolean;
};

export function buildExtraPaymentAllocationPlan({
    debts,
    amount,
    strategy,
}: {
    debts: DebtInput[];
    amount: number;
    strategy: "snowball" | "avalanche";
}): ExtraPaymentAllocationItem[] {
    let remainingAmount = Math.max(0, amount);

    const orderedDebts = [...debts]
        .filter((debt) => debt.balance > 0)
        .sort((a, b) => {
            if (strategy === "avalanche") {
                if (b.apr !== a.apr) {
                    return b.apr - a.apr;
                }
                return a.balance - b.balance;
            }
            return a.balance - b.balance;
        });

    return orderedDebts
        .map((debt) => {
            if (remainingAmount <= 0) {
                return null;
            }
            const amountToApply = roundMoney(Math.min(remainingAmount, debt.balance));
            remainingAmount = roundMoney(remainingAmount - amountToApply);
            return {
                debtId: debt.id,
                debtName: debt.name,
                amount: amountToApply,
                remainingBalanceAfterPayment: roundMoney(Math.max(0, debt.balance - amountToApply)),
                isPaidOff: amountToApply >= debt.balance,
            };
        })
        .filter((item): item is ExtraPaymentAllocationItem => item !== null);
}
