"""R5 remedy measurement for the borrow waiver.

Plants a WORD-BOUNDARY matcher into check-finding-guards.ts and re-runs the same three
registry cases the attack probe used, plus a whole-registry run with the registry UNTOUCHED
(the fire-count check: the tightening must refuse nothing that passes today).

Two files are planted at once; both restores are in the same `finally`.
"""
import json, subprocess, os

GUARD = 'scripts/check-finding-guards.ts'
REG = 'scripts/finding-guards.json'
D = 'docs/audits/2026-09-02-s1-money-pass7/class4-reaudit5-probes/'
TARGET = 'S1P3-B3-UNKNOWN'
LENDER_TOKEN = 'declares NO shortfall on a $300 paycheck'

OLD = b"    const waived = lenders.some((l) => note.includes(l) || note.includes(l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '')));"
NEW = (b"    const namesIt = (n: string, needle: string) =>\n"
       b"      new RegExp(`(^|[^A-Za-z0-9-])${needle}([^A-Za-z0-9-]|$)`).test(n);\n"
       b"    const waived = lenders.some((l) => namesIt(note, l) || namesIt(note, l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '')));")

guard_orig = open(GUARD, 'rb').read()
reg_orig = open(REG, 'rb').read()
open(D + 'check-finding-guards.PRE.ts', 'wb').write(guard_orig)
open(D + 'finding-guards.PRE2.json', 'wb').write(reg_orig)

assert guard_orig.count(OLD) == 1, f'plant anchor not unique: {guard_orig.count(OLD)}'

env = dict(os.environ, PYTHONIOENCODING='utf-8', NODE_OPTIONS='--max-old-space-size=1536')

def run():
    r = subprocess.run(['npx', 'tsx', 'scripts/check-finding-guards.ts'],
                       capture_output=True, encoding='utf-8', errors='replace', shell=True, env=env)
    return r.returncode, (r.stdout or '') + (r.stderr or '')

try:
    open(GUARD, 'wb').write(guard_orig.replace(OLD, NEW))

    # 1. fire-count: registry untouched, tightened matcher
    code, out = run()
    print('=' * 70)
    print('FIRE-COUNT run (registry untouched, tightened matcher) | exit', code)
    for line in out.splitlines():
        if 'NEIGHBOUR' in line or 'finding-guards:' in line or 'Error' in line:
            print('   >', line.strip()[:200])

    for label, note in [('control  (no lender named)', 'this note names nothing at all'),
                        ('attack   (names A3-14 only)', "shares A3-14's red"),
                        ('positive (names A3-1 fully)', "shares S1-CLASS4-A3-1's red")]:
        d = json.loads(reg_orig.decode('utf-8'))
        d[TARGET]['proof']['expect'] = LENDER_TOKEN
        d[TARGET]['proof']['proofNote'] = note
        open(REG, 'wb').write((json.dumps(d, indent=2, ensure_ascii=False) + '\n').encode('utf-8'))
        code, out = run()
        complained = TARGET in out and 'is a red on a NEIGHBOUR' in out
        print('=' * 70)
        print(label, '| exit', code, '| borrow complaint present:', complained)
finally:
    open(GUARD, 'wb').write(guard_orig)
    open(REG, 'wb').write(reg_orig)
    print('=' * 70)
    print('guard restored identical:', open(GUARD, 'rb').read() == open(D + 'check-finding-guards.PRE.ts', 'rb').read())
    print('registry restored identical:', open(REG, 'rb').read() == open(D + 'finding-guards.PRE2.json', 'rb').read())
