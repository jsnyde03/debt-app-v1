from _boot import *
C='scripts/check-sandbox-writes.ts'
oc = read_bytes(C)
try:
    s = oc.decode('utf-8')
    tgt = "  const flat = flattenContinuations(source);\n  for (const m of flat.text.matchAll(IMPORT)) {"
    repl = "  const flat = { text: stripCommentsOnly(source).split('\n').map((l) => l).join('\n'), lineAt: (_i: number) => 1 };\n  const perLine = stripCommentsOnly(source).split('\n');\n  for (const m of perLine.flatMap((l) => [...l.matchAll(IMPORT)])) {"
    assert tgt in s
    open(C,'wb').write(s.replace(tgt, repl, 1).encode('utf-8'))
    c1,o1 = run(['npx','tsx','scripts/check-sandbox-writes.ts'])
    print('gate EXIT=%d' % c1); print(o1[-900:])
finally:
    print('RESTORE_OK=', restore(C, oc))
