/**
 * ROUND-2 PROBE — is `chargesInWindow` (the matrix's expected value) a CORRECT independent oracle?
 *
 * Three counts of the same fact:
 *   A. `chargesInWindow`  — the test's hand-written walker (re-stated here verbatim from
 *                            packages/core/testing/testCadenceIdentity.ts).
 *   B. `bnplInstallmentsInWindow` — the PRODUCER the matrix is asserted against.
 *   C. a brute-force DAY ENUMERATION written from the cadence definition, sharing no helper with either.
 *
 * Run from repo root:  npx tsx docs/.../oracle-vs-producer.ts
 */
import { bnplInstallmentsInWindow } from '../../../../packages/core/debt/bnplInstallment';
import { addMonthsISO } from '../../../../packages/core/utils/addMonths';
import { parseLocalDate, toLocalISODate } from '../../../../packages/core/utils/localDate';
import type { Debt } from '../../../../packages/core/storage/debtPlannerStorage';

type Rec = 'one-time' | 'weekly' | 'biweekly' | 'per-paycheck' | 'monthly' | 'quarterly' | 'annually';
const RECURRENCES: Rec[] = ['one-time', 'weekly', 'biweekly', 'per-paycheck', 'monthly', 'quarterly', 'annually'];

// ---------- A: the test's own walker, copied verbatim ----------
function chargesInWindow(recurrence: Rec, startISO: string, endISO: string): number {
  if (recurrence === 'per-paycheck') return 1;
  const anchorDay = parseLocalDate(startISO).getDate();
  const addDays = (iso: string, days: number): string => {
    const d = parseLocalDate(iso);
    d.setDate(d.getDate() + days);
    return toLocalISODate(d);
  };
  let cursor = startISO;
  let n = 0;
  while (cursor < endISO) {
    n += 1;
    if (recurrence === 'one-time') break;
    if (recurrence === 'weekly') cursor = addDays(cursor, 7);
    else if (recurrence === 'biweekly') cursor = addDays(cursor, 14);
    else if (recurrence === 'monthly') cursor = addMonthsISO(cursor, 1, anchorDay);
    else if (recurrence === 'quarterly') cursor = addMonthsISO(cursor, 3, anchorDay);
    else if (recurrence === 'annually') cursor = addMonthsISO(cursor, 12, anchorDay);
    else break;
  }
  return n;
}

// ---------- B: the producer ----------
function producer(recurrence: Rec, startISO: string, endISO: string): number {
  const d = {
    id: 'p', name: 'P', balance: 1_000_000, minimumPayment: 50, apr: 0,
    dueDate: startISO, type: 'debt', recurrence, isPaidThisCycle: false,
  } as unknown as Debt;
  return Math.max(1, bnplInstallmentsInWindow(d, startISO, endISO));
}

// ---------- C: a brute-force day enumeration, no shared helpers ----------
function ymd(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}
function daysInMonth(y: number, m: number): number {
  return [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}
/** Every calendar day in [start, end), as YYYY-MM-DD, by pure integer arithmetic. */
function* walkDays(startISO: string, endISO: string): Generator<string> {
  let [y, m, d] = ymd(startISO);
  const p = (n: number) => String(n).padStart(2, '0');
  for (;;) {
    const iso = `${y}-${p(m)}-${p(d)}`;
    if (iso >= endISO) return;
    yield iso;
    d += 1;
    if (d > daysInMonth(y, m)) { d = 1; m += 1; if (m > 12) { m = 1; y += 1; } }
  }
}
/** Day-count between two dates, by counting. */
function dayIndex(fromISO: string, toISO: string): number {
  let n = 0;
  for (const _ of walkDays(fromISO, toISO)) { void _; n += 1; }
  return n;
}
function bruteForce(recurrence: Rec, startISO: string, endISO: string): number {
  if (recurrence === 'per-paycheck' || recurrence === 'one-time') return startISO < endISO ? 1 : 0;
  const [, , anchorDay] = ymd(startISO);
  let n = 0;
  for (const day of walkDays(startISO, endISO)) {
    if (recurrence === 'weekly') { if (dayIndex(startISO, day) % 7 === 0) n += 1; continue; }
    if (recurrence === 'biweekly') { if (dayIndex(startISO, day) % 14 === 0) n += 1; continue; }
    // month cadences: an occurrence is the anchor day-of-month (clamped to the month's length)
    // in a month that is a whole multiple of the period away from the start month.
    const [sy, sm] = ymd(startISO);
    const [cy, cm, cd] = ymd(day);
    const step = recurrence === 'monthly' ? 1 : recurrence === 'quarterly' ? 3 : 12;
    const months = (cy - sy) * 12 + (cm - sm);
    if (months % step !== 0 || months < 0) continue;
    if (cd === Math.min(anchorDay, daysInMonth(cy, cm))) n += 1;
  }
  return n;
}

const addDaysISO = (iso: string, n: number) => {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + n);
  return toLocalISODate(d);
};

