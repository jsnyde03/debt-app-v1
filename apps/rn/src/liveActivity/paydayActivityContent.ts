import type { PayCycle } from '@core/payCycle/getNextPaycheckDate';

import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPaydayGuardian, type GuardianState } from '@/store/guardianSelectors';
import { mayClaim } from '@/store/trustSelectors';
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
  /**
   * ⛔ **THE LOCK SCREEN CARRIED *"Looks clear · $1,080 free to deploy"* FOR THREE DAYS OVER AN OBLIGATION
   * THE APP COULD NOT READ.** [S1.10.6.3 · pass-3 blocker D3-2]
   *
   * ⚡ Same store, same instant, same sentence as Siri's — measured against a control that moves the figure
   * $180 → $1,080 on the single variable of whether the minimum was readable. The brief is honest about the
   * arrays it was handed; a `minimumPayment` repaired to `$0` produces neither an allocation row nor an
   * unfunded item, so the obligation leaves the plan entirely.
   *
   * ⚠️ `null` is the return this function already documents for *"nothing to show"*, and
   * `decideLiveActivityAction` already maps it to `end`/`none` — so the whole path existed and the CALL was
   * what was missing. That is `tested-helper-is-not-a-used-helper` in its usual shape, which is why the
   * remedy is one condition rather than a new mechanism.
   */
  if (!mayClaim(store, 'required-plan')) return null;
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
          // ⛔ [L1-12] "safe" → "holds": the same absolute the widget carried, on the same brief. See
          // `widget/snapshot.ts`. One word, and it is the difference between a read of the plan and a
          // guarantee about the user's actual cash.
          ? `Cushion holds · ${formatWhole(brief.deployedToDebt)} free to deploy`
          : 'Cushion holds';

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

/** What the lifecycle manager should do to the live activity given the store + its current state. */
export type LiveActivityAction =
  | { kind: 'none' }
  | { kind: 'start'; content: PaydayActivityContent; key: string }
  | { kind: 'update'; content: PaydayActivityContent; key: string }
  | { kind: 'end' };

/**
 * Pure reconciliation between "what the store implies" and "what's live right now" — the whole
 * start/update/end decision, extracted so it's unit-testable without ActivityKit or timers. `running` /
 * `lastKey` are the manager's held state; the returned action is applied via the native bridge.
 * `key` is the serialized content so an unchanged read skips a redundant update (WidgetKit-budget hygiene).
 */
export function decideLiveActivityAction(
  store: DebtStore,
  running: boolean,
  lastKey: string | null,
): LiveActivityAction {
  if (!shouldRunPaydayActivity(store)) return running ? { kind: 'end' } : { kind: 'none' };
  const content = buildPaydayActivityContent(store);
  if (!content) return running ? { kind: 'end' } : { kind: 'none' };
  const key = JSON.stringify(content);
  if (!running) return { kind: 'start', content, key };
  if (key !== lastKey) return { kind: 'update', content, key };
  return { kind: 'none' };
}
