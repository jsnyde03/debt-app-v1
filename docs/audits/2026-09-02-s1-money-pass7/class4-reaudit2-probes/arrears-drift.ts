/**
 * ROUND-2 PROBE — is `bnplInstallmentsInWindow`'s un-anchored month step REACHABLE with a
 * REAL pay-cycle window (≤31 days)?
 *
 * The skip loop walks a stored due date forward from the past to the window opening. It calls
 * `advanceDueDateOnce(due, recurrence)` with NO anchorDay, so `addMonthsISO` anchors on the RUNNING
 * date: Jan 31 → Feb 28 → Mar 28 → Apr 28 … the date sticks on the 28th permanently. The repo's own
 * owner (`packages/core/utils/addMonths.ts`) says that is exactly what `anchorDay` exists to prevent,
 * and the rollover path (`advanceDueDateToPlanDate`) DOES pass one.
 *
 * Truth here = the anchored sequence (the repo's declared semantics), counted by brute force.
 */
import { bnplInstallmentsInWindow, effectiveMinimumInWindow } from '../../../../packages/core/debt/bnplInstallment';
import { parseLocalDate, toLocalISODate } from '../../../../packages/core/utils/localDate';
import type { Debt } from '../../../../packages/core/storage/debtPlannerStorage';

const p = (n: number) => String(n).padStart(2, '0');
const dim = (y: number, m: number) => [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

/** The ANCHORED occurrence sequence from `dueDate`, per addMonths.ts's declared rule. */
function trueOccurrences(dueISO: string, recurrence: string, endISO: string): string[] {
  const [y0, m0, d0] = dueISO.split('-').map(Number);
  const out: string[] = [];
  if (recurrence === 'one-time' || recurrence === 'per-paycheck') return [dueISO];
  const stepMonths = recurrence === 'monthly' ? 1 : recurrence === 'quarterly' ? 3 : recurrence === 'annually' ? 12 : 0;
  if (stepMonths === 0) {
    const days = recurrence === 'weekly' ? 7 : 14;
    const d = parseLocalDate(dueISO);
    for (let i = 0; i < 5000; i++) {
      const iso = toLocalISODate(d);
      if (iso >= endISO) break;
      out.push(iso);
      d.setDate(d.getDate() + days);
    }
    return out;
  }
  for (let k = 0; k < 600; k++) {
    const total = (m0 - 1) + k * stepMonths;
    const y = y0 + Math.floor(total / 12);
    const m = (total % 12) + 1;
    const iso = `${y}-${p(m)}-${p(Math.min(d0, dim(y, m)))}`;
    if (iso >= endISO) break;
    out.push(iso);
  }
  return out;
}

const addDays = (iso: string, n: number) => { const d = parseLocalDate(iso); d.setDate(d.getDate() + n); return toLocalISODate(d); };

function mk(dueDate: string, recurrence: string, minimumPayment = 100, balance = 100000): Debt {
  return { id: 'd', name: 'Loan', balance, minimumPayment, apr: 0, dueDate, type: 'debt', recurrence, isPaidThisCycle: false } as unknown as Debt;
}

const ARREARS_DUE = ['2025-01-31', '2025-03-31', '2025-01-30', '2025-01-29', '2024-12-31', '2025-05-31', '2025-08-31', '2025-10-31'];
const RECS = ['monthly', 'quarterly'];
const CYCLES: [string, number][] = [['weekly', 7], ['biweekly', 14], ['semimonthly', 15], ['monthly', 30], ['monthly-31', 31], ['monthly-28', 28]];

let mismatches = 0, cases = 0;
const rows: string[] = [];
for (const due of ARREARS_DUE) {
  for (const rec of RECS) {
    // walk the window opening across a whole year of possible paydays
    for (let off = 0; off < 365; off++) {
      const start = addDays('2026-01-01', off);
      for (const [cycleName, len] of CYCLES) {
        const end = addDays(start, len);
        const got = Math.max(1, bnplInstallmentsInWindow(mk(due, rec), start, end));
        const truth = Math.max(1, trueOccurrences(due, rec, end).filter((o) => o >= start).length);
        cases++;
        if (got !== truth) {
          mismatches++;
          if (rows.length < 30) {
            const em = effectiveMinimumInWindow(mk(due, rec), start, end);
            rows.push(`due ${due} ${rec} · ${cycleName} window ${start}→${end}: producer counts ${got}, true ${truth} · effectiveMinimumInWindow=$${em} (true $${truth * 100})`);
          }
        }
      }
    }
  }
}
console.log(`\nARREARS DRIFT — ${cases} (due × recurrence × window) cases, ${mismatches} where the producer's count differs from the anchored truth`);
for (const r of rows) console.log('  ' + r);

// The concrete money consequence on one shape, spelled out.
console.log('\n--- the skip-loop walk, due 2025-01-31 monthly ---');
{
  const d = mk('2025-01-31', 'monthly');
  const start = '2026-03-30';
  const end = '2026-04-29';
  console.log(`  true anchored occurrences up to ${end}:`, trueOccurrences('2025-01-31', 'monthly', end).slice(-6).join(' '));
  console.log(`  producer count in [${start},${end}) = ${bnplInstallmentsInWindow(d, start, end)}, effectiveMinimumInWindow = $${effectiveMinimumInWindow(d, start, end)}`);
  console.log(`  true count = ${trueOccurrences('2025-01-31', 'monthly', end).filter((o) => o >= start).length}`);
}
