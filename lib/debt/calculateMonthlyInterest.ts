export function calculateMonthlyInterest(balance: number, apr: number) {
    if (balance <= 0 || apr <= 0) {
        return 0;
    }

    const monthlyRate = apr / 100 / 12;

    return roundMoney(balance * monthlyRate);
}

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}