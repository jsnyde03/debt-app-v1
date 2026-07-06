import { shouldPromptPaydayCapture } from "./shouldPromptPaydayCapture";

function assert(actual: boolean, expected: boolean, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${expected}, received ${actual}`);
    }
}

function runShouldPromptPaydayCaptureTests() {
    const PAYDAY = "2026-06-15";

    // ─── payday not here yet → no prompt ───
    assert(shouldPromptPaydayCapture("2026-06-14", PAYDAY, null), false, "day before payday → no prompt");
    assert(shouldPromptPaydayCapture("2026-06-01", PAYDAY, null), false, "well before payday → no prompt");

    // ─── payday reached, unhandled → prompt ───
    assert(shouldPromptPaydayCapture("2026-06-15", PAYDAY, null), true, "ON payday → prompt");
    assert(shouldPromptPaydayCapture("2026-06-16", PAYDAY, null), true, "day after payday → prompt (missed the day)");
    assert(shouldPromptPaydayCapture("2026-07-01", PAYDAY, null), true, "long after payday → still prompt (unhandled)");

    // ─── already handled THIS payday → no prompt ───
    assert(shouldPromptPaydayCapture("2026-06-15", PAYDAY, PAYDAY), false, "handled this payday → no re-prompt");
    assert(shouldPromptPaydayCapture("2026-06-20", PAYDAY, PAYDAY), false, "handled this payday, days later → still quiet");

    // ─── handled a PRIOR payday, new payday reached → prompt again ───
    assert(shouldPromptPaydayCapture("2026-06-15", PAYDAY, "2026-06-01"), true, "prior payday handled, new one arrives → prompt");

    // ─── guards ───
    assert(shouldPromptPaydayCapture("2026-06-15", "", null), false, "no nextPaycheckDate → never prompt");

    console.log("✅ shouldPromptPaydayCapture regression tests passed.");
}

runShouldPromptPaydayCaptureTests();
