"""L2 byte-mode plant runner.

usage: python plant.py <worktree-apps-rn-dir> <relfile> <find-file> <replace-file> <cmd...>

- find/replace are read from files (bytes) so no shell quoting touches them.
- Runs the command CLEAN first (a red baseline is a fault), then planted, restoring in `finally`, then verifies the
  restored bytes against a copy taken BEFORE the plant (cmp), then runs the command clean again.
- Prints every FAIL [...] line from the planted run, so the redding assertion is read, not inferred.
"""
import filecmp
import os
import shutil
import subprocess
import sys
import tempfile

root, rel, find_path, repl_path = sys.argv[1:5]
cmd = sys.argv[5:]
target = os.path.join(root, rel)
find = open(find_path, 'rb').read()
repl = open(repl_path, 'rb').read()
env = dict(os.environ, NODE_OPTIONS='--max-old-space-size=1536', FORCE_COLOR='0')


def run(tag):
    p = subprocess.run(cmd, cwd=root, capture_output=True, env=env, shell=(os.name == 'nt'))
    out = (p.stdout + p.stderr).decode('utf-8', 'replace')
    fails = [l for l in out.splitlines() if 'FAIL [' in l or 'Error:' in l]
    sys.stdout.buffer.write(f'--- {tag}: exit={p.returncode}\n'.encode('utf-8'))
    for l in fails[:6]:
        sys.stdout.buffer.write(f'    {l.strip()[:400]}\n'.encode('utf-8'))
    return p.returncode


original = open(target, 'rb').read()
n = original.count(find)
if n != 1:
    print(f'FAULT: find occurs {n} times in {rel}')
    sys.exit(2)
backup = os.path.join(tempfile.mkdtemp(prefix='l2plant-'), 'orig')
shutil.copyfile(target, backup)

if run('clean-before') != 0:
    print('FAULT: red baseline')
    sys.exit(3)
try:
    open(target, 'wb').write(original.replace(find, repl))
    planted = run('PLANTED')
finally:
    shutil.copyfile(backup, target)
same = filecmp.cmp(backup, target, shallow=False)
print(f'restore verified by cmp: {same}')
if not same:
    print('FAULT: restore mismatch')
    sys.exit(4)
after = run('clean-after')
print(f'VERDICT: planted_exit={planted} clean_after_exit={after}')
