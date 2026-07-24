/**
 * Reconciliation tests for §2.3 income learning (2.4.7.8): shrinkage floor below N=12, 12th percentile at
 * N≥12, a smoothed handoff between them, and outlier-robustness.
 */
import { suggestLean, LEARNING_N } from "@core/income/suggestLean";

function assertMoney(actual: number, expected: number, label: string) {
	const a = Math.round(actual * 100) / 100;
	const e = Math.round(expected * 100) / 100;
	if (a !== e) throw new Error(`FAIL [${label}]: expected $${e}, got $${a}`);
}
function assertTrue(cond: boolean, label: string) {
	if (!cond) throw new Error(`FAIL [${label}]`);
}

// Nothing to learn yet → current lean unchanged.
assertMoney(suggestLean([], 2000, 1500).suggestedLean, 1500, "N=0 → keeps the current lean");

// Below N=12 → the shrinkage floor (typical × 0.85), NOT a noisy percentile of few points.
{
	const s = suggestLean([1800, 1900, 2000, 2100, 1850, 1950], 2000, 1500);
	assertMoney(s.suggestedLean, 1700, "N<12 → shrinkage floor = typical(2000) × 0.85");
	assertTrue(s.n === 6, "reports the actual count");
}
// Below N, no typical entered → anchor on the observed max, then haircut.
assertMoney(suggestLean([2000, 2100, 1900], 0, 1500).suggestedLean, 1785, "N<12, no typical → max(2100) × 0.85");

// At/above N=12+span (18) → the pure 12th percentile.
{
	const many = Array.from({ length: 26 }, (_, i) => 1500 + i * 100); // 1500..4000
	// quantile(sorted, 0.12): pos = 25×0.12 = 3.0 → sorted[3] = 1800.
	assertMoney(suggestLean(many, 2500, 1500).suggestedLean, 1800, "N≥18 → pure 12th percentile (1800), not the 2125 shrinkage");
}

// Outlier-robust: one wild high value barely moves the low percentile (never inflates lean).
{
	const many = Array.from({ length: 26 }, (_, i) => 1500 + i * 100).concat([50000]);
	assertTrue(suggestLean(many, 2500, 1500).suggestedLean < 2000, "a wild high entry can't inflate lean (percentile ignores it)");
}

// Smoothed handoff (N=15, mid-window) → strictly BETWEEN the shrinkage and the percentile (no lurch).
{
	const fifteen = Array.from({ length: 15 }, (_, i) => 1500 + i * 100); // 1500..2900
	const s = suggestLean(fifteen, 2500, 1500).suggestedLean;
	// shrinkage = 2125; 12th pct of 15 ≈ 1668; w = (15−12)/6 = 0.5 → ≈ 1896.5.
	assertTrue(s > 1668 && s < 2125, "N=15 handoff blends (between percentile 1668 and shrinkage 2125)");
	assertMoney(s, 1896.5, "N=15 handoff = 0.5·shrinkage + 0.5·percentile");
}

// The handoff is monotonic toward the percentile as N grows (at N=12 it's pure shrinkage).
assertMoney(suggestLean(Array.from({ length: LEARNING_N }, () => 1600), 2000, 1500).suggestedLean, 1700, "exactly N=12 → still shrinkage (w=0), no lurch");

console.log("✅ Income-learning suggestLean (2.4.7.8) tests passed.");
