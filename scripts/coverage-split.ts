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
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
/**
 * ⛔ THE GRAMMAR MOVED OUT AT 4.1.9c, and the move is the point. The writer (`stamp-coverage.ts`) has to
 * agree with this file about what a row is, what an id is, and where a stamp lives — down to the byte.
 * Two private copies would have been agreeing copies, which is this repo's most-repeated defect shape
 * (Wave A hit it three times in one wave). ⚡ **Proven inert: `coverage-split.md` is byte-identical
 * across the extraction.**
 */
import {
  parseChecklist, parseAllClaims, claimsById, isPartialRow, REPO_ROOT, CHECKLIST, AUTOMATABLE,
  type Verdict, type Check, type Claim,
} from './coverage-model.ts';

/**
 * 4.1.10 — ⛔ **A `PARTIAL:` CLAIM DOES NOT PROVE A ROW, AND THIS FILE USED TO LET IT.**
 *
 * Partial-ness was read off the row's VERDICT (`[M◐]`) and never off the claim's KIND, so `PARTIAL:` on
 * an `[M]` row counted exactly like `COVERS:`. Measured 2026-08-17: **§1.1 · §3.1 · §10.2 were in the
 * PROVEN 24** while their only claims say, in their own words, *"'no white screen / no crash' is not
 * asserted"*, *"the EDIT-sheet half of the row is not walked"*, *"rotation is not"*.
 *
 * ⚡ **It is 4.1.9c's defect one level down.** That one fixed *declared ≠ proven*; this is *partly tested
 * ≠ fully proven*. A row is fully proven only if some claim covers the WHOLE of it.
 */
// (the test itself is `isPartialRow` in `coverage-model.ts` — the report, the gate and the writer all
// ask it, and when they each had their own copy the gate rejected five rows the writer wrote correctly)

const OUT = join(REPO_ROOT, 'docs', 'audits', 'coverage-split.md');

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
 * six from a red flow. ✅ **The writer landed at 4.1.9c — `scripts/stamp-coverage.ts`**, which reads the
 * lane's durable `native-lane-results-<tier>.json` and can both place and REVOKE a stamp. The grammar
 * both halves share lives in `coverage-model.ts`.
 */

// ── the gate ──────────────────────────────────────────────────────────────────────────────────────
function gate(checks: Check[], claims: Claim[], problems: string[]): string[] {
  const byId = new Map(checks.map((c) => [c.id, c]));
  const out = [...problems];
  // ⚠️ THE SAME PARTIAL TEST THE WRITER USES, and it has to be. When the writer learned that partial-only
  // claims withhold the tick and this gate still only knew `[M◐]`, the gate rejected five rows the writer
  // had just written correctly. One function, three callers — see `isPartialRow`.
  const claimsFor = claimsById(claims);
  const partial = (c: Check) => isPartialRow(c, claimsFor.get(c.id) ?? []);
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
    if (!c.done && !partial(c)) {
      out.push(`${CHECKLIST}:${c.line} — ${c.id} carries \`✅auto·${c.stamp}\` but its box is unticked. 🎯's rule is that proving an item checks it off; a stamp without a tick is half a record.`);
    }
  }

  // ── 4.1.10 · `✅gate`'s integrity — the same three rules, plus the one that is specific to it ──────
  const specClaimed = new Set(claims.filter((c) => c.harness === 'playwright').map((c) => c.id));
  for (const c of checks) {
    if (!c.gate) continue;
    // ⛔ THE RULE THAT IS ONLY TRUE OF THIS MARK: `✅gate` means *a spec in `validate:release:rn` holds
    // this on every push*. A row claimed only by a Maestro flow is proven by a RUN, not by a gate — the
    // native lane is dispatch-only, and calling that continuous is the overstatement the mark must not
    // be allowed to make.
    if (!specClaimed.has(c.id)) {
      out.push(`${CHECKLIST}:${c.line} — ${c.id} carries \`✅gate\` but no PLAYWRIGHT spec declares COVERS/PARTIAL for it. That mark asserts a push-gate holds the row; only a spec in \`validate:release:rn\` can. Use \`✅auto·<runId>\` for a row the native lane proves.`);
    }
    if (!AUTOMATABLE.includes(c.verdict)) {
      out.push(`${CHECKLIST}:${c.line} — ${c.id} carries \`✅gate\` but its verdict is [${c.verdict}]. A ${c.verdict === '—' ? 'not-a-check' : 'device-only'} row cannot be machine-proven.`);
    }
    if (c.stamp) {
      out.push(`${CHECKLIST}:${c.line} — ${c.id} carries BOTH \`✅gate\` and \`✅auto·${c.stamp}\`. One row, one proof mark: a reader cannot tell which mechanism is being relied on, and they have different guarantees.`);
    }
    // Same exemption, same reason as the stamp's: a partial's box belongs to whoever owns the other half.
    if (!c.done && !partial(c)) {
      out.push(`${CHECKLIST}:${c.line} — ${c.id} carries \`✅gate\` but its box is unticked. 🎯's rule is that proving an item checks it off.`);
    }
  }
  return out;
}

