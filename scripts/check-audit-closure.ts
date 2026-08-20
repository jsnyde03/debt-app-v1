/**
 * [D37] closure gate — every blocker/major finding must trace to a closure or a recorded refutation.
 *
 * ⛔ **Why this is a script and not a memory.** 🎯 2026-08-18: *"an untraceable closure is
 * indistinguishable from an open finding."* Run by hand at the T1–T8 exit it found **6 of 55** untraceable
 * — and every one of them was already BUILT. They had simply lost their id when a decomposed section was
 * collapsed into a summary row. Nothing was wrong with the code; the ledger had stopped being able to
 * prove it.
 *
 * ⚠️ **It expands compressed ranges before searching.** The plan writes `L1-5/6/7/14/19`, so a literal
 * grep for `L1-6` matches nothing — the first hand pass reported ~30 unassigned high+ and the real number
 * was 4. That expansion is the whole reason this is code.
 *
 * Usage: tsx scripts/check-audit-closure.ts
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const FINDINGS = join(REPO_ROOT, 'docs/audits/2026-08-17-v1.7-audit-gate/findings');

/** Where a closure may be recorded: the queue, the detail log, or the refutation record. */
const SOURCES = [
  join(REPO_ROOT, 'docs/DEBT_ELEVATION_PLAN.md'),
  join(REPO_ROOT, 'docs/DEBT_ELEVATION_LOG.md'),
  join(FINDINGS, 'L9-refutations.md'),
];

interface Finding {
  id: string;
  lens: string;
  severity: string;
  title: string;
}

