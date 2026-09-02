/**
 * ⛔ **A MATCHER LOCKED TO A LINE IS A MATCHER A FORMATTER CAN DEFEAT.**
 * [S1.13.7.12.6 class 1 · pass-7 `D1-3` `D1-4` `D1-6` `D1-7` `D1-8` `D1-9` `D1-11` `C1-9` `C2-9`]
 *
 * Six gates matched their own defect **per physical line**, so a call Prettier had wrapped walked past
 * every one of them. The next instance of the defect then arrives as a **reflow** rather than as an edit
 * anyone reviews.
 *
 * ⚡ **This is not a new lesson in this repo — it is the SIXTH time.** `check-cap-literals.ts` found the
 * escape (pass-5 `D5-9`, a derived cap wrapped onto two lines leaving the population while the gate
 * printed a smaller count beside a ✅), fixed it by matching over the whole file, and carries a proven
 * guard for it. ⛔ **And every gate written AFTERWARDS kept the per-line split**, because the lesson lived
 * in one file's docblock instead of in the helper they all import. **That is what this file exists to
 * change: the knowledge moves from prose into the shared mechanism.**
 *
 * ⚠️ **Why not simply `matchAll` over the whole file, as `check-cap-literals` does?** Because a pattern
 * that may cross newlines can then span *unrelated statements* — `[\s\S]*?` between two tokens will
 * happily bridge fifty lines and report a defect nobody wrote. Joining by **bracket depth** bounds the
 * span to one statement, which is the unit the defect actually lives in.
 *
 * ## What this models, exactly
 *
 * A **logical line** is one physical line plus every continuation of it, where a continuation is either an
 * unclosed `(`/`[` or a trailing operator that cannot end a statement. It ENDS at a `{` that opens a body,
 * because a body's contents are statements of their own. Emitted joined by a single space, tagged with the
 * **first** physical line number, so a hit still reports the right `path:line`.
 *
 * ⛔ **Bracket depth is measured on the STRING-BLANKED text and never on the visible text.** A `(` inside
 * a string literal is not a bracket, and this is exactly the class of error the scanner in
 * [`stripCode`](./stripCode.ts) was written for. This relies on `stripCode`'s stated guarantee that line
 * count and every line's length are preserved, so an offset in one variant is the same offset in the
 * other — asserted in the self-test rather than assumed.
 *
 * ⚠️ **NOT modelled, named rather than implied:** a statement continued by an unterminated template
 * literal spanning lines *(the literal's own newlines are real, and the text inside it is not code)*;
 * JSX children across lines with no bracket; and ASI hazards where a line that *could* end a statement
 * is nonetheless continued by a leading `(` or `[` on the next line. The first two under-join and the
 * third over-joins by one line.
 *
 * ⚠️ **The failure directions are NOT symmetric, and every ambiguous call resolves the same way.**
 * Under-joining makes a gate **blind** — the wrapped defect escapes, which is the bug this file exists to
 * fix. Over-joining makes it **noisy** — a false hit someone reads and dismisses. **Blind is worse**, so
 * ambiguity resolves toward joining.
 *
 */
import { stripCommentsAndStrings, stripCommentsOnly } from './stripCode';

export interface LogicalLine {
  /** 1-based physical line where this logical line STARTS — what a hit reports. */
  line: number;
  /** The joined text, single-spaced at the joins. */
  text: string;
  /** How many physical lines were joined. `1` means it was never wrapped. */
  span: number;
}

/**
 * ⛔ **A RUNAWAY STOP, NOT A TUNING DIAL** — an unbalanced `(` this cannot parse would otherwise swallow
 * the rest of the file and report every later defect at one line number.
 *
 * ⚡ **200 is derived, not chosen.** Measured uncapped over the 695 tracked `.ts`/`.tsx` files: the widest
 * GENUINE join is **125** — `scripts/run-gates.ts:32`, the `GATES` array, which is one array literal and
 * correct to join. Only **11** joins exceed 40 and **1** exceeds 100. ⛔ **The first draft capped at 40 and
 * was therefore cutting 11 real statements in half**, which is the same blindness this file exists to fix,
 * committed by the fix. The cap sits above the measured maximum with headroom and is asserted by the
 * self-test, which fails if any join reaches it.
 */
const MAX_JOIN = 200;

