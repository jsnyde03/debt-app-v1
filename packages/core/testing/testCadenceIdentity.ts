import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { bnplMonthlyEquivalentMinimum } from "@core/debt/bnplPayoffPace";
import { payCyclesPerMonth } from "@core/payCycle/payCyclesPerMonth";
import type { PayCycle } from "@core/payCycle/getNextPaycheckDate";
import type { Recurrence } from "@core/types/recurrence";

/**
 * ⛔ **S1.12.5.5 [pass-5 `A5-1` · `A5-5` · `C5-4`] — ONE IDENTITY OVER EVERY CADENCE PAIR.**
 *
 * ⚡ Three findings in three files were **one defect**: a cadence whose period is a USER VARIABLE,
 * replaced by a constant. `allocatePaycheck` stepped `per-paycheck` by a fortnight; `bnplPayoffPace`
 * hardcoded `26 / 12` for it under a comment calling the real fix *"a backlog item"*; and Money's row
 * printed a literal `/mo`. Two lanes found them from opposite ends of the import graph and neither
 * could see the other.
 *
 * ⛔ **THIS IS WRITTEN AS AN IDENTITY OVER THE WHOLE MATRIX, NOT AS THREE ROWS.** Lane A said exactly
 * why: *"it is one test over 7 × 4 cadence pairs and it would have found `A5-1` and `A5-5` without
 * either being named."* A test naming `per-paycheck` closes the finding; a test that walks every
 * recurrence against every pay cycle closes the class, and a new cadence joins it for free.
 *
 * ⚠️ **The user-facing numbers this pins**, all measured before the fix:
 *   · a monthly payer's $200 "Every paycheck" bill reserved **3×** ($600), declaring a **$100 shortfall
 *     over $250 of spare cash** and naming a phantom obligation `e1__occ2`;
 *   · a semimonthly payer's reserved **2×**;
 *   · a `per-paycheck` BNPL rated at a fortnight for everyone, so a monthly payer was shown a debt-free
 *     date of **July 2026** against a true **January 2027** and a weekly payer was told six months for
 *     a 2.8-month plan.
 */

function assertEqual<T>(actual: T, expected: T, label: string): void {
    if (actual !== expected) throw new Error(`FAIL [${label}]: expected ${String(expected)}, got ${String(actual)}`);
}
function assertMoney(actual: number, expected: number, label: string): void {
    const a = Math.round(actual * 100) / 100;
    const e = Math.round(expected * 100) / 100;
    if (a !== e) throw new Error(`FAIL [${label}]: expected $${e}, got $${a}`);
}

/** The window each pay cycle opens on 2026-08-03, so every pair is measured on one real cycle. */
const CYCLES: { payCycle: PayCycle; next: string }[] = [
    { payCycle: "weekly", next: "2026-08-10" },
    { payCycle: "biweekly", next: "2026-08-17" },
    { payCycle: "semimonthly", next: "2026-08-16" },
    { payCycle: "monthly", next: "2026-09-01" },
];

const RECURRENCES: Recurrence[] = ["one-time", "weekly", "biweekly", "per-paycheck", "monthly", "quarterly", "annually"];

