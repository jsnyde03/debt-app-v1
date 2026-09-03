/**
 * ⛔ **A MATCHER LOCKED TO A LINE IS A MATCHER A FORMATTER CAN DEFEAT.**
 * [S1.13.7.12.6 class 1 · pass-7 `D1-3` `D1-4` `D1-6` `D1-7` `D1-8` `D1-11`]
 *
 * Six gates matched their own defect **per physical line**, so a call Prettier had wrapped walked past
 * every one of them. `check-cap-literals` found this escape in pass 5 (`D5-9`), fixed it, and carries a
 * proven guard for it — and every gate written afterwards kept the per-line split, because the lesson
 * lived in one file's docblock instead of in the helper they all import. **This is that helper.**
 *
 * ## ⛔ THE FIRST DESIGN WAS JOINING, AND THE CLASS-1 RE-AUDIT MEASURED FIVE DEFECTS IN IT
 *
 * v1 returned *joined* logical lines — physical lines glued with a space. A fresh auditor measured what
 * that cost, and every one of these is why the API below is different:
 *
 * | | |
 * |---|---|
 * | `R3` | a hit was reported at the JOIN's first line, so **17 of 94 live rounding sites printed the wrong `path:line`** — worst by 39 lines |
 * | `R4` | joining **deletes the newline that bounded `[^\n]*?`**, so two unrelated CORRECT statements five lines apart were reported as one collapse — the exact false positive `D1-3`'s remedy warned about |
 * | `R2` | every JSX `return (` and every return-type-annotated signature joined, so runs reached the cap in the live tree |
 * | `R5` | `blankStrings` blanks template-literal **interpolations, which are code** — a collapse inside `${…}` was caught BEFORE the fix and invisible after |
 * | `R7` | with `keepComments`, a comment could supply the aging key for a literal on a later line |
 *
 * ⚡ **So this does not join. It FLATTENS IN PLACE**: a newline *inside* a wrapped statement becomes a
 * single space, and every other newline survives. The result is **the same length as the input**, which is
 * what makes the rest correct — an offset in the flattened text is the same offset in the source, so
 * {@link Flattened.lineAt} returns the line of the **match**, not of the statement it started in, and a
 * statement-ending newline still bounds a `[^\n]*?` pattern exactly as it did before.
 *
 * ⚠️ **NOT modelled, named rather than implied:** a statement continued by an unterminated template
 * literal spanning lines; JSX children across lines with no bracket; and ASI hazards where a line that
 * *could* end a statement is continued by a leading `(` or `[`. The first two under-flatten and the third
 * over-flattens by one line.
 *
 * ⚠️ **The failure directions are NOT symmetric.** Under-flattening makes a gate **blind** — the wrapped
 * defect escapes, which is the bug this exists to fix. Over-flattening makes it **noisy** — a false hit
 * someone reads and dismisses. Blind is worse, so ambiguity resolves toward flattening — **bounded by
 * {@link MAX_RUN}, because `R4` measured that unbounded over-flattening is not merely noisy: it invents
 * defects in correct code.**
 */
import { stripCommentsAndStrings, stripCommentsOnly } from './stripCode';

export interface Flattened {
  /** Same length as the source. Continuation newlines are spaces; every other newline survives. */
  text: string;
  /** 1-based source line for an offset into {@link text} — the line of the MATCH. */
  lineAt(index: number): number;
}

/**
 * ⛔ **A BOUND ON HOW FAR A STATEMENT MAY BE FLATTENED, and it is a correctness bound, not a runaway stop.**
 *
 * ⚡ `R2`/`R4`: a JSX `return (` is genuinely ONE statement running hundreds of lines, so flattening all of
 * it lets a pattern match across two unrelated props and report a defect nobody wrote. **Real wrapped calls
 * are 2–5 physical lines** — the four plants this class proves are 3, 3, 3 and 4 — so a small bound keeps
 * every genuine escape and refuses the JSX-sized runs outright.
 *
 * ⚠️ **What it costs, stated:** a wrapped call spread over more than `MAX_RUN` lines is not detected. That
 * is the blind direction, and it is accepted deliberately here because the alternative measured worse — a
 * false positive on correct code trains people to exempt-and-move-on.
 */
