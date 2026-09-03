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
import { stripCommentsOnly } from './lib/stripCode';
import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';

/** GAP-8 — this gate's key in scripts/gate-scan-floors.json. */
const SCAN_GATE = 'glossary';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, basename } from 'node:path';

const SEP = /[\/]/;
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
function copyFragments(text: string): { text: string; index: number }[] {
  const out: { text: string; index: number }[] = [];
  for (const re of [/'[^']*'/g, /"[^"]*"/g, /`[^`]*`/g, />[^<>{}]{2,}</g]) {
    for (const m of text.matchAll(re)) out.push({ text: m[0], index: m.index });
  }
  return out;
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
    const code = stripComments(readFileSync(file, 'utf8'));
    const map = lineMap(code);
    for (const frag of copyFragments(code)) {
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
