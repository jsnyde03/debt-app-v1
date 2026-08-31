# Pass 6 — the route, verified. ⛔ NOT YET DISPATCHED.

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
