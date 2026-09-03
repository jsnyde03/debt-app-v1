/**
 * [S1.11.3.3 · pass-4 `D4-4`] — **A RATCHET DERIVED FROM THE LIST IT CAPS CANNOT FAIL.**
 *
 * ⛔ **MEASURED, TWICE, IN THE SAME FILE.** `check-trust-claims.ts` shipped with
 * `const MAX_EXEMPT = Object.keys(EXEMPT).length` and `MAX_OPEN = Object.keys(OPEN).length`, one commit
 * after its own docblock explained why such a cap only goes DOWN. Both "downward-only ratchets" were
 * no-ops: the comparison `Object.keys(EXEMPT).length > MAX_EXEMPT` is `n > n`. `MAX_LIVENESS_SITES` was
 * a derived sum with the same property — auditor D reverted it and **14 sites were accepted against a cap
 * of 13, with the green line printing `cap 14`.**
 *
 * ⚡ **Nothing could see it, and that is the point.** `lint:finding-guards` was green *(the tokens were
 * all present)*, `lint:trust-claims` was green *(the caps admitted everything)*, and `test:gate-plants`
 * had no scenario for a cap. **Reading has never once found this class here. Planting has found it every
 * time** — so the check is static, mechanical, and runs on every push.
 *
 * ⚠️ **SCOPED TO `scripts/`, deliberately.** A `MAX_WALK_DEPTH = 8` in app code is a limit, not a ledger:
 * nothing about the product's correctness depends on it being un-derivable. The constants here are
 * **ratchets** — a backlog's high-water mark, written so lowering it is a deliberate act — and a ratchet
 * whose bound is computed from its own population is a number that agrees with whatever it is handed.
 *
 * ⚠️ **What "literal" admits, and why:** a number (`13`), a negative number, and an object whose values
 * are numbers (`{ d37: 55, p68: 48 }` — one ratchet per key, `check-audit-closure.ts`). Anything else —
 * a call, a `.length`, a sum, an identifier — is a derivation, because the failure is not `Object.keys`
 * specifically; it is that the bound moved with its subject.
 *
 * Usage: npm run lint:cap-literals
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { assertScanFloor, scanNote, scanned } from './lib/scanFloor';
import { stripCommentsOnly } from './lib/stripCode';

const REPO_ROOT = join(import.meta.dirname, '..');
const SCAN_GATE = 'cap-literals';

/**
 * ⛔ **THE POPULATION IS A DIRECTORY WALK, NOT A LIST.** An enumeration of gate files is the same shape
 * as the defect it guards: a new gate nobody remembers to add is silently uncapped.
 *
 * ⚠️ **A WALK RATHER THAN `git ls-files`, and the reason is that this gate has to be plantable.** A
 * planted file is by definition untracked, so an index-derived population cannot see one — the gate would
 * report ✅ over a derived cap sitting on disk, which is `run-the-control-on-the-verifier`: a "not caught"
 * produced by the checker never having read the subject. An uncommitted gate is a gate either way.
 */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(abs));
    else if (e.name.endsWith('.ts')) out.push(relative(REPO_ROOT, abs).split(sep).join('/'));
  }
  return out;
}
const files = walk(join(REPO_ROOT, 'scripts'));

/** `const MAX_FOO = <rhs>;` / `const MIN_FOO: number = <rhs>;`, `export` optional. */
/**
 * ⛔ **S1.12.5.4 [pass-5 `D5-9`] — THIS WAS MATCHED PER LINE, AND A LINE WRAP DEFEATED IT.**
 *
 * ⚡ Lane D planted the exact `D4-4` shape — a cap derived from the population it caps — on one line, and
 * the gate redded correctly. Then planted the **identical derivation wrapped onto two lines**: exit 0,
 * `✅ … 17 downward-only cap(s)`. The wrap did not merely hide the derivation; it removed the declaration
 * from the gate's population, and the tick was printed beside a count that had silently fallen from 18.
 *
 * ⛔ **So what a formatter does unprompted to a long declaration blinded the one gate standing between
 * this repo and a class it records being hit twice in a single file.** The next `D4-4` would arrive as a
 * prettier reflow rather than as an edit anyone reviews.
 *
 * ⚠️ `[\s\S]*?` so the right-hand side may cross newlines; `m` anchors `^`/`$` per line so the `;`
 * terminator still ends the declaration; `g` because the whole file is scanned at once now.
 *
 * ⚠️ **The terminator is `;[ \t\r]*$`, not `;$`**, and the difference is not cosmetic: `stripCommentsOnly`
 * blanks a comment in place, so a declaration line ends in `;` followed by the spaces the comment used to
 * occupy and a `\r`. With a bare `;$` the lazy match ran PAST the real terminator to the next line ending
 * in `;` — measured, and it reported four false derived ratchets on the first run.
 */
