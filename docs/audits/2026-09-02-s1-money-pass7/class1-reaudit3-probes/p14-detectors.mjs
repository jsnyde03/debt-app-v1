// Replicas of the two live detectors, copied verbatim from the shipping test files,
// so candidate spellings can be enumerated without a full `test:app` run.
// The winners are then confirmed by planting into the real component and running `test:app`.
import { readFileSync } from 'node:fs';

const NEWLINE = /\r?\n/;

// ── unreadInputsCopy.test.ts :: codeLinesOnly (verbatim) ──────────────────────────────────
function codeLinesOnly(source) {
  return source
    .split(NEWLINE)
    .filter((line) => {
      const t = line.trimStart();
      return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
    })
    .map((line) => line.trim())
    .join(' ')
    .replace(/\{\s*(['"`])\s*\1\s*\}/g, ' ')
    .replace(/['"`]\s*\}\s*\{\s*['"`]/g, ' ')
    .replace(/['"`]\s*\+\s*['"`]/g, '')
    .replace(/[ \t]+/g, ' ');
}
const REFUSES = (s) => /again\s*above|it again above/.test(s);
const needle = 'again above'; // the assertion's own needle, per the suite

const q = "'";
const bt = '`';
const cases = {
  'A single line (control)': `<Text>{'You can set it again above.'}</Text>`,
  'B wrapped across a source line (C1-9)': `<Text>\n  {'You can set it again\n  above.'}\n</Text>`,
  "C concatenated (R12)": `<Text>{'You can set it again ' + 'above.'}</Text>`,
  "D {' '} separator (N-7)": `<>{\`set it again\`}{' '}{\`above.\`}</>`,
  "E \${' '} interpolation": `<Text>{\`set it again\${' '}above.\`}</Text>`,
  'F named separator const (N-7 named this)': `const SEP = ' ';\n<Text>{'set it again' + SEP + 'above.'}</Text>`,
  'G interpolated word literal': `<Text>{\`set it again \${'above'}.\`}</Text>`,
  'H interpolated variable': `const W = 'above';\n<Text>{\`set it again \${W}.\`}</Text>`,
  'I JSX expression container with a var': `const S = ' ';\n<Text>{'set it again'}{S}{'above.'}</Text>`,
  'J plain JSX text wrapped by Prettier': `<Text>\n  You can set it again\n  above.\n</Text>`,
};
console.log('=== unreadInputsCopy :: does the joined text contain "again above"? ===');
for (const [label, src] of Object.entries(cases)) {
  const joined = codeLinesOnly(src);
  console.log(`  ${joined.includes(needle) ? 'CAUGHT ' : 'MISSED '} ${label}`);
}

// ── debtPrefill.test.ts :: seedsFromEditing (verbatim, minus stripCommentsOnly) ────────────
const seedsFromEditing = (src) => {
  const direct = src.match(/useState\([^;]*?\bediting\b/g) ?? [];
  const hoisted = [...src.matchAll(/const\s+(\w+)\s*=\s*[^;]*\bediting\b[^;]*;/g)].map((m) => m[1]);
  const destructured = [...src.matchAll(/const\s*\{([^}]*)\}\s*=\s*[^;]*\bediting\b[^;]*;/g)].flatMap((m) =>
    m[1]
      .split(',')
      .map((part) => part.split(':').pop()?.trim() ?? '')
      .filter(Boolean),
  );
  return [
    ...direct,
    ...[...hoisted, ...destructured]
      .filter((name) => name !== 'seed')
      .filter((name) => new RegExp(`useState\\(\\s*${name}\\b`).test(src)),
  ];
};
const dcases = {
  'A direct (control)': `const [a, setA] = useState(editing?.apr);`,
  'B ternary (C2-9)': `const [a, setA] = useState(editing ? String(editing.apr) : '');`,
  'C hoisted const (R11)': `const x = editing ? String(editing.apr) : '';\nconst [a, setA] = useState(x);`,
  'D destructured (N-8)': `const { apr } = editing ?? {};\nconst [a, setA] = useState(apr);`,
  'E LET instead of const (N-8 named this)': `let x = editing ? String(editing.apr) : '';\nconst [a, setA] = useState(x);`,
  'F VAR instead of const': `var x = editing ? String(editing.apr) : '';\nconst [a, setA] = useState(x);`,
  'G two-hop (N-8 named this)': `const x = editing?.apr;\nconst y = x;\nconst [a, setA] = useState(y);`,
  'H destructured with LET': `let { apr } = editing ?? {};\nconst [a, setA] = useState(apr);`,
  'I useState with a wrapped arg off the hoist': `const x = editing ? String(editing.apr) : '';\nconst [a, setA] = useState(\n  x,\n);`,
  'J hoist through a function param default': `const [a, setA] = useState(pick(editing));`,
};
console.log('\n=== debtPrefill :: seedsFromEditing length > 0 ? ===');
for (const [label, src] of Object.entries(dcases)) {
  console.log(`  ${seedsFromEditing(src).length > 0 ? 'CAUGHT ' : 'MISSED '} ${label}`);
}
void REFUSES;
void readFileSync;
