/**
 * Glossary guard — bans the words T4 retired from ever returning to user-facing copy.
 *
 * ⛔ **This exists because the words came back once already.** T4.4's own rename put "Everyday spending"
 * into three files at the moment it retired "Living Expenses", and only `lint:copy` saw it. That gate
 * catches DUPLICATION; this one catches RESURRECTION — a retired synonym re-typed into a new screen by
 * an author who never read the glossary. [D31]: a finding that becomes a gate is paid for once.
 *
 * ⚠️ **It scans string literals and JSX text, never comments.** Half the hits for every one of these
 * words are prose explaining why the word was retired — including this file's own header. A checker that
 * flagged those would be turned off within a week. Identifiers are likewise fine: `detectCrunches` and
 * `CrunchSegment` are engine names the user never reads, and `expense_reserve` is a category.
 *
 * ⚠️ **The engine's allocation `label`s are exempt** (`packages/core/engine/allocatePaycheck.ts`).
 * T4.2 measured that nothing renders them — every consumer filters by `category` — so they are
 * diagnostic strings, and coupling them to the glossary would make dead text load-bearing.
 *
 * Usage: tsx scripts/check-glossary.ts
 */
import ts from 'typescript';

import { stringLiterals, stripCommentsOnly } from './lib/stripCode';
import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';

/** GAP-8 — this gate's key in scripts/gate-scan-floors.json. */
const SCAN_GATE = 'glossary';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, basename } from 'node:path';

import { lineMap } from './lib/logicalLines';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOTS = [join(REPO_ROOT, 'packages', 'core'), join(REPO_ROOT, 'apps', 'rn', 'src')];

/** Files whose strings are not user-facing copy. */
const EXEMPT = [
  join('engine', 'allocatePaycheck.ts'),   // diagnostic allocation labels — see the header
  join('copy', 'vocabulary.ts'),           // the owner: it NAMES the retired words to retire them
  join('src', 'store', 'glossary.test.ts'),
];

/** word → what to use instead. Matched case-insensitively, whole word. */
const RETIRED: { pattern: RegExp; word: string; use: string }[] = [
  { pattern: /\bvanquish(ed|es)?\b/i, word: 'vanquished', use: '"paid off" (T4.6 / audit L1-19)' },
  { pattern: /\bbreathing room\b/i, word: 'breathing room', use: '"cushion" (T4.3 / audit L1-5)' },
  { pattern: /\bcash buffer\b/i, word: 'cash buffer', use: '"cushion" (T4.3 / audit L1-5)' },
  { pattern: /\bliving expenses\b/i, word: 'Living Expenses', use: '"Everyday spending" (T4.4 / audit L1-6)' },
  // ⛔ T5 / L3-7 — not a synonym but a CLAIM: `presumedPaid` is only "the due date passed and you have
  // not flagged it failed", so a bounced autopay satisfies it exactly. "ran" asserted it as an event on
  // the one screen that exists to establish ground truth. "should have run" is the presumption stated as
  // one. The pattern deliberately does not match that replacement.
  { pattern: /\bautopay\s*·\s*ran\b/i, word: 'Autopay · ran', use: '"Autopay · should have run" (T5 / audit L3-7)' },
];

/** A cash-state label may not use these; "Crunch" was the fourth name for `at-risk`. */
const STATE_WORDS = /\bcrunch\b/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (['.ts', '.tsx'].includes(extname(full))) out.push(full);
  }
  return out;
}

/**
 * ⛔ **DELEGATES TO THE SHARED SCANNER.** [S0.8b · REVERIFY-2 finding 2] This file used to carry the
 * `(^|[^:])//` pair, whose `[^:]` lookbehind is a patch for `https://` and nothing else: a `//` inside
 * ANY other string still truncated the line and took real code with it. Six gates carried that pair
 * after the "fix" that named it — the fifth short enumeration in this cluster.
 *
 * ⚠️ `stripCommentsOnly`, not `stripCommentsAndStrings`: this gate reads what is INSIDE the strings.
 */
function stripComments(src: string): string {
  // ⛔ GAP-8 — count what actually survived the strip; a gate that reads nothing must not pass.
  return scanned(SCAN_GATE, stripCommentsOnly(src));
}

/** Quoted literals + JSX text nodes — the places a user can actually read a word. */
/**
 * ⛔ **RUN OVER THE WHOLE FILE, NOT PER LINE** — [class-1 re-audit 3 · `T6`].
 *
 * Four of the five retired terms are **phrases** — `breathing room`, `cash buffer`, `living expenses`,
 * `autopay · ran` — so an ordinary JSX text wrap between the two words defeated every one of them. The
 * census row exempting this gate said *"a wrapped sentence is not a different sentence to a reader"*, which
 * is exactly right about the reader and was false about the gate.
 *
 * ⚠️ These fragment patterns already cross newlines (`[^']*` and `[^<>{}]` both match one); it was the
 * per-line application that stopped them. Offsets are returned so a hit still reports its real line.
 */
