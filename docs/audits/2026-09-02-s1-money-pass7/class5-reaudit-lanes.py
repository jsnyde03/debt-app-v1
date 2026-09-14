"""Class-5 re-audit lane manifest: generated from git, never typed.

Every tracked code file changed in 8ccae93f..HEAD is assigned to exactly one lane by rule.
Origin: 'class5' if it changed in c7df99c2..HEAD, 'class4-tail' if only in 8ccae93f..c7df99c2
(both -> 'class5+class4-tail'). Asserts: every file assigned once, none unmatched.
Also lists registry proofs whose command needs Playwright (run on :4319 -> L3 only).
"""
import json, subprocess, sys, os, re

REPO = r"C:\Users\Jason\debt-app-v1"
OUT = os.path.join(REPO, "docs", "audits", "2026-09-02-s1-money-pass7", "CLASS5-REAUDIT-LANES.tsv")

def git(*args):
    r = subprocess.run(["git", "-C", REPO, *args], capture_output=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        sys.exit(f"git {' '.join(args)} failed: {r.stderr}")
    return r.stdout

SCOPE = ["apps", "packages", "scripts"]
c5 = set(git("diff", "--name-only", "c7df99c2..HEAD", "--", *SCOPE).split())
tail = set(git("diff", "--name-only", "8ccae93f..c7df99c2", "--", *SCOPE).split())
allf = sorted(c5 | tail)

def lane(p):
    if p.startswith("scripts/") or p == "apps/rn/src/testing/runAppTests.ts":
        return "L4"
    if p.startswith(("apps/rn/src/appIntents/", "apps/rn/src/liveActivity/", "apps/rn/src/widget/",
                     "apps/rn/modules/", "apps/rn/plugins/", "apps/rn/targets/", "apps/rn/.maestro/")) \
       or p in ("apps/rn/src/store/store.ts", "apps/rn/src/store/appliedIntents.ts",
                "apps/rn/src/data/models.ts", "apps/rn/src/components/more/LiveActivityQA.tsx"):
        return "L2"
    if p.startswith(("apps/rn/src/app/", "apps/rn/tests/e2e/")) or \
       (p.startswith("apps/rn/src/components/plan/") and "dataRepairsCopy" not in p):
        return "L3"
    if p.startswith(("apps/rn/src/store/", "packages/core/")) or "dataRepairsCopy" in p:
        return "L1"
    return None

rows, unmatched = [], []
for p in allf:
    L = lane(p)
    if L is None:
        unmatched.append(p); continue
    origin = "class5+class4-tail" if (p in c5 and p in tail) else ("class5" if p in c5 else "class4-tail")
    exists = os.path.exists(os.path.join(REPO, p))
    lines = sum(1 for _ in open(os.path.join(REPO, p), "rb")) if exists else 0
    rows.append((L, origin, lines, p, exists))

if unmatched:
    sys.exit("UNMATCHED (no lane rule): " + ", ".join(unmatched))
assert len(rows) == len(allf), (len(rows), len(allf))
assert len({r[3] for r in rows}) == len(rows), "duplicate path"
missing = [r[3] for r in rows if not r[4]]

with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write("lane\torigin\tlines\tpath\n")
    for L, origin, lines, p, _ in sorted(rows):
        f.write(f"{L}\t{origin}\t{lines}\t{p}\n")

print(f"files: {len(allf)} (class5 {len(c5)} | class4-tail {len(tail)} | both {len(c5 & tail)})")
print(f"deleted-on-disk: {missing or 'none'}")
for L in ("L1", "L2", "L3", "L4"):
    sel = [r for r in rows if r[0] == L]
    print(f"{L}: {len(sel)} files, {sum(r[2] for r in sel)} lines  tail-files: {[r[3] for r in sel if 'tail' in r[1]]}")

reg = json.load(open(os.path.join(REPO, "scripts", "finding-guards.json"), encoding="utf-8"))
entries = reg.get("entries", reg) if isinstance(reg, dict) else reg
pw = []
items = entries.items() if isinstance(entries, dict) else [(e.get("id"), e) for e in entries]
for fid, e in items:
    if not isinstance(e, dict):
        continue
    proofs = e.get("proof")
    proofs = proofs if isinstance(proofs, list) else ([proofs] if proofs else [])
    for pr in proofs:
        blob = json.dumps({k: pr.get(k) for k in ("run", "cmd")}) if isinstance(pr, dict) else ""
        if re.search(r"e2e|playwright", blob, re.I):
            pw.append(fid); break
print(f"registry entries: {len(items)}; Playwright-backed proofs: {len(pw)}")
print("PW ids:", " ".join(sorted(map(str, pw))))
print("wrote", OUT)
