/**
 * Probe: `V9` replaced `debtPrefill.test.ts`'s name-keyed exemption with an INITIALISER test,
 * `SANCTIONED_MERGE = /\bediting\s*\?\?\s*prefill\b/`. Synthetic input only — nothing on disk is read.
 * The detector below is copied verbatim from debtPrefill.test.ts:174-215.
 */
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const SANCTIONED_MERGE = /\bediting\s*\?\?\s*prefill\b/;

const seedsFromEditing = (raw: string): string[] => {
  const src = stripCommentsOnly(raw);
  const direct = src.match(/useState\([^;]*?\bediting\b/g) ?? [];
  const DECL = /(?:const|let|var)\s+(\w+)\s*=\s*([^;]*);/g;
  const bindings = [...src.matchAll(DECL)].map((m) => ({ name: m[1], init: m[2] }));
  const derived = new Set<string>();
  for (let hop = 0; hop < 3; hop++) {
    for (const b of bindings) {
      if (SANCTIONED_MERGE.test(b.init)) continue;
      if (derived.has(b.name)) continue;
      const fromEditingDirectly = /\bediting\b/.test(b.init);
      const fromDerived = [...derived].some((d) => new RegExp(`\\b${d}\\b`).test(b.init));
      if (fromEditingDirectly || fromDerived) derived.add(b.name);
    }
  }
  const hoisted = [...derived];
  // ⚠️ copied verbatim too — note SANCTIONED_MERGE is NOT applied on this path
  const destructured = [...src.matchAll(/const\s*\{([^}]*)\}\s*=\s*[^;]*\bediting\b[^;]*;/g)].flatMap((m) =>
    m[1].split(',').map((part) => part.split(':').pop()?.trim() ?? '').filter(Boolean),
  );
  return [
    ...direct,
    ...[...hoisted, ...destructured].filter((name) => new RegExp(`useState\\(\\s*${name}\\b`).test(src)),
  ];
};

const NL = String.fromCharCode(10);
const cases: [string, string, 0 | 1][] = [
  // V9's own three rows — the regression control
  ["V9 a: hoist merely NAMED seed", `const seed = editing ? String(editing.apr) : '';${NL}const [a, setA] = useState(seed);`, 1],
  ['V9 b: second seed in a nested scope', `const seed = editing ?? prefill ?? null;${NL}function inner() {${NL}  const seed = editing?.apr;${NL}  const [a, setA] = useState(seed);${NL}}`, 1],
  ['V9 c: destructure renamed to seed', `const { apr: seed } = editing ?? {};${NL}const [a, setA] = useState(seed);`, 1],
  ['the sanctioned shape itself', `const seed = editing ?? prefill ?? null;${NL}const [a, setA] = useState(seed?.apr);`, 0],

  // NOISY candidates — correct code that still honours the prefill
  ['sanctioned merge off props', `const seed = props.editing ?? props.prefill ?? null;${NL}const [a, setA] = useState(seed);`, 0],
  ['sanctioned merge, prefill renamed on import', `const seed = editing ?? prefillDebt ?? null;${NL}const [a, setA] = useState(seed);`, 0],
  ['sanctioned merge with a cast', `const seed = (editing ?? prefill) as Debt | null;${NL}const [a, setA] = useState(seed);`, 0],
  ['sanctioned merge, ternary spelling', `const seed = editing ? editing : prefill;${NL}const [a, setA] = useState(seed);`, 0],

  // BLIND candidates — a real defect carrying the sanctioned substring
  ['defect + the sanctioned substring appended', `const seed = editing.apr ?? (editing ?? prefill);${NL}const [a, setA] = useState(seed);`, 1],
  ['defect guarded by the sanctioned test', `const seed = editing ?? prefill ? editing.apr : 0;${NL}const [a, setA] = useState(seed);`, 1],
  ['sanctioned merge that then reads editing', `const seed = { base: editing ?? prefill, apr: editing.apr };${NL}const [a, setA] = useState(seed);`, 1],
];

for (const [label, src, want] of cases) {
  const got = seedsFromEditing(src).length;
  const hit = got > 0 ? 1 : 0;
  const tag = hit === want ? 'ok   ' : want === 1 ? 'BLIND (missed)' : 'NOISY (false accusation)';
  console.log(`${tag.padEnd(26)} hits=${got} want=${want}  ${label}`);
}

// ── the destructuring path, which `V9`'s exemption is never applied to ────────────────────────────
const extra: [string, string, 0 | 1][] = [
  ['destructure OFF the sanctioned merge', `const { apr } = editing ?? prefill ?? null;${NL}const [a, setA] = useState(apr);`, 0],
  ['destructure off editing alone (a real defect)', `const { apr } = editing ?? {};${NL}const [a, setA] = useState(apr);`, 1],
];
console.log('');
for (const [label, src, want] of extra) {
  const got = seedsFromEditing(src).length;
  const hit = got > 0 ? 1 : 0;
  const tag = hit === want ? 'ok   ' : want === 1 ? 'BLIND (missed)' : 'NOISY (false accusation)';
  console.log(`${tag.padEnd(26)} hits=${got} want=${want}  ${label}`);
}
