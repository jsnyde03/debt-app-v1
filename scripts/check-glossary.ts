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
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, basename } from 'node:path';

const SEP = /[\/]/;
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
 * Strip comments so prose about a retired word never trips the gate. Deliberately simple: it blanks
 * `//` to end-of-line and `/* … *\/` spans. It does not parse strings-containing-slashes perfectly, and
 * that is the safe direction — over-stripping can only cause a MISS, never a false alarm, and a false
 * alarm is what gets a checker disabled.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length));
}

/** Quoted literals + JSX text nodes — the places a user can actually read a word. */
function copyFragments(line: string): string[] {
  const out: string[] = [];
  for (const re of [/'[^']*'/g, /"[^"]*"/g, /`[^`]*`/g, />[^<>{}]{2,}</g]) {
    const found = line.match(re);
    if (found) out.push(...found);
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
    const lines = stripComments(readFileSync(file, 'utf8')).split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const frag of copyFragments(line)) {
        for (const { pattern, word, use } of RETIRED) {
          if (pattern.test(frag)) problems.push(`  ${rel}:${i + 1}  "${word}" → use ${use}\n      ${frag.trim().slice(0, 90)}`);
        }
        if (STATE_WORDS.test(frag)) {
          problems.push(`  ${rel}:${i + 1}  "Crunch" → use GUARDIAN_STATE_LABEL (T4.5 / audit L1-7)\n      ${frag.trim().slice(0, 90)}`);
        }
      }
    });
  }
}

if (problems.length > 0) {
  console.error(`\n❌ glossary: ${problems.length} retired word(s) back in user-facing copy.\n`);
  console.error(problems.join('\n'));
  console.error('\n  The words live in `@core/copy/vocabulary`. If a use is genuinely not copy,');
  console.error('  move it out of a string literal or add the file to EXEMPT with a reason.\n');
  process.exit(1);
}
console.log(`✅ glossary: no retired words in copy (${RETIRED.length + 1} banned).`);
