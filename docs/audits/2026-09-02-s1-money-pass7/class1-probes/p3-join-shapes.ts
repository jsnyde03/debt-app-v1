/**
 * Class 1 probe 3 — the shapes the joiner must and must not join.
 * Run: npx tsx docs/audits/2026-09-02-s1-money-pass7/class1-probes/p3-join-shapes.ts
 */
import { logicalLines } from '../../../../scripts/lib/logicalLines';

const CASES: Record<string, { src: string[]; wantSpan: number; why: string }> = {
  'wrapped import (D1-8)': {
    src: ['import {', '  appStore,', "} from '../store/appStore';", 'const y = 1;'],
    wantSpan: 3,
    why: 'the escape D1-8 reports — must join or the gate stays blind',
  },
  'same-line import': {
    src: ["import { appStore } from '../store/appStore';"],
    wantSpan: 1,
    why: 'unchanged',
  },
  'function body must NOT join': {
    src: ['function f() {', '  const a = 1;', '  return a;', '}'],
    wantSpan: 1,
    why: "a body's contents are statements of their own",
  },
  'arrow body must NOT join': {
    src: ['const s = createStore((set, get) => {', '  const a = 1;', '  return a;', '});'],
    wantSpan: 1,
    why: 'store.ts:336 ran to line 1106 before this rule',
  },
  'wrapped call (D1-3)': {
    src: ['const a = parseAmountField(', '  raw,', ') ?? 0;'],
    wantSpan: 3,
    why: 'the amount-collapse escape',
  },
  'object literal joins': {
    src: ['const o = {', '  a: 1,', '};'],
    wantSpan: 1,
    why: 'NOT joined: braces count only for import/export — a wrapped call inside still joins on its parens',
  },
  'else branch must NOT join': {
    src: ['if (x) {', '  a();', '} else {', '  b();', '}'],
    wantSpan: 1,
    why: 'block keyword',
  },
};

let failures = 0;
for (const [name, c] of Object.entries(CASES)) {
  const first = logicalLines(c.src.join('\n'), { blankStrings: true })[0];
  const ok = first.span === c.wantSpan;
  if (!ok) failures++;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(32)} span=${first.span} want=${c.wantSpan}  (${c.why})`,
  );
  if (!ok) console.log(`       got: ${JSON.stringify(first.text.trim())}`);
}
console.log(failures ? `\n${failures} shape(s) wrong` : '\nall shapes correct');
process.exit(failures ? 1 : 0);
