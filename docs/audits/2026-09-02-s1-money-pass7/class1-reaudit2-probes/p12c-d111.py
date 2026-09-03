from _boot import *
C='scripts/check-sandbox-writes.ts'
oc = read_bytes(C)
try:
    s = oc.decode('utf-8')
    tgt = "  const flat = flattenContinuations(source);\n"
    assert tgt in s
    # Un-fix: keep the import and the API, put the continuation newlines BACK.
    repl = "  const flat = flattenContinuations(source);\n  flat.text = stripCommentsOnly(source);\n"
    open(C,'wb').write(s.replace(tgt, repl, 1).encode('utf-8'))
    c1,o1 = run(['npx','tsx','scripts/check-sandbox-writes.ts'])
    print('un-fixed gate on clean tree EXIT=%d  %s' % (c1, [l.strip()[:80] for l in o1.splitlines() if l.strip().startswith(('✅','❌'))][:1]))
    if c1 != 0: print(o1[-500:])
    c2,o2 = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('wrap-escapes EXIT=%d' % c2)
    for l in o2.splitlines():
        if 'sandbox' in l or l.strip().startswith(('✅ wrap','❌ wrap')): print('  ', l.strip()[:150])
finally:
    print('RESTORE_OK=', restore(C, oc))
