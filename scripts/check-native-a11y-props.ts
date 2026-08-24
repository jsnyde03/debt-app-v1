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
 * script is the strictly-stronger half: a text scan over source AND tests, with per-prop declared
 * exemptions for the sites that legitimately emit a native prop for the native platforms.
 *
 * Usage: tsx scripts/check-native-a11y-props.ts
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const ROOTS = [join(REPO_ROOT, 'apps', 'rn', 'src'), join(REPO_ROOT, 'apps', 'rn', 'tests')];

/**
 * ⛔ DERIVE THIS LIST FROM RNW'S ALLOWLIST — NEVER EXTEND IT FROM MEMORY. It has been short every single
 * time anyone checked, and the reason is structural: the list is written from the props someone happened
 * to be looking at, while the drop is a property of everything NOT in the allowlist.
 *
 * The source of truth is `accessibilityProps` in
 * `apps/rn/node_modules/react-native-web/dist/modules/forwardedProps/index.js` — **138 keys**, all of
 * them `aria-*` or the `accessibilityCamelCase` spellings RNW maps to `aria-*`. A prop named
 * `accessibility*` that is not one of those reaches the DOM as **nothing at all**, silently, while every
 * Playwright and axe test stays green.
 *
 * To re-derive: dump the allowlist's keys and diff them against the `accessibility*` props in use.
 */
const BANNED = [
  // No aria-* mapping in `createDOMProps`, so a control announces its role and never its state.
  'accessibilityElementsHidden',
  'importantForAccessibility',
  'accessibilityState',
  'accessibilityValue',
  // Rotor / custom actions. Present on device, absent on web — the control is announced but inoperable
  // by anything that drives it through the accessibility API rather than through touch.
  'accessibilityActions',
  'onAccessibilityAction',
  // The a11y-tree fence. `aria-modal` is forwarded; this native spelling is not.
  'accessibilityViewIsModal',
] as const;

/**
 * file → the props it may name, and nothing else. Per-PROP rather than per-file deliberately: exempting
 * a whole file to permit one prop silently un-gates the other six in it.
 */
const EXEMPT: Record<string, readonly string[]> = {
  // The helper that maps `aria-hidden` onto the native props for the platforms that need them.
  'apps/rn/src/utils/a11y.ts': ['accessibilityElementsHidden', 'importantForAccessibility'],
  // The slider's increment/decrement rotor actions, which are real on device. Web is not silent without
  // them — `a11yAdjustableValue` still supplies `aria-valuenow`/`min`/`max` — only actionless.
  'apps/rn/src/components/ui/Slider.tsx': ['accessibilityActions', 'onAccessibilityAction'],
};

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
    // Forward slashes so the `EXEMPT` keys read the same on Windows and on CI.
    const rel = relative(REPO_ROOT, file).split(sep).join('/');
    const allowed = EXEMPT[rel] ?? [];
    const src = readFileSync(file, 'utf8');
    const raw = src.split('\n');
    stripComments(src)
      .split('\n')
      .forEach((line, i) => {
        for (const prop of BANNED) {
          if (allowed.includes(prop)) continue;
          if (new RegExp(`\\b${prop}\\b`).test(line)) {
            hits.push(`${rel}:${i + 1}: ${prop} — ${raw[i]?.trim() ?? ''}`);
          }
        }
      });
  }
}

/**
 * ⛔ **THE OPPOSITE ASYMMETRY, AND IT IS NOT A `BANNED` ENTRY.** Added at P6.8.9.7.1 after the verification
 * pass found A1-10 `PARTIAL`: the cross-platform primitive was built and correct, and **the finding's own
 * quoted line was never converted** (`SaveFailedBanner.tsx:31`, one commit `fb9a821`, pre-dating cluster f).
 *
 * ⚠️ **`accessibilityLiveRegion` deliberately does NOT go in `BANNED`, and putting it there would assert
 * something false.** `BANNED` means *RNW drops this prop*. Measured against the source of truth this file
 * names — `forwardedProps/index.js` and `createDOMProps/index.js` — RNW **does** forward it, to `aria-live`.
 * It works on web. **It does nothing on iOS**, where an announcement needs `announceForAccessibility`.
 *
 * So the rule is ownership, not forwarding: `useLiveAnnouncement` (`utils/a11y.ts:166`) does BOTH halves and
 * is the only correct spelling. A bare live region is silence on the phone the app ships on.
 * ⚡ The primitive's own docstring called this shot: *"'We have a check for this class' is what would let it
 * ship."* It shipped anyway, because the class had a helper and no gate.
 */
const OWNED = [
  {
    prop: 'accessibilityLiveRegion',
    owner: 'useLiveAnnouncement (@/utils/a11y)',
    why: 'RNW forwards it to aria-live, so web is fine and iOS is SILENT — announceForAccessibility is the other half',
    ownerFile: 'apps/rn/src/utils/a11y.ts',
  },
] as const;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    // Same `rel` spelling as the loop above — forward slashes, so `ownerFile` reads alike on Windows and CI.
    const rel = relative(REPO_ROOT, file).split(sep).join('/');
    const src = readFileSync(file, 'utf8');
    const raw = src.split('\n');
    stripComments(src)
      .split('\n')
      .forEach((line, i) => {
        for (const o of OWNED) {
          if (rel === o.ownerFile) continue;
          if (new RegExp(`\\b${o.prop}\\b`).test(line)) {
            hits.push(`${rel}:${i + 1}: ${o.prop} written by hand — ${o.why}. Use ${o.owner}. — ${raw[i]?.trim() ?? ''}`);
          }
        }
      });
  }
}

if (hits.length > 0) {
  console.error('\n❌ Native-only a11y props found (dropped silently by react-native-web):\n');
  hits.forEach((h) => console.error(`  ${h}`));
  console.error('\nUse the aria-* equivalent, or a helper from @/utils/a11y (a11yHidden, decorative,');
  console.error('a11yChecked, a11yAdjustableValue). If a native-only prop is genuinely wanted, declare');
  console.error('it per-prop in EXEMPT with the reason — do not exempt the whole file.\n');
  process.exit(1);
}
// ⚠️ Counts BOTH lists. It said `BANNED.length` when `OWNED` was added, which undercounts what the gate
// actually guards — and a completeness figure that omits part of its own coverage is precisely the defect
// P6.8.9.1 found in the shot matrix ("226 frames", four of which never existed).
console.log(
  `✅ native a11y props: ${BANNED.length} dropped-by-RNW + ${OWNED.length} owned-by-a-helper guarded, ` +
    'none outside the declared exemptions.',
);