let live = 0, latent = 0, checked = 0;
const seen = new Map<string, string[]>();
function note(kind: string, detail: string) {
  if (!seen.has(kind)) seen.set(kind, []);
  seen.get(kind)!.push(detail);
}

// --- 1. THE LIVE SPACE: exactly the 28 pairs the matrix asserts ---
console.log('=== 1. the matrix\'s own 28 pairs (start 2026-08-03) ===');
for (const rec of RECURRENCES) {
  const row: string[] = [];
  for (const end of ['2026-08-10', '2026-08-17', '2026-08-16', '2026-09-01']) {
    const a = chargesInWindow(rec, '2026-08-03', end);
    const b = producer(rec, '2026-08-03', end);
    const c = bruteForce(rec, '2026-08-03', end);
    checked++;
    row.push(`${end.slice(5)}:A${a}/B${b}/C${c}${a === b && b === c ? '' : ' ‼'}`);
    if (!(a === b && b === c)) { live++; note('LIVE (inside the asserted space)', `${rec} 2026-08-03→${end}: oracle=${a} producer=${b} bruteforce=${c}`); }
  }
  console.log(`  ${rec.padEnd(14)} ${row.join('  ')}`);
}

// --- 2. THE ADVERSARIAL SPACE the brief names: month-end anchors, leap years, long windows ---
console.log('\n=== 2. adversarial starts × window lengths ===');
const STARTS = [
  '2026-01-31', '2026-01-30', '2026-01-29', '2026-02-28', '2026-03-31', '2026-08-31',
  '2024-01-31', '2024-02-29', '2024-12-31', '2027-02-28', '2025-05-31', '2026-04-30',
];
const LENGTHS = [1, 7, 13, 14, 15, 28, 29, 30, 31, 32, 60, 92, 93, 180, 365, 366, 400, 730];
for (const start of STARTS) {
  for (const len of LENGTHS) {
    const end = addDaysISO(start, len);
    for (const rec of RECURRENCES) {
      const a = chargesInWindow(rec, start, end);
      const b = producer(rec, start, end);
      const c = bruteForce(rec, start, end);
      checked++;
      if (a !== c) { latent++; note('ORACLE ≠ BRUTE-FORCE', `${rec} ${start}→${end} (${len}d): oracle=${a} bruteforce=${c} producer=${b}`); }
      else if (a !== b) { latent++; note('ORACLE ≠ PRODUCER (oracle agrees with brute force)', `${rec} ${start}→${end} (${len}d): oracle=${a} producer=${b}`); }
    }
  }
}

console.log(`\nchecked ${checked} (recurrence × window) combinations`);
console.log(`  disagreements INSIDE the matrix's asserted space: ${live}`);
console.log(`  disagreements outside it (latent):                ${latent}`);
for (const [kind, rows] of seen) {
  console.log(`\n--- ${kind} — ${rows.length} ---`);
  for (const r of rows.slice(0, 25)) console.log(`    ${r}`);
  if (rows.length > 25) console.log(`    … and ${rows.length - 25} more`);
}
