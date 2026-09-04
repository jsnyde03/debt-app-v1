"""V3, sharpened: does MAX_JSX_FRAGMENT_LINES defeat T6's OWN motivating case for a JSX text node?

T6 moved check-glossary to whole-file because "four of the five retired terms are two-word phrases and a
wrap between the words defeated every one". A JSX text node whose content occupies two physical lines
produces THREE newlines inside the `>...<` match (one after the opening tag, one between the text lines,
one before the closing tag), so the bound of 2 rejects it.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plant

ROOT = r'C:\Users\Jason\debt-app-v1'
TGT = os.path.join(ROOT, 'apps', 'rn', 'src', 'components', 'plan', 'GraduationCards.tsx')
CRLF = chr(13) + chr(10)
BT = chr(96)
CMD = 'npx tsx scripts/check-glossary.ts'


def run(label):
    c, o = plant.run(CMD)
    print('%-58s exit=%d :: %s' % (label, c, plant.pick(o, 'glossary', 'breathing room')[:2]), flush=True)
    return c


run('BASELINE clean')

cases = [
    ('one-line JSX text node (control: must RED)',
     'export const __t1 = <Text>your breathing room this month</Text>;'),
    ('JSX text WRAPPED between the two words - T6 own case',
     'export const __t2 = (' + CRLF + '  <Text>' + CRLF + '    your breathing' + CRLF +
     '    room this month' + CRLF + '  </Text>' + CRLF + ');'),
    ('JSX text on ONE line inside a multi-line element',
     'export const __t3 = (' + CRLF + '  <Text>' + CRLF + '    your breathing room this month' + CRLF +
     '  </Text>' + CRLF + ');'),
    ('a TEMPLATE literal wrapped the same way (the harness recipe)',
     'export const __t4 = ' + BT + 'your breathing' + CRLF + '  room this month' + BT + ';'),
]

for label, snip in cases:
    plant.append(TGT, CRLF + snip + CRLF)
    run(label)
    print('   ', plant.restore(TGT))
