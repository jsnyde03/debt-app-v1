from _boot import *
G='scripts/run-gates.ts'
C='scripts/check-runner-completeness.ts'
og, oc = read_bytes(G), read_bytes(C)
try:
    # 1. Un-fix R13 in the PRODUCTION path only (chainRegion, the fixture-tested copy, untouched).
    sc = oc.decode('utf-8')
    tgt = 'const runGates = runGatesRaw.slice(gatesStart, gatesEnd);'
    assert tgt in sc, 'anchor: ' + repr([l for l in sc.splitlines() if 'runGates =' in l])
    sc2 = sc.replace(tgt, 'const runGates = runGatesRaw;', 1)
    open(C,'wb').write(sc2.encode('utf-8'))
    print('PLANT: production region widened to the whole file; chainRegion() untouched')
    code,out = run(['npx','tsx','scripts/check-runner-completeness.ts'])
    print('  clean-tree run EXIT=',code, '|', [l for l in out.splitlines() if l.strip().startswith(('✅','❌'))][:1])

    # 2. Now the R13 defect: delete lint:money from GATES, name it in a live string elsewhere.
    sg = og.decode('utf-8')
    sg2 = sg.replace("    'lint:money',\n", "", 1).replace("const GATES", "const PARKED_TEMPORARILY = ['lint:money'];\nconst GATES", 1)
    open(G,'wb').write(sg2.encode('utf-8'))
    code,out = run(['npx','tsx','scripts/check-runner-completeness.ts'])
    print('  R13 defect + widened region EXIT=',code)
    print(out[-700:])
finally:
    print('RESTORE_G=', restore(G, og), 'RESTORE_C=', restore(C, oc))
