/**
 * 4.1.6a — HOW MUCH OF THE DEVICE CHECKLIST DOES THE LANE CARRY?
 *
 * 🎯 Jason 2026-08-14: *"the point of 4.1 is to see how much of the 3.5 checklist that I currently have
 * for the device build will be covered by Maestro and/or Appium."* That question has two axes, and only
 * one of them comes from the flows:
 *
 *   VERDICT — can this check ever be automated?  → the `[M]/[M◐]/[A]/[D]/[—]` tag on the checklist row
 *   STATUS  — is it automated YET?               → a `COVERS:`/`PARTIAL:` declaration in a Maestro flow
 *
 * Crossing them gives the three columns the device pass is actually planned from:
 *   • covered today          — a flow claims it
 *   • coverable, not built   — verdict allows automation, nothing claims it  (this IS the remaining work)
 *   • device-owed            — [D] rows, plus the human half of every [M◐]   (this IS Jason's sitting)
 *
 * ⚠️ READ-ONLY on the checklist, by design. `DEBT_3.5_DEVICE_QA_CHECKLIST.md` carries hand-recorded `[x]`
 * device results and inline findings written by hand; those are not regenerable, so nothing here writes
 * to it. Ids and verdicts were placed by one-shot codemods under human review, not by this script.
 *
 * ⚠️ The gate is STRUCTURAL, and the name says so. It proves a declared id exists and that its verdict
 * permits automation. It CANNOT prove the flow's assertions really test that check — same honest limit
 * as `lint:selectors` check ③, which was renamed when it turned out weaker than its name implied.
 *
 * Usage:  npm run audit:coverage          → writes docs/audits/coverage-split.md
 *         npm run lint:coverage           → gate only, exits 1 on a structural defect
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..');
const CHECKLIST = join(REPO_ROOT, 'docs', 'DEBT_3.5_DEVICE_QA_CHECKLIST.md');
const FLOW_DIR = join(REPO_ROOT, 'apps', 'rn', '.maestro');
const OUT = join(REPO_ROOT, 'docs', 'audits', 'coverage-split.md');

/**
 * ⚠️ SINGLE SOURCE. §6's two subsections are lettered (`§6a.N`, `§6b.N`) and the BUILD deltas are
 * `§B2.N`/`§B3.N`. The first verifier written against these ids used `\d+|B\d+` and reported 14 false
 * failures against ids that were perfectly well formed. Every id regex in this file derives from here.
 */
const IDCHARS = String.raw`(?:\d+[ab]?|B\d+)(?:\.\d+)*`;

type Verdict = 'M' | 'M◐' | 'A' | 'D' | '—';
const AUTOMATABLE: Verdict[] = ['M', 'M◐', 'A'];

/**
 * 4.1.9c — ⭐ **CLAIMED IS NOT PROVEN, AND THIS FILE USED TO CONFLATE THEM.**
 *
 * 🎯 Jason 2026-08-14: *"Nothing should be marked covered unless it's proven to be. And as items are
 * proven, they should be checked off."*
 *
 * A `COVERS:` declaration is a flow AUTHOR'S CLAIM about what a flow tests. It says nothing about
 * whether the flow has ever executed, let alone passed — and the headline number was built entirely
 * from those declarations, so a flow that has never run once counted exactly like one green on every
 * run. ⛔ Measured 2026-08-14: **8 of the 33 claimed rows had never executed**, and **6 more traced to
 * `08-coach-marks`, which was RED**, while all of them counted as covered.
 *
 * So a row is **PROVEN** only if the checklist ticks it, and the tick carries its provenance:
 *   `✅auto·<runId>`  — a CI run passed the flow that claims it. Machine-earned, machine-managed.
 *   a bare `[x]`      — a human ran it on real hardware. ⚠️ Never touched by automation, by design.
 *
 * ⚠️ The stamp records a RUN, not a flow verdict, which is exactly how the current 24 came to include
 * six from a red flow. The writer that fixes that needs a durable per-flow results file from the
 * workflow and lands with 4.1.9b; THIS half is the reader, and it makes the gap countable meanwhile.
 */
const STAMP_RE = /✅auto·(\d+)/;

