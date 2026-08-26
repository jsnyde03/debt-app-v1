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

/**
 * [P6.8.9-1] — THE SECOND AUDIT, and why this file had to learn about it.
 *
 * ⛔ This gate was hardcoded to the 2026-08-17 folder, so the P6.8 finish sweep — 13 lenses, 6 refuters —
 * had **no traceability gate at all**, while P6.8.7's exit line makes [D37]'s identical promise: *every
 * non-refuted finding carries a fix or a recorded reason.* The older audit's promise was enforced on every
 * push; the newer one rested on someone reading a 60-row table correctly.
 *
 * ⚠️ **It is not the same shape, and pretending it was is how this would have silently passed.** The 2026
 * -08-17 findings are `### L1-4` under `- **Severity:** major`; P6.8's slices are `### W1-1` under
 * `**Severity:** major`, with no list prefix and a two-letter lens. Both spellings are matched below.
 *
 * ⛔ **ALIASING IS THE HARD PART, and it is the reason this cannot be a grep.** SYNTHESIS carries a lens
 * id *and* a consolidated action id for the same finding — `C5` **is** M2-9, `C6` **is** M4-8, `A4` **is**
 * M1-9 — and the plan is written in the consolidated ones. A hand pass over this ledger reported 26
 * "unassigned" findings that were almost all aliases. Recording the alias next to the action id is what
 * makes the closure traceable, which is [D37]'s whole thesis restated: an untraceable closure is
 * indistinguishable from an open finding.
 *
 * ⛔ **AND THE FIX FOR THAT WAS TO READ SYNTHESIS AS A LEDGER, WHICH MADE THIS COUNT 12 SHORT.**
 * [P6.8.9.7.11.12.14 · D-J2-5] `SYNTHESIS.md` is the finish sweep's own summary: it names its findings in
 * its section headings — `### 1 · … *(M1-5 · R2 CONFIRMED, strengthened)*` — so **every** id it raised was
 * added to the recorded set. That is the audit citing itself, counted as a closure. ⚡ Measured by running
 * this gate with and without it: **39 with, 51 without**, and the 12 that turn on it alone are
 * `M1-1 M1-2 M1-5 M1-6 M2-1 M2-2 M2-5 M2-6 O1-9 V1-0 V1-1 V4-7` — the finding's figures, reproduced
 * exactly. ⚠️ This file's own headline applies to itself: *an instrument that under-reports is worse than
 * no instrument, because it is believed* — and `:150-151` conditions the flip to `exit(1)` on this number
 * reaching zero.
 *
 * ⚠️ **SO WHY NOT AN ALIAS MAP INSTEAD?** Because the consolidated ids are `A1`, `B4`, `C6` — two
 * characters, no dash — and the ledgers are hundreds of kilobytes of prose. Measured: `\bA1\b` matches
 * **9** times in the plan and **25** in the log, almost all incidental. **A token that short cannot be
 * searched for**, so an alias map keyed on it would rebuild the very defect above: traceability by
 * coincidental mention. ⭐ The alias has to be recorded where the closure is — write the LENS id into the
 * plan or log line that closes it, and this gate finds it with no special case at all.
 */
const P68_SLICES = join(REPO_ROOT, 'docs/audits/2026-08-21-p6.8-finish/slices');

/** Where a closure may be recorded: the queue, the detail log, or the refutation record. */
const SOURCES = [
  join(REPO_ROOT, 'docs/DEBT_ELEVATION_PLAN.md'),
  join(REPO_ROOT, 'docs/DEBT_ELEVATION_LOG.md'),
  join(FINDINGS, 'L9-refutations.md'),
];

