/**
 * User-facing STRINGS INVENTORY — the input artifact for the wording/voice gate.
 *
 * The gate's job is "every user-facing string, both tiers, all states, against the house voice." Run the
 * obvious way — agents reading the codebase — that costs a fan-out over ~400 files per lens, and the
 * portfolio has already measured what that buys: Hearthlight's eight adversarial rounds produced "one
 * good cut, two tests worth keeping, and then recurrence", and Debt's Law IV found 2 of 4 agent-stated
 * mechanisms wrong while all 4 recommendations were sound. Reading is the expensive half and the weak
 * half.
 *
 * So this changes the gate's INPUT from "the codebase" to "a table". One reviewer over a compact,
 * complete list beats N readers crawling source, and it costs a few seconds instead of a session.
 *
 * ⛔ IT MUST NOT SILENTLY UNDER-REPORT. An inventory that quietly drops a prop would let the gate pass
 * while a surface went unread — the same shape as a green suite that never ran, which this repo has
 * shipped more than once. So strings are sorted into THREE buckets, never two: known copy props, known
 * technical props, and **everything else, reported as `unclassified`**. A prop nobody has classified
 * shows up as work to do rather than as silence. Same reason this parses the TypeScript AST instead of
 * regexing: `title={isEdit ? 'Edit debt' : 'Add a debt'}` has two strings in it, and a regex finds at
 * most one.
 *
 * Usage: npm run audit:strings   → docs/audits/strings-inventory.{md,json}
 */
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';
import ts from 'typescript';

const REPO_ROOT = join(import.meta.dirname, '..');
/** RN src is the app's copy. `packages/core` carries notification + Guardian strings, so it counts too. */
const ROOTS = [join(REPO_ROOT, 'apps', 'rn', 'src'), join(REPO_ROOT, 'packages', 'core')];
const EXTS = new Set(['.ts', '.tsx']);

/** JSX attributes whose string value is read by a human. */
/**
 * Non-JSX contexts that ARE copy, promoted after reading them: `key:label` is "Monthly" / "Every 2
 * weeks", `key:title` is "PAID OFF", `key:body` is "your financial data stays on your device.",
 * `call:setError` is every validation message, and `return` is "a while ago" / "Today" / "Tomorrow".
 * None of these live in a JSX attribute, and all of them are read by a user.
 */
const COPY_ORIGINS = new Set([
  'key:label', 'key:title', 'key:body', 'key:subtitle', 'key:heading', 'key:message', 'key:caption',
  'key:hint', 'key:description', 'key:cta', 'key:empty', 'key:note',
  'call:setError', 'return', 'key:detail', 'key:action', 'call:groupLabel', 'key:summary', 'key:headline',
  // W2 — promoted after MEASURING what was sitting in `unclassified`, not by guessing which props sound
  // copy-ish. Each was read at its site before being listed:
  //   `key:periodLabel`  paywall "per year" / "one time" / "per month" — and this one is why W1's triage
  //                      was structurally incomplete: unclassified strings never reach the duplicate list.
  //   `key:badge`        "Best value" · "Pay once"        `key:subnote`   "Billed yearly · just $2.50/mo"
  //   `key:meta`         "· Variable" · "Emergency fund"  `key:text`      the premium feature lines
  //   `key:beat`         the demo's narration            `key:safeMove`  Guardian instructions
  //   `key:countdownLabel` "in 2 days" / "Tomorrow"       `key:sublabel`  "e.g. 1st & 15th"
  //   `var:ISSUERS`      "American Express" — a user-facing picker, not an enum
  //   `var:AUTO_RENEW_DISCLOSURE` the App-Store-required subscription legal text
  'jsx-expr', 'key:periodLabel', 'key:badge', 'key:subnote', 'key:meta', 'key:text', 'key:beat',
  'key:safeMove', 'key:countdownLabel', 'key:sublabel', 'var:ISSUERS', 'var:AUTO_RENEW_DISCLOSURE',
]);

const COPY_PROPS = new Set([
  'label', 'title', 'subtitle', 'heading', 'header', 'caption', 'body', 'description', 'message',
  'placeholder', 'submitLabel', 'confirmLabel', 'cancelLabel', 'removeLabel', 'actionLabel',
  'buttonLabel', 'primaryLabel', 'secondaryLabel', 'cta', 'ctaLabel', 'emptyText', 'helperText',
  'errorText', 'footnote', 'note', 'tagline', 'text', 'value', 'unit', 'suffix', 'prefix',
  'accessibilityLabel', 'accessibilityHint',
]);

