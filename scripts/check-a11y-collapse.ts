/**
 * T5 — THE A11Y COLLAPSE GUARD.
 *
 * iOS treats `accessible={true}` as "this subtree is ONE element". Any control inside it stops existing
 * for VoiceOver — not "is announced oddly", **ceases to be reachable**. React Native sets `accessible`
 * implicitly on `Text` and friends, so the dangerous case is an explicit `accessible` on a wrapper that
 * is not itself pressable and that contains a Pressable/Touchable/Button.
 *
 * ⚡ THIS IS NOT A HYPOTHETICAL. Measured 2026-08-13 (4.1.4c, defect ②): the coach-mark card carried
 * `accessible` as a grouping wrapper, the accessibility tree showed it as a leaf with `children: 0`, and
 * **VoiceOver could not dismiss the hint.** It took five rounds of refuted theories to find, on a surface
 * no automated lane could see. This check answers the same question from source in milliseconds.
 *
 * It is deliberately the cheapest possible form of that finding: a defect that became a test is paid for
 * once ([D31]), and it needs no simulator, no device and no CI.
 *
 * ⚠️ WHAT IT CANNOT SEE, stated so a green is not read as more than it is:
 *   • A wrapper that becomes pressable at RUNTIME (`accessible={x}` with a computed value, or a component
 *     that spreads props). Only literal, statically-visible structure is judged.
 *   • A control introduced through a CHILD COMPONENT (`<Row />` that renders a Pressable internally).
 *     This walks JSX in one file; it does not resolve components across module boundaries.
 *   • `accessibilityElementsHidden` / `importantForAccessibility`, which are different mechanisms.
 * A clean run means "no statically-visible collapse", not "VoiceOver reaches every control".
 *
 * Usage: npm run lint:a11y-collapse   ·   runs inside `lint:rn` → `validate:release:rn`
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import ts from 'typescript';

const REPO_ROOT = join(import.meta.dirname, '..');
const SRC_DIRS = [join(REPO_ROOT, 'apps', 'rn', 'src'), join(REPO_ROOT, 'packages', 'core')];

/** Anything that is a tap target. Matched on the tag's own name, so `Animated.Pressable` counts. */
const PRESSABLE = /(^|\.)(Pressable|Touchable[A-Za-z]*|Button|Switch|Slider|TextInput|Link)$/;

/**
 * Props that make a wrapper legitimately interactive itself — in which case `accessible` is CORRECT and
 * the nested control is the author's problem to have removed, not this check's to flag.
 * ⚠️ `accessibilityRole` alone is NOT enough: a `role="header"` wrapper is still collapsing.
 */
const SELF_INTERACTIVE = /^(onPress|onPressIn|onPressOut|onLongPress)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === '.tsx') out.push(p);
  }
  return out;
}

const tagName = (n: ts.JsxElement | ts.JsxSelfClosingElement): string => {
  const t = ts.isJsxElement(n) ? n.openingElement.tagName : n.tagName;
  return t.getText();
};
const attrsOf = (n: ts.JsxElement | ts.JsxSelfClosingElement): ts.JsxAttributes =>
  ts.isJsxElement(n) ? n.openingElement.attributes : n.attributes;

/** `accessible` / `accessible={true}` — but NOT `accessible={false}` or a computed value. */
function hasLiteralAccessible(n: ts.JsxElement | ts.JsxSelfClosingElement): boolean {
  for (const a of attrsOf(n).properties) {
    if (!ts.isJsxAttribute(a) || a.name.getText() !== 'accessible') continue;
    if (!a.initializer) return true; // bare `accessible`
    if (ts.isJsxExpression(a.initializer)) {
      const e = a.initializer.expression;
      return !!e && e.kind === ts.SyntaxKind.TrueKeyword;
    }
    return false;
  }
  return false;
}

function isSelfInteractive(n: ts.JsxElement | ts.JsxSelfClosingElement): boolean {
  if (PRESSABLE.test(tagName(n))) return true;
  return attrsOf(n).properties.some((a) => ts.isJsxAttribute(a) && SELF_INTERACTIVE.test(a.name.getText()));
}

interface Finding { file: string; line: number; wrapper: string; control: string; controlLine: number }

const findings: Finding[] = [];

for (const file of SRC_DIRS.flatMap((d) => walk(d))) {
  const src = readFileSync(file, 'utf8');
  if (!src.includes('accessible')) continue; // cheap prefilter
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;

  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && hasLiteralAccessible(node) && !isSelfInteractive(node)) {
      // Walk this wrapper's descendants for a tap target.
      const findControl = (n: ts.Node): { name: string; line: number } | null => {
        let hit: { name: string; line: number } | null = null;
        const inner = (m: ts.Node) => {
          if (hit) return;
          if ((ts.isJsxElement(m) || ts.isJsxSelfClosingElement(m)) && m !== node) {
            const name = tagName(m);
            if (PRESSABLE.test(name)) { hit = { name, line: lineOf(m) }; return; }
            // A nested `accessible` wrapper owns its own subtree — stop, or one defect reports twice.
            if (ts.isJsxElement(m) && hasLiteralAccessible(m)) return;
          }
          ts.forEachChild(m, inner);
        };
        ts.forEachChild(n, inner);
        return hit;
      };
      const control = findControl(node);
      if (control) {
        findings.push({
          file: relative(REPO_ROOT, file).replace(/\\/g, '/'),
          line: lineOf(node),
          wrapper: tagName(node),
          control: control.name,
          controlLine: control.line,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sf, visit);
}

if (findings.length) {
  console.error(`\n⛔ a11y collapse — ${findings.length} wrapper${findings.length > 1 ? 's' : ''} that iOS will flatten:\n`);
  for (const f of findings) {
    console.error(`  • ${f.file}:${f.line} — <${f.wrapper} accessible> contains <${f.control}> at :${f.controlLine}`);
    console.error(`    iOS collapses this subtree into ONE element and the control ceases to exist for VoiceOver.`);
    console.error(`    Fix: drop \`accessible\` from the wrapper, or move it to the control and give the`);
    console.error(`    wrapper \`accessibilityRole\`/label without \`accessible\`.\n`);
  }
  process.exit(1);
}
console.log('✅ a11y collapse: no `accessible` wrapper statically contains a control.');
