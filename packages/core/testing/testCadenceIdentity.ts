import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { bnplMonthlyEquivalentMinimum } from "@core/debt/bnplPayoffPace";
import { payCyclesPerMonth } from "@core/payCycle/payCyclesPerMonth";
import { projectCurrentBalance } from "@core/debt/projectCurrentBalance";
import { projectDebtPayoff } from "@core/debt/projectDebtPayoff";
import type { PayCycle } from "@core/payCycle/getNextPaycheckDate";
import type { Recurrence } from "@core/types/recurrence";
import { addMonthsISO } from "@core/utils/addMonths";
import { parseLocalDate, toLocalISODate } from "@core/utils/localDate";

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

/**
 * ⛔ **AN INDEPENDENT COUNT OF THE CHARGES IN `[start, end)`, written from the CADENCE'S DEFINITION.**
 * [class 4 re-audit `F4`]
 *
 * ⚠️ **It deliberately does not call `effectiveMinimumInWindow`.** The assertion below exists to
 * contradict that producer when it is wrong, and a check that asks the producer what the answer should be
 * agrees with it by construction — including when both are wrong together.
 *
 * The window is half-open, matching the engine: a charge landing exactly on `start` counts, one landing
 * on `end` does not. `per-paycheck` is one charge per cycle by definition — that is what the label means
 * and it is the whole subject of `A5-5` above.
 *
 * ⛔ **The month step goes through `addMonthsISO`, and the first draft of this did not.** It used
 * `setUTCMonth(+1)`, which **overflows a short month forward** — Jan 31 + 1 month is **Mar 3**, not
 * Feb 28 — so the count would have been wrong for any month-end anchor. `check-month-arithmetic` caught
 * it: `addMonths.ts` is the only place a bare `setMonth` may live. ⚠️ **A second producer of an owned
 * operation, written inside the fix for a class about second producers** — and the fixture date
 * (`2026-08-03`) meant it would have passed every run while staying wrong.
 */
