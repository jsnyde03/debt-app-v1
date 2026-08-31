import { buildDriftBaseline, computeDrift, shouldReAnchor, type DriftBaseline } from "./computeDrift";
import { requireFinite } from '../testing/assertNumeric';

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
  }
}
function assertClose(actual: number, expected: number, tol: number, label: string) {
  requireFinite(actual, label);
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${label} failed. Expected ~${expected} (±${tol}), received ${actual}`);
  }
}

// A simple linear plan: $12,000 → $0 over 12 months ($1,000/mo), anchored Jan 1 2026.
const baseline: DriftBaseline = {
  anchorDate: "2026-01-01",
  anchorBalance: 12000,
  debtCount: 2,
  payoffStrategy: "snowball",
  extraPayment: 500,
  projectedPoints: [
    { month: 0, balance: 12000 },
    { month: 12, balance: 0 },
  ],
  projectedDebtFreeDate: "Jan 2027",
};
// 181 days after the anchor → the plan projects ≈ $6,053 remaining.
const CUR = "2026-07-01";

function runComputeDriftTests() {
  // No usable baseline → null (new user / pre-v1.7) → "building your history…" empty state.
  assertEqual(computeDrift(null, { currentDate: CUR, currentBalance: 8000 }), null, "null baseline → null");
  assertEqual(
    computeDrift({ ...baseline, projectedPoints: [] }, { currentDate: CUR, currentBalance: 8000 }),
    null,
    "empty projected points → null",
  );

  // Behind: real balance ($8,000) exceeds the plan's projection (~$6,053) for today.
  const behind = computeDrift(baseline, { currentDate: CUR, currentBalance: 8000 })!;
  assertClose(behind.projectedBalanceToday, 6053.4, 1, "projected balance today");
  assertClose(behind.dollarsBehind, 1946.6, 1, "dollars behind (positive = owe more)");
  assertClose(behind.daysBehind, 59, 1, "days behind (positive)");
  assertEqual(behind.status, "behind", "status behind");
  assertEqual(behind.onTrack, false, "behind → not on track");

  // Ahead: real balance ($4,000) is below the plan's projection.
  const ahead = computeDrift(baseline, { currentDate: CUR, currentBalance: 4000 })!;
  assertClose(ahead.dollarsBehind, -2053.4, 1, "dollars ahead (negative)");
  assertClose(ahead.daysBehind, -62, 1, "days ahead (negative)");
  assertEqual(ahead.status, "ahead", "status ahead");

  // On track: within the tolerance band.
  const onTrack = computeDrift(baseline, { currentDate: CUR, currentBalance: 6100 })!;
  assertClose(onTrack.daysBehind, 1, 2, "on-track days ≈ 0");
  assertEqual(onTrack.status, "on_track", "status on_track");
  assertEqual(onTrack.onTrack, true, "onTrack true");

  // Balance grew past the anchor → pinned to month 0 (maximally behind), never NaN/negative-month.
  const grew = computeDrift(baseline, { currentDate: CUR, currentBalance: 13000 })!;
  assertClose(grew.daysBehind, 181, 1, "grew past anchor → ~elapsed days behind");
  assertEqual(grew.status, "behind", "grew → behind");

  // Exactly on plan → 0 drift (feed the projected value back in).
  const exact = computeDrift(baseline, { currentDate: CUR, currentBalance: 6053.4 })!;
  assertClose(exact.daysBehind, 0, 1, "exactly on plan → 0 days");
  assertClose(exact.dollarsBehind, 0, 1, "exactly on plan → $0");

  // buildDriftBaseline: anchorBalance = sum of POSITIVE debts; projected points seeded from the engine.
  const built = buildDriftBaseline({ cyclesPerMonth: 26 / 12,
    anchorDate: "2026-01-01",
    debts: [
      { balance: 5000, minimumPayment: 100, apr: 20 },
      { balance: 0, minimumPayment: 50, apr: 0 }, // paid off — excluded from the anchor balance
    ],
    payoffStrategy: "snowball",
    monthlyExtraPayment: 300,
    projectedDebtFreeDate: "Aug 2028",
  });
  assertEqual(built.anchorBalance, 5000, "baseline anchorBalance sums positive debts");
  assertEqual(built.debtCount, 2, "baseline debtCount = array length (a paid-off $0 debt still counts → payoff won't re-anchor)");
  assertEqual(built.projectedPoints[0].balance, 5000, "baseline projected month 0 = anchor balance");
  assertEqual(built.projectedPoints.length > 1, true, "baseline has a real projected trajectory");
  assertEqual(built.projectedDebtFreeDate, "Aug 2028", "baseline carries the debt-free date");

  // shouldReAnchor: material changes only (compares against the baseline's own frozen state).
  assertEqual(shouldReAnchor(null, { debtCount: 2, monthlyExtraPayment: 100, payoffStrategy: "snowball" }), true, "no baseline → re-anchor");
  assertEqual(shouldReAnchor(baseline, { debtCount: 3, monthlyExtraPayment: 500, payoffStrategy: "snowball" }), true, "debt added → re-anchor");
  assertEqual(shouldReAnchor(baseline, { debtCount: 2, monthlyExtraPayment: 500, payoffStrategy: "avalanche" }), true, "strategy switch → re-anchor");
  assertEqual(shouldReAnchor(baseline, { debtCount: 2, monthlyExtraPayment: 525, payoffStrategy: "snowball" }), false, "small extra change (5%) → no re-anchor");
  assertEqual(shouldReAnchor(baseline, { debtCount: 2, monthlyExtraPayment: 650, payoffStrategy: "snowball" }), true, "big extra change (30%) → re-anchor");

  console.log("✅ Drift Tracker (computeDrift) reconciliation tests passed.");
}

runComputeDriftTests();