/**
 * ⚡ 4.1.9c — THIS NOTE INVERTED THE DAY THE WRITER LANDED, and left alone it would have become a
 * permanent false alarm on a report whose only job is honesty.
 *
 * While stamps were placed by hand, each one named whichever run happened to prove that row, so
 * *"everything traces to one run"* meant **one sample, stability unproven**. `stamp-coverage.ts`
 * refreshes every row it can from the run it is given — so **one run is now the healthy state**: it says
 * every machine-earned row was re-proved together, at one commit. **More than one run is the signal**,
 * and it names rows whose claiming flow did not run in the latest pass.
 *
 * ⚠️ The assumption, stated: GitHub run ids increase monotonically, so the largest is the most recent.
 * ⚠️ And what neither shape can tell you: the checklist keeps **no history**. A stamp says *proved at
 * that run*, never *green for N runs running*.
 */
function staleNote(byRun: Map<string, number>, autoProven: Check[]): string {
  if (byRun.size <= 1) {
    return byRun.size === 0 ? '' : `\n✅ **Every machine-earned row was re-proved by the same run**, which is what \`npm run stamp:coverage\` produces from a green lane. ⚠️ It says *proved at that commit*, not *stable* — the checklist keeps no history.\n`;
  }
  const newest = [...byRun.keys()].reduce((a, b) => (Number(b) > Number(a) ? b : a));
  const stale = autoProven.filter((c) => c.stamp !== newest);
  return `\n⚠️ **${stale.length} machine-earned row(s) were NOT re-proved by the latest run (\`${newest}\`)** — ${stale.map((c) => c.id).join(' · ')}. Their claiming flow did not run in it (a single-tier dispatch does this), so each is proved against an older commit. ⛔ Not a failure; a red flow **revokes** its rows outright.\n`;
}

// ── the report ────────────────────────────────────────────────────────────────────────────────────
interface Totals {
  proven: number; auto: number; gate: number; human: number; half: number; unproven: number;
  notBuilt: number; deviceOnly: number; partials: number; devicePass: number;
}

