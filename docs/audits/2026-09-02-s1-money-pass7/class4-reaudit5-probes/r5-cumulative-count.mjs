/**
 * R5 — derive the cumulative population TWO ways, INDEPENDENTLY of round 4's arithmetic.
 * The brief states 127.  Both derivations share one out-of-band fact (W9b lives only in
 * DEBT_ELEVATION_LOG.md), so their agreement is NOT confirmation — reported as such.
 */
import { readFileSync } from 'node:fs';
const D = 'docs/audits/2026-09-02-s1-money-pass7/';
const read = (f) => readFileSync(D + f, 'utf8');

// ---- CONTROL 1: the heading-shaped enumeration the brief says is silently zero ----
const c1files = ['CLASS1-REAUDIT.md', 'CLASS1-REAUDIT-2.md', 'CLASS1-REAUDIT-3.md', 'CLASS1-REAUDIT-4.md', 'CLASS1-REAUDIT-5.md', 'CLASS1-REAUDIT-6.md'];
console.log('CONTROL 1 — `### `ID`` heading count per class-1 round (the shape that returns a SILENT ZERO):');
for (const f of c1files) {
  const n = new Set((read(f).match(/^### `([A-Z]+\d+[a-z]?)`/gm) ?? [])).size;
  console.log(`  ${f.padEnd(22)} ${n}${n === 0 ? '   <-- SILENT ZERO' : ''}`);
}

// ---- CONTROL 2: the same heading shape over the class-4 rounds ----
const c4files = ['CLASS4-REAUDIT.md', 'CLASS4-REAUDIT-2.md', 'CLASS4-REAUDIT-3.md', 'CLASS4-REAUDIT-4.md'];
console.log('\nCONTROL 2 — heading-shaped count per class-4 round (## for round 1, ### after):');
for (const f of c4files) {
  const h2 = new Set((read(f).match(/^## `([A-Z]?\d?[A-Z]?\d+-?\d*)`/gm) ?? []));
  const h3 = new Set((read(f).match(/^### `(R\d-\d)`/gm) ?? []));
  console.log(`  ${f.padEnd(22)} h2=${h2.size} h3=${h3.size}`);
}

// ---- DERIVATION B: over the id SPELLINGS in the text, contiguity checked ----
const spell = [
  ['CLASS1-REAUDIT.md', /\bR(\d{1,2})\b/g, 'R'],
  ['CLASS1-REAUDIT-2.md', /\bN-(\d{1,2})\b/g, 'N-'],
  ['CLASS1-REAUDIT-3.md', /\bT(\d{1,2})\b/g, 'T'],
  ['CLASS1-REAUDIT-4.md', /\bU(\d{1,2})\b/g, 'U'],
  ['CLASS1-REAUDIT-5.md', /\bV(\d{1,2})\b/g, 'V'],
  ['CLASS1-REAUDIT-6.md', /\bW(\d{1,2}b?)\b/g, 'W'],
  ['CLASS4-REAUDIT.md', /\bF(\d{1,2})\b/g, 'F'],
  ['CLASS4-REAUDIT-2.md', /\bR2-(\d{1,2})\b/g, 'R2-'],
  ['CLASS4-REAUDIT-3.md', /\bR3-(\d{1,2})\b/g, 'R3-'],
  ['CLASS4-REAUDIT-4.md', /\bR4-(\d{1,2})\b/g, 'R4-'],
];
console.log('\nDERIVATION B — contiguous id runs, read out of the files themselves:');
let sum = 0;
for (const [f, re, pre] of spell) {
  const nums = new Set([...read(f).matchAll(re)].map((m) => m[1]));
  const ints = [...nums].filter((s) => /^\d+$/.test(s)).map(Number).sort((a, b) => a - b);
  const max = Math.max(...ints);
  const contiguous = ints.length === max && ints[0] === 1;
  const extras = [...nums].filter((s) => !/^\d+$/.test(s));
  console.log(`  ${f.padEnd(22)} ${pre}1..${pre}${max}  count=${ints.length}  contiguous=${contiguous}  non-numeric ids=${extras.join(',') || '-'}`);
  sum += ints.length;
}
// The out-of-band fact BOTH derivations depend on.
const log = readFileSync('docs/DEBT_ELEVATION_LOG.md', 'utf8');
const w9bInLog = /\bW9b\b/.test(log);
const w9bInDir = spell.some(([f]) => /\bW9b\b/.test(read(f)));
console.log(`\n  W9b in DEBT_ELEVATION_LOG.md: ${w9bInLog}  ·  in ANY pass-7 findings file: ${w9bInDir}`);

const class1base = 11, class4base = 11;
const bTotal = class1base + class4base + sum + (w9bInLog ? 1 : 0);
console.log(`\nDERIVATION B total = class-1 base ${class1base} + class-4 base ${class4base} + file-read ids ${sum} + W9b ${w9bInLog ? 1 : 0} = ${bTotal}`);
console.log(`  (without W9b, i.e. a purely file-driven enumeration of this directory: ${bTotal - 1})`);
const aTotal = 95 + 11 + 8 + 6 + 4 + 3;
console.log(`DERIVATION A (the brief's arithmetic) = 95 + 11 + 8 + 6 + 4 + 3 = ${aTotal}`);
console.log(`\nAGREE: ${aTotal === bTotal}  (both share the W9b fact — NOT independent)`);