/**
 * ⭐ **THE EXPLICIT CLOSURE TOKEN — `[closes: L5-5 M2-1]`.** *(P6.8.9.7.11.18 · S0.1 · M12)*
 *
 * ⛔ **Everything above this line is a MENTION check over prose, and a mention is not a closure.**
 * `.11.17` measured the P6.8 half counting **one sentence** — the fixer's own postmortem listing twelve
 * ids as untraceable — as the closure record for eleven of them. The gate's count went 39 → 51 → 39 inside
 * one commit range, and the second move was made by *the documentation of the first*.
 *
 * ⚡ **AND THE SAME DEFECT IS IN THE `[D37]` HALF, WHICH GATES AT `exit(1)`** and prints
 * *"all 55 high+ findings trace"* on every push. It is the same mention check over the same prose.
 *
 * ⛔ **WHY A CLEVERER REGEX IS NOT THE FIX — measured twice, wrong twice, while writing this.** A
 * same-line closure-verb heuristic rejects `*(all closed at 7a)*` when the verb is capitalised, and
 * rejects `**T3.6 · L5-5 — the stranded filter.**` — a genuine closure written as step-id attribution —
 * when it is not. **Prose mis-classifies in BOTH directions**, which is this file's own stated reason for
 * refusing an alias map (`:51-56`), arriving from the other end.
 *
 * ⚠️ **SO THE NUMBER BELOW IS NOT "COINCIDENCES" — that was the first draft's overclaim, and it does not
 * survive contact with the corpus.** Some of these are real closures written in prose; some are the
 * postmortem sentence that rescued eleven ids. ⛔ **The instrument cannot tell them apart, and that IS the
 * finding.** What is counted is exactly what can be said: **closures that are not machine-checkable.**
 * Measured at `c8d54fa`: **0 of 142** carry a token, so both caps start at *everything*.
 *
 * ⚠️ **The token does not replace the mention check — it RATCHETS it.** Requiring it outright would red
 * both halves on 142 findings and block every other surface's gate run. Instead the untokenised count is
 * printed and **capped by `MAX_UNTOKENISED`, which may only ever go DOWN**. A NEW finding that lands
 * without a token reds immediately; the backlog is retired by `.11.19`, which lowers each cap as it writes
 * tokens. ⛔ **When a cap reaches 0, delete it and require the token outright.**
 */
const CLOSES = /\[closes:\s*([^\]]+)\]/g;

/**
 * ⛔ **A QUOTED TOKEN IS AN EXAMPLE, NOT A RECORD — and skipping this minted four fabricated closures
 * within hours.** [S0.1, corrected at S0.1b · REVERIFY-1]
 *
 * The S0.1 log entry that *documented* this token wrote it twice: once as the syntax example and once in
 * the plant table. Both sit in `DEBT_ELEVATION_LOG.md`, which **is** a closure SOURCE — so `L0-1`, `L5-5`
 * and `M2-1` immediately read as machine-checkably closed, and both caps dropped on that evidence.
 *
 * ⚡ **That is M12 exactly, one mechanism over.** M12 was *"a postmortem ABOUT twelve ids counted as the
 * closure FOR them."* The fix for it then produced *"the documentation OF the token counted as a use of
 * the token."* ⛔ **The fixer's own write-up is inside the corpus the fixer is measuring**, and that is
 * true of every instrument whose ledger is the project's own prose.
 *
 * **The convention, and it is mechanical rather than a matter of care:** a closure record is written as
 * **plain text**; anything inside markdown code — a fenced block or an inline span — is quoted, so it is
 * an example and does not count. Blanking both before the scan is what makes documenting the token safe.
 */
/**
 * ⛔ **FOUR SPELLINGS OF "MARKDOWN CODE", and the first cut enumerated ONE.** [S0.8b · REVERIFY-2 finding 3]
 * ` ``` ` fences · `~~~` fences · four-space-indented blocks · inline spans of **any** backtick run length.
 * Missing three of them meant a token written in any of those still minted a closure.
 *
 * ⚠️ **Direction check, and it is what makes the indented-block rule safe:** hiding a REAL record inflates
 * the untokenised count, which reds the cap — noisy, and visible. Admitting a FAKE one deflates it, which
 * signs off a finding nobody examined. **The failures are not symmetric, so an ambiguous line is blanked.**
 */
