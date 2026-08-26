/**
 * TYPE-SCALE GUARD — a large figure without a font-scale cap is a layout that only works at 1×.
 *
 * React Native scales `fontSize` and `lineHeight` together, so an unclamped 32pt number at the largest
 * accessibility size becomes roughly 99pt and REFLOWS: it does not clip, it pushes whatever is beside it
 * off the screen. Every hand-positioned number in this app assumes a width it never measures.
 *
 * ⛔ THIS EXISTS BECAUSE THE SWEEP WAS DONE BY HAND AND THE COMMENT RECORDING IT WAS FALSE. `PlanHero`
 * carried a note saying the three tab heroes were "the ONLY large figures with no font-scale cap" — the
 * count had been taken by enumerating HEROES and then written up as a claim about LARGE FIGURES, and six
 * unclamped figures ≥30pt were live on free surfaces when the audit found them. ⚡ The countermeasure for an
 * enumeration budgeted against the wrong class is never "count more carefully"; it is to state the class and
 * let a machine hold it. That is this file.
 *
 * WHAT IT CHECKS: any `Text` / `TextInput` / `CountUp` / `Animated.Text` whose style resolves to a
 * `fontSize` at or above the threshold must carry `maxFontSizeMultiplier`. Styles are resolved from the
 * file's own `StyleSheet.create` and from the shared `textStyles` scale.
 *
 * WHAT IT CANNOT SEE, so a green is not read as more than it is:
 *   • Inheritance. `maxFontSizeMultiplier` flows down nested `Text`, and this judges each element alone —
 *     so a clamped parent does not excuse its child here. That errs toward asking for the prop twice,
 *     which is harmless, rather than toward missing a site, which is the failure it was written for.
 *   • A size composed at runtime (`fontSize: big ? 34 : 17`) or spread in from a variable.
 *   • Whether the clamp VALUE is right for the container. It asks that a ceiling exists, not that it fits.
 *
 * Usage: npm run lint:type-scale   ·   `--report` lists every large-text site   ·   runs inside `lint:rn`
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import ts from 'typescript';

const REPO_ROOT = join(import.meta.dirname, '..');
const SRC_DIR = join(REPO_ROOT, 'apps', 'rn', 'src');
const TYPOGRAPHY = join(SRC_DIR, 'theme', 'typography.ts');
const REPORT = process.argv.includes('--report');

/**
 * The floor at which an unbounded scale stops being survivable. Below this a reflow is absorbed by the
 * surrounding layout; above it the figure IS the layout.
 *
 * ⛔ 30 rather than 28, and the two points are the whole argument. `title1` is 28 — the largest PROSE size
 * in the shared scale, used for screen and onboarding headings — and prose is exactly what Dynamic Type is
 * for. Clamping a heading does not protect an accessibility user, it overrules one. Everything at 30 and
 * above in this app is a figure sitting in a container somebody sized by hand.
 */
const LARGE_PT = 30;

/** Elements that render text. `CountUp` forwards its props to a `Text` and supplies no clamp of its own. */
const TEXTUAL = /(^|\.)(Text|TextInput|CountUp|AnimatedText)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === '.tsx') out.push(p);
  }
  return out;
}

const parse = (file: string): ts.SourceFile =>
  ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/**
 * Style-object keys in one file whose `fontSize` is large. Walks every object literal rather than only
 * `StyleSheet.create`, because a style constant declared as a plain object is the same hazard.
 */
