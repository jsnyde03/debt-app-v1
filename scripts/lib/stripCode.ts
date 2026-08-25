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
 * string is string text; both by construction rather than by patch.
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

function scan(src: string, blankStrings: boolean): string {
  const out = src.split('');
  const blank = (i: number) => {
    if (out[i] !== '\n' && out[i] !== '\r') out[i] = ' ';
  };
  let i = 0;
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
        if (blankStrings) blank(i);
        i++;
      }
      if (i < src.length && src[i] === quote) i++;
      continue;
    }

    i++;
  }
  return out.join('');
}
