import { effectiveMinimumInWindow, bnplInstallmentsInWindow } from "@core/debt/bnplInstallment";
import { buildCycleSnapshot } from "@core/history/buildCycleSnapshot";

// The EXACT `monthly` control fixture from testPayCycleHistoryRegression.ts:152.
const monthly: any = { id: "card", name: "card", balance: 1000, minimumPayment: 100,
  dueDate: "2026-06-01", apr: 20, type: "debt", recurrence: "monthly", minimumPaidThisCycle: true };
const S = "2026-01-01", E = "2026-02-01";
console.log("window                       =", S, "->", E);
console.log("fixture dueDate              =", monthly.dueDate, " (FIVE MONTHS AFTER the window ends)");
console.log("bnplInstallmentsInWindow     =", bnplInstallmentsInWindow(monthly, S, E), " <- ZERO occurrences in the window");
console.log("effectiveMinimumInWindow     =", effectiveMinimumInWindow(monthly, S, E), " <- comes from Math.max(1, 0), not from counting");
console.log("snapshot totalPaidThisCycle  =", buildCycleSnapshot({
  cycleEndDate: E, debts: [monthly], completedRecommendedActions: [],
  payoffStrategy: "snowball", allRequiredMet: true, windowStartISO: S, windowEndISO: E,
} as any).totalPaidThisCycle);

// The same fixture with a due date INSIDE the window - what the assertion says it is testing.
const inWindow = { ...monthly, dueDate: "2026-01-05" };
console.log("--- with dueDate 2026-01-05 (inside the window)");
console.log("bnplInstallmentsInWindow     =", bnplInstallmentsInWindow(inWindow, S, E));
console.log("effectiveMinimumInWindow     =", effectiveMinimumInWindow(inWindow, S, E));