const DECL = /^[^\S\n]*(?:export\s+)?const\s+((?:MAX|MIN)_[A-Z0-9_]+)\s*(?::[^=;]+)?=\s*([\s\S]*?);[ \t\r]*$/gm;

/** A number, or an object literal whose every value is a number. Anything else moved with its subject. */
const isLiteral = (rhs: string): boolean => {
  const t = rhs.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return true;
  const obj = /^\{([^}]*)\}$/.exec(t);
  if (!obj) return false;
  return obj[1]
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .every((p) => /^[A-Za-z_$][\w$]*\s*:\s*-?\d+(\.\d+)?$/.test(p));
};

const problems: string[] = [];
let caps = 0;

for (const rel of files) {
  const text = readFileSync(join(REPO_ROOT, rel), 'utf8');
  // ⚠️ Comments are blanked first: this file's own docblock quotes the exact derived declaration it
  // exists to refuse, and a gate that reds on the sentence describing a defect is a gate nobody keeps.
  const code = scanned(SCAN_GATE, stripCommentsOnly(text));
  // ⛔ D5-9 — over the whole file, not line by line: a declaration wrapped onto two lines used to leave
  // the population entirely, and the gate printed a smaller count beside a ✅.
  for (const m of code.matchAll(DECL)) {
    caps++;
    if (isLiteral(m[2])) continue;
    problems.push(
      `${rel} — ${m[1]} is ${JSON.stringify(m[2].trim())}, not a literal.\n` +
        '        A cap computed from the population it caps agrees with whatever it is handed: the\n' +
        '        comparison becomes `n > n` and the ratchet stops existing. Write the number.',
    );
  }
}

/**
 * ⛔ **A COUNT OF THE CAPS THEMSELVES**, because a gate that finds nothing to check reports the same ✅
 * as a gate that checked everything — the `lint:scan-floors` lesson, applied to this file's own subject.
 *
 * ⛔ **S1.12.5.4 [pass-5 `D5-9`] — PINNED WITH `!==`, AND IT USED TO BE A FLOOR WITH THREE UNITS OF SLACK.**
 *
 * ⚡ At `MIN_CAPS = 15` against 18 observed, a declaration LEAVING the population was absorbed silently:
 * lane D wrapped a derived cap onto two lines, the count fell to 17, and the gate printed **`✅ … 17
 * downward-only cap(s)`**. A floor sees a collapse; it cannot see one member walk away — the same shape
 * as `D5-13`'s `MIN_POPULATION` and `D5-12`'s runner list, all three found in this round.
 *
 * ⚠️ **The two-line-edit friction is deliberate.** `check-finding-guards.ts`'s `MIN_ENTRIES` documents it
 * as a feature: adding a cap costs a number here, and that is the moment the addition is visible.
 */
// ⚠️ 26 → 27 at S1.13.7.12.3c: `MAX_SERVER_ATTEMPTS` in `prove-guards.ts`, the [D78] retry cap.
/**
 * ⚠️ 27 → 28 at S1.13.7.12.6 for `MAX_JOIN` in `lib/logicalLines.ts`, then **28 → 27 in the same sub-step**
 * when the class-1 re-audit's `N-1` showed the flattening it bounded was inert and the whole mechanism was
 * deleted. ⛔ **The cap did not stop being seen — it stopped existing**, which is the one honest reason to
 * lower a pinned count, and the gate refused the tree until this line moved.
 */
// ⚠️ 27 → 28 at S1.13.7.12.6 round 4: `MAX_UNREVIEWED` in `test-wrap-escapes.ts`, pinning the census's
// unreviewed list so it can only shrink (`N-10` — it could previously grow with the run still green).
const MIN_CAPS = 28;

if (caps !== MIN_CAPS) {
  problems.push(
    `${caps} cap constant(s) found; MIN_CAPS is ${MIN_CAPS}, and this is PINNED rather than floored. ` +
      (caps < MIN_CAPS
        ? 'A declaration LEFT the population — the pattern stopped matching it, or the walk stopped ' +
          'reaching its file. A cap this gate cannot see is a cap that can be derived from its own list.'
        : `A cap was added: raise MIN_CAPS to ${caps} in the same edit, so the next departure reds.`),
  );
}

if (problems.length) {
  console.error(`\n❌ cap literals: ${problems.length} derived ratchet(s).\n`);
  for (const p of problems) console.error(`  • ${p}`);
  console.error('\n  [D4-4]: a cap derived from the list it caps can never be exceeded.\n');
  process.exit(1);
}

const observedScan = assertScanFloor(SCAN_GATE);
console.log(
  `✅ cap literals: ${caps} downward-only cap(s) across ${files.length} scripts are literals.` +
    `${scanNote(SCAN_GATE, observedScan)}`,
);
