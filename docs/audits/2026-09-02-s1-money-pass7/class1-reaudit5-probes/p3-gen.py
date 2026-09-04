"""Slice `seedsFromEditing` out of the production test file into `sliced-seeds.ts`.

Sliced, never retyped: a re-typed copy of a detector cannot tell you anything about the one that ships.
"""
import os

ROOT = r'C:\Users\Jason\debt-app-v1'
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(ROOT, 'apps', 'rn', 'src', 'components', 'entities', 'debtPrefill.test.ts'),
           encoding='utf-8').read()
START = 'const seedsFromEditing = (raw: string): string[] => {'
END = chr(10) + '    };'
s = src.index(START)
e = src.index(END, s)
body = src[s:e + len(END)]
out = ('// GENERATED from apps/rn/src/components/entities/debtPrefill.test.ts by p3-gen.py.\n'
       '// The production function, SLICED not retyped, so it cannot drift from what ships.\n'
       "import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';\n"
       + body + '\nexport { seedsFromEditing };\n')
open(os.path.join(HERE, 'sliced-seeds.ts'), 'w', encoding='utf-8', newline='\n').write(out)
print('sliced %d chars' % len(body))
