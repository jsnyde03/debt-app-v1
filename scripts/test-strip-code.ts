/**
 * [S1.10.6.5.8.6 · GAP-9] — **`lib/stripCode.ts`, PINNED. Eleven gates read through it and nothing tested it.**
 *
 * ⛔ **Measured at `613adf2` and re-measured here: zero tests referenced this file or either export.** Pass
 * 3's decisive result — **0 LOST / 0 GAINED across ten gates under both strippers** — means every gate's
 * verdict is currently *insensitive* to the regex-modelling branch, so **reverting it is silent by
 * construction.** That is the whole exposure: the hardest code in the instrument stack is the code nothing
 * would notice losing.
 *
 * ⚡ **This is a CHARACTERIZATION test, and that distinction is deliberate.** Two of the constructs GAP-9
 * names are **misparsed today**, and both are pinned as *what the function does* rather than asserted as
 * *what it should do*:
 *
 * - **a regex after `return` is not recognised as a regex** — its body survives A&S untouched;
 * - **a shebang's `/usr/` IS treated as a regex** and `usr` gets blanked.
 *
 * ⚠️ **Neither is endorsed and neither is a live defect** — no gate's verdict depends on either, which is
 * exactly why both went unnoticed. Writing them down as expectations is the only thing that makes a future
 * change to the scanner **visible** instead of silent. ⛔ If you fix one, this file reds and you update the
 * expectation deliberately — which is the point.
 *
 * ⭐ **The load-bearing invariant is LENGTH AND LINE COUNT PRESERVATION.** Every consumer maps a match back
 * to a `file:line`, so a stripper that shortened a line would move every reported position in eleven gates
 * at once. Asserted on every case, in both directions.
 */
import { stringLiterals, stripCommentsAndStrings, stripCommentsOnly } from './lib/stripCode';

let passed = 0;
const failures: string[] = [];
const check = (cond: boolean, label: string) => { if (cond) passed++; else failures.push(label); };
const eq = (got: string, want: string, label: string) =>
  check(got === want, `${label}\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`);

/** [source, after stripCommentsAndStrings, after stripCommentsOnly, note] */
const CASES: [string, string, string, string][] = [
  // ── comments ─────────────────────────────────────────────────────────────────────────────────────
  ['const x = 1; // c', 'const x = 1;     ', 'const x = 1;     ', 'a line comment is blanked by BOTH'],
  ['a /* b */ c', 'a         c', 'a         c', 'a block comment is blanked by both'],

  // ── the difference between the two exports ───────────────────────────────────────────────────────
  ["const s = 'kept';", "const s = '    ';", "const s = 'kept';", 'A&S blanks string CONTENT, ONLY keeps it — delimiters stay in place either way'],
  ["const s = 'http://x';", "const s = '        ';", "const s = 'http://x';", 'a // inside a string is not a comment — the case a per-line regex gets wrong'],

  // ── division must NOT be read as a regex ─────────────────────────────────────────────────────────
  ['const q = a / b / c;', 'const q = a / b / c;', 'const q = a / b / c;', 'plain division, twice, is left alone'],
  ['const q = {a:1}.a / 2 / 3;', 'const q = {a:1}.a / 2 / 3;', 'const q = {a:1}.a / 2 / 3;', 'division after a property access, which a naive scanner reads as a regex'],
  ['const el = <div>{x}</div>;', 'const el = <div>{x}</div>;', 'const el = <div>{x}</div>;', 'a JSX closing tag is not a regex — this file is read over .tsx'],

  // ── where the regex branch EARNS ITS KEEP ────────────────────────────────────────────────────────
  // ⛔ These are the cases that separate a real scanner from `/\/\/.*$/`. A quote INSIDE a regex body
  // must not open a string: if it did, everything after it — including real code — would be blanked as
  // string content, and eleven gates would stop seeing the rest of the line.
  ["const re = /'/; const s = 'leak';", "const re = / /; const s = '    ';", "const re = /'/; const s = 'leak';", "a single quote inside a regex body does not open a string"],
  ['const re = /[/]*x/; const after = 1;', 'const re = /     /; const after = 1;', 'const re = /[/]*x/; const after = 1;', 'a / inside a regex character class does not close the regex, and the /* that follows is not a block comment'],
];

for (const [src, wantAS, wantONLY, note] of CASES) {
  eq(stripCommentsAndStrings(src), wantAS, `A&S: ${note}`);
  eq(stripCommentsOnly(src), wantONLY, `ONLY: ${note}`);
}

// ── The two KNOWN MISPARSES, pinned as behaviour rather than endorsed ────────────────────────────────
eq(
  stripCommentsAndStrings('return /a/b/;'),
  'return /a/b/;',
  '⚠️ KNOWN MISPARSE, pinned not endorsed: a regex after `return` is NOT recognised, so its body survives',
);
eq(
  stripCommentsAndStrings('#!/usr/bin/env node'),
  '#!/   /bin/env node',
  '⚠️ KNOWN MISPARSE, pinned not endorsed: a shebang reads as a regex and `usr` is blanked',
);