/** Attributes whose string value is machinery. Listed so that "not copy" is a DECISION, not a default. */
const TECHNICAL_PROPS = new Set([
  'testID', 'id', 'key', 'nativeID', 'style', 'className', 'source', 'uri', 'href', 'to', 'path',
  'route', 'pathname', 'color', 'backgroundColor', 'tintColor', 'fill', 'stroke', 'size', 'variant',
  'type', 'mode', 'themeMode', 'direction', 'keyboardType', 'autoComplete', 'textContentType',
  'returnKeyType', 'autoCapitalize', 'accessibilityRole', 'accessibilityViewIsModal', 'icon',
  'iconName', 'symbol', 'name', 'fontFamily', 'fontWeight', 'resizeMode', 'contentFit', 'entering',
  'exiting', 'sharedTransitionTag', 'layout', 'behavior', 'presentationStyle', 'animationType',
  'keyboardDismissMode', 'keyboardShouldPersistTaps', 'testProp', 'format', 'locale', 'timeZone',
]);

/**
 * Contexts whose strings are machinery, established by READING them (see the counts in each comment,
 * measured on the first full sweep). Listed rather than filtered silently: the generated report prints
 * this set, so an exclusion is a claim someone can challenge, not an absence nobody can see.
 */
const TECHNICAL_ORIGINS = new Set([
  'call:console.log',
  'call:getState().show', // coach-mark ids
  'key:name', // analytics event names — demo_started, autopay_expense
  'key:id', 'key:kind', 'key:category', 'key:value', 'key:recurrence', 'key:icon',
  'key:light', 'key:dark', // theme hex pairs
  'key:justifyContent', 'key:alignItems', 'key:flexDirection', 'key:textAlign', 'key:position',
  'key:fontFamily', 'key:fontWeight', 'key:overflow', 'key:resizeMode',
  'prop:onPress', 'prop:onBack', 'prop:onDemo', 'prop:onSeeForecast', // route paths in handlers
  'prop:colors', 'prop:ctaTestID', 'prop:getComponent', 'prop:previewConfig', 'prop:pointerEvents',
  'key:fontVariant', 'key:grad', 'key:categories', 'key:alignSelf', 'call:sumCategory', 'key:reason',
]);

type Entry = {
  text: string;
  file: string;
  line: number;
  /** `jsx-text` · `prop:<name>` · `alert` · `call:<fn>` · `key:<prop>` · `return` · `array` · `expr` */
  origin: string;
  bucket: 'copy' | 'technical' | 'unclassified';
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'testing' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    // ⚠️ TWO test-file conventions live here, and missing either floods the report. `apps/rn` uses
    // `*.test.ts` INSIDE `src/` (`src/store/coachMarks.test.ts`), so excluding a `tests/` directory is
    // not enough; `packages/core` uses `testXxx.ts` (`cashflow/testDetectCrunches.ts`), which is not a
    // `.test.` file at all. Between them they contributed ~1,600 assertion labels — "no crunch when all
    // >= floor" — drowning the real copy on the first full sweep.
    else if (
      EXTS.has(extname(p)) &&
      !p.endsWith('.d.ts') &&
      !/\.test\.tsx?$/.test(p) &&
      !/[\\/]test[A-Z][^\\/]*\.tsx?$/.test(p) &&
      !p.includes(`${sep}tests${sep}`)
    ) out.push(p);
  }
  return out;
}

/**
 * Every string literal under `node` — so `title={isEdit ? 'Edit debt' : 'Add a debt'}` yields BOTH
 * branches rather than the first, which is the whole reason this parses instead of regexing.
 *
 * ⛔ It stops at nested JSX, and that is not an optimisation. Node-valued props like
 * `ctas={<Button label="Continue" />}` contain their own JSX attributes, and the main walker visits
 * those independently — harvesting them here too counted the same string twice, once under `prop:ctas`
 * and once under `prop:label`. Measured on the first run: 110 "unclassified" strings, most of them
 * duplicates of copy already captured correctly. An inventory that over-reports is as useless for
 * review as one that under-reports; it just fails in the direction that looks thorough.
 * Object literals are still descended into — `options={[{ label: 'Debt' }]}` is real copy that appears
 * nowhere else.
 */
function literalsIn(node: ts.Node): ts.Node[] {
  const found: ts.Node[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) return;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) found.push(n);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

/**
 * W2 — a value that is an IDENTIFIER, not a sentence. Two shapes, both measured before being written:
 *
 *  - **kebab / snake tokens, all lowercase** — `at-risk`, `autopay_expense`, `space-between`,
 *    `decimal-pad`, `chevron-right`, `debt-row-actions`. **444 of the 946 unclassified**, and the reason
 *    the copy bucket had `return "at-risk"` in it: `return` is a legitimate copy origin ("Today",
 *    "a while ago") and the enum values ride in on it.
 *  - **hex and `rgba()` colours** — 79 of them, six of which had reached `copy` because
 *    `CashFlowSection`'s `barTone()` returns `{ grad, glow, label }` and `label` holds a chart tone.
 *
 * ⚠️ **Case is the whole discriminator, and it is load-bearing.** `one-time` is the enum value;
 * `"One-time"` is the label a user reads. `at-risk` is a `GuardianState`; a capitalised or spaced variant
 * would not match here. Verified against the bucket diff at W2.4 rather than asserted — every string this
 * moved out of `copy` was read.
 */
