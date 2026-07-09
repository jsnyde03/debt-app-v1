import { shouldPromptPaydayCapture, isPaydayAwaitingRollover } from "./shouldPromptPaydayCapture";

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

    // ─── isPaydayAwaitingRollover: handled + payday reached, cycle not advanced ───
    // The fix for capture-without-rollover silencing: once a handled payday sits in
    // the past, nudge to roll forward (rollover then advances nextPaycheckDate).
    assert(isPaydayAwaitingRollover("2026-06-15", PAYDAY, PAYDAY), true, "handled ON payday → awaiting rollover");
    assert(isPaydayAwaitingRollover("2026-06-30", PAYDAY, PAYDAY), true, "handled, well past payday (stale) → STILL nudged to roll over");
    assert(isPaydayAwaitingRollover("2026-06-14", PAYDAY, PAYDAY), false, "before payday → not awaiting (shouldn't happen, guard)");
    assert(isPaydayAwaitingRollover("2026-06-15", PAYDAY, null), false, "unhandled payday → the sheet prompts, not the rollover nudge");
    assert(isPaydayAwaitingRollover("2026-06-15", PAYDAY, "2026-06-01"), false, "handled a DIFFERENT payday → not awaiting this one");
    assert(isPaydayAwaitingRollover("2026-06-15", "", PAYDAY), false, "no nextPaycheckDate → never awaiting");

    console.log("✅ shouldPromptPaydayCapture regression tests passed.");
}

runShouldPromptPaydayCaptureTests();
