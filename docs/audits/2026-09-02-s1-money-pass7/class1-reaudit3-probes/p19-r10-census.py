from plant import *
import os
W = 'apps/rn/src/components/plan/WindfallSheet.tsx'
AC = 'scripts/check-amount-collapse.ts'
SCRIPTS = os.path.join(ROOT, 'scripts')

print('##### R10 — the substitution plant, against the now-EMPTY ALLOWED')
with Plant(W) as p:
    p.replace("  const n = parsed === null ? 0 : parsed;",
              "  const n = parsed === null ? -1 : parsed;\n  const __stored = parseAmountField(amount) ?? 0;\n  void __stored;")
    rc, out = gate('check-amount-collapse')
    show('R10 dishonest collapse substituted', rc, out, grep='collapse')

print('##### R10 residual — is the EMPTY ALLOWED itself pinned?')
with Plant(AC) as p:
    p.replace("const ALLOWED: Record<string, { expect: string[]; why: string }> = {};",
              "const ALLOWED: Record<string, { expect: string[]; why: string }> = {\n"
              "  'apps/rn/src/components/plan/WindfallSheet.tsx': { expect: ['parseAmountField(amount) ?? 0'], why: 'planted' },\n};")
    saved = read_bytes(AC)
    with Plant(W) as q:
        q.replace("  const n = parsed === null ? 0 : parsed;",
                  "  const n = parsed === null ? -1 : parsed;\n  const __stored = parseAmountField(amount) ?? 0;\n  void __stored;")
        rc, out = gate('check-amount-collapse')
        show('R10 with an ALLOWED entry re-added + a dishonest collapse', rc, out, grep='collapse')
    assert read_bytes(AC) == saved
    rc, out = run('npx','tsx','scripts/check-cap-literals.ts')
    show('  does any gate notice ALLOWED stopped being empty?', rc, out, grep='cap literals')

print('##### R15 / N-10 — the census ratchet')
NEW = os.path.join(SCRIPTS, 'check-zz-reaudit3-probe.ts')
body = ("import { readFileSync } from 'node:fs';\n"
        "const src = readFileSync('package.json', 'utf8');\n"
        "src.split('\n').forEach((line) => { if (line.includes('zzz-never')) console.log(line); });\n"
        "console.log('probe');\n")
try:
    with open(NEW, 'w', encoding='utf-8', newline='\n') as f: f.write(body)
    rc, out = run('npx','tsx','scripts/test-wrap-escapes.ts')
    show('R15 a NEW per-line gate in neither list', rc, out, grep='check-zz')
    # now add it to PER_LINE_UNREVIEWED (12 rows) and see whether the ratchet notices growth
    with Plant('scripts/test-wrap-escapes.ts') as p:
        p.replace("const PER_LINE_UNREVIEWED = new Set([\n  'check-audit-closure.ts',",
                  "const PER_LINE_UNREVIEWED = new Set([\n  'check-zz-reaudit3-probe.ts',\n  'check-audit-closure.ts',")
        rc, out = run('npx','tsx','scripts/test-wrap-escapes.ts')
        show('N-10 the same gate waved through by adding a row', rc, out, grep='wrap-escapes:')
finally:
    if os.path.exists(NEW): os.remove(NEW)
    print('   probe gate removed:', not os.path.exists(NEW))
