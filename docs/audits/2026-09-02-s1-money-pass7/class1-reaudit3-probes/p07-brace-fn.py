from plant import *
T = 'apps/rn/src/utils/format.ts'
BT = chr(96); D = chr(36)

cases = {
 'A control: plain collapse':
   "\nexport const __c1 = (raw: string) => parseAmountField(raw) ?? 0;\n",
 'B collapse, OBJECT LITERAL in the arg list':
   "\nexport const __c2 = (raw: string, o: { trim: boolean }) =>\n  parseAmountField(pick(raw, { trim: true })) ?? 0;\nfunction pick(r: string, _o: { trim: boolean }) { return r; }\n",
 'C collapse, TEMPLATE LITERAL with ${...} in the arg list':
   "\nexport const __c3 = (raw: string) => parseAmountField(" + BT + D + "{raw}" + BT + ") ?? 0;\n",
 'D collapse, ARROW BLOCK BODY in the arg list':
   "\nexport const __c4 = (rows: string[]) =>\n  parseAmountField(rows.map((r) => { return r; }).join('')) ?? 0;\n",
 'E rounding, OBJECT LITERAL in the arg list':
   "\nexport const __c5 = (o: { apr: number }) => Math.round(rate({ apr: o.apr }) * 100) / 100;\nfunction rate(x: { apr: number }) { return x.apr; }\n",
 'F rounding, TEMPLATE LITERAL in the arg list':
   "\nexport const __c6 = (s: string) => Math.round(Number(" + BT + D + "{s}" + BT + ") * 100) / 100;\n",
 'G rounding control (no brace)':
   "\nexport const __c7 = (x: number) => Math.round(x * 100) / 100;\n",
}
for label, snip in cases.items():
    with Plant(T) as p:
        p.append(snip)
        rc1, o1 = gate('check-amount-collapse')
        rc2, o2 = gate('check-rounding')
        l1 = [l for l in o1.strip().splitlines() if 'collapses' in l or 'amount-collapse:' in l]
        l2 = [l for l in o2.strip().splitlines() if 'rounding:' in l]
        print(f'--- {label}')
        print(f'    amount-collapse EXIT={rc1}  {(l1[0].strip()[:110] if l1 else "")}')
        print(f'    rounding        EXIT={rc2}  {(l2[0].strip()[:110] if l2 else "")}')
