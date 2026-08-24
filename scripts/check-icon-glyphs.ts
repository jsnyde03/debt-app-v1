/**
 * Icon-glyph guard — every `AppIcon` glyph on screen either maps to an SF Symbol or says why it doesn't.
 *
 * ⛔ **The defect is silent by construction.** `AppIcon.ios` looks a glyph up in `appIconSF` and falls back
 * to MaterialIcons for anything absent. Nothing breaks, nothing warns, and nothing logs — the icon simply
 * renders as a generic-Android glyph sitting next to native SF Symbols, and it reads as *foreign* rather
 * than as broken. Only a human on an iOS device sees it, which is the worst possible detection loop for a
 * whole-app visual property. `icons.ts`'s own header describes the fallback as graceful; graceful is
 * exactly why nobody notices.
 *
 * ⚡ **It was found twice by accident before it was gated.** P6.8.7e.4 mapped `receipt-long` after noticing
 * one; P6.8.7g.2 mapped `upload-file` while adding a row directly beneath `document-scanner`, which is
 * itself unmapped and has shipped that way. Two anecdotes, no count — so this exists to produce the count
 * and keep it from growing.
 *
 * ⭐ **WHAT THIS GATE IS FOR IS NAMING THEM, NOT FIXING THEM.** It ships with every current unmapped glyph
 * EXEMPT, each with a written reason, because mapping seventeen glyphs changes shipped visuals across many
 * screens inside a converging release with no device to look at. `lint:type-scale` is the precedent that
 * matters: it found five sites and established that **none of them should be changed** — writing the
 * exemption's reason is where that gets decided, one glyph at a time, by someone looking at the screen.
 *
 * What it therefore actually prevents: a NEW unmapped glyph arriving unnoticed. That is the growth this
 * class has, and it is the half that is decidable without a device.
 *
 * Usage: tsx scripts/check-icon-glyphs.ts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const SRC = join(REPO_ROOT, 'apps', 'rn', 'src');
const ICONS_FILE = join(SRC, 'theme', 'icons.ts');
const EXTS = new Set(['.ts', '.tsx']);

/**
 * Unmapped glyphs that are accepted as-is, each with the reason it was not mapped.
 *
 * ⚠️ **A reason is required and "TODO" is not one.** The point of the list is that each line was decided
 * rather than inherited. To retire an entry, map the glyph in `appIconSF` and delete the line.
 *
 * ⛔ **Every entry below is the SAME reason today, stated honestly: nobody has looked at these on an iOS
 * device.** They are not a judgement that the Material glyph is right — they are a judgement that changing
 * seventeen icons blind, this close to a freeze, is the larger risk. → P6.14 / P6.8.9.
 */
const EXEMPT: Record<string, string> = {
  'bug-report': 'QA-only surface (report a problem); never seen by a shipping user with QA_TOOLS off',
  'card-membership': 'premium/subscription row — unreviewed on device',
  'cloud-upload': 'iCloud backup row — unreviewed on device',
  'credit-card': 'the Debts empty state — unreviewed on device',
  'delete-outline': 'destructive row affordance — unreviewed on device',
  description: 'generic document glyph — unreviewed on device',
  'document-scanner': 'the scan-a-statement row; shipped unmapped since §2.8 — unreviewed on device',
  'file-download': 'export/backup affordance — unreviewed on device',
  flag: 'milestone marker — unreviewed on device',
  'help-outline': 'help affordance — unreviewed on device',
  'info-outline': 'informational affordance — unreviewed on device',
  insights: 'premium insights entry — unreviewed on device',
  'ios-share': 'share affordance; the Material glyph already draws the iOS share box, so a mapping may be a no-op',
  'lock-outline': 'App Lock row — unreviewed on device',
  'notifications-none': 'notification toggle — unreviewed on device',
  'privacy-tip': 'privacy row — unreviewed on device',
  science: 'QA/demo instrument — not a shipping surface with QA_TOOLS off',
};

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '__fixtures__') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.has(extname(p)) && !p.endsWith('.test.ts')) out.push(p);
  }
}

