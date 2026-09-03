/**
 * Class 1 probe 3 — the shapes the flattener must and must not flatten, and the properties the callers
 * depend on. Rewritten for the v2 API after the class-1 re-audit killed the joining design.
 *
 * Run: npx tsx docs/audits/2026-09-02-s1-money-pass7/class1-probes/p3-join-shapes.ts
 */
import { flattenContinuations } from '../../../../scripts/lib/logicalLines';

/** How many physical lines the statement starting at line 1 was flattened across. */
function runLength(src: string): number {
  const flat = flattenContinuations(src);
  const firstNl = flat.text.indexOf('\n');
  const upTo = firstNl === -1 ? flat.text : flat.text.slice(0, firstNl);
  // count how many source newlines were consumed inside that first statement
  return upTo.length === 0 ? 1 : src.slice(0, upTo.length).split('\n').length;
}

const CASES: Record<string, { src: string[]; want: number; why: string }> = {
  'wrapped import (D1-8)': {
    src: ['import {', '  appStore,', "} from '../store/appStore';", 'const y = 1;'],
    want: 3,
    why: 'the escape D1-8 reports',
  },
  'same-line import': { src: ["import { appStore } from '../store/appStore';"], want: 1, why: 'unchanged' },
  'function body must NOT flatten': {
    src: ['function f() {', '  const a = 1;', '  return a;', '}'],
    want: 1,
    why: "a body's contents are statements of their own",
  },
  'arrow body must NOT flatten': {
    src: ['const s = createStore((set, get) => {', '  const a = 1;', '});'],
    want: 1,
    why: 'store.ts:336 ran to line 1106 before this rule',
  },
  'wrapped call (D1-3)': {
    src: ['const a = parseAmountField(', '  raw,', ') ?? 0;'],
    want: 3,
    why: 'the amount-collapse escape',
  },
  'else branch must NOT flatten': {
    src: ['if (x) {', '  a();', '} else {', '  b();', '}'],
    want: 1,
    why: 'block keyword',
  },
};

let failures = 0;
for (const [name, c] of Object.entries(CASES)) {
  const got = runLength(c.src.join('\n'));
  const ok = got === c.want;
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(34)} run=${got} want=${c.want}  (${c.why})`);
}

// ── the two properties every caller depends on ───────────────────────────────────────────────────
const SAMPLE = ['const a = parseAmountField(', '  raw,', ') ?? 0;', 'const b = 2;', 'const c = 3;'].join('\n');
const flat = flattenContinuations(SAMPLE);

const lenOk = flat.text.length === SAMPLE.length;
console.log(`${lenOk ? 'ok  ' : 'FAIL'} length preserved                  ${flat.text.length} vs ${SAMPLE.length}`);
if (!lenOk) failures++;

// R3: the reported line must be the MATCH's line, not the statement's first line.
const idx = flat.text.indexOf('const c');
const lineOk = flat.lineAt(idx) === 5;
console.log(`${lineOk ? 'ok  ' : 'FAIL'} lineAt is the MATCH's line        got ${flat.lineAt(idx)} want 5  (R3)`);
if (!lineOk) failures++;

// R4: a statement-ending newline must SURVIVE, so `[^\n]*?` cannot bridge two statements.
const bridged = /const b[^\n]*const c/.test(flat.text);
console.log(`${bridged ? 'FAIL' : 'ok  '} statement newline survives        two statements ${bridged ? 'BRIDGED' : 'not bridged'}  (R4)`);
if (bridged) failures++;

console.log(failures ? `\n${failures} property/shape wrong` : '\nall shapes and properties correct');
process.exit(failures ? 1 : 0);
