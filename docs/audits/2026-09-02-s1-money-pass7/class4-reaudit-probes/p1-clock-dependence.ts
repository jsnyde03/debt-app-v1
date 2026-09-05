/**
 * Probe 1 — is `inWindowMinimum.test.ts` date-stable?
 * It computes CURRENT=day(0), NEXT=day(28), DUE=day(3) from the CLOCK and asserts
 *   cycle 0 essentials == 200 AND cycle 1 essentials == 200 for a weekly $50 debt.
 * Cycle 1's window is [NEXT, getNextPaycheckDate(NEXT, monthly, monthlyPayDay=1)) — whose LENGTH
 * depends on where NEXT lands in the month. This walks 400 consecutive "today"s and reports.
 */
import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { buildMultiCycleTimeline } from "@core/timeline/buildMultiCycleTimeline";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayFrom = (base: Date, off: number) => { const d = new Date(base); d.setDate(d.getDate() + off); return iso(d); };

const MINIMUM = 50;
const shapes = [
  { kind: "installment-native", extra: { type: "bnpl", bnplProvider: "Klarna", scheduledPaymentAmount: MINIMUM, remainingPayments: 40 } },
  { kind: "fallback BNPL", extra: { type: "bnpl", bnplProvider: "Afterpay" } },
  { kind: "plain debt", extra: { type: "debt" } },
];

function run(base: Date, kind: string, extra: any, recurrence: string) {
  const CURRENT = dayFrom(base, 0), NEXT = dayFrom(base, 28), DUE = dayFrom(base, 3);
  const debt: any = { id: "d1", name: "x", balance: 5000, minimumPayment: MINIMUM, apr: 0, dueDate: DUE, recurrence, ...extra };
  const result = allocatePaycheck({
    paycheckAmount: 3000, currentDate: CURRENT, nextPaycheckDate: NEXT,
    expenses: [], livingExpenses: [], debts: [debt], goals: [],
    strategy: "snowball", paycheckBuffer: 50,
  } as any);
  const cycles = buildMultiCycleTimeline({
    appliedTopUpSurplus: 0, result, requiredExpenses: [], debts: [debt], goals: [], livingExpenses: [],
    completedRecommendedActions: [], currentDate: CURRENT, nextPaycheckDate: NEXT,
    payCycleConfig: { payCycle: "monthly", monthlyPayDay: 1 },
    strategy: "snowball", paycheckBuffer: 50, maxCycles: 2, projectedPaycheckAmount: 3000,
  } as any);
  return {
    CURRENT, NEXT,
    totalRequired: result.totalRequired, shortfall: result.shortfall,
    c0: cycles[0]?.essentials, c1: cycles[1]?.essentials,
    c1End: (cycles[1] as any)?.cycleEnd,
  };
}

const start = new Date(2026, 0, 1);
let bad = 0, checked = 0;
const firstFails: string[] = [];
for (let i = 0; i < 400; i++) {
  const base = new Date(start); base.setDate(base.getDate() + i);
  for (const s of shapes) {
    // the cadence rows the test asserts
    for (const [rec, charges] of Object.entries({ weekly: 4, biweekly: 2, monthly: 1 })) {
      const r = run(base, s.kind, s.extra, rec);
      checked++;
      const wantTotal = MINIMUM * (charges as number);
      const okTotal = r.totalRequired === wantTotal;
      const okShort = r.shortfall === 0;
      if (!okTotal || !okShort) {
        bad++;
        if (firstFails.length < 12) firstFails.push(`ASSERT-ROW  today=${r.CURRENT} ${s.kind} ${rec}: totalRequired=${r.totalRequired} want ${wantTotal} shortfall=${r.shortfall}`);
      }
    }
    // the projection rows: weekly only, cycles 0 and 1 both asserted == 200
    const p = run(base, s.kind, s.extra, "weekly");
    checked += 2;
    if (p.c0 !== 200) { bad++; if (firstFails.length < 12) firstFails.push(`PROJ-c0     today=${p.CURRENT} ${s.kind}: essentials=${p.c0} want 200`); }
    if (p.c1 !== 200) { bad++; if (firstFails.length < 12) firstFails.push(`PROJ-c1     today=${p.CURRENT} ${s.kind}: NEXT=${p.NEXT} c1End=${p.c1End} essentials=${p.c1} want 200`); }
  }
}
console.log(`checked ${checked} assertion-equivalents over 400 consecutive start dates`);
console.log(`FAILING: ${bad}`);
for (const f of firstFails) console.log("  " + f);
