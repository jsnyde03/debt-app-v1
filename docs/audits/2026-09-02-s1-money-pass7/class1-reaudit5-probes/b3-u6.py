"""U6 re-audit: clampedDay() exempts a getDate() that is an argument of ANY call.
Find a spelling that is exempted while the day is genuinely unclamped upward."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plant

ROOT = r'C:\Users\Jason\debt-app-v1'
TGT = os.path.join(ROOT, 'packages', 'core', 'utils', 'percentComplete.ts')
CRLF = chr(13) + chr(10)
CMD = 'npx tsx scripts/check-month-arithmetic.ts'

cases = [
    ('bare getDate (control: must RED)',
     'export const __m1 = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());'),
    ('Math.min clamp (U6 fix: must be GREEN)',
     'export const __m2 = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, Math.min(d.getDate(), 28));'),
    ('Math.MAX  — clamps the WRONG bound',
     'export const __m3 = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, Math.max(1, d.getDate()));'),
    ('Number(getDate()) — no clamp at all',
     'export const __m4 = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, Number(d.getDate()));'),
    ('identity helper — no clamp at all',
     'export const __id = (n: number) => n;' + CRLF +
     'export const __m5 = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, __id(d.getDate()));'),
    ('grouping parens only (must still RED)',
     'export const __m6 = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, (d.getDate()));'),
]

c, o = plant.run(CMD)
print('BASELINE exit=%d :: %s' % (c, plant.pick(o, 'month arithmetic', 'overflows')[:1]))
for name, snip in cases:
    plant.append(TGT, CRLF + snip + CRLF)
    c, o = plant.run(CMD)
    print('%-42s exit=%d :: %s' % (name, c, plant.pick(o, 'month arithmetic', 'percentComplete')[:2]))
    print('   ', plant.restore(TGT))
