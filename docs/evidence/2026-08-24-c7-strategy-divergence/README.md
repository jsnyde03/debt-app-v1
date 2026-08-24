# C7 — how far apart ARE snowball and avalanche? *(measured 2026-08-24, at g.3's switch-in)*

**Why this exists.** C7 is *"snowball vs avalanche, side by side"*, and the plan's own note for it is that
**both simulations already run on every render and `TrajectoryChart.tsx:147` discards one**
(`const active = strategy === 'snowball' ? snowball : avalanche`). That is true, and it makes drawing the
second curve nearly free — which is exactly why it is worth asking what the second curve would *show*
before building it.

⛔ **The answer is: almost nothing. The two total-balance curves are visually indistinguishable, and on
most portfolios the debt-free date is identical.**

## Reproduce

Both probes are in this folder. Copy either into `packages/core/debt/` and run it with `tsx` (it needs the
`@core` alias, which resolves from inside the package), then delete it:

```bash
cp docs/evidence/2026-08-24-c7-strategy-divergence/probe-curves.ts packages/core/debt/__probe.ts
npx tsx packages/core/debt/__probe.ts
rm packages/core/debt/__probe.ts
```

## Result 1 — the CURVES do not separate

`worst vertical gap` is the largest difference between the two total-balance curves at any month,
as a percentage of the chart's own Y extent — i.e. how far apart the two lines would sit on screen.

| portfolio | snowball | avalanche | Δ months | worst vertical gap |
|---|---|---|---|---|
| classic 3-card | 27 | 27 | **0** | $0 / **0%** |
| high-APR small + low-APR large | 44 | 44 | **0** | $0 / **0%** |
| inverted (big debt is also the expensive one) | 29 | 29 | **0** | $296 / **2.8%** |
| five mixed debts | 28 | 28 | **0** | $20 / **0.1%** |
| many small cheap + one big expensive | 53 | 51 | **2** | — |

⚡ **Best case for avalanche across every portfolio tried: 2 months out of 53.** Everywhere else the date
is identical and the lines overlap.

⚠️ **A mechanism, offered as a hypothesis and not as a finding** *(the standing rule on this project is
that a stated mechanism is measured before it is believed)*: the chart plots **total** balance, and the
same monthly budget leaves the wallet either way — only interest accrual differs, and that is second-order
against the total. It predicts the gap should grow with APR spread, which the "inverted" row is weakly
consistent with. **Not verified.**

## Result 2 — the difference is WHICH DEBT CLEARS WHEN, and it is large

The same portfolios, asking a different question:

| portfolio | snowball order | avalanche order | first win |
|---|---|---|---|
| classic 3-card | Store card@3 → Visa@18 → Car loan@27 | *identical* | same |
| **tiny cheap + huge expensive** | **Tiny cheap@1** → Huge expensive@42 | **Tiny cheap@20** → Huge expensive@42 | ⚡ **19 months sooner** |
| **five mixed** | A@2 → D@4 → B@10 → C@18 → E@28 | **D@3 → B@9 → A@10** → C@18 → E@28 | 1 month sooner, **and the order is reshuffled** |

⭐ **This is the real product difference and the chart cannot show it.** The debt-free date is the same, the
curve is the same, and yet one plan hands the user their first cleared debt in **month 1** and the other in
**month 20**. That is the entire snowball-vs-avalanche argument, and it lives in the waypoints, not the line.

## What this does NOT say

- **It does not say C7 should be cut.** It says a side-by-side built out of *curves* would draw two lines
  nobody can tell apart, on a card **P1-3 already reports as unreadable at its default domain**.
- **It does not measure total interest paid.** At month granularity both strategies finish in the same
  month spending the same monthly budget, so total cash out is near-identical — but a finer-grained
  interest comparison was not run, and avalanche's advantage is *by definition* an interest advantage.
  ⚠️ If the decision turns on a dollar figure, that figure has not been measured yet.
- ⚠️ **Two probe cases were degenerate and are excluded above** — a minimum payment below the monthly
  interest never pays the debt off, so the simulation returns no zero-crossing. Correct behaviour, and a
  reminder that "months to payoff" has an infinite case.
