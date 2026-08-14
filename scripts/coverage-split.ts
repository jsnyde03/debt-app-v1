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

interface Check { id: string; verdict: Verdict; section: string; done: boolean; title: string; line: number }
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
    checks.push({
      id: `§${id}`, verdict: verdict as Verdict, section, done: box.toLowerCase() === 'x',
      title: title.replace(/\*\*/g, '').replace(/[_`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 96),
      line: i + 1,
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
  return out;
}

// ── the report ────────────────────────────────────────────────────────────────────────────────────
function build(checks: Check[], claims: Claim[]): string {
  const claimsById = new Map<string, Claim[]>();
  for (const c of claims) claimsById.set(c.id, [...(claimsById.get(c.id) ?? []), c]);

  const real = checks.filter((c) => c.verdict !== '—');
  const coveredToday = real.filter((c) => AUTOMATABLE.includes(c.verdict) && claimsById.has(c.id));
  const notBuilt = real.filter((c) => AUTOMATABLE.includes(c.verdict) && !claimsById.has(c.id));
  const deviceOnly = real.filter((c) => c.verdict === 'D');
  const partials = real.filter((c) => c.verdict === 'M◐');
  const devicePass = deviceOnly.length + partials.length;

  const row = (c: Check) => {
    const cl = claimsById.get(c.id) ?? [];
    const by = cl.length ? cl.map((x) => `\`${x.flow.replace(/\.yaml$/, '')}\`${x.kind === 'PARTIAL' ? ' *(partial)*' : ''}`).join(' · ') : '—';
    return `| ${c.id} | \`[${c.verdict}]\` | ${c.title} | ${by} |`;
  };
  const table = (rows: Check[]) =>
    ['| id | verdict | check | claimed by |', '|---|---|---|---|', ...rows.map(row)].join('\n');

  const byVerdict = (v: Verdict) => real.filter((c) => c.verdict === v).length;

  return `# Device-checklist coverage split

> ⚙️ **GENERATED — do not edit.** \`npm run audit:coverage\`. Source of truth is
> [\`DEBT_3.5_DEVICE_QA_CHECKLIST.md\`](../DEBT_3.5_DEVICE_QA_CHECKLIST.md) (ids + verdicts) and the
> \`COVERS:\`/\`PARTIAL:\` declarations in \`apps/rn/.maestro/*.yaml\` (status).

## The answer

| | checks | |
|---|---:|---|
| **Covered today** | **${coveredToday.length}** | a flow claims it |
| **Coverable, not yet built** | **${notBuilt.length}** | verdict permits automation, nothing claims it — **this is 4.1's remaining work** |
| **Permanently device-owed** | **${deviceOnly.length}** | \`[D]\` — no lane will ever carry it |
| | | |
| **🎯 The device pass** | **${devicePass}** | \`[D]\` **+** the human half of every \`[M◐]\` (${partials.length}) |
| Real checks | ${real.length} | ${checks.length - real.length} further rows are \`[—]\` — install steps and report-back prompts |

**Verdict spread:** \`[M]\` ${byVerdict('M')} · \`[M◐]\` ${byVerdict('M◐')} · \`[A]\` ${byVerdict('A')} · \`[D]\` ${byVerdict('D')}

⚠️ **\`[M◐]\` rows appear in BOTH the coverage columns and the device pass.** That is not double-counting —
a partial is automated in one half and manual in the other, and reporting only \`[D]\` would overstate
what comes off the device pass.

---

## ▶ Coverable, not yet built — the remaining work (${notBuilt.length})

${table(notBuilt)}

---

## ✅ Covered today (${coveredToday.length})

${table(coveredToday)}

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
  const claimed = new Set(claims.map((c) => c.id));
  const covered = real.filter((c) => AUTOMATABLE.includes(c.verdict) && claimed.has(c.id)).length;
  const notBuilt = real.filter((c) => AUTOMATABLE.includes(c.verdict) && !claimed.has(c.id)).length;
  const device = real.filter((c) => c.verdict === 'D').length;
  const partial = real.filter((c) => c.verdict === 'M◐').length;
  console.log(`wrote ${OUT}`);
  console.log(`  covered today ${covered} · coverable-not-built ${notBuilt} · device-only ${device}`);
  console.log(`  the device pass is ${device + partial} rows (${device} [D] + ${partial} [M◐] halves)`);
}
