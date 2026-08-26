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
const REGISTRY = join(REPO_ROOT, 'scripts', 'finding-guards.json');

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
function present(text: string, token: string): boolean {
  if (!/^[\w$]+$/.test(token)) return text.includes(token);
  return new RegExp(`(?<![\\w$])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w$])`).test(text);
}

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8')) as Record<string, Entry>;
const ids = Object.keys(registry);

/**
 * ⛔ **BOTH FLOORS MOVE ONE WAY ONLY.** `MIN_ENTRIES` may only rise — a finding dropping out of the
 * registry is how a closure stops being tracked. `MAX_UNGUARDED` may only fall — it is the S0.13 backlog
 * draining. ⚠️ Raising `MAX_UNGUARDED` to make a run pass is the defect this file exists to catch.
 */
const MIN_ENTRIES = 24;
const MAX_UNGUARDED = 16;

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
  if (!present(readFileSync(abs, 'utf8'), e.token)) {
    problems.push(
      `${id} — the guard is gone from ${e.file}: no ${JSON.stringify(e.token)}  (${e.what})\n` +
        '        the file survived; the assertion inside it did not, which is the shape this gate exists for',
    );
    continue;
  }
  guarded++;
}

if (ids.length < MIN_ENTRIES) {
  problems.push(
    `the registry holds ${ids.length} findings; ${MIN_ENTRIES} are expected. Entries were REMOVED — ` +
      'a finding dropping out is how a closure stops being tracked. Do not lower the floor.',
  );
}
if (unguarded.length > MAX_UNGUARDED) {
  problems.push(
    `${unguarded.length} findings are unguarded; the cap is ${MAX_UNGUARDED} and it only ever goes DOWN. ` +
      'Raising it to make this pass is the defect this gate exists to catch.',
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
