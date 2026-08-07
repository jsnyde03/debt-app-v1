#!/usr/bin/env bash
#
# 3.5.8.5 — conform a raw simulator recording into a submittable App Preview.
#
# ⚠️ This step is LOAD-BEARING, not a trim. The plan recorded (2026-07-30) that simulator capture "yields
# exact store pixel dimensions"; re-verified against Apple's App Preview specifications on 2026-08-06,
# that is FALSE. Every modern iPhone slot — 6.9" / 6.5" / 6.3" / 6.1" — takes ONE fixed **886x1920**
# portrait file, which is not any device's native resolution (a 6.9" simulator records at ~1320x2868).
# So the raw recording is never submittable and always needs this.
#
# The upside of the same fact: one correct file covers the entire modern iPhone lineup, so there is
# nothing to re-shoot per size.
#
# Apple's other current requirements, all enforced or respected below:
#   duration 15-30s · MAX 30fps · <=500MB · H.264 up to High Profile Level 4.0, target 10-12 Mbps
#   audio optional (omitted here - the demo has none, and previews autoplay muted anyway)
#
# Usage: conform-app-preview.sh <raw.mov> <out.mp4> [start_offset_seconds] [duration_seconds]
set -euo pipefail

RAW="${1:?usage: conform-app-preview.sh <raw.mov> <out.mp4> [start] [duration]}"
OUT="${2:?usage: conform-app-preview.sh <raw.mov> <out.mp4> [start] [duration]}"
START="${3:-1.0}"
DUR="${4:-25}"

W=886
H=1920

echo "── source ──"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames \
  -show_entries format=duration,size -of default=noprint_wrappers=1 "$RAW"

# `force_original_aspect_ratio=increase` then a centre crop, rather than a bare `scale=886:-2`.
#
# The bare version assumes the source is TALLER than 886:1920 (ratio 2.167) and silently produces a
# too-short frame if it is not — and the sim device is chosen at runtime by picking the newest iPhone
# available on the runner, so its aspect ratio is not something this script gets to assume. `increase`
# scales until BOTH dimensions cover the target, so the crop always has pixels to take. On a 6.9"
# (1320x2868, ratio 2.173) it removes ~5px of height: imperceptible, and correct in either direction.
#
# -r 30 is a CONSTANT frame rate, not a cap. Simulator recordings are variable-frame-rate, and ASC
# validates against the declared rate. `-fps_mode cfr` rather than the older `-vsync cfr`: the latter is
# deprecated and this runs against whatever Homebrew installs today, so the spelling that is not on a
# removal path is the safer one.
ffmpeg -y -hide_banner -loglevel warning \
  -ss "$START" -i "$RAW" -t "$DUR" \
  -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1" \
  -c:v libx264 -profile:v high -level:v 4.0 -pix_fmt yuv420p \
  -r 30 -fps_mode cfr \
  -b:v 11M -maxrate 12M -bufsize 24M \
  -an \
  -movflags +faststart \
  "$OUT"

echo "── conformed ──"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate \
  -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT"

# Fail LOUD on anything App Store Connect would reject, rather than uploading an artifact that dies at
# submit — the whole point of automating this is that Jason drops the file straight into ASC.
ACTUAL_W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$OUT")
ACTUAL_H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$OUT")
ACTUAL_D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")

fail=0
[ "$ACTUAL_W" = "$W" ] || { echo "❌ width $ACTUAL_W != $W"; fail=1; }
[ "$ACTUAL_H" = "$H" ] || { echo "❌ height $ACTUAL_H != $H"; fail=1; }
awk -v d="$ACTUAL_D" 'BEGIN { if (d < 15 || d > 30) { print "❌ duration " d "s is outside Apple’s 15-30s window"; exit 1 } }' || fail=1
[ "$fail" = 0 ] || { echo "❌ the conformed file would be REJECTED by App Store Connect"; exit 1; }

echo "✅ ${W}x${H}, ${ACTUAL_D}s, constant 30fps, H.264 high@4.0 — within Apple’s App Preview spec."
