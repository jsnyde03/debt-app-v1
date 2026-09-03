/**
 * ⛔ **ONE SCANNER, because every regex ordering is wrong and four gates had proved it.**
 * [P6.8.9.7.11.18 · S0.2b/S0.3b · REVERIFY-1 findings 2 + 4]
 *
 * Blanking comments (or strings) with regexes cannot be made correct by choosing a better order:
 *
 * | order | what it gets wrong |
 * |---|---|
 * | comments first | a `//` **inside a string** blanks the rest of the line, taking real code with it — `const s = 'a // b'; d.setMonth(…)` became `const s = 'a` |
 * | strings first | a **lone backtick in a comment** opens a template literal that runs to the next backtick anywhere in the file |
 *
 * ⚡ **Which construct opens first is a property of the TEXT, not of the pass order** — so this walks the
 * source once and tracks what it is inside. A quote inside a comment is comment text; a `//` inside a
 * string is string text.
 *
 * ⛔ **WHAT THIS MODELS, EXACTLY — because the first draft claimed "by construction" and was wrong.**
 * [REVERIFY-2 finding 1] It models **line comments · block comments · the three string forms · regex
 * literals**. The first version omitted regex literals, so a backtick or quote inside one still opened a
 * runaway — **6,966 chars over 304 lines in 22 files**, twice what the regex pair it replaced was hiding.
 * ⚠️ **A scanner is only closed for the constructs it enumerates**, which is the same rule this cluster
 * has now paid for five times. Not modelled, and named rather than implied: JSX text, HTML comments in
 * `.tsx`, and the `({a:1}/x/g)` division-after-object-literal ambiguity.
 *
 * ⚠️ **The failure directions are NOT symmetric, and that decides every ambiguous call.** Blanking real
 * code makes a gate **blind** — it stops reporting a defect that is there. Exposing a comment as code
 * makes it **noisy** — a false hit someone reads and dismisses. **Blind is worse**, so every ambiguity
 * here resolves toward *leave the text alone*: an unterminated string ends at the newline, an
 * unterminated regex is treated as a mis-guess and the characters are left as code.
 *
 * ⚠️ **The `[^:]` lookbehind these gates used to carry was a patch for `https://` specifically** — it
 * addressed the symptom in URLs and left every other string open. It is not needed here and is not kept.
 *
 * **Guarantees:** line count and every line's length are preserved, so a hit still reports the right
 * `path:line`. Comments are blanked rather than matched because the files that document a banned form
 * have to be able to NAME it — a guard that reds on its own documentation gets deleted rather than obeyed.
 *
 * Opening/closing string delimiters are LEFT IN PLACE so the line still parses as code to a caller's
 * regex; only the contents go.
 */
export function stripCommentsAndStrings(src: string): string {
  return scan(src, true);
}

/**
 * ⛔ **COMMENTS ONLY — string CONTENTS SURVIVE.** Some gates exist to judge what is *inside* a string:
 * `check-apostrophes` scans user-facing copy, so blanking string contents would blind it completely.
 *
 * ⚡ **It still needs the scanner rather than `/\/\/.*$/`**, because the thing that breaks that regex is a
 * `//` *inside a string* truncating the line — and deciding whether a `//` is inside a string is exactly
 * what a scanner does and a per-line regex cannot.
 */
export function stripCommentsOnly(src: string): string {
  return scan(src, false);
}

/**
 * ⛔ **THE STRING LITERALS THEMSELVES, WITH THEIR REAL EXTENTS — because a delimiter-pair regex has none.**
 * [S1.13.7.12.6 · class-1 re-audit 4 `U2`, major]
 *
 * ⚡ `check-glossary` found its copy with `/'[^']*'/g`, `/"[^"]*"/g` and `` /`[^`]*`/g ``. Per line that
 * was survivable — the newline was an implicit terminator. `T6` moved the scan to the whole FILE (correct:
 * four of the five retired terms are two-word phrases, and a wrap between the words defeated all of them),
 * and the same regexes then ran to the next matching delimiter **anywhere in the file**.
 *
 * ⚡ **Measured: 1,818 of 10,425 fragments spanned more than one physical line, the largest 39 lines of
 * executable code**, being matched against retired-*copy* patterns. An English contraction inside a
 * double-quoted string opens a single-quote "fragment" that closes on the next unrelated `'`, welding
 * everything between into one sentence — and this gate has **no cap and no allow-list**, so ordinary
 * correct code redded a green tree. One such weld was already live in the tree with no plant at all.
 *
 * ⚠️ **The scanner already knows the answer**, because deciding *"is this quote inside a string"* is the
 * one thing it does and the one thing a regex pair cannot. Delimiters are INCLUDED in `text`, matching
 * what the old fragments returned, so callers' patterns are unaffected.
 */
export function stringLiterals(src: string): { text: string; index: number }[] {
  const found: { text: string; index: number }[] = [];
  scan(src, false, found);
  return found;
}

