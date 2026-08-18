import { parseLocalDate, toLocalISODate } from '@core/utils/localDate';

import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian } from '@/store/guardianSelectors';

import {
  buildPaydayActivityContent,
  decideLiveActivityAction,
  shouldRunPaydayActivity,
  wholeDaysBetween,
} from './paydayActivityContent';

/**
 * 3.5.3.1 — the Payday Countdown Live Activity's PURE derivation (premium gate · toggle · window ·
 * countdown · progress · Guardian passthrough). Throw-based; runs via `npm run test:app`.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

/** A store with an explicit currentDate→payday gap + tier, shaped to a chosen Guardian state. */
function store(o: {
  premium?: boolean;
  toggle?: boolean;
  daysToPayday?: number;
  amount?: string;
  bills?: number[];
} = {}): DebtStore {
  const s = createDefaultStore();
  const currentDate = '2026-03-02';
  const nextPaycheckDate = addDays(currentDate, o.daysToPayday ?? 2);
  return {
    ...s,
    subscriptionPlan: o.premium ? 'premium' : 'free',
    genuineCycleCount: 6, // established → no cold-start dampening
    paycheck: { ...s.paycheck, payCycle: 'biweekly', amount: o.amount ?? '2000', currentDate, nextPaycheckDate },
    requiredExpenses: (o.bills ?? [400]).map((amt, i) => ({
      id: `e${i}`, name: `Bill ${i}`, amount: amt, dueDate: currentDate, recurrence: 'monthly',
    })),
    prefs: { ...s.prefs, paydayLiveActivityEnabled: o.toggle ?? true, onboardingComplete: true },
  };
}
function addDays(iso: string, days: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

// ── wholeDaysBetween ──────────────────────────────────────────────────────────
eq(wholeDaysBetween('2026-03-02', '2026-03-05'), 3, 'wholeDaysBetween: 3-day gap');
eq(wholeDaysBetween('2026-03-02', '2026-03-02'), 0, 'wholeDaysBetween: same day = 0');
eq(wholeDaysBetween('2026-03-05', '2026-03-02'), -3, 'wholeDaysBetween: past date = negative');
eq(wholeDaysBetween('bad', '2026-03-02'), 0, 'wholeDaysBetween: unparseable → 0 (never NaN)');
// DST boundary (US spring-forward 2026-03-08) — UTC anchoring keeps the day count whole.
eq(wholeDaysBetween('2026-03-07', '2026-03-09'), 2, 'wholeDaysBetween: spans DST, still whole days');

// ── premium gate ──────────────────────────────────────────────────────────────
eq(buildPaydayActivityContent(store({ premium: false })), null, 'free tier → no content');
eq(shouldRunPaydayActivity(store({ premium: false })), false, 'free tier → never runs');

// ── content shape (premium, clear-ish, 2 days out) ──────────────────────────────
{
  const s = store({ premium: true, daysToPayday: 2, amount: '3000', bills: [300] });
  const c = buildPaydayActivityContent(s);
  assert(c !== null, 'premium → content built');
  eq(c!.daysUntilPayday, 2, 'daysUntilPayday reflects the gap');
  eq(c!.countdownLabel, 'in 2 days', 'countdownLabel: "in 2 days"');
  eq(c!.paydayDateISO, s.paycheck.nextPaycheckDate, 'paydayDateISO = the payday');
  assert(c!.cycleProgress > 0 && c!.cycleProgress <= 1, 'cycleProgress within (0,1]');
  // Guardian passthrough — the activity is a single source of truth with the app's Guardian.
  const brief = selectPaydayGuardian(withProjectedBalances(s, true));
  eq(c!.guardianState, brief!.state, 'guardianState mirrors the Guardian brief');
  eq(c!.title, brief!.title, 'title mirrors the Guardian brief');
  assert(c!.line.length > 0, 'line is non-empty');
}

// ── countdown label edges ───────────────────────────────────────────────────────
eq(buildPaydayActivityContent(store({ premium: true, daysToPayday: 0 }))!.countdownLabel, 'Today', 'label: Today');
eq(buildPaydayActivityContent(store({ premium: true, daysToPayday: 1 }))!.countdownLabel, 'Tomorrow', 'label: Tomorrow');

// ── shortfall line (at-risk) ────────────────────────────────────────────────────
{
  const c = buildPaydayActivityContent(store({ premium: true, daysToPayday: 1, amount: '500', bills: [3000] }));
  assert(c !== null && c.line.includes('short of your obligations'), 'shortfall → "short of your obligations" line');
}

// ── window + toggle gates (shouldRun) ───────────────────────────────────────────
eq(shouldRunPaydayActivity(store({ premium: true, daysToPayday: 2 })), true, 'premium + 2 days + toggle on → runs');
eq(shouldRunPaydayActivity(store({ premium: true, daysToPayday: 3 })), true, 'premium + 3 days (window edge) → runs');
eq(shouldRunPaydayActivity(store({ premium: true, daysToPayday: 4 })), false, 'premium + 4 days (outside window) → no');
eq(shouldRunPaydayActivity(store({ premium: true, daysToPayday: 2, toggle: false })), false, 'toggle off → no');
// build() ignores the window (an in-flight activity still updates its content past the edge).
assert(buildPaydayActivityContent(store({ premium: true, daysToPayday: 10 })) !== null, 'build() ignores the window gate');

// ── decideLiveActivityAction (the pure start/update/end reconciler) ──────────────
{
  const inWindow = store({ premium: true, daysToPayday: 2 });
  // not running + should-run → start (carries content + key)
  const startAction = decideLiveActivityAction(inWindow, false, null);
  eq(startAction.kind, 'start', 'not running + should-run → start');
  const key = startAction.kind === 'start' ? startAction.key : '';
  assert(key.length > 0, 'start action carries a content key');

  // running + same content (key matches) → none (no redundant update)
  eq(decideLiveActivityAction(inWindow, true, key).kind, 'none', 'running + unchanged read → none');

  // running + changed content → update
  const changed = store({ premium: true, daysToPayday: 1 }); // different countdown → different key
  eq(decideLiveActivityAction(changed, true, key).kind, 'update', 'running + changed read → update');

  // running + should-NOT-run (fell out of the window) → end
  eq(decideLiveActivityAction(store({ premium: true, daysToPayday: 9 }), true, key).kind, 'end', 'running + outside window → end');

  // running + downgraded to free → end
  eq(decideLiveActivityAction(store({ premium: false }), true, key).kind, 'end', 'running + free → end');

  // not running + should-not-run → none (nothing to do)
  eq(decideLiveActivityAction(store({ premium: false }), false, null).kind, 'none', 'not running + free → none');
}

console.log(`\n  paydayActivityContent: ${passed} assertions passed\n`);
