"""Byte-mode plant/run/restore harness for re-audit 6.

usage: plant6.py <file> <anchor-bytes-b64> <replacement-b64> <npm-script> [<npm-script> ...]

- reads/writes in BYTE mode ('rb'/'wb'); this repo mixes line endings and text mode rewrites them
- keeps the original bytes in a .r6bak sidecar AND in memory
- restores in a finally, then verifies with `cmp` (never `git diff`, never `git checkout --`)
- the sidecar suffix is deliberately NOT one of plantSafety's, and it is removed on the way out
"""
import base64, os, subprocess, sys, hashlib

path, anchor_b64, repl_b64 = sys.argv[1], sys.argv[2], sys.argv[3]
scripts = sys.argv[4:]
anchor = base64.b64decode(anchor_b64)
repl = base64.b64decode(repl_b64)

with open(path, 'rb') as f:
    original = f.read()
orig_sha = hashlib.sha256(original).hexdigest()

n = original.count(anchor)
if n != 1:
    print(f'PLANT-FAULT: anchor occurs {n} times in {path} (need exactly 1)')
    sys.exit(3)

bak = path + '.r6bak'
with open(bak, 'wb') as f:
    f.write(original)

planted = original.replace(anchor, repl)
if planted == original:
    print('PLANT-FAULT: replacement is a no-op')
    os.remove(bak)
    sys.exit(3)

results = {}
try:
    with open(path, 'wb') as f:
        f.write(planted)
    with open(path, 'rb') as f:
        assert f.read() == planted, 'PLANT-FAULT: bytes on disk are not the plant'
    print(f'PLANTED  {path}  ({len(original)} -> {len(planted)} bytes)')
    for s in scripts:
        p = subprocess.run(['npm', 'run', '--silent', s], capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace')
        tail = (p.stdout + p.stderr).strip().splitlines()
        keep = [l for l in tail if l.strip()][-14:]
        results[s] = p.returncode
        print(f'--- {s}: exit {p.returncode}')
        for l in keep:
            print('    ' + l)
finally:
    with open(path, 'wb') as f:
        f.write(original)
    c = subprocess.run(['cmp', bak, path], capture_output=True, text=True)
    with open(path, 'rb') as f:
        back_sha = hashlib.sha256(f.read()).hexdigest()
    ok = c.returncode == 0 and back_sha == orig_sha
    print(f'RESTORE  cmp={"IDENTICAL" if c.returncode == 0 else c.stdout.strip() + c.stderr.strip()}  sha={"MATCH" if back_sha == orig_sha else "MISMATCH"}')
    if not ok:
        print('⛔ RESTORE FAILED — do not continue')
        sys.exit(4)
    os.remove(bak)
print('EXITS ' + ' '.join(f'{k}={v}' for k, v in results.items()))
