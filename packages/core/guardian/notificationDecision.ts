/**
 * v1.7 Payday Guardian — the proactive-notification DECISION core (§2.8, 2.4.10.1). Pure + selector-free
 * → node-unit-testable. Decides whether a RISK push should fire for the current cycle, on the honest
 * rules the audit set:
 *
 *  • RISK-ONLY. A push fires only for the genuine risk band (`at-risk`) — never a "looks tight" verdict a
 *    reconcile-to-clear would turn into cried-wolf. `clear` / `tight` stay in-app.
 *  • ESCALATE ON CHANGE. Fire only when the risk is NEW or WORSE than what we already told the user THIS
 *    cycle (same-cycle re-fire is suppressed) — so a chronic-risk user isn't pinged every open.
 *  • HARD FREQUENCY CAP. At most N (=2) risk pushes per rolling window (=30 days), off the push-log
 *    timestamps — regardless of change (a volatile-bad user's every-cycle "change" would otherwise fire
 *    weekly, round-3 red-team #6).
 *
 * The caller (2.4.10.3) stamps `currentCycleNotifyState` + appends the push timestamp when `fire` is true.
 */

import type { GuardianBand } from "@core/storage/debtPlannerStorage";

/** [BUILD] tunables (Phase 6). */
export const MAX_RISK_PUSHES_PER_WINDOW = 2;
export const PUSH_WINDOW_DAYS = 30;

const RANK: Record<GuardianBand, number> = { clear: 0, tight: 1, "at-risk": 2 };

export interface NotifyDecisionInput {
  /** The current cycle's Guardian band. */
  band: GuardianBand;
  /** The cycle this decision is for (the current/upcoming cycle's end date). */
  cycleEndDate: string;
  /** What we last notified the user, and for which cycle (null = never). */
  lastNotified: { forCycleEndDate: string; notifiedRiskLevel: GuardianBand } | null;
  /** ISO timestamps of prior risk pushes (for the rolling-window cap). */
  pushLog: readonly string[];
  /** "Now" as an ISO date/timestamp (injected — no clock in core). */
  now: string;
  maxPerWindow?: number;
  windowDays?: number;
}

export type NotifyReason = "not-risk" | "already-notified" | "freq-capped" | "risk-onset";

export interface NotifyDecision {
  fire: boolean;
  level: GuardianBand;
  reason: NotifyReason;
}

/** Count push timestamps within `windowDays` before `now` (inclusive). */
export function pushesInWindow(pushLog: readonly string[], now: string, windowDays: number): number {
  const nowMs = new Date(now).getTime();
  const cutoff = nowMs - windowDays * 86_400_000;
  return pushLog.filter((ts) => {
    const t = new Date(ts).getTime();
    return Number.isFinite(t) && t >= cutoff && t <= nowMs;
  }).length;
}

/**
 * Decide whether to fire a risk push for the current cycle. Order matters: risk-only → same-cycle
 * escalation → the hard cap. A non-fire always carries the reason (for logging / the test matrix).
 */
export function decideRiskNotification(input: NotifyDecisionInput): NotifyDecision {
  const { band, cycleEndDate, lastNotified, pushLog, now } = input;
  const maxPerWindow = input.maxPerWindow ?? MAX_RISK_PUSHES_PER_WINDOW;
  const windowDays = input.windowDays ?? PUSH_WINDOW_DAYS;

  // Risk-only — a soft/clear read is never a push (it lives in-app).
  if (band !== "at-risk") return { fire: false, level: band, reason: "not-risk" };

  // Same-cycle escalation: suppress unless this is new/worse than what we already told them THIS cycle.
  const notifiedThisCycle = lastNotified?.forCycleEndDate === cycleEndDate;
  if (notifiedThisCycle && RANK[lastNotified!.notifiedRiskLevel] >= RANK[band]) {
    return { fire: false, level: band, reason: "already-notified" };
  }

  // Hard rolling-window cap — regardless of change, never exceed N risk pushes / window.
  if (pushesInWindow(pushLog, now, windowDays) >= maxPerWindow) {
    return { fire: false, level: band, reason: "freq-capped" };
  }

  return { fire: true, level: band, reason: "risk-onset" };
}
