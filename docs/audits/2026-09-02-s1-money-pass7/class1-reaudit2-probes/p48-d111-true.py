from _boot import *
C='scripts/check-sandbox-writes.ts'
oc = read_bytes(C)
try:
    s = oc.decode('utf-8'); NL = '\r\n' if s.count('\r\n') else '\n'
    # add the import the un-fixed version needs
    s = s.replace("import { flattenContinuations } from './lib/logicalLines';",
                  "import { flattenContinuations } from './lib/logicalLines';" + NL +
                  "import { stripCommentsOnly } from './lib/stripCode';", 1)
    tgt = "  const flat = flattenContinuations(source);" + NL + "  for (const m of flat.text.matchAll(IMPORT)) {" + NL
    assert tgt in s, 'anchor'
    # THE TRUE CLASS-1 DEFECT: one physical line at a time, import kept so the gate stays in the population
    repl = ("  const flat = flattenContinuations(source);" + NL +
            "  const __perLine = stripCommentsOnly(source).split('" + chr(92) + "n');" + NL +
            "  for (const m of __perLine.flatMap((l) => [...l.matchAll(IMPORT)])) {" + NL)
    open(C,'wb').write(s.replace(tgt, repl, 1).encode('utf-8'))
    c1,o1 = run(['npx','tsx','scripts/check-sandbox-writes.ts'])
    print('un-fixed gate on the clean tree EXIT=%d  %s' % (c1, [l.strip()[:90] for l in o1.splitlines() if l.strip().startswith(('✅','❌'))][:1]))
    if c1 not in (0,1) or not [l for l in o1.splitlines() if l.strip().startswith(('✅','❌'))]: print(o1[:600])
    c2,o2 = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('test:wrap-escapes EXIT=%d' % c2)
    for l in o2.splitlines():
        if 'sandbox' in l or l.strip().startswith(('✅ wrap','❌ wrap','•')): print('  ', l.strip()[:150])
finally:
    print('RESTORE_OK=', restore(C, oc))
