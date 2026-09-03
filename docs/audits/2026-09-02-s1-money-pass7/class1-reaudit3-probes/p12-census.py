from plant import *
BT = chr(96)

print('########## check-month-arithmetic — the census row claims the argument list is not the subject')
T = 'packages/core/utils/percentComplete.ts'
for label, snip in {
  'control: new Date(y, m+1, d.getDate()) on ONE line':
    "\nexport const __m1 = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());\n",
  'the SAME call, Prettier-wrapped over four lines':
    "\nexport const __m2 = (d: Date) =>\n  new Date(\n    d.getFullYear(),\n    d.getMonth() + 1,\n    d.getDate(),\n  );\n",
  'control: setMonth on one line':
    "\nexport const __m3 = (d: Date) => {\n  d.setMonth(d.getMonth() + 1);\n  return d;\n};\n",
}.items():
    with Plant(T) as p:
        p.append(snip)
        rc, out = gate('check-month-arithmetic')
        line = [l for l in out.strip().splitlines() if 'setMonth' in l or 'month' in l.lower()]
        print(f'--- {label}  EXIT={rc}  {line[0].strip()[:120] if line else ""}')

print('########## check-glossary — the census row claims a wrapped sentence is the same sentence')
G = 'apps/rn/src/components/plan/PaydayGuardianCard.tsx'
for label, snip in {
  'control: retired word in a JSX text node on ONE line':
    "\nexport const __g1 = () => <Text>You have some breathing room this month.</Text>;\n",
  'the SAME copy, Prettier-wrapped (JSX text on its own line)':
    "\nexport const __g2 = () => (\n  <Text>\n    You have some breathing room this month.\n  </Text>\n);\n",
  'template literal broken across two lines':
    "\nexport const __g3 = " + BT + "You have some breathing\n  room this month." + BT + ";\n",
}.items():
    with Plant(G) as p:
        p.append(snip)
        rc, out = gate('check-glossary')
        line = [l for l in out.strip().splitlines() if 'glossary' in l or 'breathing' in l]
        print(f'--- {label}  EXIT={rc}  {line[0].strip()[:130] if line else ""}')

print('########## N-6 — sandbox reports the docblock line, not the import')
A = 'apps/rn/src/utils/a11y.ts'
with Plant(A) as p:
    b = p.orig
    pre = "/**\n * A docblock.\n * Four lines long.\n */\nimport {\n  appStore,\n} from '../store/appStore';\n".replace('\n', p.eol.decode())
    write_bytes(A, pre.encode('utf-8') + b)
    rc, out = gate('check-sandbox-writes')
    show('N-6 wrapped import behind a 4-line docblock (import is at line 5)', rc, out, grep='a11y.ts')
