/**
 * ⛔ **CODE WITH ITS COMMENTS DROPPED AND ITS CONCATENATION JUNCTIONS WELDED — one producer.**
 * [S1.13.7.12.6 · class-1 re-audit 3 `N-7`, re-audit 4 `U11`; pass-7 `C1-9`, `R12`]
 *
 * ⚡ **Two gates need the same fact and had two answers to it.** `unreadInputsCopy.test.ts` asks *"does
 * this sentence reach the reader?"* and `check-finding-guards.ts` asks *"is this assertion still in the
 * file?"* — and both are defeated by the same thing: **a formatter putting one string on two lines.**
 * `unreadInputsCopy` paid for that four times (`C1-9`, `R12`, `N-7` twice) and arrived here;
 * `check-finding-guards` was still asking per physical line, so wrapping a guard's token made it report
 * `the guard is gone` **over an intact assertion** — measured on `S1P1-B1-OWNER`, `267 → 266` guarded
 * with the assertion untouched, in the gate that decides whether every finding in the audit is closed.
 *
 * ⚠️ **THE READER NEVER SEES A JUNCTION.** `'a ' + 'b'`, `{'a'}{' '}{'b'}`, `` `a${' '}b` ``, a line
 * break, a named `SEP` — all render as one sentence, so a matcher has to read them as one sentence.
 * Over-joining is the safe direction: it welds two genuinely separate literals and reads as NOISY. The
 * other direction is BLIND, and blind is what shipped.
 *
 * ⚠️ **Order matters, and the first cut got it wrong:** `{' '}` is a substring of `${' '}`, so running
 * the JSX rule first left `again$ above`. The interpolation is consumed first, and a fixture holds it.
 *
 * ⛔ **`lineAt` exists because joining destroys line numbers and a hit still has to name a place.** Every
 * character carries the source line it came from, so a wrapped match reports the line it STARTS on.
 */

import { stripCommentsOnly } from './stripCode';

const NEWLINE = String.fromCharCode(10);

export interface JoinedCode {
  /** comment lines dropped, every remaining line trimmed and joined, junctions welded */
  text: string;
  /** 1-based source line of `text[index]`; clamps to the last known line past the end */
  lineAt: (index: number) => number;
}

interface Ch {
  c: string;
  l: number;
}

/** Apply one global regex, carrying each replacement character's line from the match's first character. */
function weld(chars: Ch[], re: RegExp, to: string): Ch[] {
  const text = chars.map((x) => x.c).join('');
  const out: Ch[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    for (let i = last; i < at; i++) out.push(chars[i]);
    const l = chars[at]?.l ?? 1;
    for (let k = 0; k < to.length; k++) out.push({ c: to[k], l });
    last = at + m[0].length;
  }
  for (let i = last; i < chars.length; i++) out.push(chars[i]);
  return out;
}

/**
 * ⚠️ **Every junction between two literals, not just the one a finding exhibited.** `R12`'s mechanism
 * paragraph listed three, the first fix normalised two, and the third then shipped the banned sentence
 * past 33 green assertions — the same count as the clean run.
 *
 * ⚠️ A NAMED separator collapses to a SPACE rather than to nothing: its value is unknown here, and
 * over-joining reads as one sentence while under-joining misses the refusal.
 */
