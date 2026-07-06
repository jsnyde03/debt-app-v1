/** Whole days from `fromISO` to `toISO` ("YYYY-MM-DD"), UTC-anchored so the count
 *  is timezone-independent (no DST/local-offset off-by-one). */
function daysAfter(fromISO: string, toISO: string): number {
    const from = Date.parse(`${fromISO}T00:00:00Z`);
    const to = Date.parse(`${toISO}T00:00:00Z`);
    return Math.round((to - from) / 86_400_000);
}

/**
 * Should the Payday Autopilot capture sheet be offered right now?
 *
 * True when real *today* has reached the upcoming payday, the payday hasn't been
 * handled (captured or dismissed), AND the payday is still RECENT — so the user
 * is prompted **once per payday**, never nagged, and never hard-gated behind a
 * stale months-old payday when returning after a lapse.
 *
 * - `todayISO` / `nextPaycheckDate`: "YYYY-MM-DD". `todayISO` is real device today,
 *   matching how `scheduleNotifications` computes; the user-controlled `currentDate`
 *   is the cycle anchor, NOT the payday trigger.
 * - `lastHandledPaydayDate`: the `nextPaycheckDate` last captured/dismissed
 *   (null = never). After handling it equals `nextPaycheckDate` → no re-prompt;
 *   rollover then advances `nextPaycheckDate` to a future date → today < it →
 *   quiet until the next payday. Self-clearing, per-cycle.
 * - `maxRecencyDays`: the freshness window (≈ one pay cycle + grace). Beyond it
 *   the payday is stale — a returning user shouldn't be prompted to "confirm your
 *   plan" for a payday from months ago.
 */
export function shouldPromptPaydayCapture(
    todayISO: string,
    nextPaycheckDate: string,
    lastHandledPaydayDate: string | null,
    maxRecencyDays: number
): boolean {
    if (!nextPaycheckDate) return false;
    if (todayISO < nextPaycheckDate) return false; // payday hasn't arrived yet
    if (lastHandledPaydayDate === nextPaycheckDate) return false; // already handled this payday
    if (daysAfter(nextPaycheckDate, todayISO) > maxRecencyDays) return false; // stale — don't nag
    return true;
}
