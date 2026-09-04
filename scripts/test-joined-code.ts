/**
 * ⛔ **`lib/joinedCode.ts`, PINNED — and until now NOTHING tested it.**
 * [S1.13.7.12.6 · class-1 re-audit 4 `U11`, re-audit 5 `V7`]
 *
 * Two consumers depend on this file and one of them is a release gate:
 *
 * | consumer | what it asks |
 * |---|---|
 * | `check-finding-guards.ts` | *is this assertion still in the file?* — the instrument that decides whether every finding in the audit is closed |
 * | `unreadInputsCopy.test.ts` (via `codeText`) | *does this sentence reach the reader?* — inside `test:app` |
 *
 * ⚡ **`V7` is why this file exists.** The comment predicate guessed *"am I inside a block comment"* from
 * each line's first characters, so a `/*` opening after any other token was never seen and the whole
 * comment body read as CODE. Measured: delete a guard, re-introduce its token inside a mid-line block
 * comment, and `lint:finding-guards` printed **`✅ 279 of 280 findings carry a standing guard`** over a
 * guard that was gone. ⛔ **And the file's own header asserted the opposite** — *"BLOCK-COMMENT STATE IS
 * TRACKED, not guessed from the line's first characters."*
 *
 * ⚠️ **The two directions are not symmetric**, and every case below is labelled with which one it holds:
 * reading a comment as CODE makes the guard **fail open** — a deleted assertion reported present — while
 * over-welding makes it **noisy**, and `MAX_UNGUARDED` is capped at 1 with no allow-list.
 *
 * Usage: npm run test:joined-code
 */
import { codeText, joinAllLines, joinCodeLines, normaliseFragment } from './lib/joinedCode';

let passed = 0;
const failures: string[] = [];
const check = (cond: boolean, label: string) => {
  if (cond) passed++;
  else failures.push(label);
};
const NL = String.fromCharCode(10);
const STAR = String.fromCharCode(42);
const SLASH = String.fromCharCode(47);
const BLOCK_OPEN = SLASH + STAR;
const BLOCK_CLOSE = STAR + SLASH;

// ── Comments are dropped, in every spelling ─────────────────────────────────────────────────────────
{
  check(!codeText(`// a line comment${NL}const a = 1;`).includes('a line comment'), 'a `//` line comment is dropped');
  check(
    !codeText([BLOCK_OPEN, ' * starred body', ' ' + BLOCK_CLOSE, 'const a = 1;'].join(NL)).includes('starred body'),
    'an ordinary starred block comment is dropped',
  );
  /**
   * ⛔ **`V7`, THE FAIL-OPEN DIRECTION.** A block opened after code on the same line. The old predicate
   * looked at the line's first characters, saw `const`, and read every line below as code — so a guard
   * token sitting in that body satisfied `check-finding-guards` over a deleted assertion.
   */
  check(
    !codeText(['const x = 1; ' + BLOCK_OPEN + ' opens mid-line', '   a guard token lives here', BLOCK_CLOSE].join(NL)).includes(
      'a guard token lives here',
    ),
    'V7: a block comment opened MID-LINE is dropped — the fail-open direction',
  );
  check(
    !codeText(['const x = 1; ' + BLOCK_OPEN + ' unstarred body', 'no leading star at all', BLOCK_CLOSE].join(NL)).includes(
      'no leading star',
    ),
    'V7: …and its body is dropped even with no leading `*` on the continuation lines',
  );
  // ⚠️ The code on the opening line is still CODE — dropping it would be the blind direction one step over.
  check(codeText('const x = 1; ' + BLOCK_OPEN + ' c ' + BLOCK_CLOSE).includes('const x = 1;'), 'V7: …while the code BEFORE the mid-line block survives');
}

// ── A delimiter inside a STRING is not a comment ────────────────────────────────────────────────────
/**
 * ⛔ This is the case the old line-prefix predicate existed to dodge, and the reason the fix is a scanner
 * rather than a better prefix rule: a line holding the delimiter as a string literal must not open a
 * block that never closes and swallows the rest of the file.
 */
{
  const src = ['const opens = "' + BLOCK_OPEN + '";', 'const real = 2;'].join(NL);
  check(codeText(src).includes('const real = 2;'), 'a block delimiter inside a STRING opens nothing');
  const url = "const u = 'http://x'; const after = 3;";
  check(codeText(url).includes('const after = 3;'), 'a `//` inside a string is not a comment — the case a per-line regex gets wrong');
}

