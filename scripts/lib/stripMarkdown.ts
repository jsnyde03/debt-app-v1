/**
 * ⛔ **FOUR SPELLINGS OF "MARKDOWN CODE", and the first cut enumerated ONE.** [S0.8b · REVERIFY-2 finding 3]
 * ` ``` ` fences · `~~~` fences · four-space-indented blocks · inline spans of **any** backtick run length.
 * Missing three of them meant a token written in any of those still minted a closure.
 *
 * ⚠️ **Direction check, and it is what makes the indented-block rule safe:** hiding a REAL record inflates
 * the untokenised count, which reds the cap — noisy, and visible. Admitting a FAKE one deflates it, which
 * signs off a finding nobody examined. **The failures are not symmetric, so an ambiguous line is blanked.**
 *
 * ⛔ **EXTRACTED FROM `check-audit-closure.ts` AT S1.10.6.5.8.5 [GAP-4], AND ONLY SO IT CAN BE TESTED.**
 * That file is a script: importing it executes the entire gate, so the function could not be exercised
 * where it lived. ⚠️ The move is byte-faithful — the four `.replace` rules and their order are unchanged,
 * and `lint:closure` was run before and after to confirm the verdict did not move.
 *
 * ⚡ **Why it needed testing at all, measured rather than assumed:** reverting this to the first cut
 * (` ``` ` fences plus single-backtick spans only) mints **zero** tokens against today's corpus and
 * `lint:closure` stays **green, exit 0** — so three quarters of this function can be deleted and nothing
 * in the repo says a word. ⚠️ Its other two stated exposures are now **refuted**: `M8`'s strict-equality
 * sweep turned both `MAX_UNTOKENISED` caps from upper bounds into `!==`, so a fabricated closure no
 * longer buys cap headroom — it reds. Removing this function entirely now exits 1.
 */
export function stripMarkdownCode(md: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, ' ');
  return (
    md
      // fenced blocks, both fence characters
      .replace(/^[ \t]*```[\s\S]*?^[ \t]*```/gm, blank)
      .replace(/^[ \t]*~~~[\s\S]*?^[ \t]*~~~/gm, blank)
      // four-space-indented code blocks — one line at a time; a token here is quoted output, not a record
      .replace(/^ {4,}\S[^\n]*$/gm, blank)
      // inline spans: a run of N backticks closes on a run of N. `` `x` `` and ``` ``x`` ``` both count.
      .replace(/(`+)(?:[^`\n]|(?!\1)`)*\1/g, blank)
  );
}

/**
 * ⛔ **THE GATE'S OWN REMEDIATION LINE — SIX-SPACE INDENTED ON PURPOSE.** [GAP-5 · REVERIFY-3 · attack 5]
 *
 * This project pastes gate output into `DEBT_ELEVATION_LOG.md`, which **is** a closure SOURCE. At two
 * spaces this line is not inside a markdown code block, so pasting the error registers `THE-ID-HERE` in
 * `explicit` — *the instrument's own advice text minting a closure*, which is M12's shape a fifth time.
 *
 * ⚠️ **Exported so the guard consumes THE STRING THE GATE PRINTS, not a copy of it.** A test with its own
 * copy would keep passing while the real line was un-indented — two producers of one fact, which is the
 * exact defect shape `S1.10.6.1` spent three blockers on.
 */
export const CLOSURE_REMEDIATION_LINE = '      [closes: THE-ID-HERE]';
