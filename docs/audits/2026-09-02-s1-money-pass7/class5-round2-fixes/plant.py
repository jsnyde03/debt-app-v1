"""
8.4.1 plant runner. For each plant in a JSON batch: replace ONE exact string, verify the plant applied, run the command,
score the red against the NAMED reason, then restore the original bytes and verify the restore by hash.

  python plant.py <batch.json> <out_dir>

Batch: {"control": {"cmd": "...", "cwd": "..."}, "plants": [{"name", "file", "old", "new", "cmd", "cwd", "expect": [substr, ...]}]}

Verdicts: MATCHED (non-zero exit and every expected substring present) · GREEN (the plant did not red — a finding about the
instrument, not a non-event) · RED-OTHER (red, but not for the named reason) · NOT-APPLIED (old string not exactly once).
Why bytes, not text=True: on Windows text mode decodes cp1252 and can strand a planted file. Why not `git checkout --`:
the fixes under test are uncommitted, and a checkout would discard them with the plant.
"""
import hashlib
import json
import os
import pathlib
import subprocess
import sys


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def run(cmd: str, cwd: str, timeout: int) -> tuple[int, str]:
    r = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, timeout=timeout, env=dict(os.environ))
    return r.returncode, (r.stdout + r.stderr).decode("utf-8", "replace")


def main() -> int:
    batch = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    out_dir = pathlib.Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    bad = 0

    ctl = batch.get("control")
    if ctl:
        code, out = run(ctl["cmd"], ctl["cwd"], ctl.get("timeout", 1800))
        (out_dir / "00-control.txt").write_text(f"exit={code}\n{out}", encoding="utf-8")
        print(f"CONTROL exit={code} {'OK' if code == 0 else 'RED — every plant below is meaningless'}", flush=True)
        if code != 0:
            return 2

    for i, p in enumerate(batch["plants"], start=1):
        path = pathlib.Path(p["file"])
        orig = path.read_bytes()
        h0 = sha(orig)
        text = orig.decode("utf-8")
        n = text.count(p["old"])
        if n != 1:
            print(f"{i:02d} {p['name']}: NOT-APPLIED (old string occurs {n}x)", flush=True)
            bad += 1
            continue
        planted = text.replace(p["old"], p["new"]).encode("utf-8")
        code, out = -1, ""
        try:
            path.write_bytes(planted)
            applied = path.read_bytes() == planted and planted != orig
            code, out = run(p["cmd"], p["cwd"], p.get("timeout", 1800))
        finally:
            path.write_bytes(orig)
        restored = sha(path.read_bytes()) == h0
        missing = [e for e in p["expect"] if e not in out]
        verdict = "MATCHED" if code != 0 and not missing else ("GREEN" if code == 0 else "RED-OTHER")
        slug = "".join(ch if ch.isalnum() else "-" for ch in p["name"])[:60]
        (out_dir / f"{i:02d}-{slug}.txt").write_text(
            f"plant={p['name']}\nfile={p['file']}\napplied={applied}\nexit={code}\nverdict={verdict}\nmissing={missing}\nrestored={restored}\n\n{out}",
            encoding="utf-8",
        )
        print(f"{i:02d} {p['name']}: applied={'YES' if applied else 'NO'} exit={code} {verdict} restored={'YES' if restored else 'NO!'}"
              + (f" missing={missing}" if missing else ""), flush=True)
        if verdict != "MATCHED" or not applied or not restored:
            bad += 1
        if not restored:
            print("⛔ RESTORE FAILED — stopping before anything else touches the tree", flush=True)
            return 3
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
