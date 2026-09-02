import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { rolloverRequiredExpenses } from "@core/recurrence/rolloverPayCycle";

// A $50 bill the user simply never ticks. ONE variable: `recurrence`.
// Monthly payer, paydays on the 1st. Three consecutive real rollovers.
for (const recurrence of ["weekly", "monthly"] as const) {
  let expenses: any[] = [{ id: "e1", name: "Groceries", amount: 50, dueDate: "2026-09-02", recurrence, isPaidThisCycle: false }];
  const paydays = ["2026-09-01", "2026-10-01", "2026-11-01", "2026-12-01"];
  console.log(`--- recurrence=${recurrence}`);
  for (let i = 0; i < 3; i++) {
    const r = allocatePaycheck({
      paycheckAmount: 1000, currentDate: paydays[i], nextPaycheckDate: paydays[i + 1],
      expenses, debts: [], goals: [], strategy: "snowball",
    } as any);
    console.log(`  cycle ${i} [${paydays[i]} -> ${paydays[i + 1]}] storedDue=${expenses[0].dueDate}` +
      `  totalRequired=$${r.totalRequired}  shortfall=$${r.shortfall}` +
      `  rows=${r.allocations.filter((a: any) => a.category === "expense").length}` +
      `  unfunded=${r.unfundedRequiredItems.length}`);
    // The real rollover: nothing was ticked.
    expenses = rolloverRequiredExpenses(expenses as any, paydays[i + 1]) as any;
  }
}
