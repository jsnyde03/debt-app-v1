from _boot import *
C='scripts/check-sandbox-writes.ts'
oc = read_bytes(C)
try:
    s = oc.decode('utf-8')
    # (a) make the gate red for an UNRELATED reason: a stale ALLOWED entry
    s_a = s.replace("const ALLOWED: Record<string, string> = {",
                    "const ALLOWED: Record<string, string> = {\n  'apps/rn/src/utils/format.ts': 'planted stale entry',", 1)
    # (b) ALSO un-fix the class-1 defect: revert to per-physical-line while keeping the import
    tgt = "  const flat = flattenContinuations(source);\n  for (const m of flat.text.matchAll(IMPORT)) {\n    seen.add(rel);\n    if (ALLOWED[rel]) continue;\n    offenders.push({ file: rel, line: flat.lineAt(m.index), text: m[0].trim().slice(0, 160) });\n  }"
    assert tgt in s_a, 'anchor b'
    repl = "  const flat = { text: stripCommentsOnly(source), lineAt: (_i: number) => 1 };\n  for (const physical of flat.text.split('\n')) {\n    for (const m of physical.matchAll(IMPORT)) {\n      seen.add(rel);\n      if (ALLOWED[rel]) continue;\n      offenders.push({ file: rel, line: 1, text: m[0].trim().slice(0, 160) });\n    }\n  }"
    for label, text in [('stale-only', s_a), ('stale + un-fixed', s_a.replace(tgt, repl, 1))]:
        open(C,'wb').write(text.encode('utf-8'))
        c1,o1 = run(['npx','tsx','scripts/check-sandbox-writes.ts'])
        c2,o2 = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
        print('== %s' % label)
        print('   gate           EXIT=%d  %s' % (c1, [l.strip()[:90] for l in o1.splitlines() if l.strip().startswith(('✅','❌'))][:1]))
        print('   wrap-escapes   EXIT=%d' % c2)
        for l in o2.splitlines():
            if 'sandbox' in l or l.strip().startswith(('✅ wrap','❌ wrap')): print('     ', l.strip()[:150])
finally:
    print('RESTORE_OK=', restore(C, oc))
