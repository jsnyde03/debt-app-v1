import type { PayCycle } from "./getNextPaycheckDate";

/**
 * Average paychecks per month for a pay cycle — converts a per-paycheck extra
 * payment into a monthly-equivalent for the payoff projection (`projectDebtPayoff`).
 *
 * Uses the true annual paycheck count ÷ 12. The old inline
 * `weekly ? 4 : monthly ? 1 : 2` understated **weekly** (4 vs 4.33) and
 * **biweekly** (2 vs 2.17) by ~8% — and biweekly is the default cadence — which
 * pushed the projected debt-free date LATER than reality. (Semimonthly = 2 and
 * monthly = 1 were already correct.)
 */
export function payCyclesPerMonth(payCycle: PayCycle): number {
    switch (payCycle) {
        case "weekly":
            return 52 / 12; // 4.333…
        case "biweekly":
            return 26 / 12; // 2.166…
        case "semimonthly":
            return 2; // 24 / 12
        case "monthly":
            return 1;
    }
}