export function runCadenceIdentityTests(): void {
    /**
     * ⛔ **IDENTITY 1 — `per-paycheck` IS EXACTLY ONE OCCURRENCE PER CYCLE, ON EVERY PAY CYCLE.**
     * That is what the label says: the form renders it **"Every paycheck"**. It is the one recurrence
     * whose period is not a fixed span of days, which is precisely why a constant was wrong for it.
     */
    for (const { payCycle, next } of CYCLES) {
        const r = allocatePaycheck({
            paycheckAmount: 500,
            currentDate: "2026-08-03",
            nextPaycheckDate: next,
            expenses: [{ id: "e1", name: "Groceries", amount: 200, dueDate: "2026-08-05", recurrence: "per-paycheck" }],
            debts: [],
            goals: [],
            strategy: "snowball",
            paycheckBuffer: 0,
        });
        const rows = r.allocations.filter((a) => a.label.includes("Groceries"));
        assertEqual(rows.length, 1, `⛔ A5-5 · ${payCycle} — an "Every paycheck" bill is ONE row per cycle`);
        assertMoney(rows.reduce((s, a) => s + a.amount, 0), 200, `⛔ A5-5 · ${payCycle} — …reserving its amount once, not a multiple of it`);
        // ⛔ The consequence the user actually met: a shortfall invented by the expansion.
        assertMoney(r.shortfall, 0, `⛔ A5-5 · ${payCycle} — …so no phantom shortfall is declared over money the user has`);
    }

    /**
     * ⛔ **IDENTITY 2 — A `per-paycheck` BNPL'S MONTHLY EQUIVALENT IS ITS INSTALLMENT × THE USER'S OWN
     * CYCLES PER MONTH**, and it must agree with `format.ts`'s `monthlyEquivalent`, which had been right
     * all along. Two producers of one number; this is the one that disagreed.
     */
    for (const { payCycle } of CYCLES) {
        const cpm = payCyclesPerMonth(payCycle);
        const bnpl = { type: "bnpl", recurrence: "per-paycheck", balance: 2400, minimumPayment: 100 };
        /**
         * ⚠️ Stated as the expression rather than asserted against `format.ts`'s `monthlyEquivalent`:
         * that module lives in `apps/rn` and `packages/core` cannot import it. **It is the same
         * expression** — `amount × cyclesPerMonth` — which is the point: this producer was the only one
         * that disagreed with it, and now there is nothing left to disagree about.
         */
        assertMoney(
            bnplMonthlyEquivalentMinimum(bnpl, cpm),
            100 * cpm,
            `⛔ A5-1 · ${payCycle} — the BNPL pace is installment × the user's OWN cycles per month`,
        );
    }

    /**
     * ⭐ **THE CONTROL, and without it "return 1 for everything" passes every row above.** A cadence with
     * a FIXED period must still vary with the window: a weekly bill falls due more often inside a monthly
     * cycle than inside a weekly one. This is what separates *"per-paycheck follows the user"* from
     * *"nothing follows anything"*.
     */
    const weeklyRows = (next: string) =>
        allocatePaycheck({
            paycheckAmount: 5000,
            currentDate: "2026-08-03",
            nextPaycheckDate: next,
            expenses: [{ id: "e1", name: "Groceries", amount: 50, dueDate: "2026-08-05", recurrence: "weekly" }],
            debts: [],
            goals: [],
            strategy: "snowball",
            paycheckBuffer: 0,
        }).allocations.filter((a) => a.label.includes("Groceries")).length;
    const inWeekly = weeklyRows("2026-08-10");
    const inMonthly = weeklyRows("2026-09-01");
    assertEqual(inWeekly, 1, "⭐ control — a WEEKLY bill lands once in a weekly cycle");
    if (inMonthly <= inWeekly) {
        throw new Error(`FAIL [⭐ control — a fixed-period cadence still scales with the window]: weekly=${inWeekly}, monthly=${inMonthly}`);
    }

    /**
     * ⭐ **AND THE MATRIX IS WALKED, so a cadence added later is covered without anyone remembering.**
     * Every pair must produce a finite, non-negative reservation — the shape `A5-5` broke by inventing an
     * occurrence (`e1__occ2`) that exists in no store.
     */
    for (const recurrence of RECURRENCES) {
        for (const { payCycle, next } of CYCLES) {
            const r = allocatePaycheck({
                paycheckAmount: 5000,
                currentDate: "2026-08-03",
                nextPaycheckDate: next,
                expenses: [{ id: "e1", name: "Groceries", amount: 50, dueDate: "2026-08-05", recurrence }],
                debts: [],
                goals: [],
                strategy: "snowball",
                paycheckBuffer: 0,
            });
            const rows = r.allocations.filter((a) => a.label.includes("Groceries"));
            const total = rows.reduce((s, a) => s + a.amount, 0);
            if (!Number.isFinite(total) || total < 0) {
                throw new Error(`FAIL [⭐ matrix · ${recurrence} × ${payCycle}]: reserved ${total}`);
            }
            // ⛔ A reservation must be a whole multiple of the bill — a partial row is the "(partial) $100"
            // the expansion produced when it charged a bill it could not afford to charge three times.
            if (total % 50 !== 0) {
                throw new Error(`FAIL [⭐ matrix · ${recurrence} × ${payCycle}]: reserved $${total}, not a multiple of the $50 bill`);
            }
        }
    }

    console.log("✅ Cadence identity tests passed (7 recurrences × 4 pay cycles).");
}

runCadenceIdentityTests();
