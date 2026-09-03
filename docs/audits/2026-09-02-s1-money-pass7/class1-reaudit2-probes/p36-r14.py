from _boot import *
def unfix(path, find, replace, label, cmds):
    o = read_bytes(path)
    try:
        s = o.decode('utf-8')
        assert find in s, 'ANCHOR MISSING: ' + label
        open(path,'wb').write(s.replace(find, replace, 1).encode('utf-8'))
        print('###', label)
        for c in cmds:
            code,out = run(c)
            sel = [l.strip()[:130] for l in out.splitlines() if l.strip().startswith(('✅','❌')) or 'FAIL' in l or 'BLIND' in l or 'not bounded' in l]
            print('   %-28s EXIT=%d' % (' '.join(c[-1:]), code))
            for l in sel[:3]: print('      ', l)
    finally:
        print('   RESTORE_OK=', restore(path, o))

# D1-9 / R8 — revert topLevelKeys to the two-space indent anchor
unfix('scripts/check-finding-guards.ts',
      'function topLevelKeys(raw: string): string[] {\n  const keys: string[] = [];',
      "function topLevelKeys(raw: string): string[] {\n  return [...raw.matchAll(/^\s{2}\"([^\"]+)\":/gm)].map((m) => m[1]);\n  const keys: string[] = [];",
      'D1-9 un-fix: topLevelKeys back to the /^\s{2}"…":/gm anchor',
      [['npx','tsx','scripts/check-finding-guards.ts']])

# R8 — hand-decode the escapes again instead of JSON.parse
unfix('scripts/check-finding-guards.ts',
      'keys.push(JSON.parse(`"${current}"`) as string);',
      'keys.push(current);',
      'R8 un-fix: keep the RAW key text instead of JSON.parse-decoding it',
      [['npx','tsx','scripts/check-finding-guards.ts']])

# C1-9 — drop the per-line trim
unfix('apps/rn/src/components/plan/unreadInputsCopy.test.ts',
      '    .map((line) => line.trim())\n', '',
      'C1-9 un-fix: drop `.map((line) => line.trim())`',
      [['npm','run','test:app']])

# R12 — drop the concatenation-junction normalisation
unfix('apps/rn/src/components/plan/unreadInputsCopy.test.ts',
      "    .replace(/['\"`]\s*\+\s*['\"`]/g, '');", "    ;",
      'R12 un-fix: drop the concatenation-junction replace',
      [['npm','run','test:app']])
