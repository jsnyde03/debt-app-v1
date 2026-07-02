import { cyclesPerYear } from "../payCycle/cyclesPerYear";
import type { PayCycle } from "../payCycle/getNextPaycheckDate";

export function calculateMonthlyInterest(balance: number, apr: number) {
    if (balance <= 0 || apr <= 0) {
        return 0;
    }

    const monthlyRate = apr / 100 / 12;

    return roundMoney(balance * monthlyRate);
}

// Interest accrued over ONE pay cycle at the given cadence. Unlike
// calculateMonthlyInterest (correct for the month-stepped projection/display),
// this is what the persisted balance should accrue on each rollover — a rollover
// is one paycheck, not one month. See cyclesPerYear for the reconciliation.
export function calculateCycleInterest(
    balance: number,
    apr: number,
    payCycle: PayCycle
) {
    if (balance <= 0 || apr <= 0) {
        return 0;
    }

    const perCycleRate = apr / 100 / cyclesPerYear(payCycle);

    return roundMoney(balance * perCycleRate);
}

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}