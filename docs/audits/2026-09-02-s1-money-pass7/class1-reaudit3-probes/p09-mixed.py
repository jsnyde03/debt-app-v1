from plant import *
import datetime
BT = chr(96); D = chr(36)

print('########## R5 — template interpolation (exact re-audit-1 plant)')
with Plant('apps/rn/src/utils/format.ts') as p:
    p.append("\nexport function __r5(raw: string, x: number) {\n  return " + BT + D + "{parseAmountField(raw) ?? 0} and " + D + "{Math.round(x * 100) / 100}" + BT + ";\n}\n")
    show('R5 amount-collapse', *gate('check-amount-collapse'), grep='collapses')
    show('R5 rounding', *gate('check-rounding'), grep='rounding:')

print('########## N-4 — check-local-dates spellings')
T = 'packages/core/utils/percentComplete.ts'
for label, snip in {
  'control same-line': "\nexport const __u1 = (d: Date) => d.toISOString().slice(0, 10);\n",
  'method chain wrapped (the RECIPE)': "\nexport const __u2 = (d: Date) =>\n  d\n    .toISOString()\n    .slice(0, 10);\n",
  'ARGUMENT LIST wrapped, Prettier trailing comma': "\nexport const __u3 = (d: Date) =>\n  d.toISOString().slice(\n    0,\n    10,\n  );\n",
  'argument list wrapped, NO trailing comma': "\nexport const __u4 = (d: Date) =>\n  d.toISOString().slice(\n    0,\n    10\n  );\n",
  'split(T)[0] with trailing comma': "\nexport const __u5 = (d: Date) => d.toISOString().split(\n  'T',\n)[0];\n",
}.items():
    with Plant(T) as p:
        p.append(snip)
        rc, out = gate('check-local-dates')
        line = [l for l in out.strip().splitlines() if 'UTC' in l or 'local dates' in l]
        print(f'--- {label}  EXIT={rc}  {line[0].strip()[:120] if line else ""}')

print('########## R4 — two correct statements read as one collapse (JSX)')
with Plant('apps/rn/src/components/plan/PaydayGuardianCard.tsx') as p:
    p.insert_after('<Card testID="payday-guardian-card">',
        "\n        <Text>{String(parseAmountField(rawA))}</Text>\n        <Text>a</Text>\n        <Text>b</Text>\n        <Text>c</Text>\n        <Text>{Number(other) ?? 0}</Text>")
    show('R4 JSX pair', *gate('check-amount-collapse'), grep='collapses')
with Plant('apps/rn/src/utils/format.ts') as p:
    p.append("\nconst __r4a = parseAmountField(rawA)\nconst __r4b = Number(other) ?? 0\n")
    show('R4 two statements, NO semicolons (ASI)', *gate('check-amount-collapse'), grep='collapses')

print('########## N-2 — clock pin written in a COMMENT')
d = (datetime.date.today() + datetime.timedelta(days=8)).isoformat()
with Plant('apps/rn/src/utils/format.test.ts') as p:
    p.append("\nexport const __cp = { dueDate: '%s' };\n" % d)
    show('N-2 control (no comment)', *gate('check-fixture-dates'), grep='fires in')
with Plant('apps/rn/src/utils/format.test.ts') as p:
    p.append("\n// currentDate: '2026-01-01' is the pin the sibling suite uses\nexport const __cp = { dueDate: '%s' };\n" % d)
    rc, out = gate('check-fixture-dates')
    show('N-2 plant (pin in a line comment)', rc, out, grep='fixture-dates')
with Plant('apps/rn/tests/e2e/bnpl.spec.ts') as p:
    p.append("\nexport const __cp2 = { dueDate: '%s' };\n" % d)
    rc, out = gate('check-fixture-dates')
    show('N-2 live file bnpl.spec.ts', rc, out, grep='fixture-dates')

print('########## R6 / R7 — fixture-date-ok scope and comment-supplied key')
with Plant('apps/rn/src/utils/format.test.ts') as p:
    p.append("\nexport const __r6 = [\n  // fixture-date-ok: this one is the subject\n  { dueDate: '%s' },\n  { dueDate: '%s' },\n];\n" % (d, d))
    rc, out = gate('check-fixture-dates')
    show('R6 exemption on first element only', rc, out, grep='fires in')
with Plant('apps/rn/src/utils/format.test.ts') as p:
    p.append("\nconst __r7 = [\n  // the dueDate:\n  '%s',\n];\n" % d)
    rc, out = gate('check-fixture-dates')
    show('R7 comment supplies the key', rc, out, grep='fixture-dates')
