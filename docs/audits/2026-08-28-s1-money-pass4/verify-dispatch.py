#!/usr/bin/env python3
"""
[D68] — THE DISPATCH IS PART OF THE AUDIT. Every path, id and SHA in a brief is verified before hand-over.

Passes 1-3 did this by hand and it earned its keep every time: pass 3's check caught a wrong number in the
brief's own prose ("8 of 9" counted from memory where the [D69] table says 5). This is that check, committed,
so pass 5 and S2-S4 run it instead of re-deriving it.

    python docs/audits/<dir>/verify-dispatch.py            # checks BRIEF.md beside it

Exits 1 on any unresolvable reference. Four classes:
  links   every relative markdown link resolves on disk
  paths   every backticked file token OUTSIDE a link resolves — and a BARE basename must be UNIQUE in
          `git ls-files`, because an auditor handed an ambiguous basename reads whichever file they find
  shas    every backticked hex token is a real commit
  ids     every backticked S1P<n>-* token exists in scripts/finding-guards.json

⚠️ EXEMPTIONS ARE DECLARED HERE AND PRINTED, never silent. A printed hole is not a gate; an undeclared one
is worse. Each needs a reason that says why an auditor cannot be misled.
"""
import io
import json
import os
import re
import subprocess
import sys

# ⛔ The Windows console is cp1252 and this file's own PASS line carries a ✅. The first run crashed on
# that line and exited 1 — reporting FAIL for a run in which every reference resolved. An instrument must
# work in the world it reports on, including the world where it has nothing to say.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True, cwd=HERE).strip()

# ⚠️ path token -> why a bare basename cannot mislead here. Anything not listed must resolve uniquely.
EXEMPT = {
    'package.json': "prose says 'repo-root' and ROUTING-D.txt carries the exact tracked path; "
                    "apps/rn/package.json is the other basename match",
}


def main() -> int:
    brief = os.path.join(HERE, 'BRIEF.md')
    if not os.path.exists(brief):
        print(f'no BRIEF.md in {HERE}')
        return 1
    s = io.open(brief, encoding='utf-8').read()

    tracked = [t for t in subprocess.check_output(['git', 'ls-files'], text=True, cwd=ROOT).split('\n') if t]
    by_base: dict[str, list[str]] = {}
    for t in tracked:
        by_base.setdefault(os.path.basename(t), []).append(t)
    registry = json.load(io.open(os.path.join(ROOT, 'scripts', 'finding-guards.json'), encoding='utf-8'))

    fail: list[str] = []
    used_exemptions: set[str] = set()

    links = sorted(set(re.findall(r'\]\((?!https?:)([^)]+)\)', s)))
    for link in links:
        if not os.path.exists(os.path.normpath(os.path.join(HERE, link))):
            fail.append(f'link does not resolve: {link}')

    # Link TARGETS are explicit and checked above; link TEXT must not be re-judged as a bare basename.
    stripped = re.sub(r'\[[^\]]*\]\([^)]*\)', '', s)
    paths = sorted(set(re.findall(r'`([A-Za-z0-9_./-]+\.(?:ts|tsx|json|txt|tsv|md|mjs|cjs|sh))`', stripped)))
    for p in paths:
        if '/' in p:
            if p not in tracked:
                fail.append(f'path is not tracked: {p}')
        elif len(by_base.get(p, [])) != 1:
            if p in EXEMPT:
                used_exemptions.add(p)
            else:
                fail.append(f'bare basename resolves to {len(by_base.get(p, []))} files: {p} -> {by_base.get(p, [])}')

    shas = sorted(set(re.findall(r'`([0-9a-f]{7,40})`', s)))
    for h in shas:
        r = subprocess.run(['git', 'cat-file', '-t', h], capture_output=True, text=True, cwd=ROOT)
        if r.stdout.strip() != 'commit':
            fail.append(f'not a commit: {h}')

    ids = sorted(set(re.findall(r'`(S1P[0-9]-[A-Z0-9-]+)`', s)))
    for i in ids:
        if i not in registry:
            fail.append(f'guard id not in finding-guards.json: {i}')

    print(f'  {len(links)} links · {len(paths)} path tokens · {len(shas)} SHAs · {len(ids)} guard ids')
    stale = set(EXEMPT) - used_exemptions
    for e in sorted(used_exemptions):
        print(f'  EXEMPT  {e} — {EXEMPT[e]}')
    for e in sorted(stale):
        fail.append(f'stale exemption, nothing used it: {e}')

    if fail:
        print(f'\n❌ verify-dispatch: {len(fail)} unresolvable reference(s)\n')
        for f in fail:
            print(f'  {f}')
        return 1
    print('\n✅ verify-dispatch: every link, path, SHA and guard id in BRIEF.md resolves.\n')
    return 0


sys.exit(main())
