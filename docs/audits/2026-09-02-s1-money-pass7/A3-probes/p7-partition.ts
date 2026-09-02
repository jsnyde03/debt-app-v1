// The §2.2 partition reconciliation from packages/core/guardian/testGuardianPartition.ts,
// re-run with the ONE arity that file never supplies: a debt with a NON-ZERO minimum.
import { allocatePaycheck, PROTECTED_CUSHION_CATEGORIES, PUT_TO_WORK_CATEGORIES, type AllocationCategory } from "@core/engine/allocatePaycheck";
import { scaleBnplMinimumsForWindow } from "@core/debt/bnplInstallment";

const DISCRETIONARY: AllocationCategory[] = [...PROTECTED_CUSHION_CATEGORIES, ...PUT_TO_WORK_CATEGORIES];
const sumBuckets = (r: any) => r.allocations.filter((a: any) => DISCRETIONARY.includes(a.category)).reduce((s: number, a: any) => s + a.amount, 0);
const discretionaryOf = (r: any) => Math.max(0, r.paycheckAmount - r.totalRequired - r.livingExpenseReserve);

function run(label: string, recurrence: string, minimumPayment: number, scale: boolean) {
  const debt: any = { id: "d1", name: "Visa", balance: 2000, minimumPayment, apr: 20, dueDate: "2026-06-02", type: "debt", recurrence, isPaidThisCycle: false };
  const debts = scale ? scaleBnplMinimumsForWindow([debt], "2026-06-01", "2026-07-01") : [debt];
  const r = allocatePaycheck({
    paycheckAmount: 500, currentDate: "2026-06-01", nextPaycheckDate: "2026-07-01",
    expenses: [], livingExpenses: [], debts, goals: [], strategy: "snowball", paycheckBuffer: 50,
  } as any);
  const buckets = Math.round(sumBuckets(r) * 100) / 100;
  const disc = Math.round(discretionaryOf(r) * 100) / 100;
  console.log(`${label}`);
  console.log(`   totalRequired=${r.totalRequired}  Σbuckets=${buckets}  discretionary=${disc}  ` +
    (buckets === disc ? "PARTITION HOLDS" : `PARTITION BROKEN by $${Math.round((buckets - disc) * 100) / 100}`));
}

run("monthly, minimumPayment 0   (the fixture's own arity)", "monthly", 0, false);
run("monthly, minimumPayment 100 (control)                ", "monthly", 100, false);
run("weekly,  minimumPayment 50, unscaled                 ", "weekly", 50, false);
run("weekly,  minimumPayment 50, SCALED as the app does   ", "weekly", 50, true);
