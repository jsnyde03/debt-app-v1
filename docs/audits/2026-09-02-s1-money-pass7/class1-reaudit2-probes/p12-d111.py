from _boot import *
C='scripts/check-sandbox-writes.ts'
oc = read_bytes(C)
try:
    s = oc.decode('utf-8')
    tgt = "  const flat = flattenContinuations(source);\n  for (const m of flat.text.matchAll(IMPORT)) {\n    seen.add(rel);\n    if (ALLOWED[rel]) continue;\n    offenders.push({ file: rel, line: flat.lineAt(m.index), text: m[0].trim().slice(0, 160) });\n  }"
    assert tgt in s
    repl = "  const flat = flattenContinuations(source);\n  void flat;\n  for (const physical of stripCommentsOnly(source).split('\n')) {\n    for (const m of physical.matchAll(IMPORT)) {\n      seen.add(rel);\n      if (ALLOWED[rel]) continue;\n      offenders.push({ file: rel, line: 1, text: m[0].trim().slice(0, 160) });\n    }\n  }"
    open(C,'wb').write(s.replace(tgt, repl, 1).encode('utf-8'))
    c1,o1 = run(['npx','tsx','scripts/check-sandbox-writes.ts'])
    print('gate on clean tree EXIT=%d %s' % (c1, [l.strip()[:80] for l in o1.splitlines() if l.strip().startswith(('✅','❌'))][:1]))
    c2,o2 = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('wrap-escapes EXIT=%d' % c2)
    for l in o2.splitlines():
        if 'sandbox' in l or l.strip().startswith(('✅ wrap','❌ wrap')): print('  ', l.strip()[:150])
finally:
    print('RESTORE_OK=', restore(C, oc))
