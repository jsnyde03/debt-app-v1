import { toLocalISODate } from "@core/utils/localDate";

/**
 * iOS-Simulator smoke-test seed (Option A: a guarded debug seed).
 *
 * A deliberately STRESS-shaped fixture — many required rows with LONG, wrapping
 * bill names + a mix of manual and autopay, and a payday 2 days ago so Payday
 * Autopilot's sheet auto-opens. This reproduces the exact "many wrapping labels"
 * condition that broke the reconcile layout on real WKWebView (the browser harness
 * can't render that). Applied ONLY in a build made with `NEXT_PUBLIC_SIM_SMOKE=1`
 * (see the guarded effect in app/page.tsx) — inert in every production build.
 *
 * Dates are relative to now (like the demo seed), so the payday sheet reliably
 * detects a recent payday whenever the smoke test runs.
 */
/**
 * Freeze "now" to a fixed instant so the smoke test's rendered dates (due dates,
 * debt-free date, "saved at" time) are BYTE-IDENTICAL across calendar days —
 * otherwise the relative seed dates below shift daily and the golden-image gate
 * flakes. Only argless `new Date()` / `Date.now()` (i.e. "now") are frozen; explicit
 * `new Date(x)` still parses normally. Call BEFORE seeding. SIM_SMOKE builds only.
 */
export function freezeClockForSimSmoke() {
    const FIXED = Date.UTC(2026, 6, 15, 16, 41, 0); // 2026-07-15, 9:41
    const RealDate = Date;
    // A real `class extends Date` (not a hand-rolled function) — the spec-correct,
    // engine-safe way to subclass a built-in, so it behaves identically on WebKit's
    // JavaScriptCore (iOS) as in V8. Argless `new Date()` → FIXED; `Date.now()` →
    // FIXED; all other forms and statics forward to the real Date.
    class FrozenDate extends RealDate {
        constructor(...args: unknown[]) {
            if (args.length === 0) {
                super(FIXED);
            } else {
                super(...(args as [number])); // forward any Date(...) form unchanged
            }
        }
        static now() {
            return FIXED;
        }
    }
    globalThis.Date = FrozenDate as DateConstructor;
}

function iso(daysFromNow: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return toLocalISODate(d);
}

/** Bare-key state (gets the `debtPlanner.` prefix + JSON.stringify on apply), the
 *  same shape the Playwright seed helper uses. */
export function buildSimSmokeState(): Record<string, unknown> {
    return {
        amount: "4200",
        hasCompletedOnboarding: true,
        hasConfiguredPaycheck: true,
        payCycle: "biweekly",
        currentDate: iso(-16),
        nextPaycheckDate: iso(-2),
        // All due dates land WITHIN the cycle window [currentDate iso(-16),
        // nextPaycheckDate iso(-2)] so every bill allocates to THIS paycheck and
        // appears in the reconcile view (a due date after nextPaycheckDate would
        // fall into the next cycle and be excluded).
        requiredExpenses: [
            { id: "wildwood", name: "Wildwood", amount: 35, dueDate: iso(-3), recurrence: "monthly", isPaidThisCycle: false },
        ],
        livingExpenses: [],
        debts: [
            { id: "paypal", name: "PayPal Credit", balance: 900, minimumPayment: 30, dueDate: iso(-4), apr: 26.99, type: "debt", recurrence: "monthly", isAutopay: true },
            { id: "klarna1", name: "Klarna - Apple Watch", balance: 800, minimumPayment: 33.61, dueDate: iso(-12), apr: 0, type: "debt", recurrence: "monthly" },
            { id: "klarna2", name: "Klarna - Mark - Apple Watch", balance: 760, minimumPayment: 31.7, dueDate: iso(-12), apr: 0, type: "debt", recurrence: "monthly" },
            { id: "merrick", name: "Merrick Bank", balance: 1200, minimumPayment: 58, dueDate: iso(-9), apr: 27.9, type: "debt", recurrence: "monthly", isAutopay: true },
            { id: "applecard", name: "Apple Card", balance: 2400, minimumPayment: 62, dueDate: iso(-5), apr: 24.9, type: "debt", recurrence: "monthly" },
            { id: "amazon", name: "Amazon Credit Card", balance: 900, minimumPayment: 29, dueDate: iso(-6), apr: 27.9, type: "debt", recurrence: "monthly" },
            { id: "sams", name: "Sam's Club Credit Card", balance: 900, minimumPayment: 29, dueDate: iso(-7), apr: 27.9, type: "debt", recurrence: "monthly" },
            { id: "sleep", name: "Sleep Number", balance: 2000, minimumPayment: 80, dueDate: iso(-8), apr: 0, type: "debt", recurrence: "monthly" },
        ],
        goals: [],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
    };
}

/** Clear storage and write the stress fixture (bare keys → `debtPlanner.<key>`). */
export function applySimSmokeSeedToStorage(storage: Storage) {
    const state = buildSimSmokeState();
    storage.clear();
    for (const [key, value] of Object.entries(state)) {
        storage.setItem(`debtPlanner.${key}`, JSON.stringify(value));
    }
}
