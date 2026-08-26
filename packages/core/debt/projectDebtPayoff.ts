import { Debt } from "@core/storage/debtPlannerStorage";
import { addMonthsToDate } from "@core/utils/addMonths";
import { parseLocalDate } from "@core/utils/localDate";
import { bnplMonthlyEquivalentMinimum, isOneTimeBnplLump } from "./bnplPayoffPace";
import { calculateMonthlyInterest } from "./calculateMonthlyInterest";

/**
 * The `estimatedDebtFreeDate` SENTINEL — "this plan does not amortize inside the horizon".
 *
 * ⛔ **[P6.4.4 · audit L6-6] This is a control-flow value, NOT copy, and the distinction decides where it
 * lives.** The finding filed it as *"a user-facing fallback duplicated across the debt/analysis
 * boundary"*. **Measured: in the shipping app it is never rendered at all** — `planSelectors.ts` and
 * `analysisSelectors.ts` both map it to `null` before anything can display it. What it actually is, is a
 * magic string **compared against in eight places** across `packages/core`, `apps/rn` and the legacy
 * tree.
 *
 * ⚡ **That makes the real risk sharper than drift: every one of those comparisons FAILS OPEN.** A typo in
 * `!== "Unable to estmate"` does not throw and does not render wrong — it silently classifies an
 * unpayable plan as payable and lets a garbage date flow into interest-saved, drift and the trajectory.
 *
 * ⚠️ **Deliberately NOT in `@core/copy/vocabulary`.** That module owns words the user reads, and this is
 * not one — coupling engine control flow to a display string is exactly the move L2-6's refutation
 * forbade ("it would make five dead strings load-bearing"). If this string ever DOES need to be shown,
 * the display copy is a separate constant and this one keeps its job.
 */
export const DEBT_FREE_DATE_UNPAYABLE = "Unable to estimate";

type PayoffStrategy = "snowball" | "avalanche";

type ProjectDebtPayoffParams = {
    debts: Debt[];
    monthlyExtraPayment: number;
    strategy: PayoffStrategy;
    startDate: string;
};

type ProjectedDebt = {
    id: string;
    name: string;
    balance: number;
    minimumPayment: number;
    apr: number;
    /** A one-time (pay-in-30) BNPL lump — cleared in month 1 but kept OUT of the recurring budget (R2.2). */
    oneTimeLump: boolean;
};

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

function normalizeBalance(balance: number) {
    return balance < 0.01 ? 0 : roundMoney(balance);
}


