#!/usr/bin/env bash
# L1 — job 3: the regression control + C1-1 floorUnread plant, then prove:guards (read-only, --no-record)
# for the registry entries whose proof.unfix[].at is in lane L1's manifest — minus the one Playwright proof
# (S1P3-C1-ROWFIGURES, L3's) and the four entries the range ADDED (L4's subject).
P=C:/Users/Jason/debt-app-v1/docs/audits/2026-09-02-s1-money-pass7/class5-reaudit-probes/L1
W=C:/Users/Jason/audit-c5r1-L1
export NODE_OPTIONS=--max-old-space-size=1536
cd "$P" || exit 9
echo "== $(date +%T) CONTROL REGRESSION"; python plant.py "$W" apps/rn/src/store/selectors.ts none none REGRESSION --control 2>&1
echo "== $(date +%T) PLANT c11brief -> REGRESSION"; python plant.py "$W" packages/core/guardian/buildGuardianBrief.ts plants/c11brief.find plants/c11brief.replace REGRESSION 2>&1
cd "$W" && echo "tree before prove:" && git status --short
IDS=S1P4-C4-5-ARITY,S1P4-C4-2-MEMBERSHIP,S1P3-C5-PAYWALL,S1P3-G1-CALIBRATION,S1P3-G2-RESERVETARGET,S1P3-G3-GUARDIANREGIME,S1P3-G4-PLANROUTE,S1P3-G5-SAVINGSPOOL,S1P4-F-B4-CLASS,S1P4-ACK-DOES-NOT-VERIFY,S1P5-B5-7-ANSWERABLEID,S1P5-C5-3-SHEETBALANCE,S1P6-B1-1-UNREADSTILLLIVE,S1P6-A3-14-HYSTERESIS,S1P6-B1-4-LEDGER-NOT-BAN,S1P7-U11-WELDED-TOKEN,S1-CLASS4-A2-1,S1-CLASS4-A3-1,S1-CLASS4-A3-2,S1-CLASS4-F7-HEADSUP,S1-CLASS4-R2-1-CAP,S1P7-R3-2-HEADSUPTOTAL,S1P7-R3-4-FREEDPERMONTH,S1P7-R4-1-ONETIMELUMP
echo "== $(date +%T) PROVE"; npm run prove:guards -- --no-record --id=$IDS 2>&1
echo "== $(date +%T) PROVE exit=$?"
cd "$W" && echo "tree after:" && git status --short
echo "== $(date +%T) JOB3 DONE"
