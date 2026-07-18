export function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

export function clampMoney(amount: number) {
    return roundMoney(Math.max(0, amount));
}