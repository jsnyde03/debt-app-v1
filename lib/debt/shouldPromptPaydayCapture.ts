/**
 * Should the Payday Autopilot capture sheet be offered right now?
 *
 * True when real *today* has reached the upcoming payday AND this payday hasn't
 * already been handled (captured or dismissed) — so the user is prompted **once
 * per payday**, never nagged.
 *
 * - `todayISO` / `nextPaycheckDate`: "YYYY-MM-DD" (compared lexicographically —
 *   valid for zero-padded ISO dates). `todayISO` is real device today, matching
 *   how `scheduleNotifications` computes; the app's user-controlled `currentDate`
 *   is the cycle anchor, NOT the payday trigger.
 * - `lastHandledPaydayDate`: the `nextPaycheckDate` last captured/dismissed
 *   (null = never). After handling it equals `nextPaycheckDate` → no re-prompt;
 *   rollover then advances `nextPaycheckDate` to a future date → today < it →
 *   quiet until the next payday actually arrives. Self-clearing, per-cycle.
 */
export function shouldPromptPaydayCapture(
    todayISO: string,
    nextPaycheckDate: string,
    lastHandledPaydayDate: string | null
): boolean {
    if (!nextPaycheckDate) return false;
    if (todayISO < nextPaycheckDate) return false; // payday hasn't arrived yet
    if (lastHandledPaydayDate === nextPaycheckDate) return false; // already handled this payday
    return true;
}
