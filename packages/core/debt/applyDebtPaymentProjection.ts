import { calculateMonthlyInterest } from "./calculateMonthlyInterest";

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

export function applyDebtPaymentProjection(params: {balance: number; apr: number; payment: number;}) {
   const startingBalance = roundMoney(Math.max(0, params.balance));
   const interest = calculateMonthlyInterest(startingBalance, params.apr);
   const balanceAfterInterest = roundMoney(startingBalance + interest);
   const payment = roundMoney(Math.min(Math.max(0, params.payment), balanceAfterInterest));
   const projectedBalance = roundMoney(Math.max(0, balanceAfterInterest - payment));

    return {
        startingBalance,
        interest,
        balanceAfterInterest,
        payment,
        projectedBalance,
    }
}