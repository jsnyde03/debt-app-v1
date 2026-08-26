/**
 * [D69] — WHICH FILES ON A SURFACE HAS A PASS ACTUALLY SWEPT?
 *
 * ⛔ **ONE INSTRUMENT, ONE ENTRY PER SURFACE — generalised at S1.2 (2026-08-26).** It was
 * `s0-surface-coverage.ts` and served S0 alone, which left **[D69] with no lookup on S1–S4**: *"first
 * look"* would have been the auditor's own claim on every remaining surface, which is precisely the state
 * S0.12a was built to end. ⚠️ **And the alternative was not neutral.** Running S1 with no table means no
 * exemptions — safe in the sense that no finding is wrongly excused, and unusable in practice: a surface
 * only two prior rounds have partly read produces first-look findings on nearly every pass, so the
 * two-clean-pass count would restart forever on **coverage** rather than on churn, which is the one thing
 * [D69] exists to separate.
 *
 * ⛔ **EXCLUSIONS ARE ROUTED, NEVER JUST DROPPED.** A file excluded from one surface must name the surface
 * that owns it. The S0 docstring's rule — *an inclusion list fails silent, an exclusion list fails safe* —
 * holds only while the surfaces genuinely partition the tree; an exclusion with no destination is a file
 * that quietly belongs to nobody.
 *
 * ⚡ **The measurement that forced this** [S0.12a · pass 4]: **all four S0 passes declared their surface as
 * `scripts/check-*.ts`** — and **9 of the 21 had never been swept by any of them.** Three consecutive
 * *"swept and found clean"* lists were therefore over-claiming, and pass 4 found **5 majors** in that
 * unswept remainder while pass 3, sweeping already-swept ground, found **0**. ⛔ **The variable was not the
 * tree. It was where the auditor pointed.**
 *
 * ⛔ **[D69] says a first-look finding does not restart the convergence count. This file is what makes
 * "first look" a LOOKUP rather than the auditor's own claim.** Without it the exemption is self-declared,
 * and a pass could widen its reading indefinitely and never fail.
 *
 * ⚠️ **COVERAGE IS TRACKED PER FILE, NEVER PER SUBJECT — and that distinction IS the finding.** *"The
 * freshness instrument"* read as covered for three passes: pass 1 filed a major on it, pass 2 fixed it,
 * pass 3 carried it forward clean. **`check-gate-freshness.ts` itself had never been opened by anyone**,
 * and pass 4's first major was in it. Subjects are elastic; a path is not.
 *
 * ## ⛔ THE SPLIT THAT MAKES THIS TRUSTWORTHY: enumeration is MECHANICAL, the claim is EXPLICIT
 *
 * The first cut of this file **parsed the pass reports** and inferred coverage from whether a filename
 * appeared in a `## Swept and found clean` section. **It was scrapped after being measured**: pass 3
 * demonstrably computed `check-glossary`'s full hit set, but writes it as *"glossary 30→0"* — so the scan
 * reported it never swept. Widening the match is **spelling enumeration, which has failed six times in
 * this cluster** (month arithmetic 5, `importStore` 4, markdown code 4, …).
 *
 * ⚠️ **A prose heuristic dressed as a measurement is the exact defect this whole surface exists to stop.**
 * So:
 *   • **The FILE LIST is walked from disk** — mechanical, cannot undercount, and this is the half that
 *     actually protects [D69]: a new surface file cannot appear without this gate demanding it be classified.
 *   • **The COVERAGE CLAIM is written down** in `surface-coverage.<key>.json`, one entry per file, asserted by
 *     whoever read the report. Judgement is recorded as judgement rather than inferred from prose.
 *
 * ⛔ **A MENTION IS NOT AN EXAMINATION**, and this was measured while building the inventory:
 * `write-gate-status.ts` appears in pass 1 inside a **grep hit-list**, as one of seven paths referencing
 * `check-audit-closure`. Nobody had read it, and pass 4's largest finding was in it. **`unknown` and
 * `never` both count as UNSWEPT** — the safe direction, because the cost of wrongly calling a file swept
 * is a finding silently exempted from convergence.
 *
 * ## Scope is an exclusion list
 *
 * Same reason `gateSources.ts` gives: an inclusion list fails **silent** — a surface file nobody thought
 * to enumerate is simply absent. An exclusion list fails **safe**.
 *
 * Usage: npm run lint:s0-coverage · npm run lint:s1-coverage   ·   `--report` prints the full table
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const REPORT = process.argv.includes('--report');

interface Surface {
  /** what the gate calls itself in its own output, so a failure names the surface a human would re-run */
  gate: string;
  /** one line for the inventory doc's title */
  title: string;
  /** directories walked recursively, and single files, both repo-relative with forward slashes */
  roots: string[];
  claims: string;
  inventory: string;
  /** ⛔ every `true` must name the surface that owns the file instead — see the docblock */
  excluded: (rel: string) => boolean;
}