function isIdentifierValue(t: string): boolean {
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return true;
  if (/^rgba?\([\d\s.,%]+\)$/.test(t)) return true;
  return /^[a-z][a-z0-9]*([-_][a-z0-9]+)+$/.test(t);
}

/**
 * ⛔ **The identifier rule needs ONE exemption, and the bucket diff is what found it.** A literal
 * interpolated into a template is part of a sentence, whatever it looks like on its own:
 * `` `next milestone ${nextT === 100 ? 'debt-free' : `${nextT}%`}` `` is a VoiceOver label
 * (`progress.tsx:151`), and the shape rule had silently dropped it while correctly dropping the
 * `PlanState` enum value `'debt-free'` two files away.
 *
 * ⚡ So the discriminator is **context, not shape** — the same principle as `jsx-expr` above. `return
 * "at-risk"` is the whole value and is machinery; a token spliced into prose is prose. Verified by
 * reading every string the rule moved in both directions, which is the only reason this is here: a
 * count moving is not evidence a rule is right.
 */
function insideTemplate(node: ts.Node): boolean {
  for (let n: ts.Node | undefined = node.parent, hops = 0; n && hops < 5; hops++, n = n.parent) {
    if (ts.isTemplateExpression(n) || ts.isTemplateSpan(n)) return true;
  }
  return false;
}

/**
 * A value that is an identifier AND is not spliced into rendered prose.
 *
 * ⚠️ `jsx-text` is exempt for the SAME reason templates are, and it took a second pass to see it: JSX
 * text is split around every `{}` interpolation, so
 * `Plus {total} in {n} one-time {n === 1 ? 'bill' : 'bills'} — not part of your ongoing reserve.`
 * yields the bare fragment `one-time`, which is indistinguishable from the enum by shape and is plainly
 * prose by position. **Text between tags is rendered text; nothing about its shape can override that.**
 */
function isNonCopyValue(text: string, node: ts.Node, origin?: string): boolean {
  if (origin === 'jsx-text') return false;
  return isIdentifierValue(text.trim()) && !insideTemplate(node);
}

/**
 * Does this string LOOK like machinery? Used to keep a MIXED prop honest: a prop may be declared
 * technical and still carry real copy (`onPress={() => Alert.alert('Delete this debt?', …)}`), so the
 * exclusion is applied per-VALUE. Deliberately conservative — anything not obviously machinery stays
 * visible, because a machinery string wrongly reviewed costs a moment and a copy string wrongly excluded
 * ships unreviewed. Audit 2026-08-17 · L6-1.
 */
function isMachineryValue(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.startsWith('/')) return true;                    // route paths — '/money', '/living-expenses'
  if (/^[a-z0-9]+(?:[.:_-][a-z0-9]+)+$/i.test(t)) return true; // storage keys, event ids, dotted handles
  if (/^#[0-9a-f]{3,8}$/i.test(t)) return true;          // colours
  if (!/\s/.test(t) && !/[.!?]/.test(t)) return true;    // single tokens with no sentence punctuation
  return false;                                          // has spaces or sentence punctuation → prose
}

/** Punctuation, single glyphs and format fragments are not copy to review. */
function isReviewable(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return false;
  if (!/[a-zA-Z]/.test(t)) return false;
  if (/^[a-z][a-zA-Z0-9]*$/.test(t) && t.length < 12) return false; // camelCase identifiers
  return true;
}

/**
 * The ONE way a call label is built. ⚠️ There were two — this and the walk-up in `originOf` below — and
 * they disagreed, so normalising one left four raw-source labels standing (audit L6-10). A label is an
 * IDENTITY: if it varies with formatting it is not one. Collapse whitespace, drop everything from the
 * first bracket (so an inline array or options object never lands in the name), cap the length.
 */
