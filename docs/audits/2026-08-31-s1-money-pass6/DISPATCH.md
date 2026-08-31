# Pass 6 — the route, verified. ⛔ NOT YET DISPATCHED.

> ## ▶ START HERE — the dispatching session
>
> 🎯 **2026-08-31: the shape is AGREED, and Jason asked for a FRESH SESSION to run it.** Nothing below
> needs re-deciding; it needs verifying against the tree and executing.
>
> | | |
> |---|---|
> | **Lanes** | **12**, plus a **coverage-driven second wave** |
> | **Read tracking** | every lane emits `READ-<lane>.txt` **incrementally**, as it opens files |
> | **Exit** | `npm run audit:read-coverage -- --surface=s1 --pass=s1p6` at **446/446** |
> | **Constraints** | no sub-agents inside lanes · heap 1536 MB · **an OOM is a FINDING, never a retry** · incremental writes |
>
> ⚠️ **Verify before acting** — this record is a hypothesis about a tree that has moved: re-run
> `npm run audit:route-check` (it re-asserts 0 owed) and `npm run lint:rn`, and confirm the pin below is
> still pass 5's target tree.
>
> ⛔ **The 12-way split is NOT a mechanical re-partition.** `LANES` in `audit-route.ts` is a *total spec of
> four SUBJECTS*, each written to sit in one auditor's head — *"which member of its class did this test
> pick?" is an engine question wearing a test's clothes.* Splitting for load without preserving subject
> coherence throws away the thing the spec is for. **Proposed 3-way sub-split of each lane, to verify and
> adjust — not to adopt unread:**
>
> | from | sub-lanes | ~lines each |
> |---|---|---|
> | **A** *(182 f · 21.6k)* | `packages/core` engine *(debt · cashflow · forecast)* · `packages/core` rest · `apps/rn/tests` | ~7.2k |
> | **B** *(148 f · 23.4k)* | `store/` · `storage/` + `data/` · `utils/` + `lib/` + `config/` + `types/` + `analytics/` | ~7.8k |
> | **C** *(202 f · 24.4k)* | `app/` routes + screens · `components/` money + plan + progress · `components/ui` + the rest | ~8.1k |
> | **D** *(75 f · 27.7k)* | the `check-*` gates · the proof machinery + `scripts/lib` · config + off-surface | ~9.2k |
>
> ⚡ **Lane D carries the MOST lines on the FEWEST files** — 27.7k over 75 — because the instruments carry
> enormous docblocks. Sizing by file count alone would have under-weighted it by a factor of three.
>
> ⛔ **Why 12 and not 4:** pass 5 handed 4 lanes ~16k lines each and they read **about a third** of what
> they were given. That is the whole reason coverage came out at **86 of 446**. Twelve puts ~8k in front of
> each lane — half the load that already under-read.
>
> ⭐ **The second wave is the half that guarantees the exit**, and it is the cheap half: the coverage
> command names the still-unread files exactly, so wave 2 is a short targeted dispatch over a known
> remainder, not a re-run.
>
> **Quoted worst case:** ~3–5M tokens across both waves. Estimated from line counts, not measured spend.

**Route generated:** 2026-08-31 · **Target tree:** `4c0f7689` (`v1.7-dev`).
**Pin:** `65566a09` → HEAD — pass 5's target tree.
**Followed pass:** `s1p5`, via `--unread-pass=s1p5`.

⛔ **This file records the ROUTE, not a dispatch.** `S1.13.4` is a [DECISION] gate: pass 6 is an order of
magnitude past pass 5's read set, and the spend gets quoted to Jason before an agent is spawned.

---

## ⚡ Why this route is 607 files and pass 5's was 393

Pass 5's route retired a file the moment **any** pass had read it once. `audit-route.ts` exited on
`!inv.unswept.has(f) && !changed.has(f)`, and `unswept` means *never read by any pass* — so a file pass 2
read once, against a different brief and before three rounds of findings taught the lanes what to look for,
was accounted for **forever**.

⛔ **Measured on this route before the fix: 131 of the 360 money-bearing files pass 5 never read reached NO
LANE.** Among them `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx` — which mints a debt id from
`Date.now()`, a defect found in this same session, **in a file the router had already retired.**

The new `stale-read` origin closes it. ⚠️ It is opt-in and the control was measured: **without**
`--unread-pass` this route is 476 files / 0 `stale-read`; **with** it, 607 / 280.

## Pre-dispatch verification

*(The dispatch is part of the audit and gets the audit's rules.)*

| check | result |
|---|---|
| every path in `ROUTING-{A,B,C,D}.txt` exists on disk | **0 missing** of 607 |
| a file appears in more than one lane | **0 duplicates** |
| lane counts sum to the routed total | 182 + 148 + 202 + 75 = **607** ✓ |
| every money-bearing file `s1p5` did not read is routed | **0 owed** — asserted by the router itself every run, not by hand |
| every CHANGED tracked file since the pin is accounted for | ✓ (15 excluded as prose or binary) |
| inventory stamp matches the claims file | ✓ ([D5-10]) |
| working tree | clean |
| `lint:rn` | **43/43** |

## Per-lane origin split

| lane | first-look | fix-churn | instrument | neighbour | off-surface | s0-first-look | **stale-read** | total |
|---|---|---|---|---|---|---|---|---|
| **A** | 14 | 22 | — | 28 | 2 | 20 | **96** | 182 |
| **B** | 21 | 16 | — | 43 | 5 | 2 | **61** | 148 |
| **C** | 34 | 11 | — | 32 | — | 2 | **123** | 202 |
| **D** | — | — | 32 | 23 | 9 | 11 | — | 75 |
| **total** | 69 | 49 | 32 | 126 | 16 | 35 | **280** | **607** |

## ⚠️ What the router still reports as open

- ⛔ **31 files sit in the import neighbourhood of a never-swept file and reached no lane.** The
  neighbourhood is seeded from CHANGED only. See [D5-8] — and note this is **down from 58** on the
  churn-only route, because `stale-read` absorbed the rest.
- ⛔ **74 routed files are owned by no claims file**, so [D69] would exempt a finding on them for the wrong
  reason — not *"nobody read it"* but *"nothing records whether anyone did."* Names in
  `UNSEEN-NEIGHBOURS.txt`. Standing fix is `S1.10.6.10`.

## The coverage exit this pass will be held to

```
npm run audit:read-coverage -- --surface=s1 --pass=s1p6
```

⛔ It reds until **every one of the 446 money-bearing files carries `s1p6`**. For reference, the same
command against the passes already run:

| pass | money-bearing files read | of 446 |
|---|---|---|
| s1p5 | 86 | **19%** |
| s1p4 | 103 | 23% |

⚠️ **That is the answer to why pass 5 found 39 findings and did not converge.** It was not a sweep that
missed things — it was a sample.
