#!/usr/bin/env bash
# L2 plants, sequential, in the PRIMARY worktree only. Each plant: clean run -> plant -> run -> restore in finally ->
# cmp against a pre-plant copy -> clean run (plant.py). Runner files are copied in and removed by the trap.
set -u
P=/c/Users/Jason/debt-app-v1/docs/audits/2026-09-02-s1-money-pass7/class5-reaudit-probes/L2
RN=/c/Users/Jason/audit-c5r1-L2/apps/rn
cd "$RN" || exit 9
TSX="node ../../node_modules/tsx/dist/cli.mjs"
cp "$P/run-liveActivitySync-test.ts" src/__run_L2_las.ts
trap 'rm -f "$RN/src/__run_L2_las.ts"' EXIT

plant() { # name relfile cmd...
  local name=$1 rel=$2; shift 2
  echo "=== $name  ($rel)"
  python "$P/plant.py" "$RN" "$rel" "$P/plants/$name.find" "$P/plants/$name.repl" "$@"
}

LAS="$TSX src/__run_L2_las.ts"
PA="$TSX src/appIntents/pendingActions.test.ts"
APP="$TSX src/testing/runAppTests.ts"

plant PL1c src/liveActivity/liveActivitySync.ts $LAS
plant PL1  src/liveActivity/liveActivitySync.ts $LAS
plant PL15 src/liveActivity/liveActivitySync.ts $LAS
plant PL2c modules/live-activity/ios/LiveActivityModule.swift $LAS
plant PL2  modules/live-activity/ios/LiveActivityModule.swift $LAS
plant PL16 src/store/store.ts $PA
plant PL16b src/store/store.ts $PA
plant PL17 src/appIntents/pendingActions.ts $PA
plant PL18 src/appIntents/pendingActions.ts $PA
plant PL19 src/appIntents/pendingActions.ts $PA
plant PL12 src/widget/snapshot.ts $APP
echo "=== worktree status after plants"
git -C /c/Users/Jason/audit-c5r1-L2 status --short
