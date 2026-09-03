/**
 * ⛔ **A MATCHER LOCKED TO A LINE IS A MATCHER A FORMATTER CAN DEFEAT.**
 * [S1.13.7.12.6 class 1 · pass-7 `D1-3` `D1-4` `D1-6` `D1-7` `D1-8` `D1-11`]
 *
 * Six gates matched their own defect **per physical line**, so a call Prettier had wrapped walked past
 * every one of them. `check-cap-literals` found this escape in pass 5 (`D5-9`), fixed it, and carries a
 * proven guard for it — and every gate written afterwards kept the per-line split, because the lesson
 * lived in one file's docblock instead of in the helper they all import.
 *
 * ## ⛔ THIS FILE USED TO DO MUCH MORE, AND TWO RE-AUDITS MEASURED THAT AS THE PROBLEM
 *
 * v1 **joined** physical lines. v2 **flattened** continuation newlines in place. Both were wrong, and the
 * second re-audit killed the whole approach with one measurement:
 *
 * ⚡ **`N-1` — with flattening reduced to a no-op, three of the four gates still caught their wrapped
 * plants, and all four gates' live counts were UNCHANGED.** The flattening was doing essentially nothing:
 * once matching moved off a per-line loop to `matchAll` over the whole file, the patterns already crossed
 * newlines on their own. What remained was pure risk surface, and it was charged:
 *
 * | | |
 * |---|---|
 * | `R4` | flattening a JSX statement made two individually correct statements read as one defect — **still open at `MAX_RUN = 8`**, the window having shrunk without the false positive going away |
 * | `N-9` | `MAX_RUN = 8` was a live blind window — **1,026 call expressions already span ≥ 9 lines**, so a wrapped collapse in one escaped entirely |
 * | `R3` `R5` `R7` | line attribution, blanked `${…}` interpolations, and comments supplying a key — every one a consequence of rewriting the text before matching |
 *
 * ⛔ **So nothing rewrites the source any more.** A gate matches over its own stripped text with a pattern
 * bounded by `;` and `{}` — the statement, which is the unit the defect actually lives in — and asks this
 * file for one thing only: **which source line an offset falls on.** That is the entire remaining API.
 *
 * ⚠️ **What this costs, stated:** a defect spread across two statements is not matched, and neither is one
 * written across a brace. Both are correct refusals — a pattern that crosses either is describing code
 * nobody wrote, which is exactly what `R4` measured.
 */

/** Maps offsets in a source string to 1-based line numbers. Built once per file. */
export interface LineMap {
  /** 1-based source line containing `index`. */
  lineAt(index: number): number;
}

/**
 * Build a {@link LineMap} for `src`.
 *
 * ⛔ **The source is NOT modified, and that is the point** — an offset into the text a gate matched is the
 * same offset here, so a hit reports the line it is really on. `R3` measured what the alternative cost:
 * **17 of 94 live rounding sites printed the wrong `path:line`, worst by 39 lines.**
 */
export function lineMap(src: string): LineMap {
  const starts: number[] = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return {
    lineAt(index: number): number {
      let lo = 0;
      let hi = starts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= index) lo = mid;
        else hi = mid - 1;
      }
      return lo + 1;
    },
  };
}

/**
 * ⛔ **THE BOUND EVERY WRAP-SENSITIVE PATTERN USES, so it is written once rather than re-derived per gate.**
 *
 * A defect of this class lives inside ONE statement. `;` ends a statement and `{`/`}` open or close a block
 * or an object, so a pattern that may not cross them can wrap across as many lines as Prettier likes and
 * still cannot bridge two unrelated pieces of code. ⚠️ `[^\n]` — what these gates used before — is the one
 * bound that is wrong, because a newline is exactly what a formatter is free to insert.
 */
export const WITHIN_STATEMENT = '[^;{}]*?';
