from plant import *
G = 'apps/rn/src/components/plan/PaydayGuardianCard.tsx'
print('########## check-contrast (PER_LINE_UNREVIEWED) — never-text exemption on accent.brand')
for label, snip in {
  'control: color: c.accent.brand on ONE line':
    "\nconst __ct1 = { color: c.accent.brand };\n",
  'the SAME use, Prettier-wrapped after the colon':
    "\nconst __ct2 = {\n  color:\n    c.accent.brand,\n};\n",
  'the SAME use inside a wrapped ternary':
    "\nconst __ct3 = (on: boolean) => ({\n  color: on\n    ? c.accent.brand\n    : c.text.primary,\n});\n",
}.items():
    with Plant(G) as p:
        p.append(snip)
        rc, out = gate('check-contrast')
        line = [l for l in out.strip().splitlines() if 'exemption broken' in l or 'contrast' in l.lower()]
        print(f'--- {label}  EXIT={rc}  {line[0].strip()[:130] if line else ""}')

print('########## check-trust-claims (PER_LINE_UNREVIEWED) — LIVENESS_RE exact per-file counts')
T = 'apps/rn/src/store/drift.ts'
for label, snip in {
  'control: one more `balance <= 0` on ONE line':
    "\nexport const __lv1 = (d: { balance: number }) => d.balance <= 0;\n",
  'the SAME comparison, wrapped after the operator':
    "\nexport const __lv2 = (d: { balance: number }) =>\n  d.balance <=\n  0;\n",
}.items():
    with Plant(T) as p:
        p.append(snip)
        rc, out = gate('check-trust-claims')
        line = [l for l in out.strip().splitlines() if 'liveness' in l.lower() or 'trust claims' in l.lower()]
        print(f'--- {label}  EXIT={rc}  {line[0].strip()[:150] if line else ""}')
