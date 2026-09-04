/**
 * Probe: V3 replaced check-glossary's JSX line bound with a CODE-PUNCTUATION test.
 * Prose contains parentheses. What real copy does the new rule reject, and what code weld does it admit?
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const CODE_PUNCTUATION = /[;=(){}`]|=>|\|\||&&/;
// what a `>…<` span must look like to be plausibly a sentence a user reads
const PROSE = /^[^A-Za-z]*[A-Z][a-z]+(?:[^A-Za-z]+[a-z]+){2,}/;

function walk(d: string, out: string[] = []): string[] {
  for (const e of readdirSync(d)) {
    if (e === 'node_modules' || e === '.expo' || e === 'dist') continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === '.tsx') out.push(p);
  }
  return out;
}

const files = walk(join(ROOT, 'apps', 'rn', 'src'));
let total = 0;
let rejected = 0;
const proseRejected: string[] = [];
const admittedWelds: string[] = [];
const byChar = new Map<string, number>();

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/>[^<>{}]{2,}</g)) {
    total++;
    const body = m[0].slice(1, -1).replace(/\s+/g, ' ').trim();
    if (CODE_PUNCTUATION.test(m[0])) {
      rejected++;
      const c = (/[;=(){}`]|=>|\|\||&&/.exec(m[0]) ?? [''])[0];
      byChar.set(c, (byChar.get(c) ?? 0) + 1);
      if (PROSE.test(body) && body.length > 12) proseRejected.push(`${relative(ROOT, f)}  ${JSON.stringify(body.slice(0, 110))}`);
    } else if (/[?:]|\.\w|\[|\]|!==|===|\breturn\b/.test(body) && !PROSE.test(body)) {
      admittedWelds.push(`${relative(ROOT, f)}  ${JSON.stringify(body.slice(0, 110))}`);
    }
  }
}

console.log(`.tsx files: ${files.length};  >…< spans: ${total};  rejected by CODE_PUNCTUATION: ${rejected}`);
console.log('rejected by which token:', [...byChar].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${JSON.stringify(c)}=${n}`).join(' '));
console.log(`\n=== PROSE-SHAPED spans the punctuation rule REJECTS (blind direction) — ${proseRejected.length} ===`);
proseRejected.slice(0, 25).forEach((r) => console.log('  ' + r));
console.log(`\n=== CODE-SHAPED spans the punctuation rule ADMITS (noisy direction) — ${admittedWelds.length} ===`);
admittedWelds.slice(0, 25).forEach((r) => console.log('  ' + r));

// synthetic: the exact shapes the rule is claimed to separate
console.log('\n=== synthetic ===');
for (const [label, s] of [
  ['prose with a parenthetical', '<Text>Your cushion (after bills) is safe</Text>'],
  ['prose with an em-dash', '<Text>Your cushion is safe this month</Text>'],
  ['prose ending in a semicolon list', '<Text>Rent; groceries; petrol</Text>'],
  ['prose quoting a key', '<Text>Tap Done to save</Text>'],
  ['ternary weld, no banned punctuation', 'a > b ? plural : singular < c'],
  ['comparison chain', 'count > 0 ? many : one < limit'],
] as const) {
  const hit = [...s.matchAll(/>[^<>{}]{2,}</g)].map((m) => m[0]);
  const kept = hit.filter((h) => !CODE_PUNCTUATION.test(h));
  console.log(`  ${label.padEnd(34)} spans=${hit.length} kept=${kept.length}  ${JSON.stringify(kept[0] ?? '')}`);
}