function stripMarkdownCode(md: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, ' ');
  return (
    md
      // fenced blocks, both fence characters
      .replace(/^[ \t]*```[\s\S]*?^[ \t]*```/gm, blank)
      .replace(/^[ \t]*~~~[\s\S]*?^[ \t]*~~~/gm, blank)
      // four-space-indented code blocks — one line at a time; a token here is quoted output, not a record
      .replace(/^ {4,}\S[^\n]*$/gm, blank)
      // inline spans: a run of N backticks closes on a run of N. `` `x` `` and ``` ``x`` ``` both count.
      .replace(/(`+)(?:[^`\n]|(?!\1)`)*\1/g, blank)
  );
}

const explicit = new Set<string>();
for (const src of SOURCES) {
  for (const m of stripMarkdownCode(readFileSync(src, 'utf8')).matchAll(CLOSES)) {
    for (const id of m[1].split(/[\s,·]+/)) if (id.trim()) explicit.add(id.trim());
  }
}

/**
 * ⛔ **DOWNWARD ONLY. Raising either number to make a gate pass is the defect this gate exists to catch.**
 * Both measured at `c8d54fa` by a probe reproducing this file's own parsers and regexes verbatim.
 */
const MAX_UNTOKENISED = { d37: 55, p68: 48 };

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
  for (const line of readFileSync(join(FINDINGS, file), 'utf8').split(/\r?\n/)) {
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
const d37Untokenised = [...new Set(highPlus)].filter((id) => recorded.has(id) && !explicit.has(id));
if (missing.length > 0) {
  console.error(`\n❌ [D37]: ${missing.length} of ${highPlus.length} high+ findings are not traceable.\n`);
  missing.forEach((id) => console.error(`  ${id}`));
  console.error('\n  Record each against the item that closed it (or a refutation in L9-refutations.md).');
  console.error('  ⚠️ Being FIXED is not enough — [D37] requires the closure be traceable to the id.\n');
  process.exit(1);
}
console.log(`✅ [D37]: all ${highPlus.length} high+ findings trace to a closure or a recorded refutation.`);

// ⛔ …and how much of that green is a COINCIDENCE. See the `[closes: …]` docstring above.
if (d37Untokenised.length !== MAX_UNTOKENISED.d37) {
  console.error(
    `\n❌ [D37] untokenised-closure cap: ${d37Untokenised.length} high+ findings trace ONLY by an unmarked mention ` +
      `(cap ${MAX_UNTOKENISED.d37}).\n`,
  );
  d37Untokenised.forEach((id) => console.error(`  ${id}`));
  console.error(
    `\n  A mention is not a closure. Record it where the closure IS, with the explicit token:\n` +
      // ⛔ **A PLACEHOLDER, NOT A REAL ID.** [S0.8b · REVERIFY-2 finding 3] This line used to print the
      // first untokenised id inside a live token — and this project pastes gate output into the log,
      // which IS a closure SOURCE. Pasting the error would have closed the very finding it named.
      // **M12's shape a fifth time, produced by the instrument's own remediation text.**
      `      [closes: THE-ID-HERE]   (e.g. ${d37Untokenised[0]})\n` +
      `  ⛔ Do NOT raise the cap — it only ever goes down.\n`,
  );
  process.exit(1);
}
console.log(
  `   ⚠️ …but ${d37Untokenised.length} of ${new Set(highPlus).size} trace ONLY by an unmarked mention ` +
    `(cap ${MAX_UNTOKENISED.d37}, downward-only). ${explicit.size} carry an explicit \`[closes: …]\` token.`,
);

// ══════════════════════════════════════════════════════════════════════════════════════════════
// [P6.8.9-1] THE P6.8 FINISH SWEEP — same promise, same strictness, different id shape.
// ══════════════════════════════════════════════════════════════════════════════════════════════
const p68: Finding[] = [];
for (const file of readdirSync(P68_SLICES)) {
  if (!file.endsWith('.md')) continue;
  let current: string | null = null;
  let title = '';
  for (const line of readFileSync(join(P68_SLICES, file), 'utf8').split(/\r?\n/)) {
    // `### W1-1`, `### V3-5`, `### A1-11`, `### M4-8` — one to two letters, an optional lens digit.
    const heading = line.match(/^#{2,4} ([A-Z]{1,2}\d?-\d+[a-z]?)\s*[—–·-]?\s*(.*)$/);
    if (heading) {
      current = heading[1];
      title = heading[2].trim();
    }
    // ⚠️ Three spellings, and the third cost the whole P1 lens. The 2026-08-17 findings write the severity
    // as a list item and the P6.8 slices write it bare, so this was anchored to the start of the line —
    // but `P1-premium-bar.md` writes `**Part:** A-craft · **Severity:** major`, with the severity MID-LINE.
    // ⛔ Anchored, this file reported `80 high+ findings` and saw **zero** of P1's, so P6.8.9's mechanical
    // exit criterion would have read clean with seven majors — including five in no ledger at all — never
    // examined. Un-anchoring finds 87. That is this audit's own headline landing on the gate built to
    // prevent it: an instrument that under-reports is worse than no instrument, because it is believed.
    const severity = line.match(/\*\*Severity:\*\*\s*([a-z]+)/);
    if (current && severity) {
      p68.push({ id: current, lens: file.replace(/\.md$/, ''), severity: severity[1], title });
      current = null;
    }
  }
}

/**
 * Any lens id written down anywhere a **closure** may be recorded, slash-lists expanded (`A1-7/8/9`).
 *
 * ⛔ `SOURCES` and nothing else. [P6.8.9.7.11.12.14 · D-J2-5] `SYNTHESIS.md` used to be appended here, and
 * an audit's own summary of what it found is not a record of anything being done about it — see the
 * docstring at the top of this file for the measurement and for why an alias map cannot replace it.
 */
const p68Recorded = new Set<string>();
for (const src of SOURCES) {
  for (const m of readFileSync(src, 'utf8').matchAll(/\b([A-Z]{1,2}\d?)-(\d+(?:\/\d+)*[a-z]?)\b/g)) {
    for (const n of m[2].split('/')) p68Recorded.add(`${m[1]}-${n}`);
  }
}

const p68HighPlus = p68.filter((f) => f.severity === 'blocker' || f.severity === 'major');
const p68Missing = p68HighPlus.filter((f) => !p68Recorded.has(f.id));

// ⛔ Traced, but by prose that only DISCUSSES the finding. See the `[closes: …]` docstring above.
const p68Untokenised = p68HighPlus.filter((f) => p68Recorded.has(f.id) && !explicit.has(f.id));
if (p68Untokenised.length !== MAX_UNTOKENISED.p68) {
  console.error(
    `\n❌ P6.8 untokenised-closure cap: ${p68Untokenised.length} high+ findings trace ONLY by an unmarked mention ` +
      `(cap ${MAX_UNTOKENISED.p68}).\n`,
  );
  p68Untokenised.forEach((f) => console.error(`  ${f.id.padEnd(8)} ${f.lens}`));
  console.error(
    // ⛔ Placeholder, not a real id — see the note on the [D37] branch above.
    // ⚠️ **SIX-SPACE INDENT, matching that branch.** [REVERIFY-3 · attack 5] At two spaces this line is
    // not inside a markdown code block, so pasting it into the log registers `THE-ID-HERE` in `explicit`.
    // Inert — `explicit` is only read via `.has(realId)` — but it inflates the printed `explicit.size`,
    // and *"inert today"* is how the live version of this got here.
    `\n  Record it where the closure IS:\n      [closes: THE-ID-HERE]   (e.g. ${p68Untokenised[0]?.id})\n` +
      `  ⛔ Do NOT raise the cap — it only ever goes down.\n`,
  );
  process.exit(1);
}

// ⛔ **REPORT-ONLY UNTIL P6.8.9, AND THAT IS A DESIGN CHOICE WITH A DATE ON IT.**
//
// The sweep is mid-build: P6.8.7c–g are unwritten, so an untraced high+ finding is the EXPECTED state
// today, not a regression. This file already argues the case for the low tier and the argument is the
// same one — *"a gate that reds on the expected state trains everyone to skip reading its output, which
// is precisely how the high+ gate above would lose its meaning."*
//
// ⭐ **What it buys instead is a mechanical exit criterion for P6.8.9.** That step is chartered to confirm
// *"no other major+ issue remains"*, which until now meant reading a 60-row table by eye — and a hand pass
// over this same ledger already reported 26 findings unassigned that were mostly ALIASES. The number below
// is that check, run in a second, every push.
//
// ⛔ **P6.8.9 FLIPS THIS TO `process.exit(1)`** once the count reaches zero. Leaving it report-only past
// that point would be the same failure as never having built it.
if (p68Missing.length > 0) {
  console.log(
    `📋 P6.8 sweep: ${p68Missing.length} of ${p68HighPlus.length} high+ findings are named in NO CLOSURE ledger ` +
      `(plan · log · refutations). Report-only until P6.8.9 — see the note in this file.\n` +
      `   ⚠️ The audit's own SYNTHESIS is deliberately NOT counted (D-J2-5) — a finding is closed by a line ` +
      `in the plan or log naming its LENS id, not by the audit that raised it.\n` +
      `   ⚠️ Of the ${p68HighPlus.length - p68Missing.length} that DO trace, ${p68Untokenised.length} trace ` +
      `only by an unmarked mention (cap ${MAX_UNTOKENISED.p68}, downward-only) — a mention is not a closure.`,
  );
  if (process.argv.includes('--p68')) {
    for (const f of p68Missing) console.log(`   ${f.id.padEnd(8)} ${f.lens.padEnd(22)} ${f.title.slice(0, 70)}`);
  }
} else {
  console.log(
    `✅ P6.8 sweep: all ${p68HighPlus.length} high+ findings across ${new Set(p68.map((f) => f.lens)).size} lenses are traceable — P6.8.9 may now flip this to gating.`,
  );
}

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
