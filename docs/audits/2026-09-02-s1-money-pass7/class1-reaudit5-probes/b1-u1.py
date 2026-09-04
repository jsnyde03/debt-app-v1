"""U1 / R5 / T3: which spellings of the money collapse does `check-amount-collapse` see now?

The `${…}` half is what R5 and T3 are about, and the other three rows are the spellings U1 also named.
Every row: clean baseline, one appended plant, the gate's own summary line, a cmp-verified restore.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plant

ROOT = r'C:\Users\Jason\debt-app-v1'
TGT = os.path.join(ROOT, 'apps', 'rn', 'src', 'components', 'plan', 'AffordabilityCard.tsx')
CRLF = chr(13) + chr(10)
BT = chr(96)
D = chr(36)
Q = chr(39)
CMD = 'npx tsx scripts/check-amount-collapse.ts'

cases = [
    ('control same-line',      'const __p1 = parseAmountField(amount) ?? 0;'),
    ('template interpolation',  'const __p2 = ' + BT + 'x ' + D + '{parseAmountField(amount) ?? 0}' + BT + ';'),
    ('optional call ?.(',      'const __p3 = parseAmountField?.(amount) ?? 0;'),
    ('generic <number>',       'const __p4 = parseAmountField<number>(amount) ?? 0;'),
    ('extra parens',           'const __p5 = (parseAmountField(amount)) ?? 0;'),
    ('wrapped args',           'const __p6 = parseAmountField(' + CRLF + '  amount,' + CRLF + ') ?? 0;'),
    ('interp + wrapped',       'const __p7 = ' + BT + 'x ' + D + '{parseAmountField(' + CRLF + '  amount,' + CRLF + ') ?? 0}' + BT + ';'),
    ('interp nested str paren', 'const __p8 = ' + BT + 'x ' + D + '{parseAmountField(amount) ?? 0}' + BT + ' + ' + Q + '(' + Q + ';'),
]

c, o = plant.run(CMD)
print('BASELINE exit=%d :: %s' % (c, plant.pick(o, 'amount-collapse')[:1]))
for name, snip in cases:
    plant.append(TGT, CRLF + 'export ' + snip + CRLF)
    c, o = plant.run(CMD)
    print('%-24s exit=%d :: %s' % (name, c, plant.pick(o, 'amount-collapse', 'collapses a parsed')[:2]))
    print('   ', plant.restore(TGT))
