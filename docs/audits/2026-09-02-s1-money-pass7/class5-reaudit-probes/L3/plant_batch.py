"""L3 batch plant driver — one export per APP plant set, many spec runs against it.

usage: python plant_batch.py <config.json> <out.txt>

config = {
  "worktree": "C:/Users/Jason/audit-c5r1-L3",
  "app_plants": [[rel, find, replace], ...],          # applied before the export; [] = control bundle
  "runs": [ {"name": str, "spec": "x.spec.ts", "grep": str,
             "spec_plants": [[rel, find, replace], ...]} ]  # spec plants need no re-export
}
Strings are UTF-8 text; matched as BYTES after encoding, so CRLF must be spelled in the config if an anchor spans lines.

Method (the brief's): every anchor must match exactly once; originals copied BEFORE any plant; restores in `finally`
and verified with filecmp (cmp); the web server this script starts is killed in `finally` (taskkill /T /F) and the
port is asserted free before start and after stop.
"""
import filecmp, json, os, shutil, socket, subprocess, sys, tempfile, time

cfg = json.load(open(sys.argv[1], encoding='utf-8'))
out = open(sys.argv[2], 'w', encoding='utf-8')
wt = cfg['worktree']
PORT = 4319
ENV = dict(os.environ, NODE_OPTIONS='--max-old-space-size=1536', PYTHONIOENCODING='utf-8', FORCE_COLOR='0')


def say(s):
    print(s, flush=True)
    out.write(s + '\n')
    out.flush()


def listening():
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', PORT)) == 0


def apply(plants, backups):
    """Accumulates per file; every anchor must match once against the text as edited so far."""
    working = {}
    for rel, find, repl in plants:
        p = os.path.join(wt, rel)
        if rel not in backups:
            bk = os.path.join(tempfile.mkdtemp(prefix='l3b-'), os.path.basename(rel) + '.orig')
            shutil.copyfile(p, bk)
            backups[rel] = bk
        text = working.get(rel, open(p, 'rb').read())
        f, r = find.encode('utf-8'), repl.encode('utf-8')
        n = text.count(f)
        say(f'  plant {rel}: anchor count={n} :: {find[:90]!r}')
        if n != 1:
            raise SystemExit(f'ABORT: anchor must match exactly once in {rel}')
        working[rel] = text.replace(f, r)
    for rel, text in working.items():
        p = os.path.join(wt, rel)
        orig = open(backups[rel], 'rb').read()
        open(p, 'wb').write(text)
        say(f'  applied {rel}: changed={open(p, "rb").read() != orig}')


def restore(backups):
    ok = True
    for rel, bk in backups.items():
        p = os.path.join(wt, rel)
        shutil.copyfile(bk, p)
        same = filecmp.cmp(bk, p, shallow=False)
        say(f'  RESTORE {rel}: cmp identical={same}')
        ok = ok and same
    backups.clear()
    if not ok:
        say('!!! A RESTORE FAILED — stop and recover by hand')
        sys.exit(3)


app_backups = {}
server = None
try:
    if listening():
        raise SystemExit(f'ABORT: something is already listening on :{PORT} — a reused server would serve a foreign bundle')
    say(f'== app plants ({len(cfg["app_plants"])}) ==')
    apply(cfg['app_plants'], app_backups)
    say('== export:web --clear ==')
    t = time.time()
    r = subprocess.run('npm --prefix apps/rn run export:web -- --clear', cwd=wt, shell=True, capture_output=True, env=ENV)
    tail = (r.stdout + r.stderr).decode('utf-8', 'replace').strip().splitlines()[-6:]
    say(f'  export exit={r.returncode} in {time.time() - t:.0f}s :: ' + ' | '.join(tail))
    if r.returncode != 0:
        raise SystemExit('ABORT: export failed (an OOM here is a FINDING, not a retry)')
    server = subprocess.Popen(f'npx serve "{os.path.join(wt, "apps", "rn", "dist")}" -l {PORT} -s', cwd=wt, shell=True,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=ENV,
                              creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
    for _ in range(120):
        if listening():
            break
        time.sleep(0.5)
    say(f'== server pid={server.pid} listening={listening()} ==')
    for run in cfg['runs']:
        spec_backups = {}
        say(f'\n-- RUN {run["name"]} :: {run["spec"]} -g {run["grep"]!r}')
        try:
            apply(run.get('spec_plants', []), spec_backups)
            argv = ['npx.cmd', 'playwright', 'test', '--config', 'apps/rn/playwright.config.ts', run['spec'], '-g', run['grep'],
                    '--reporter=list', '--workers=1', '--retries=0']
            r = subprocess.run(argv, cwd=wt, capture_output=True, env=ENV)
            text = (r.stdout + r.stderr).decode('utf-8', 'replace')
            out.write(text)
            out.flush()
            say(f'   exit={r.returncode} :: ' + ' | '.join(l.strip() for l in text.splitlines() if l.strip().startswith(('ok ', 'x ', '✘', 'Error:')) or ' passed' in l or ' failed' in l)[:900])
        finally:
            restore(spec_backups)
finally:
    if server is not None:
        subprocess.run(f'taskkill /PID {server.pid} /T /F', shell=True, capture_output=True)
        for _ in range(40):
            if not listening():
                break
            time.sleep(0.5)
    say(f'\n== server stopped; :{PORT} listening={listening()} ==')
    restore(app_backups)
