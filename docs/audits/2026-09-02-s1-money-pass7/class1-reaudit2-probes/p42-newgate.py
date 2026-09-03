from _boot import *
import os
W='scripts/test-wrap-escapes.ts'
NEW='scripts/check-zz-reaudit-probe.ts'
o = read_bytes(W)
try:
    # A brand-new gate written the way all six class-1 members were: a per-PHYSICAL-line matcher.
    open(NEW,'w',encoding='utf-8',newline='\n').write(
        "import { readFileSync } from 'node:fs';\n"
        "const BANNED = /forbiddenCall\([^)]*\)/;\n"
        "const text = readFileSync('package.json', 'utf8');\n"
        "for (const line of text.split('\n')) { if (BANNED.test(line)) process.exit(1); }\n"
        "console.log('probe gate: clean');\n")
    print('### A new per-line check-*.ts exists and is in NEITHER list')
    c,out = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('   EXIT=%d' % c)
    for l in out.splitlines():
        if l.strip().startswith(('✅','❌','•')): print('     ', l.strip()[:170])
    # Now the escape hatch: name it in PER_LINE_UNREVIEWED.
    s = o.decode('utf-8'); NL = '\r\n' if s.count('\r\n') else '\n'
    open(W,'wb').write(s.replace("const PER_LINE_UNREVIEWED = new Set([" + NL,
        "const PER_LINE_UNREVIEWED = new Set([" + NL + "  'check-zz-reaudit-probe.ts'," + NL, 1).encode('utf-8'))
    print('### the same new gate, named in PER_LINE_UNREVIEWED (the "downward-only" list)')
    c,out = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('   EXIT=%d' % c)
    for l in out.splitlines():
        if l.strip().startswith(('✅','❌','•')): print('     ', l.strip()[:170])
finally:
    print('RESTORE_OK=', restore(W, o))
    if os.path.exists(NEW): os.remove(NEW)
    print('probe gate removed:', not os.path.exists(NEW))