interface Check {
  id: string; verdict: Verdict; section: string; done: boolean; title: string; line: number;
  /** the run id from a `✅auto·<runId>` stamp; undefined for a bare `[x]` or an unticked row */
  stamp?: string;
}
interface Claim { id: string; kind: 'COVERS' | 'PARTIAL'; why: string; flow: string; line: number }

// ── the checklist ─────────────────────────────────────────────────────────────────────────────────
/**
 * ⚠️ A row's id is its LEADING token, and even that is not sufficient on its own: §9 carries a prose row
 * opening `**§11 · §12 · §13 clean = …`, which is a citation, not a definition. A real id is always
 * followed by ` — ` (legacy, id inside the title span) or closed by `**` (id in its own span).
 */
const ROW_RE = new RegExp(
  String.raw`^\s*-\s*\[( |x|X)\]\s*\x60\[([^\]]+)\]\x60\s+\*\*§(${IDCHARS})(?:\*\*\s*|\s+—\s*)(.*)$`,
);

function parseChecklist(): { checks: Check[]; problems: string[] } {
  const problems: string[] = [];
  const checks: Check[] = [];
  const lines = readFileSync(CHECKLIST, 'utf8').split(/\r?\n/);
  let section = '(preamble)';
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^#{2,3}\s+(.*)$/);
    if (h) { section = h[1].replace(/\s+—.*$/, '').replace(/[*_`]/g, '').trim(); continue; }
    const bare = lines[i].match(/^\s*-\s*\[[ xX]\]/);
    if (!bare) continue;
    const m = lines[i].match(ROW_RE);
    if (!m) { problems.push(`${CHECKLIST}:${i + 1} — checkbox row without a \`[verdict]\` + \`**§id**\`: ${lines[i].slice(0, 88)}`); continue; }
    const [, box, verdict, id, title] = m;
    if (!(['M', 'M◐', 'A', 'D', '—'] as string[]).includes(verdict)) {
      problems.push(`${CHECKLIST}:${i + 1} — unknown verdict [${verdict}] on §${id}`);
      continue;
    }
    // ⚠️ THE STAMP IS READ FROM THE WHOLE LOGICAL ROW, NOT FROM THIS LINE. Two reasons, and the second
    // was measured the hard way: `title` is sliced to 96 chars, so a long check would lose its own
    // provenance; and a checklist row WRAPS onto indented continuation lines, which is where a stamp
    // naturally belongs — a row's first line usually ends mid-sentence. Reading only `lines[i]` counted
    // five freshly machine-stamped rows as human-earned, collapsing the exact provenance distinction
    // this file exists to keep. A block ends at the next row, a blank line, a heading, or a table.
    let end = i;
    while (end + 1 < lines.length) {
      const nxt = lines[end + 1];
      if (/^\s*-\s*\[[ xX]\]/.test(nxt) || /^\s*$/.test(nxt) || /^#{1,6}\s/.test(nxt) || /^\s*\|/.test(nxt)) break;
      end++;
    }
    const stamp = lines.slice(i, end + 1).join('\n').match(STAMP_RE)?.[1];
    checks.push({
      id: `§${id}`, verdict: verdict as Verdict, section, done: box.toLowerCase() === 'x',
      title: title.replace(STAMP_RE, '').replace(/\*\*/g, '').replace(/[_`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 96),
      line: i + 1, stamp,
    });
  }
  const seen = new Map<string, number>();
  for (const c of checks) {
    if (seen.has(c.id)) problems.push(`duplicate id ${c.id} — lines ${seen.get(c.id)} and ${c.line}`);
    seen.set(c.id, c.line);
  }
  return { checks, problems };
}

// ── the flows ─────────────────────────────────────────────────────────────────────────────────────
const CLAIM_RE = new RegExp(String.raw`^#\s*(COVERS|PARTIAL):\s*§(${IDCHARS})\s*—\s*(.*)$`);

function parseFlows(): Claim[] {
  const claims: Claim[] = [];
  for (const f of readdirSync(FLOW_DIR).filter((x) => x.endsWith('.yaml'))) {
    const lines = readFileSync(join(FLOW_DIR, f), 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(CLAIM_RE);
      if (!m) continue;
      claims.push({ kind: m[1] as Claim['kind'], id: `§${m[2]}`, why: m[3].trim(), flow: f, line: i + 1 });
    }
  }
  return claims;
}

// ── the gate ──────────────────────────────────────────────────────────────────────────────────────
function gate(checks: Check[], claims: Claim[], problems: string[]): string[] {
  const byId = new Map(checks.map((c) => [c.id, c]));
  const out = [...problems];
  for (const cl of claims) {
    const check = byId.get(cl.id);
    if (!check) { out.push(`${cl.flow}:${cl.line} — ${cl.kind} ${cl.id}, which is not a check in the checklist`); continue; }
    if (!AUTOMATABLE.includes(check.verdict)) {
      out.push(`${cl.flow}:${cl.line} — ${cl.kind} ${cl.id}, whose verdict is [${check.verdict}]. A flow cannot cover a check marked ${check.verdict === '—' ? 'not-a-check' : 'device-only'}; if the verdict is wrong, change the verdict deliberately and say why.`);
    }
    if (cl.kind === 'COVERS' && check?.verdict === 'M◐') {
      out.push(`${cl.flow}:${cl.line} — COVERS ${cl.id}, but its verdict is [M◐] (a device-owed half remains). Declare PARTIAL, or promote the verdict to [M] if the whole check really is automated.`);
    }
  }

  // ── 4.1.9c · the stamp's own integrity ──────────────────────────────────────────────────────────
  // ⚠️ These gate the PROVENANCE MARK, which nothing checked before — the reader below counts a
  // stamped row as proven, so a stamp that means nothing would inflate the honest number in exactly
  // the direction 🎯 asked to stop. Each is structural: no run, no network, no flow execution.
  const claimedIds = new Set(claims.map((c) => c.id));
  for (const c of checks) {
    if (!c.stamp) continue;
    if (!claimedIds.has(c.id)) {
      out.push(`${CHECKLIST}:${c.line} — ${c.id} carries \`✅auto·${c.stamp}\` but NO flow declares COVERS/PARTIAL for it. An automation stamp that no flow can account for is untraceable; remove it, or add the declaration it implies.`);
    }
    if (!AUTOMATABLE.includes(c.verdict)) {
      out.push(`${CHECKLIST}:${c.line} — ${c.id} carries \`✅auto·${c.stamp}\` but its verdict is [${c.verdict}]. A ${c.verdict === '—' ? 'not-a-check' : 'device-only'} row cannot be machine-proven.`);
    }
    // ⛔ NOT FOR `[M◐]`, AND THAT EXEMPTION IS THE POINT. 🎯's rule — "as items are proven, they should
    // be checked off" — is right for a row automation can prove OUTRIGHT. A partial has a device-owed
    // half, so its box belongs to whoever runs the device pass; an auto-tick there would claim a human
    // verified something no human has looked at. For a partial, a stamp WITHOUT a tick is the correct
    // and complete record: the automatable half is green, the other half is still owed.
    // ⚠️ Written the other way two hours earlier, and flow 10's three `[M◐]` rows are what exposed it.
    if (!c.done && c.verdict !== 'M◐') {
      out.push(`${CHECKLIST}:${c.line} — ${c.id} carries \`✅auto·${c.stamp}\` but its box is unticked. 🎯's rule is that proving an item checks it off; a stamp without a tick is half a record.`);
    }
  }
  return out;
}

// ── the report ────────────────────────────────────────────────────────────────────────────────────
function build(checks: Check[], claims: Claim[]): string {
  const claimsById = new Map<string, Claim[]>();
  for (const c of claims) claimsById.set(c.id, [...(claimsById.get(c.id) ?? []), c]);

  const real = checks.filter((c) => c.verdict !== '—');
  const claimed = real.filter((c) => AUTOMATABLE.includes(c.verdict) && claimsById.has(c.id));
  // ⭐ 4.1.9c's whole point: a claim is proven only once the row is TICKED. Split by provenance —
  // machine-earned rows are automation's to manage, the bare `[x]` are Jason's and are never touched.
  // ⛔ A PARTIAL IS NOT A PASS, AND COUNTING IT AS ONE IS THE EXACT OVERSTATEMENT 4.1.9c EXISTS TO KILL.
  // The rule: "partials count only for their automatable half." An `[M◐]` row keeps a device-owed half
  // however green the lane goes, so it can never be *fully* proven by automation — it earns a third
  // column, not a place in the headline. ⚠️ The first version of this reader lumped them, which would
  // have moved the headline 30 → 33 on flow 10's pass while three human halves were still outstanding.
  const isPartial = (c: Check) => c.verdict === 'M◐';
  const proven = claimed.filter((c) => c.done && !isPartial(c));
  const halfProven = claimed.filter((c) => isPartial(c) && (c.done || c.stamp));
  const autoProven = proven.filter((c) => c.stamp);
  const humanProven = proven.filter((c) => !c.stamp);
  const claimedUnproven = claimed.filter((c) => !c.done && !c.stamp);
  const notBuilt = real.filter((c) => AUTOMATABLE.includes(c.verdict) && !claimsById.has(c.id));
  const deviceOnly = real.filter((c) => c.verdict === 'D');
  const partials = real.filter((c) => c.verdict === 'M◐');
  const devicePass = deviceOnly.length + partials.length;

  const byRun = new Map<string, number>();
  for (const c of autoProven) byRun.set(c.stamp!, (byRun.get(c.stamp!) ?? 0) + 1);

  const proof = (c: Check) => (c.stamp ? `\`✅auto·${c.stamp}\`` : c.done ? '*human* `[x]`' : '⚠️ **none**');
  const row = (c: Check) => {
    const cl = claimsById.get(c.id) ?? [];
    const by = cl.length ? cl.map((x) => `\`${x.flow.replace(/\.yaml$/, '')}\`${x.kind === 'PARTIAL' ? ' *(partial)*' : ''}`).join(' · ') : '—';
    return `| ${c.id} | \`[${c.verdict}]\` | ${c.title} | ${by} | ${proof(c)} |`;
  };
  const table = (rows: Check[]) =>
    ['| id | verdict | check | claimed by | proof |', '|---|---|---|---|---|', ...rows.map(row)].join('\n');

  const byVerdict = (v: Verdict) => real.filter((c) => c.verdict === v).length;

  return `# Device-checklist coverage split

> ⚙️ **GENERATED — do not edit.** \`npm run audit:coverage\`. Source of truth is
> [\`DEBT_3.5_DEVICE_QA_CHECKLIST.md\`](../DEBT_3.5_DEVICE_QA_CHECKLIST.md) (ids + verdicts) and the
> \`COVERS:\`/\`PARTIAL:\` declarations in \`apps/rn/.maestro/*.yaml\` (status).

## The answer

🎯 **2026-08-14: *"Nothing should be marked covered unless it's proven to be."*** So the headline is
**${proven.length}**, not ${claimed.length}. The difference is the row below it, and it is the honest gap.

| | checks | |
|---|---:|---|
| **✅ Covered — PROVEN** | **${proven.length}** | proved OUTRIGHT: ${autoProven.length} machine-earned \`✅auto·<runId>\` · ${humanProven.length} human-earned \`[x]\` |
| **◐ Automatable half proven** | **${halfProven.length}** | \`[M◐]\` — the lane's half is green; **the device-owed half is still owed** and its box stays for the human |
| **⚠️ Claimed but UNPROVEN** | **${claimedUnproven.length}** | a flow declares it; no run has ever passed it. **These were counted as covered before 4.1.9c** |
| **▶ Coverable, not yet built** | **${notBuilt.length}** | verdict permits automation, nothing claims it — **this is 4.1's remaining work** |
| **🎯 Permanently device-owed** | **${deviceOnly.length}** | \`[D]\` — no lane will ever carry it |
| | | |
| **🎯 The device pass** | **${devicePass}** | \`[D]\` **+** the human half of every \`[M◐]\` (${partials.length}) |
| Real checks | ${real.length} | ${checks.length - real.length} further rows are \`[—]\` — install steps and report-back prompts |

⛔ **A declaration is an author's claim, not a result.** \`COVERS:\` says what a flow is *meant* to test;
it cannot say whether the flow has ever executed, let alone passed. The ${claimedUnproven.length} unproven rows are all
claimed by flows that have never gone green — and each one used to be indistinguishable, in this
report, from a check that passes on every run.

**Machine-earned rows by run:** ${byRun.size ? [...byRun].map(([r, n]) => `\`${r}\` ${n}`).join(' · ') : '*(none)*'}
${byRun.size === 1 ? `\n⚠️ **Every machine-earned row traces to a single run.** One run is one sample: it proves those flows passed once, on one runner, at one commit — not that they are stable. A regression is only visible once a second run disagrees.\n` : ''}

**Verdict spread:** \`[M]\` ${byVerdict('M')} · \`[M◐]\` ${byVerdict('M◐')} · \`[A]\` ${byVerdict('A')} · \`[D]\` ${byVerdict('D')}

⚠️ **\`[M◐]\` rows appear in BOTH the coverage columns and the device pass.** That is not double-counting —
a partial is automated in one half and manual in the other, and reporting only \`[D]\` would overstate
what comes off the device pass.

---

## ▶ Coverable, not yet built — the remaining work (${notBuilt.length})

${table(notBuilt)}

---

## ⚠️ Claimed but UNPROVEN — declared by a flow, never passed (${claimedUnproven.length})

**Read this list before quoting a coverage number.** Each row has a flow that says it covers it and no
run that has ever passed it. Until one does, it is a plan, not coverage.

${claimedUnproven.length ? table(claimedUnproven) : '*(none — every claim is proven)*'}

---

## ✅ Covered — PROVEN (${proven.length})

${table(proven)}

---

## 🎯 Permanently device-owed (${deviceOnly.length})

${table(deviceOnly)}

---

## ◐ Partials — automated in one half, yours in the other (${partials.length})

${partials.map((c) => {
    const cl = (claimsById.get(c.id) ?? []).map((x) => `${x.flow.replace(/\.yaml$/, '')}: ${x.why}`).join(' · ');
    return `- **${c.id}** — ${c.title}\n  ${cl || '⚠️ *no flow claims even the automatable half yet*'}`;
  }).join('\n')}
`;
}

// ── main ──────────────────────────────────────────────────────────────────────────────────────────
const { checks, problems } = parseChecklist();
const claims = parseFlows();
const failures = gate(checks, claims, problems);
const gateOnly = process.argv.includes('--gate');

if (failures.length) {
  console.error(`\n⛔ coverage gate — ${failures.length} structural defect${failures.length > 1 ? 's' : ''}:\n`);
  for (const f of failures) console.error(`  • ${f}`);
  console.error('');
  process.exit(1);
}

if (gateOnly) {
  console.log(`✅ coverage gate: ${checks.length} checks, ${claims.length} claims, no structural defects.`);
} else {
  writeFileSync(OUT, build(checks, claims), 'utf8');
  const real = checks.filter((c) => c.verdict !== '—');
  const claimedIds = new Set(claims.map((c) => c.id));
  const claimed = real.filter((c) => AUTOMATABLE.includes(c.verdict) && claimedIds.has(c.id));
  const half = claimed.filter((c) => c.verdict === 'M◐' && (c.done || c.stamp));
  const proven = claimed.filter((c) => c.done && c.verdict !== 'M◐');
  const notBuilt = real.filter((c) => AUTOMATABLE.includes(c.verdict) && !claimedIds.has(c.id)).length;
  const device = real.filter((c) => c.verdict === 'D').length;
  const partial = real.filter((c) => c.verdict === 'M◐').length;
  console.log(`wrote ${OUT}`);
  console.log(`  PROVEN ${proven.length} (${proven.filter((c) => c.stamp).length} auto · ${proven.filter((c) => !c.stamp).length} human)`);
  console.log(`  automatable half proven ${half.length} [M◐] · claimed but unproven ${claimed.length - proven.length - half.length}`);
  console.log(`  coverable-not-built ${notBuilt} · device-only ${device}`);
  console.log(`  the device pass is ${device + partial} rows (${device} [D] + ${partial} [M◐] halves)`);
}