function build(checks: Check[], claims: Claim[]): { markdown: string; totals: Totals } {
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
  // ⛔ 4.1.10 — partial by VERDICT *or* by the claims being partial-only. See `isPartialRow`.
  const isPartial = (c: Check) => isPartialRow(c, claimsById.get(c.id) ?? []);
  const proven = claimed.filter((c) => c.done && !isPartial(c));
  const halfProven = claimed.filter((c) => isPartial(c) && (c.done || c.stamp || c.gate));
  const autoProven = proven.filter((c) => c.stamp);
  const gateProven = proven.filter((c) => !c.stamp && c.gate);
  const humanProven = proven.filter((c) => !c.stamp && !c.gate);
  const claimedUnproven = claimed.filter((c) => !c.done && !c.stamp && !c.gate);
  const notBuilt = real.filter((c) => AUTOMATABLE.includes(c.verdict) && !claimsById.has(c.id));
  const deviceOnly = real.filter((c) => c.verdict === 'D');
  const partials = real.filter((c) => c.verdict === 'M◐');
  const devicePass = deviceOnly.length + partials.length;

  const byRun = new Map<string, number>();
  for (const c of autoProven) byRun.set(c.stamp!, (byRun.get(c.stamp!) ?? 0) + 1);

  const proof = (c: Check) =>
    c.stamp ? `\`✅auto·${c.stamp}\`` : c.gate ? '`✅gate`' : c.done ? '*human* `[x]`' : '⚠️ **none**';
  const row = (c: Check) => {
    const cl = claimsById.get(c.id) ?? [];
    // ⚠️ The HARNESS is named, not just the file. Two suites now claim rows and they are proven by
    // different mechanisms — a run id for the batched native lane, a continuously-running gate for the
    // web suites. A reader who cannot tell which one holds a row cannot judge how much the tick is worth.
    const by = cl.length
      ? cl.map((x) => `\`${x.flow.replace(/\.(yaml|spec\.ts)$/, '')}\`${x.harness === 'playwright' ? ' ᵂ' : ''}${x.kind === 'PARTIAL' ? ' *(partial)*' : ''}`).join(' · ')
      : '—';
    return `| ${c.id} | \`[${c.verdict}]\` | ${c.title} | ${by} | ${proof(c)} |`;
  };
  const table = (rows: Check[]) =>
    ['| id | verdict | check | claimed by | proof |', '|---|---|---|---|---|', ...rows.map(row)].join('\n');

  const byVerdict = (v: Verdict) => real.filter((c) => c.verdict === v).length;

  const totals: Totals = {
    proven: proven.length, auto: autoProven.length, gate: gateProven.length, human: humanProven.length,
    half: halfProven.length, unproven: claimedUnproven.length, notBuilt: notBuilt.length,
    deviceOnly: deviceOnly.length, partials: partials.length, devicePass,
  };

  const markdown = `# Device-checklist coverage split

> ⚙️ **GENERATED — do not edit.** \`npm run audit:coverage\`. Source of truth is
> [\`DEBT_3.5_DEVICE_QA_CHECKLIST.md\`](../DEBT_3.5_DEVICE_QA_CHECKLIST.md) (ids + verdicts) and the
> \`COVERS:\`/\`PARTIAL:\` declarations in \`apps/rn/.maestro/*.yaml\` (status).

## The answer

🎯 **2026-08-14: *"Nothing should be marked covered unless it's proven to be."*** So the headline is
**${proven.length}**, not ${claimed.length}. The difference is the row below it, and it is the honest gap.

| | checks | |
|---|---:|---|
| **✅ Covered — PROVEN** | **${proven.length}** | proved OUTRIGHT: ${autoProven.length} by a native run \`✅auto·<runId>\` · ${gateProven.length} by a push-gate spec \`✅gate\` · ${humanProven.length} human-earned \`[x]\` |
| **◐ Automatable half proven** | **${halfProven.length}** | \`[M◐]\` — the lane's half is green; **the device-owed half is still owed** and its box stays for the human |
| **⚠️ Claimed but UNPROVEN** | **${claimedUnproven.length}** | a flow declares it; no run has ever passed it. **These were counted as covered before 4.1.9c** |
| **▶ Coverable, not yet built** | **${notBuilt.length}** | verdict permits automation, nothing claims it — 🎯 2026-08-17: **PHASE 6 device-pass work, ticked by a human; automating any of it is optional and non-gating.** ⛔ Most of these have never been verified by ANYONE, so this is verification debt, not automation debt. Exception: §12.1–§12.7 stay in 4.1.10 |
| **🎯 Permanently device-owed** | **${deviceOnly.length}** | \`[D]\` — no lane will ever carry it |
| | | |
| **🎯 The device pass** | **${devicePass}** | \`[D]\` **+** the human half of every \`[M◐]\` (${partials.length}) |
| Real checks | ${real.length} | ${checks.length - real.length} further rows are \`[—]\` — install steps and report-back prompts |

⛔ **A declaration is an author's claim, not a result.** \`COVERS:\` says what a flow is *meant* to test;
it cannot say whether the flow has ever executed, let alone passed. The ${claimedUnproven.length} unproven rows are all
claimed by flows that have never gone green — and each one used to be indistinguishable, in this
report, from a check that passes on every run.

**Machine-earned rows by run:** ${byRun.size ? [...byRun].sort((a, b) => Number(b[0]) - Number(a[0])).map(([r, n]) => `\`${r}\` ${n}`).join(' · ') : '*(none)*'}
${staleNote(byRun, autoProven)}

**Verdict spread:** \`[M]\` ${byVerdict('M')} · \`[M◐]\` ${byVerdict('M◐')} · \`[A]\` ${byVerdict('A')} · \`[X]\` ${byVerdict('X')} · \`[D]\` ${byVerdict('D')}

\`[X]\` = a **native driver** (XCUITest) can carry it. ⚠️ A verdict, not a status: these rows moved OUT of
the device pass and INTO *coverable, not yet built*. Nothing about them is covered yet.

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
    const cl = (claimsById.get(c.id) ?? []).map((x) => `${x.flow.replace(/\.(yaml|spec\.ts)$/, '')}: ${x.why}`).join(' · ');
    return `- **${c.id}** — ${c.title}\n  ${cl || '⚠️ *no flow claims even the automatable half yet*'}`;
  }).join('\n')}
`;
  return { markdown, totals };
}

// ── main ──────────────────────────────────────────────────────────────────────────────────────────
const { checks, problems } = parseChecklist();
const claims = parseAllClaims();
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
  // ⛔ 4.1.10 — THIS SUMMARY USED TO RECOMPUTE EVERY FIGURE, and it silently disagreed with the report
  // the moment the report's rules changed: `build()` had already stopped counting partial-only claims as
  // proven while this block still said 24. The console line is the number a human reads and quotes.
  // It now comes from `build()`'s own tally — one definition, two renderings.
  const { markdown, totals } = build(checks, claims);
  writeFileSync(OUT, markdown, 'utf8');
  console.log(`wrote ${OUT}`);
  console.log(`  PROVEN ${totals.proven} (${totals.auto} native-run · ${totals.gate} push-gate · ${totals.human} human)`);
  console.log(`  automatable half proven ${totals.half} · claimed but unproven ${totals.unproven}`);
  console.log(`  coverable-not-built ${totals.notBuilt} · device-only ${totals.deviceOnly}`);
  console.log(`  the device pass is ${totals.devicePass} rows (${totals.deviceOnly} [D] + ${totals.partials} [M◐] halves)`);
}
