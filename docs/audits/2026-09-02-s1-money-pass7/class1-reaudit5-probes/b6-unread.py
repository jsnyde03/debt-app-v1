"""C1-9 / R12 / N-7 / T14 re-verification: the producer was REPLACED this round.

`unreadInputsCopy.test.ts`'s local `codeLinesOnly` was deleted and re-pointed at
`scripts/lib/joinedCode`'s `codeText`. Every junction spelling those four findings paid for has to still be
refused in a REAL consumer file, and correct code has to stay clean. Verdicts are `npm run test:app` exit
codes. The rule is `!code.includes('again above')` over every file whose joined code names
`unreadPlanInputs`; `RequiredActionsCard.tsx` is one (4 mentions).

Plants are template literals and concatenations only, so the .tsx stays valid whatever imports it.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plant

ROOT = r'C:\Users\Jason\debt-app-v1'
TGT = os.path.join(ROOT, 'apps', 'rn', 'src', 'components', 'plan', 'RequiredActionsCard.tsx')
CRLF = chr(13) + chr(10)
Q = chr(39)
BT = chr(96)
D = chr(36)
CMD = 'npm run test:app'


def run(label):
    c, o = plant.run(CMD)
    hit = plant.pick(o, 'again above', 'assertions passed', 'FAIL', 'Error')[:2]
    print('%-56s exit=%d :: %s' % (label, c, [h[:120] for h in hit]), flush=True)
    return c


run('BASELINE clean (must be 0)')

cases = [
    ('control: an unrelated const (must stay 0)',
     'export const __ctl = ' + Q + 'nothing to see here' + Q + ';'),
    ('T14 control: two unrelated sentences (must stay 0)',
     'export const __ctl2 = ' + Q + 'try again' + Q + '; export const __ctl3 = ' + Q + 'above the fold' + Q + ';'),
    ('C1-9: a template literal WRAPPED between the two words',
     'export const __j1 = ' + BT + '... incomplete - set it again' + CRLF + '      above.' + BT + ';'),
    ('R12: two literals joined by +',
     'export const __j2 = ' + BT + '... set it again ' + BT + ' + ' + BT + 'above.' + BT + ';'),
    ('N-7: a ${" "} interpolation between the words',
     'export const __j3 = ' + BT + '... set it again' + D + '{' + Q + ' ' + Q + '}above.' + BT + ';'),
    ('N-7: two literals joined by a NAMED separator',
     'const __SEP = ' + Q + ' ' + Q + ';' + CRLF +
     'export const __j4 = ' + Q + '... set it again' + Q + ' + __SEP + ' + Q + 'above.' + Q + ';'),
    ('R12: a {" "} JSX separator between the words',
     'export const __j5 = ' + BT + '<>{' + Q + 'set it again' + Q + '}{' + Q + ' ' + Q + '}{' + Q +
     'above.' + Q + '}</>' + BT + ';'),
]

for label, snip in cases:
    plant.append(TGT, CRLF + snip + CRLF)
    run(label)
    print('   ', plant.restore(TGT))
