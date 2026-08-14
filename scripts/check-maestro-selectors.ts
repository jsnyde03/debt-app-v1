/**
 * 4.1.4 — THE SELECTOR GUARD. A Maestro flow is a claim about the app kept somewhere the app never
 * checks, and this lane has now been bitten by that three separate ways:
 *
 *  ① **Stale.** `b67cf5d` deleted "Try with Sample Data" and `A10.1` replaced Money's three Add rows;
 *    both updated the app and left the flows behind. The suite was broken for two days and reported
 *    NOTHING, because a manual-dispatch lane that nobody runs is green by never running.
 *  ② **Lying.** `tapOn` and `inputText` report COMPLETED whether or not they land. Flow 07 walked four
 *    commands past a tap that missed and concatenated three values into one field — the run "passed"
 *    those steps and died three steps later somewhere unrelated.
 *  ③ **Fragmentary.** Maestro matches literal equality or a FULL regex, never contains. A bare selector
 *    aimed at a composed `accessibilityLabel` can never match; it needs `.*` on both ends.
 *
 * Three enforced checks and one advisory, below. Everything here is decidable from source — where a
 * judgement would be needed, it advises rather than failing, because a guard that cries wolf gets
 * suppressed and then ① happens again with a straight face.
 *
 * Usage: npm run lint:selectors   ·   runs inside `lint:rn` → `validate:release:rn`
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml') as { load: (s: string) => unknown };

const REPO_ROOT = join(import.meta.dirname, '..');
const FLOW_DIR = join(REPO_ROOT, 'apps', 'rn', '.maestro');
const SRC_DIRS = [join(REPO_ROOT, 'apps', 'rn', 'src'), join(REPO_ROOT, 'packages', 'core')];

function walk(dir: string, out: string[] = [], exts = ['.ts', '.tsx']): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out, exts);
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}

const sourceText = SRC_DIRS.flatMap((d) => walk(d)).map((f) => readFileSync(f, 'utf8')).join('\n');
// ⚠️ `testID=` is not the only way an id reaches the tree. react-navigation sets the tab buttons with
// `tabBarButtonTestID: 'tab-money'` (`(tabs)/_layout.tsx:92`) — an object property, not a JSX prop. The
// first version of this guard flagged `tab-money` as unknown in four flows that demonstrably tap it and
// pass. A guard whose first output is four false positives on the most-used id in the suite is one that
// gets switched off, so both spellings count.
// ⚠️ And an id can be CHOSEN rather than written: `testID={ok ? 'a-ok' : 'a-off'}` puts the verdict of a
// check into the id, which is how 4.1.5.2's ring audit is asserted without the flow needing to read
// numbers. Both patterns above require a quote immediately after `=`, so an expression container matched
// neither and the guard's first output was three false positives on ids that were plainly in the source.
// Same failure as the `tabBarButtonTestID` case this file already carries — the guard was right that it
// could not see them and wrong about what that meant.
// ⚠️ Scope: quoted literals inside the container only. A template-literal id (`testID={`row-${id}`}`) is
// composed at runtime and is not something this check can verify — `[^}]` stops at its first `}` and the
// literal is skipped, which is the correct outcome rather than a missed case.
const testIDExpressions = [...sourceText.matchAll(/testID=\{([^}]*)\}/g)].map((m) => m[1]);
const knownTestIDs = new Set([
  ...[...sourceText.matchAll(/testID=["'`]([^"'`]+)["'`]/g)].map((m) => m[1]),
  ...[...sourceText.matchAll(/[Tt]estID["']?\s*[:=]\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]),
  ...testIDExpressions.flatMap((expr) => [...expr.matchAll(/["']([^"']+)["']/g)].map((m) => m[1])),
]);
/**
 * Source with all whitespace collapsed, for "does this copy still exist".
 *
 * ⚠️ Matching discrete string LITERALS was wrong: JSX text children wrap across lines, so
 * `".*count toward your debt-free date.*"` — which is in the app — read as stale. Searching one
 * whitespace-normalised blob finds copy however the file happens to be formatted.
 */
const normalizedSource = sourceText.replace(/\s+/g, ' ');

