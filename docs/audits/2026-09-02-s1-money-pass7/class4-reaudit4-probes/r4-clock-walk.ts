/**
 * R4 — the brief asks: `inWindowReaders.test.ts`'s literal anchors are argued clock-safe from
 * arithmetic. WALK A YEAR and check, and note that `day()` calls `new Date()` three separate times.
 * Reproduces `day()` exactly, then asks the real producer.
 */
import { bnplInstallmentsInWindow, effectiveMinimumInWindow } from '@core/debt/bnplInstallment';
import type { Debt } from '@/data/models';

const fmt = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const dayFrom = (base: Date, offset: number) => { const d = new Date(base); d.setDate(d.getDate() + offset); return fmt(d); };

const mk = (due: string, over: Partial<Debt> = {}): Debt =>
  ({ id: 'd1', name: 'Weekly loan', balance: 5000, minimumPayment: 50, apr: 10,
     dueDate: due, type: 'debt', recurrence: 'weekly', ...over } as unknown as Debt);

// 1) walk 730 consecutive start days (two years, covering both DST transitions twice + leap Feb)
const counts = new Map<number, number>();
const owedSet = new Map<number, number>();
const bad: string[] = [];
const start = new Date(2026, 0, 1);
for (let i = 0; i < 730; i++) {
  const base = new Date(start); base.setDate(base.getDate() + i);
  const CURRENT = dayFrom(base, 0), NEXT = dayFrom(base, 28), DUE = dayFrom(base, 3);
  const n = bnplInstallmentsInWindow(mk(DUE), CURRENT, NEXT);
  const owed = Math.min(effectiveMinimumInWindow(mk(DUE), CURRENT, NEXT), 5000);
  counts.set(n, (counts.get(n) ?? 0) + 1);
  owedSet.set(owed, (owedSet.get(owed) ?? 0) + 1);
  if (n !== 4 || owed !== 200) bad.push(`${CURRENT} → n=${n} owed=$${owed}`);
}
console.log('walk of 730 start days · charges-in-window histogram:', [...counts.entries()]);
console.log('walk of 730 start days · owed histogram:', [...owedSet.entries()]);
console.log('rows disagreeing with CHARGES_IN_WINDOW=4 / OWED_WEEKLY=200:', bad.length, bad.slice(0, 8));

// 2) the three-new-Date() skew: `day()` is called 3x, so a midnight crossing can land BETWEEN them.
//    Enumerate every skew pattern (which of CURRENT/NEXT/DUE were computed on the LATER day).
console.log('\nmidnight-skew: which of the three day() calls landed on D+1');
for (const [label, sc, sn, sd] of [
  ['none (control)', 0, 0, 0],
  ['NEXT + DUE later', 0, 1, 1],
  ['DUE later only', 0, 0, 1],
  ['all three later', 1, 1, 1],
] as [string, number, number, number][]) {
  let worst: string | null = null; const hist = new Map<number, number>();
  for (let i = 0; i < 730; i++) {
    const base = new Date(start); base.setDate(base.getDate() + i);
    const CURRENT = dayFrom(base, 0 + sc), NEXT = dayFrom(base, 28 + sn), DUE = dayFrom(base, 3 + sd);
    const n = bnplInstallmentsInWindow(mk(DUE), CURRENT, NEXT);
    hist.set(n, (hist.get(n) ?? 0) + 1);
    if (n !== 4 && !worst) worst = `${CURRENT}..${NEXT} due ${DUE} → ${n}`;
  }
  console.log(`  ${label.padEnd(18)} → ${JSON.stringify([...hist.entries()])}${worst ? `  first divergence: ${worst}` : ''}`);
}
