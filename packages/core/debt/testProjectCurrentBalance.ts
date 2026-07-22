import {
  projectCurrentBalance,
  isDebtProjectedPaidOff,
  computeEstimateConfidence,
  ESTIMATE_AGING_DAYS,
  ESTIMATE_STALE_DAYS,
  type ProjectableDebt,
} from "./projectCurrentBalance";

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`  ✓ ${label}`);
}

function assertApprox(actual: number, expected: number, label: string, tolerance = 0.05) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`FAIL [${label}]: expected ~${expected}, got ${actual}`);
  }
  console.log(`  ✓ ${label}`);
}

function assertTrue(actual: boolean, label: string) {
  if (!actual) throw new Error(`FAIL [${label}]: expected true`);
  console.log(`  ✓ ${label}`);
}

function debt(overrides: Partial<ProjectableDebt> & { balance: number }): ProjectableDebt {
  return { apr: 0, minimumPayment: 0, type: "debt", ...overrides };
}

function runProjectCurrentBalanceTests() {
  console.log("Running projection auto-maintenance (2.3) tests...");

  // --- projectCurrentBalance: no-projection guards ---
  assertEqual(
    projectCurrentBalance(debt({ balance: 1000, apr: 20, minimumPayment: 50 }), "2026-06-01"),
    1000,
    "unverified debt (no lastVerifiedDate) shows the anchor as-is"
  );
  assertEqual(
    projectCurrentBalance(debt({ balance: 1000, apr: 20, minimumPayment: 50, lastVerifiedDate: "2026-06-01" }), "2026-06-01"),
    1000,
    "asOf == anchor date → anchor unchanged (zero elapsed)"
  );
  assertEqual(
    projectCurrentBalance(debt({ balance: 1000, apr: 20, minimumPayment: 50, lastVerifiedDate: "2026-06-01" }), "2026-05-01"),
    1000,
    "asOf BEFORE anchor date → anchor unchanged (never projects backward)"
  );
  assertEqual(
    projectCurrentBalance(debt({ balance: 0, apr: 20, minimumPayment: 50, lastVerifiedDate: "2026-01-01" }), "2026-06-01"),
    0,
    "zero anchor stays zero"
  );

  // --- projectCurrentBalance: interest accrues within a partial month (conservative bias, no payment) ---
  // $1000 @ 12% APR, no payment, 15 days elapsed. Month interest = $10; prorated 15/30.4375 ≈ 0.4928 → +$4.93.
  assertApprox(
    projectCurrentBalance(debt({ balance: 1000, apr: 12, minimumPayment: 0, lastVerifiedDate: "2026-01-01" }), "2026-01-16"),
    1004.93,
    "partial month accrues prorated interest only (balance ticks up mid-month)"
  );

  // --- projectCurrentBalance: one whole month + tiny fraction reconciles with applyDebtPaymentProjection ---
  // $1000 @ 12%, min $100, 31 days: step1 → 910; + frac(0.0185) interest on 910 (@$9.10/mo) ≈ +$0.17 → 910.17.
  assertApprox(
    projectCurrentBalance(debt({ balance: 1000, apr: 12, minimumPayment: 100, lastVerifiedDate: "2026-01-01" }), "2026-02-01"),
    910.17,
    "one whole month applies a full interest+minimum step, then prorates the remainder"
  );

  // --- projectCurrentBalance: negative amortization (interest > minimum) grows the balance (safe: over-states owed) ---
  // $10000 @ 30%, min $100, 31 days: step1 interest $250 → 10250, pay $100 → 10150; + frac interest.
  const negAm = projectCurrentBalance(
    debt({ balance: 10000, apr: 30, minimumPayment: 100, lastVerifiedDate: "2026-01-01" }),
    "2026-02-01"
  );
  assertTrue(negAm > 10000, "negative amortization: balance grows when interest exceeds the minimum (never understates)");
  assertApprox(negAm, 10154.69, "negative-amortization projected value");

  // --- projectCurrentBalance: BNPL never accrues interest despite a nonzero APR ---
  // $400 BNPL @ 24.99% (ignored), min $100, 90 days ≈ 2.96 months → 2 whole $100 steps → $200, no interest.
  assertApprox(
    projectCurrentBalance(
      debt({ balance: 400, apr: 24.99, minimumPayment: 100, type: "bnpl", lastVerifiedDate: "2026-01-01" }),
      "2026-04-01"
    ),
    200,
    "BNPL projects as pure principal — zero interest even with a nonzero APR"
  );

  // --- projectCurrentBalance: floors at zero, never negative ---
  assertEqual(
    projectCurrentBalance(debt({ balance: 180, apr: 0, minimumPayment: 100, lastVerifiedDate: "2026-01-01" }), "2026-06-01"),
    0,
    "an over-paid-down debt floors at $0, never negative"
  );

  // --- isDebtProjectedPaidOff ---
  // $180 @ 22.99%, min $30: pays down ~$26.5/mo → clears in ~7 months. At ~11 months out → projected $0.
  assertTrue(
    isDebtProjectedPaidOff(debt({ balance: 180, apr: 22.99, minimumPayment: 30, lastVerifiedDate: "2026-01-01" }), "2026-12-01"),
    "isDebtProjectedPaidOff true once the projection reaches $0 (the payoff-gate trigger)"
  );
  assertEqual(
    isDebtProjectedPaidOff(debt({ balance: 180, apr: 22.99, minimumPayment: 30, lastVerifiedDate: "2026-01-01" }), "2026-02-01"),
    false,
    "isDebtProjectedPaidOff false while the projection is still above $0"
  );
  assertEqual(
    isDebtProjectedPaidOff(debt({ balance: 0, apr: 22.99, minimumPayment: 30, lastVerifiedDate: "2026-01-01" }), "2026-12-01"),
    false,
    "isDebtProjectedPaidOff false for an already-confirmed $0 anchor (confirmed, not projected)"
  );

  // --- computeEstimateConfidence: staleness bands ---
  const c = (lastVerifiedDate: string) =>
    computeEstimateConfidence(debt({ balance: 1000, apr: 0, minimumPayment: 0, lastVerifiedDate }), "2026-02-20");
  assertEqual(c("2026-02-10").staleness, "fresh", `10 days < ${ESTIMATE_AGING_DAYS} → fresh`);
  assertEqual(c("2026-01-16").staleness, "aging", `35 days ≥ ${ESTIMATE_AGING_DAYS} → aging`);
  assertEqual(c("2026-01-01").staleness, "stale", `50 days ≥ ${ESTIMATE_STALE_DAYS} → stale (the payday re-verify gate)`);
  assertEqual(c("2026-02-10").daysSinceVerified, 10, "daysSinceVerified counts elapsed days");
  assertEqual(
    computeEstimateConfidence(debt({ balance: 1000, apr: 0, minimumPayment: 0 }), "2026-02-20").staleness,
    "fresh",
    "unverified debt reads as fresh with zero days (safe default)"
  );

  console.log("✅ Projection auto-maintenance (2.3) tests passed.");
}

runProjectCurrentBalanceTests();