/** Trailing tokens that cannot end a statement, so the next physical line continues it. */
const CONTINUES = /(?:[,([?:=+\-*/%&|]|=>|\?\?|&&|\|\||\.)\s*$/;

/**
 * ⛔ **A `{` OPENS A BODY ONLY WHEN IT FOLLOWS `)`, `=>`, OR A BLOCK KEYWORD.** Every other trailing brace
 * — `import {`, `export {`, `const x = {` — continues the statement and must be joined.
 *
 * ⚠️ **The first draft broke on ANY trailing `{`, and that silently un-fixed `D1-8`**: the wrapped
 * `import {\n  appStore,\n} from …` this class exists to catch ends its first line on a brace, so the
 * joiner stopped exactly where the escape lives. Caught by migrating the second gate, not by reading the
 * first — which is the class's own lesson landing on the class's own fix.
 */
const OPENS_BODY = /(?:\)|=>|\belse\b|\btry\b|\bdo\b|\bfinally\b)\s*\{$/;

/**
 * Walk `src` as logical lines.
 *
 * @param blankStrings blank string CONTENTS in the emitted text as well as in the structure. Gates that
 * judge what is *inside* a string (copy, apostrophes) must leave this `false`; gates matching code shapes
 * should set it `true` so a banned form quoted inside a string is not a hit.
 */
export function logicalLines(
  src: string,
  { blankStrings = false, maxJoin = MAX_JOIN }: { blankStrings?: boolean; maxJoin?: number } = {},
): LogicalLine[] {
  const structure = stripCommentsAndStrings(src).split('\n');
  const visible = (blankStrings ? stripCommentsAndStrings(src) : stripCommentsOnly(src)).split('\n');

  const out: LogicalLine[] = [];
  let i = 0;
  while (i < structure.length) {
    const start = i;
    /**
     * ⛔ **BRACES COUNT FOR AN IMPORT/EXPORT AND FOR NOTHING ELSE.** `D1-8`'s escape is a wrapped
     * `import { … } from …` spread over three lines, so that one statement needs brace depth — and every
     * OTHER trailing brace is a body or a literal whose contents are their own statements.
     *
     * ⚠️ **Measured, both directions.** Putting `{` in `CONTINUES` for all statements re-opened the
     * runaway at **330 lines** in JSX — a defect 300 lines below `PaydayGuardianCard.tsx:278` would be
     * reported at 278. Leaving braces out entirely left `D1-8`'s wrapped import unjoined. Scoping to the
     * import satisfies both, and `p3-join-shapes.ts` asserts all seven shapes.
     */
    const isImport = /^\s*(?:import|export)/.test(structure[i] ?? '');
    let depth = 0;
    let parts: string[] = [];
    for (;;) {
      depth += bracketDelta(structure[i] ?? '', isImport);
      parts.push(visible[i] ?? '');
      const open = depth > 0 || CONTINUES.test(structure[i] ?? '');
      const more = i + 1 < structure.length;
      const room = i - start + 1 < maxJoin;
      // ⛔ A `{` that OPENS A BODY ends the statement — a body's contents are statements of their own.
      // Without this the join is technically correct and practically useless: `createStore<T>((set, get) => {`
      // in `store.ts:336` is one call expression running to line 1106, so **every** defect in the store
      // body would be reported at line 336. Measured before this line existed: true widest span = 770.
      const opensBody = OPENS_BODY.test((structure[i] ?? '').trimEnd());
      if (!open || opensBody || !more || !room) break;
      i++;
    }
    out.push({ line: start + 1, text: parts.join(' '), span: i - start + 1 });
    i++;
  }
  return out;
}

/**
 * Net bracket change on one line of STRING-BLANKED text.
 *
 * ⛔ **`{` AND `}` ARE DELIBERATELY NOT COUNTED, and the first draft counted them.** A brace opens a
 * *block* — a function body, an `if`, an object literal at statement level — not a wrapped statement, so
 * counting it made the joiner swallow whole functions. **Measured on the tracked tree: 477 logical lines
 * ran to `MAX_JOIN` and the widest join was exactly the cap**, i.e. the joiner was running away rather
 * than joining. Counting only `(` and `[` is what bounds a join to one statement.
 *
 * ⚠️ **The known cost, named rather than implied:** an object literal wrapped at statement level
 * (`const x = {` … `}`) is not joined unless a trailing operator continues it. Every defect pattern this
 * helper serves lives inside a CALL, which is parenthesised — and `check-cap-literals` already matches
 * its `= {…}` declaration over the whole file for exactly that reason.
 */
function bracketDelta(line: string, countBraces = false): number {
  let d = 0;
  for (const c of line) {
    if (c === '(' || c === '[' || (countBraces && c === '{')) d++;
    else if (c === ')' || c === ']' || (countBraces && c === '}')) d--;
  }
  return d;
}

/**
 * ⛔ **THE POPULATION IS DERIVED, NEVER TYPED.** Every gate that imports `logicalLines` is wrap-sensitive
 * by declaration, and `test-logical-lines.ts` plants a wrapped defect against **each of them** — so a new
 * gate joins the assertion by importing the helper, not by someone remembering to add a row.
 *
 * ⚠️ **This is the one thing that makes the fix a CLASS fix.** Six gates repeated one mistake because the
 * countermeasure was prose. A list here would be prose again.
 */
export const WRAP_SENSITIVE_MARKER = 'logicalLines';
