/**
 * Native-only a11y prop guard.
 *
 * `accessibilityElementsHidden` (iOS) and `importantForAccessibility` (Android) are NOT in
 * react-native-web 0.21's prop allowlist. RNW drops them silently, so on web — the platform the whole
 * Playwright suite runs on — a fence written with them fences nothing, while every test stays green.
 * That shipped for four audit rounds at gate 3.5.3.9 before anyone dumped the DOM. `aria-hidden` is the
 * whole fix and is smaller: RN expands it to both native props itself. Use `a11yHidden(flag)` /
 * `decorative` from `@/utils/a11y`.
 *
 * An ESLint rule covers `apps/rn/src`, but `globalIgnores` puts `tests/**` outside the linter's reach —
 * and a fence asserted by a test that itself uses the dropped prop is the same defect one layer up. This
 * script is the strictly-stronger half: a text scan over source AND tests, with one declared exemption
 * (the helper that legitimately emits them for the native platforms).
 *
 * Usage: tsx scripts/check-native-a11y-props.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOTS = [join(REPO_ROOT, 'apps', 'rn', 'src'), join(REPO_ROOT, 'apps', 'rn', 'tests')];
/** The one place allowed to name them: the helper that maps `aria-hidden` onto the native props. */
const EXEMPT = [join('apps', 'rn', 'src', 'utils', 'a11y.ts')];
const BANNED = /\b(accessibilityElementsHidden|importantForAccessibility)\b/;
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (entry === 'node_modules') continue;
      walk(p, out);
    } else if (EXTS.has(extname(p))) {
      out.push(p);
    }
  }
  return out;
}

/**
 * Comments are blanked, not matched. These files EXPLAIN the trap at length — that prose is the reason
 * the fix holds, and a guard that fails on its own documentation gets deleted rather than obeyed. Line
 * numbers are preserved so a real hit still points at the right line.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1: string) => p1 + ' '.repeat(m.length - p1.length));
}

const hits: string[] = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(REPO_ROOT, file);
    if (EXEMPT.some((e) => rel === e)) continue;
    const raw = readFileSync(file, 'utf8').split('\n');
    stripComments(readFileSync(file, 'utf8'))
      .split('\n')
      .forEach((line, i) => {
        if (BANNED.test(line)) hits.push(`${rel}:${i + 1}: ${raw[i]?.trim() ?? ''}`);
      });
  }
}

if (hits.length > 0) {
  console.error('\n❌ Native-only a11y props found (dropped silently by react-native-web):\n');
  hits.forEach((h) => console.error(`  ${h}`));
  console.error('\nUse a11yHidden(flag) or `decorative` from @/utils/a11y instead.\n');
  process.exit(1);
}
console.log(`✅ native a11y props: none outside ${EXEMPT.join(', ')}.`);
