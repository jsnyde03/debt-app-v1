import { findCalls, enclosingCall } from '../../../../scripts/lib/logicalLines';

const CASES: [string, string][] = [
  ['plain',            `const a = parseAmountField(raw) ?? 0;`],
  ['nested',           `const a = parseAmountField(fn(x)) ?? 0;`],
  ['object arg',       `const a = parseAmountField({ raw }) ?? 0;`],
  ['wrapped+comma',    `const a = parseAmountField(\n  raw,\n) ?? 0;`],
  ['TEMPLATE INTERP',  `const s = \`v \${parseAmountField(raw) ?? 0}\`;`],
  ['paren in string',  `const a = parseAmountField(')') ?? 0;`],
  ['regex literal arg',`const a = parseAmountField(x.replace(/\(/g, '')) ?? 0;`],
  ['optional call',    `const a = parseAmountField?.(raw) ?? 0;`],
  ['generic',          `const a = parseAmountField<(a: number) => number>(raw) ?? 0;`],
  ['unbalanced',       `const a = parseAmountField(raw ?? 0;`],
  ['jsx slash before', `const t = <Text>{a}/{b}</Text>; const a = parseAmountField(raw) ?? 0;`],
];
const PARSER_CALL = /\b(?:parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\(/g;
const AFTER = /^\s*\?\?\s*0\b/;
for (const [name, code] of CASES) {
  const calls = findCalls(code, PARSER_CALL);
  const hits = calls.filter((c) => AFTER.test(code.slice(c.argsEnd + 1)));
  console.log(`${name.padEnd(20)} calls=${calls.length} collapses=${hits.length}`);
}

console.log('\n--- enclosingCall exemption (store-id-writes shape) ---');
const SHAPES: [string, string][] = [
  ['find arrow',        `rows.find((r) => r.id === id)`],
  ['findIndex block',   `rows.findIndex((r) => { return r.id === id; })`],
  ['optional find',     `rows.find?.((r) => r.id === id)`],
  ['generic find',      `rows.find<Debt>((r) => r.id === id)`],
  ['bare map (should hit)', `rows.map((r) => (r.id === id ? p(r) : r))`],
  ['findLast',          `rows.findLast((r) => r.id === id)`],
  ['deep nest 7',       `a(b(c(d(e(f(g(rows.find((r) => r.id === id))))))))`],
];
const LOOKUP_NAMES = new Set(['find', 'findIndex', 'some', 'filter', 'findLast', 'findLastIndex']);
const BY_ID_G = /\b\w+\.id\s*===\s*id\b/g;
for (const [name, code] of SHAPES) {
  for (const m of code.matchAll(BY_ID_G)) {
    let cursor = m.index!;
    let exempt = false;
    const chain: string[] = [];
    for (let depth = 0; depth < 6; depth++) {
      const e = enclosingCall(code, cursor);
      if (!e) break;
      chain.push(e.callee || '<anon>');
      if (LOOKUP_NAMES.has(e.callee)) { exempt = true; break; }
      cursor = e.start - 1;
      if (cursor < 0) break;
    }
    console.log(`${name.padEnd(22)} exempt=${exempt}  chain=[${chain.join(' > ')}]`);
  }
}
