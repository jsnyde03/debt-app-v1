import { InAppReview } from "@capacitor-community/in-app-review";

const ROLLOVER_COUNT_KEY = "debtPlanner.rolloverCount";
const REVIEW_REQUESTED_KEY = "debtPlanner.reviewRequested";
const REVIEW_AFTER_ROLLOVERS = 3;

export function incrementRolloverCount(): number {
    const current = Number(localStorage.getItem(ROLLOVER_COUNT_KEY) ?? 0);
    const next = current + 1;
    localStorage.setItem(ROLLOVER_COUNT_KEY, String(next));
    return next;
}

export async function maybeRequestAppReview() {
    if (localStorage.getItem(REVIEW_REQUESTED_KEY) === "true") return;

    const count = Number(localStorage.getItem(ROLLOVER_COUNT_KEY) ?? 0);
    if (count < REVIEW_AFTER_ROLLOVERS) return;

    try {
        await InAppReview.requestReview();
        localStorage.setItem(REVIEW_REQUESTED_KEY, "true");
    } catch {
        // Platform may not support in-app review; fail silently.
    }
}
