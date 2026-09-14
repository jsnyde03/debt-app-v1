"""L1 plant driver — BYTE mode, anchor must match exactly once, restore in `finally`, verify with a byte compare
against a copy taken BEFORE the plant. Prints the command's exit code and the lines that name the red.

Usage: python plant.py <tree> <rel file> <find-file> <replace-file> <test rel path> [--control]
  find/replace are read from files (bytes) so no shell quoting touches them.
  --control: run the command with NO plant (the clean baseline for this exact command).
"""
import filecmp
import os
import shutil
import subprocess
import sys
import tempfile

tree, rel, find_path, repl_path, test_rel = sys.argv[1:6]
control = '--control' in sys.argv
probes = os.path.dirname(os.path.abspath(__file__))
target = os.path.join(tree, rel)
cwd = os.path.join(tree, 'apps', 'rn')
if test_rel == 'FULL':
    # the whole app-layer suite, exactly as `npm run test:app` runs it
    cmd = ['npx.cmd', 'tsx', 'src/testing/runAppTests.ts']
elif test_rel == 'REGRESSION':
    # ⚠️ `npm.cmd run test:regression` from a subprocess red in 3s with no output (a HARNESS fault, measured:
    # the same script run directly in bash is green). Use the script's own argv instead.
    cmd = ['npx.cmd', 'tsx', 'packages/core/testing/runRegressionTests']
    cwd = tree
else:
    cmd = [
        'npx.cmd', 'tsx', '--tsconfig', os.path.join(tree, 'apps', 'rn', 'tsconfig.json'),
        os.path.join(probes, 'run-test.ts'), os.path.join(tree, test_rel),
    ]
env = dict(os.environ, NODE_OPTIONS='--max-old-space-size=1536', FORCE_COLOR='0')

backup = os.path.join(tempfile.mkdtemp(prefix='l1plant-'), 'orig')
shutil.copyfile(target, backup)
try:
    if not control:
        with open(target, 'rb') as f:
            src = f.read()
        find = open(find_path, 'rb').read()
        repl = open(repl_path, 'rb').read()
        n = src.count(find)
        if n != 1:
            print(f'HARNESS FAULT: anchor matched {n} times in {rel}')
            sys.exit(3)
        with open(target, 'wb') as f:
            f.write(src.replace(find, repl))
        with open(target, 'rb') as f:
            if f.read().count(repl) < 1:
                print('HARNESS FAULT: plant did not land')
                sys.exit(3)
        print(f'PLANT LANDED in {rel}')
    # ⚠️ `cwd`, not a hard-coded apps/rn: job 3's REGRESSION control resolved `apps/rn/packages/core/...` and
    # red with ERR_MODULE_NOT_FOUND — a harness fault that voided that control and its plant.
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, env=env)
    out = (p.stdout + p.stderr).decode('utf-8', 'replace')
    print(f'EXIT {p.returncode}')
    lines = [l for l in out.splitlines() if 'RED' in l or 'Error' in l or 'expected' in l.lower() or 'DONE' in l]
    sys.stdout.buffer.write(('\n'.join(lines[:8]) + '\n').encode('utf-8'))
finally:
    shutil.copyfile(backup, target)
    same = filecmp.cmp(backup, target, shallow=False)
    print(f'RESTORED byte-identical: {same}')
    if not same:
        sys.exit(4)
