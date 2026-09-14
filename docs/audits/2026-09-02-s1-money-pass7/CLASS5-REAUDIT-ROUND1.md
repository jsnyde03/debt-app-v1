# Class 5 re-audit — round 1: the record *(`.12.6.5.8.3`)*

**Pin `ea3f5e0e` · range `c7df99c2..ea3f5e0e` · 4 fresh lanes, no sub-agents, each planting in its own worktree, L3 alone
on `:4319`.** Brief: [`CLASS5-REAUDIT-BRIEF.md`](CLASS5-REAUDIT-BRIEF.md). Lane reports:
[`L1`](CLASS5-REAUDIT-L1.md) · [`L2`](CLASS5-REAUDIT-L2.md) · [`L3`](CLASS5-REAUDIT-L3.md) · [`L4`](CLASS5-REAUDIT-L4.md).
Probes under `class5-reaudit-probes/L<n>/`.

## ⛔ The result: class 5 does NOT exit — 17 defects attributable to its fixes

**24 findings.** Counted from the four lane summaries and re-counted from the finding headings: L1 6 · L2 4 · L3 7 · L4 7.

| | blocker | major | minor | total |
|---|---|---|---|---|
| **attributable** — does not reproduce at `c7df99c2`, or the closure is class 5's | 0 | 2 | 15 | **17** |
| **reproduces at `c7df99c2`** | 1 | 4 | 2 | **7** |

⭐ **What held — every guard whose pinned file moved.** Re-executed one id at a time, each `plant-applied=YES · planted
exit 1 · control exit 0 · MATCHED`: **L1 24/24 · L2 18/18 · L3 16/16 · L4 33/33** *(one L4 run died on the environment and
was re-measured in a combined plant)*. L3 ran **38** spec-level plant runs, and every changed spec is green at the pin
(**101 passed**). Class 4's tail is closed: `R5-1` against its own defect shape, `R5-2` in both directions. Save-for-it's pace
held over **128** shapes and the reserve offer in **72 of 72**.

⚡ **The pattern across all four lanes: closures that WORK and that nothing can make red.** Eight class-5 closures carry no
registry row (`F2`) — `C3-13` `C3-9` `C3-11` `C1-1` `C1-5` `C1-6` + `C1-2` `C1-3` — and four were measured open by planting:
`L3-6` *(`C3-9`'s payoff family)*, `L1-4` *(`C1-3`'s second site)*, `L1-5` *(`floorUnread`)*, `L2-3` *(the dismissed-activity
restart)*. Every `.5.7` closure, registered in one batch, has a row.

## ⛔ The brief's attribution rule was incomplete, and 🎯 corrected the routing

*"Reproduces at `c7df99c2`"* answers **did a fix CAUSE this** — not **did the fix FINISH**. Five of the seven are a class-5
closure that stopped one surface short, which is exactly what class 5's exit line forbids (*"one predicate … called by
every surface"*). Filed onward, they would close class 5 with a blocker on screen.

✅ **[DECISION] 🎯 2026-09-14 — the five unreached surfaces STAY IN CLASS 5** and are fixed in round 2; only the two that
genuinely predate the class route onward. ✅ **[DECISION] 🎯 2026-09-14 — [D80] applies to three instrument minors** that
neither reach a user nor leave a closure unproven: `F1` → backlog, `F3` and `F5` → class 9.

⚠️ **For the round-2 brief:** every "reproduces" finding must also answer *"is this a surface a class-5 closure claims?"*

## Every finding, and where it goes

