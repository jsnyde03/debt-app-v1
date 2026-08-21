# P6.8 — Pre-release best-in-class FINISH sweep

> **Target: `2.0.0` ([D38]), branch `v1.7-dev`, at commit `dd80f70`** *(P6.7 closed; `validate:release:rn`
> exit 0 — 212 e2e · 10 embed, recorded by the gate itself in `gate-status.json`)*.
> Pinned deliberately: a finding is only checkable against the tree it was found in.

**⛔ NOTHING IN THIS AUDIT EXISTS ONLY IN A TRANSCRIPT (🎯 2026-08-21).** Every lens writes its own file
in `slices/`, every refutation writes its own file in `refutations/`, and the synthesis is
**`SYNTHESIS.md`** — a file, not a chat message. A session ends; the folder does not.

---

## The charter, and its second half is the one that gets dropped

P6.8 asks **two** questions:

1. **Is anything WRONG** — the shape every previous audit here has had.
2. ⭐ **Is anything MISSING** — *"is anything missing"*, not only *"is anything wrong"*. This is where
   5.10's original fan-out intent now lives.

⛔ **Anything structural is a SCOPE CALL for 🎯**, never an automatic fix, or the sweep expands the freeze
it exists to protect. Feature lock closes at **P6.10** ([D52]), so a gap found here still has somewhere
to go — that is precisely why this gate sits where it does.

---

## ⚠️ Two premises corrected before the audit was designed

**1 · "Absorbs T12, ~40 polish items" is STALE.** P6.4 judged all 62 of those ids and deferred exactly
**three** — `L1-20` *(eyebrow treatment, a visual-system call)* · `L1-22` *(73 apostrophes, gated
meanwhile by `lint:apostrophes`)* · `L4-13b` *(`PressableScale` app-wide or nowhere)*. **So this is ~90%
a fresh audit, not a ledger sweep**, and the roster is weighted accordingly.

**2 · The unaudited surface is LARGER than the row implied.** The last audit gate ran **2026-08-17**.
Everything since has never been through one: the **Phase-5 cutover** (closed 08-19), **P6.3 cloud backup**,
**P6.6 splash**, **R4's store veto** (08-21), **P6.7's CI/Pages guards** (08-21). That is its own lens.

---

## ⭐ The instrument is built FIRST, and that is the lesson of the last gate

The 2026-08-17 audit's own top finding was **"the instruments are under-reporting, and they gate
everything else"** — 25 of 39 e2e specs seeded a plan with no bills; the surface inventory tracked 3
formatters where 9 existed. Every number in that audit was a floor.

So **P6.8.1 builds the visual matrix before any agent runs**: every surface × light/dark ×
iPhone/iPad/Split-View × default/XXL Dynamic Type, plus the states nothing exercises (empty · 1 item ·
40 items · huge numbers · very long names · offline · error). It lands in `matrix/`.

⛔ **Four lenses read that matrix. A surface missing from it is a surface four agents are blind to at
once** — which is exactly how the line-art defect and the dark-only splash both survived review.

---

## The roster — 13 lenses (wave 1) + ~6 refuters (wave 2)

🎯 approved the scale and the roster on 2026-08-21, explicitly relaxing the standing fan-out cap because
this is one of the last audits before launch. **No sub-agents** (a child outlives its parent), and every
agent writes its slice **incrementally**, so an agent that dies loses nothing.

### Visual — reading the rendered matrix, not the source

| id | lens | what it judges |
|---|---|---|
| **V1** | Theme parity | Every surface in light vs dark: invisible text, vanishing borders, wrong-mode assets, the "pasted-on square" class P6.6 caught on the splash |
| **V2** | Size class | iPhone · iPad · Split View: truncation, orphaned master-detail panes, stranded columns, tap targets under 44pt |
| **V3** | Dynamic Type XXL | Clipping, overlap, buttons that lose their label, rows collapsing into each other, fixed heights that stop fitting |
| **V4** | State coverage | Empty · 1 · 40 · huge numbers · long names · offline · error — and which states have **no design at all** |

### Wrong — deliberately narrow, because the ledger inheritance is three items

| id | lens | what it judges |
|---|---|---|
| **W1** | The unaudited delta | Everything shipped since 2026-08-17 (see above). None of it has been through a gate |
| **W2** | The three carried items | `L1-20` · `L1-22` · `L4-13b`, verified against the current tree, plus consistency across everything each touches |

### Missing — each gets an EXTERNAL REFERENCE, because absence cannot be found by reading what is there

| id | lens | its reference |
|---|---|---|
| **M1** | Public claims vs product | Paywall copy · ASC listing · marketing embed · the privacy line. **Asks "is what we say TRUE"** |
| **M2** | Journey completion | First launch → onboard → first payday → first shortfall → first payoff → debt-free. Where is a user stuck with no affordance? |
| **M3** | Recovery & dead ends | Failed restore · corrupt backup · denied permissions · no network · storage error · lapsed subscription. Which have no path out? |
| **M4** | Expectation gap | What someone arriving from YNAB / Undebt.it / a spreadsheet looks for and does not find. Deliberately outside-in |

### The three 🎯 added (2026-08-21)

| id | lens | what it judges |
|---|---|---|
| **A1** | VoiceOver depth | Beyond the three mechanical gates (`lint:a11y-props` · `a11y-collapse` · axe): reading **order**, whether a Guardian state is *announced* or only coloured, grouped rows collapsing into one unreadable string, focus after a sheet dismisses, the live-region beats |
| **O1** | Onboarding & first run | Cold start, the "try sample data" door, the demo entry [D18] admits, drop-off points, and what someone who abandons halfway comes back to |
| **P1** | ⭐ **The premium bar** | Two references, because "premium" means two things here. **CRAFT:** `DEBT_BENCH_VISUAL_MOTION` · `DEBT_MOTION_SPEC` · `DEBT_IA_BENCHMARK` · `DEBT_BENCH_TRUST_FIRSTRUN` — the mandate was *"Debt at or above the rest of the portfolio"*; does the shipped app still clear it? **TIER:** the elevation spec's own price test — ***"removing it must remove WORK, not just info"*** — run against every premium feature as it actually ships |

⚠️ **M1 vs P1 is a deliberate boundary:** M1 asks *"is what we say true"*, P1 asks *"is it good enough."*
M1 was narrowed to public-facing claims so the two cannot crowd each other.

### Wave 2 — refutation, mandatory

One refuter per blocker/major cluster, each prompted to **REFUTE** and to default to refuted when
uncertain. ⛔ **No finding becomes work un-refuted.** The record earns this:

- **2 of 3 agent-declared blockers did not survive** the 2026-08-17 refutation pass.
- **2 of 4 stated mechanisms were wrong while all 4 recommendations were sound** — a finding that arrives
  with an explanation is a hypothesis, and the explanation is the part that fails.
- Lens **confidence** was reliable every time; **counts and severities** were not.

---

## What is deliberately NOT here, and who owns it

| out of scope | owner |
|---|---|
| Financial correctness · boundary inputs · rounding · date edges | **P6.10** |
| Privacy, egress, the *"never leaves your device"* proof | **P6.9** |
| Voice & tone as a whole | already audited — L1 produced 35 findings; re-running would mostly re-find them |
| Motion & animation *quality* | no instrument, and stills cannot judge it. **Device-owed → P6.14** |
| Anything only a device can answer | **P6.14**, and it gets a ROW, not a hope |