const all: Finding[] = [];
for (const file of readdirSync(FINDINGS)) {
  if (!file.endsWith('.md') || file.startsWith('L9')) continue;
  let current: string | null = null;
  let title = '';
  for (const line of readFileSync(join(FINDINGS, file), 'utf8').split('\n')) {
    const heading = line.match(/^### (L\d+-\d+)\s*[—–·-]?\s*(.*)$/);
    if (heading) {
      current = heading[1];
      title = heading[2].trim();
    }
    const severity = line.match(/^- \*\*Severity:\*\* ([a-z]+)/);
    if (current && severity) {
      all.push({ id: current, lens: file.replace(/\.md$/, ''), severity: severity[1], title });
      current = null;
    }
  }
}

const highPlus = all.filter((f) => f.severity === 'blocker' || f.severity === 'major').map((f) => f.id);
/** Everything [D37] did NOT cover. Owned by Phase 6's FINISH sweep — see `REMAINING.md`. */
const lowTier = all.filter((f) => f.severity === 'minor' || f.severity === 'polish');

const recorded = new Set<string>();
for (const src of SOURCES) {
  for (const m of readFileSync(src, 'utf8').matchAll(/L(\d+)-(\d+(?:\/\d+)*)/g)) {
    for (const n of m[2].split('/')) recorded.add(`L${m[1]}-${n}`);
  }
}

const missing = highPlus.filter((id) => !recorded.has(id));
if (missing.length > 0) {
  console.error(`\n❌ [D37]: ${missing.length} of ${highPlus.length} high+ findings are not traceable.\n`);
  missing.forEach((id) => console.error(`  ${id}`));
  console.error('\n  Record each against the item that closed it (or a refutation in L9-refutations.md).');
  console.error('  ⚠️ Being FIXED is not enough — [D37] requires the closure be traceable to the id.\n');
  process.exit(1);
}
console.log(`✅ [D37]: all ${highPlus.length} high+ findings trace to a closure or a recorded refutation.`);

// ══════════════════════════════════════════════════════════════════════════════════════════════
// THE LOW TIER — minor + polish. REPORT ONLY, and it must stay that way.
// ══════════════════════════════════════════════════════════════════════════════════════════════
//
// ⛔ **Why this exists.** [D37] scoped this gate to blocker+major, so nothing has ever counted the other
// 62 findings. Measured 2026-08-19: **20 of them appear in NO ledger at all** — not the plan, not the log,
// not the refutations. The T9–T11 lists name specific ids, so a Phase-6 sweep driven off those lists would
// have silently dropped 20 findings, 13 of them L2 drift. A list you cannot prove is complete is a list
// that quietly shrinks.
//
// ⚠️ **NEVER `process.exit(1)` on this tier.** These are deliberately deferred to Phase 6's FINISH sweep
// (🎯 2026-08-19), so an untraced minor is the EXPECTED state, not a regression. A gate that reds on the
// expected state trains everyone to skip reading its output — which is precisely how the high+ gate above
// would lose its meaning.
//
// ⛔ **The `looseExpand` below is NOT used for the [D37] gate, and must never be.** It also expands
// `L1-20…35` ranges, which is right for "has anyone written this id down" and WRONG for "is this closure
// traceable" — a range mention would let a high+ finding pass on a neighbour's paperwork. Two questions,
// two strictnesses, deliberately not merged.
function looseExpand(text: string): Set<string> {
  const ids = new Set<string>();
  for (const m of text.matchAll(/L(\d+)-(\d+(?:\/\d+)*)/g)) {
    for (const n of m[2].split('/')) ids.add(`L${m[1]}-${n}`);
  }
  // ⛔ `(?:\d+\/)*` is load-bearing: the plan writes MIXED forms like `L5-10/12/17–21`, where the range
  // follows a slash-list. Without it the regex needs the range to sit immediately after the lens prefix,
  // so `17–21` was invisible and **L5-18/19/20 read as "in no ledger" while being explicitly listed**.
  // Found 2026-08-20 by chasing the three ids the low-tier report still called untraced.
  for (const m of text.matchAll(/L(\d+)-(?:\d+\/)*(\d+)\s*(?:…|\.\.\.|–|—)\s*(\d+)/g)) {
    for (let n = Number(m[2]); n <= Number(m[3]); n++) ids.add(`L${m[1]}-${n}`);
  }
  return ids;
}

const mentioned = new Set<string>();
for (const src of SOURCES) for (const id of looseExpand(readFileSync(src, 'utf8'))) mentioned.add(id);

const untraced = lowTier.filter((f) => !mentioned.has(f.id));
const minor = lowTier.filter((f) => f.severity === 'minor').length;
console.log(
  `📋 P6.4 owns ${lowTier.length} findings (${minor} minor · ${lowTier.length - minor} polish) — ` +
    `${untraced.length} of them are named in no ledger. Full inventory: REMAINING.md (regenerate with --remaining).`,
);

if (process.argv.includes('--remaining')) {
  const lines: string[] = [
    `# The ${lowTier.length} findings [D37] did not cover — owned by **P6.4**`,
    '',
    '> ⚠️ **GENERATED — do not hand-edit.** `tsx scripts/check-audit-closure.ts --remaining`',
    '>',
    '> This file exists because the T9–T11 lists were partial enumerations. It is the COMPLETE set,',
    '> derived from the findings files themselves, so the sweep cannot be driven off a list that has',
    '> quietly lost rows. "In a ledger" means the id is written down SOMEWHERE — it is **not** a claim',
    '> that the finding is closed, or still real. Both need the code.',
    '',
    '✅ **[D42], 2026-08-20 — the commitment is a BAR, not a COUNT.** All of them get **judged** at **P6.4**;',
    'what gets **fixed** is every defect and every finding on a surface that ships. **P6.4 is where FEATURE',
    'LOCK closes**, which is why this list defines that line ([D39]). ⚠️ T12 — the ~40 polish items — belongs',
    'to **P6.8**, the sweep on the frozen app, and is a different set.',
    '',
    '⚡ **Measured, and it should shape the judging:** of the 61 cross-file copy duplicates the strings',
    'instrument finds, **24 are generic chrome** (`Save`, `Cancel`, `Done`, `Add`, `Name`, `Back`) that',
    'repeat BY DESIGN, and **5 more involve `LiveActivityQA.tsx`, which the `QA_TOOLS` flip deletes** — so',
    'they close themselves. **Do not treat this as a list of edits.** Judge each; several are already dead,',
    'and more die with **P6.11.1** (the legacy-tree deletion, formerly numbered 5.5.1).',
    '',
    '⭐ **Verified 2026-08-20 (P6.2):** the findings files hold **117** `### Lx-n` headings and **117**',
    '`Severity:` lines, so the parser drops nothing — 55 high+ (gated by [D37]) + this set = 117. And every',
    'low-tier id the retired T9–T11 enumerations named is present below, so nothing is lost by retiring them.',
    '',
  ];
  for (const lens of [...new Set(lowTier.map((f) => f.lens))].sort()) {
    const rows = lowTier.filter((f) => f.lens === lens);
    lines.push(`## ${lens} — ${rows.length}`, '', '| id | severity | in a ledger? | finding |', '|---|---|---|---|');
    for (const f of rows) {
      lines.push(`| ${f.id} | ${f.severity} | ${mentioned.has(f.id) ? 'yes' : '⛔ **no**'} | ${f.title} |`);
    }
    lines.push('');
  }
  writeFileSync(join(FINDINGS, '..', 'REMAINING.md'), lines.join('\n'), 'utf8');
  console.log(`→ wrote REMAINING.md (${lowTier.length} findings)`);
}