| id | sev | as audited | → routed | one line |
|---|---|---|---|---|
| **L3-1a** | **blocker** | reproduces | **class 5 · R2** | PlanHero draws **"Suggested · $1,300"** over its own refusal, inflated by the lost $300 minimum — `C1-5` closed the split, not this |
| **L1-1** | major | attributable | class 5 · R2 | a plan repair whose honest value is `$0` can never be answered, and the ack no longer clears it — `C1-2`'s fix; a lost windfall refuses four surfaces for the life of the install |
| **L3-6** | major | attributable | class 5 · R2 | reverting `C3-9`'s payoff-family gag (`progress.tsx:158`) reds nothing — e2e, `lint:trust-claims`, registry and `test:app` |
| **L1-R1** | major | reproduces | class 5 · R2 | a premium debt projected to `$0` is in NO section of Money — `C3-13`'s confirmed liveness never reached `selectPayoffView` |
| **L3-5a** | major | reproduces | class 5 · R2 | Progress's cash-flow bars ask no trust question: a lost $160 minimum drawn as room every cycle — `C3-11`'s twin |
| **L3-5b** | major | reproduces | class 5 · R2 | the same bars caption a lost line **"your $200 line"** (user set $350) — `C1-1`'s `unread` never reached this reader |
| **L2-4** | major | reproduces | **→ class 6** | the foreground drain destroys a queued Siri payment behind the read-failed screen; its launch twin is gated |
| **L1-2** | minor | attributable | class 5 · R2 | the reserve-release card names a debt the plan skips, while the brief beside it names Visa |
| **L1-3** | minor | attributable | class 5 · R2 | a set `$0` line: *"A little tight … just above your $0 line"* — the band still reads a hidden $200 |
| **L1-4** | minor | attributable | class 5 · R2 | `C1-3`'s `namedFigures` plan branch deletes with `test:app` green |
| **L1-5** | minor | attributable | class 5 · R2 | the brief's `floorUnread` can be dropped with `test:app` and `test:regression` green |
| **L2-1** | minor | attributable | class 5 · R2 | after an in-window payday edit the Lock Screen "Payday landed" tap names the stale attribute date and rolls nothing |
| **L2-2** | minor | reproduces | class 5 · R2 | the applied-intent record's 50-id cap evicts ids still queued: 55 drains took **$265 for $55** |
| **L2-3** | minor | attributable | class 5 · R2 | `.5.4f`'s "a dismissed activity is restarted" survives three plants — the stub cannot express a dismissal |
| **L3-1b** | minor | attributable | class 5 · R2 | the suggested move is withheld from VoiceOver and still drawn |
| **L3-2** | minor | attributable | class 5 · R2 | Progress refuses a free user's *"$12,000 to go"* — an APR cannot move it, and Money states it |
| **L3-4** | minor | attributable | class 5 · R2 | Today's hero withholds its split over a lost APR; the per-surface assertion serialises split + date as ONE figure and cannot see it |
| **F2** | minor | attributable | class 5 · R2 | eight closures carry no registry row; `lint:closure` never reads pass 7 |
| **F4** | minor | attributable | class 5 · R2 | `S1P7-B1-1-SAVEFORIT-PACE-KEPT`'s token pins the date assertion, its recorded red is the pace assertion |
| **F6** | minor | attributable | class 5 · R2 | the two `.5.7 ②` trust-claims scans are proven in one direction each |
| **F3** | minor | attributable | **→ class 9** | `[D81]`'s "a full run refuses to skip" is keyed on the same `FAST` that selects the skip |
| **F5** | minor | attributable | **→ class 9** | `MAX_DEBT_SPREAD_SITES` compares `>`, so a drained ledger leaves slack |
| **F5b** | minor | reproduces | **→ class 9** | `MAX_LIVENESS_SITES`, the same one-sided compare, older |
| **F1** | minor | attributable | **→ backlog** | `MAX_SERVER_ATTEMPTS`' derivation still reasons over 17 Playwright proofs; the range made 24 |

**Round 2 fixes 19** *(2 majors + 12 minors attributable · 1 blocker + 3 majors + 1 minor kept)*. **Routed onward 5.**
19 + 5 = 24.

**Also recorded, not findings:** L3's `lint:trust-claims` control — a call site naming a **non-existent** claim passes, because
the gate counts files per claim → **class 9**, beside `L3-6`. · L2: pass-6 `C3-6`'s double roll stays open for **undated**
entries drained late, on all four cadences — by 🎯's fallback rule; **new evidence on that row**. · L2: Swift's synthesized
`Decodable` likely ignores property defaults for a missing key — a `native-e2e` premise, unmeasured here. · L3-3 withdrawn,
unreachable by render.

## Round 2's fix order *(`.5.8.4`)*

Grouped by the file each fix has open, so a surface is touched once.

1. **PlanHero's claims** — `L3-1a` + `L3-1b` *(render the suggestion only under `showSuggest`)* + `L3-4` *(date on
   `'solved-projection'`, split and suggestion on `'paycheck-plan'`; the per-surface figure split in two)*.
2. **Progress** — `L3-5a` + `L3-5b` *(the cash-flow bars ask the forecast's claim and withhold an unread line)* + `L3-2`
   *(the free-tier conjunct)* + `L3-6` *(an assertion the `:158` revert reds)*.
3. **The plan repairs and the line** — `L1-1` *(a plan setter answers its repair even at an unchanged value)* + `L1-3` *(one
   floor for band and sentence)* + `L1-4` + `L1-5`.
4. **Confirmed liveness vs the estimate's ranking** — `L1-R1` *(Money's three sections sum to the debt count on a premium
   projected store)* + `L1-2`.
5. **Outside the app** — `L2-1` + `L2-2` + `L2-3`.
6. **Instruments** — `F4` + `F6`.
7. **The registry** — drain first *(`authored` is 9 of 9)*, then `F2`'s eight rows and every proof steps 1–6 wrote, as one batch.
8. **Boundary** — full `lint:rn` + typecheck + unit suites + full e2e + embed, push, CI's `conclusion`; then round 2 by fresh agents.

## Process, recorded because each is the next dispatch's live trap

- **Concurrency held.** No lane edited the main checkout; the only cross-lane contact was `prove:guards` refusing on L3's
  `:4319`, which each lane waited out as briefed. One environmental crash: a `git status` spawn died with `0xC0000142`
  under four-lane load (L4, re-run).
- ⛔ **L3's base teardown ran `git worktree remove` before its junctions were detached** — a chained shell line whose first
  `rmdir` failed on quoting. Nothing was lost; git did not descend the junctions.
