import { shouldPromptPaydayCapture } from "./shouldPromptPaydayCapture";

function assert(actual: boolean, expected: boolean, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${expected}, received ${actual}`);
    }
}

function runShouldPromptPaydayCaptureTests() {
    const PAYDAY = "2026-06-15";
    const WINDOW = 21; // e.g. a biweekly cycle + a week of grace

    // ─── payday not here yet → no prompt ───
    assert(shouldPromptPaydayCapture("2026-06-14", PAYDAY, null, WINDOW), false, "day before payday → no prompt");
    assert(shouldPromptPaydayCapture("2026-06-01", PAYDAY, null, WINDOW), false, "well before payday → no prompt");

    // ─── payday reached & RECENT, unhandled → prompt ───
    assert(shouldPromptPaydayCapture("2026-06-15", PAYDAY, null, WINDOW), true, "ON payday → prompt");
    assert(shouldPromptPaydayCapture("2026-06-16", PAYDAY, null, WINDOW), true, "day after payday → prompt");
    assert(shouldPromptPaydayCapture("2026-06-25", PAYDAY, null, WINDOW), true, "10 days after (within window) → prompt");
    assert(shouldPromptPaydayCapture("2026-07-06", PAYDAY, null, WINDOW), true, "exactly at the window edge (21d) → prompt");

    // ─── STALE payday (beyond the recency window) → no prompt (the new behavior) ───
    assert(shouldPromptPaydayCapture("2026-07-07", PAYDAY, null, WINDOW), false, "22 days after (just past window) → no prompt");
    assert(shouldPromptPaydayCapture("2026-08-01", PAYDAY, null, WINDOW), false, "47 days after (ancient payday) → no nag");

    // ─── already handled THIS payday → no prompt ───
    assert(shouldPromptPaydayCapture("2026-06-15", PAYDAY, PAYDAY, WINDOW), false, "handled this payday → no re-prompt");
    assert(shouldPromptPaydayCapture("2026-06-20", PAYDAY, PAYDAY, WINDOW), false, "handled this payday, days later → still quiet");

    // ─── handled a PRIOR payday, new recent payday reached → prompt again ───
    assert(shouldPromptPaydayCapture("2026-06-15", PAYDAY, "2026-06-01", WINDOW), true, "prior payday handled, new one arrives → prompt");

    // ─── guards ───
    assert(shouldPromptPaydayCapture("2026-06-15", "", null, WINDOW), false, "no nextPaycheckDate → never prompt");

    console.log("✅ shouldPromptPaydayCapture regression tests passed.");
}

runShouldPromptPaydayCaptureTests();
