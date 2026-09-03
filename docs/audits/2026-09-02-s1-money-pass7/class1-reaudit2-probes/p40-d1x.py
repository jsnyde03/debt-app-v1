from _boot import *
C='scripts/check-runner-completeness.ts'
G='scripts/run-gates.ts'
R='packages/core/testing/runRegressionTests.ts'

def two_file(label, cfix, gfix=None, rfix=None):
    oc, og, orr = read_bytes(C), read_bytes(G), read_bytes(R)
    try:
        s = oc.decode('utf-8'); NL = '\r\n' if s.count('\r\n') else '\n'
        f, r = cfix
        assert f.replace('\n',NL) in s, 'ANCHOR ' + label
        open(C,'wb').write(s.replace(f.replace('\n',NL), r.replace('\n',NL),1).encode('utf-8'))
        if gfix:
            sg = og.decode('utf-8'); NLg = '\r\n' if sg.count('\r\n') else '\n'
            f2,r2 = gfix; assert f2.replace('\n',NLg) in sg, 'ANCHOR G'
            open(G,'wb').write(sg.replace(f2.replace('\n',NLg), r2.replace('\n',NLg),1).encode('utf-8'))
        if rfix:
            sr = orr.decode('utf-8'); NLr = '\r\n' if sr.count('\r\n') else '\n'
            f3,r3 = rfix; assert f3.replace('\n',NLr) in sr, 'ANCHOR R'
            open(R,'wb').write(sr.replace(f3.replace('\n',NLr), r3.replace('\n',NLr),1).encode('utf-8'))
        print('###', label)
        code,out = run(['npx','tsx','scripts/check-runner-completeness.ts'])
        print('   EXIT=%d' % code)
        for l in out.splitlines():
            t=l.strip()
            if t.startswith(('✅','❌','•')) or 'lint:money' in t or 'testAbuseScenarios' in t: print('      ', t[:150])
    finally:
        print('   RESTORE:', restore(C,oc), restore(G,og), restore(R,orr))

# D1-1 un-fix: stop blanking comments before the chain-membership test, and comment the gate out.
two_file('D1-1 un-fix: raw run-gates.ts text + `// \'lint:money\',`',
         ("const runGatesRaw = stripCommentsOnly(readFileSync(join(REPO_ROOT, 'scripts/run-gates.ts'), 'utf8'));",
          "const runGatesRaw = readFileSync(join(REPO_ROOT, 'scripts/run-gates.ts'), 'utf8');"),
         gfix=("    'lint:money',\n", "    // 'lint:money',\n"))

# D1-2 un-fix: stop blanking comments before the runner-import test, and comment the suite out.
two_file('D1-2 un-fix: raw runner text + `// import "./testAbuseScenarios";`',
         ("const imported = r.imports(stripCommentsOnly(readFileSync(join(REPO_ROOT, r.runner), 'utf8')), r.runner);",
          "const imported = r.imports(readFileSync(join(REPO_ROOT, r.runner), 'utf8'), r.runner);"),
         rfix=('import "./testAbuseScenarios";', '// import "./testAbuseScenarios";'))
