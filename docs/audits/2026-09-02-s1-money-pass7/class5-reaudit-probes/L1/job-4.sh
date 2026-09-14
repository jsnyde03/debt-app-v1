#!/usr/bin/env bash
# L1 — job 4: (a) the `test:regression` control + C1-1 floorUnread plant with the fixed driver (cwd);
# (b) the 21 cumulative proofs job 3 never reached, ONE AT A TIME, each waiting while :4319 is held
# (L3's Playwright server — never touched), and re-run once if refused on the port.
P=C:/Users/Jason/debt-app-v1/docs/audits/2026-09-02-s1-money-pass7/class5-reaudit-probes/L1
W=C:/Users/Jason/audit-c5r1-L1
export NODE_OPTIONS=--max-old-space-size=1536
cd "$P" || exit 9
echo "== $(date +%T) CONTROL REGRESSION"; python plant.py "$W" apps/rn/src/store/selectors.ts none none REGRESSION --control 2>&1 | tail -4
echo "== $(date +%T) PLANT c11brief -> REGRESSION"; python plant.py "$W" packages/core/guardian/buildGuardianBrief.ts plants/c11brief.find plants/c11brief.replace REGRESSION 2>&1 | tail -6
port_busy() { netstat -ano 2>/dev/null | grep ":4319 " | grep -q LISTEN; }
IDS="S1P3-G1-CALIBRATION S1P3-G2-RESERVETARGET S1P3-G3-GUARDIANREGIME S1P3-G4-PLANROUTE S1P3-G5-SAVINGSPOOL S1P4-F-B4-CLASS S1P4-ACK-DOES-NOT-VERIFY S1P5-B5-7-ANSWERABLEID S1P5-C5-3-SHEETBALANCE S1P6-B1-1-UNREADSTILLLIVE S1P6-A3-14-HYSTERESIS S1P6-B1-4-LEDGER-NOT-BAN S1P7-U11-WELDED-TOKEN S1-CLASS4-A2-1 S1-CLASS4-A3-1 S1-CLASS4-A3-2 S1-CLASS4-F7-HEADSUP S1-CLASS4-R2-1-CAP S1P7-R3-2-HEADSUPTOTAL S1P7-R3-4-FREEDPERMONTH S1P7-R4-1-ONETIMELUMP"
cd "$W" || exit 9
for ID in $IDS; do
  for attempt in 1 2 3; do
    waited=0
    while port_busy; do
      if [ $waited -ge 1500 ]; then echo "== $(date +%T) $ID GAVE UP waiting for :4319 (25 min)"; break 2; fi
      sleep 30; waited=$((waited + 30))
    done
    [ $waited -gt 0 ] && echo "== $(date +%T) $ID waited ${waited}s for :4319"
    out=$(npm run prove:guards -- --no-record --id=$ID 2>&1); rc=$?
    line=$(printf '%s\n' "$out" | grep -E "reason=|HARNESS FAULT|already listening" | head -3)
    echo "== $(date +%T) $ID attempt $attempt rc=$rc :: $line"
    if printf '%s' "$out" | grep -q "already listening"; then continue; fi
    break
  done
done
echo "tree after:"; git status --short
echo "== $(date +%T) JOB4 DONE"
