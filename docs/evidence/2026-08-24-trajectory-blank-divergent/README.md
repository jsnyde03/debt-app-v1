# The payoff trajectory draws no curve on a two-debt divergent portfolio

## ✅ RESOLVED — read [`DIAGNOSIS.md`](DIAGNOSIS.md). Everything below is the ORIGINAL filing, kept because two of its claims were wrong and the way they were wrong is the point.

**The answer:** the blank card is not a failed chart — it is **`WithSkiaWeb`'s loading fallback
(`ChartSkeleton`) caught by the shutter**, proven from pixel geometry: the four faint hairlines run
x=**41→360** (the full canvas box, straight through the `$8k` gutter) while real Skia gridlines run
**79→346**. The engine is innocent — the divergent blob yields 4 points, `6800 → 0` at month 3, and every
RN overlay sits where the geometry says (bead predicted `(123.7, 736.6)`, measured `(123.5, 736.5)`).

**The mechanism:** two *different* promises gate the two halves. `useSkiaReady` awaits **only**
`LoadSkiaWeb` and opens every label; `WithSkiaWeb` awaits that same promise **and then one more** —
`getComponent()`, its own 4,298-byte chunk — plus a Suspense re-render and first paint. **The labels can
only ever win.** That window is the photograph.

### ⛔ Two things in the original filing below were WRONG, and both were mine

1. **Hypothesis 2's stated mechanism is false.** It says `useSkiaReady` opens *"when the chunk fetch
   begins"*. It does not — `LoadSkiaWeb` resolves after `CanvasKitInit` **completes**. The unguarded step
   is the **second** await, not the first. Right direction, wrong step — the exact failure mode this repo
   has now recorded nine times.
2. ⛔ **`control-many-12debt.png` WAS NOT A CONTROL.** The filing reasons: *"the 12-debt portfolio draws
   fine under an identical load path, which weakens the timing hypothesis."* **It does not.** Run
   serially, 0/8 divergent and 0/8 many are blank; with four browsers competing on a 4-core box,
   **10/10 divergent and 10/10 many** are blank — including `repro-blank-many-12debt.png`, a frame of the
   "control" portfolio **indistinguishable from the filed defect**. The control had simply won the race
   that once. ⚡ *A single passing run is not a control; it is one sample of a race.*

### ⚠️ The missing x-axis labels are a SEPARATE non-defect

The loaded page draws its curve and **still** shows no x labels: on an unscrolled 402×874 frame
`baselineY` is y=816 and the tick glyphs land at **826–832**, under a tab bar whose top edge is **y=825**.
Two symptoms, two unrelated causes, filed as one observation.

### ⚠️ What this means for the MATRIX, beyond this defect

The matrix shoots with **two workers** and a 1,800 ms shutter. Under that contention a chart-bearing frame
can be a photograph of `ChartSkeleton` **with correct-looking labels over it** — and it is not visually
obvious. **Any lens finding about the Progress or cash-flow charts may have been read off a loading state.**
The 226-frame audit set was shot the same way. Filed to the plan.

---

**Status of the original filing: OBSERVATION ONLY — the mechanism was NOT established.** Found 2026-08-24 during P6.8.9.1 while
re-shooting the matrix. ⛔ **Do not act on a proposed cause until it is measured.** This repo has recorded
4 of 4 agent-supplied mechanisms wrong and six findings whose explanation or remedy did not survive.

## What is shown

| file | seed | curve? | x-axis labels? |
|---|---|---|---|
| `blank-divergent-2debt.png` | `STATES.divergent` — Store card $800 @ 8%, Big card $6,000 @ 26.99% | ⛔ **absent** | ⛔ **absent** |
| `blank-divergent-scrolled.png` | same, strategy-compare open + scrolled | ⛔ **absent** | ⛔ absent |
| `control-many-12debt.png` | `STATES.many` — 12 debts, horizon to 2034 | ✅ draws | ✅ 2027 … 2034 |

In the blank frames the card is **not** empty: the y-axis ticks (`$8k … $0`), the `Store card` waypoint dot
and the `Nov 2026` end pill all render. **Only the curve and the x-axis labels are missing.**

## Hypotheses NOT yet distinguished

Each of these was considered and **none is confirmed**; they are recorded so the next reader does not
re-derive them, not because any is believed.

1. **Short horizon.** Divergent is debt-free Nov 2026, roughly three months out. ⛔ **Weakened by
   evidence already in hand:** the single-debt `expanded-progress-disclosures-open.png` is debt-free
   Oct 2026 — a *shorter* horizon — and draws its curve and `Oct`/`Dec` labels normally.
2. **Skia load race (V4-8's residue).** `WithSkiaWeb` awaits `LoadSkiaWeb` then `getComponent()`
   sequentially, so `useSkiaReady` opens when the chunk fetch *begins*. ⛔ **Weakened by:**
   `control-many-12debt.png` is the same plain load with the same 1,800 ms settle and draws fine.
3. **Something specific to this portfolio's domain.** Two debts whose snowball and avalanche orders
   disagree is a shape no earlier seed produced — `divergent` was added in this same step.

⚠️ **P1-3 changed exactly this surface** (`trajectoryDomain.ts`, the x-domain, at cluster g.4) and was
verified `CLOSED` on 2026-08-24 by an independent verifier who confirmed the finding's two evidence frames
are visibly fixed. **That verdict was reached against portfolios that all draw.** These frames are not a
contradiction of it; they are a case it did not cover.

## Regenerate

```bash
npx playwright test --config apps/rn/playwright.shots.config.ts p6.8-matrix -g "divergent"
```
Frames land in `apps/rn/capture-ref/p6.8/phone/{light,dark}/state-progress-divergent.png` (gitignored).