function chargesInWindow(recurrence: Recurrence, startISO: string, endISO: string): number {
    if (recurrence === "per-paycheck") return 1;
    // The fixtures below are all due exactly on `start`, so the walk begins there. ISO dates compare
    // lexicographically in calendar order, which is why the loop needs no Date objects of its own.
    const anchorDay = parseLocalDate(startISO).getDate();
    const addDays = (iso: string, days: number): string => {
        const d = parseLocalDate(iso);
        d.setDate(d.getDate() + days);
        return toLocalISODate(d);
    };
    let cursor = startISO;
    let n = 0;
    while (cursor < endISO) {
        n += 1;
        if (recurrence === "one-time") break;
        if (recurrence === "weekly") cursor = addDays(cursor, 7);
        else if (recurrence === "biweekly") cursor = addDays(cursor, 14);
        else if (recurrence === "monthly") cursor = addMonthsISO(cursor, 1, anchorDay);
        else if (recurrence === "quarterly") cursor = addMonthsISO(cursor, 3, anchorDay);
        else if (recurrence === "annually") cursor = addMonthsISO(cursor, 12, anchorDay);
        else break;
    }
    return n;
}

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

    /**
     * ⛔ **THE SAME MATRIX, OVER DEBTS — because every pair above passes `debts: []`.** [class 4 `A3-12`]
     *
     * ⚡ This file is *"the cadence-identity matrix, built to close the cadence CLASS"*, and `recurrence`
     * is on `Debt` as much as on an expense — but all 28 pairs handed the allocator **no debt at all**.
     * So the instrument written to close the class could not see the half of it that shipped a 4×
     * over-reservation on the Guardian card, the Live Activity, the widget and the paywall lead.
     *
     * ⚠️ **A PLAIN DEBT, and a FALLBACK BNPL, never an installment-native one.** `bnplInstallmentAmount`
     * prefers `scheduledPaymentAmount`, so a fixture carrying one cannot detect a `minimumPayment` that
     * has been multiplied — measured: installment-native 200 → 200, the other two 200 → 800.
     */
    for (const { payCycle, next } of CYCLES) {
        for (const recurrence of RECURRENCES) {
            for (const type of ["debt", "bnpl"] as const) {
                const r = allocatePaycheck({
                    paycheckAmount: 5000,
                    currentDate: "2026-08-03",
                    nextPaycheckDate: next,
                    expenses: [],
                    debts: [
                        {
                            id: "d1", name: "Loan", balance: 100000, minimumPayment: 50, apr: 10,
                            dueDate: "2026-08-03", type, recurrence, isPaidThisCycle: false,
                        } as never,
                    ],
                    goals: [],
                    strategy: "snowball",
                    paycheckBuffer: 0,
                });
                const label = `⭐ debt matrix · ${type} · ${recurrence} × ${payCycle}`;
                /**
                 * ⛔ **THIS ASSERTED A DIVISIBILITY AND DIVISIBILITY CANNOT FAIL HERE.**
                 * [class 4 re-audit `F4`]
                 *
                 * ⚡ The first version asked `r.totalRequired % 50 !== 0`. **50, 200 and 800 all satisfy
                 * it** — the reserve is an integer multiple of the charge whatever multiplier is applied,
                 * so the test was structurally satisfiable by the defect it was written for. Proven: the
                 * re-audit planted the class's defect in **three** directions (the row site reverted, the
                 * scaling deleted, the scaling doubled) and this matrix stayed **green through all
                 * three**, each plant proven live by `testGuardianPartition` reddening on the same tree.
                 *
                 * ⛔ **`A3-12` therefore moved from *"passes no debts"* to *"passes debts and asks them
                 * nothing"*, which is the same finding one level in.**
                 *
                 * ⚠️ **The expected count is computed HERE, by stepping the cadence's own period across
                 * the window** — deliberately not by calling `effectiveMinimumInWindow`, because a test
                 * that asks the producer what the producer should say cannot disagree with it.
                 */
                const expected = 50 * chargesInWindow(recurrence, "2026-08-03", next);
                if (r.totalRequired !== expected) {
                    throw new Error(`FAIL [${label}]: reserved $${r.totalRequired}, expected $${expected} (${expected / 50} charge(s) of $50 in this window)`);
                }
                /**
                 * ⛔ **AND THE ROW THAT HOLDS THE MONEY, not only the total that reports it.**
                 * [class 4 `A3-7` · re-audit `F4`]
                 *
                 * ⚡ Measured while repairing the assertion above: with the total asserted and the row not,
                 * **reverting the row site left this file green** — because `totalRequired` reads
                 * `minimumDueInWindow` and the row read the raw minimum, which is the exact split `A3-7`
                 * was. The paycheck here is $5,000 against a $50 charge, so every obligation is funded and
                 * the rows must account for the whole of `totalRequired`.
                 */
                const reserved = r.allocations
                    .filter((a) => a.category === "minimum_debt" || a.category === "autopay_debt")
                    .reduce((s, a) => s + a.amount, 0);
                if (reserved !== expected) {
                    throw new Error(`FAIL [${label}]: the ROW reserves $${reserved} where totalRequired says $${expected} — the total and the money held disagree`);
                }
                // ⛔ The user-facing half: the paycheck covers every one of these, so a shortfall here is
                // money the app says you are missing while you are holding it.
                if (r.shortfall !== 0) {
                    throw new Error(`FAIL [${label}]: phantom shortfall $${r.shortfall} on a paycheck that covers it`);
                }
            }
        }
    }

    /**
     * ⛔ **IDENTITY 3 — THE PROJECTION RATES BY CADENCE, NOT BY LABEL.** [class 4 round-2 `R2-5`]
     *
     * ⚡ **Four sites** picked a monthly payment with `debt.type === "bnpl" ? monthlyEquivalent :
     * debt.minimumPayment`, each under a comment saying *"Non-BNPL minimums are already monthly."*
     * **That premise died with pass-6 `A3-1`** — the finding that removed exactly this gate from the
     * reserve, because *a cadence is a fact about the SCHEDULE, not about the debt's label*. The audit
     * named two of the four; the class has now undercounted a site list five times.
     *
     * ⚠️ **Measured, two debts identical but for `type`, $50 weekly, apr 0:** projected balance after 12
     * months **$4,450 plain against $2,616.63 BNPL**, and a debt-free date of **May 2034 against January
     * 2028** — six years apart, on the same money.
     */
    {
        const at = (over: Record<string, unknown>) =>
            ({
                id: "d1", name: "Loan", balance: 5000, minimumPayment: 50, apr: 0,
                dueDate: "2026-01-01", balanceAsOfDate: "2026-01-01", recurrence: "weekly", ...over,
            }) as never;
        const plainWeekly = at({ type: "debt" });
        const bnplWeekly = at({ type: "bnpl", bnplProvider: "Klarna" });
        const plainMonthly = at({ type: "debt", recurrence: "monthly" });
        const payoff = (d: never) =>
            projectDebtPayoff({ debts: [d], monthlyExtraPayment: 0, strategy: "snowball", startDate: "2026-01-01", cyclesPerMonth: 2 })
                .estimatedDebtFreeDate;

        assertMoney(
            projectCurrentBalance(plainWeekly, "2027-01-01", 2),
            projectCurrentBalance(bnplWeekly, "2027-01-01", 2),
            "⛔ R2-5 — a PLAIN weekly debt projects exactly like an identical weekly BNPL",
        );
        assertEqual(
            payoff(plainWeekly),
            payoff(bnplWeekly),
            "⛔ R2-5 — …and reaches the same debt-free date, because the label is not the cadence",
        );
        /**
         * ⭐ **THE CONTROL, and without it "rate everything by cadence" is indistinguishable from "rate
         * everything faster."** A plain MONTHLY debt charges once a month and must be unchanged — if this
         * moved with the rows above, the fix would be flattening cadence rather than reading it.
         */
        if (projectCurrentBalance(plainMonthly, "2027-01-01", 2) <= projectCurrentBalance(plainWeekly, "2027-01-01", 2)) {
            throw new Error("FAIL [⭐ R2-5 control — a MONTHLY debt still pays down more slowly than a weekly one]");
        }
    }

    console.log("✅ Cadence identity tests passed (7 recurrences × 4 pay cycles, expenses AND debts, and the projection).");
}

runCadenceIdentityTests();
