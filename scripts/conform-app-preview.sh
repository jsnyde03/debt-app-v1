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
# ⚠️ The pipeline ALWAYS passes a start, found from the capture slate (`app-preview.yml`). This default is
# only for running the script by hand on a recording made some other way, and it is deliberately a poor
# guess rather than a plausible one — a plausible default is how a caller that forgot to pass a value gets
# a valid-looking file trimmed from the wrong place.
START="${3:-0}"
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
#
# ⚠️ `-ss` goes AFTER `-i`, and getting this wrong shipped a broken video through a green run.
#
# Before `-i` it is an INPUT seek, which on a variable-frame-rate simulator .mov lands on the nearest
# keyframe rather than the moment asked for. Cycle 10 was told to trim from 5.32s and produced a file that
# opened on **3.6 seconds of black followed by the capture slate** — the anchor three cycles had been spent
# making exact was simply not honoured. After `-i` it is an accurate seek: decode from the start, discard
# up to START, then encode. It costs a few seconds of decoding on a 45s file.
#
# This is the SAME lesson the frame extraction learned at cycle 7, in this same pipeline, never carried
# across to the step that makes the actual deliverable.
ffmpeg -y -hide_banner -loglevel warning \
  -i "$RAW" -ss "$START" -t "$DUR" \
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

# ⚠️ AND NOW THE ASSERTIONS ON WHAT IS ACTUALLY IN THE FILE, which is the half that was missing.
#
# Everything above checks the CONTAINER — dimensions, duration, frame rate. Cycle 10 passed every one of
# them while opening on 3.6s of black and then flashing the capture slate, because nothing looked at a
# single pixel of the thing being shipped. Every previous failure in this pipeline was found by opening a
# PNG pulled from the RAW recording; the deliverable itself was never examined.
#
# 1. THE SLATE MUST NOT SURVIVE. It is an internal timing mark. A full white frame in a store video is
#    unmistakable, and it is the one artifact this pipeline deliberately creates.
if ffmpeg -hide_banner -nostats -i "$OUT" \
     -vf "negate,blackdetect=d=0.05:pix_th=0.12:pic_th=0.90" -an -f null - 2>&1 | grep -q 'black_start'; then
  echo "❌ the capture slate is IN the conformed video — the trim did not clear it."
  fail=1
fi

# 2. IT MUST NOT OPEN ON BLACK. The first frame is what a store listing is judged by, and dead air at the
#    head is exactly what a mis-seek produces. Compared numerically rather than grepped for a literal
#    `black_start:0`, because ffmpeg's formatting of that zero is not something to bet the check on.
FIRST_BLACK=$(ffmpeg -hide_banner -nostats -i "$OUT" -t 2 \
                -vf "blackdetect=d=0.20:pix_th=0.10:pic_th=0.98" -an -f null - 2>&1 \
                | grep -o 'black_start:[0-9.]*' | head -1 | cut -d: -f2)
if [ -n "$FIRST_BLACK" ] && awk -v s="$FIRST_BLACK" 'BEGIN{exit !(s < 0.10)}'; then
  echo "❌ the conformed video opens on black (a black run starts at ${FIRST_BLACK}s)."
  echo "   The in-point is before the app is on screen."
  fail=1
fi

[ "$fail" = 0 ] || { echo "❌ the conformed file would be REJECTED by App Store Connect, or is not worth submitting"; exit 1; }

echo "✅ ${W}x${H}, ${ACTUAL_D}s, constant 30fps, H.264 high@4.0 — within Apple’s App Preview spec."
