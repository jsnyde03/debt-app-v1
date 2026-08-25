# P6.8.9.7.11.10 — verify the fixes, sweep for major+, and rate it

**Method.** Four independent auditors, one per surface, each given two separate jobs and a defined severity
scale ([`BRIEF.md`](BRIEF.md)). Job 1 verified the `.11.9` fixes. Job 2 swept the surface for **blocker and
major only** — including code neither round changed. `minor` findings were explicitly not wanted in the
sweep, and each auditor was required to write a one-sentence user-facing consequence for every blocker and
major, on the rule that a finding with no such sentence is `minor`.

---

## 🔴 BLOCKERS — 2

| # | finding | state |
|---|---|---|
| **1** | **One "Got it" tap permanently restores two false congratulations.** `unreadDebts` / `unreadGoals` read `pendingDataRepairs`, which the ack **emptied** — while the repaired `0`s are permanent. So after the tap Money reads **"Every balance cleared"** over debts still owed, and badges a $0-target goal **Funded**, for the life of the install. Completely unpinned on both branches. | ✅ **FIXED** — the record survives the ack and carries `acknowledged`; the card filters, the trust guards read the whole list. New e2e pins it, plant-verified. |
| **2** | **Every date on Progress is `setMonth`-overflowed.** `projectDebtPayoff.ts:229` and three other sites do `d.setMonth(d.getMonth() + n)`. ⚡ **This repo already wrote the clamp** — `recurrence/rolloverPayCycle.ts:25`, whose comment says *"Jan 31 + 1mo -> Feb 28, NOT Mar 3 via setMonth's overflow"* — and never applied it here. A user paid on the 31st is shown a debt-free date **up to a month late**, on the hero, the end pill, the legend, the scrub readout and both compare columns. | 🔴 **OPEN — 🎯's call.** Four sites, a shared helper to export, and every downstream date to re-verify. |

⚠️ **Neither blocker came from `.7` or `.11`.** Both are pre-existing, and both were found by the *sweep*
half of this brief rather than by re-reading a diff — which is the argument for the shape 🎯 asked for.

---

## 🟠 MAJOR — 15, of which 6 are closed

**Closed this session** *(all mine, all introduced by `.11` or `.11.9`)*
- The goals hero read **"150% funded"** over unreadable money — and the first fix **clamped** rather than
  suppressed, which kept the falsehood (*"$1,500 · saved of $1,000 target · 100% funded"*). Now suppressed.
- `calloutH`'s reset was keyed on `remeasureOn` as well as the mark, so a sheet's entrance spring cleared a
  height nothing re-measures — killing the reveal and falling back to the 144 pt guess at Larger Text.
- My CSV assertions were **vacuous**: `eq(debts.length, 0)` passes for a row refused for *any* reason, and
  an unquoted comma shifted the columns. They now assert **why** the row was refused.
- The bare-`announce` gate missed `announceForAccessibility?.(…)` — **the exact spelling the owner file
  uses**, i.e. the one a new author copies.
- `report.ts` still documented `droppedRows` as "the database judged to be ours" after I inverted it.
- The finale→beat test could not reach its own subject.

**Open — 🎯's call**
| surface | finding |
|---|---|
| money | The repairs card reports successfully **recovered** amounts as unreadable (`readMoney` flags a recovery and a loss identically). ⚠️ Premise unconfirmed — worth measuring against a real v1.6 blob. |
| money | `runMigrations` throws on a `null` goal row → the whole store quarantines / the whole import refuses. |
| money | A **second** `emergency`-type goal is funded by no rung at all; `GoalSheet` lets a user create one. |
| import | A restore on the data-reset screen leaves the user staring at the error it just fixed. |
| import | The destructive file restore never shows the backup's date, though `backup.ts:43` says it does. |
| import | The migration audit **cannot see goal money** — where both prior money defects were found. |
| discovery | A sheet-hosted mark **outlives its sheet** and blocks every other tip for the session. |
| discovery | *"Show feature tips again"* cannot re-offer two of the three marks — and the e2e tests the one that works. |
| discovery | The once-ever `DREW` record is spendable on a callout that was never on screen. |
| discovery | The Progress hero's *"to go"* prints the **original** total, understating current debt. |
| gates | `ready` is on 1 surface of 10 while the file claims every surface carries it; 8 text-scale frames shoot with the guard off. |
| gates | `check-destructive-writes`' allow-list is **file-level** — a second unguarded `importStore` in a sanctioned file is admitted silently. |
| gates | `strings-inventory --gate` discards its own self-check via `process.exit(0)`. |
| gates | `check-audit-closure` counts **12 of 87** findings as traceable solely because their id appears in a SYNTHESIS heading — and that count is P6.8.9's stated exit criterion. |

---

## What the auditors swept and found clean at this bar

Not padding — stated because a clean sweep is a result. `coachMarks.ts` · `tutorialTargets.tsx` · the
callout's touch model · `progress.tsx`'s scroll host · `check-comment-convention` · `check-local-dates`
*(every `toISOString`/`getUTC` site in `packages/core` and `apps/rn/src` re-checked — no calendar date
routed through UTC, so the Sydney/Auckland class has no live site)* · `check-money-format` ·
`check-a11y-collapse` · `check-committed-secrets` · `check-rn-style-divergence` · `check-copy-owners` ·
`check-icon-glyphs` · `gateSources` / `write-gate-status`.

## ⚠️ The one thing to measure on a device before ship

If a real WebKit container can produce a **total** decode failure, `isConfirmedFreshInstall` consults
neither `droppedRows` nor `opened[].rows` — so the container is called terminal, the retry is consumed, and
the user's entire v1.6 portfolio is stranded while the app says *"fresh install"*.
