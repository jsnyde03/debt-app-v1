/**
 * ROUND-2 PROBE (tightened) — the same question, but every window is one the app itself produces,
 * via `getNextPaycheckDate`. No synthetic window lengths.
 *
 * Truth = the ANCHORED occurrence sequence, which is what `addMonths.ts` declares and what the
 * ROLLOVER path (`advanceDueDateToPlanDate`) implements. `bnplInstallmentsInWindow` calls
 * `advanceDueDateOnce` with no anchorDay, so its walk sticks on the 28th once it crosses February.
 */
import { bnplInstallmentsInWindow, effectiveMinimumInWindow } from '../../../../packages/core/debt/bnplInstallment';
import { getNextPaycheckDate } from '../../../../packages/core/payCycle/getNextPaycheckDate';
import { parseLocalDate, toLocalISODate } from '../../../../packages/core/utils/localDate';
import type { Debt } from '../../../../packages/core/storage/debtPlannerStorage';

const p = (n: number) => String(n).padStart(2, '0');
const dim = (y: number, m: number) => [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
const addDays = (iso: string, n: number) => { const d = parseLocalDate(iso); d.setDate(d.getDate() + n); return toLocalISODate(d); };

function trueMonthly(dueISO: string, stepMonths: number, endISO: string): string[] {
  const [y0, m0, d0] = dueISO.split('-').map(Number);
  const out: string[] = [];
  for (let k = 0; k < 800; k++) {
    const total = (m0 - 1) + k * stepMonths;
    const y = y0 + Math.floor(total / 12);
    const m = (total % 12) + 1;
    const iso = `${y}-${p(m)}-${p(Math.min(d0, dim(y, m)))}`;
    if (iso >= endISO) break;
    out.push(iso);
  }
  return out;
}
const mk = (dueDate: string, recurrence: string): Debt =>
  ({ id: 'd', name: 'Loan', balance: 100000, minimumPayment: 100, apr: 0, dueDate, type: 'debt', recurrence, isPaidThisCycle: false } as unknown as Debt);

const DUES = ['2025-01-31', '2025-01-30', '2025-01-29', '2025-03-31', '2025-05-31', '2025-08-31', '2025-10-31', '2024-12-31'];
const RECS: [string, number][] = [['monthly', 1], ['quarterly', 3]];

const byCycle = new Map<string, { cases: number; under: number; over: number; sample: string[] }>();
for (const cycleName of ['weekly', 'biweekly', 'semimonthly', 'monthly'] as const) {
  byCycle.set(cycleName, { cases: 0, under: 0, over: 0, sample: [] });
}

for (let off = 0; off < 730; off++) {
  const start = addDays('2026-01-01', off);
  for (const cycle of ['weekly', 'biweekly', 'semimonthly', 'monthly'] as const) {
    let end: string;
    try {
      end = getNextPaycheckDate({
        payCycle: cycle, currentDate: start,
        semiMonthlyFirstDay: 1, semiMonthlySecondDay: 15,
        monthlyPayDay: parseLocalDate(start).getDate(),
      });
    } catch { continue; }
    for (const due of DUES) {
      for (const [rec, step] of RECS) {
        const bucket = byCycle.get(cycle)!;
        bucket.cases++;
        const got = Math.max(1, bnplInstallmentsInWindow(mk(due, rec), start, end));
        const truth = Math.max(1, trueMonthly(due, step, end).filter((o) => o >= start).length);
        if (got === truth) continue;
        if (got < truth) bucket.under++; else bucket.over++;
        if (bucket.sample.length < 6) {
          const em = effectiveMinimumInWindow(mk(due, rec), start, end);
          bucket.sample.push(`due ${due} ${rec} · window ${start}→${end}: reserves $${em}, true $${truth * 100} (count ${got} vs ${truth})`);
        }
      }
    }
  }
}
console.log('\nREAL PAY-CYCLE WINDOWS ONLY (getNextPaycheckDate), 730 consecutive start days × 8 arrears due dates × {monthly,quarterly}\n');
for (const [cycle, b] of byCycle) {
  console.log(`  ${cycle.padEnd(13)} ${String(b.cases).padStart(6)} cases · ${b.under} UNDER-reserved · ${b.over} OVER-reserved`);
  for (const s of b.sample) console.log(`        ${s}`);
}
