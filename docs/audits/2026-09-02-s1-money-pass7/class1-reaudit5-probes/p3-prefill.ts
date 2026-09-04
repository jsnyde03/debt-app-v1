/**
 * U9 re-audit. `sliced-seeds.ts` holds `seedsFromEditing` sliced VERBATIM out of
 * `apps/rn/src/components/entities/debtPrefill.test.ts` (by `p3-gen.py`), so it cannot drift from what
 * ships. The question: seeding `EXCLUDED` into the closure keys the exemption on the NAME `seed` rather
 * than on the sanctioned SHAPE — what does that now exempt?
 */
import { seedsFromEditing } from './sliced-seeds.ts';

const NL = String.fromCharCode(10);
const cases: [string, number, string][] = [
  [
    'SANCTIONED direct (the shipped shape)',
    0,
    'const seed = editing ?? prefill ?? null;' + NL + "const [a, setA] = useState(seed?.apr != null ? String(seed.apr) : '');",
  ],
  [
    'SANCTIONED one hop through seed (U9 fix)',
    0,
    'const seed = editing ?? prefill ?? null;' + NL + "const apr = seed?.apr != null ? String(seed.apr) : '';" + NL + 'const [a, setA] = useState(apr);',
  ],
  [
    'DEFECT hoisted off editing (R11)',
    1,
    "const apr = editing ? String(editing.apr) : '';" + NL + 'const [a, setA] = useState(apr);',
  ],
  [
    'DEFECT hoisted off editing, BINDING NAMED seed',
    1,
    "const seed = editing ? String(editing.apr) : '';" + NL + 'const [a, setA] = useState(seed);',
  ],
  [
    'DEFECT: sanctioned seed, plus a SECOND seed hoisted off editing in a nested scope',
    1,
    'const seed = editing ?? prefill ?? null;' + NL +
      'function Inner() {' + NL +
      "  const seed = editing ? String(editing.apr) : '';" + NL +
      '  const [a, setA] = useState(seed);' + NL +
      '}',
  ],
  [
    'DEFECT destructured off editing (N-8)',
    1,
    'const { apr } = editing ?? {};' + NL + 'const [a, setA] = useState(apr);',
  ],
  [
    'DEFECT destructured off editing, RENAMED to seed',
    1,
    'const { apr: seed } = editing ?? {};' + NL + 'const [a, setA] = useState(seed);',
  ],
];

for (const [label, want, src] of cases) {
  const got = seedsFromEditing(src).length;
  console.log(`${got === want ? 'ok  ' : 'FAIL'} want=${want} got=${got}  ${label}`);
}
