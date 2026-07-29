import type { PayCycle } from '@core/payCycle/getNextPaycheckDate';

import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian, type GuardianState } from '@/store/guardianSelectors';
import { formatWhole } from '@/utils/format';

import { PAYDAY_ACTIVITY_WINDOW_DAYS } from './liveActivityKeys';

export type { GuardianState };

/**
 * The display-ready payload the Payday Countdown Live Activity renders (3.5.3). Built here in JS — all
 * derivation + formatting + clamping stays on this side (mirrors `widget/snapshot.ts`), then the bridge
 * hands it to ActivityKit; the Swift `PaydayActivityContent` Codable just decodes these fields (no calc,
 * no formatting natively). Kept to strings + a number + the state enum so it round-trips through the
 * native boundary unambiguously and maps 1:1 onto the Swift struct.
 */
export interface PaydayActivityContent {
  /** ISO (YYYY-MM-DD) of the target payday. */
  paydayDateISO: string;
  /** Whole days from the plan's `currentDate` to payday (0 = today). Clamped ≥ 0. */
  daysUntilPayday: number;
  /** "Today" · "Tomorrow" · "in 3 days". Display-ready. */
  countdownLabel: string;
  /** The Guardian read for THIS paycheck — drives the state dot (the only moving color). */
  guardianState: GuardianState;
  /** The Guardian's own one-line title (single source of truth for its voice). */
  title: string;
  /** A concise, state-aware sub-line (shortfall · safe move · free-to-deploy). Display-ready. */
  line: string;
  /** 0..1 through the current pay cycle — a subtle "how close" hint, not an accounting figure. */
  cycleProgress: number;
}

/** Nominal cycle length in days — `cycleProgress` is a calm hint, so an approximation is fine. */
const CYCLE_DAYS: Record<PayCycle, number> = {
  weekly: 7,
  biweekly: 14,
  semimonthly: 15,
  monthly: 30,
};

/** Whole days between two ISO dates (UTC-midnight anchored so DST can't skew the day count). */
export function wholeDaysBetween(fromISO: string, toISO: string): number {
  const from = Date.parse(`${fromISO}T00:00:00Z`);
  const to = Date.parse(`${toISO}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000);
}

function countdownLabel(days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

/**
 * Build the Live Activity payload from the live store, or `null` when there's nothing to show (free
 * tier, or no Guardian read). Free keeps the always-on widget as its complete glance surface — the
 * countdown's value IS the premium Guardian read, so it's premium-only (value-led, never a locked
 * preview). The window gate lives in `shouldRunPaydayActivity`; this always builds a current payload
 * for an in-flight activity to update to.
 */
export function buildPaydayActivityContent(store: DebtStore): PaydayActivityContent | null {
  if (store.subscriptionPlan !== 'premium') return null;
  const brief = selectPaydayGuardian(withProjectedBalances(store, true));
  if (!brief) return null;

  const { currentDate, nextPaycheckDate, payCycle } = store.paycheck;
  const days = Math.max(0, wholeDaysBetween(currentDate, nextPaycheckDate));
  const cycleDays = CYCLE_DAYS[payCycle] ?? 14;
  const cycleProgress = Math.max(0, Math.min(1, (cycleDays - days) / cycleDays));

  const line =
    brief.shortfall && brief.shortfall > 0
      ? `${formatWhole(brief.shortfall)} short of your obligations`
      : brief.safeMove
        ? brief.safeMove
        : brief.deployedToDebt > 0
          ? `Cushion safe · ${formatWhole(brief.deployedToDebt)} free to deploy`
          : 'Cushion safe';

  return {
    paydayDateISO: nextPaycheckDate,
    daysUntilPayday: days,
    countdownLabel: countdownLabel(days),
    guardianState: brief.state,
    title: brief.title,
    line,
    cycleProgress,
  };
}

/**
 * Whether the Payday Countdown should be LIVE right now: premium + the user's toggle on + within the
 * final ~3-day run-up to payday + a real read to show. The lifecycle manager (3.5.3.3) starts the
 * activity on the false→true edge and ends it when this goes false (or at payday rollover).
 */
export function shouldRunPaydayActivity(store: DebtStore): boolean {
  if (store.subscriptionPlan !== 'premium') return false;
  if (!store.prefs.paydayLiveActivityEnabled) return false;
  const days = Math.max(0, wholeDaysBetween(store.paycheck.currentDate, store.paycheck.nextPaycheckDate));
  if (days > PAYDAY_ACTIVITY_WINDOW_DAYS) return false;
  return buildPaydayActivityContent(store) !== null;
}
