#!/usr/bin/env bash
# L4 probe: re-execute registry proofs one id at a time in the PIN worktree, read-only (--no-record).
# A :4319 listener (L3's Playwright) faults every proof machine-wide: wait and retry, never kill it.
WT=/c/Users/Jason/audit-c5r1-L4
OUT=/c/Users/Jason/debt-app-v1/docs/audits/2026-09-02-s1-money-pass7/class5-reaudit-probes/L4/prove-runs
mkdir -p "$OUT"
export NODE_OPTIONS=--max-old-space-size=1536
cd "$WT" || exit 9
cp scripts/finding-guards.json "$OUT/finding-guards.before.json"
for id in "$@"; do
  for attempt in $(seq 1 30); do
    cd "$WT" && npx tsx scripts/prove-guards.ts --id="$id" --no-record > "$OUT/$id.txt" 2>&1
    st=$?
    if grep -q "already listening on :4319" "$OUT/$id.txt"; then echo "$id attempt $attempt: :4319 busy (L3), waiting" >> "$OUT/_waits.txt"; sleep 90; continue; fi
    break
  done
  line=$(grep -E "reason=|HARNESS FAULT|did not hold" "$OUT/$id.txt" | head -2 | tr '\n' ' ')
  echo "$id exit=$st $line" >> "$OUT/_summary.txt"
done
cd "$WT" && cmp scripts/finding-guards.json "$OUT/finding-guards.before.json" && echo "REGISTRY cmp IDENTICAL" >> "$OUT/_summary.txt" || echo "REGISTRY cmp DIFFERS" >> "$OUT/_summary.txt"
cd "$WT" && git status --short >> "$OUT/_summary.txt"; echo DONE >> "$OUT/_summary.txt"
