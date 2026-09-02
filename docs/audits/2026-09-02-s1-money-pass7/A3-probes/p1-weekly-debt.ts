import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { effectiveMinimumInWindow } from "@core/debt/bnplInstallment";

const debt: any = {
  id: "d1",
  name: "Weekly Loan",
  balance: 2000,
  minimumPayment: 50,
  apr: 10,
  dueDate: "2026-09-02",
  type: "debt",
  recurrence: "weekly",
};

const r = allocatePaycheck({
  paycheckAmount: 500,
  currentDate: "2026-09-01",
  nextPaycheckDate: "2026-10-01",
  expenses: [],
  debts: [debt],
  goals: [],
  strategy: "snowball",
} as any);

console.log("effectiveMinimumInWindow =", effectiveMinimumInWindow(debt, "2026-09-01", "2026-10-01"));
console.log("stored minimumPayment   =", debt.minimumPayment);
console.log("totalRequired           =", r.totalRequired);
console.log("shortfall               =", r.shortfall);
console.log("remaining               =", r.remaining);
console.log("allocations:");
for (const a of r.allocations) console.log("   ", a.category.padEnd(18), a.amount, "|", a.label);
console.log("unfundedRequiredItems:");
for (const a of r.unfundedRequiredItems) console.log("   ", a.category.padEnd(18), a.amount, "|", a.label);
const minLine = r.allocations.filter((a: any) => a.category === "minimum_debt").reduce((s: number, a: any) => s + a.amount, 0);
console.log("SUM minimum_debt allocated =", minLine);