// ── The junction welds: what the READER sees is one sentence ────────────────────────────────────────
/**
 * ⚠️ Every one of these shipped the banned sentence past a green suite at least once (`C1-9`, `R12`,
 * `N-7` twice). They are the NOISY direction by design: over-joining reads as one sentence, which is
 * where the refusal matters.
 */
{
  const cases: [string, string][] = [
    ['a line break', ['const s = (', '  <Text>set it again', '  above</Text>', ');'].join(NL)],
    ['a `+` between two literals', "const s = 'set it again ' + 'above';"],
    ['a JSX space separator', "const s = <>{'set it again'}{' '}{'above'}</>;"],
    ['a space held in a template interpolation', "const s = `set it again${' '}above`;"],
    ['a named separator constant', "const s = 'set it again' + SEP + 'above';"],
  ];
  for (const [what, src] of cases) {
    check(codeText(src).replace(/\s+/g, ' ').includes('set it again above'), `the reader sees one sentence across ${what}`);
  }
}

// ── `lineAt` reports the line a match STARTS on ─────────────────────────────────────────────────────
/**
 * ⛔ **Joining destroys line numbers, and a hit still has to name a place.** ⚡ The first cut indexed with
 * `for...of`, which walks code POINTS while regex indices are code UNITS — one emoji desynchronised the
 * map and the welds ate real characters (`alignItems` came out `lignItems`). The emoji row is that.
 */
{
  const j = joinCodeLines(['const a = 1;', '// dropped', 'const target = 2;'].join(NL));
  check(j.lineAt(j.text.indexOf('const target')) === 3, 'lineAt reports the SOURCE line, counting dropped comment lines');

  const withEmoji = joinCodeLines(["const a = '⛔ mark';", 'const target = 2;'].join(NL));
  check(
    withEmoji.lineAt(withEmoji.text.indexOf('const target')) === 2,
    'an emoji does not desynchronise the map — indexed by code UNIT, not code point',
  );
  check(withEmoji.text.includes('const target = 2;'), '…and no characters are eaten off the following line');
}

// ── `normaliseFragment` runs the NEEDLE through the same producer ───────────────────────────────────
/**
 * ⛔ Normalising the haystack and not the needle cost **8 guards outright** (268 → 260) the first time —
 * registry tokens carry their own indentation on purpose. ⚠️ Comments are NOT dropped from a fragment: a
 * token legitimately beginning with `*` would otherwise normalise to nothing and match everywhere.
 */
{
  check(normaliseFragment('  priorityGoalIsCapped,') === 'priorityGoalIsCapped,', 'a fragment loses its own indentation, like the haystack');
  check(normaliseFragment('* a token that starts with a star') === '* a token that starts with a star', 'a fragment is NOT comment-stripped');
  const haystack = joinCodeLines(['const x = [', '  priorityGoalIsCapped,', '];'].join(NL));
  check(haystack.text.includes(normaliseFragment('  priorityGoalIsCapped,')), 'needle and haystack agree after normalisation');
}

// ── `joinAllLines` keeps comments, deliberately ─────────────────────────────────────────────────────
// ⚠️ It answers "is this token anywhere in the file", which is asked BEFORE "is it only in a comment".
// Collapsing the two would silently answer the second question with the first.
check(joinAllLines('// a comment token').text.includes('a comment token'), 'joinAllLines KEEPS comments — it answers a different question');

// ── Non-vacuity ─────────────────────────────────────────────────────────────────────────────────────
// ⛔ Without this, a `codeText` rewritten to return its input passes most of the comment rows by accident
// of them asserting absence, and every weld row by returning the source unchanged.
check(codeText('const a = 1;') === 'const a = 1; ', 'codeText actually returns joined text rather than its input');

if (failures.length > 0) {
  console.error(`\n❌ joined code: ${failures.length} failure(s).\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error(
    '\n  ⛔ V7 — reading a comment as CODE makes `lint:finding-guards` report a DELETED guard as present.\n' +
      '  ⛔ U11 — failing to weld makes it report an INTACT guard as gone. Both directions are live.\n',
  );
  process.exit(1);
}

console.log(`✅ joined code: ${passed} assertions — comments dropped in every spelling, junctions welded, lineAt honest.`);