const JUNCTIONS: [RegExp, string][] = [
  [/\$\{\s*(['"`])\s*\1\s*\}/g, ' '],
  [/\{\s*(['"`])\s*\1\s*\}/g, ' '],
  [/(['"`])\s*\+\s*[A-Za-z_$][\w$]*\s*\+\s*(['"`])/g, ' '],
  [/['"`]\s*\}\s*\{\s*['"`]/g, ' '],
  [/['"`]\s*\+\s*['"`]/g, ''],
  [/[ \t]+/g, ' '],
];

function build(source: string, dropComments: boolean): JoinedCode {
  /**
   * ⛔ **COMMENTS GO THROUGH THE REAL SCANNER, NOT A LINE-PREFIX GUESS.** [re-audit 5 `V7`, major]
   *
   * ⚡ The predicate here decided *"am I inside a block comment"* from each line's FIRST CHARACTERS, so a
   * `/*` opening after any other token on its line was never seen, `inBlock` stayed false, and the whole
   * comment body read as CODE. Measured on `S1-M9-GUARDIAN`: delete the guard, re-introduce its token
   * inside `const __x = 1; /* opens a block mid-line ... *` + `/`, and `lint:finding-guards` prints
   * **`✅ 279 of 280 findings carry a standing guard`** over a guard that is gone. The ordinary-block
   * control reds correctly, so the comment-vs-code distinction was right for every spelling but one.
   *
   * ⛔ **And this file's own header claimed the opposite** - *"BLOCK-COMMENT STATE IS TRACKED, not
   * guessed from the line's first characters."* It was guessed from the line's first characters.
   *
   * ⚠️ `stripCommentsOnly` is length- and line-count-preserving, so `lineAt` is unaffected: a blanked
   * comment line simply trims to nothing and contributes its separator. It also removes the reason the old
   * predicate existed - a string literal holding `/*` broke the first cut, and a scanner knows the
   * difference. **One producer, one level down**, which is the argument that created this file.
   */
  const scanned = dropComments ? stripCommentsOnly(source) : source;
  let chars: Ch[] = [];
  const lines = scanned.split(NEWLINE);
  for (let n = 0; n < lines.length; n++) {
    const raw = lines[n];
    const l = n + 1;
    // ⚠️ Indexed by CODE UNIT, not `for...of`, which walks code POINTS. A single emoji then made
    // `chars` shorter than the string it renders, every later regex index pointed one place left, and the
    // welds ate real characters - `alignItems` came out `lignItems`. Measured on CashRunwayChart.tsx.
    const t = raw.trim();
    for (let k = 0; k < t.length; k++) chars.push({ c: t[k], l });
    // ⚠️ The separator is a SPACE, so two lines never weld into one word. `[ \t]+` collapses the run.
    chars.push({ c: ' ', l });
  }
  for (const [re, to] of JUNCTIONS) chars = weld(chars, re, to);
  return {
    text: chars.map((x) => x.c).join(''),
    lineAt: (index: number) => chars[Math.min(Math.max(index, 0), chars.length - 1)]?.l ?? 1,
  };
}

export function joinCodeLines(source: string): JoinedCode {
  return build(source, true);
}

/**
 * The same welding with COMMENTS KEPT - for the prior question *"is this token anywhere in the file"*,
 * which is asked before *"is it only in a comment"* and must not silently answer the second one.
 */
export function joinAllLines(source: string): JoinedCode {
  return build(source, false);
}

/**
 * ⛔ **NORMALISE THE NEEDLE WITH THE SAME PRODUCER AS THE HAYSTACK, or the fix is a regression.**
 * [class-1 re-audit 4 `U11`]
 *
 * ⚡ **Measured the moment `check-finding-guards` first read joined text: `268 → 260` guarded.** Eight
 * registry tokens carry their own INDENTATION — `"  priorityGoalIsCapped,"`, chosen that way to make a
 * bare identifier distinctive — and the haystack had been trimmed while the needle had not. Every one
 * reported *"appears ONLY IN A COMMENT"*, which is the noisy direction of the very defect being fixed.
 *
 * ⚠️ Comments are NOT dropped here: a fragment is not a file, and a token legitimately beginning with
 * `*` or `//` would otherwise normalise to nothing and match everywhere.
 */
export function normaliseFragment(fragment: string): string {
  return build(fragment, false).text.trim();
}

/** The text alone, for callers that only ask *"does this reach the reader?"*. */
export const codeText = (source: string): string => joinCodeLines(source).text;
