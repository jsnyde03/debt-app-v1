import { useState } from 'react';

import { isPaydayAwaitingRollover, shouldPromptPaydayCapture } from '@core/debt/shouldPromptPaydayCapture';
import type { PayCycle } from '@core/payCycle/getNextPaycheckDate';

import { appStore } from '@/store/appStore';
import { useAppStore } from '@/store/useAppStore';

const CYCLE_DAYS: Record<PayCycle, number> = { weekly: 7, biweekly: 14, semimonthly: 15, monthly: 31 };

/** The prompt's freshness window: one pay cycle + a week of grace. Beyond it the payday is stale. */
function recencyWindowDays(payCycle: PayCycle): number {
  return (CYCLE_DAYS[payCycle] ?? 31) + 7;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface PaydayCapture {
  /** Whether the capture sheet should be shown. */
  isOpen: boolean;
  /** Payday handled but the cycle hasn't rolled over yet — surfaces the roll-forward nudge on Plan. */
  isAwaitingRollover: boolean;
  /** Manually open the sheet. */
  open(): void;
  /** Close without marking handled — re-offers on the next app open. */
  close(): void;
  /** Mark handled (no re-prompt across sessions) + close. */
  dismiss(): void;
  /** Mark handled after a successful capture, then close. */
  completeCapture(): void;
}

/**
 * Payday Autopilot orchestration (ported from the Capacitor `usePaydayCapture`): payday DETECTION
 * (real today vs. the store's `nextPaycheckDate`), the persisted per-cycle handled flag (self-clears
 * on rollover as the date advances), and the sheet's derived open state. Disabled in Demo Mode
 * (its seeded payday goes stale and would pop the sheet over sample data).
 */
export function usePaydayCapture(hasCapturablePlan: boolean): PaydayCapture {
  const nextPaycheckDate = useAppStore((s) => s.store.paycheck.nextPaycheckDate);
  const payCycle = useAppStore((s) => s.store.paycheck.payCycle);
  const lastHandled = useAppStore((s) => s.store.lastHandledPaydayDate);
  const enabled = useAppStore((s) => !s.store.prefs.isDemoMode);

  const [closedForPayday, setClosedForPayday] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const today = todayISO();
  const isPaydayPending =
    enabled && hasCapturablePlan && shouldPromptPaydayCapture(today, nextPaycheckDate, lastHandled, recencyWindowDays(payCycle));
  const autoOpen = isPaydayPending && closedForPayday !== nextPaycheckDate;
  const isOpen = manualOpen || autoOpen;
  const isAwaitingRollover = enabled && isPaydayAwaitingRollover(today, nextPaycheckDate, lastHandled);

  function markHandled() {
    appStore.getState().setLastHandledPayday(nextPaycheckDate);
  }
  function closeForThisPayday() {
    setManualOpen(false);
    setClosedForPayday(nextPaycheckDate);
  }

  return {
    isOpen,
    isAwaitingRollover,
    open: () => setManualOpen(true),
    close: closeForThisPayday,
    dismiss: () => {
      markHandled();
      closeForThisPayday();
    },
    completeCapture: () => {
      markHandled();
      closeForThisPayday();
    },
  };
}
