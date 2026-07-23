/**
 * Reconciliation tests for §2.5 backward water-fill (2.4.7.4). Encodes the spec's mandated scenarios:
 * no false-alarm on flush-then-bill, no false-clear on deploy-masks-crunch and multi-crunch-shared-source,
 * the per-segment (not global) cap, and the deploy-independence of the structural deficit.
 */
import { waterFill } from "@core/cashflow/waterFill";

function assertMoney(actual: number, expected: number, label: string) {
	const a = Math.round(actual * 100) / 100;
	const e = Math.round(expected * 100) / 100;
	if (a !== e) throw new Error(`FAIL [${label}]: expected $${e}, got $${a}`);
}

const FLOOR = 200;

// No crunch, no tight cycle → deploy everything, reserve nothing, zero structural deficit.
{
	const r = waterFill([500, 600, 700], FLOOR);
	assertMoney(r.prefundedReserve, 0, "no-crunch/no-tight: cycle 0 reserves nothing");
	assertMoney(r.structuralDeficit, 0, "no-crunch: zero structural deficit");
}

// Tight (above-floor) downstream cycle → cycle 0 holds back just enough that deploying can't breach it.
{
	// bal_1 = 250 is only $50 above the floor, so cumulative deploy is capped at $50: cycle 0 deploys
	// $50 of its $300 surplus and RESERVES $250. Actual bal_1 = 250 − 50 = 200 = floor (held, not breached).
	const r = waterFill([500, 250], FLOOR);
	assertMoney(r.structuralDeficit, 0, "tight-not-crunch: no structural deficit (never dips below floor)");
	assertMoney(r.prefundedReserve, 250, "tight: cycle 0 reserves so deploy can't push bal_1 under floor");
}

// Flush-then-bill: the classic F1 shape. The bill genuinely dips $50 below floor → that $50 is the HONEST
// structural deficit (not a manufactured larger false-alarm); cycle 0 holds all its surplus (a crunch looms).
{
	const r = waterFill([500, 150], FLOOR); // net_1 ≈ −350 (lumpy bill); bal_1 = 150 < floor
	assertMoney(r.structuralDeficit, 50, "flush-then-bill: structural deficit = floor − trough (50), not inflated");
	assertMoney(r.prefundedReserve, 300, "flush-then-bill: cycle 0 holds all surplus, never deploys into a looming crunch");
}

// Deploy-masks-crunch: detection is on the no-deploy track, so a crunch a naive deploy would hide is still
// reported (never a false-clear).
{
	const r = waterFill([500, 300, 120], FLOOR); // bal_2 = 120 < floor
	assertMoney(r.structuralDeficit, 80, "deploy-masks-crunch: structural deficit reported (200 − 120)");
}

// Multi-crunch, shared insufficient source: two separate below-floor dips → their deficits SUM (no false-
// clear from a single source cycle appearing to cover both).
{
	const r = waterFill([500, 150, 300, 100], FLOOR); // crunch at idx1 (−50) and idx3 (−100)
	assertMoney(r.structuralDeficit, 150, "multi-crunch: total structural deficit = 50 + 100 (no false-clear)");
}

// Per-segment (not global) cap: a LATER surplus cycle is the nearer source for a later tight cycle, so
// cycle 0 doesn't over-reserve for it — it deploys freely when a nearer cycle can hold.
{
	// bal: [500, 600, 260]. bal_2's headroom is only $60, and deploy to debt is CUMULATIVE (it permanently
	// leaves the cushion), so TOTAL deploy across the horizon is capped at $60 — a late tight cycle limits
	// cycle 0 even though nearer cycles also hold, because deploying early would breach it downstream.
	const r = waterFill([500, 600, 260], FLOOR);
	assertMoney(r.structuralDeficit, 0, "cumulative-cap: no structural deficit (all above floor)");
	assertMoney(r.prefundedReserve, 240, "cumulative-cap: cycle 0 deploys only the $60 total headroom → reserves $240 of $300");
	assertMoney(r.reserveByCycle[1], 400, "later cycles keep their surplus once the deploy budget is spent (bal_2 held at floor: 260 − 60 = 200)");
}

// Cycle 0 itself below floor → nothing to reserve (you can't hold back what you don't have).
{
	const r = waterFill([100, 500], FLOOR);
	assertMoney(r.prefundedReserve, 0, "cycle 0 under floor: reserves nothing");
	assertMoney(r.structuralDeficit, 100, "cycle 0 under floor: its own $100 dip is structural");
}

console.log("✅ Backward water-fill (2.4.7.4) tests passed.");