function formatMonthYear(date: Date) {
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

function sortDebts(debts: ProjectedDebt[], strategy: PayoffStrategy) {
    return [...debts]
        .filter((debt) => debt.balance > 0)
        .sort((a, b) => {
            if (strategy === "avalanche") {
                if (b.apr !== a.apr) {
                    return b.apr - a.apr;
                }
                return a.balance - b.balance;
            }

            return a.balance - b.balance;
        });
}

// ⛔ COMPARE AGAINST THE BUDGET THE LOOP ACTUALLY SPENDS, NOT THE SHRINKING MINIMUM SUM (S1P3-A1).
// This guard used to re-sum the minimums of the debts still LIVE at that month and add the extra. But
// the loop below does not spend that number — it spends `monthlyBudget`, a CONSTANT that deliberately
// keeps a paid-off debt's freed minimum in the pool (the defining snowball/avalanche mechanic, see the
// comment above `totalMinimums`). So the instant the first debt cleared, this compared the remaining
// interest against a payment total that no longer included the money actually being paid, and bailed
// out of a plan that amortizes fine: a $2,000 car loan at 5% (min $500) plus a $10,000 Visa at 25%
// (min $50) returned "Unable to estimate" at month 5 while `buildPayoffTrajectory` — same inputs, same
// directory — drew that plan clearing at month 30. The Progress hero printed `—` over its own chart.
// ⚠️ The `monthlyBudget > 0` half is NOT incidental and must not be dropped: a $0 recurring budget
// (an all-one-time-BNPL plan with no extra) is not un-amortizable — the lumps clear via their month-1
// minimum — and `0 >= 0` would call it unpayable. `buildPayoffTrajectory.ts:91` already had both halves;
// this is the second producer of one fact being brought into line with the first, not a new rule.
function cannotAmortize(debts: ProjectedDebt[], monthlyBudget: number) {
    const activeDebts = debts.filter((debt) => debt.balance > 0);

    const monthlyInterestTotal = activeDebts.reduce(
        (sum, debt) => sum + calculateMonthlyInterest(debt.balance, debt.apr),
        0
    );

    return monthlyBudget > 0 && monthlyInterestTotal >= monthlyBudget;
}

export function projectDebtPayoff({
    debts,
    monthlyExtraPayment,
    strategy,
    startDate,
}: ProjectDebtPayoffParams) {
    let projectedDebts: ProjectedDebt[] = debts
        .filter((debt) => debt.balance > 0)
        .map((debt) => ({
            id: debt.id,
            name: debt.name,
            balance: debt.balance,
            // BNPL minimums are per-installment at their cadence → scale to a monthly equivalent so the
            // debt-free date rates every cadence correctly (B1). Non-BNPL minimums are already monthly.
            minimumPayment:
                debt.type === "bnpl"
                    ? bnplMonthlyEquivalentMinimum(debt)
                    : debt.minimumPayment,
            // BNPL is fixed-installment, interest-free by definition - never
            // accrue interest on it even if a nonzero APR was entered/defaulted.
            apr: debt.type === "bnpl" ? 0 : debt.apr,
            oneTimeLump: isOneTimeBnplLump(debt),
        }));

    let months = 0;
    let totalInterestPaid = 0;

    const payoffOrder: string[] = [];
    const maxMonths = 600;

    // The defining mechanic of snowball/avalanche: total monthly outflow stays
    // constant, so when a debt is paid off its freed minimum rolls onto the next
    // target. Budget = every debt's minimum + the extra; each month the extra
    // pool is whatever the budget covers beyond the minimums actually paid, which
    // grows automatically as debts are cleared. (First months are unchanged:
    // nothing is freed yet, so the pool equals monthlyExtraPayment.)
    // Exclude one-time BNPL lumps from the RECURRING budget — they clear in month 1 via their own
    // minimum, but must not re-appear as phantom "freed" cash in later months (R2.2).
    const totalMinimums = projectedDebts.reduce(
        (sum, debt) => sum + (debt.oneTimeLump ? 0 : debt.minimumPayment),
        0
    );
    const monthlyBudget = roundMoney(totalMinimums + Math.max(0, monthlyExtraPayment));

    while (
        projectedDebts.some((debt) => debt.balance > 0) &&
        months < maxMonths
    ) {
        if (cannotAmortize(projectedDebts, monthlyBudget)) {
            return {
                strategy,
                monthsToDebtFree: months,
                estimatedDebtFreeDate: DEBT_FREE_DATE_UNPAYABLE,
                totalInterestPaid: 0,
                payoffOrder,
            };
        }

        projectedDebts = projectedDebts.map((debt) => {
            if (debt.balance <= 0) {
                return debt;
            }

            const interest = calculateMonthlyInterest(debt.balance, debt.apr);
            totalInterestPaid += interest;

            return {
                ...debt,
                balance: normalizeBalance(debt.balance + interest),
            };
        });

        let minimumsPaidThisMonth = 0;

        projectedDebts = projectedDebts.map((debt) => {
            if (debt.balance <= 0) {
                return debt;
            }

            const payment = Math.min(debt.minimumPayment, debt.balance);
            // A one-time BNPL lump is an obligation paid month 1 from regular cash, NOT the recurring
            // snowball budget — clear it, but don't debit the extra pool, so it neither phantom-accelerates
            // nor decelerates coexisting debts (R2.2 / round-3 Finding 2).
            if (!debt.oneTimeLump) minimumsPaidThisMonth += payment;
            const newBalance = normalizeBalance(debt.balance - payment);

            if (newBalance === 0 && !payoffOrder.includes(debt.name)) {
                payoffOrder.push(debt.name);
            }

            return {
                ...debt,
                balance: newBalance,
            };
        });

        // Freed minimums (from already-paid-off debts) plus the extra all roll
        // onto the target: budget minus the minimums actually paid this month.
        let availableExtra = roundMoney(
            Math.max(0, monthlyBudget - minimumsPaidThisMonth)
        );

        while (
            availableExtra > 0 &&
            projectedDebts.some((debt) => debt.balance > 0)
        ) {
            const target = sortDebts(projectedDebts, strategy)[0];

            if (!target) {
                break;
            }

            const payment = Math.min(availableExtra, target.balance);

            projectedDebts = projectedDebts.map((debt) => {
                if (debt.id !== target.id) {
                    return debt;
                }

                const newBalance = normalizeBalance(debt.balance - payment);

                if (newBalance === 0 && !payoffOrder.includes(debt.name)) {
                    payoffOrder.push(debt.name);
                }

                return {
                    ...debt,
                    balance: newBalance,
                };
            });

            availableExtra = roundMoney(availableExtra - payment);
        }

        months += 1;
    }

    // ⛔ The month step CLAMPS. `setMonth` overflows a short target month forward, and since only the
    // month and year are printed, a start date on the 29th–31st surfaced as a whole month too late on
    // the app's headline claim about the user's own plan.
    const payoffDate = addMonthsToDate(parseLocalDate(startDate), months);

    return {
        strategy,
        monthsToDebtFree: months,
        estimatedDebtFreeDate:
            months >= maxMonths ? DEBT_FREE_DATE_UNPAYABLE : formatMonthYear(payoffDate),
        totalInterestPaid:
            months >= maxMonths ? 0 : roundMoney(totalInterestPaid),
        payoffOrder,
    };
}
