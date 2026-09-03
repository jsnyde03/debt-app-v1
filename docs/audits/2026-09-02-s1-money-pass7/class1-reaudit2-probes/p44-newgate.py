from _boot import *
import os, shutil, io
W='scripts/test-wrap-escapes.ts'
NEW='scripts/check-zz-reaudit-probe.ts'
FIX='docs/audits/2026-09-02-s1-money-pass7/class1-reaudit2-probes/newgate-fixture.ts.txt'
o = read_bytes(W)
try:
    shutil.copyfile(FIX, NEW)
    body = io.open(NEW, encoding='utf-8').read()
    print("probe gate contains a literal .split('" + chr(92) + "n'):", ".split('" + chr(92) + "n')" in body)
    print('### A new per-line check-*.ts, in NEITHER list')
    c,out = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('   EXIT=%d' % c)
    for l in out.splitlines():
        if l.strip().startswith(('✅','❌','•')): print('     ', l.strip()[:180])
    s = o.decode('utf-8'); NL = '\r\n' if s.count('\r\n') else '\n'
    open(W,'wb').write(s.replace("const PER_LINE_UNREVIEWED = new Set([" + NL,
        "const PER_LINE_UNREVIEWED = new Set([" + NL + "  'check-zz-reaudit-probe.ts'," + NL, 1).encode('utf-8'))
    print('### the same gate, opted out by one line in PER_LINE_UNREVIEWED (12 -> 13)')
    c,out = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('   EXIT=%d' % c)
    for l in out.splitlines():
        if l.strip().startswith(('✅','❌','•')): print('     ', l.strip()[:180])
finally:
    print('RESTORE_OK=', restore(W, o))
    if os.path.exists(NEW): os.remove(NEW)
    print('probe gate removed:', not os.path.exists(NEW))
