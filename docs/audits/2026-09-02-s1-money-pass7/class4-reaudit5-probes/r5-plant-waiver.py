"""R5 plant: does the borrow waiver accept a note that names a DIFFERENT, LONGER id
whose short form merely CONTAINS the real lender's short form?

Target entry: S1P3-B3-UNKNOWN (currently has an `expect` with NO lenders, so it does not
enter the complaint today).  We point its `expect` at S1-CLASS4-A3-1's token, which makes
A3-1 its lender.  Then we vary only `proofNote`.

  control  : a note naming nothing        -> the gate MUST complain (plant fires)
  attack   : "shares A3-14's red"          -> names a DIFFERENT entry; "A3-1" appears only
                                             as a substring of "A3-14".  If the gate is
                                             silent, the waiver is fooled.
  positive : "shares S1-CLASS4-A3-1's red" -> legitimate waiver, gate must be silent.

Byte mode, restore in `finally`, verified with cmp by the caller.
"""
import json, subprocess, sys, os, shutil

P = 'scripts/finding-guards.json'
PRE = 'docs/audits/2026-09-02-s1-money-pass7/class4-reaudit5-probes/finding-guards.PRE.json'
TARGET = 'S1P3-B3-UNKNOWN'
LENDER_TOKEN = 'declares NO shortfall on a $300 paycheck'   # == S1-CLASS4-A3-1's token

CASES = [
    ('control  (no lender named)', 'this note names nothing at all'),
    ('attack   (names A3-14 only)', "shares A3-14's red"),
    ('positive (names A3-1 fully)', "shares S1-CLASS4-A3-1's red"),
]

orig = open(P, 'rb').read()
open(PRE, 'wb').write(orig)
data = json.loads(orig.decode('utf-8'))

def write(d):
    open(P, 'wb').write((json.dumps(d, indent=2, ensure_ascii=False) + '\n').encode('utf-8'))

env = dict(os.environ, PYTHONIOENCODING='utf-8', NODE_OPTIONS='--max-old-space-size=1536')

try:
    for label, note in CASES:
        d = json.loads(orig.decode('utf-8'))
        d[TARGET]['proof']['expect'] = LENDER_TOKEN
        d[TARGET]['proof']['proofNote'] = note
        write(d)
        r = subprocess.run(['npx', 'tsx', 'scripts/check-finding-guards.ts'],
                           capture_output=True, encoding='utf-8', errors='replace',
                           shell=True, env=env)
        out = (r.stdout or '') + (r.stderr or '')
        complained = TARGET in out and 'is a red on a NEIGHBOUR' in out
        print('=' * 70)
        print(label, '| exit', r.returncode, '| borrow complaint present:', complained)
        for line in out.splitlines():
            if TARGET in line or 'NEIGHBOUR' in line or 'NAME the lender' in line:
                print('   >', line.strip()[:200])
finally:
    open(P, 'wb').write(orig)
    print('=' * 70)
    print('restored; identical to pre-plant copy:', open(P, 'rb').read() == open(PRE, 'rb').read())