function calleeLabel(expr: ts.Node, sf: ts.SourceFile): string {
  const raw = expr.getText(sf).replace(/\s+/g, ' ').replace(/^new\s+/, '').split(/[({[]/)[0].trim();
  const name = raw.split('.').slice(-2).join('.').slice(0, 40);
  return `call:${name || 'anonymous'}`;
}
/**
 * A label for WHERE an uncaptured string sits, so rule ④'s output is reviewable by context instead of
 * one string at a time. `call:setError` is a judgement anyone can make once; 300 loose strings are not.
 */
function originOf(node: ts.Node, sf: ts.SourceFile): string {
  const p = node.parent;
  if (!p) return 'other';
  if (ts.isCallExpression(p)) {
    // ⚠️ `getText()` returns RAW SOURCE, so a multi-line call produced a label containing newlines and
    // whole argument objects — four of them, which cannot be used as list keys and, worse, silently mint
    // a NEW unclassified origin the moment anyone reformats the file (audit 2026-08-17 · L6-10). The
    // label is an identity, so it is normalised to one: collapse whitespace, drop everything from the
    // first bracket, and cap the length.
    return calleeLabel(p.expression, sf);
  }
  if (ts.isPropertyAssignment(p)) return `key:${p.name.getText(sf)}`;
  if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) return `var:${p.name.getText(sf)}`;
  if (ts.isReturnStatement(p)) return 'return';
  // ⚠️ `array` / `expr` / `other` were useless labels — 658 strings under three names nobody could
  // judge. A string inside an array inside `const ANALYTICS_EVENTS = [...]` is obviously machinery once
  // you can SEE that it is in `ANALYTICS_EVENTS`, and unjudgeable while it is called "array". So walk up
  // to the nearest thing with a name; the label is only worth having if it supports a decision.
  let n: ts.Node | undefined = p;
  for (let hops = 0; n && hops < 6; hops++, n = n.parent) {
    if (ts.isPropertyAssignment(n)) return `key:${n.name.getText(sf)}`;
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) return `var:${n.name.getText(sf)}`;
    if (ts.isCallExpression(n)) return calleeLabel(n.expression, sf);
    if (ts.isPropertyDeclaration(n) || ts.isFunctionDeclaration(n)) break;
  }
  // W2 — LAST RESORT, and only once every named context above has failed: a literal sitting inside a JSX
  // expression container is text the user reads. `{onboarded ? "You're all set" : 'Your plan is ready…'}`
  // has no property, variable or call to name it, so it landed in `other` — together with the Guardian's
  // "Payment logged — I updated your balance." **The house-voice rule is the one thing the wording gate
  // exists to check, and its input could not see the Guardian's own first person.**
  //
  // ⚠️ Ordering is what makes this safe rather than a flood. Technical props are skipped by rule ② and
  // reach the sweep, but their literals resolve to `key:justifyContent` / `key:fontFamily` above and
  // never get here; only a literal with NO named context at all falls this far.
  for (let n: ts.Node | undefined = p, hops = 0; n && hops < 4; hops++, n = n.parent) {
    if (ts.isJsxExpression(n)) return 'jsx-expr';
  }
  return 'other';
}

/**
 * T3 — copy that CHANGES based on a condition, paired with the condition it changes on.
 *
 * The audit gate carries two filed sweeps of one shape: copy that asserts an OUTCOME while being gated
 * on something that merely CORRELATES with it (3.7.A3.1's proxy gate, 3.7.A3.6's capped outcome). On
 * 2026-08-12 the native lane found a live instance — `DebtSheet` said **"Add from scan"** whenever
 * `prefill` was truthy, which stopped meaning "scanned" the moment A10 gave `prefill` a second producer.
 * Two audit passes and three green web specs had missed it.
 *
 * ⛔ A script cannot judge whether a gate is a proxy — that is a semantic question about what the words
 * claim. What it CAN do is put the condition next to the copy it controls, turning "read 400 files and
 * notice" into "read N pairs and ask: is this gate the thing the copy is about?" The defect above reads,
 * in one line, as `prefill → "Add from scan" / "Add a debt"`.
 *
 * Nested chains decompose naturally because each `?:` is recorded separately and branch collection stops
 * at the next one — so `isEdit ? … : convertingExpenseId ? … : prefill ? …` yields three judgeable pairs
 * rather than one unreadable blob.
 */
type Conditional = { file: string; line: number; condition: string; whenTrue: string[]; whenFalse: string[] };
const conditionals: Conditional[] = [];

/** Immediate string branches only — stop at nested JSX (visited on its own) and at the next ternary. */
function branchLiterals(node: ts.Node): string[] {
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) return;
    if (ts.isConditionalExpression(n) && n !== node) return;
    if (
      (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) &&
      isReviewable(n.text) &&
      // T3 asks "does this gate establish what the copy claims?" — a branch that selects an ENUM is not
      // a copy decision, so the same rule applies here or the table fills with `'at-risk' / 'tight'`.
      !isNonCopyValue(n.text, n)
    ) out.push(n.text.trim());
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

const entries: Entry[] = [];

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file).split(sep).join('/');
    const src = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;

    /** Positions already reported by rules ①–③, so rule ④'s sweep does not report them twice. */
    const captured: number[] = [];
    const push = (text: string, node: ts.Node, origin: string, bucket: Entry['bucket']) => {
      captured.push(node.getStart(sf));
      if (isReviewable(text) && !isNonCopyValue(text, node, origin)) {
        entries.push({ text: text.trim(), file: rel, line: lineOf(node), origin, bucket });
      }
    };

    const visit = (node: ts.Node) => {
      // ① Text between JSX tags — <Text>Add a debt</Text>
      if (ts.isJsxText(node) && node.text.trim()) push(node.text, node, 'jsx-text', 'copy');

      // ② String values of JSX attributes, bucketed by whether the prop is known copy or known machinery.
      if (ts.isJsxAttribute(node) && node.initializer) {
        const prop = node.name.getText(sf);
        if (!TECHNICAL_PROPS.has(prop)) {
          // ⛔ This path used to bucket on COPY_PROPS alone and never consult COPY_ORIGINS /
          // TECHNICAL_ORIGINS — while rule ③ below consults both. Same file, two paths, one blind: props
          // ALREADY declared technical (`prop:onPress`, `prop:onBack`, `prop:getComponent`, …) kept being
          // reported as "nobody has classified this", and `prop:meta`'s copy stayed invisible even though
          // `key:meta` was declared copy. Audit 2026-08-17 · L6-1.
          // ⚠️ The two sets are in DIFFERENT namespaces: object-literal keys are declared as `key:meta`,
          // JSX attributes arrive as `prop:meta`. Consulting only the latter left `prop:meta`'s copy
          // invisible while `key:meta` was declared copy — the same word, classified once, honoured once.
          // A name means the same thing whichever syntax carries it, so both spellings are consulted.
          const originKey = `prop:${prop}`;
          const keyAlias = `key:${prop}`;
          const declaredCopy = COPY_PROPS.has(prop) || COPY_ORIGINS.has(originKey) || COPY_ORIGINS.has(keyAlias);
          const declaredTechnical = TECHNICAL_ORIGINS.has(originKey) || TECHNICAL_ORIGINS.has(keyAlias);
          for (const lit of literalsIn(node.initializer)) {
            const text = (lit as ts.StringLiteral).text;
            // ⚠️ TECHNICAL is decided by the VALUE, not by the prop. `prop:onPress` is MIXED — ten route
            // paths AND two real `Alert.alert` strings — so a prop-level exclusion would have made those
            // two permanently invisible, which is strictly worse than the bug being fixed. A prose value
            // under a technical prop falls through to `unclassified`, where a human still sees it.
            const bucket: Entry['bucket'] = declaredCopy
              ? 'copy'
              : declaredTechnical && isMachineryValue(text)
                ? 'technical'
                : 'unclassified';
            push(text, lit, originKey, bucket);
          }
        }
      }

      // T3 — record every ternary whose branches carry copy, with the condition that selects between them.
      if (ts.isConditionalExpression(node)) {
        const whenTrue = branchLiterals(node.whenTrue);
        const whenFalse = branchLiterals(node.whenFalse);
        if (whenTrue.length || whenFalse.length) {
          const condition = node.condition.getText(sf).replace(/\s+/g, ' ').slice(0, 90);
          conditionals.push({ file: rel, line: lineOf(node), condition, whenTrue, whenFalse });
        }
      }

      // ③ Alert.alert(...) — copy that never appears in JSX at all.
      if (ts.isCallExpression(node) && node.expression.getText(sf).endsWith('Alert.alert')) {
        for (const lit of literalsIn(node)) push((lit as ts.StringLiteral).text, lit, 'alert', 'copy');
      }

      ts.forEachChild(node, visit);
    };
    visit(sf);

    // ④ ⛔ EVERYTHING ELSE — the rule that makes "complete" mean something.
    // Rules ①–③ only see JSX and Alerts, and the first run proved that is not where all the copy lives:
    // `setError('Enter the current balance.')` is a validation message a user reads, sits in a function
    // body, and was silently absent from the inventory. It was found by grepping the artifact for a
    // string I had watched the app render — not by anything the tool reported. A list that quietly omits
    // a surface is worse than no list, because the gate would sign off on it.
    // So: sweep every remaining string literal, derive an origin from its syntactic context, and file it
    // as `unclassified`. Review then happens per-CONTEXT (~dozens) rather than per-string (~hundreds),
    // which is the same move that made the prop buckets tractable.
    const seen = new Set(captured);
    const sweep = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return; // module paths, never copy
      if (ts.isStringLiteral(node) && !seen.has(node.getStart(sf)) && isReviewable(node.text)) {
        const origin = originOf(node, sf);
        const bucket = COPY_ORIGINS.has(origin) ? 'copy' : TECHNICAL_ORIGINS.has(origin) ? 'technical' : 'unclassified';
        push(node.text, node, origin, bucket);
      }
      ts.forEachChild(node, sweep);
    };
    sweep(sf);
  }
}

