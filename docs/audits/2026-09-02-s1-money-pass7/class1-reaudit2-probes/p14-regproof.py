from _boot import *
L='scripts/lib/logicalLines.ts'
ol = read_bytes(L)
try:
    s = ol.decode('utf-8')
    find = "const open = depth > 0 || CONTINUES.test(structure[i] ?? '');"
    assert find in s, 'registered unfix anchor MISSING'
    open(L,'wb').write(s.replace(find, "const open = false;", 1).encode('utf-8'))
    print("PLANT: the REGISTERED unfix for S1P7-CLASS1-LOGICALJOIN (`const open = false;`)")
    c2,o2 = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('  test:wrap-escapes EXIT=%d' % c2)
    for l in o2.splitlines():
        if l.strip().startswith(('✅','❌','•')): print('   ', l.strip()[:160])
finally:
    print('RESTORE_OK=', restore(L, ol))
