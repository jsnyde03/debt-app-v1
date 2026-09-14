"""L3 plant runner: byte-mode plant, run a command, restore in finally, verify with cmp against a copy taken BEFORE.
usage: python plant.py <worktree> <relpath> <find-python-bytes-literal> <replace-python-bytes-literal> <out.txt> -- <cmd...>
"""
import ast, filecmp, os, shutil, subprocess, sys, tempfile
wt, rel, find, repl, out = sys.argv[1], sys.argv[2], ast.literal_eval(sys.argv[3]), ast.literal_eval(sys.argv[4]), sys.argv[5]
cmd = sys.argv[sys.argv.index('--') + 1:]
path = os.path.join(wt, rel)
backup = os.path.join(tempfile.mkdtemp(prefix='l3plant-'), os.path.basename(rel) + '.orig')
shutil.copyfile(path, backup)
with open(path, 'rb') as f:
    src = f.read()
n = src.count(find)
log = open(out, 'w', encoding='utf-8')
def say(s):
    print(s); log.write(s + '\n'); log.flush()
say(f'PLANT {rel}: anchor count={n}')
if n != 1:
    say('ABORT: anchor must match exactly once'); sys.exit(2)
try:
    with open(path, 'wb') as f:
        f.write(src.replace(find, repl))
    with open(path, 'rb') as f:
        say(f'plant applied: {f.read() != src}')
    env = dict(os.environ, NODE_OPTIONS='--max-old-space-size=1536', PYTHONIOENCODING='utf-8', FORCE_COLOR='0')
    r = subprocess.run(cmd, cwd=wt, capture_output=True, shell=True, env=env)
    text = (r.stdout + r.stderr).decode('utf-8', errors='replace')
    log.write(text); log.flush()
    say(f'planted-run exit={r.returncode}')
finally:
    shutil.copyfile(backup, path)
    same = filecmp.cmp(backup, path, shallow=False)
    say(f'RESTORE cmp identical={same}')
    if not same:
        say('!!! RESTORE FAILED'); sys.exit(3)
