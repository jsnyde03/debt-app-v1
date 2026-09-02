import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { buildMultiCycleTimeline } from "@core/timeline/buildMultiCycleTimeline";
const START = "2026-09-01", END = "2026-10-01";
// ONE weekly grocery bill. ONE variable: `recurrence` weekly vs monthly.
for (const recurrence of ["weekly", "monthly"] as const) {
  const expenses = [{ id: "e1", name: "Groceries", amount: 50, dueDate: "2026-09-02", recurrence }];
  const result = allocatePaycheck({
    paycheckAmount: 3000, currentDate: START, nextPaycheckDate: END,
    expenses, debts: [], goals: [], strategy: "snowball", paycheckBuffer: 50,
  } as any);
  const c = buildMultiCycleTimeline({
    result, requiredExpenses: expenses as any, debts: [], goals: [],
    currentDate: START, nextPaycheckDate: END,
    payCycleConfig: { payCycle: "monthly", monthlyPayDay: 1 },
    strategy: "snowball", paycheckBuffer: 50, maxCycles: 1,
  } as any)[0];
  const expenseRows = c.items.filter((i: any) => i.type === "expense");
  console.log(`--- recurrence=${recurrence}`);
  console.log("  allocator totalRequired  =", result.totalRequired);
  console.log("  cycle.essentials         =", c.essentials);
  console.log("  expense ROWS in ledger   =", expenseRows.length, "summing", expenseRows.reduce((s: number, i: any) => s + i.amount, 0));
  console.log("  cycle.net                =", c.net);
  console.log("  cycle.endingBalance      =", c.endingBalance, "   GAP vs net =", c.endingBalance - c.net);
}