/**
 * ⛔ **THE QUOTED FRAGMENTS COME FROM THE SCANNER, NOT FROM A DELIMITER PAIR.**
 * [class-1 re-audit 4 `U2`, major]
 *
 * ⚡ `T6`'s whole-file migration was right — four of the five retired terms are two-word phrases, and an
 * ordinary wrap between the words defeated every one of them per line. What it did not carry was that
 * `/'[^']*'/` had been relying on the newline as an implicit terminator. Over a whole file each regex runs
 * to the next matching delimiter ANYWHERE: **1,818 of 10,425 fragments spanned more than one line, the
 * largest 39 lines of executable code**, and one weld was live in the tree with no plant at all.
 *
 * ⚡ Measured, on a green tree: three lines of ordinary code — `export const warn = "don't stop";` and a
 * bare `crunch` identifier of the kind this gate's own docblock declares exempt — **redded it**. The
 * apostrophe opened a fragment that closed on the next unrelated `'`, welding the identifier in.
 * ⛔ **This gate has no cap and no allow-list**: `problems.length > 0` exits 1. Noise here is a red tree.
 *
 * ⚠️ The JSX rule stays a regex — the scanner does not model JSX text — but is BOUNDED to two newlines.
 * A Prettier wrap of a two-word phrase spans one; `>` is also the comparison operator and the tail of
 * `=>`, so unbounded it opened a "text node" that closed on the next `<` **1,809 times**.
 */
/**
 * ⛔ **CODE PUNCTUATION, NOT A LINE COUNT — the line bound RE-OPENED `T6`.**
 * [class-1 re-audit 5 `V3`, major]
 *
 * ⚡ `U2` bounded a JSX fragment at two newlines, reasoning *"a Prettier wrap of a two-word phrase spans
 * one"*. **That arithmetic is wrong**: a `>…<` match around a two-line text node carries **three**
 * newlines — one after the opening tag, one between the text lines, one before the closing tag — so the
 * bound rejected exactly the shape it claimed to admit. `T6`'s own motivating case, *a retired phrase
 * wrapped between its two words*, went green again, and **eight blocks of shipped prose left the
 * population** — including `RequiredActionsCard.tsx`, the file `C1-9` and `R12` were filed against.
 *
 * ⛔ **The bound was chosen against the NOISE and never checked against the SIGNAL.** Measured both ways:
 *
 * | rule | code welds rejected | of the 8 prose blocks kept |
 * |---|---|---|
 * | `> 2 newlines` | 120 | **0** |
 * | code punctuation | **332** | **8** |
 *
 * ⚠️ And the bound was not even load-bearing: the tree is green with it removed entirely. The 1,809 welds
 * `U2` measured came from `>` being the comparison operator and the tail of `=>` — a property of the
 * CONTENT, which is what this now tests. Prose does not contain `;` `=` `(` `)` `` ` `` or `&&`.
 */
/**
 * ⛔ **JSX TEXT IS PARSED, NOT PATTERN-MATCHED — the fourth attempt, and the first that is not a guess.**
 * [class-1 re-audit 6 `W11`; after `T2`, `T3`, `U2`, `V3`]
 *
 * ⚡ **`V3`'s punctuation rule dropped 240 of 1,871 spans**, and the two commonest prose habits in this
 * app were among them: a parenthetical (`(` 109 · `)` 83) and `&rsquo;` — because **every HTML entity ends
 * in a semicolon**, and this repo has a gate (`lint:apostrophes`) that pushes copy *toward* `&rsquo;`.
 * The two gates worked against each other. Measured, same file, same line, same phrase:
 *
 *     "…handle it with the biller (pay it late, or cancel it)."  + a retired word → GREEN
 *     the same sentence with the parenthetical removed          + a retired word → RED
 *
 * ⛔ **Every previous rule here was chosen against a sample and never measured against the population.**
 * `V3`'s own commit table counted *"of the 8 prose blocks kept: 8"* — the blocks it was looking for, not
 * the population. Three heuristics in a row got this wrong in one direction or the other.
 *
 * ⚡ So the question — *"is this a JSX text node?"* — is answered by the thing that knows: the TypeScript
 * parser, already used by three gates in this directory. **Measured: 3,010 `JsxText` nodes, 225 carrying
 * letters, across 397 files in 1.2 s.** The regex admitted 1,644 spans, most of them code.
 *
 * ⚠️ Entities are decoded before matching, so a phrase is not split by one.
 * ⚠️ The RAW source is parsed, not the stripped text — `stripCommentsOnly` is length-preserving, so the
 * offsets still line up with the caller's `lineMap`, and a JSX text node cannot be inside a comment.
 */
