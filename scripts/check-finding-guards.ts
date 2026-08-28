/**
 * [D67] — A CLOSED FINDING NEEDS A STANDING GUARD, OR IT IS NOT CLOSED.
 *
 * ⚡ **Why this exists.** 🎯 2026-08-26 asked whether each audit pass handles **all** prior findings. It
 * did not: **coverage ratcheted forward in this project and findings did not** — a pass only ever
 * re-checked the pass before it, while one intervening commit edited **nine gates**. Several S0 closures
 * were proven by **a plant that ran once and was deleted**, which leaves nothing behind. Pass 4's guard
 * inventory then measured the backlog: **37 findings · 11 guarded · 18 gaps · 8 n/a.**
 *
 * ⛔ **THE SHAPE IS `check-copy-owners`, APPLIED TO FINDINGS.** That gate pins *"this file must still
 * reference this owner"*; this one pins *"this finding must still have this guard."* A registry that only
 * grows, and a finding with no guard needs a **written reason** rather than silence.
 *
 * ⚠️ **A GUARD IS NAMED BY A TOKEN, NOT BY A FILE PATH — and the difference is the whole gate.** "The file
 * still exists" is worth nothing: the assertion inside it is what guards the finding, and deleting the
 * assertion leaves the file in place. So each entry names a distinctive string that must still be present,
 * chosen to be the thing that makes it a guard — a floor constant, a diagnostic sentence, a function name.
 * ⛔ **This is the `tested-helper-is-not-a-used-helper` lesson**: the clamp existed, was correct, and was
 * tested while the defect shipped, because what was missing was the *call*.
 *
 * ⚠️ **`unguarded` is a first-class state, deliberately.** 18 of pass 4's 37 findings have no standing
 * guard, and a gate that refused to acknowledge that would simply be turned off. Each carries a reason
 * and a pointer; **the count of them may only go DOWN.**
 *
 * Usage: npm run lint:finding-guards
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
/**
 * ⛔ **S1.9.4 [pass-2 B-1] — THE REGISTRY IS AN INPUT, so that this gate can be PLANTED like any other.**
 *
 * ⚡ Seven registry entries were pinned by an identifier inside a gate script's own logic, and **all seven
 * stayed green with the defect restored** — three of them the fixes to THIS file, the gate that certifies
 * all of them. A token proves an identifier is present; it cannot prove the gate still refuses anything.
 * `test-gate-plants` is what proves that, and it needs to hand this script an input of its own.
 *
 * ⚠️ **A flag, not an environment variable**, deliberately: it is visible in the command line a human or a
 * CI log shows, and `--working-tree` / `--surface=` already established the idiom here. The npm script
 * passes nothing, so the real registry is what CI reads.
 */
const REGISTRY = join(
  REPO_ROOT,
  process.argv.find((a) => a.startsWith('--registry='))?.split('=')[1] ?? 'scripts/finding-guards.json',
);

interface Entry {
  /** what the finding was, in one line — so a failure explains itself without opening the audit */
  what: string;
  /** repo-relative file holding the guard */
  file?: string;
  /** the string that must still be in that file — the assertion, not the filename */
  token?: string;
  /** set instead of file/token when nothing guards it yet; must say why and where it is tracked */
  unguarded?: string;
}

/**
 * Is the guard token still present — as a WHOLE identifier, not as a substring?
 *
 * ⛔ **THIS GATE FAILED OPEN ON ITS OWN CORE CASE, and the catch is recorded rather than tidied away.**
 * The first cut used `text.includes(token)`. Plant-verified by renaming `MIN_SCENARIOS` →
 * `MIN_SCENARIOS_RENAMED`: the guard was gone, **and the gate passed**, because the old name is still a
 * substring of the new one. ⚡ **The fix for the fail-open class carried the fail-open class** — which is
 * the standing warning *"expect the fixer's own work to carry the defect it was closing,"* now observed
 * for the fourth time in this cluster and the first time in my own.
 *
 * ⚠️ An identifier-shaped token is matched on word boundaries; a sentence token (which cannot be renamed
 * into a longer identifier) keeps plain containment.
 */
