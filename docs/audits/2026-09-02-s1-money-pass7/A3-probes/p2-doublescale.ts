import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { effectiveMinimumInWindow, scaleBnplMinimumsForWindow } from "@core/debt/bnplInstallment";

const START = "2026-09-01";
const END = "2026-10-01";

function run(label: string, debt: any, paycheck: number) {
  const scaled = scaleBnplMinimumsForWindow([debt] as any, START, END)[0] as any;
  const r = allocatePaycheck({
    paycheckAmount: paycheck,
    currentDate: START,
    nextPaycheckDate: END,
    expenses: [],
    debts: [scaled],
    goals: [],
    strategy: "snowball",
  } as any);
  console.log(`--- ${label} (paycheck $${paycheck})`);
  console.log("  stored minimumPayment        =", debt.minimumPayment);
  console.log("  scaled minimumPayment (app)  =", scaled.minimumPayment);
  console.log("  effMinInWindow(stored)       =", effectiveMinimumInWindow(debt, START, END));
  console.log("  effMinInWindow(scaled)       =", effectiveMinimumInWindow(scaled, START, END));
  console.log("  totalRequired                =", r.totalRequired);
  console.log("  shortfall                    =", r.shortfall);
  console.log("  remaining                    =", r.remaining);
  console.log("  allocations:", r.allocations.map((a: any) => `${a.category}:${a.amount}`).join("  "));
  console.log("  unfunded  :", r.unfundedRequiredItems.map((a: any) => `${a.category}:${a.amount}`).join("  "));
}

run("weekly plain debt min $50 bal $2000", {
  id: "d1", name: "Weekly Loan", balance: 2000, minimumPayment: 50, apr: 10,
  dueDate: "2026-09-02", type: "debt", recurrence: "weekly",
}, 500);

run("biweekly BNPL $100 x, bal $1200", {
  id: "d2", name: "Klarna", balance: 1200, minimumPayment: 100, apr: 0,
  dueDate: "2026-09-02", type: "bnpl", recurrence: "biweekly",
  scheduledPaymentAmount: 100, remainingPayments: 12,
}, 500);

run("monthly plain debt min $100 (control)", {
  id: "d3", name: "Card", balance: 2000, minimumPayment: 100, apr: 20,
  dueDate: "2026-09-10", type: "debt", recurrence: "monthly",
}, 500);
