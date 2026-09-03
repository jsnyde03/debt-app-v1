from _boot import *
W='scripts/test-wrap-escapes.ts'
o = read_bytes(W)
try:
    s = o.decode('utf-8'); NL = '\r\n' if s.count('\r\n') else '\n'
    # Move one gate OUT of PER_LINE_OK and into the "downward-only" unreviewed list: the set GROWS 12 -> 13.
    line = [l for l in s.split(NL) if l.strip().startswith("'check-apostrophes.ts':")][0]
    s2 = s.replace(line + NL, '', 1)
    s2 = s2.replace("const PER_LINE_UNREVIEWED = new Set([" + NL,
                    "const PER_LINE_UNREVIEWED = new Set([" + NL + "  'check-apostrophes.ts'," + NL, 1)
    open(W,'wb').write(s2.encode('utf-8'))
    print('PLANT: PER_LINE_OK 12 -> 11, PER_LINE_UNREVIEWED 12 -> 13 (the list that "only goes DOWN")')
    c,out = run(['npx','tsx','scripts/test-wrap-escapes.ts'])
    print('EXIT=%d' % c)
    for l in out.splitlines():
        if l.strip().startswith(('✅','❌','•')): print('   ', l.strip()[:170])
finally:
    print('RESTORE_OK=', restore(W, o))