/** The keys of `appIconSF` — read from the file rather than imported, so this stays a plain script. */
function mappedGlyphs(): Set<string> {
  // ⚠️ Line endings normalised first. This repo checks out CRLF on Windows, so a `\n};` terminator
  // matched nothing and the instrument threw before it could check anything — the diagnostic failing in
  // the world it was written to inspect.
  const src = readFileSync(ICONS_FILE, 'utf8').replace(/\r\n/g, '\n');
  const start = src.indexOf('export const appIconSF');
  if (start === -1) throw new Error('check-icon-glyphs: could not find `appIconSF` in theme/icons.ts');
  // ⚠️ Ends at the first COLUMN-0 brace, not at `};`. The map closes with `} satisfies Partial<…>;`, so
  // a `};` terminator matched nothing — measured, after assuming it twice.
  const end = src.indexOf('\n}', start);
  if (end === -1) throw new Error('check-icon-glyphs: could not find the end of `appIconSF`');
  const body = src.slice(start, end);
  const keys = new Set<string>();
  // `'receipt-long': 'doc.plaintext',` and `assignment: 'doc.text.fill',` — quoted or bare.
  for (const m of body.matchAll(/^\s*'([a-z0-9-]+)'\s*:|^\s*([A-Za-z][A-Za-z0-9_]*)\s*:/gm)) {
    const key = m[1] ?? m[2];
    if (key) keys.add(key);
  }
  return keys;
}

/**
 * Glyphs handed to `AppIcon`.
 *
 * ⚠️ Matches the PROP, not the component, because the glyph is usually passed through a wrapper —
 * `AddRow`, `EmptyState` and `ListRow` all take an `icon: IconGlyph` and render `<AppIcon name={icon}>`.
 * A checker that only looked for `<AppIcon` would see a fraction of the real usage and report clean.
 */
function usedGlyphs(files: string[]): Map<string, string[]> {
  const used = new Map<string, string[]>();
  const patterns = [
    /<AppIcon[^>]*?\bname="([a-z0-9-]+)"/g,
    /\bicon="([a-z0-9-]+)"/g,
    /\bicon=\{'([a-z0-9-]+)'\}/g,
    /\bname=\{'([a-z0-9-]+)'\}/g,
    // ⛔ DEFAULT PARAMETER VALUES — `icon = 'add'` in a wrapper's signature. Found by a plant that failed
    // to red: `AddRow`'s default is what every caller that passes no icon actually renders, and no
    // explicit `icon="add"` exists anywhere, so this glyph was invisible to the check entirely. It
    // happens to be mapped, so the hole never produced a wrong answer — which is exactly why only a
    // deliberately-planted glyph could reveal it.
    /\b(?:icon|name)\s*=\s*'([a-z0-9-]+)'\s*,/g,
  ];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const re of patterns) {
      for (const m of src.matchAll(re)) {
        const glyph = m[1];
        const where = relative(REPO_ROOT, f);
        const list = used.get(glyph) ?? [];
        if (!list.includes(where)) list.push(where);
        used.set(glyph, list);
      }
    }
  }
  return used;
}

const files: string[] = [];
walk(SRC, files);

const mapped = mappedGlyphs();
const used = usedGlyphs(files);

const unmapped = [...used.keys()].filter((g) => !mapped.has(g)).sort();
const offenders = unmapped.filter((g) => !(g in EXEMPT));
// An exemption for a glyph that is now mapped, or no longer used, is dead weight that hides the real list.
const staleExemptions = Object.keys(EXEMPT).filter((g) => mapped.has(g) || !used.has(g)).sort();

if (offenders.length === 0 && staleExemptions.length === 0) {
  console.log(
    `✅ icon glyphs: ${used.size} in use · ${used.size - unmapped.length} mapped to SF Symbols · ` +
      `${unmapped.length} exempt with a stated reason.`,
  );
  process.exit(0);
}

if (offenders.length > 0) {
  console.error(`\n❌ icon glyphs: ${offenders.length} glyph(s) render through the MaterialIcons fallback on iOS.\n`);
  for (const g of offenders) {
    console.error(`  "${g}"  —  ${used.get(g)!.join(', ')}`);
  }
  console.error(
    '\n  On iOS these draw a generic Material glyph beside native SF Symbols: nothing breaks, nothing\n' +
      '  warns, and it reads as foreign. Either map it in `apps/rn/src/theme/icons.ts` → `appIconSF`,\n' +
      '  or add it to EXEMPT in this file WITH THE REASON it should keep the Material rendering.\n',
  );
}

if (staleExemptions.length > 0) {
  console.error(`\n❌ icon glyphs: ${staleExemptions.length} exemption(s) no longer describe anything.\n`);
  for (const g of staleExemptions) {
    console.error(`  "${g}"  —  ${mapped.has(g) ? 'now mapped in appIconSF' : 'no longer used in apps/rn/src'}`);
  }
  console.error('\n  Delete the line from EXEMPT. A stale exemption hides how long the real list is.\n');
}

process.exit(1);
