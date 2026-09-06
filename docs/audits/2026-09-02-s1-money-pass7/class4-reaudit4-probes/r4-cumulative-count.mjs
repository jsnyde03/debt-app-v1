/**
 * R4 — derive the cumulative population TWO ways. A disagreement is itself a finding.
 * Round 3 warned: a HEADING-shaped enumeration returns ZERO for four class-1 rounds and does not
 * error, and `W9b` exists only in DEBT_ELEVATION_LOG.md, so a file-driven count returns 119.
 */
import { readFileSync } from 'node:fs';
const D = 'docs/audits/2026-09-02-s1-money-pass7/';
const read = (f) => readFileSync(D + f, 'utf8');

// --- the control the brief demands: does a HEADING-shaped enumeration silently return zero? ---
const files = ['CLASS1-REAUDIT.md','CLASS1-REAUDIT-2.md','CLASS1-REAUDIT-3.md','CLASS1-REAUDIT-4.md','CLASS1-REAUDIT-5.md','CLASS1-REAUDIT-6.md'];
console.log('CONTROL — `### `ID`` heading-shaped count per class-1 round:');
for (const f of files) {
  const n = new Set(read(f).match(/^### `([A-Z]+\d+[a-z]?)`/gm) ?? []).size;
  console.log(`  ${f.padEnd(22)} ${n}${n === 0 ? '   <-- SILENT ZERO, exactly as round 3 recorded' : ''}`);
}

// --- derivation B: regex over the ID SPELLINGS themselves, per round ---
const spell = [
  ['CLASS1-REAUDIT.md',   /\bR(\d{1,2})\b/g,    'R'],
  ['CLASS1-REAUDIT-2.md', /\bN-(\d{1,2})\b/g,   'N-'],
  ['CLASS1-REAUDIT-3.md', /\bT(\d{1,2})\b/g,    'T'],
  ['CLASS1-REAUDIT-4.md', /\bU(\d{1,2})\b/g,    'U'],
  ['CLASS1-REAUDIT-5.md', /\bV(\d{1,2})\b/g,    'V'],
  ['CLASS1-REAUDIT-6.md', /\bW(\d{1,2}b?)\b/g,  'W'],
];
console.log('\nDERIVATION B — contiguous id runs per class-1 round:');
let c1rounds = 0;
for (const [f, re, pre] of spell) {
  const nums = new Set([...read(f).matchAll(re)].map((m) => m[1]));
  const ints = [...nums].filter((s) => /^\d+$/.test(s)).map(Number).sort((a, b) => a - b);
  const max = Math.max(...ints);
  const contiguous = ints.length === max && ints[0] === 1;
  console.log(`  ${f.padEnd(22)} ${pre}1..${pre}${max}  count=${ints.length}  contiguous=${contiguous}  extras=${[...nums].filter((s)=>!/^\d+$/.test(s)).join(',') || '-'}`);
  c1rounds += ints.length;
}
// W9b lives ONLY in DEBT_ELEVATION_LOG.md — the out-of-band fact both derivations share.
const log = readFileSync('docs/DEBT_ELEVATION_LOG.md', 'utf8');
const w9bInLog = /\bW9b\b/.test(log);
const w9bInDir = spell.some(([f]) => /\bW9b\b/.test(read(f)));
console.log(`\n  W9b present in DEBT_ELEVATION_LOG.md: ${w9bInLog}   ·   present in any pass-7 findings file: ${w9bInDir}`);

const cls = read('CLASSIFICATION.md');
const class1 = Number(cls.match(/class 1[^\n]*?\|\s*(\d+)\s*\|/i)?.[1] ?? NaN);
console.log(`  CLASSIFICATION.md class-1 / class-4 table rows: see below`);
for (const line of cls.split('\n').filter((l) => /class\s*[14]\b/i.test(l) && l.includes('|'))) console.log('   ', line.trim().slice(0, 120));

const counts = { 'class 1 base': 11, 'class 1 re-audit rounds': c1rounds, 'W9b (log only)': w9bInLog ? 1 : 0, 'class 4': 11, 'round 1': 8, 'round 2': 6, 'round 3': 4 };
const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log('\nDERIVATION B total:', JSON.stringify(counts), '=>', total);
console.log('DERIVATION A (the brief\'s arithmetic): 11+15+11+14+16+12+15+1 = 95 ; +11+8+6+4 =', 95 + 11 + 8 + 6 + 4);