/**
 * Components that build one utterance from two values — their labels can only be matched with `.*`.
 *
 * ⚠️ The first pattern here required the template to follow `accessibilityLabel={` immediately, and so
 * MISSED `SettingRow`, whose label is `{subtitle ? `${label}. ${subtitle}` : label}` — the exact
 * component whose composed label broke flow 08 and prompted this guard. An advisory that omits the case
 * that motivated it is worse than none. Now: the file mentions `accessibilityLabel` anywhere AND
 * contains a `${a}. ${b}` template anywhere.
 */
const composedLabelFiles = SRC_DIRS.flatMap((d) => walk(d))
  .filter((f) => {
    const t = readFileSync(f, 'utf8');
    return t.includes('accessibilityLabel') && /`\$\{[^}]+\}\.\s*\$\{/.test(t);
  })
  .map((f) => relative(REPO_ROOT, f).split(sep).join('/'));

type Problem = { flow: string; kind: string; detail: string };
const problems: Problem[] = [];
const advisories: Problem[] = [];

const flowFiles = readdirSync(FLOW_DIR).filter((f) => f.endsWith('.yaml')).sort();

/** Everything the suite types into the app — its own seed data, which app source cannot contain. */
const seededValues = new Set(
  flowFiles.flatMap((f) => [...readFileSync(join(FLOW_DIR, f), 'utf8').matchAll(/^- inputText:\s*["']?([^"'\n]+)["']?/gm)].map((m) => m[1].trim())),
);

for (const name of flowFiles) {
  const raw = readFileSync(join(FLOW_DIR, name), 'utf8');
  const docs = raw.split(/^---$/m);
  const steps = (yaml.load(docs[docs.length - 1]) ?? []) as unknown[];
  if (!Array.isArray(steps)) continue;

  /** `- tapOn: "x"` · `- tapOn: {id: x}` · `- assertVisible: {text: x}` → the selector's shape. */
  const selectorsOf = (step: unknown): { id?: string; text?: string }[] => {
    if (typeof step !== 'object' || !step) return [];
    const out: { id?: string; text?: string }[] = [];
    for (const v of Object.values(step as Record<string, unknown>)) {
      if (typeof v === 'string') out.push({ text: v });
      else if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        // ⛔ ONE entry carrying both, not two entries carrying one each. Emitting them separately made
        // `s.id && s.text` unsatisfiable, so the write-verification check below could never clear and
        // reported both typing flows as unverified — a confident, specific, entirely fabricated finding
        // from the guard built to stop exactly that.
        const sel: { id?: string; text?: string } = {};
        if (typeof o.id === 'string') sel.id = o.id;
        if (typeof o.text === 'string') sel.text = o.text;
        if (sel.id || sel.text) out.push(sel);
        if (o.visible || o.notVisible) out.push(...selectorsOf({ x: o.visible ?? o.notVisible }));
      }
    }
    return out;
  };

  let pendingInput: number | null = null;
  steps.forEach((step, i) => {
    const cmd = typeof step === 'string' ? step : Object.keys(step as object)[0];
    // ⚠️ Not every string argument is a selector. `takeScreenshot: maestro-debug/s13-…` is an output
    // PATH, and `inputText: "2400"` is data the flow is about to create — neither can exist in app
    // source, and flagging them made the first run unreadable.
    // ⚠️ 4.1.5.5 added three more, all found the same way this list was found in the first place — by a
    // guard producing confident false positives on the first flow to use a command. `setOrientation:
    // LANDSCAPE_LEFT` is an ENUM, and `evalScript`/`assertTrue` carry JS expressions; none of the three
    // can exist in app source, and reporting them as stale copy is the guard failing, not the flow.
    // ⛔ `repeat` is deliberately NOT here despite also taking a non-selector argument — it NESTS real
    // commands, so excluding it would silently drop every selector inside the loop from all three checks.
    if (
      cmd === 'takeScreenshot' ||
      cmd === 'inputText' ||
      cmd === 'openLink' ||
      cmd === 'runScript' ||
      cmd === 'setOrientation' ||
      cmd === 'evalScript' ||
      cmd === 'assertTrue'
    ) {
      if (cmd === 'inputText') pendingInput = i;
      return;
    }

    for (const sel of selectorsOf(step)) {
      // ① ids must exist in app source.
      if (sel.id && !knownTestIDs.has(sel.id) && !/^\$\{/.test(sel.id)) {
        problems.push({ flow: name, kind: 'unknown-testID', detail: `id "${sel.id}" is in no testID in app source` });
      }
      // ② copy must still exist in app source (staleness).
      if (sel.text) {
        const bare = sel.text.replace(/^\.\*|\.\*$/g, '').replace(/\\\./g, '.').replace(/\s+/g, ' ');
        const looksRegex = /[\^\$\[\]\(\)\|\+]/.test(bare);
        // ⚠️ Two kinds of selector are legitimately absent from source, and failing on them would make
        // this guard noise. Text the FLOWS type in (`Visa Test`, `Mortgage`) is data the suite creates —
        // conveniently, exactly the set of `inputText` values. And text the app BUILDS from a template
        // ("Step 4 of 7" from `Step ${n} of ${total}`) never appears whole; digits are the tell, so
        // those advise rather than fail.
        // ⚠️ CONTAINMENT RUNS BOTH WAYS, and checking only one direction was a third false-positive
        // class (2026-08-14, flow 10). A flow may assert a PREFIX of what it typed: §11.9 types a
        // 64-character debt name and asserts `.*Chase Sapphire Preferred.*`, because the row renders the
        // name inside a longer composed utterance and Maestro needs a contains-regex. `bare.includes(v)`
        // is false there — the selector is shorter than the seeded value, not longer.
        const isSeeded = [...seededValues].some((v) => bare.includes(v) || v.includes(bare));
        const isTemplated = /\d/.test(bare);
        if (!looksRegex && !isSeeded && bare.length > 2 && !normalizedSource.includes(bare)) {
          const p = { flow: name, kind: 'stale-copy', detail: `text ${JSON.stringify(sel.text)} appears nowhere in app source` };
          (isTemplated ? advisories : problems).push(p);
        }
        // ③ a BARE selector must be a node's ENTIRE text. Advisory: it cannot be decided from source
        //    whether the target's label is composed, so this names the risk instead of failing on it.
        if (!sel.text.startsWith('.*') && !looksRegex && composedLabelFiles.length) {
          advisories.push({ flow: name, kind: 'bare-selector', detail: `${JSON.stringify(sel.text)} must be a node's ENTIRE text — wrap in .* if it is a fragment` });
        }
      }
    }

    // ④ a flow that TYPES must write-verify at least once.
    //
    // ⚠️ THIS IS WEAKER THAN "every input is verified", and the difference was measured rather than
    // assumed: removing flow 01's `^Visa$` assertion did NOT turn this red, because a later verification
    // in the Money sheet cleared the same pending flag. So it catches a flow that verifies NOTHING —
    // the state all eight were in this morning — and not a single missing assertion inside a flow that
    // verifies elsewhere.
    // Strengthening it means scoping the flag per form (clear only on an assertion naming a field tapped
    // since the last submit), which also makes single-field steps like the paycheck screen red until they
    // gain assertions. That is a real follow-up, not a silent one → filed with 4.1.4 in the plan.
    if (pendingInput !== null && cmd === 'assertVisible' && selectorsOf(step).some((s) => s.id && s.text)) pendingInput = null;
    if (pendingInput !== null && (cmd === 'launchApp' || cmd === 'killApp')) {
      problems.push({ flow: name, kind: 'no-write-verification', detail: `this flow types before a relaunch but never asserts what landed` });
      pendingInput = null;
    }
  });
  if (pendingInput !== null) {
    problems.push({ flow: name, kind: 'no-write-verification', detail: `this flow types but never asserts what landed — tapOn and inputText report COMPLETED even when they land nowhere` });
  }
}

if (advisories.length) {
  console.log(`\nℹ️  ${advisories.length} bare text selector(s). Composed-label components exist here, so a bare`);
  console.log(`   string only matches a node whose ENTIRE text it is:`);
  for (const f of composedLabelFiles) console.log(`     ${f}`);
}

if (problems.length) {
  console.error(`\n❌ maestro selectors: ${problems.length} problem(s).\n`);
  for (const p of problems) console.error(`  [${p.kind}] ${p.flow}\n      ${p.detail}`);
  console.error('\n  A flow is a claim about the app kept where the app never checks it. Fix the flow, or');
  console.error('  the app, but do not leave the claim.\n');
  process.exit(1);
}
console.log(`✅ maestro selectors: ${flowFiles.length} flows · ${knownTestIDs.size} testIDs known · no stale ids or copy.`);
