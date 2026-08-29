import { applyDebtPaymentProjection } from "./applyDebtPaymentProjection";
import { buildPayoffTrajectory } from "./buildPayoffTrajectory";
import { DEBT_FREE_DATE_UNPAYABLE, projectDebtPayoff } from "./projectDebtPayoff";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

function assertMoney(actual: number, expected: number, label: string) {
    const roundedActual = Math.round(actual * 100) / 100;
    const roundedExpected = Math.round(expected * 100) / 100;

    if (roundedActual !== roundedExpected) {
        throw new Error(
            `${label} failed. Expected $${roundedExpected}, received $${roundedActual}`
        );
    }
}

function assertGreaterThan(actual: number, expected: number, label: string) {
    if (!(actual > expected)) {
        throw new Error(
            `${label} failed. Expected greater than ${expected}, received ${actual}`
        );
    }
}

function runDebtProjectionTests() {
    const oneMonthProjection = applyDebtPaymentProjection({
        balance: 1000,
        apr: 24,
        payment: 120,
    });

    assertMoney(oneMonthProjection.interest, 20, "single month interest");
    assertMoney(
        oneMonthProjection.balanceAfterInterest,
        1020,
        "single month balance after interest"
    );
    assertMoney(oneMonthProjection.payment, 120, "single month payment");
    assertMoney(
        oneMonthProjection.projectedBalance,
        900,
        "single month projected balance"
    );

    const overpaymentProjectionSingle = applyDebtPaymentProjection({
        balance: 50,
        apr: 0,
        payment: 100,
    });

    assertMoney(
        overpaymentProjectionSingle.payment,
        50,
        "single month payment is capped at balance"
    );
    assertMoney(
        overpaymentProjectionSingle.projectedBalance,
        0,
        "single month overpayment does not create negative balance"
    );

    const zeroAprProjection = applyDebtPaymentProjection({
        balance: 500,
        apr: 0,
        payment: 125,
    });

    assertMoney(zeroAprProjection.interest, 0, "zero APR projection interest");
    assertMoney(
        zeroAprProjection.projectedBalance,
        375,
        "zero APR projection balance"
    );

    const snowballProjection = projectDebtPayoff({
        debts: [
            {
                id: "small",
                name: "Small Debt",
                balance: 300,
                minimumPayment: 50,
                apr: 5,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "large",
                name: "Large Debt",
                balance: 5000,
                minimumPayment: 100,
                apr: 29,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 300,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        snowballProjection.payoffOrder[0],
        "Small Debt",
        "snowball payoff order"
    );

    const avalancheProjection = projectDebtPayoff({
        debts: [
            {
                id: "lowapr",
                name: "Low APR",
                balance: 5000,
                minimumPayment: 50,
                apr: 5,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
            {
                id: "highapr",
                name: "High APR",
                balance: 300,
                minimumPayment: 100,
                apr: 29,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 300,
        strategy: "avalanche",
        startDate: "2026-05-01",
    });

    assertEqual(
        avalancheProjection.payoffOrder[0],
        "High APR",
        "avalanche payoff order"
    );

    assertGreaterThan(
        avalancheProjection.totalInterestPaid,
        0,
        "interest accrual"
    );

    assertGreaterThan(
        avalancheProjection.monthsToDebtFree,
        0,
        "months to debt free"
    );

    const impossibleProjection = projectDebtPayoff({
        debts: [
            {
                id: "bad",
                name: "Impossible Debt",
                balance: 10000,
                minimumPayment: 10,
                apr: 35,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        impossibleProjection.estimatedDebtFreeDate,
        "Unable to estimate",
        "negative amortization detection"
    );

    const overpaymentProjection = projectDebtPayoff({
        debts: [
            {
                id: "tiny",
                name: "Tiny Debt",
                balance: 50,
                minimumPayment: 100,
                apr: 0,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 1000,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        overpaymentProjection.monthsToDebtFree,
        1,
        "overpayment prevention payoff timing"
    );

    assertMoney(
        overpaymentProjection.totalInterestPaid,
        0,
        "zero APR overpayment has no interest"
    );

    const exactBaselineDateProjection = projectDebtPayoff({
        debts: [
            {
                id: "exact-date",
                name: "Exact Date Debt",
                balance: 100,
                minimumPayment: 50,
                apr: 0,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        exactBaselineDateProjection.monthsToDebtFree,
        2,
        "exact baseline payoff months"
    );

    assertEqual(
        exactBaselineDateProjection.estimatedDebtFreeDate,
        "July 2026",
        "exact baseline payoff date"
    );

    const exactRecommendedDateProjection = projectDebtPayoff({
        debts: [
            {
                id: "exact-date",
                name: "Exact Date Debt",
                balance: 100,
                minimumPayment: 50,
                apr: 0,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 50,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        exactRecommendedDateProjection.monthsToDebtFree,
        1,
        "exact recommended payoff months"
    );

    assertEqual(
        exactRecommendedDateProjection.estimatedDebtFreeDate,
        "June 2026",
        "exact recommended payoff date"
    );

    const paidDebtIgnoredProjection = projectDebtPayoff({
        debts: [
            {
                id: "paid",
                name: "Paid Debt",
                balance: 0,
                minimumPayment: 50,
                apr: 29,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: true,
            },
            {
                id: "remaining",
                name: "Remaining Debt",
                balance: 100,
                minimumPayment: 100,
                apr: 0,
                dueDate: "2026-05-01",
                type: "debt",
                recurrence: "monthly",
                isPaidThisCycle: false,
            },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });

    assertEqual(
        paidDebtIgnoredProjection.monthsToDebtFree,
        1,
        "paid debt ignored payoff months"
    );

    assertEqual(
        paidDebtIgnoredProjection.estimatedDebtFreeDate,
        "June 2026",
        "paid debt ignored payoff date"
    );


    // B1 — BNPL cadence: a biweekly pay-in-4 ($100 × 4 = $400) really costs ~$216.67/mo, so it clears in
    // 2 months, not the 4 a naive "$100 minimum per month" would give.
    const biweeklyBnpl = projectDebtPayoff({
        debts: [
            { id: "bnpl", name: "Klarna", balance: 400, minimumPayment: 100, apr: 0, dueDate: "2026-05-01", type: "bnpl", recurrence: "biweekly", isPaidThisCycle: false },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });
    assertEqual(biweeklyBnpl.monthsToDebtFree, 2, "biweekly BNPL rated at its true monthly rate (B1)");

    // The SAME numbers labeled monthly are NOT scaled — proves the scaling is cadence-specific, not a
    // blanket BNPL bump: $100/mo against $400 = 4 months.
    const monthlyBnpl = projectDebtPayoff({
        debts: [
            { id: "bnpl", name: "Affirm", balance: 400, minimumPayment: 100, apr: 0, dueDate: "2026-05-01", type: "bnpl", recurrence: "monthly", isPaidThisCycle: false },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });
    assertEqual(monthlyBnpl.monthsToDebtFree, 4, "monthly BNPL stays at its monthly rate (cadence-specific)");

    // A one-time (pay-in-30) BNPL clears the month it lands.
    const oneTimeBnpl = projectDebtPayoff({
        debts: [
            { id: "k30", name: "Klarna Pay-in-30", balance: 200, minimumPayment: 200, apr: 0, dueDate: "2026-05-01", type: "bnpl", recurrence: "one-time", isPaidThisCycle: false },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });
    assertEqual(oneTimeBnpl.monthsToDebtFree, 1, "one-time BNPL clears the month it lands (B1)");

    // ⛔ S1P3-A1 — THE NEGATIVE-AMORTIZATION GUARD MUST COMPARE AGAINST THE CONSTANT BUDGET.
    // It used to re-sum the minimums of the debts still LIVE that month, so the instant the first debt
    // cleared it compared the remaining interest against a total that no longer included the freed
    // minimum the loop actually keeps spending — and bailed out of a plan that amortizes fine.
    // ⚠️ THE ASSERTION THAT CARRIES THIS FINDING IS THE DATE, NOT THE MONTH COUNT. The defect returned
    // `monthsToDebtFree: 5` — a plausible small number — with the date set to the UNPAYABLE sentinel, so
    // a month-count assertion alone could be satisfied by the defect. Assert the sentinel is absent AND
    // the real term, and assert the date first so it is the one that reds.
    // ⚠️ No earlier assertion in this block can fire first: `freedMinimumRolls` is built fresh here.
    const freedMinimumRolls = projectDebtPayoff({
        debts: [
            { id: "car", name: "Car loan", balance: 2000, minimumPayment: 500, apr: 5, dueDate: "2026-01-15", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
            { id: "visa", name: "Visa", balance: 10000, minimumPayment: 50, apr: 25, dueDate: "2026-01-15", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
        ],
        monthlyExtraPayment: 0,
        strategy: "avalanche",
        startDate: "2026-01-15",
    });
    assertEqual(
        freedMinimumRolls.estimatedDebtFreeDate !== DEBT_FREE_DATE_UNPAYABLE,
        true,
        "a plan that amortizes is not called unpayable once a debt clears (S1P3-A1)"
    );
    assertEqual(freedMinimumRolls.monthsToDebtFree, 30, "…and it clears in 30 months (S1P3-A1)");
    // ⛔ The DATE and the CHART are two producers of one fact and disagreed here — the hero printed the
    // sentinel over a chart drawing the same plan to zero at month 30. Pin them to each other.
    const trajectory = buildPayoffTrajectory({
        debts: [
            { id: "car", name: "Car loan", balance: 2000, minimumPayment: 500, apr: 5, type: "debt", recurrence: "monthly" },
            { id: "visa", name: "Visa", balance: 10000, minimumPayment: 50, apr: 25, type: "debt", recurrence: "monthly" },
        ],
        monthlyExtraPayment: 0,
        strategy: "avalanche",
    });
    assertEqual(
        trajectory.find((point) => point.balance <= 0.01)?.month,
        freedMinimumRolls.monthsToDebtFree,
        "the debt-free DATE and the payoff CHART agree on the same plan (S1P3-A1)"
    );

    /**
     * ⛔ **S1.11.4.5 [pass-4 blocker `A-F4`] — THE ASSERTION ABOVE EXISTED, WAS GREEN OVER THE DEFECT, AND
     * SAID SO IN ITS OWN LABEL.** *"The debt-free DATE and the payoff CHART agree on the same plan"* is a
     * class-level sentence pinned to **one plan** — a $2,000 car loan at 5% beside a $10,000 Visa at 25%,
     * whose interest is nowhere near its budget. Run against a plan INSIDE the disagreement band the same
     * expression is `assertEqual(undefined, 205)`. ⚡ Reading rule 2 exactly: the right guard, aimed at the
     * one input where the two producers happen to agree.
     *
     * ⛔ **So the assertion SWEEPS the band rather than naming a member of it.** The two engines differed
     * only in WHEN the negative-amortization guard ran, and accrual only raises the balance — so the band
     * is `budget/(1 + apr/1200) ≤ monthlyInterest < budget`, a window that narrows with the APR. The rows
     * below walk it deliberately: a minimum set at ~2% of balance is the ordinary credit-card shape, which
     * is why 4,000 random plans landed in it six times.
     *
     * ⚠️ **The property, not the number.** Asserting a month count would pin today's arithmetic; what must
     * hold is that the two producers AGREE — the date says payable **iff** the curve reaches zero. A
     * disagreement in either direction is the defect, and the message names which way it went.
     */
    const BAND_PLANS: { label: string; balance: number; apr: number; min: number; extra?: number }[] = [
        { label: "the reported plan: $6,379.24 @ 25.22%, $136 min", balance: 6379.24, apr: 25.22, min: 136 },
        { label: "the same card, one dollar of minimum lower", balance: 6379.24, apr: 25.22, min: 135 },
        { label: "a 30% card at ~2% minimum, carried by a $100 extra", balance: 7833.66, apr: 30.08, min: 96.37, extra: 100 },
        { label: "a 22% card whose minimum is just above its interest", balance: 5000, apr: 22, min: 92 },
        { label: "…and just below it, which really is unpayable", balance: 5000, apr: 22, min: 90 },
        { label: "a 0% card, far outside the band", balance: 1200, apr: 0, min: 100 },
        { label: "a 5% loan, far outside the band", balance: 2000, apr: 5, min: 500 },
    ];
    for (const plan of BAND_PLANS) {
        const date = projectDebtPayoff({
            debts: [
                { id: "b", name: "Card", balance: plan.balance, minimumPayment: plan.min, apr: plan.apr, dueDate: "2026-01-15", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
            ],
            monthlyExtraPayment: plan.extra ?? 0,
            strategy: "avalanche",
            startDate: "2026-01-15",
        });
        const curve = buildPayoffTrajectory({
            debts: [
                { id: "b", name: "Card", balance: plan.balance, minimumPayment: plan.min, apr: plan.apr, type: "debt", recurrence: "monthly" },
            ],
            monthlyExtraPayment: plan.extra ?? 0,
            strategy: "avalanche",
        });
        const datePayable = date.estimatedDebtFreeDate !== DEBT_FREE_DATE_UNPAYABLE;
        const chartPayable = curve.some((point) => point.balance <= 0.01);
        assertEqual(
            chartPayable,
            datePayable,
            `⛔ A-F4 · ${plan.label} — the DATE says ${datePayable ? "payable" : "unpayable"} and the CHART says ${chartPayable ? "payable" : "unpayable"}; they are one fact`
        );
    }
    // ⭐ THE CONTROL THAT STOPS THIS PASSING BY AGREEING ON NOTHING. If every row above were unpayable the
    // loop would be satisfied by two engines that had both simply given up, so the sweep is asserted to
    // contain BOTH answers — which is also what proves the band rows really are near the boundary.
    const verdicts = BAND_PLANS.map((plan) =>
        projectDebtPayoff({
            debts: [
                { id: "b", name: "Card", balance: plan.balance, minimumPayment: plan.min, apr: plan.apr, dueDate: "2026-01-15", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
            ],
            monthlyExtraPayment: plan.extra ?? 0,
            strategy: "avalanche",
            startDate: "2026-01-15",
        }).estimatedDebtFreeDate !== DEBT_FREE_DATE_UNPAYABLE
    );
    assertEqual(verdicts.includes(true), true, "⭐ A-F4 control — the sweep contains a payable plan");
    assertEqual(verdicts.includes(false), true, "⭐ A-F4 control — …and an unpayable one, so it straddles the boundary");

    // R2.2 — a one-time BNPL must NOT phantom-accelerate a coexisting debt. A $1000 card ($100/mo, 0%)
    // takes 10 months alone; adding a $2000 one-time BNPL must leave the card at 10 months (the one-time
    // clears month 1 and is excluded from the recurring budget), not wipe it early via phantom freed cash.
    const cardAlone = projectDebtPayoff({
        debts: [
            { id: "card", name: "Card", balance: 1000, minimumPayment: 100, apr: 0, dueDate: "2026-05-01", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });
    assertEqual(cardAlone.monthsToDebtFree, 10, "baseline: the card alone takes 10 months");

    const oneTimePlusCard = projectDebtPayoff({
        debts: [
            { id: "k30", name: "Klarna Pay-in-30", balance: 2000, minimumPayment: 2000, apr: 0, dueDate: "2026-05-01", type: "bnpl", recurrence: "one-time", isPaidThisCycle: false },
            { id: "card", name: "Card", balance: 1000, minimumPayment: 100, apr: 0, dueDate: "2026-05-01", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
        ],
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-05-01",
    });
    assertEqual(oneTimePlusCard.monthsToDebtFree, 10, "one-time BNPL does not phantom-accelerate a coexisting debt (R2.2)");

    // R2.1 — the payoff CHART and the debt-free DATE must agree on BNPL cadence. A biweekly BNPL's
    // trajectory must hit zero the same month projectDebtPayoff reports (month 2), not month 4.
    const biweeklyTraj = buildPayoffTrajectory({
        debts: [{ balance: 400, minimumPayment: 100, apr: 0, type: "bnpl", recurrence: "biweekly" }],
        monthlyExtraPayment: 0,
        strategy: "snowball",
    });
    const trajZeroMonth = biweeklyTraj.find((p) => p.balance <= 0.01)?.month;
    assertEqual(trajZeroMonth, 2, "payoff chart zero-crossing matches the debt-free date for a biweekly BNPL (R2.1)");

    // R3 Finding 1 — a solo one-time BNPL (zero recurring budget) must clear on the CHART too, not
    // flatline forever. Its trajectory zero-crossing must be month 1, matching the date.
    const oneTimeTraj = buildPayoffTrajectory({
        debts: [{ balance: 200, minimumPayment: 200, apr: 0, type: "bnpl", recurrence: "one-time" }],
        monthlyExtraPayment: 0,
        strategy: "snowball",
    });
    assertEqual(oneTimeTraj.find((p) => p.balance <= 0.01)?.month, 1, "solo one-time BNPL chart clears month 1, no flatline (R3 F1)");

    // R3 Finding 2 — with extra > 0, a one-time BNPL must NOT decelerate a coexisting debt either. The
    // $1000 card at $400/mo (100 min + 300 extra) clears in the same months with or without a $2000 one-time.
    const cardExtraAlone = projectDebtPayoff({
        debts: [{ id: "card", name: "Card", balance: 1000, minimumPayment: 100, apr: 0, dueDate: "2026-05-01", type: "debt", recurrence: "monthly", isPaidThisCycle: false }],
        monthlyExtraPayment: 300, strategy: "snowball", startDate: "2026-05-01",
    });
    const cardExtraWithLump = projectDebtPayoff({
        debts: [
            { id: "k30", name: "Klarna Pay-in-30", balance: 2000, minimumPayment: 2000, apr: 0, dueDate: "2026-05-01", type: "bnpl", recurrence: "one-time", isPaidThisCycle: false },
            { id: "card", name: "Card", balance: 1000, minimumPayment: 100, apr: 0, dueDate: "2026-05-01", type: "debt", recurrence: "monthly", isPaidThisCycle: false },
        ],
        monthlyExtraPayment: 300, strategy: "snowball", startDate: "2026-05-01",
    });
    assertEqual(cardExtraWithLump.monthsToDebtFree, cardExtraAlone.monthsToDebtFree, "one-time BNPL doesn't decelerate a coexisting debt with extra>0 (R3 F2)");

    // Coverage — a weekly pay-in-4 ($100×4) clears in ~1 month (52/12 ≈ 4.33 installments/mo).
    const weeklyBnpl = projectDebtPayoff({
        debts: [{ id: "z", name: "Zip", balance: 400, minimumPayment: 100, apr: 0, dueDate: "2026-05-01", type: "bnpl", recurrence: "weekly", isPaidThisCycle: false }],
        monthlyExtraPayment: 0, strategy: "snowball", startDate: "2026-05-01",
    });
    assertEqual(weeklyBnpl.monthsToDebtFree, 1, "weekly BNPL clears in ~1 month");

    // R4 — the CHART-side coexisting-lump non-deceleration (the changed path that R3 F1/F2 left unasserted):
    // a $2000 one-time BNPL must not shift the card's chart zero-crossing (3 months at $400/mo), matching
    // the date engine and the card alone. Guards against a future regression re-adding the lump to the
    // chart's minimumsPaidThisMonth.
    const cardChartAlone = buildPayoffTrajectory({
        debts: [{ balance: 1000, minimumPayment: 100, apr: 0, type: "debt", recurrence: "monthly" }],
        monthlyExtraPayment: 300,
        strategy: "snowball",
    });
    const cardChartWithLump = buildPayoffTrajectory({
        debts: [
            { balance: 2000, minimumPayment: 2000, apr: 0, type: "bnpl", recurrence: "one-time" },
            { balance: 1000, minimumPayment: 100, apr: 0, type: "debt", recurrence: "monthly" },
        ],
        monthlyExtraPayment: 300,
        strategy: "snowball",
    });
    assertEqual(
        cardChartWithLump.find((p) => p.balance <= 0.01)?.month,
        cardChartAlone.find((p) => p.balance <= 0.01)?.month,
        "chart: one-time BNPL doesn't decelerate a coexisting debt with extra>0 (R4)",
    );

    console.log("✅ Debt projection regression tests passed.");
}

runDebtProjectionTests();