/**
 * ⛔ **DOES A `/` START A REGEX OR DIVIDE?** JavaScript cannot answer that lexically — it depends on the
 * preceding token — so this uses the standard heuristic: a `/` begins a regex when the last significant
 * character cannot end an expression.
 *
 * ⚠️ **Ambiguous by design: `}`.** It ends a block (regex may follow) *and* an object literal (division may
 * follow). Treated as *regex may follow*, because the failure directions are not symmetric — see the
 * header. The known miss is `({a:1}/x/g)`, which is not valid code anyone writes.
 */
function regexMayFollow(prev: string): boolean {
  return prev === '' || '=(,:[!&|?{};+-*%~^<>'.includes(prev);
}

const KEYWORD_BEFORE_REGEX = /\b(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

function scan(src: string, blankStrings: boolean, literals?: { text: string; index: number }[]): string {
  const out = src.split('');
  const blank = (i: number) => {
    if (out[i] !== '\n' && out[i] !== '\r') out[i] = ' ';
  };
  let i = 0;
  /** The last non-whitespace character of CODE seen — decides whether a `/` opens a regex. */
  let lastSignificant = '';
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];

    if (c === '/' && next === '/') {
      while (i < src.length && src[i] !== '\n') blank(i++);
      continue;
    }

    if (c === '/' && next === '*') {
      blank(i++);
      blank(i++);
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) blank(i++);
      if (i < src.length) {
        blank(i++);
        blank(i++);
      }
      continue;
    }

    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      const opened = i; // ⛔ `U2` — where this literal really begins, for `stringLiterals`
      i++; // keep the opening delimiter
      while (i < src.length) {
        if (src[i] === '\\') {
          if (blankStrings) blank(i);
          i++;
          if (i < src.length) {
            if (blankStrings) blank(i);
            i++;
          }
          continue;
        }
        if (src[i] === quote) break;
        // ⛔ `'` and `"` do not span lines — one unbalanced apostrophe in code would otherwise swallow
        // the rest of the file. Only a template literal may cross a newline.
        if (src[i] === '\n' && quote !== '`') break;
        /**
         * ⛔ **A `${…}` INTERPOLATION IS CODE, AND BLANKING IT IS HOW `R5` KEPT COMING BACK.**
         * [class-1 re-audit 4 · `U1`; re-audit 2 · `R5`; re-audit 3 · `T3`]
         *
         * Inside a template literal the *text* is string content, but everything between `${` and its
         * matching `}` is ordinary expression code — and blanking it hid real defects three separate times:
         * a `parseAmountField(…) ?? 0` and a `Math.round(… * 100) / 100` written inside an interpolation
         * were invisible to both money gates, and `findCalls` re-introduced it a fourth time by re-blanking
         * for its own depth count.
         *
         * ⚠️ Depth is tracked so a nested `}` inside the expression (an object literal, a nested template)
         * does not end the interpolation early.
         */
        if (quote === '`' && src[i] === '$' && src[i + 1] === '{') {
          i += 2;
          let braces = 1;
          while (i < src.length && braces > 0) {
            if (src[i] === '{') braces++;
            else if (src[i] === '}') braces--;
            if (braces > 0) i++;
          }
          continue;
        }
        if (blankStrings) blank(i);
        i++;
      }
      if (i < src.length && src[i] === quote) i++;
      // ⚠️ Recorded whether or not it closed. An unterminated literal ends at the newline (see the
      // header), and reporting the text up to there is honest — dropping it would be the blind direction.
      literals?.push({ text: src.slice(opened, i), index: opened });
      lastSignificant = quote;
      continue;
    }

    /**
     * ⛔ **REGEX LITERALS — the third construct, and the one that kept the runaway alive.**
     * [S0.8b · REVERIFY-2 finding 1] A backtick, quote or `//` **inside a regex** was read as opening a
     * template literal, a string or a comment. Measured: `check-audit-closure.ts:118`'s regex blanked
     * lines 118–197, and `surface-inventory.ts:143` blanked 143–213 — **6,966 chars over 304 lines in 22
     * files**, i.e. the scanner was still hiding twice as much real code as the regex pair it replaced.
     *
     * ⚠️ A `[...]` class may contain an unescaped `/`, so bracket depth is tracked. A regex cannot span a
     * newline, so a newline ends the scan and the text is left alone — an unterminated regex is a
     * mis-guess, not a runaway.
     */
    if (c === '/' && (regexMayFollow(lastSignificant) || KEYWORD_BEFORE_REGEX.test(src.slice(Math.max(0, i - 12), i)))) {
      let j = i + 1;
      let inClass = false;
      let closed = false;
      while (j < src.length) {
        const d = src[j];
        if (d === '\n') break; // a regex literal cannot cross a line — treat as a mis-guess
        if (d === '\\') {
          j += 2;
          continue;
        }
        if (d === '[') inClass = true;
        else if (d === ']') inClass = false;
        else if (d === '/' && !inClass) {
          closed = true;
          break;
        }
        j++;
      }
      if (closed) {
        // The literal is real. Blank its BODY (so nothing inside it opens anything) and skip past it.
        for (let k = i + 1; k < j; k++) if (blankStrings) blank(k);
        i = j + 1;
        lastSignificant = '/';
        continue;
      }
      // Not a regex after all — fall through and treat `/` as an ordinary character.
    }

    if (!/\s/.test(c)) lastSignificant = c;
    i++;
  }
  return out.join('');
}
