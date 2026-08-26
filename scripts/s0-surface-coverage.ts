/**
 * [D69] — WHICH FILES ON THE S0 SURFACE HAS A PASS ACTUALLY SWEPT?
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
 *   • **The COVERAGE CLAIM is written down** in `s0-surface-coverage.json`, one entry per file, asserted by
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
 * Usage: npm run lint:s0-coverage    ·   `--report` prints the full table
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const CLAIMS_FILE = join(REPO_ROOT, 'scripts/s0-surface-coverage.json');
const INVENTORY = join(
  REPO_ROOT,
  'docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-SURFACE-INVENTORY.md',
);
const REPORT = process.argv.includes('--report');

/** The S0 surface: the instruments, and the migration-audit layer the instruments certify. */
const ROOTS = ['scripts', 'apps/rn/src/data/migrationAudit'];
const SOURCE_EXT = new Set(['.ts', '.mjs', '.cjs', '.json', '.sh']);

/** Not an instrument: `tsconfig.json` configures the surface rather than sitting on it, and the
 *  migration-audit fixtures are DATA the layer reads. The coverage file itself is this gate's record. */
function excluded(rel: string): boolean {
  return (
    rel.endsWith('tsconfig.json') ||
    rel.includes('__fixtures__') ||
    rel === 'scripts/s0-surface-coverage.json'
  );
}

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
for (const r of ROOTS) walk(join(REPO_ROOT, r), surface);
const files = surface.filter((f) => !excluded(f)).sort();

/**
 * The recorded claim per file. Values are the pass that examined it at the blocker/major bar:
 *   `p1`–`p4` — an S0 re-verification pass · `g4` — pass 4's guard inventory
 *   `r17`     — the earlier `.11.17` round (`E-gates-instruments.md`), which is real coverage but
 *               predates S0 and so is recorded distinctly
 *   `never`   — no pass has examined it · `unknown` — nobody has established which
 * ⛔ `never` and `unknown` are both UNSWEPT for [D69]'s purposes.
 */
type Claim = string[];
let claims: Record<string, Claim>;
try {
  claims = JSON.parse(readFileSync(CLAIMS_FILE, 'utf8')) as Record<string, Claim>;
} catch {
  console.error(`\n❌ s0-coverage: ${relative(REPO_ROOT, CLAIMS_FILE)} is missing or unparseable.\n`);
  process.exit(1);
}

const missing = files.filter((f) => !(f in claims));
const stale = Object.keys(claims).filter((f) => !files.includes(f));
const unswept = files.filter((f) => {
  const c = claims[f] ?? ['unknown'];
  return c.length === 0 || c.every((v) => v === 'never' || v === 'unknown');
});

if (REPORT) {
  for (const f of files) console.log(`  ${(claims[f] ?? ['unknown']).join(' · ').padEnd(18)} ${f}`);
}

// ── the inventory, regenerated so the doc can never disagree with the data ────────────────────────
const lines = [
  '# S0 surface inventory — which pass actually swept which file',
  '',
  '> ⛔ **GENERATED — do not hand-edit.** `npm run lint:s0-coverage` writes it from',
  '> `scripts/s0-surface-coverage.json`. [D69] needs *"first look"* to be a lookup rather than an',
  "> auditor's claim; this is the lookup.",
  '>',
  '> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**',
  '> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being',
  '> measured wrong — see the docstring in `scripts/s0-surface-coverage.ts`.',
  '',
  `**${files.length} files on the S0 surface · ${files.length - unswept.length} swept · ${unswept.length} unswept.**`,
  '',
  '`p1`–`p4` an S0 pass · `g4` the guard inventory · `r17` the earlier `.11.17` round · `never` / `unknown` unswept.',
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
  console.error('\n❌ s0-coverage: the recorded claims do not describe the S0 surface.\n');
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

console.log(`✅ s0-coverage: ${files.length} surface files classified · ${unswept.length} unswept.`);
// ⚠️ Printed on the GREEN path deliberately. The unswept list is the backlog [D69] exempts findings
// against, and a number nobody sees is a number nobody acts on.
for (const f of unswept) console.log(`     unswept: ${f}`);
