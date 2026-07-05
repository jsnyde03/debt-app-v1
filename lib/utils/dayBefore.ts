/**
 * Returns the ISO date (YYYY-MM-DD) one day before `isoDate`.
 *
 * A pay cycle runs [payday, next payday), so it ends the day BEFORE the next
 * payday. `cycleEnd` / `cycleEndDate` are stored as the next payday — an exclusive
 * upper bound kept contiguous with the following cycle's start — so this converts
 * that boundary into the cycle's actual last day for display. Native Date math
 * handles month/year rollover (e.g. 2026-08-01 → 2026-07-31, 2026-01-01 → 2025-12-31).
 */
export function dayBefore(isoDate: string): string {
    const d = new Date(`${isoDate}T00:00:00`);
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
