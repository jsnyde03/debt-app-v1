#!/usr/bin/env bash
#
# 3.5.8.10 — exercise `conform-app-preview.sh`'s assertions without a video, a Mac, or a CI cycle.
#
# ⚠️ WHY THIS EXISTS. That script's checks have now been wrong twice, and each time the cost was a
# ~17-minute macOS run:
#   · cycle 10 shipped a video that opened on 3.6s of black and flashed the capture slate, because every
#     assertion looked at the CONTAINER (dimensions, duration, frame rate) and none at the content.
#   · cycle 11 then FAILED WITH NO MESSAGE, because the new "does it open on black" check pipes into
#     `grep`, a `grep` that matches nothing exits 1, and under `set -euo pipefail` that took the whole
#     script down. The guard aborted the build by passing.
#
# The second one is the reason this file is a test rather than a comment: a guard whose success is
# indistinguishable from its failure cannot be reviewed by reading it. It has to be run.
#
# `ffmpeg` and `ffprobe` are stubbed on PATH, so this runs anywhere in about a second and asserts the
# CONTROL FLOW — which is the part that broke. It does not (and cannot) verify that `blackdetect` finds a
# real slate; that is what the CI cycle is for.
#
# Usage: bash scripts/test-conform-assertions.sh
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STUB="$(mktemp -d)"
trap 'rm -rf "$STUB"' EXIT

cat > "$STUB/ffprobe" <<'STUBEOF'
#!/usr/bin/env bash
case "$*" in
  *"stream=width -of csv=p=0"*)    echo 886 ;;
  *"stream=height -of csv=p=0"*)   echo 1920 ;;
  *"format=duration -of csv=p=0"*) echo "${STUB_DURATION:-21.100000}" ;;
  *) echo "width=886"; echo "height=1920"; echo "r_frame_rate=30/1" ;;
esac
STUBEOF

# STUB_SLATE / STUB_BLACK decide what the two content probes "see", which is exactly the axis the real
# script branches on.
cat > "$STUB/ffmpeg" <<'STUBEOF'
#!/usr/bin/env bash
case "$*" in
  *"-c:v libx264"*) for a in "$@"; do last="$a"; done; : > "$last"; exit 0 ;;
  *negate*)      [ "${STUB_SLATE:-0}" = 1 ] && echo "black_start:2 black_end:2.3 black_duration:0.3"; exit 0 ;;
  *blackdetect*) [ "${STUB_BLACK:-0}" = 1 ] && echo "black_start:0 black_end:3.6 black_duration:3.6"; exit 0 ;;
esac
exit 0
STUBEOF

chmod +x "$STUB/ffprobe" "$STUB/ffmpeg"

pass=0
fail=0

expect() {
  local name="$1" want="$2"; shift 2
  local out got
  out=$(PATH="$STUB:$PATH" "$@" bash "$HERE/conform-app-preview.sh" raw.mov "$STUB/out.mp4" 9.25 25 2>&1)
  got=$?
  if [ "$got" = "$want" ]; then
    pass=$((pass + 1)); echo "  ✓ $name (exit $got)"
  else
    fail=$((fail + 1)); echo "  ✗ $name — expected exit $want, got $got"; echo "$out" | sed 's/^/      /'
  fi
}

echo "▶ conform assertions"
# The one that matters most: a CLEAN video must exit 0. Cycle 11 exited 1 here, silently.
expect "a clean video passes"                0 env
expect "a surviving slate fails the build"   1 env STUB_SLATE=1
expect "opening on black fails the build"    1 env STUB_BLACK=1
# Apple's window is the container check that already existed; kept so a refactor cannot drop it.
expect "a too-short video fails the build"   1 env STUB_DURATION=9.0
expect "a too-long video fails the build"    1 env STUB_DURATION=44.0

echo
if [ "$fail" != 0 ]; then echo "❌ conform assertions: $fail failed, $pass passed."; exit 1; fi
echo "✅ conform assertions: $pass passed."
