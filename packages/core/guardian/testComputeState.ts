/**
 * Reconciliation tests for the unified Guardian state machine (2.4.6.1.2 · round-4 F4).
 * Floor-relative classification + hysteresis (downward immediate, upward requires clearing by BAND).
 */
import { baseState, computeState } from "@core/guardian/computeState";

let failures = 0;
function check(name: string, cond: boolean) {
	if (cond) return;
	failures++;
	console.error(`  ✗ ${name}`);
}

// floor 200 → at-risk line 100, floor+BAND 250, atRiskLine+BAND 150.

// ── base classification (floor-relative) ──
check("base: <half-floor → at-risk", baseState(50, 200) === "at-risk");
check("base: half-floor..floor → tight", baseState(150, 200) === "tight");
check("base: ≥floor → clear", baseState(250, 200) === "clear");
check("base: exactly floor → clear", baseState(200, 200) === "clear");
check("base: exactly at-risk line → tight (boundary is <, not ≤)", baseState(100, 200) === "tight");

// ── no priorBand → base ──
check("stateless read = base", computeState(150, 200) === "tight");
check("stateless read = base (null prior)", computeState(50, 200, null) === "at-risk");

// ── hysteresis: downward moves are IMMEDIATE ──
check("clear→tight immediate on dropping below floor", computeState(150, 200, "clear") === "tight");
check("clear→at-risk immediate on dropping below half-floor", computeState(50, 200, "clear") === "at-risk");
check("tight→at-risk immediate on breaching the at-risk line", computeState(80, 200, "tight") === "at-risk");

// ── hysteresis: upward moves require clearing the threshold by BAND (sticky) ──
check("tight stays tight while ≤ floor+BAND (no flap)", computeState(230, 200, "tight") === "tight");
check("tight→clear only when > floor+BAND", computeState(260, 200, "tight") === "clear");
check("at-risk stays at-risk while ≤ atRiskLine+BAND", computeState(130, 200, "at-risk") === "at-risk");
check("at-risk→tight when clearly above the at-risk line (but under floor+BAND)", computeState(170, 200, "at-risk") === "tight");
check("at-risk→clear when > floor+BAND", computeState(260, 200, "at-risk") === "clear");

// ── guards ──
check("NaN discretionary → treated as 0 → at-risk", computeState(NaN, 200) === "at-risk");
check("non-positive floor falls back to 200", computeState(300, 0) === "clear" && computeState(150, 0) === "tight");

if (failures === 0) console.log("✅ Guardian computeState (unified state machine) tests passed.");
else {
	console.error(`❌ ${failures} computeState test(s) failed.`);
	process.exit(1);
}
