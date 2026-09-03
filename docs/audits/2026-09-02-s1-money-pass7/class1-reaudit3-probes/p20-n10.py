from plant import *
import os, shutil
NEW = os.path.join(ROOT, 'scripts', 'check-zz-reaudit3-probe.ts')
SRC = os.path.join(os.path.dirname(__file__), 'zz-probe-gate.txt')
try:
    shutil.copyfile(SRC, NEW)
    with Plant('scripts/test-wrap-escapes.ts') as p:
        p.replace("const PER_LINE_UNREVIEWED = new Set([\n  'check-audit-closure.ts',",
                  "const PER_LINE_UNREVIEWED = new Set([\n  'check-zz-reaudit3-probe.ts',\n  'check-audit-closure.ts',")
        rc, out = run('npx','tsx','scripts/test-wrap-escapes.ts')
        print('N-10: one row added to PER_LINE_UNREVIEWED (11 -> 12)  EXIT=', rc)
        for l in out.splitlines():
            if 'wrap-escapes:' in l or 'NOT YET REVIEWED' in l or 'problem' in l: print('   ', l.strip()[:200])
finally:
    if os.path.exists(NEW): os.remove(NEW)
    print('probe gate removed:', not os.path.exists(NEW))
