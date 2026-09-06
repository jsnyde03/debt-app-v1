"""R5: what does the [R3-3-borrow] gate-plant scenario ACTUALLY red for when the
`waived` naming requirement is reverted to "has a note"?

The round-4 code comment in test-gate-plants.ts claims the scenario "goes GREEN under its
own plant, which test:gate-plants reports as failed-open".  The round-4 registry note for
S1P7-R3-3-BORROW claims "reason=WRONG".  Those are different failure modes; only one can be
right.  Measured by planting the revert and reading the harness's own line.
"""
import subprocess, os

GUARD = 'scripts/check-finding-guards.ts'
D = 'docs/audits/2026-09-02-s1-money-pass7/class4-reaudit5-probes/'
PRE = D + 'check-finding-guards.PRE3.ts'

OLD = b"    const waived = lenders.some((l) => note.includes(l) || note.includes(l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '')));"
NEW = b"    const waived = note.trim().length > 0;"

orig = open(GUARD, 'rb').read()
open(PRE, 'wb').write(orig)
assert orig.count(OLD) == 1, f'anchor not unique: {orig.count(OLD)}'

env = dict(os.environ, PYTHONIOENCODING='utf-8', NODE_OPTIONS='--max-old-space-size=1536')
out = ''
try:
    open(GUARD, 'wb').write(orig.replace(OLD, NEW))
    r = subprocess.run(['npx', 'tsx', 'scripts/test-gate-plants.ts'],
                       capture_output=True, encoding='utf-8', errors='replace',
                       shell=True, env=env, timeout=480)
    out = (r.stdout or '') + (r.stderr or '')
    print('exit', r.returncode)
finally:
    open(GUARD, 'wb').write(orig)
    print('restored identical:', open(GUARD, 'rb').read() == open(PRE, 'rb').read())

open(D + 'r5-borrow-scenario-planted.txt', 'w', encoding='utf-8').write(out)
for line in out.splitlines():
    if 'R3-3-borrow' in line or 'fail closed' in line or 'WRONG REASON' in line or 'failed open' in line or 'FAILED' in line:
        print('   >', line.rstrip()[:220])
