import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { scaleBnplMinimumsForWindow } from "@core/debt/bnplInstallment";
import { buildMultiCycleTimeline } from "@core/timeline/buildMultiCycleTimeline";

const START = "2026-09-01", END = "2026-10-01";

function forecast(label: string, expenses: any[], debts: any[]) {
  const scaled = scaleBnplMinimumsForWindow(debts as any, START, END);
  const result = allocatePaycheck({
    paycheckAmount: 3000, currentDate: START, nextPaycheckDate: END,
    expenses, debts: scaled, goals: [], strategy: "snowball", paycheckBuffer: 200,
  } as any);
  const cycles = buildMultiCycleTimeline({
    result, requiredExpenses: expenses as any, debts: debts as any, goals: [],
    currentDate: START, nextPaycheckDate: END,
    payCycleConfig: { payCycle: "monthly", monthlyPayDay: 1 },
    strategy: "snowball", paycheckBuffer: 200, maxCycles: 1,
  } as any);
  const c = cycles[0];
  console.log(`--- ${label}`);
  console.log("  allocator totalRequired =", result.totalRequired, " shortfall =", result.shortfall);
  console.log("  cycle.essentials        =", c.essentials, "  <- 'Expenses & essentials' receipt line");
  console.log("  cycle.net               =", c.net, "  <- band + water-fill substrate");
  console.log("  cycle.carriedBalance    =", c.carriedBalance);
  console.log("  cycle.endingBalance     =", c.endingBalance, " <- from the ledger rows");
  console.log("  guardianState           =", c.guardianState);
  console.log("  ledger rows:");
  for (const it of c.items) console.log("     ", it.type.padEnd(15), it.amount, "run:", it.runningCash, "|", it.label);
  console.log("  IDENTITY paycheck - essentials =", result.paycheckAmount - c.essentials, " vs endingBalance", c.endingBalance);
}

forecast("weekly EXPENSE $50 (4-5 occurrences), no debts", [
  { id: "e1", name: "Groceries", amount: 50, dueDate: "2026-09-02", recurrence: "weekly" },
], []);

forecast("weekly DEBT min $50 bal $2000, no expenses", [], [
  { id: "d1", name: "Weekly Loan", balance: 2000, minimumPayment: 50, apr: 10, dueDate: "2026-09-02", type: "debt", recurrence: "weekly" },
]);