entries.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

// ── The duplicate sweep — "two places, one rule" ────────────────────────────────────────────────
// Wave A hit this shape three times in one wave, each fixed by extracting a single authority. A string
// living in two files is the copy-level instance: agreeing copies are still copies, they just have not
// diverged yet. Same-file repeats are excluded — those are usually one component's states.
const byText = new Map<string, Entry[]>();
for (const e of entries) {
  if (!byText.has(e.text)) byText.set(e.text, []);
  byText.get(e.text)!.push(e);
}
const duplicates = [...byText.entries()]
  .filter(([, es]) => new Set(es.map((e) => e.file)).size > 1)
  .sort((a, b) => b[1].length - a[1].length);

// ⚠️ **THE REPORT AND THE GATE SCOPED THIS DIFFERENTLY, and only one of them was right.** The section
// headed "Duplicated across files" is the WORDING gate's input, but it printed every repeated string in
// the codebase — so **100 of its 210 rows were not copy at all**: `space-between`, `decimal-pad`,
// `chevron-right`, `/paywall`, `optional_goal`. Style tokens, icon names, routes and enum ids that no
// wording pass will ever judge, presented as the wording gate's first task.
//
// ⚡ The rule was already written down HERE, twelve lines below the offending line: the T2 gate filters
// `bucket === 'copy'`, and the T3 table's note says a row is earned "only if it selects between strings
// T1 ALREADY classified as copy — that reuses one classification instead of inventing a second
// heuristic". The report was the one place in this file that did not follow its own rule.
//
// Kept as a SEPARATE list rather than narrowing `duplicates` in place: the T2 gate reads that one, and a
// gate whose input silently changes shape is how a baseline stops meaning what it was accepted for.
const copyDuplicates = duplicates.filter(([, es]) => es.some((e) => e.bucket === 'copy'));

