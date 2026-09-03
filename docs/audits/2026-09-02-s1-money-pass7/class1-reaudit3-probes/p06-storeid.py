from plant import *
T = 'apps/rn/src/store/balanceSelectors.ts'

variants = {
 'A control single-line findIndex':
   "\nexport const __a = (rows: { id: string }[], id: string) => rows.findIndex((r) => r.id === id);\n",
 'B N-5 wrapped findIndex (was the FP)':
   "\nexport const __b = (rows: { id: string }[], id: string) =>\n  rows.findIndex(\n    (r) => r.id === id,\n  );\n",
 'C arrow BLOCK body findIndex (brace between tokens)':
   "\nexport const __c = (rows: { id: string }[], id: string) =>\n  rows.findIndex((r) => {\n    return r.id === id;\n  });\n",
 'D filter with block body':
   "\nexport const __d = (rows: { id: string }[], id: string) =>\n  rows.filter((r) => {\n    const hit = r.id === id;\n    return hit;\n  });\n",
 'E find with object-literal second arg then block':
   "\nexport const __e = (rows: { id: string }[], id: string) => {\n  const opts = { deep: true };\n  return rows.find((r) => r.id === id) ?? null;\n};\n",
 'F genuine bare .map defect, single line':
   "\nexport const __f = (rows: { id: string }[], id: string) => rows.map((r) => (r.id === id ? r : r));\n",
}
for label, snippet in variants.items():
    with Plant(T) as p:
        p.append(snippet)
        rc, out = gate('check-store-id-writes')
        last = [l for l in out.strip().splitlines() if l.strip()]
        print(f'--- {label}  EXIT={rc}')
        for l in last[:3]: print('   ', l.strip()[:160])