const SOURCE_EXT = new Set(['.ts', '.tsx', '.mjs', '.cjs', '.json', '.sh']);

/**
 * ⚠️ Shared by every surface: `tsconfig.json` configures a surface rather than sitting on it, fixtures are
 * DATA, and this gate's own claim files are its record rather than its subject.
 */
const commonExcluded = (rel: string): boolean =>
  rel.endsWith('tsconfig.json') ||
  rel.includes('__fixtures__') ||
  /^scripts\/surface-coverage\.[a-z0-9]+\.json$/.test(rel);

/**
 * ⛔ **S4 owns discovery, the coach marks and the demo director; they live in `components/plan/` for
 * layout reasons and are not money.** Each name here is a routing statement, not a dismissal.
 */
const S4_OWNED = new Set([
  'CoachMarkLayer.tsx', 'TutorialCoach.tsx', 'TutorialFence.tsx', 'TutorialInviteCard.tsx',
  'TutorialOverlay.tsx', 'tutorialStage.ts',
  'DemoAutoEntry.tsx', 'DemoCaption.tsx', 'DemoDirector.tsx', 'DemoDock.tsx',
  'ExampleCanvasMarker.tsx',
]);

const SURFACES: Record<string, Surface> = {
  s0: {
    gate: 's0-coverage',
    title: 'S0 surface inventory — which pass actually swept which file',
    roots: ['scripts', 'apps/rn/src/data/migrationAudit'],
    claims: 'scripts/surface-coverage.s0.json',
    inventory: 'docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-SURFACE-INVENTORY.md',
    // ⚠️ `.tsx` joined SOURCE_EXT when this became multi-surface; `scripts/` has none, so S0 is unchanged.
    excluded: commonExcluded,
  },
  s1: {
    gate: 's1-coverage',
    title: 'S1 surface inventory — money · goals · plan cards',
    roots: [
      'apps/rn/src/components/plan',
      'apps/rn/src/components/entities',
      'packages/core/engine',
      'packages/core/guardian',
      'apps/rn/src/app/(tabs)/money.tsx',
      'apps/rn/src/store/guardianSelectors.ts',
      'apps/rn/src/store/guardianSelectors.test.ts',
      'apps/rn/src/store/journeySelectors.ts',
      'apps/rn/src/store/journeySelectors.test.ts',
      'apps/rn/src/store/planSelectors.ts',
      'apps/rn/src/store/store.ts',
      'apps/rn/src/data/models.ts',
      'apps/rn/src/data/migrations.ts',
      'apps/rn/src/data/migrations.test.ts',
    ],
    claims: 'scripts/surface-coverage.s1.json',
    inventory: 'docs/audits/2026-08-26-s1-money/S1-SURFACE-INVENTORY.md',
    /**
     * ⚠️ `migrations.ts` is on BOTH S1 and S3 and that is deliberate, not an oversight: blocker #1's root
     * is there and its false screen is `money.tsx`, and the standing rule is that **a cross-surface finding
     * is fixed once and re-verified by BOTH owners.** A file on one surface only is a seam nobody reads.
     */
    excluded: (rel) =>
      commonExcluded(rel) ||
      S4_OWNED.has(rel.split('/').pop() ?? '') ||
      rel.endsWith('components/plan/AppStoreCta.tsx') ||
      rel.endsWith('components/plan/AppStoreCta.web.tsx'),
  },
};

const requested = (process.argv.find((a) => a.startsWith('--surface='))?.split('=')[1] ?? 's0').toLowerCase();
const SURFACE = SURFACES[requested];
if (!SURFACE) {
  console.error(`\n❌ surface-coverage: unknown surface "${requested}". Known: ${Object.keys(SURFACES).join(', ')}.\n`);
  process.exit(1);
}
const CLAIMS_FILE = join(REPO_ROOT, SURFACE.claims);
const INVENTORY = join(REPO_ROOT, SURFACE.inventory);
const ROOTS = SURFACE.roots;
const excluded = SURFACE.excluded;

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') walk(p, out);
    } else if (SOURCE_EXT.has(extname(p))) {
      out.push(relative(REPO_ROOT, p).split(sep).join('/'));
    }
  }
}

const surface: string[] = [];
for (const r of ROOTS) {
  const abs = join(REPO_ROOT, r);
  let isDir: boolean;
  try {
    isDir = statSync(abs).isDirectory();
  } catch {
    // ⛔ A root that does not exist is a CONFIGURATION error, not an empty surface. Skipping it silently
    // is how a whole directory drops off a surface and every finding in it reads as first-look.
    console.error(`\n❌ ${SURFACE.gate}: root "${r}" does not exist. Fix SURFACES in scripts/surface-coverage.ts.\n`);
    process.exit(1);
  }
  if (isDir) walk(abs, surface);
  else surface.push(r);
}
const files = [...new Set(surface)].filter((f) => !excluded(f)).sort();