function largeStyleKeys(source: ts.SourceFile): Set<string> {
  const keys = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAssignment(node) && ts.isObjectLiteralExpression(node.initializer)) {
      for (const prop of node.initializer.properties) {
        if (!ts.isPropertyAssignment(prop) || prop.name.getText() !== 'fontSize') continue;
        const size = Number(prop.initializer.getText());
        if (Number.isFinite(size) && size >= LARGE_PT) keys.add(node.name.getText().replace(/['"]/g, ''));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return keys;
}

const SHARED_LARGE = largeStyleKeys(parse(TYPOGRAPHY));

/** Every style key an element's `style` prop names, however deeply it is nested in arrays and conditionals. */
function referencedStyleKeys(attr: ts.JsxAttribute): string[] {
  const names: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node)) names.push(node.name.getText());
    ts.forEachChild(node, visit);
  };
  if (attr.initializer) visit(attr.initializer);
  return names;
}

/**
 * Does this attribute actually CAP the scale — judged on its VALUE, not on its presence.
 *
 * ⛔ **[S0.13 · REVERIFY-4 finding 4, `major`] This used to be `clamped = true` for either prop, whatever
 * it was set to.** So `allowFontScaling={true}` — which is *no ceiling at all*, the exact condition this
 * gate exists to catch — was printed `ok`, and a bare `allowFontScaling` means `={true}` in JSX, so the
 * shortest possible spelling was also the most wrong one.
 *
 * ⚠️ **The docstring's "WHAT IT CANNOT SEE" list does NOT excuse this**, and the distinction matters:
 * it disclaims *"whether the clamp VALUE is right for the container… it asks that a ceiling exists, not
 * that it fits."* `allowFontScaling={true}` is not an ill-fitting ceiling. It is the absence of one.
 *
 * ⚠️ **THE TWO PROPS GET OPPOSITE TREATMENT FOR AN UNRESOLVABLE VALUE, and that is measured rather than
 * chosen.** Every live spelling was counted first — **`allowFontScaling={false}` ×11 ·
 * `maxFontSizeMultiplier={1.3}` ×15 · `{1.4}` ×7 · `{1.2}` ×1 · `{LABEL_SCALE_MAX}` ×5**:
 *   • `allowFontScaling` — only a literal `false` caps. **Every live site is `={false}`**, so an
 *     unresolvable value is treated as NO cap, which is the noisy-and-safe direction.
 *   • `maxFontSizeMultiplier` — a **named constant is a cap**. ⛔ **Five live sites pass
 *     `{LABEL_SCALE_MAX}`, so a numeric-literal-only rule would red-gate five correctly-clamped sites** —
 *     an over-matching fix, which is the defect shape that beat three consecutive rounds here. Only an
 *     explicit `undefined` / `null` fails to cap.
 *
 * ⚠️ **The first draft of this function got exactly that wrong**, and its docstring asserted *"0 live sites
 * use a non-literal"* — false, and caught only by counting the spellings instead of trusting the sentence.
 */
function isClamp(prop: ts.JsxAttribute): boolean {
  const name = prop.name.getText();
  const init = prop.initializer;

  if (name === 'allowFontScaling') {
    // Bare `allowFontScaling` is `={true}` — scaling ON, no cap. Only an explicit `false` caps anything.
    if (!init) return false;
    if (!ts.isJsxExpression(init) || !init.expression) return false;
    return init.expression.kind === ts.SyntaxKind.FalseKeyword;
  }

  // maxFontSizeMultiplier: any real value caps — a literal OR a named constant. Only an explicit
  // `undefined` / `null`, or no value at all, fails to cap. See the docstring for why this is not
  // symmetrical with `allowFontScaling`: five live sites pass `LABEL_SCALE_MAX`.
  if (!init || !ts.isJsxExpression(init) || !init.expression) return false;
  const text = init.expression.getText();
  return text !== 'undefined' && text !== 'null';
}

const files = walk(SRC_DIR);
const failures: string[] = [];
const rows: string[] = [];

for (const file of files) {
  const source = parse(file);
  const local = largeStyleKeys(source);
  const rel = relative(REPO_ROOT, file).replace(/\\/g, '/');

  const visit = (node: ts.Node): void => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (TEXTUAL.test(opening.tagName.getText())) {
        let clamped = false;
        let large: string | undefined;
        for (const prop of opening.attributes.properties) {
          if (!ts.isJsxAttribute(prop)) continue;
          const name = prop.name.getText();
          // ⚠️ `||=`, not `=`. An element may carry BOTH props, and either one alone is a real cap —
          // assigning would let a later `allowFontScaling` overwrite an earlier valid
          // `maxFontSizeMultiplier` with `false`. Attribute order is not a property of the layout.
          if (name === 'maxFontSizeMultiplier' || name === 'allowFontScaling') clamped ||= isClamp(prop);
          if (name === 'style') large = referencedStyleKeys(prop).find((k) => local.has(k) || SHARED_LARGE.has(k));
        }
        if (large) {
          const line = source.getLineAndCharacterOfPosition(opening.getStart()).line + 1;
          rows.push(`${clamped ? 'ok  ' : 'FAIL'} ${rel}:${line}  ${opening.tagName.getText()} · ${large}`);
          if (!clamped) {
            failures.push(
              `${rel}:${line} renders \`${large}\` (≥${LARGE_PT}pt) with no \`maxFontSizeMultiplier\` — ` +
                'at the largest accessibility size it reflows and pushes its neighbours off screen',
            );
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

if (REPORT) rows.sort().forEach((r) => console.log(r));

if (failures.length > 0) {
  console.error(`\ncheck-type-scale: ${failures.length} large figure(s) with no font-scale cap\n`);
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  console.error('\nAdd `maxFontSizeMultiplier` (1.3 is the house value for a figure, 1.4 for a label).\n');
  process.exit(1);
}

console.log(`check-type-scale: every large figure carries a font-scale cap (${rows.length} checked).`);
