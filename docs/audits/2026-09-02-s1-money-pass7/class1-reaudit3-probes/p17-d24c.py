from plant import *
import json, os
REG = 'docs/audits/2026-09-02-s1-money-pass7/class1-reaudit3-probes/probe-registry.json'
TGT = 'packages/core/utils/percentComplete.ts'

print('##### 1. Does a fault reachable WHILE THE PLANT IS ON DISK leave it there?')
print('     (an artificial fault() inserted between the writeFileSync and the finally)')
snapshot = read_bytes(TGT)
with Plant('scripts/prove-guards.ts') as p:
    p.replace(
      "    withPlant = runUntilServed(id, 'planted', p);",
      "    if (process.env.PROBE_FAULT_AFTER_PLANT) fault(id, 'ARTIFICIAL FAULT after the plant was written');\n"
      "    withPlant = runUntilServed(id, 'planted', p);")
    env = dict(os.environ, PROBE_FAULT_AFTER_PLANT='1')
    r = subprocess.run(['npx','tsx','scripts/prove-guards.ts',f'--registry={REG}','--id=PROBE-A','--no-record'],
                       cwd=ROOT, capture_output=True, shell=True, env=env)
    out = (r.stdout or b'').decode('utf-8','replace') + (r.stderr or b'').decode('utf-8','replace')
    print('   EXIT=', r.returncode)
    for l in out.splitlines():
        if l.strip(): print('   ', l.strip()[:150])
    now = read_bytes(TGT)
    left = b'PROBE_A_PLANT' in now
    print(f'   >>> PROBE_A_PLANT still on disk after the fault: {left}')
    rc, gs = run('git','status','--porcelain','--',TGT)
    print(f'   >>> git status of the target: {gs.strip()!r}')
    if left:
        write_bytes(TGT, snapshot)
        print('   >>> target restored by the probe:', read_bytes(TGT) == snapshot)
assert read_bytes(TGT) == snapshot, 'TARGET NOT RESTORED'

print('\n##### 2. Is a file a RUN modifies restored, or only reported?')
reg = json.load(open(os.path.join(ROOT, REG), encoding='utf-8'))
reg['PROBE-D-WRITES'] = {
  "what": "hermetic probe D - its RUN appends to a DIFFERENT tracked file (a stray).",
  "file": TGT, "token": "export",
  "proof": {
    "unfix": [{"at": TGT, "find": "export", "replace": "export /*PROBE_D_PLANT*/"}],
    "cmd": ["node", "-e", "require('fs').appendFileSync('apps/rn/src/utils/format.ts','\n// PROBE_D_STRAY\n');console.log('PROBE_D_EXPECTED');process.exit(1)"],
    "expect": "PROBE_D_EXPECTED"
  }
}
open(os.path.join(ROOT, REG),'w',encoding='utf-8').write(json.dumps(reg, indent=2)+'\n')
fsnap = read_bytes('apps/rn/src/utils/format.ts')
rc, out = run('npx','tsx','scripts/prove-guards.ts',f'--registry={REG}','--id=PROBE-D-WRITES','--no-record')
print('   EXIT=', rc)
for l in out.splitlines():
    if l.strip(): print('   ', l.strip()[:170])
stray = b'PROBE_D_STRAY' in read_bytes('apps/rn/src/utils/format.ts')
print(f'   >>> the stray survives the run: {stray}')
write_bytes('apps/rn/src/utils/format.ts', fsnap)
print('   >>> format.ts restored:', read_bytes('apps/rn/src/utils/format.ts') == fsnap)