/**
 * ⛔ S1.5.4 [M6] — THE BOUNDARY IS PER-END, NOT PER-TOKEN-SHAPE, and the old rule fixed only half its own
 * registry.
 *
 * The word-boundary branch was reached **only** when the WHOLE token matched `/^[\w$]+$/`. A token holding
 * a space or a hyphen fell back to `text.includes` — the exact implementation the paragraph above records
 * this gate already failing open on. Measured on three live entries, all identifier-PREFIXED (a keyword
 * plus a name that can grow):
 *
 *     `function isClamp`          → `function isClampLegacy`   GREEN, guard gone
 *     `export function selfCheck` → `export function selfCheckAll`  GREEN, guard gone
 *     `cat-file`                  → `cat-file-batched`         GREEN
 *
 * ⚠️ **The question is not "does the token contain a space."** It is *"could this token still be a
 * substring of the renamed thing"* — which is a property of each END. A token that ENDS in a name
 * character needs a trailing boundary; one that BEGINS with a name character needs a leading one. A
 * sentence token gets neither and keeps plain containment, which is correct: a sentence cannot be renamed
 * into a longer identifier.
 *
 * ⚠️ **A kebab-case name grows across a hyphen**, so for a token containing one the name charset must
 * include `-` — otherwise `cat-file` still matches `cat-file-batched`, since `-` is not a `\w`.
 */
function present(text: string, token: string): boolean {
  const nameChars = token.includes('-') ? '\\w$\\-' : '\\w$';
  const startsWithName = new RegExp(`^[${nameChars}]`).test(token);
  const endsWithName = new RegExp(`[${nameChars}]$`).test(token);
  if (!startsWithName && !endsWithName) return text.includes(token);
  const lead = startsWithName ? `(?<![${nameChars}])` : '';
  const tail = endsWithName ? `(?![${nameChars}])` : '';
  return new RegExp(`${lead}${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${tail}`).test(text);
}

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8')) as Record<string, Entry>;
const ids = Object.keys(registry);

/**
 * ⛔ **BOTH FLOORS MOVE ONE WAY ONLY.** `MIN_ENTRIES` may only rise — a finding dropping out of the
 * registry is how a closure stops being tracked. `MAX_UNGUARDED` may only fall — it is the S0.13 backlog
 * draining. ⚠️ Raising `MAX_UNGUARDED` to make a run pass is the defect this file exists to catch.
 */
const MIN_ENTRIES = 156;
const MAX_UNGUARDED = 1;

/**
 * ⛔ S1.5.4 [M8] — DUPLICATE KEYS, because `JSON.parse` silently keeps the LAST of any repeated id.
 *
 * Two entries sharing an id drop one and lower the count with nothing to show for it. That was invisible
 * while the floor carried slack; under strict equality it would red for the wrong reason, and a gate that
 * reds with a misleading message is worse than one that does not red at all. Counted off the raw text,
 * because the parsed object is exactly what cannot see this.
 */
/**
 * ⛔ S1.5.4 [M7] — THE TOKEN MUST SURVIVE ON A LINE OF CODE, not on a comment about the code.
 *
 * Measured across the whole registry, not sampled: delete every non-comment line carrying the token and
 * **five entries stayed GREEN**, each held up by a docstring sentence alone. `GUARDED-5` was the sharpest
 * — `GAP-2` already records that deleting an invariant from `INVARIANTS` is silent, so the two holes
 * composed into a fully silent removal of an invariant, with `lint:rn` green throughout.
 *
 * ⚠️ **A comment is a claim; an assertion is a guard.** The gate exists because *"the file survived; the
 * assertion inside it did not"* — and prose describing an assertion is exactly the shape that survives
 * the assertion's deletion.
 *
 * ⚠️ **Line-based, and honest about it:** a `//` line, a `*` continuation, and anything inside a `/* … *​/`
 * block are comments. That misses a token trailing real code on the same line as a comment — but it errs
 * toward calling a line CODE, so the check never reds a genuine guard.
 */
