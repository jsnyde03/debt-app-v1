from plant import *
import datetime
d = (datetime.date.today() + datetime.timedelta(days=8)).isoformat()

print('########## R6 redone — trailing exemption on the literal own line')
with Plant('apps/rn/src/utils/format.test.ts') as p:
    p.append("\nexport const __r6 = [\n  { dueDate: '%s' }, // fixture-date-ok: this one is the subject\n  { dueDate: '%s' },\n];\n" % (d, d))
    rc, out = gate('check-fixture-dates')
    show('R6 exemption on element 1 only', rc, out, grep='fires in')

print('########## amount-collapse FALSE POSITIVE across sibling expressions (R4 class)')
T = 'apps/rn/src/utils/format.ts'
cases = {
 'array elements, comma-separated, no braces between':
   "\nexport const __fp1 = (a: string, b: string) => [\n  String(parseAmountField(a)),\n  Number(b) ?? 0,\n];\n",
 'call arguments, comma-separated':
   "\nexport const __fp2 = (a: string, b: string) =>\n  join(String(parseAmountField(a)), Number(b) ?? 0);\nfunction join(x: string, y: number) { return x + y; }\n",
 'ternary arms':
   "\nexport const __fp3 = (a: string, b: string, f: boolean) =>\n  f ? String(parseAmountField(a)) : Number(b) ?? 0;\n",
 'CONTROL: same shape but a semicolon between':
   "\nexport const __fp4 = (a: string, b: string) => {\n  const x = String(parseAmountField(a));\n  const y = Number(b) ?? 0;\n  return x + y;\n};\n",
}
for label, snip in cases.items():
    with Plant(T) as p:
        p.append(snip)
        rc, out = gate('check-amount-collapse')
        line = [l for l in out.strip().splitlines() if 'collapses' in l or 'amount-collapse:' in l]
        print(f'--- {label}  EXIT={rc}  {line[0].strip()[:110] if line else ""}')

print('########## rounding FALSE POSITIVE, same shape')
rcases = {
 'array elements: Math.round(a) then b * 100 ... / 100':
   "\nexport const __rfp = (a: number, b: number) => [\n  Math.round(a),\n  (b * 100) / 100,\n];\n",
 'call args: Math.round(a), b * 100 / 100':
   "\nexport const __rfp2 = (a: number, b: number) => pair(Math.round(a), (b * 100) / 100);\nfunction pair(x: number, y: number) { return x + y; }\n",
}
for label, snip in rcases.items():
    with Plant(T) as p:
        p.append(snip)
        rc, out = gate('check-rounding')
        line = [l for l in out.strip().splitlines() if 'rounding:' in l]
        print(f'--- {label}  EXIT={rc}  {line[0].strip()[:110] if line else ""}')
