// codeLinesOnly EXTRACTED VERBATIM from apps/rn/src/components/plan/unreadInputsCopy.test.ts @ fcd954d6
const NEWLINE = /\r?\n/;

function codeLinesOnly(source: string): string {
  return source
    .split(NEWLINE)
    .filter((line) => {
      const t = line.trimStart();
      return !(t.startsWith('//') || t.startsWith('*') || t.startsWith('/*'));
    })
    .map((line) => line.trim())
    .join(' ')
    /**
     * ⛔ **CONCATENATION JUNCTIONS ARE REMOVED, because the READER never sees them** — class-1 re-audit
     * `R12`. Trimming fixed the wrap and normalised nothing between the two words, so the same sentence
     * written `… set it again ` + `above.` rendered identically and passed **30 assertions, exit 0** —
     * the same count as the green run, which is the "a check that cannot fail" signature.
     *
     * ⚠️ This deliberately also welds two genuinely separate adjacent literals together. That is the
     * correct direction: they are adjacent **on screen**, which is the only place the refusal matters.
     */
    /**
     * ⛔ **EVERY JUNCTION BETWEEN TWO LITERALS, not just the one the finding exhibited** — `R12`, then
     * `N-7`. R12's own mechanism paragraph listed three things that can land between the two words — *"a
     * quote, a `+`, a `{' '}` JSX separator"* — and the first fix normalised two of them. The third then
     * shipped the banned sentence past **33 green assertions**, which is the same count as the clean run.
     *
     * ⚠️ **The reader sees none of these.** `{'…'}{' '}{'…'}` renders as one sentence, so the detector has
     * to read it as one sentence — the junctions are an artefact of how JSX is written, exactly as the line
     * break and the `+` were.
     */
    /**
     * ⛔ **`${' '}` AND `+ SEP +`** — [class-1 re-audit 3 · `N-7`]. Two more junctions, both ordinary:
     * a space held in a template INTERPOLATION rather than a JSX expression, and two literals joined by a
     * named separator constant. Neither is visible to the reader, and both shipped the banned sentence.
     *
     * ⚠️ **Order matters and the first attempt got it wrong:** `{' '}` is a SUBSTRING of `${' '}`, so
     * running the JSX rule first left a stray `$` between the words — `again$ above` — and the fixture
     * caught it. The interpolation is consumed first.
     *
     * ⚠️ A named separator collapses to a SPACE rather than to nothing: its value is unknown here, and
     * over-joining reads as one sentence (noisy) while under-joining misses the refusal (blind).
     */
    .replace(/\$\{\s*(['"`])\s*\1\s*\}/g, ' ')
    .replace(/\{\s*(['"`])\s*\1\s*\}/g, ' ')
    .replace(/(['"`])\s*\+\s*[A-Za-z_$][\w$]*\s*\+\s*(['"`])/g, ' ')
    .replace(/['"`]\s*\}\s*\{\s*['"`]/g, ' ')
    .replace(/['"`]\s*\+\s*['"`]/g, '')
    .replace(/[ \t]+/g, ' ');
}

const FIX: [string, string[], boolean][] = [
  ['line wrap (C1-9)', ["const a = (", "  '... incomplete - set it again", "  above.'", ");"], true],
  ['plus junction (R12)', ["const a = '... set it again ' + 'above.';"], true],
  ['JSX {space} separator (N-7)', ["const a = <Text>{'... set it again'}{' '}{'above.'}</Text>;"], true],
  ['template {space} interpolation (N-7)', ["const a = `... incomplete - set it again${' '}above.`;"], true],
  ['plus SEP plus (N-7)', ["const a = '... incomplete - set it again' + SEP + 'above.';"], true],
  ['NEGATIVE row AS SHIPPED (T14)', ["const a = 'try again'; const b = 'above the fold';"], false],
  ['NEGATIVE adjacent ARRAY literals (no fixture covers this)', ["const a = ['try again', 'above the fold'];"], false],
  ['NEGATIVE adjacent JSX literals (no fixture covers this)', ["const a = <Text>{'try again'}{'above the fold'}</Text>;"], false],
];
for (const [name, lines, want] of FIX) {
  const out = codeLinesOnly(lines.join(String.fromCharCode(10)));
  const got = out.includes('again above');
  console.log((got === want ? 'ok   ' : 'FAIL ') + 'welded=' + got + ' want=' + want + '  ' + name);
  console.log('        -> ' + out);
}
