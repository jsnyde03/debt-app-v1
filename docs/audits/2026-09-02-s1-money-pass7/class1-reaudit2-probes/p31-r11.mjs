// Replica of debtPrefill.test.ts's seedsFromEditing (verbatim), against spellings of the same defect.
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode.ts';

const seedsFromEditing = (raw) => {
  const src = stripCommentsOnly(raw);
  const direct = src.match(/useState\([^;]*?\bediting\b/g) ?? [];
  const hoisted = [...src.matchAll(/const\s+(\w+)\s*=\s*[^;]*\bediting\b[^;]*;/g)]
    .map((m) => m[1])
    .filter((name) => name !== 'seed')
    .filter((name) => new RegExp(`useState\\(\\s*${name}\\b`).test(src));
  return [...direct, ...hoisted];
};

const NL = String.fromCharCode(10);
const cases = {
  'direct useState(editing?.x)    [fixture]': 'const [a, setA] = useState(editing?.apr);',
  'ternary (C2-9)                 [fixture]': "const [a, setA] = useState(editing ? String(editing.apr) : '');",
  'hoisted const (R11)            [fixture]': "const x = editing ? String(editing.apr) : '';" + NL + 'const [a, setA] = useState(x);',
  'hoisted with LET                        ': "let x = editing ? String(editing.apr) : '';" + NL + 'const [a, setA] = useState(x);',
  'DESTRUCTURED from editing               ': 'const { apr } = editing ?? {};' + NL + "const [a, setA] = useState(apr != null ? String(apr) : '');",
  'two-hop const                           ': 'const x = editing?.apr;' + NL + 'const y = x;' + NL + 'const [a, setA] = useState(y);',
  'useMemo hop                             ': "const x = useMemo(() => (editing ? String(editing.apr) : ''), [editing]);" + NL + 'const [a, setA] = useState(x);',
  'hoisted, useState ARG WRAPPED           ': "const x = editing ? String(editing.apr) : '';" + NL + 'const [a, setA] = useState(' + NL + '  x,' + NL + ');',
};

for (const [k, v] of Object.entries(cases)) {
  const n = seedsFromEditing(v).length;
  console.log((n > 0 ? 'SEEN   ' : 'MISSED ') + k);
}
