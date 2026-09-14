#!/usr/bin/env bash
# One proof at a time. Before each: wait until nothing listens on :4319 (L3's port, never touched).
# A harness fault that names :4319 is L3 working: wait and retry the SAME id, up to 20 attempts.
set -u
cd /c/Users/Jason/audit-c5r1-L2 || exit 9
export NODE_OPTIONS=--max-old-space-size=1536
P=/c/Users/Jason/debt-app-v1/docs/audits/2026-09-02-s1-money-pass7/class5-reaudit-probes/L2
OUT=$P/prove-guards-remaining.log
: > "$OUT"
port_busy() { netstat -ano | grep -qE "[:.]4319 .*LISTEN"; }
for id in S1P7-57-3-WIDGET-DIRECTION S1P7-57-4A2-REPLAY-ONCE S1P7-57-4A2-CARRY-REPLACEMENTS S1P6-C3-6-DATED-TAP S1P6-C3-6-HANDLED-NO-REFUSAL S1P6-C3-6-BUTTON-NAMES-PAYDAY; do
  for attempt in $(seq 1 20); do
    while port_busy; do sleep 15; done
    log=$(npm run prove:guards -- --id=$id 2>&1); rc=$?
    if echo "$log" | grep -q "already listening on :4319"; then
      echo "[$id] attempt $attempt: :4319 taken mid-run (L3) - waiting, retry" >> "$OUT"
      sleep 30
      continue
    fi
    echo "$log" | grep -E "✅|❌|FAULT|MISMATCH|GREEN" | sed "s/^/[$id] rc=$rc /" >> "$OUT"
    break
  done
done
echo "DONE" >> "$OUT"
git status --short >> "$OUT"
