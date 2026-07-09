import { rollPaydayToFuture } from "./rollPaydayToFuture";

function assertEqual(actual: string, expected: string, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${expected}, received ${actual}`);
    }
}

function runRollPaydayToFutureTests() {
    const TODAY = "2026-07-06";
    const biweekly = { payCycle: "biweekly" as const };

    // ─── already on-or-after today → unchanged ───
    assertEqual(rollPaydayToFuture("2026-08-01", biweekly, TODAY), "2026-08-01", "future payday unchanged");
    assertEqual(rollPaydayToFuture(TODAY, biweekly, TODAY), TODAY, "payday == today is kept (it IS payday → sheet should fire)");
    assertEqual(rollPaydayToFuture("", biweekly, TODAY), "", "empty stays empty");

    // ─── stale biweekly rolls forward PRESERVING the 14-day phase ───
    // 5/15 → 5/29 → 6/12 → 6/26 → 7/10 (first >= 7/06)
    assertEqual(rollPaydayToFuture("2026-05-15", biweekly, TODAY), "2026-07-10", "biweekly rolls to next real payday, phase preserved");
    // a stale payday whose phase lands exactly on today → today (sheet fires, correct)
    assertEqual(rollPaydayToFuture("2026-06-22", biweekly, TODAY), "2026-07-06", "biweekly landing on today returns today");

    // ─── weekly ───
    assertEqual(rollPaydayToFuture("2026-06-29", { payCycle: "weekly" }, TODAY), "2026-07-06", "weekly rolls to today");
    assertEqual(rollPaydayToFuture("2026-06-01", { payCycle: "weekly" }, TODAY), "2026-07-06", "weekly rolls multiple weeks (6/1→…→7/6)");

    // ─── monthly (schedule-aware: day-of-month) ───
    // day 1: 5/1 → 6/1 → 7/1 (already passed today 7/6) → 8/1
    assertEqual(
        rollPaydayToFuture("2026-05-01", { payCycle: "monthly", monthlyPayDay: 1 }, TODAY),
        "2026-08-01",
        "monthly (1st) rolls past the already-passed July payday to Aug 1"
    );
    // day 15: future this month → unchanged
    assertEqual(
        rollPaydayToFuture("2026-07-15", { payCycle: "monthly", monthlyPayDay: 15 }, TODAY),
        "2026-07-15",
        "monthly (15th) still upcoming this month is kept"
    );

    console.log("✅ rollPaydayToFuture regression tests passed.");
}

runRollPaydayToFutureTests();
