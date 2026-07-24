import type { GuardianBand } from "@core/storage/debtPlannerStorage";

import { decideRiskNotification, pushesInWindow, type NotifyDecisionInput } from "./notificationDecision";

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  console.log(`  ✓ ${label}`);
}

const NOW = "2026-08-01T10:00:00";
const CYCLE = "2026-08-15";

function input(o: Partial<NotifyDecisionInput>): NotifyDecisionInput {
  return { band: "at-risk", cycleEndDate: CYCLE, lastNotified: null, pushLog: [], now: NOW, ...o };
}
function daysAgo(n: number): string {
  return new Date(new Date(NOW).getTime() - n * 86_400_000).toISOString();
}

function runNotificationTests() {
  console.log("Running Guardian notification-decision (2.4.10) tests...");

  // ── Risk-only ──
  for (const band of ["clear", "tight"] as GuardianBand[]) {
    const d = decideRiskNotification(input({ band }));
    assertEqual(d.fire, false, `${band} → no push (risk-only)`);
    assertEqual(d.reason, "not-risk", `${band} → reason not-risk`);
  }

  // ── Risk onset → fire ──
  const onset = decideRiskNotification(input({ band: "at-risk" }));
  assertEqual(onset.fire, true, "at-risk, no prior notify, empty log → fire");
  assertEqual(onset.reason, "risk-onset", "…reason risk-onset");
  assertEqual(onset.level, "at-risk", "…level at-risk");

  // ── Same-cycle suppression ──
  const already = decideRiskNotification(input({ lastNotified: { forCycleEndDate: CYCLE, notifiedRiskLevel: "at-risk" } }));
  assertEqual(already.fire, false, "already notified at-risk THIS cycle → suppressed");
  assertEqual(already.reason, "already-notified", "…reason already-notified");

  // notified an OLD cycle → a new cycle's at-risk still fires
  const newCycle = decideRiskNotification(input({ lastNotified: { forCycleEndDate: "2026-08-01", notifiedRiskLevel: "at-risk" } }));
  assertEqual(newCycle.fire, true, "prior notify was a DIFFERENT cycle → new at-risk fires");

  // escalation: told them 'tight' this cycle, now at-risk (worse) → fire
  const escalate = decideRiskNotification(input({ lastNotified: { forCycleEndDate: CYCLE, notifiedRiskLevel: "tight" } }));
  assertEqual(escalate.fire, true, "escalation tight→at-risk this cycle → fire");

  // ── Hard frequency cap ──
  const capped = decideRiskNotification(input({ pushLog: [daysAgo(2), daysAgo(20)] }));
  assertEqual(capped.fire, false, "2 pushes in the last 30 days → capped (even on a fresh at-risk)");
  assertEqual(capped.reason, "freq-capped", "…reason freq-capped");

  // one of the two pushes is outside the window → only 1 counts → fires
  const oneStale = decideRiskNotification(input({ pushLog: [daysAgo(2), daysAgo(40)] }));
  assertEqual(oneStale.fire, true, "1 push in-window (other is 40d old) → fires");

  // exactly at the cap boundary
  assertEqual(decideRiskNotification(input({ pushLog: [daysAgo(29)] })).fire, true, "1 in-window push → still under the cap → fires");

  // ── pushesInWindow primitive ──
  assertEqual(pushesInWindow([daysAgo(2), daysAgo(29), daysAgo(31)], NOW, 30), 2, "counts only pushes within the window");
  assertEqual(pushesInWindow([daysAgo(-5), "not-a-date"], NOW, 30), 0, "ignores future + unparseable timestamps");
  assertEqual(pushesInWindow([], NOW, 30), 0, "empty log → 0");

  // ── order: not-risk beats the cap (a clear read is never a push, cap irrelevant) ──
  assertEqual(decideRiskNotification(input({ band: "clear", pushLog: [daysAgo(1), daysAgo(2)] })).reason, "not-risk", "clear short-circuits before the cap check");

  console.log("✅ Guardian notification-decision (2.4.10) tests passed.");
}

runNotificationTests();
