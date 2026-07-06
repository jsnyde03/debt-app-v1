import { useState } from "react";
import { readKeyValue, writeKey } from "@/lib/storage/safeStorage";
import { shouldPromptPaydayCapture } from "@/lib/debt/shouldPromptPaydayCapture";
import type { PayCycle } from "@/lib/payCycle/getNextPaycheckDate";

const HANDLED_KEY = "debtPlanner.lastHandledPaydayDate";

const CYCLE_DAYS: Record<PayCycle, number> = {
    weekly: 7,
    biweekly: 14,
    semimonthly: 15,
    monthly: 31,
};

// The capture prompt's freshness window: one pay cycle + a week of grace. Beyond
// it a full cycle has elapsed, so the payday is stale and we don't nag.
function recencyWindowDays(payCycle: PayCycle): number {
    return (CYCLE_DAYS[payCycle] ?? 31) + 7;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

type UsePaydayCaptureParams = {
    /** The upcoming payday (derived from currentDate + payCycle in page.tsx). */
    nextPaycheckDate: string;
    /** The pay cycle — sets how long after payday the prompt stays fresh. */
    payCycle: PayCycle;
    /** Whether there's a plan worth capturing this cycle (>=1 recommended action). */
    hasCapturablePlan: boolean;
};

/**
 * Payday Autopilot orchestration state (the "narrow hook, not page.tsx" home).
 * Owns payday DETECTION (real today vs. nextPaycheckDate), the per-cycle handled
 * flag (persisted, self-clearing on rollover), and the capture sheet's open state.
 * The actual capture WRITE stays page.tsx's existing mark/rollover primitives —
 * the sheet (step 1.6.3) calls them and then `completeCapture()`.
 *
 * `isOpen` is fully DERIVED (no effect / no setState-in-effect): the sheet
 * auto-opens when payday is pending unless the user closed it for this payday.
 * Closing is session-only (resets on next app open → re-offers until handled);
 * dismiss/capture persist `handled` so it stays quiet across sessions.
 */
export function usePaydayCapture({ nextPaycheckDate, payCycle, hasCapturablePlan }: UsePaydayCaptureParams) {
    const [lastHandled, setLastHandled] = useState<string | null>(() =>
        readKeyValue<string | null>(HANDLED_KEY, null)
    );
    // The payday the user closed the sheet for this session (no re-pop until remount).
    const [closedForPayday, setClosedForPayday] = useState<string | null>(null);
    const [manualOpen, setManualOpen] = useState(false);

    // Payday reached, plan present, not yet handled → offer the sheet.
    const isPaydayPending =
        hasCapturablePlan &&
        shouldPromptPaydayCapture(todayISO(), nextPaycheckDate, lastHandled, recencyWindowDays(payCycle));

    const autoOpen = isPaydayPending && closedForPayday !== nextPaycheckDate;
    const isOpen = manualOpen || autoOpen;

    function markHandled() {
        writeKey(HANDLED_KEY, nextPaycheckDate);
        setLastHandled(nextPaycheckDate);
    }

    function closeForThisPayday() {
        setManualOpen(false);
        setClosedForPayday(nextPaycheckDate);
    }

    return {
        /** Whether the capture sheet should render. */
        isOpen,
        /** Payday detected & unhandled — for a subtle "review your payday" affordance. */
        isPaydayPending,
        /** Manually open the sheet (e.g. from that affordance). */
        open: () => setManualOpen(true),
        /** Close without marking handled — re-offers on the next app open. */
        close: closeForThisPayday,
        /** Dismiss for this payday: mark handled (no re-prompt across sessions) + close. */
        dismiss: () => {
            markHandled();
            closeForThisPayday();
        },
        /** Mark handled after a successful capture, then close. */
        completeCapture: () => {
            markHandled();
            closeForThisPayday();
        },
    };
}
