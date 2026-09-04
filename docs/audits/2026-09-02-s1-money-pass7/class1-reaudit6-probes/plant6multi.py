"""Byte-mode multi-edit plant/run/restore harness. usage: plant6multi.py <spec.json>

spec: {"edits": [{"file": p, "anchor_b64": .., "repl_b64": ..}, ...], "scripts": [..], "grep": ".."}
Restores every file and cmp-verifies each one. Never uses `git checkout --`.
"""
import base64, hashlib, json, os, subprocess, sys

spec = json.load(open(sys.argv[1], encoding='utf-8'))
originals = {}
baks = {}
try:
    for e in spec['edits']:
        p = e['file']
        if p not in originals:
            with open(p, 'rb') as f:
                originals[p] = f.read()
            baks[p] = p + '.r6bak'
            with open(baks[p], 'wb') as f:
                f.write(originals[p])
    cur = dict(originals)
    for e in spec['edits']:
        p = e['file']
        a = base64.b64decode(e['anchor_b64'])
        r = base64.b64decode(e['repl_b64'])
        n = cur[p].count(a)
        if n != 1:
            print(f'PLANT-FAULT: anchor occurs {n} times in {p}')
            sys.exit(3)
        cur[p] = cur[p].replace(a, r)
    for p, b in cur.items():
        with open(p, 'wb') as f:
            f.write(b)
        print(f'PLANTED {p} ({len(originals[p])} -> {len(b)} bytes)')
    for s in spec['scripts']:
        pr = subprocess.run(['npm', 'run', '--silent', s], capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace')
        txt = pr.stdout + pr.stderr
        print(f'--- {s}: exit {pr.returncode}')
        g = spec.get('grep')
        lines = [l for l in txt.splitlines() if l.strip()]
        shown = [l for l in lines if g and g in l] if g else []
        for l in (shown or lines[-16:]):
            print('    ' + l)
finally:
    ok = True
    for p, orig in originals.items():
        with open(p, 'wb') as f:
            f.write(orig)
        c = subprocess.run(['cmp', baks[p], p], capture_output=True, text=True)
        h = hashlib.sha256(open(p, 'rb').read()).hexdigest()
        good = c.returncode == 0 and h == hashlib.sha256(orig).hexdigest()
        print(f'RESTORE {p}: cmp={"IDENTICAL" if c.returncode==0 else "DIFFER"} sha={"MATCH" if h==hashlib.sha256(orig).hexdigest() else "MISMATCH"}')
        ok = ok and good
        if good:
            os.remove(baks[p])
    if not ok:
        print('⛔ RESTORE FAILED')
        sys.exit(4)
