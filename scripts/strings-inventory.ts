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
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
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

/** Punctuation, single glyphs and format fragments are not copy to review. */
function isReviewable(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return false;
  if (!/[a-zA-Z]/.test(t)) return false;
  if (/^[a-z][a-zA-Z0-9]*$/.test(t) && t.length < 12) return false; // camelCase identifiers
  return true;
}

/**
 * A label for WHERE an uncaptured string sits, so rule ④'s output is reviewable by context instead of
 * one string at a time. `call:setError` is a judgement anyone can make once; 300 loose strings are not.
 */
function originOf(node: ts.Node, sf: ts.SourceFile): string {
  const p = node.parent;
  if (!p) return 'other';
  if (ts.isCallExpression(p)) {
    const callee = p.expression.getText(sf).split('.').slice(-2).join('.');
    return `call:${callee}`;
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
    if (ts.isCallExpression(n)) return `call:${n.expression.getText(sf).split('.').slice(-2).join('.')}`;
    if (ts.isPropertyDeclaration(n) || ts.isFunctionDeclaration(n)) break;
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
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && isReviewable(n.text)) out.push(n.text.trim());
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
      if (isReviewable(text)) entries.push({ text: text.trim(), file: rel, line: lineOf(node), origin, bucket });
    };

    const visit = (node: ts.Node) => {
      // ① Text between JSX tags — <Text>Add a debt</Text>
      if (ts.isJsxText(node) && node.text.trim()) push(node.text, node, 'jsx-text', 'copy');

      // ② String values of JSX attributes, bucketed by whether the prop is known copy or known machinery.
      if (ts.isJsxAttribute(node) && node.initializer) {
        const prop = node.name.getText(sf);
        if (!TECHNICAL_PROPS.has(prop)) {
          const bucket: Entry['bucket'] = COPY_PROPS.has(prop) ? 'copy' : 'unclassified';
          for (const lit of literalsIn(node.initializer)) {
            push((lit as ts.StringLiteral).text, lit, `prop:${prop}`, bucket);
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

const copy = entries.filter((e) => e.bucket === 'copy');
const technical = entries.filter((e) => e.bucket === 'technical');
const technicalOrigins = [...new Set(technical.map((e) => e.origin))].sort();
const unclassified = entries.filter((e) => e.bucket === 'unclassified');
const unclassifiedProps = [...new Set(unclassified.map((e) => e.origin))].sort();

// ── Output ─────────────────────────────────────────────────────────────────────────────────────
const OUT_DIR = join(REPO_ROOT, 'docs', 'audits');
mkdirSync(OUT_DIR, { recursive: true });

const md: string[] = [];
md.push('# User-facing strings — inventory');
md.push('');
md.push('> ⛔ **GENERATED. Do not edit.** Regenerate with `npm run audit:strings`.');
md.push('> This is the **input** to the wording/voice gate, not its output. Findings belong in a dated');
md.push('> audit folder; this file is only ever the current state of the codebase.');
md.push('');
md.push(`**${copy.length}** copy · **${unclassified.length}** unclassified · **${technical.length}** excluded as machinery · **${duplicates.length}** strings appearing in more than one file.`);
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
md.push('## Duplicated across files');
md.push('');
if (duplicates.length) {
  for (const [text, es] of duplicates) {
    md.push(`- **${JSON.stringify(text)}** — ${es.map((e) => `\`${e.file}:${e.line}\``).join(' · ')}`);
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
console.log(`strings-inventory: ${copy.length} copy · ${unclassified.length} unclassified (${unclassifiedProps.length} props) · ${duplicates.length} cross-file duplicates`);
console.log(`→ docs/audits/strings-inventory.md`);