const isCommentLine = (l: string) => /^\s*(?:\/\/|\*|\/\*)/.test(l);

function presentInCode(text: string, token: string): boolean {
  let inBlock = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    // ⚠️ A block OPENS only when the line begins one. The first cut asked `line.includes('/*')`, and this
    // file's own source broke it: `const opens = line.includes('/*')` contains the delimiter as a STRING
    // LITERAL, so the scanner entered a block that never closed and every line below it — including the
    // code this gate was pointed at — read as comment. ⚡ Found by this check failing on its own new
    // guard entry. A delimiter inside a literal is not a comment; a line that starts with one is.
    const startsBlock = line.startsWith('/*') && !line.includes('*/');
    const wasInBlock = inBlock;
    if (startsBlock) inBlock = true;
    else if (wasInBlock && line.includes('*/')) inBlock = false;
    if (wasInBlock || startsBlock || line.startsWith('//') || line.startsWith('*')) continue;
    if (present(raw, token)) return true;
  }
  return false;
}

const rawRegistry = readFileSync(REGISTRY, 'utf8');
const keyLines = [...rawRegistry.matchAll(/^\s{2}"([^"]+)":/gm)].map((m) => m[1]);
const dupes = keyLines.filter((k, i) => keyLines.indexOf(k) !== i);

const problems: string[] = [];
let guarded = 0;
const unguarded: string[] = [];

for (const [id, e] of Object.entries(registry)) {
  if (e.unguarded) {
    if (!e.unguarded.trim()) problems.push(`${id} — marked unguarded with an empty reason`);
    unguarded.push(id);
    continue;
  }
  if (!e.file || !e.token) {
    problems.push(`${id} — neither a guard (file + token) nor a written reason for having none`);
    continue;
  }
  const abs = join(REPO_ROOT, e.file);
  if (!existsSync(abs)) {
    problems.push(`${id} — guard file is GONE: ${e.file}  (${e.what})`);
    continue;
  }
  const text = readFileSync(abs, 'utf8');
  if (!present(text, e.token)) {
    problems.push(
      `${id} — the guard is gone from ${e.file}: no ${JSON.stringify(e.token)}  (${e.what})\n` +
        '        the file survived; the assertion inside it did not, which is the shape this gate exists for',
    );
    continue;
  }
  /**
   * ⛔ **S1.10.6.5.4 [pass-3 D3-3] — A TOKEN THAT *DECLARES* A VALUE SURVIVES THE LINE THAT *USES* IT.**
   *
   * ⚡ `S1P2-B1-REASON` guarded `B-1`'s own fix and was **green with that fix's defect restored**: its token
   * named `const rightReason = …`, and the un-fix is deleting `&& rightReason` from the line below, which
   * leaves the declaration untouched. ⛔ **[M7] cannot see this** — the token IS on a line of code, just
   * not the line that would have to change.
   *
   * ⚠️ **Swept registry-wide rather than repaired one entry at a time — the finding's own instruction —
   * and the sweep returned THIRTEEN**, two of them written the same day as this check: the liveness cap in
   * `check-trust-claims.ts`, and the guard for `A3` three sub-steps earlier.
   *
   * The rule is mechanical and exact: if the token line declares an identifier that appears on any other
   * code line in the same file, the declaration can outlive every use. ⛔ **No cap and no ledger — this
   * one is simply zero**, because unlike a coverage backlog there is no such thing as a legitimately
   * mis-pointed token.
   */
  const declLine =
    text.split(/\r?\n/).find((l) => present(l, e.token!) && !isCommentLine(l)) ?? '';
  const decl = /^\s*(?:export\s+)?(?:const|let|var|(?:async\s+)?function)\s+([A-Za-z_$][\w$]*)/.exec(declLine);
  if (decl) {
    const name = decl[1];
    const usedElsewhere = text
      .split(/\r?\n/)
      .some((l) => !present(l, e.token!) && !isCommentLine(l) && new RegExp(`\\b${name}\\b`).test(l));
    if (usedElsewhere) {
      problems.push(
        `${id} — the token DECLARES ${JSON.stringify(name)} and another line USES it: ${JSON.stringify(e.token)}\n` +
        '        a declaration outlives its use, so an un-fix that deletes the USE leaves this token in place.\n' +
        '        Point it at the line that would have to change — the comparison, the call, the assertion.',
      );
      continue;
    }
  }
  // ⛔ S1.5.4 [M7] — present, but only in prose. See `presentInCode`.
  if (!presentInCode(text, e.token)) {
    problems.push(
      `${id} — the guard token appears in ${e.file} ONLY IN A COMMENT: ${JSON.stringify(e.token)}  (${e.what})\n` +
        '        a comment describing an assertion survives that assertion being deleted, so it guards nothing.\n' +
        '        Point the token at the assertion itself — the line that would have to change for the defect to return.',
    );
    continue;
  }
  guarded++;
}

