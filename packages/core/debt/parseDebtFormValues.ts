export interface ParsedDebtFormValues {
    balance: number;
    minimumPayment: number;
    apr: number;
}

// Parse a single money/number field from raw user input. Tolerates comma
// grouping ("12,000") and surrounding whitespace, and returns null for any
// value that is not a finite, non-negative number ("", ".", "abc", "-5").
//
// This is the guard the debt-edit save path was missing: Number("12,000") is
// NaN, and every comparison against NaN (e.g. `balance < 0`) is false, so an
// unguarded `if (balance < 0) return` lets NaN through — poisoning every total
// with "$NaN", dropping the debt out of both the active and paid-off lists
// (so it becomes invisible AND unremovable), and persisting as null on reload.
function parseNonNegativeNumber(raw: string): number | null {
    const cleaned = String(raw).replace(/,/g, "").trim();
    // Number("") is 0 (not NaN) — reject empty/whitespace explicitly so an
    // accidentally-cleared field is not silently saved as 0.
    if (cleaned === "") {
        return null;
    }
    const value = Number(cleaned);
    return Number.isFinite(value) && value >= 0 ? value : null;
}

// Parse the editable numeric fields of a debt. Returns null if ANY field is
// invalid, so the caller can reject the save wholesale rather than persist a
// partially-broken debt. APR defaults to 0 when left blank.
export function parseDebtFormValues(input: {
    balance: string;
    minimumPayment: string;
    apr: string;
}): ParsedDebtFormValues | null {
    const balance = parseNonNegativeNumber(input.balance);
    const minimumPayment = parseNonNegativeNumber(input.minimumPayment);
    const apr = parseNonNegativeNumber(input.apr.trim() === "" ? "0" : input.apr);

    if (balance === null || minimumPayment === null || apr === null) {
        return null;
    }

    // Parity with the ADD path (useDebts): balance & minimum must be > 0, the minimum
    // can't exceed the balance, and APR is capped at 100 — so an EDIT can't silently
    // sneak a fat-fingered 250% APR or a min>balance past the guards the add form
    // enforces, poisoning the interest / debt-free-date math (audit #12).
    if (balance <= 0 || minimumPayment <= 0 || minimumPayment > balance || apr > 100) {
        return null;
    }

    return { balance, minimumPayment, apr };
}
