/**
 * Probe 6 — the brief's lead: "the required figure grew, so a user who previously saw no shortfall may
 * now see one. Is that surfaced honestly, or does some screen still print the old number beside the new?"
 * The checkable invariant: sum(unfundedRequiredItems) === shortfall, on a paycheck that cannot cover.
 */
import { allocatePaycheck } from "@core/engine/allocatePaycheck";
const C = "2026-10-01", N = "2026-11-01";
for (const pay of [3000, 200, 120, 60, 0]) {
  const r: any = allocatePaycheck({
    paycheckAmount: pay, currentDate: C, nextPaycheckDate: N,
    expenses: [], livingExpenses: [],
    debts: [{ id: "d1", name: "Weekly loan", balance: 5000, minimumPayment: 50, apr: 10, dueDate: "2026-10-02", type: "debt", recurrence: "weekly", isPaidThisCycle: false }],
    goals: [], strategy: "snowball", paycheckBuffer: 0,
  } as any);
  const unfunded = r.unfundedRequiredItems.reduce((s: number, i: any) => s + i.amount, 0);
  const rowSum = r.allocations.filter((a: any) => a.category === "minimum_debt").reduce((s: number, a: any) => s + a.amount, 0);
  const ok = Math.abs(unfunded - r.shortfall) < 0.005 && Math.abs(rowSum + unfunded - r.totalRequired) < 0.005;
  console.log(`paycheck $${String(pay).padEnd(5)} totalRequired $${String(r.totalRequired).padEnd(5)} row $${String(rowSum).padEnd(5)} unfunded $${String(unfunded).padEnd(5)} shortfall $${String(r.shortfall).padEnd(5)} ${ok ? "OK  row+unfunded=totalRequired and unfunded=shortfall" : "MISMATCH"}`);
}