if (dupes.length) {
  problems.push(
    `duplicate id(s) in the registry: ${[...new Set(dupes)].join(', ')} — JSON.parse keeps only the LAST, ` +
      'so one finding is silently untracked and the count is short by one.',
  );
}

/**
 * ⛔ S1.5.4 [M8] — BOTH FLOORS ARE STRICT EQUALITY NOW, and the slack was ten entries wide.
 *
 * `MIN_ENTRIES` was 24 against a 34-entry registry, checked with `<`. All six S1 guard entries — blocker
 * #1 among them — plus four `REVERIFY4-*` could be deleted in one edit with the gate green. The docstring
 * above already said the floor may only rise; nothing made it rise, and nothing redded when the count
 * exceeded it. ⚠️ `MAX_UNGUARDED` was `>`, so it acquires the identical slack the moment one backlog entry
 * is guarded.
 *
 * ⚡ **Its sibling in the same commit range does this correctly, which is what made it a defect rather
 * than a style choice:** `check-committed-secrets.ts` uses `!==` on `MAX_EXEMPT` and reds in BOTH
 * directions, with a message telling the human to lower the cap.
 *
 * ⚠️ Strict equality means adding a guard is a two-line edit — the entry, and the number. That friction is
 * the feature: it is the moment a human confirms the registry grew on purpose.
 */
if (ids.length !== MIN_ENTRIES) {
  problems.push(
    ids.length < MIN_ENTRIES
      ? `the registry holds ${ids.length} findings; ${MIN_ENTRIES} are expected. Entries were REMOVED — ` +
        'a finding dropping out is how a closure stops being tracked. Do not lower the floor.'
      : `the registry holds ${ids.length} findings and MIN_ENTRIES is ${MIN_ENTRIES}. Raise it to ` +
        `${ids.length} in the same edit that added the entr${ids.length - MIN_ENTRIES === 1 ? 'y' : 'ies'} — ` +
        'a floor that trails the count is slack a deletion can hide in.',
  );
}
if (unguarded.length !== MAX_UNGUARDED) {
  problems.push(
    unguarded.length > MAX_UNGUARDED
      ? `${unguarded.length} findings are unguarded; the cap is ${MAX_UNGUARDED} and it only ever goes DOWN. ` +
        'Raising it to make this pass is the defect this gate exists to catch.'
      : `${unguarded.length} findings are unguarded and the cap is still ${MAX_UNGUARDED}. Lower it to ` +
        `${unguarded.length} — the cap is the high-water mark, and leaving it above the count is room for ` +
        'a guard to disappear unnoticed.',
  );
}

if (problems.length) {
  console.error(`\n❌ finding-guards: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error('\n  [D67]: a closed finding needs a standing guard, or it is not closed.\n');
  process.exit(1);
}

console.log(
  `✅ finding-guards: ${guarded} of ${ids.length} findings carry a standing guard; ` +
    `${unguarded.length} unguarded (cap ${MAX_UNGUARDED}, downward-only).`,
);
// ⚠️ Printed green, like the S0 coverage gate: the unguarded list is S0.13's remaining backlog, and a
// number nobody sees is a number nobody drains.
for (const id of unguarded) console.log(`     unguarded: ${id} — ${registry[id].unguarded}`);
