import { allocatePaycheck } from "@core/engine/allocatePaycheck";
// The EXACT fixture from packages/core/engine/testAllocation.ts:342 (`weeklyDebtUnderMonthly`).
const r = allocatePaycheck({
  paycheckAmount: 3000,
  currentDate: "2026-05-01",
  nextPaycheckDate: "2026-06-01",
  strategy: "snowball",
  expenses: [],
  debts: [{ id: "debt-weekly", name: "Weekly loan", balance: 2000, minimumPayment: 50, apr: 12,
    dueDate: "2026-05-04", type: "debt", recurrence: "weekly", isPaidThisCycle: false }],
  goals: [],
} as any);
console.log("totalRequired (the ONLY assertion) =", r.totalRequired);
console.log("allocations (asserted on by NOTHING):");
for (const a of r.allocations) console.log("   ", a.category.padEnd(16), a.amount, "|", a.label);
console.log("unfundedRequiredItems:", JSON.stringify(r.unfundedRequiredItems));
const min = r.allocations.filter((a: any) => a.category === "minimum_debt").reduce((s: number, a: any) => s + a.amount, 0);
console.log("SUM minimum_debt =", min, " vs totalRequired =", r.totalRequired, " DELTA =", r.totalRequired - min);
