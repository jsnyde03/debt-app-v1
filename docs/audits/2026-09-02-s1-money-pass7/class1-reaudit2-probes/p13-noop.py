from _boot import *
L='scripts/lib/logicalLines.ts'
ol = read_bytes(L)
try:
    s = ol.decode('utf-8')
    NL = '\r\n' if s.count('\r\n') else '\n'
    tgt = "  const text = chars.join('');" + NL
    assert tgt in s, 'anchor'
    repl = "  const text = visibleSrc;" + NL
    open(L,'wb').write(s.replace(tgt, repl, 1).encode('utf-8'))
    print('PLANT: flattenContinuations is a NO-OP (returns the un-flattened stripped source)')
    for g in ['check-amount-collapse','check-rounding','check-sandbox-writes','check-fixture-dates']:
        c,o = run(['npx','tsx','scripts/%s.ts' % g])
        line = [l.strip()[:120] for l in o.splitlines() if l.strip().startswith(('✅','❌'))]
        print('  %-24s EXIT=%d  %s' % (g, c, (line or [o.strip()[:120]])[0]))
    c2,o2 = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('  test:wrap-escapes        EXIT=%d' % c2)
    for l in o2.splitlines():
        if l.strip().startswith(('✅','❌','•')): print('     ', l.strip()[:160])
finally:
    print('RESTORE_OK=', restore(L, ol))