const MAX_RUN = 8;

/** Trailing tokens that cannot end a statement, so the next physical line continues it. */
const CONTINUES = /(?:[,([?:=+\-*/%&|]|=>|\?\?|&&|\|\||\.)\s*$/;

/**
 * ⛔ **A `{` OPENS A BODY ONLY WHEN IT FOLLOWS `)`, `=>`, OR A BLOCK KEYWORD.** Breaking on *any* trailing
 * brace silently un-fixed `D1-8`, whose escape is a wrapped `import { … } from …`.
 */
const OPENS_BODY = /(?:\)|=>|\belse\b|\btry\b|\bdo\b|\bfinally\b)\s*\{$/;

/** An import/export is the one statement whose braces continue it rather than opening a body. */
const IS_IMPORT = /^\s*(?:import|export)\b/;

/**
 * Flatten the continuation newlines of `src`.
 *
 * @param blankStrings blank string CONTENTS as well as comments.
 * ⛔ **Default `false`, and `R5` is why.** `stripCommentsAndStrings` blanks the inside of a template
 * literal — including `${…}` interpolations, **which are code**. A gate that sets this true goes blind to
 * every banned form written inside an interpolation, which is a regression the v1 callers shipped.
 *
 * ⛔ **There is deliberately NO `keepComments` option.** v1 had one, for `check-fixture-dates`'
 * `fixture-date-ok:` exemptions — and `R6`/`R7` measured what it cost: an exemption comment silenced every
 * literal in the same flattened statement, and a comment could supply the aging key for a literal on a
 * later line. A caller that needs its comments reads them **per physical line, from the source**.
 */
export function flattenContinuations(
  src: string,
  { blankStrings = false }: { blankStrings?: boolean } = {},
): Flattened {
  const structure = stripCommentsAndStrings(src).split('\n');
  const visibleSrc = blankStrings ? stripCommentsAndStrings(src) : stripCommentsOnly(src);

  // Offsets of each line start in the ORIGINAL text — identical in the flattened text, by construction.
  const lineStart: number[] = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') lineStart.push(i + 1);

  const chars = visibleSrc.split('');
  let i = 0;
  while (i < structure.length - 1) {
    const runStart = i;
    let depth = 0;
    const isImport = IS_IMPORT.test(structure[i] ?? '');
    while (i < structure.length - 1) {
      depth += bracketDelta(structure[i] ?? '', isImport);
      const open = depth > 0 || CONTINUES.test(structure[i] ?? '');
      const opensBody = OPENS_BODY.test((structure[i] ?? '').trimEnd());
      if (!open || opensBody || i - runStart + 1 >= MAX_RUN) break;
      // The newline ENDING line i is inside a statement — flatten it, preserving length.
      const nl = lineStart[i + 1] - 1;
      if (nl >= 0 && chars[nl] === '\n') chars[nl] = ' ';
      // ⚠️ CRLF: blank the `\r` too, or the pattern still meets a control character mid-statement.
      if (nl - 1 >= 0 && chars[nl - 1] === '\r') chars[nl - 1] = ' ';
      i++;
    }
    i++;
  }

  const text = chars.join('');
  return {
    text,
    lineAt(index: number): number {
      let lo = 0;
      let hi = lineStart.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (lineStart[mid] <= index) lo = mid;
        else hi = mid - 1;
      }
      return lo + 1;
    },
  };
}

/**
 * Net bracket change on one line of STRING-BLANKED text.
 *
 * ⛔ **`{` and `}` count ONLY inside an import or export.** A brace otherwise opens a block or a literal
 * whose contents are statements of their own; counting it made the first draft swallow whole functions.
 */
function bracketDelta(line: string, countBraces = false): number {
  let d = 0;
  for (const c of line) {
    if (c === '(' || c === '[' || (countBraces && c === '{')) d++;
    else if (c === ')' || c === ']' || (countBraces && c === '}')) d--;
  }
  return d;
}
