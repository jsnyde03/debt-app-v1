// `seedsFromEditing` EXTRACTED VERBATIM from apps/rn/src/components/entities/debtPrefill.test.ts @ fcd954d6
import { stripCommentsOnly } from '../../../../scripts/lib/stripCode';

const seedsFromEditing = (raw: string): string[] => {
  const src = stripCommentsOnly(raw);
  const direct = src.match(/useState\([^;]*?\bediting\b/g) ?? [];
  /**
   * ⛔ **`const | let | var`, AND TWO HOPS** — [class-1 re-audit 3 · `N-8`]. The first hoist rule matched
   * `const` only, so `let x = editing ? … ; useState(x)` walked past; and it followed ONE hop, so
   * `const a = editing?.apr; const b = a; useState(b)` did too. Both are ordinary refactors of the
   * defect, not exotic spellings.
   */
  const DECL = /(?:const|let|var)\s+(\w+)\s*=\s*([^;]*);/g;
  const bindings = [...src.matchAll(DECL)].map((m) => ({ name: m[1], init: m[2] }));
  const derived = new Set<string>();
  for (let hop = 0; hop < 3; hop++) {
    for (const b of bindings) {
      if (derived.has(b.name)) continue;
      const fromEditingDirectly = /\bediting\b/.test(b.init);
      const fromDerived = [...derived].some((d) => new RegExp(`\\b${d}\\b`).test(b.init));
      if (fromEditingDirectly || fromDerived) derived.add(b.name);
    }
  }
  const hoisted = [...derived];
  /**
   * ⛔ **DESTRUCTURING IS A HOIST TOO** — `N-8`. `const { apr } = editing ?? {}` binds a name derived
   * from `editing` without ever writing `editing` next to `useState`, and the first hoist rule only
   * matched a single identifier. Third spelling of one defect, after the ternary (`C2-9`) and the
   * plain hoist (`R11`).
   */
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

const CASES: [string, string, number][] = [
  ['SANCTIONED direct (the shipped shape)', ["const seed = editing ?? prefill ?? null;", "const [a, setA] = useState(seed?.apr != null ? String(seed.apr) : '');"].join(String.fromCharCode(10)), 0],
  ['SANCTIONED one hop through seed', ["const seed = editing ?? prefill ?? null;", "const apr = seed?.apr != null ? String(seed.apr) : '';", "const [a, setA] = useState(apr);"].join(String.fromCharCode(10)), 0],
  ['SANCTIONED two hops through seed', ["const seed = editing ?? prefill ?? null;", "const raw = seed?.apr;", "const apr = raw != null ? String(raw) : '';", "const [a, setA] = useState(apr);"].join(String.fromCharCode(10)), 0],
  ['DEFECT hoisted off editing (R11)', ["const x = editing ? String(editing.apr) : '';", "const [a, setA] = useState(x);"].join(String.fromCharCode(10)), 1],
  ['DEFECT three hops (one past the 3-pass cap)', ["const a = editing?.apr;", "const b = a;", "const c = b;", "const d2 = c;", "const [s, setS] = useState(d2);"].join(String.fromCharCode(10)), 1],
];
for (const [name, s, want] of CASES) {
  const got = seedsFromEditing(s).length;
  console.log(`${got === want ? 'ok  ' : 'FAIL'} want=${want} got=${got}  ${name}`);
}
