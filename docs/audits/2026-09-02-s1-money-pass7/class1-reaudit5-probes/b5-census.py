"""Census re-audit (R15 / T5 / N-10 / U12) - each row is a full test:wrap-escapes run."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plant

ROOT = r'C:\Users\Jason\debt-app-v1'
CRLF = chr(13) + chr(10)
Q = chr(39)
BS = chr(92)
P = lambda *a: os.path.join(ROOT, *a)
NEWGATE = P('scripts', 'check-zzcensus.ts')
CENSUS = P('scripts', 'test-wrap-escapes.ts')


def run(label, cmd, needles):
    c, o = plant.run(cmd)
    print('%-52s exit=%d :: %s' % (label, c, plant.pick(o, *needles)[:2]), flush=True)
    return c, o


run('  baseline', 'npx tsx scripts/test-wrap-escapes.ts', ['wrap-escapes', 'NONE of PER_LINE_OK'])

with open(NEWGATE, 'wb') as f:
    f.write((
        '/** A new gate that splits its input into physical lines and is classified nowhere. */' + CRLF +
        "import { readFileSync } from 'node:fs';" + CRLF +
        'export const zz = (p: string) => readFileSync(p, ' + Q + 'utf8' + Q + ').split(/' +
        BS + 'r?' + BS + 'n/).length;' + CRLF
    ).encode('utf-8'))
run('  new unclassified per-line gate (must RED)', 'npx tsx scripts/test-wrap-escapes.ts',
    ['wrap-escapes', 'NONE of PER_LINE_OK'])

plant.replace(CENSUS, "  'check-control-chars.ts':",
              "  'check-zzcensus.ts': 'no reason at all, just a sentence nobody measured'," + CRLF +
              "  'check-control-chars.ts':")
run('  ...plus a PER_LINE_OK row with a false reason', 'npx tsx scripts/test-wrap-escapes.ts',
    ['wrap-escapes', 'NONE of PER_LINE_OK', 'per-line by design'])
print('  ', plant.restore(CENSUS))
os.remove(NEWGATE)
run('  AFTER cleanup (must be green again)', 'npx tsx scripts/test-wrap-escapes.ts', ['wrap-escapes'])
