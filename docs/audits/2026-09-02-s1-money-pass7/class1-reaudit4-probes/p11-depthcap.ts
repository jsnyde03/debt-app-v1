import { enclosingCall } from '../../../../scripts/lib/logicalLines';
const LOOKUP = new Set(['find', 'findIndex', 'some', 'filter', 'findLast', 'findLastIndex']);
const G = /\b\w+\.id\s*===\s*id\b/g;
function exempt(code: string): { exempt: boolean; chain: string[] } {
  const m = G.exec(code)!;
  let cursor = m.index; let ex = false; const chain: string[] = [];
  for (let d = 0; d < 6; d++) {
    const e = enclosingCall(code, cursor);
    if (!e) break;
    chain.push(e.callee || '<anon>');
    if (LOOKUP.has(e.callee)) { ex = true; break; }
    cursor = e.start - 1;
    if (cursor < 0) break;
  }
  G.lastIndex = 0;
  return { exempt: ex, chain };
}
for (let n = 0; n <= 8; n++) {
  const open = Array.from({ length: n }, (_, i) => 'f' + i + '(').join('');
  const close = ')'.repeat(n);
  const src = 'rows.find((r) => ' + open + 'r.id === id' + close + ')';
  const r = exempt(src);
  console.log('wrappers=' + n + '  exempt=' + r.exempt + '  chainDepth=' + r.chain.length + '  chain=[' + r.chain.join(' > ') + ']');
}