// ── The load-bearing invariant ───────────────────────────────────────────────────────────────────────
// ⛔ Every consumer maps a match back to file:line. A stripper that changed length or line count would
// move every reported position in eleven gates at once.
const MULTILINE = [
  '// leading comment',
  "const a = 'one';",
  '/* block',
  '   spanning */',
  'const b = /x/.test(a);',
  '',
  'const c = `tpl ${a} tail`;',
].join('\n');

for (const [name, strip] of [
  ['stripCommentsAndStrings', stripCommentsAndStrings],
  ['stripCommentsOnly', stripCommentsOnly],
] as [string, (s: string) => string][]) {
  const out = strip(MULTILINE);
  check(out.length === MULTILINE.length, `${name} preserves total LENGTH (${out.length} vs ${MULTILINE.length})`);
  check(
    out.split('\n').length === MULTILINE.split('\n').length,
    `${name} preserves LINE COUNT (${out.split('\n').length} vs ${MULTILINE.split('\n').length})`,
  );
  const a = out.split('\n');
  const b = MULTILINE.split('\n');
  check(
    a.every((l, i) => l.length === b[i]!.length),
    `${name} preserves EVERY LINE's length — a shifted column is a misreported file:line in 11 gates`,
  );
}

// ── Non-vacuity ─────────────────────────────────────────────────────────────────────────────────────
// ⛔ Without this, a stripper rewritten to `return src` unchanged would satisfy every length assertion
// above and most of the equality ones.
check(stripCommentsAndStrings(MULTILINE) !== MULTILINE, 'A&S actually CHANGES the multiline fixture');
check(stripCommentsOnly(MULTILINE) !== MULTILINE, 'ONLY actually CHANGES the multiline fixture');
check(
  stripCommentsAndStrings(MULTILINE) !== stripCommentsOnly(MULTILINE),
  'the two exports DIFFER on this fixture — else one of them is not being exercised at all',
);

// ── stringLiterals ──────────────────────────────────────────────────────────────────────────────────
/**
 * ⛔ **THE EXPORT ADDED FOR `U2`, AND ITS WHOLE POINT IS THE CASE A DELIMITER PAIR GETS WRONG.**
 *
 * ⚡ `check-glossary` matched copy with `/'[^']*'/` over the whole file. An English contraction inside a
 * double-quoted string opened a single-quote "fragment" that closed on the next unrelated `'`, welding
 * everything between into one sentence — **1,818 of 10,425 fragments spanned more than one line, the
 * largest 39 lines of executable code**, in a gate with no cap and no allow-list. After this: **9**.
 *
 * ⚠️ The first assertion IS that defect. If `stringLiterals` ever returns 2 literals for it instead of 3,
 * the weld is back.
 */
{
  const q = String.fromCharCode(39);
  const src = [`export const warn = "don${q}t stop";`, `export const other = ${q}x${q};`].join('\n');
  const lits = stringLiterals(src);
  check(lits.length === 2, `stringLiterals: an apostrophe inside "…" does not open a fragment (got ${lits.length}, want 2)`);
  check(lits[0]?.text === `"don${q}t stop"`, 'stringLiterals: …and the double-quoted literal is returned whole, delimiters included');
  check(lits[1]?.text === `${q}x${q}`, 'stringLiterals: …and the later single-quoted literal is its own fragment, not a weld');
  /**
   * ⚠️ **`lits[1]?.index ?? -1`, never `lits[1]!.index`** — a plant that empties `stringLiterals` used to
   * make this line THROW, so the run died before `failures` was printed and `prove:guards` scored
   * `reason=WRONG`: the gate redded, but not with the message that names the defect. An assertion must
   * FAIL, not crash, or every assertion after it is unreachable and the verdict is about the crash.
   */
  const at = lits[1]?.index ?? -1;
  check(src.slice(at, at + 3) === `${q}x${q}`, 'stringLiterals: `index` points at the literal in the ORIGINAL text, so a hit reports its real line');

  const tpl = ['const a = `your breathing', '  room this month`;'].join('\n');
  const t = stringLiterals(tpl);
  // ⚠️ Same shape as the note above — `?.` so an empty result FAILS the check rather than throwing past it.
  check(t.length === 1 && (t[0]?.text ?? '').includes('\n'), 'stringLiterals: a TEMPLATE literal legitimately spans lines and is returned whole — T6 coverage');

  check(
    stringLiterals('// a comment with a lone apostrophe: don' + q + '\nconst b = ' + q + 'real' + q + ';').length === 1,
    'stringLiterals: a quote inside a COMMENT opens nothing — the scanner knows which construct it is in',
  );
}

if (failures.length > 0) {
  console.error(`\n❌ stripCode: ${failures.length} failure(s).\n`);
  for (const f of failures) console.error(`  • ${f}\n`);
  console.error('  Eleven gates read their input through this file. A change here moves all of them.\n');
  process.exit(1);
}

console.log(`✅ stripCode: ${passed} assertions over ${CASES.length + 2} constructs, length and line count preserved.`);
