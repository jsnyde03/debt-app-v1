import type { PayCycle } from "./getNextPaycheckDate";

// Number of pay cycles (paychecks) per year for each cadence.
//
// This exists to accrue interest per PAY CYCLE instead of per month. A rollover
// happens once per paycheck, so charging a full month's interest on every
// rollover over-accrues by the cadence factor (biweekly ~2.17x, weekly ~4.33x).
// Using balance * apr / cyclesPerYear per rollover sums, over a year of
// rollovers, to exactly balance * apr — reconciling the persisted balance with
// the payoff projection's monthly interest model.
const CYCLES_PER_YEAR: Record<PayCycle, number> = {
    weekly: 52,
    biweekly: 26,
    semimonthly: 24,
    monthly: 12,
};

export function cyclesPerYear(payCycle: PayCycle): number {
    return CYCLES_PER_YEAR[payCycle] ?? 12;
}
