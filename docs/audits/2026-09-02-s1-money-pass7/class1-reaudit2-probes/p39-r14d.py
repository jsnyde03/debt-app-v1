from _boot import *
def unfix(path, find, replace, label, cmds):
    o = read_bytes(path)
    try:
        s = o.decode('utf-8')
        NL = '\r\n' if s.count('\r\n') else '\n'
        f = find.replace('\n', NL); r = replace.replace('\n', NL)
        assert f in s, 'ANCHOR MISSING: ' + label
        open(path,'wb').write(s.replace(f, r, 1).encode('utf-8'))
        print('###', label)
        for c in cmds:
            code,out = run(c)
            print('   EXIT=%d' % code)
            for l in out.splitlines():
                t=l.strip()
                if 'FAIL' in t or t.startswith('❌'): print('      ', t[:175])
    finally:
        print('   RESTORE_OK=', restore(path, o))
U='apps/rn/src/components/plan/unreadInputsCopy.test.ts'
D='apps/rn/src/components/entities/debtPrefill.test.ts'
Q = chr(39); DQ = chr(34); BT = chr(96); BS = chr(92)
r12find = ".replace(/[" + Q + DQ + BT + "]" + BS + "s*" + BS + "+" + BS + "s*[" + Q + DQ + BT + "]/g, '')"
unfix(U, r12find, ".replace(/ZZNEVERZZ/g, '')", 'R12 un-fix: neutralise the concat-junction replace', [['npm','run','test:app']])
unfix(D, r"src.match(/useState\([^;]*?\bediting\b/g)", r"src.match(/useState\(\s*editing\??\./g)", 'C2-9 un-fix: narrow the direct pattern back', [['npm','run','test:app']])
unfix(D, "const hoisted = [...src.matchAll(", "const hoisted: string[] = []; const _u = [...src.matchAll(", 'R11 un-fix: drop the hoisted-initialiser half', [['npm','run','test:app']])
