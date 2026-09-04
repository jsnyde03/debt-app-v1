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
import { stripCommentsAndStrings } from './stripCode';

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
 * ⛔ **A CALL IS FOUND BY BALANCING ITS PARENTHESES, NOT BY A CHARACTER CLASS.**
 * [class-1 re-audit 3 · `T2` `T3` `T4` `T8`]
 *
 * Three bounds have now been tried on these patterns and all three were heuristics about *where a call
 * probably ends*:
 *
 * | bound | measured failure |
 * |---|---|
 * | `[^\n]` | the original class — a formatter's line break defeats it |
 * | joined / flattened lines | `R3` wrong line numbers · `R4` two correct statements read as one defect |
 * | `[^;{}]` | `T2` does not stop at a **comma**, so sibling arguments merge · `T3` stops at a **brace**, so an object argument or a `${…}` interpolation hides the call — **which re-opened `R5` in the round that certified it closed** |
 *
 * ⚡ **A call's extent is not a guess.** `(` opens it and the matching `)` closes it, and scanning for that
 * is exact — immune to line breaks, commas, braces and nesting alike. ⛔ **`WITHIN_STATEMENT` was the
 * fourth heuristic and it had ZERO consumers** (`T4`): it could be replaced with a non-regex and every gate
 * stayed green. This replaces it with something that does the work.
 *
 * ⚠️ **Depth is counted on STRING-BLANKED text** so a parenthesis inside a string literal cannot close a
 * call — the offsets are identical because `stripCode` preserves length.
 *
 * @param code the text the caller matches against (comments already blanked by the caller)
 * @param callee matches the callee AND its opening `(` — the `(` must be the last thing it consumes
 */
export function findCalls(code: string, callee: RegExp): { index: number; argsEnd: number; args: string }[] {
  const structure = stripCommentsAndStrings(code);
  const out: { index: number; argsEnd: number; args: string }[] = [];
  const re = new RegExp(callee.source, callee.flags.includes('g') ? callee.flags : `${callee.flags}g`);
  for (const m of code.matchAll(re)) {
    const open = m.index + m[0].length - 1; // the `(` itself
    if (structure[open] !== '(') continue;
    let depth = 0;
    let i = open;
    for (; i < structure.length; i++) {
      if (structure[i] === '(') depth++;
      else if (structure[i] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) continue; // unbalanced — do not guess
    out.push({ index: m.index, argsEnd: i, args: code.slice(open + 1, i) });
  }
  return out;
}

/**
 * The innermost call enclosing `index`, or `null`. Used to ask *"is this comparison inside a `.find(…)`?"*
 * without requiring the two to share a line — `T8`: a block-bodied predicate put a `{` between them and the
 * previous bound treated that as the end of the world.
 */
export function enclosingCall(code: string, index: number): { callee: string; start: number } | null {
  const structure = stripCommentsAndStrings(code);
  let depth = 0;
  for (let i = index; i >= 0; i--) {
    if (structure[i] === ')') depth++;
    else if (structure[i] === '(') {
      if (depth === 0) {
        const before = code.slice(Math.max(0, i - 60), i);
        const name = /([A-Za-z_$][\w$]*)\s*$/.exec(before)?.[1] ?? '';
        return { callee: name, start: i };
      }
      depth--;
    }
  }
  return null;
}

/**
 * ⛔ **THE TEXT AFTER A CALL, LOOKING THROUGH ANY *GROUPING* PARENTHESES THAT CLOSE AROUND IT.**
 * [class-1 re-audit 5 `V1`]
 *
 * ⚡ `(parseAmountField(amount)) ?? 0` was invisible to `check-amount-collapse`: `findCalls` returns the
 * INNER `)`, and the gate's `AFTER` regex is anchored, so it saw `) ?? 0` and refused to match. One
 * ordinary pair of parentheses — the kind a formatter or a type assertion leaves behind — and the whole
 * `D1-3` family walks past.
 *
 * ⚠️ **A GROUPING paren only, and the distinction is the whole reason this is a walk and not `[\s)]*`.**
 * `wrapper(parse(x)) ?? 0` collapses *wrapper's* result, not the parsed amount, and reporting it would be
 * the noisy direction — which these gates have no escape route for: cap 0, no allow-list. So each `)` is
 * matched back to its `(`, and the walk stops the moment that `(` turns out to belong to a callee.
 */
export function afterEnclosingGroups(code: string, argsEnd: number): string {
  const structure = stripCommentsAndStrings(code);
  let i = argsEnd + 1;
  for (;;) {
    while (i < structure.length && /\s/.test(structure[i])) i++;
    /**
     * ⛔ **POSTFIX TYPE SYNTAX IS NOT PART OF THE VALUE.** [class-1 re-audit 6 `W2`]
     *
     * ⚡ `parseAmountField(a)! ?? 0` is a **one-character un-fix**: the `!` sits between the call and the
     * `??`, `AFTER` is anchored, and the collapse walks past. `as number` and `satisfies` do the same.
     * ⛔ **Third instance in this one matcher** — `T2`, then `V1`'s `?.(`/`<T>` widening, now this — which
     * is Law II: *an enumerated list becomes the list somebody orders from.* The pin on the call count in
     * `check-amount-collapse` is the answer to the NEXT spelling; this is the answer to these three.
     */
    const postfix = /^(?:!|\bas\s+[\w$.<>[\]|\s]+?|\bsatisfies\s+[\w$.<>[\]|\s]+?)(?=\s*(?:\?\?|\/|\)|,|;|$))/.exec(
      structure.slice(i),
    );
    if (postfix) {
      i += postfix[0].length;
      continue;
    }
    if (structure[i] !== ')') break;
    let depth = 0;
    let j = i;
    for (; j >= 0; j--) {
      if (structure[j] === ')') depth++;
      else if (structure[j] === '(') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (j < 0) break; // unbalanced — do not guess
    const before = /\S$/.exec(structure.slice(0, j))?.[0] ?? '';
    // ⛔ `foo(`, `x[0](`, `f()(` — an identifier, `]` or `)` before the paren means it is a CALL.
    if (/[\w$\])]/.test(before)) break;
    i++;
  }
  return code.slice(i);
}