/**
 * The recorded claim per file. Values are the pass that examined it at the blocker/major bar:
 *   `p1`–`p4` — an S0 re-verification pass · `g4` — pass 4's guard inventory
 *   `r10`,`r17` — the earlier `.11.10` / `.11.17` rounds, real coverage that predates the surface passes
 *               and so is recorded distinctly
 *   `partial` — a pass opened the file but read only part of it
 *   `never`   — no pass has examined it · `unknown` — nobody has established which
 *
 * ⛔ **`never`, `unknown` AND `partial` are all UNSWEPT for [D69]'s purposes**, and `partial` is why this
 * value exists at all. `.11.17`'s money auditor reviewed nine plan cards **as a diff** — *"token-only
 * changes, no behaviour"* — and `store.ts` only at its *"goal / paycheck / repairs seams."* Recording
 * either as swept would repeat the exact error S0.12a was built to end: ⚡ *"swept clean" is a claim about
 * a SUBJECT; coverage is a property of a FILE.* A finding in the unread half of a partly-read file is a
 * first look, so `partial` records the truth and still behaves as unswept.
 */
type Claim = string[];
let claims: Record<string, Claim>;
try {
  claims = JSON.parse(readFileSync(CLAIMS_FILE, 'utf8')) as Record<string, Claim>;
} catch {
  console.error(`\n❌ ${SURFACE.gate}: ${relative(REPO_ROOT, CLAIMS_FILE)} is missing or unparseable.\n`);
  process.exit(1);
}

const missing = files.filter((f) => !(f in claims));
const stale = Object.keys(claims).filter((f) => !files.includes(f));
const unswept = files.filter((f) => {
  const c = claims[f] ?? ['unknown'];
  return c.length === 0 || c.every((v) => v === 'never' || v === 'unknown' || v === 'partial');
});

if (REPORT) {
  for (const f of files) console.log(`  ${(claims[f] ?? ['unknown']).join(' · ').padEnd(18)} ${f}`);
}

// ── the inventory, regenerated so the doc can never disagree with the data ────────────────────────
const lines = [
  `# ${SURFACE.title}`,
  '',
  `> ⛔ **GENERATED — do not hand-edit.** \`npm run lint:${SURFACE.gate}\` writes it from`,
  `> \`${SURFACE.claims}\`. [D69] needs *"first look"* to be a lookup rather than an`,
  "> auditor's claim; this is the lookup.",
  '>',
  '> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**',
  '> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being',
  '> measured wrong — see the docstring in `scripts/surface-coverage.ts`.',
  '',
  `**${files.length} files on the ${requested.toUpperCase()} surface · ${files.length - unswept.length} swept · ${unswept.length} unswept.**`,
  '',
  '`p1`–`p4` an S0 pass · `g4` the guard inventory · `r10` / `r17` an earlier round · `partial` opened but part-read · `never` / `unknown` / `partial` all UNSWEPT.',
  '',
  '| file | swept by |',
  '|---|---|',
  ...files.map((f) => {
    const c = claims[f] ?? ['unknown'];
    const un = unswept.includes(f);
    return `| \`${f}\` | ${un ? `⛔ **${c.join(' · ')}**` : c.join(' · ')} |`;
  }),
  '',
  '## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]',
  '',
  ...(unswept.length ? unswept.map((f) => `- \`${f}\``) : ['*(none)*']),
  '',
];
writeFileSync(INVENTORY, `${lines.join('\n')}\n`, 'utf8');

if (missing.length || stale.length) {
  console.error(`\n❌ ${SURFACE.gate}: the recorded claims do not describe the ${requested.toUpperCase()} surface.\n`);
  // Every entry, not a sample — an omitted line here is a file whose coverage nobody has decided.
  for (const f of missing) console.error(`  UNCLASSIFIED  ${f}  — new on the surface; record who swept it, or "never"`);
  for (const f of stale) console.error(`  STALE         ${f}  — recorded but no longer on the surface`);
  console.error(
    `\n  ⛔ [D69] exempts a finding from the convergence count when the file is unswept. That decision\n` +
      `  reads this table, so an unclassified file makes the exemption unverifiable in both directions.\n` +
      `  Edit ${relative(REPO_ROOT, CLAIMS_FILE)}.\n`,
  );
  process.exit(1);
}

console.log(`✅ ${SURFACE.gate}: ${files.length} surface files classified · ${unswept.length} unswept.`);
// ⚠️ Printed on the GREEN path deliberately. The unswept list is the backlog [D69] exempts findings
// against, and a number nobody sees is a number nobody acts on.
for (const f of unswept) console.log(`     unswept: ${f}`);