const copy = entries.filter((e) => e.bucket === 'copy');
const technical = entries.filter((e) => e.bucket === 'technical');
const technicalOrigins = [...new Set(technical.map((e) => e.origin))].sort();
// ── self-check: the instrument's own output shape ────────────────────────────────────────────────
// ⛔ Nothing gates these scripts, and this pass introduced two bugs in them that only a human reading the
// generated file caught: an eaten `\s` that turned a whitespace test into a letter test, and a SECOND
// unnormalised label producer. An audit instrument that is silently wrong is worse than none, because its
// output is trusted. So the cheap invariants are asserted here, where they cost nothing per run.
const badOrigins = [...new Set(entries.map((e) => e.origin))].filter((o) => /[\r\n]/.test(o) || o.length > 48);
if (badOrigins.length) {
  console.error(`\n❌ strings-inventory: ${badOrigins.length} origin label(s) contain whitespace or exceed 48 chars.`);
  console.error('   A label is an IDENTITY — one that varies with source formatting silently mints a new');
  console.error('   "unclassified" bucket every time someone reformats a file. Normalise it in `calleeLabel`.\n');
  for (const o of badOrigins.slice(0, 8)) console.error(`     ${JSON.stringify(o.slice(0, 70))}`);
  process.exitCode = 1;
}

const unclassified = entries.filter((e) => e.bucket === 'unclassified');
const unclassifiedProps = [...new Set(unclassified.map((e) => e.origin))].sort();

// ── Output ─────────────────────────────────────────────────────────────────────────────────────
// ── T2 · THE GATE ──────────────────────────────────────────────────────────────────────────────
// [D31]: a finding that becomes a TEST is paid for once; a finding that stays prose gets re-discovered
// and paid for again. This is the first audit lens to become a gate rather than a report.
//
// ⚠️ THE THRESHOLD IS MEASURED, NOT CHOSEN. Cross-file duplicate copy strings by minimum length:
// 74 at any length · 30 at ≥12 · **9 at ≥20** · 2 at ≥30. Below 20 the set is "Add" / "Save" / "Done" /
// "/mo" — words two screens are entitled to share, and a gate that fires on them gets suppressed, which
// is worse than no gate. At 20 every survivor is a phrase carrying voice, including three Guardian band
// strings ("A little tight this paycheck") written in two files each. 20 is where the distribution
// separates; it is a dial, not a law, and moving it is a decision rather than a fix.
// ⛔ Was 20, which is where the gate went blind. Measured 2026-08-17: at 20 chars the gate saw **3**
// cross-file duplicates; at 14 it sees **12**, and every one of the 9 it had been missing was
// independently found by hand in the same audit — the privacy promise ("Private by design"), the payoff
// schedule across 3 files, the debt-entry field copy, the demo exit CTA, "Unlock Premium". A threshold
// picked to keep a gate quiet is a coverage decision disguised as a constant.
// ⚠️ 14, not lower: below it the list fills with genuinely generic single words ("Add", "Cancel").
const DUP_MIN_LEN = 14;
const BASELINE_PATH = join(REPO_ROOT, 'scripts', 'duplicate-copy-baseline.json');

const gateFindings = duplicates
  .filter(([text, es]) => text.length >= DUP_MIN_LEN && es.some((e) => e.bucket === 'copy'))
  .map(([text, es]) => ({ text, files: [...new Set(es.map((e) => e.file))].sort() }));

