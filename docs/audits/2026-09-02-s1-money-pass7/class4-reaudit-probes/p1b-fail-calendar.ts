/** Probe 1b — on WHICH days of the year does inWindowMinimum.test.ts red, and on which assertion? */
import { allocatePaycheck } from "@core/engine/allocatePaycheck";
import { buildMultiCycleTimeline } from "@core/timeline/buildMultiCycleTimeline";
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayFrom = (base: Date, off: number) => { const d = new Date(base); d.setDate(d.getDate() + off); return iso(d); };
const MINIMUM = 50;
const shapes: any = {
  "installment-native": { type: "bnpl", bnplProvider: "Klarna", scheduledPaymentAmount: MINIMUM, remainingPayments: 40 },
  "fallback BNPL": { type: "bnpl", bnplProvider: "Afterpay" },
  "plain debt": { type: "debt" },
};
function run(base: Date, extra: any, recurrence: string) {
  const CURRENT = dayFrom(base, 0), NEXT = dayFrom(base, 28), DUE = dayFrom(base, 3);
  const debt: any = { id: "d1", name: "x", balance: 5000, minimumPayment: MINIMUM, apr: 0, dueDate: DUE, recurrence, ...extra };
  const result = allocatePaycheck({ paycheckAmount: 3000, currentDate: CURRENT, nextPaycheckDate: NEXT, expenses: [], livingExpenses: [], debts: [debt], goals: [], strategy: "snowball", paycheckBuffer: 50 } as any);
  const cycles = buildMultiCycleTimeline({ appliedTopUpSurplus: 0, result, requiredExpenses: [], debts: [debt], goals: [], livingExpenses: [], completedRecommendedActions: [], currentDate: CURRENT, nextPaycheckDate: NEXT, payCycleConfig: { payCycle: "monthly", monthlyPayDay: 1 }, strategy: "snowball", paycheckBuffer: 50, maxCycles: 2, projectedPaycheckAmount: 3000 } as any);
  return { CURRENT, NEXT, totalRequired: result.totalRequired, shortfall: result.shortfall, c0: cycles[0]?.essentials, c1: cycles[1]?.essentials, c1End: (cycles[1] as any)?.cycleEnd };
}
const start = new Date();
let redDays = 0; const byReason: Record<string, number> = {};
const sample: string[] = [];
for (let i = 0; i < 365; i++) {
  const base = new Date(start); base.setDate(base.getDate() + i);
  const reasons: string[] = [];
  for (const kind of Object.keys(shapes)) {
    for (const [rec, ch] of Object.entries({ weekly: 4, biweekly: 2, monthly: 1 })) {
      const r = run(base, shapes[kind], rec);
      if (r.totalRequired !== MINIMUM * (ch as number)) reasons.push(`row totalRequired ${kind}/${rec}`);
      if (r.shortfall !== 0) reasons.push(`row shortfall ${kind}/${rec}`);
    }
    const p = run(base, shapes[kind], "weekly");
    if (p.c0 !== 200) reasons.push(`proj c0 ${kind}`);
    if (p.c1 !== 200) reasons.push(`proj c1 ${kind} (c1 window ${p.NEXT}..${p.c1End}, essentials ${p.c1})`);
  }
  if (reasons.length) {
    redDays++;
    const key = reasons[0].replace(/\(.*\)/, "").trim();
    byReason[key] = (byReason[key] ?? 0) + 1;
    if (sample.length < 8) sample.push(`${iso(base)} -> ${reasons[0]}`);
  }
}
console.log(`RED on ${redDays} of 365 calendar days (${Math.round((redDays / 365) * 100)}%)`);
console.log("first failing assertion, tallied:"); for (const [k, v] of Object.entries(byReason)) console.log(`  ${v.toString().padStart(3)}  ${k}`);
console.log("samples:"); for (const s of sample) console.log("  " + s);
const today = new Date(); const t = run(today, shapes["plain debt"], "weekly");
console.log(`\nCONTROL — today ${iso(today)}: totalRequired ${t.totalRequired} c0 ${t.c0} c1 ${t.c1} (test:app is GREEN today, so the probe must agree)`);
