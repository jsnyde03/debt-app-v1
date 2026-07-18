import { getNextPaycheckDate, type PayCycleConfig } from "./getNextPaycheckDate";

/**
 * Advance a (possibly stale) payday to its next occurrence on-or-after `todayISO`,
 * preserving the schedule/phase by rolling the ACTUAL date forward one cycle at a
 * time (so a biweekly Friday stays a Friday, a monthly 1st stays the 1st).
 *
 * Used on backup import: a backup's `nextPaycheckDate` reflects when the backup was
 * made and is often in the past, which made the app think payday had "just happened"
 * and wrongly auto-opened the Payday Autopilot sheet on load. Rolling it to the next
 * real upcoming payday means the sheet fires only when today genuinely IS payday.
 *
 * Returns the input unchanged when it's empty or already on-or-after today.
 */
export function rollPaydayToFuture(
    nextPaycheckDate: string,
    config: Omit<PayCycleConfig, "currentDate">,
    todayISO: string
): string {
    if (!nextPaycheckDate || nextPaycheckDate >= todayISO) {
        return nextPaycheckDate;
    }

    let next = nextPaycheckDate;
    // Roll forward one scheduled payday at a time (getNextPaycheckDate is
    // currentDate + period for weekly/biweekly and schedule-aware for
    // semimonthly/monthly). The loop cap is a defensive guard against bad data.
    for (let i = 0; i < 500 && next < todayISO; i++) {
        next = getNextPaycheckDate({ ...config, currentDate: next });
    }

    return next;
}
