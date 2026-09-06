import { readFileSync } from 'node:fs';
const reg = JSON.parse(readFileSync('scripts/finding-guards.json', 'utf8'));
const ids = Object.keys(reg);
const short = (l) => l.replace(/^S1[A-Z0-9]*-/, '').replace(/^CLASS4-/, '');

// A. entries that would make `!e.token.includes(expect)` THROW (no string token beside an `expect`)
const noToken = Object.entries(reg).filter(([, e]) => e.proof && e.proof.expect !== undefined && typeof e.token !== 'string');
console.log('A. expect present, token not a string:', noToken.length, noToken.map(([i]) => i).join(','));
const anyNoToken = Object.entries(reg).filter(([, e]) => typeof e.token !== 'string');
console.log('A2. entries with no string token at all:', anyNoToken.length, anyNoToken.map(([i]) => i).join(','));

// B. short-form substring collisions between registry ids
const shorts = ids.map((i) => [i, short(i)]);
let collisions = 0;
for (const [i, s] of shorts) {
  const inside = shorts.filter(([j, t]) => j !== i && t.includes(s));
  if (inside.length) { collisions++; console.log('B. collision:', s, '(from', i, ') is a substring of:', inside.map(([, t]) => t).join(',')); }
}
console.log('B. total colliding short forms:', collisions);

// C. fire-count of a WORD-BOUNDARY tightening, measured on the live registry.
// ids are [A-Za-z0-9-] only, so no regex escaping is needed: boundary-test by hand.
const isWord = (ch) => ch !== undefined && /[A-Za-z0-9-]/.test(ch);
function boundedIncludes(note, needle) {
  let from = 0;
  for (;;) {
    const i = note.indexOf(needle, from);
    if (i < 0) return false;
    if (!isWord(note[i - 1]) && !isWord(note[i + needle.length])) return true;
    from = i + 1;
  }
}
let n = 0, diff = 0;
for (const [id, e] of Object.entries(reg)) {
  const expect = e.proof?.expect;
  if (expect === undefined || typeof e.token !== 'string' || e.token.includes(expect)) continue;
  const lenders = ids.filter((o) => o !== id && reg[o].token?.includes(expect));
  if (!lenders.length) continue;
  n++;
  const note = e.proof.proofNote ?? '';
  const loose = lenders.some((l) => note.includes(l) || note.includes(short(l)));
  const strict = lenders.some((l) => boundedIncludes(note, l) || boundedIncludes(note, short(l)));
  console.log('C.', id, 'lenders=', lenders.join(','), 'loose=', loose, 'strict=', strict);
  if (loose !== strict) diff++;
}
console.log('C. entries with lenders:', n, '| word-boundary tightening newly-refused count:', diff);
