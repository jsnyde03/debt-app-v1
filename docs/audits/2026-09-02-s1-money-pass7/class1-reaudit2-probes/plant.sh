#!/usr/bin/env bash
# Plant / run / restore. Restore is verified with cmp against a copy taken BEFORE the plant,
# and the plant is verified applied (cmp must FAIL while planted).
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
plant_run() {
  local target="$1"; shift        # repo-relative file
  local plantfile="$1"; shift     # file whose contents get appended (or "-" for none)
  local mode="$1"; shift          # append | prepend | none
  local abs="$ROOT/$target"
  local bak="$abs.reaudit2-bak"
  cp "$abs" "$bak" || { echo "BACKUP FAILED"; return 9; }
  case "$mode" in
    append)  cat "$plantfile" >> "$abs" ;;
    prepend) cat "$plantfile" "$bak" > "$abs" ;;
    none)    : ;;
  esac
  if cmp -s "$abs" "$bak"; then echo "PLANT-NOT-APPLIED"; fi
  "$@" ; local code=$?
  echo "EXIT=$code"
  cp "$bak" "$abs"
  if cmp -s "$abs" "$bak"; then echo "RESTORE=OK"; else echo "RESTORE=FAILED"; fi
  rm -f "$bak"
  return $code
}