if (process.argv.includes('--update-baseline')) {
  writeFileSync(BASELINE_PATH, JSON.stringify(gateFindings.map((f) => f.text).sort(), null, 2) + '\n');
  console.log(`duplicate-copy baseline updated: ${gateFindings.length} accepted`);
} else if (process.argv.includes('--gate')) {
  const baseline = new Set<string>(existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : []);
  const fresh = gateFindings.filter((f) => !baseline.has(f.text));
  if (fresh.length) {
    console.error(`\n❌ duplicate copy: ${fresh.length} phrase(s) of ${DUP_MIN_LEN}+ chars now live in more than one file.\n`);
    for (const f of fresh) console.error(`  ${JSON.stringify(f.text)}\n    ${f.files.join('\n    ')}`);
    console.error(
      '\n  Agreeing copies are still copies — they just have not diverged yet. Extract one authority,\n' +
        '  or, if the repetition is deliberate, accept it with:\n' +
        '    npm run audit:strings -- --update-baseline\n',
    );
    process.exit(1);
  }
  /**
   * ⛔ **[P6.8.9.7.11.12.13 · D-J2-4] THE SELF-CHECK'S VERDICT WAS THROWN AWAY HERE.** The origin-label
   * check above sets `process.exitCode = 1` and explains why in exactly these terms: *"An audit instrument
   * that is silently wrong is worse than none, because its output is trusted."* This branch then called
   * `process.exit(0)`, and **an explicit exit code overrides `exitCode`** — so `npm run lint:copy` printed
   * `❌ strings-inventory: N origin label(s)…` and exited **0**, in the same output as a `✅`.
   *
   * ⚡ **The consequence is not cosmetic.** A mis-bucketed string is not `copy`, and `gateFindings` filters
   * on `bucket === 'copy'` — so broken labelling silently REMOVES user-facing phrases from this gate's
   * input. The pass it reports is over a corpus it has just said it cannot classify.
   *
   * ⚠️ Checked as a class: `strings-inventory.ts` is the only script in `scripts/` that sets
   * `process.exitCode` and later calls `process.exit(0)`. The other four `exit(0)` sites have no verdict
   * to discard.
   */
  if (badOrigins.length) {
    console.error(
      '\n❌ strings-inventory: the self-check above FAILED, so this gate cannot vouch for its own input —\n' +
        '   a mis-labelled string is not bucketed as `copy`, and the duplicate gate only ever sees `copy`.\n' +
        '   Refusing to report a pass over a corpus the instrument says it could not classify.\n',
    );
    process.exit(1);
  }
  /**
   * ⛔ **STALE BASELINE ENTRIES ARE REPORTED.** [S0.13 · REVERIFY-4 finding 3, `major`]
   *
   * ⚡ **Every baselined phrase that no longer duplicates is a STANDING PERMISSION to re-duplicate it**, and
   * nothing said so. Measured at `613adf2`: **16 entries, 3 live, 13 stale.** Plant and control — re-typing
   * `"Private by design"` into a second file exited **0** against the real baseline and **1** with that one
   * phrase removed. The gate was quietly pre-authorising 13 duplications nobody had agreed to.
   *
   * ⚠️ **Reported, not red — the direction is deliberate and copied from `check-apostrophes.ts:296-301`**,
   * which already had this exactly right: *"removing copy is exactly what the sweep will do, and a gate
   * that reds on progress is a gate that gets reverted."* ⛔ **But an unreported drift means the baseline
   * silently stops describing the tree**, which is the T8.4 failure — a baseline 12 too high left a +1
   * detector unable to detect +1. **Two sibling gates, one class, and only one of them was carrying it.**
   */
  const stale = [...baseline].filter((b) => !gateFindings.some((f) => f.text === b));
  if (stale.length) {
    console.log(`   ⚠️  ${stale.length} baselined phrase(s) no longer duplicate — each is a standing`);
    console.log('       permission to re-duplicate it. Re-record with `--update-baseline` to drop them:');
    // Every stale entry, not a sample: a truncated list has under-reported a site count on five
    // consecutive items here, and the omitted line is the permission nobody knows they still hold.
    for (const s of stale) console.log(`         ${JSON.stringify(s)}`);
  }
  console.log(
    `✅ duplicate copy: no new cross-file phrases (${baseline.size} baselined` +
      `${stale.length ? `, ${stale.length} stale` : ''}).`,
  );
  // ⚠️ Gate mode writes NOTHING. A lint step that regenerates two committed artifacts would leave CI
  // with a dirty tree of its own making, and every local gate run would churn a diff nobody asked for.
  process.exit(0);
}

const OUT_DIR = join(REPO_ROOT, 'docs', 'audits');
mkdirSync(OUT_DIR, { recursive: true });

