"""Re-verify the earlier findings whose gate or producer round 5 CHANGED.

Each row: a clean baseline, one plant, the gate's own summary line, a cmp-verified restore.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plant

ROOT = r'C:\Users\Jason\debt-app-v1'
CRLF = chr(13) + chr(10)
Q = chr(39)
P = lambda *a: os.path.join(ROOT, *a)

REG = P('scripts', 'finding-guards.json')
STORE = P('apps', 'rn', 'src', 'store', 'analysisSelectors.ts')
CONTRAST_TGT = P('apps', 'rn', 'src', 'components', 'plan', 'PaydayGuardianCard.tsx')
GUARDSEL = P('apps', 'rn', 'src', 'store', 'guardianSelectors.test.ts')
CAPGATE = P('scripts', 'check-cap-literals.ts')
NEWGATE = P('scripts', 'check-zzcensus.ts')
CENSUS = P('scripts', 'test-wrap-escapes.ts')


def run(label, cmd, needles):
    c, o = plant.run(cmd)
    print('%-52s exit=%d :: %s' % (label, c, plant.pick(o, *needles)[:2]))
    return c, o


print('=== D1-9 / R8 — a duplicate id in the registry (the file grew 12 entries) ===')
run('  baseline', 'npx tsx scripts/check-finding-guards.ts', ['finding-guards'])
plant.replace(REG, '"S1P1-B1-OWNER": {', '"S1P1-B1-OWNER": {}, ' + CRLF + '  "S1P1-B1-OWNER": {')
run('  duplicate id planted', 'npx tsx scripts/check-finding-guards.ts', ['finding-guards', 'duplicate'])
print('  ', plant.restore(REG))

print()
print('=== U11 — the TOLERANCE direction and the DELETION direction, on the same token ===')
plant.replace(GUARDSEL,
              "'\u26d4 \u2026and it is NOT called the emergency fund \u2014 Money calls it Savings')",
              "'\u26d4 \u2026and it is NOT called the emergency fund \u2014 ' +" + CRLF +
              "      'Money calls it Savings')")
run('  guard token WRAPPED (must stay GREEN)', 'npx tsx scripts/check-finding-guards.ts',
    ['finding-guards', 'the guard is gone'])
print('  ', plant.restore(GUARDSEL))
plant.replace(GUARDSEL, 'and it is NOT called the emergency fund', 'and it is NOT called the rainy day pot')
run('  guard token DELETED (must be RED)', 'npx tsx scripts/check-finding-guards.ts',
    ['finding-guards', 'the guard is gone'])
print('  ', plant.restore(GUARDSEL))

print()
print('=== N-5 / T8 — check-store-id-writes after the BY_ID -> BY_ID_G collapse ===')
run('  baseline', 'npx tsx scripts/check-store-id-writes.ts', ['store id writes'])
plant.append(STORE, CRLF + 'export const __wrapLookup2 = (rows: { id: string }[], id: string) =>' + CRLF +
             '  rows.findIndex((r) => {' + CRLF + '    return r.id === id;' + CRLF + '  });' + CRLF)
run('  wrapped block-bodied findIndex (correct: GREEN)', 'npx tsx scripts/check-store-id-writes.ts',
    ['store id writes', 'bare'])
print('  ', plant.restore(STORE))
plant.append(STORE, CRLF + 'export const __bare = (rows: { id: string }[], id: string) =>' + CRLF +
             '  rows.map((r) => (r.id === id ? r : r));' + CRLF)
run('  bare comparison outside a lookup (must RED)', 'npx tsx scripts/check-store-id-writes.ts',
    ['store id writes', 'bare'])
print('  ', plant.restore(STORE))

print()
print('=== T7 / U4 / U10 — check-contrast, all three directions ===')
run('  baseline', 'npx tsx scripts/check-contrast.ts', ['check-contrast', 'exemption broken'])
plant.append(CONTRAST_TGT, CRLF + 'export const __wrapInk2 = {' + CRLF + '  color:' + CRLF +
             "    '#123456'," + CRLF + '};' + CRLF)
run('  U10 wrapped INK literal (must RED)', 'npx tsx scripts/check-contrast.ts',
    ['check-contrast', 'paints ink'])
print('  ', plant.restore(CONTRAST_TGT))
plant.append(CONTRAST_TGT, CRLF + '// A doc comment that merely NAMES the banned pairing: color: c.accent.brand' + CRLF)
run('  U4 comment naming the pairing (must stay GREEN)', 'npx tsx scripts/check-contrast.ts',
    ['check-contrast', 'exemption broken'])
print('  ', plant.restore(CONTRAST_TGT))
plant.append(CONTRAST_TGT, CRLF + 'export const __ink3 = { color: ' + Q + '#123456' + Q + ' };' + CRLF)
run('  same-line INK literal (must RED)', 'npx tsx scripts/check-contrast.ts',
    ['check-contrast', 'paints ink'])
print('  ', plant.restore(CONTRAST_TGT))

print()
print('=== N-11 — MIN_CAPS is 29 and pinned in both directions ===')
run('  baseline', 'npx tsx scripts/check-cap-literals.ts', ['cap literals'])
plant.replace(CAPGATE, 'const MIN_CAPS = 29;', 'const MIN_CAPS = 28;')
run('  MIN_CAPS lowered by one (must RED)', 'npx tsx scripts/check-cap-literals.ts', ['cap literals'])
print('  ', plant.restore(CAPGATE))


print()
print('=== U4 at the SECOND matcher: the INK scan still reads the RAW file ===')
run('  baseline', 'npx tsx scripts/check-contrast.ts', ['check-contrast', 'paints ink'])
plant.append(CONTRAST_TGT, CRLF + '// A doc comment that merely NAMES a hex ink: color: ' + Q + '#123456' + Q + CRLF)
run('  comment naming a hex ink, one line (must stay GREEN)', 'npx tsx scripts/check-contrast.ts',
    ['check-contrast', 'paints ink'])
print('  ', plant.restore(CONTRAST_TGT))
plant.append(CONTRAST_TGT, CRLF + 'export const __pal = [' + CRLF + '  // the CTA fill color:' + CRLF +
             "  '#123456'," + CRLF + '];' + CRLF)
run('  comment ends in `color:`, hex on the NEXT line (GREEN?)', 'npx tsx scripts/check-contrast.ts',
    ['check-contrast', 'paints ink'])
print('  ', plant.restore(CONTRAST_TGT))
plant.append(CONTRAST_TGT, CRLF + 'export const __pal2 = [' + CRLF + '  // the CTA fill token' + CRLF +
             "  '#123456'," + CRLF + '];' + CRLF)
run('  same array, comment reworded (control: GREEN)', 'npx tsx scripts/check-contrast.ts',
    ['check-contrast', 'paints ink'])
print('  ', plant.restore(CONTRAST_TGT))

print()
print('=== D3-* fail-open: a deleted guard whose token survives in a MID-LINE-opened block comment ===')
run('  baseline', 'npx tsx scripts/check-finding-guards.ts', ['finding-guards', 'the guard is gone'])
# delete the real assertion text AND re-introduce the token inside a block comment opened mid-line
plant.replace(GUARDSEL, 'and it is NOT called the emergency fund',
              'and it is NOT called the rainy day pot')
plant2 = (CRLF + 'const __x = 1; /* opens a block mid-line' + CRLF +
          'and it is NOT called the emergency fund' + CRLF + '*/' + CRLF + 'void __x;' + CRLF)
with open(GUARDSEL, 'rb') as f:
    cur = f.read()
with open(GUARDSEL, 'wb') as f:
    f.write(cur + plant2.encode('utf-8'))
run('  guard deleted + token in a mid-line block comment', 'npx tsx scripts/check-finding-guards.ts',
    ['finding-guards', 'the guard is gone', 'ONLY IN A COMMENT'])
print('  ', plant.restore(GUARDSEL))
