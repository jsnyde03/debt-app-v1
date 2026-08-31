import { calculateMonthlyInterest } from "../debt/calculateMonthlyInterest";
import { requireFinite } from './assertNumeric';
import { applyDebtPaymentProjection } from "../debt/applyDebtPaymentProjection";
import { projectDebtPayoff } from "../debt/projectDebtPayoff";
import { buildExtraPaymentAllocationPlan } from "../debt/extraPaymentPlan";
import { applyRolloverPayment } from "../debt/applyRolloverPayment";
import type { Debt } from "@core/storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, msg: string) {
    if (actual !== expected) {
        throw new Error(`FAIL [${msg}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
    console.log(`  ✓ ${msg}`);
}

function assertApprox(actual: number, expected: number, msg: string, tolerance = 0.01) {
    requireFinite(actual, msg);
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`FAIL [${msg}]: expected ~${expected}, got ${actual}`);
    }
    console.log(`  ✓ ${msg}`);
}

// --- calculateMonthlyInterest ---

function testMonthlyInterest_standard() {
    // $1200 at 12% APR → 1% monthly → $12/month
    assertApprox(calculateMonthlyInterest(1200, 12), 12, "1200 at 12% APR = $12/month");
}

function testMonthlyInterest_highApr() {
    // $1000 at 22.99% APR → 22.99/12 % monthly ≈ $19.16
    assertApprox(calculateMonthlyInterest(1000, 22.99), 19.16, "$1000 at 22.99% ≈ $19.16/month");
}

function testMonthlyInterest_zeroAprReturnsZero() {
    assertEqual(calculateMonthlyInterest(1000, 0), 0, "APR of 0 yields zero interest");
}

function testMonthlyInterest_negativeAprReturnsZero() {
    assertEqual(calculateMonthlyInterest(1000, -5), 0, "negative APR yields zero interest");
}

function testMonthlyInterest_zeroBalanceReturnsZero() {
    assertEqual(calculateMonthlyInterest(0, 22.99), 0, "zero balance yields zero interest");
}

function testMonthlyInterest_negativeBalanceReturnsZero() {
    assertEqual(calculateMonthlyInterest(-100, 22.99), 0, "negative balance yields zero interest");
}

function testMonthlyInterest_roundsToTwoCents() {
    // $100 at 1.99% APR = 100 * 0.0199/12 = 0.165833... → rounds to $0.17
    assertApprox(calculateMonthlyInterest(100, 1.99), 0.17, "rounds to 2 decimal places");
}

// --- applyDebtPaymentProjection ---

function testPaymentProjection_interestAppliedBeforePayment() {
    // balance $1000, 12% APR → interest $10 → balance becomes $1010
    // payment $100 → new balance $910
    const result = applyDebtPaymentProjection({ balance: 1000, apr: 12, payment: 100 });
    assertApprox(result.interest, 10, "interest = $10 at 12% APR");
    assertApprox(result.balanceAfterInterest, 1010, "balance increases by interest before payment");
    assertApprox(result.projectedBalance, 910, "payment applied after interest");
}

function testPaymentProjection_paymentCappedAtBalancePlusInterest() {
    // balance $100, APR 12% → interest $1 → balanceAfterInterest $101
    // overpayment of $500 → capped at $101
    const result = applyDebtPaymentProjection({ balance: 100, apr: 12, payment: 500 });
    assertApprox(result.payment, 101, "payment capped at balance-after-interest");
    assertApprox(result.projectedBalance, 0, "projected balance = 0 after overpayment");
}

function testPaymentProjection_zeroPaymentAccruesInterestOnly() {
    const result = applyDebtPaymentProjection({ balance: 1000, apr: 12, payment: 0 });
    assertApprox(result.projectedBalance, 1010, "zero payment leaves balance with interest added");
}

function testPaymentProjection_zeroBalanceNothingChanges() {
    const result = applyDebtPaymentProjection({ balance: 0, apr: 22.99, payment: 100 });
    assertEqual(result.interest, 0, "zero balance has zero interest");
    assertEqual(result.projectedBalance, 0, "zero balance stays zero regardless of payment");
    assertEqual(result.payment, 0, "payment is zero when balance is zero");
}

function testPaymentProjection_zeroAprInterestFree() {
    const result = applyDebtPaymentProjection({ balance: 500, apr: 0, payment: 100 });
    assertEqual(result.interest, 0, "zero APR = zero interest");
    assertApprox(result.balanceAfterInterest, 500, "balance unchanged by interest at 0% APR");
    assertApprox(result.projectedBalance, 400, "payment reduces balance directly");
}

// --- projectDebtPayoff ---

function makeDebt(overrides: {
    id: string;
    name: string;
    balance: number;
    apr: number;
    minimumPayment: number;
    type?: "debt" | "bnpl";
}) {
    return {
        id: overrides.id,
        name: overrides.name,
        balance: overrides.balance,
        minimumPayment: overrides.minimumPayment,
        apr: overrides.apr,
        dueDate: "2026-06-10",
        type: overrides.type ?? ("debt" as const),
        recurrence: "monthly" as const,
        isAutopay: false,
        isPaidThisCycle: false,
        minimumPaidThisCycle: false,
    };
}

function testProjectDebtPayoff_snowballPaysSmallestFirst() {
    const debts = [
        makeDebt({ id: "d1", name: "BigVisa", balance: 3000, apr: 22.99, minimumPayment: 75 }),
        makeDebt({ id: "d2", name: "SmallCard", balance: 500, apr: 5, minimumPayment: 25 }),
    ];
    const result = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        debts,
        monthlyExtraPayment: 200,
        strategy: "snowball",
        startDate: "2026-06-01",
    });
    // SmallCard ($500 at 5%) should pay off before BigVisa ($3000 at 22.99%)
    const smallIdx = result.payoffOrder.indexOf("SmallCard");
    const bigIdx = result.payoffOrder.indexOf("BigVisa");
    if (smallIdx === -1 || bigIdx === -1) throw new Error("FAIL: both debts must appear in payoff order");
    if (smallIdx >= bigIdx) throw new Error("FAIL: snowball should pay SmallCard before BigVisa");
    console.log("  ✓ snowball pays smallest balance first");
}

function testProjectDebtPayoff_avalanchePaysHighestAprFirst() {
    const debts = [
        makeDebt({ id: "d1", name: "LowAprDebt", balance: 500, apr: 5, minimumPayment: 25 }),
        makeDebt({ id: "d2", name: "HighAprDebt", balance: 3000, apr: 22.99, minimumPayment: 75 }),
    ];
    const result = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        debts,
        monthlyExtraPayment: 200,
        strategy: "avalanche",
        startDate: "2026-06-01",
    });
    // HighAprDebt (22.99%) should receive extra payment first, but LowAprDebt may pay off first
    // from minimums alone. The key is HighAprDebt gets extra payment applied — it will be in the list.
    if (!result.payoffOrder.includes("HighAprDebt")) throw new Error("FAIL: HighAprDebt must appear in payoff order");
    if (!result.payoffOrder.includes("LowAprDebt")) throw new Error("FAIL: LowAprDebt must appear in payoff order");
    // Avalanche should save more interest than snowball for this debt mix
    const snowballResult = projectDebtPayoff({ cyclesPerMonth: 26 / 12, debts, monthlyExtraPayment: 200, strategy: "snowball", startDate: "2026-06-01" });
    if (result.totalInterestPaid >= snowballResult.totalInterestPaid) {
        throw new Error(`FAIL: avalanche should save more interest than snowball for high-APR debt target`);
    }
    console.log("  ✓ avalanche pays highest APR first, saving more interest");
}

function testProjectDebtPayoff_avalancheTiebreakerUsesSmallestBalance() {
    // Two debts with identical APR — avalanche tiebreaker should target smaller balance first
    const debts = [
        makeDebt({ id: "d1", name: "LargerBalance", balance: 1000, apr: 22.99, minimumPayment: 30 }),
        makeDebt({ id: "d2", name: "SmallerBalance", balance: 300, apr: 22.99, minimumPayment: 20 }),
    ];
    const result = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        debts,
        monthlyExtraPayment: 200,
        strategy: "avalanche",
        startDate: "2026-06-01",
    });
    // SmallerBalance should pay off first since APR is equal and tiebreaker is balance (asc)
    const smallerIdx = result.payoffOrder.indexOf("SmallerBalance");
    const largerIdx = result.payoffOrder.indexOf("LargerBalance");
    if (smallerIdx === -1 || largerIdx === -1) throw new Error("FAIL: both debts must appear in payoff order");
    if (smallerIdx >= largerIdx) {
        throw new Error("FAIL: avalanche tiebreaker should pay SmallerBalance before LargerBalance when APRs are equal");
    }
    console.log("  ✓ avalanche tiebreaker targets smaller balance when APRs are equal");
}

function testProjectDebtPayoff_cannotAmortize() {
    // Payment so small that interest exceeds it — will never pay off
    const debts = [
        makeDebt({ id: "d1", name: "TrapDebt", balance: 10000, apr: 25, minimumPayment: 1 }),
    ];
    const result = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        debts,
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-06-01",
    });
    assertEqual(result.estimatedDebtFreeDate, "Unable to estimate", "cannot amortize when interest exceeds payment");
    assertEqual(result.totalInterestPaid, 0, "totalInterestPaid is 0 when cannot amortize");
}

function testProjectDebtPayoff_singleDebtPayoffDate() {
    // $600 debt at 0% APR, $100/month minimum — should pay off in exactly 6 months
    const debts = [
        makeDebt({ id: "d1", name: "ZeroInterest", balance: 600, apr: 0, minimumPayment: 100 }),
    ];
    const result = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        debts,
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-06-01",
    });
    assertEqual(result.monthsToDebtFree, 6, "6 months to pay off $600 at $100/month with 0% APR");
    assertEqual(result.totalInterestPaid, 0, "zero interest paid on 0% APR debt");
}

function testProjectDebtPayoff_bnplNeverAccruesInterestEvenWithNonzeroApr() {
    // A BNPL debt with a mistakenly-entered/defaulted nonzero APR must never
    // accrue interest - real BNPL plans are fixed-installment, interest-free.
    const debts = [
        makeDebt({ id: "d1", name: "BnplPlan", balance: 400, apr: 24.99, minimumPayment: 100, type: "bnpl" }),
    ];
    const result = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        debts,
        monthlyExtraPayment: 0,
        strategy: "snowball",
        startDate: "2026-06-01",
    });
    assertEqual(result.totalInterestPaid, 0, "BNPL debt accrues zero interest despite nonzero APR");
    assertEqual(result.monthsToDebtFree, 4, "BNPL payoff is pure principal: $400 at $100/month = 4 months");
}

function testProjectDebtPayoff_payoffOrderContainsAllDebts() {
    const debts = [
        makeDebt({ id: "d1", name: "DebtA", balance: 1000, apr: 10, minimumPayment: 50 }),
        makeDebt({ id: "d2", name: "DebtB", balance: 500, apr: 15, minimumPayment: 30 }),
        makeDebt({ id: "d3", name: "DebtC", balance: 250, apr: 5, minimumPayment: 20 }),
    ];
    const result = projectDebtPayoff({ cyclesPerMonth: 26 / 12,
        debts,
        monthlyExtraPayment: 100,
        strategy: "snowball",
        startDate: "2026-06-01",
    });
    if (result.payoffOrder.length !== 3) throw new Error(`FAIL: all 3 debts should appear in payoff order, got ${result.payoffOrder.length}`);
    console.log("  ✓ all debts appear in payoff order");
}

// --- applyRolloverPayment (pay-cycle rollover balance math) ---

function testRollover_interestPlusMinimumPlusSnowball() {
    // $1000 balance, 12% APR -> $10 interest -> $1010. Minimum $50 paid,
    // snowball $100 completed this cycle -> new balance should be $860.
    const debt = makeDebt({ id: "d1", name: "RolloverDebt", balance: 1000, apr: 12, minimumPayment: 50 });
    const result = applyRolloverPayment({ ...debt, minimumPaidThisCycle: true }, 100, "monthly");
    assertApprox(result.balance, 860, "rollover: interest + minimum + snowball nets to expected balance");
}

function testRollover_minimumNotPaidStillAccruesInterestOnly() {
    // Minimum NOT paid this cycle -> only interest accrues, no payment deducted.
    const debt = makeDebt({ id: "d1", name: "UnpaidDebt", balance: 1000, apr: 12, minimumPayment: 50 });
    const result = applyRolloverPayment({ ...debt, minimumPaidThisCycle: false }, 0, "monthly");
    assertApprox(result.balance, 1010, "rollover: unpaid minimum leaves balance at interest-only increase");
}

function testRollover_bnplNeverAccruesInterestOnRollover() {
    const debt = makeDebt({ id: "d1", name: "BnplRollover", balance: 400, apr: 24.99, minimumPayment: 100, type: "bnpl" });
    const result = applyRolloverPayment({ ...debt, minimumPaidThisCycle: true }, 0, "monthly");
    assertApprox(result.balance, 300, "rollover: BNPL deducts payment with zero interest despite nonzero APR");
}

function testRollover_zeroBalanceDebtUnchanged() {
    const debt = makeDebt({ id: "d1", name: "PaidOffDebt", balance: 0, apr: 22.99, minimumPayment: 50 });
    const result = applyRolloverPayment(debt, 0, "monthly");
    assertEqual(result.balance, 0, "rollover: zero-balance debt stays at zero, no math applied");
}

function testRollover_paymentNeverDrivesBalanceNegative() {
    // Snowball amount larger than the remaining balance after interest -
    // balance must floor at zero, never go negative.
    const debt = makeDebt({ id: "d1", name: "OverpaidDebt", balance: 50, apr: 0, minimumPayment: 50 });
    const result = applyRolloverPayment({ ...debt, minimumPaidThisCycle: true }, 200, "monthly");
    assertEqual(result.balance, 0, "rollover: overpayment floors balance at zero, never negative");
}

function testRollover_displayedPayoffClearsToZeroNoInterestResidual() {
    // The v1.6 display↔rollover seam: the app shows/recommends interest-free
    // balances, so paying the full pre-interest balance reads as "paid off." A
    // final cycle's interest must NOT leave a few-dollar residual that reappears
    // next cycle (and suppresses the paid-off celebration). $300 @ 22% APR,
    // minimum $50 paid + snowball $250 = the full $300 pre-interest balance.
    const debt = makeDebt({ id: "d1", name: "FinalPayoff", balance: 300, apr: 22, minimumPayment: 50 });
    const result = applyRolloverPayment({ ...debt, minimumPaidThisCycle: true }, 250, "biweekly");
    assertEqual(result.balance, 0, "rollover: a fully-paid (pre-interest) debt clears to exactly 0, no interest residual");
}

function testRollover_perCycleInterestByCadence() {
    // $1000 @ 12% APR, no payment. Monthly interest is $10. A rollover is one
    // PAYCHECK, so a biweekly user must accrue one biweekly period of interest
    // (1000*0.12/26 ≈ $4.62), not a full month — the S1 fix.
    const debt = makeDebt({ id: "d1", name: "CadenceDebt", balance: 1000, apr: 12, minimumPayment: 0 });
    const base = { ...debt, minimumPaidThisCycle: false as const };

    assertApprox(applyRolloverPayment(base, 0, "monthly").balance, 1010, "monthly rollover accrues a full month of interest");
    assertApprox(applyRolloverPayment(base, 0, "biweekly").balance, 1004.62, "biweekly rollover accrues one biweekly period (~half a month)");
    assertApprox(applyRolloverPayment(base, 0, "weekly").balance, 1002.31, "weekly rollover accrues one weekly period (~quarter month)");
    assertApprox(applyRolloverPayment(base, 0, "semimonthly").balance, 1005, "semimonthly rollover accrues half a month");
}

function testRollover_yearOfBiweeklyRollsUpToAnnualInterest() {
    // 26 biweekly rollovers with no payment should land near ONE year of interest
    // (~$1127 at 12% biweekly-compounded), NOT the ~$1295 the old full-month-per-
    // rollover bug produced. This is the reconciliation with the monthly projection.
    const debt = makeDebt({ id: "d1", name: "YearDebt", balance: 1000, apr: 12, minimumPayment: 0 });
    let d: Debt = { ...debt, minimumPaidThisCycle: false };
    for (let i = 0; i < 26; i += 1) {
        d = applyRolloverPayment(d, 0, "biweekly");
    }
    assertApprox(d.balance, 1127.2, "a year of biweekly rollovers accrues ~one year of interest, not ~2.17x", 1);
}

function testRollover_bnplCrossCadencePaysDownInWindowCount() {
    // AS.2 (whole-phase after-scan) — a monthly-paid user with a biweekly installment-native BNPL:
    // ~2 installments fall in the month + the allocator RESERVES 2× cash, so the rollover must pay the
    // balance down 2 installments (not 1) or it drifts high every cycle. $400 (4×$100 biweekly), window
    // Jan 1–Feb 1 holds 2 charges (due Jan 5, Jan 19) → -$200 → $200, remaining 4→2.
    const bnpl = makeDebt({ id: "d1", name: "Klarna", balance: 400, apr: 0, minimumPayment: 100, type: "bnpl" });
    const native: Debt = { ...bnpl, dueDate: "2026-01-05", recurrence: "biweekly", scheduledPaymentAmount: 100, remainingPayments: 4, minimumPaidThisCycle: true };
    const scaled = applyRolloverPayment(native, 0, "monthly", "2026-01-01", "2026-02-01");
    assertApprox(scaled.balance, 200, "AS.2: cross-cadence BNPL rollover pays down the in-window count (2 installments), not 1");
    assertEqual(scaled.remainingPayments, 2, "AS.2: remaining advances by the in-window installments (4 -> 2)");
    // Aligned (a biweekly-paid user, one charge in the window) still pays exactly one installment.
    const aligned = applyRolloverPayment(native, 0, "biweekly", "2026-01-01", "2026-01-15");
    assertApprox(aligned.balance, 300, "AS.2: aligned window (1 installment) pays down exactly 1");
    // No window passed (legacy callers) → unchanged one-installment behavior.
    const noWindow = applyRolloverPayment(native, 0, "monthly");
    assertApprox(noWindow.balance, 300, "AS.2: no window → falls back to one installment (backward compatible)");
}

// --- buildExtraPaymentAllocationPlan ---

function testExtraPaymentPlan_snowballTargetsSmallestBalance() {
    const debts = [
        { id: "d1", name: "BigDebt", balance: 3000, apr: 22.99 },
        { id: "d2", name: "SmallDebt", balance: 200, apr: 5 },
    ];
    const plan = buildExtraPaymentAllocationPlan({ debts, amount: 100, strategy: "snowball" });
    assertEqual(plan[0].debtId, "d2", "snowball targets smallest balance first");
}

function testExtraPaymentPlan_avalancheTargetsHighestApr() {
    const debts = [
        { id: "d1", name: "LowApr", balance: 200, apr: 3 },
        { id: "d2", name: "HighApr", balance: 3000, apr: 22.99 },
    ];
    const plan = buildExtraPaymentAllocationPlan({ debts, amount: 100, strategy: "avalanche" });
    assertEqual(plan[0].debtId, "d2", "avalanche targets highest APR first");
}

function testExtraPaymentPlan_avalancheTiebreakerOnSameApr() {
    const debts = [
        { id: "d1", name: "BiggerSameApr", balance: 1000, apr: 19.99 },
        { id: "d2", name: "SmallerSameApr", balance: 300, apr: 19.99 },
    ];
    const plan = buildExtraPaymentAllocationPlan({ debts, amount: 100, strategy: "avalanche" });
    assertEqual(plan[0].debtId, "d2", "avalanche tiebreaker: same APR → smaller balance targeted first");
}

function testExtraPaymentPlan_spilloverToNextDebt() {
    const debts = [
        { id: "d1", name: "SmallDebt", balance: 150, apr: 5 },
        { id: "d2", name: "BigDebt", balance: 2000, apr: 22.99 },
    ];
    // $250 extra: $150 to SmallDebt (pays it off), $100 spills to BigDebt
    const plan = buildExtraPaymentAllocationPlan({ debts, amount: 250, strategy: "snowball" });
    assertEqual(plan.length, 2, "both debts receive allocations when first is paid off with spillover");
    assertEqual(plan[0].debtId, "d1", "first allocation to SmallDebt");
    assertEqual(plan[0].isPaidOff, true, "SmallDebt is paid off");
    assertApprox(plan[0].amount, 150, "SmallDebt receives $150 (full balance)");
    assertApprox(plan[1].amount, 100, "remaining $100 spills to BigDebt");
    assertEqual(plan[1].isPaidOff, false, "BigDebt is not paid off");
}

function testExtraPaymentPlan_exactPayoffAmount() {
    const debts = [
        { id: "d1", name: "ExactDebt", balance: 500, apr: 10 },
    ];
    const plan = buildExtraPaymentAllocationPlan({ debts, amount: 500, strategy: "snowball" });
    assertEqual(plan[0].isPaidOff, true, "debt is marked paid off when amount equals balance exactly");
    assertApprox(plan[0].remainingBalanceAfterPayment, 0, "remaining balance is zero");
}

function testExtraPaymentPlan_zeroAmountReturnsEmpty() {
    const debts = [
        { id: "d1", name: "Debt", balance: 500, apr: 10 },
    ];
    const plan = buildExtraPaymentAllocationPlan({ debts, amount: 0, strategy: "snowball" });
    assertEqual(plan.length, 0, "zero extra payment results in no allocations");
}

function testExtraPaymentPlan_skipsZeroBalanceDebts() {
    const debts = [
        { id: "d1", name: "PaidOff", balance: 0, apr: 10 },
        { id: "d2", name: "ActiveDebt", balance: 500, apr: 15 },
    ];
    const plan = buildExtraPaymentAllocationPlan({ debts, amount: 100, strategy: "snowball" });
    assertEqual(plan.length, 1, "paid-off debt (zero balance) excluded from plan");
    assertEqual(plan[0].debtId, "d2", "allocation goes to active debt");
}

export function runDebtMathRegressionTests() {
    console.log("Running debt math regression tests...");

    testMonthlyInterest_standard();
    testMonthlyInterest_highApr();
    testMonthlyInterest_zeroAprReturnsZero();
    testMonthlyInterest_negativeAprReturnsZero();
    testMonthlyInterest_zeroBalanceReturnsZero();
    testMonthlyInterest_negativeBalanceReturnsZero();
    testMonthlyInterest_roundsToTwoCents();

    testPaymentProjection_interestAppliedBeforePayment();
    testPaymentProjection_paymentCappedAtBalancePlusInterest();
    testPaymentProjection_zeroPaymentAccruesInterestOnly();
    testPaymentProjection_zeroBalanceNothingChanges();
    testPaymentProjection_zeroAprInterestFree();

    testProjectDebtPayoff_snowballPaysSmallestFirst();
    testProjectDebtPayoff_avalanchePaysHighestAprFirst();
    testProjectDebtPayoff_avalancheTiebreakerUsesSmallestBalance();
    testProjectDebtPayoff_cannotAmortize();
    testProjectDebtPayoff_singleDebtPayoffDate();
    testProjectDebtPayoff_bnplNeverAccruesInterestEvenWithNonzeroApr();
    testProjectDebtPayoff_payoffOrderContainsAllDebts();

    testRollover_interestPlusMinimumPlusSnowball();
    testRollover_minimumNotPaidStillAccruesInterestOnly();
    testRollover_bnplNeverAccruesInterestOnRollover();
    testRollover_zeroBalanceDebtUnchanged();
    testRollover_paymentNeverDrivesBalanceNegative();
    testRollover_perCycleInterestByCadence();
    testRollover_bnplCrossCadencePaysDownInWindowCount();
    testRollover_displayedPayoffClearsToZeroNoInterestResidual();
    testRollover_yearOfBiweeklyRollsUpToAnnualInterest();

    testExtraPaymentPlan_snowballTargetsSmallestBalance();
    testExtraPaymentPlan_avalancheTargetsHighestApr();
    testExtraPaymentPlan_avalancheTiebreakerOnSameApr();
    testExtraPaymentPlan_spilloverToNextDebt();
    testExtraPaymentPlan_exactPayoffAmount();
    testExtraPaymentPlan_zeroAmountReturnsEmpty();
    testExtraPaymentPlan_skipsZeroBalanceDebts();

    console.log("✅ All debt math regression tests passed.");
}

runDebtMathRegressionTests();
