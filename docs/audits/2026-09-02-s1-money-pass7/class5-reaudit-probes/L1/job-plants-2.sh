#!/usr/bin/env bash
# L1 — serialized plant job 2. Every plant restores in plant.py's `finally` and byte-compares against a pre-plant copy.
P=C:/Users/Jason/debt-app-v1/docs/audits/2026-09-02-s1-money-pass7/class5-reaudit-probes/L1
W=C:/Users/Jason/audit-c5r1-L1
cd "$P/plants" || exit 9
printf '%s' "  return { totalOriginal, totalConfirmed, totalCurrent, totalPaid, pct, line, lineIsProjected };" > c39b.find
printf '%s' "  return { totalOriginal, totalConfirmed, totalCurrent, totalPaid, pct, line, lineIsProjected: false };" > c39b.replace
printf '%s' "floorUnread: input.floorUnread === true };" > c11brief.find
printf '%s' "floorUnread: false };" > c11brief.replace
cd "$P" || exit 9
run() { echo "== $(date +%T) PLANT $1 in $2 -> $3"; python plant.py "$W" "$2" "plants/$1.find" "plants/$1.replace" "$3" 2>&1; echo "py exit=$?"; }
echo "== $(date +%T) CONTROL FULL"; python plant.py "$W" apps/rn/src/store/selectors.ts none none FULL --control 2>&1
run c39b apps/rn/src/store/journeySelectors.ts apps/rn/src/store/journeySelectors.test.ts
run c39b apps/rn/src/store/journeySelectors.ts FULL
run c313part apps/rn/src/store/trustSelectors.ts FULL
run c13b apps/rn/src/components/plan/dataRepairsCopy.ts FULL
run c11brief packages/core/guardian/buildGuardianBrief.ts FULL
echo "== $(date +%T) CONTROL REGRESSION"; python plant.py "$W" apps/rn/src/store/selectors.ts none none REGRESSION --control 2>&1
run c11brief packages/core/guardian/buildGuardianBrief.ts REGRESSION
echo "== $(date +%T) JOB DONE"; cd "$W" && git status --short