const decodeEntities = (s: string): string => s.replace(/&[a-zA-Z]+;|&#\d+;/g, "'");

function jsxText(raw: string, file: string): { text: string; index: number }[] {
  const out: { text: string; index: number }[] = [];
  const sf = ts.createSourceFile(file, raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (n: ts.Node): void => {
    if (n.kind === ts.SyntaxKind.JsxText) out.push({ text: decodeEntities(n.getText()), index: n.getStart() });
    n.forEachChild(visit);
  };
  sf.forEachChild(visit);
  return out;
}

function copyFragments(text: string, raw = text, file = 'inline.tsx'): { text: string; index: number }[] {
  return [...stringLiterals(text), ...jsxText(raw, file)];
}

/**
 * ⛔ **THE JSX RULE IS SELF-CHECKED, because `V3` is what an unchecked narrowing costs.**
 *
 * Both directions, on synthetic input, every run: the shape `T6` exists for must be IN the population,
 * and a code weld must be OUT. A future narrowing that loses the wrapped phrase reds here by name.
 */
{
  const wrapped = '<Text>\n  your breathing\n  room this month\n</Text>';
  const weld = '<View>{items.filter((x) => x.n > 0).length}</View>';
  /**
   * ⛔ **THE PARENTHETICAL AND THE ENTITY — the two shapes `V3`'s rule silently dropped.** [`W11`]
   * Both are ordinary habits in this app's copy, and the second is one another gate actively pushes
   * toward: `lint:apostrophes` prefers `&rsquo;`, and every HTML entity ends in a semicolon, so the two
   * gates worked against each other — the more `&rsquo;` in a sentence, the less this one could see it.
   */
  const parenthetical = '<Text>handle it with the biller (pay it late), your breathing room stays</Text>';
  const entity = '<Text>your breathing room couldn&rsquo;t be read</Text>';
  const has = (src: string, needle: string): boolean =>
    copyFragments(src).some((f) => f.text.replace(/\s+/g, ' ').includes(needle));
  if (!has(wrapped, 'your breathing room this month')) {
    console.error(
      '\n❌ glossary: a JSX text node WRAPPED between two words is not in the population.\n' +
        '  ⛔ V3 — that is `T6`\'s own motivating case, and a two-line text node carries THREE newlines\n' +
        '  inside the `>…<` match. A line bound rejects the shape it claims to admit.\n',
    );
    process.exit(1);
  }
  for (const [label, src] of [
    ['a sentence containing a PARENTHETICAL', parenthetical],
    ['a sentence containing an HTML ENTITY', entity],
  ] as const) {
    if (!has(src, 'your breathing room')) {
      console.error(
        `\n❌ glossary: ${label} is not in the population.\n` +
          '  ⛔ W11 — V3\'s punctuation rule dropped 240 of 1,871 spans this way, including the two\n' +
          '  commonest prose habits in this app. The population question is answered by the TypeScript\n' +
          '  parser now; a rule that starts guessing at it again reds here.\n',
      );
      process.exit(1);
    }
  }
  if (copyFragments(weld).some((f) => f.text.includes('filter'))) {
    console.error(
      '\n❌ glossary: a code weld is being read as user-facing copy.\n' +
        '  ⛔ U2 — `>` is also the comparison operator and the tail of `=>`, so an unbounded `>…<` opens a\n' +
        '  "text node" that closes on the next `<`. This gate has no cap and no allow-list.\n',
    );
    process.exit(1);
  }
}

const problems: string[] = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    if (EXEMPT.some((e) => file.includes(e))) continue;
    const base = basename(file); // handles either separator — a hand-rolled split lost its backslash twice
    // Core's suites are `testXxx.ts`; the app's are `*.test.ts`. Test NAMES quote retired words on
    // purpose ("exactly at the floor is not a crunch") and are not user-facing copy.
    if (base.endsWith('.test.ts') || /^test[A-Z]/.test(base)) continue;
    const rawSrc = readFileSync(file, 'utf8');
    const code = stripComments(rawSrc);
    const map = lineMap(code);
    for (const frag of copyFragments(code, rawSrc, file)) {
      const ln = map.lineAt(frag.index);
      // ⚠️ Whitespace inside a fragment is collapsed before matching: a phrase wrapped across lines is one
      // phrase to the reader, and the patterns describe what the reader sees.
      const flat = frag.text.replace(/\s+/g, ' ');
      for (const { pattern, word, use } of RETIRED) {
        if (pattern.test(flat)) problems.push(`  ${rel}:${ln}  "${word}" → use ${use}\n      ${flat.trim().slice(0, 90)}`);
      }
      if (STATE_WORDS.test(flat)) {
        problems.push(`  ${rel}:${ln}  "Crunch" → use GUARDIAN_STATE_LABEL (T4.5 / audit L1-7)\n      ${flat.trim().slice(0, 90)}`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`\n❌ glossary: ${problems.length} retired word(s) back in user-facing copy.\n`);
  console.error(problems.join('\n'));
  console.error('\n  The words live in `@core/copy/vocabulary`. If a use is genuinely not copy,');
  console.error('  move it out of a string literal or add the file to EXEMPT with a reason.\n');
  process.exit(1);
}
// ⛔ GAP-8 — assert the gate actually READ something before it is allowed to report a pass.
const observedScan = assertScanFloor(SCAN_GATE);
console.log(`✅ glossary: no retired words in copy (${RETIRED.length + 1} banned).${scanNote(SCAN_GATE, observedScan)}`);