const md: string[] = [];
md.push('# User-facing strings — inventory');
md.push('');
md.push('> ⛔ **GENERATED. Do not edit.** Regenerate with `npm run audit:strings`.');
md.push('> This is the **input** to the wording/voice gate, not its output. Findings belong in a dated');
md.push('> audit folder; this file is only ever the current state of the codebase.');
md.push('');
md.push(`**${copy.length}** copy · **${unclassified.length}** unclassified · **${technical.length}** excluded as machinery · **${copyDuplicates.length}** copy strings appearing in more than one file (of ${duplicates.length} repeated strings overall).`);
md.push('');
md.push('<details><summary>Excluded as machinery — the contexts, so the exclusions can be challenged</summary>');
md.push('');
md.push(technicalOrigins.map((o) => `- \`${o}\``).join('\n'));
md.push('');
md.push('</details>');
md.push('');
md.push('## ⚠️ Unclassified — a prop nobody has sorted yet');
md.push('');
md.push('These sit in JSX attributes that are in neither the copy list nor the technical list. Each is');
md.push('either copy that the gate must read, or machinery that belongs in `TECHNICAL_PROPS`. Leaving one');
md.push('here is how a surface goes unreviewed while the count looks complete.');
md.push('');
md.push(unclassifiedProps.length ? unclassifiedProps.map((p) => `- \`${p}\``).join('\n') : '_None._');
md.push('');
md.push('## Duplicated across files — copy only');
md.push('');
md.push(`**${copyDuplicates.length}** of ${duplicates.length} cross-file duplicate strings carry copy.`);
md.push('The other ' + (duplicates.length - copyDuplicates.length) + ' are style tokens, icon names,');
md.push('routes and enum ids — repeated by design, and nothing a wording pass judges. They are excluded');
md.push('here for the same reason the T2 gate and the T3 table exclude them: one classification, reused.');
md.push('');
md.push('⚠️ A `copy+unclassified` tag means the SAME text is both a user-facing string somewhere and a');
md.push('non-copy literal elsewhere (`"at-risk"` is a Guardian state id and a QA label). Judge the copy');
md.push('instance; the others are coincidence, not divergence.');
md.push('');
if (copyDuplicates.length) {
  for (const [text, es] of copyDuplicates) {
    const buckets = [...new Set(es.map((e) => e.bucket))].sort().join('+');
    md.push(
      `- **${JSON.stringify(text)}** _(${buckets})_ — ${es.map((e) => `\`${e.file}:${e.line}\``).join(' · ')}`,
    );
  }
} else {
  md.push('_None._');
}
md.push('');
md.push('## Copy gated on a condition — is the gate the thing the copy claims?');
md.push('');
md.push('The audit gate\'s proxy-gate sweep, as a list. For each row ask one question: **does the');
md.push('condition actually establish what the words assert, or does it merely correlate with it?**');
md.push('');
md.push('The live instance this was built from read exactly like a row here —');
md.push('`prefill` → `"Add from scan"` / `"Add a debt"` — where `prefill` had stopped meaning "scanned"');
md.push('the moment a second producer was added. Two audit passes and three green web specs missed it.');
md.push('');
md.push('| file | condition | when true | when false |');
md.push('|---|---|---|---|');
// ⚠️ A gate earns a row only if it selects between strings T1 ALREADY classified as copy. That reuses
// one classification instead of inventing a second heuristic here — otherwise this table would need its
// own idea of "is this a word or an id", and the two would drift. Ternaries over `"reserve-release"` or
// `"en-US"` are real gates over machinery, and judging them is not this sweep's job.
const copyText = new Set(copy.map((e) => e.text));
const judgeable = conditionals.filter((c) => [...c.whenTrue, ...c.whenFalse].some((s) => copyText.has(s)));
for (const c of judgeable) {
  const cell = (xs: string[]) => (xs.length ? xs.map((s) => JSON.stringify(s)).join(' · ').replace(/\|/g, '\\|') : '—');
  md.push(`| \`${c.file}:${c.line}\` | \`${c.condition.replace(/\|/g, '\\|')}\` | ${cell(c.whenTrue)} | ${cell(c.whenFalse)} |`);
}
md.push('');
md.push('## Every string, by file');
md.push('');
let currentFile = '';
for (const e of entries.filter((x) => x.bucket !== "technical")) {
  if (e.file !== currentFile) {
    currentFile = e.file;
    md.push('');
    md.push(`### \`${currentFile}\``);
    md.push('');
    md.push('| line | origin | string |');
    md.push('|---|---|---|');
  }
  const safe = e.text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  md.push(`| ${e.line} | ${e.origin}${e.bucket === 'unclassified' ? ' ⚠️' : ''} | ${safe} |`);
}

writeFileSync(join(OUT_DIR, 'strings-inventory.md'), md.join('\n') + '\n');
writeFileSync(
  join(OUT_DIR, 'strings-inventory.json'),
  JSON.stringify({ generated: 'npm run audit:strings', counts: { copy: copy.length, unclassified: unclassified.length, duplicates: duplicates.length }, entries }, null, 2) + '\n',
);

console.log(`conditional copy (T3): ${judgeable.length} of ${conditionals.length} gates carry copy`);
console.log(`strings-inventory: ${copy.length} copy · ${unclassified.length} unclassified (${unclassifiedProps.length} props) · ${copyDuplicates.length} cross-file COPY duplicates (${duplicates.length} repeated strings overall)`);
console.log(`→ docs/audits/strings-inventory.md`);
