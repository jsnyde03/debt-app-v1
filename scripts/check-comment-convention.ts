/**
 * Comment convention guard — the two halves that are actually decidable.
 *
 * [D17] (Jason, 2026-08-04). The original convention banned all history in comments: "no history, no
 * post-mortem, no previous beliefs." It was adopted in one audit round and violated 43 times immediately,
 * by the round that adopted it — which is evidence that a blanket ban fights how this codebase is
 * written, not that everyone was careless. The comments here earn their keep by explaining WHY, and the
 * why is frequently a defect somebody already paid for. So the rule is narrowed to what is indefensible:
 *
 *  1. **No meta-commentary about which earlier COMMENT was wrong.** Rationale about the CODE's past is
 *     fine and often load-bearing ("this used to drop the scrim entirely, which left every control
 *     live"). Commentary about the documentation's past is not: it decays with nothing edited, it is
 *     unverifiable by construction, and correcting a false comment means DELETING it, not annotating it.
 *  2. **No counts of code.** "six call sites", "all five published values", "which today is two" — a
 *     count is an assertion that goes stale the moment anyone adds a member, and this feature shipped
 *     four wrong counts, each written while correcting the previous one. Say what the rule is; let a
 *     query say how many members it has.
 *
 * Explicitly PERMITTED: "used to", "round N", "was tried and removed", and any other past-tense rationale
 * about the code's behaviour. That is the house style and it stays.
 *
 * Deliberately approximate. Neither half is decidable, and this catches the dominant written forms rather
 * than the class — stated plainly so nobody reads a green run as proof.
 *
 * Usage: tsx scripts/check-comment-convention.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOTS = [join(REPO_ROOT, 'apps', 'rn', 'src'), join(REPO_ROOT, 'apps', 'rn', 'tests')];
const EXTS = new Set(['.ts', '.tsx']);

/** Half 1 — the comment talking about a comment. */
const META = [
  /\bthe comment (above|below|here)\b[^.]{0,60}\b(claimed|said|was wrong|is wrong)/i,
  /\bthis (comment|note|paragraph|sentence)\b[^.]{0,60}\b(used to|previously|was wrong|had been wrong)/i,
  /\b(previously|wrongly|falsely) (claimed|stated|documented|recorded)\b/i,
  /\bthe correction (had )?itself\b/i,
  /\b(mis)?count (that|which) was written\b/i,
  /\bread this before trusting it\b/i,
  /\bthe first version of this (test|comment|note)\b/i,
  /\bthis (said|claimed)\b/i,
  /\b(this|the) (header|comment|note|paragraph|version) (that |which )?(claimed|said (otherwise|so))\b/i,
  /\bhow the claim survived\b/i,
  /\bdidn't say what the comment said\b/i,
];

/**
 * Half 2 — a count of code MEMBERS: the form that decays the instant somebody adds one.
 *
 * Deliberately narrow. "the two shells" (Capacitor and RN) and "all three sheet shells — FormSheet,
 * AnimatedSheet, PaydayCaptureSheet" are stable architectural facts, and the second enumerates itself;
 * flagging those trains people to ignore the check. What bit repeatedly was counting the members of a
 * class the author had just enumerated by hand — "six call sites", "all FIVE published values".
 */
const COUNTS = [
  /\b(all|every|both|only|the|at|is|to) (two|three|four|five|six|seven|eight|nine|ten|twelve|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|TWELVE) (call ?sites?|members?|published values?|instances?|fences?)\b/,
  /\b(two|three|four|five|six|seven|eight|nine|ten|twelve) (call ?sites?|published values?)\b/i,
  /\bwhich today is (two|three|four|five|six|seven|eight)\b/i,
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry === 'node_modules') continue;
      walk(p, out);
    } else if (EXTS.has(extname(p))) out.push(p);
  }
  return out;
}

/** Only COMMENT text is examined — a string literal that happens to say "five sites" is not the target. */
function commentLines(src: string): (string | null)[] {
  const out: (string | null)[] = [];
  let inBlock = false;
  for (const line of src.split('\n')) {
    const t = line.trim();
    if (inBlock) {
      out.push(t);
      if (t.includes('*/')) inBlock = false;
      continue;
    }
    // `/*` ANYWHERE on the line, not just at its start. JSX comments are written `{/* … */}`, and they
    // are the dominant comment form in the files this rule exists for — a scanner that only recognised a
    // line-initial `/*` could not see any of them.
    const bi = line.indexOf('/*');
    if (bi >= 0) {
      out.push(line.slice(bi));
      if (!line.slice(bi).includes('*/')) inBlock = true;
      continue;
    }
    const idx = line.indexOf('//');
    out.push(idx >= 0 && !line.slice(0, idx).includes('http') ? line.slice(idx) : null);
  }
  return out;
}

const hits: string[] = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    commentLines(readFileSync(file, 'utf8')).forEach((line, i) => {
      if (line === null) return;
      if (META.some((r) => r.test(line))) hits.push(`${rel}:${i + 1}  [meta-comment]  ${line.slice(0, 100)}`);
      else if (COUNTS.some((r) => r.test(line))) hits.push(`${rel}:${i + 1}  [count-of-code]  ${line.slice(0, 100)}`);
    });
  }
}

if (hits.length > 0) {
  console.error('\n❌ Comment convention ([D17]):\n');
  hits.forEach((h) => console.error(`  ${h}`));
  console.error(
    '\n  [meta-comment]   correcting a false comment means DELETING it, not annotating it.' +
      '\n  [count-of-code]  state the rule; let a query count the members.' +
      '\n  (Rationale about the CODE\'s past — "used to", "round N" — is permitted and encouraged.)\n',
  );
  process.exit(1);
}
console.log('✅ comment convention: no meta-commentary, no counts of code.');
