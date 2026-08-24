# DIAGNOSIS -- the blank payoff trajectory on the `divergent` seed

Written incrementally while measuring. Every number below was produced by a probe or by reading pixels
out of the pinned frames; nothing here is inferred from reading the chart component alone.

Probes (throwaway, outside the repo):
`%TEMP%/claude/.../scratchpad/{drive.ts,scan2.mjs,scan3.mjs,gold.mjs,crop.mjs}`.
`drive.ts` hydrates the EXACT matrix blob through the app's own `runMigrations` and calls
`selectPayoffView` + `trajectoryDomain`, i.e. the same functions `progress.tsx:226` feeds the chart.

---

## FACT 1 -- the engine is not the problem. The divergent portfolio produces a normal 4-point curve.

`npx tsx --tsconfig apps/rn/tsconfig.json drive.ts`, run 2026-08-24 (probe `startDate=2026-08-24`,
which is what `day(n)` in `apps/rn/tests/e2e/helpers/seed.ts:66` yields today):

| | divergent (snowball) | many (control) | single |
|---|---|---|---|
| `monthlyExtra` | 2827.50 | 0.00 | 2513.33 |
| `active.length` | **4** (months 0,1,2,3) | 93 | 2 |
| `active` balances | 6800, 3968, 1085, 0 | 39246 ... 0 | 1200, 0 |
| `clearMonth(active)` | 3 | 92 | 1 |
| `interestSaved.kind` | `payoff-enabling` | `none` | `saving` |
| `minimums.length` / clear | 9 / never | 93 / 92 | 43 / 42 |
| `rawEnd` (extent of all curves) | 8 | 92 | 42 |
| **`trajectoryDomain` -> `maxMonth`** | **6** | 92 | 6 |
| reconstructed `xTicks` | **2** -- `Oct` (m=2), `Dec` (m=4) | 8 -- `2027..2034` | 2 -- `Oct`, `Dec` |
| `debtFreeDate` | `November 2026` | `April 2034` | `September 2026` |

`activePath` is therefore a 4-point non-empty path and `xTicks.length === 2`.
**`trajectoryDomain.ts` returns 6 for this portfolio, and the x-tick fallback at
`TrajectoryChart.tsx:245-252` produces two labels from it.** Hypotheses 1 (short horizon) and 3
(something in this portfolio's domain) are DEAD as stated: the data that reaches the renderer is
well-formed, and it is the same shape the `single` seed produces -- which draws.

`debtFreeDate = November 2026` matches the `Nov 2026` pill in `blank-divergent-2debt.png`, so the probe
is driving the same state the frame was shot from.

## FACT 2 -- the frame's React-Native overlay is at the CORRECT geometry. Nothing is mispositioned.

Measured off `blank-divergent-2debt.png` (402x874):

- y-axis label centres: **658, 698, 737, 777, 816** -> spacing **39.5 px**, which is exactly
  `(H - PAD.t - PAD.b)/4 = 158/4` for `gridVals = [0,2000,4000,6000,8000]` (`TrajectoryChart.tsx:24,27`).
- the gold `Store card` waypoint dot occupies x=[121..126], y=[734..739], centre **(123.5, 736.5)**.
  Predicted from the probe: `mapX(1) = 38 + (1/6)*(320-52) = 82.7`, `mapY(3968) = 95.6`, so with the
  chart view at (41, 641) the dot centre lands at **(123.7, 736.6)**. Agreement to 0.2 px.
- the `Nov 2026` pill's measured left edge is x=177; predicted `41 + clamp(mapX(3) - 72/2, ...) = 177`.

So chart width `w = 320`, chart origin `(41, 641)`, and **every quantity the wrapper computed --
`maxMonth = 6`, `mapX`, `mapY`, the endpoint at month 3 -- is correct in the shipped frame.**

## FACT 3 -- the four faint lines in the blank card are NOT the chart's gridlines. They are `ChartSkeleton`.

This is the measurement that decides it. A row-by-row scan for "darker than the row 4 px above",
x limited to 35..370:

| frame | line rows | x extent of each line | spacing |
|---|---|---|---|
| `blank-divergent-2debt.png` | 665, 715, 766, 816 | **41 -> 360** | ~50 px |
| `blank-divergent-scrolled.png` | 351, 401, 452, 502 | **41 -> 360** | ~50 px |
| `control-many-12debt.png` | 631/632, 710/711, 789 | **79 -> 346** | 79 px |

- The chart view is at x=41 and is `w = 320` wide (FACT 2). A real gridline is
  `p1=vec(plotLeft, y) p2=vec(plotRight, y)` with `plotLeft = PAD.l = 38` and `plotRight = w - 14`
  (`TrajectoryChart.tsx:359-361`, `TrajectorySkiaChart.tsx:92`) -- i.e. screen **79 -> 347**.
  **The control's lines are at 79 -> 346. The blank frames' lines are at 41 -> 360 = the full width of
  the canvas box, straight through the `$8k`/`$6k` label gutter.** A Skia gridline cannot be there.
- Count and spacing agree with `ChartSkeleton.tsx:22-27`: a `View` of `height = 200` with
  `paddingVertical: height * 0.12 = 24` and **four** 1 px children under `justifyContent: 'space-between'`
  -> children at y = 24, ~74, ~125, ~175 -> screen **665, 715, 766, 816** with the chart origin at 641.
  Measured: 665, 715, 766, 816.
- The control's three lines match `gridVals = [0, 20000, 40000]` (its y-labels measured at 633.5 / 712 /
  791, spacing 79 = 158/2), which is what `niceStep(39246) = 20000` gives.

**So the blank card is rendering `WithSkiaWeb`'s `fallback` (`TrajectoryCanvas.web.tsx:20`), not a failed
plot.** The lazy `import('./TrajectorySkiaChart')` chunk had not mounted when the shutter fired.

Corroboration in the same frame: **the Progress hero's journey ring is missing too**
(`blank-divergent-2debt.png`, hero at y 57..240 -- "0% paid" with no ring), and it draws in the control.
`JourneyRingCanvas.web.tsx:11` is a second, independent `WithSkiaWeb`. One portfolio's numbers cannot
blank a ring that is not drawn from them; a mid-load frame blanks both at once.

## FACT 4 -- the x-axis labels are not missing. They are BELOW the tab bar in that frame.

- Control: `baselineY` on screen = 791 (its `$0` label); its x-tick glyphs occupy rows **801..807**, i.e.
  `baselineY + 10..16` -- consistent with `top: baselineY + 6` plus the caption's internal leading
  (`TrajectoryChart.tsx:388`).
- Blank frame: `baselineY` on screen = **816**, so the same glyphs land at **826..832**. The tab bar's
  top edge is a full-width row at **y = 825** and it covers 825..874. Scanning x=100..340, y=816..824 of
  the blank frame finds **zero** text pixels -- there is no room left for them above the bar.
- The blank frame's chart sits 24 px lower than the control's (origin 641 vs 617) because the cash-flow
  card above it is taller on this seed.

`blank-divergent-scrolled.png` settles it the other way: there the whole card is on screen and mid-card,
and it has **no y-axis labels, no waypoint and no pill either** -- only the same four full-width
hairlines. That is the designed loading state with `useSkiaReady` still false
(`TrajectoryChart.tsx:369-372`). The two frames are the same phenomenon caught at two different moments
of the same load, not two defects.

## FACT 5 -- the blank reproduces on the CONTROL portfolio. It is not the portfolio, it is the clock.

The live probe drives the real web export (`npm --prefix apps/rn run export:web`, served with
`npx serve apps/rn/dist -s`) through the matrix's exact recipe -- fresh browser context, seed
`localStorage`, `goto /progress`, `waitForTimeout(1800)`, then read the DOM. `trajCanvas` counts
`<canvas>` elements inside the Payoff Trajectory card.

**Serial, one browser at a time (probe2, n=8 per state):**

| state | blank at the 1800 ms shutter | x-ticks in the DOM | pill | waypoints |
|---|---|---|---|---|
| divergent | **0/8** | **2** | 1 | 1 |
| many | 0/8 | 8 | 1 | 11 |

**The divergent seed renders TWO x-axis tick elements once loaded** -- `xTicks` is not empty for this
portfolio, exactly as FACT 1 predicted.

**Four browsers in parallel on a 4-core box (probe3, 5 rounds x 4):**

| state | blank at the 1800 ms shutter |
|---|---|
| divergent | **10/10** |
| many (the control state) | **10/10** |

`repro-blank-many-12debt.png` is one of those runs: **the 12-debt control portfolio, `April 2034`,
$39,246 -- with the same four hairlines, no curve, and no journey ring.** The state the README calls the
control blanks identically the moment the machine is busy.

`repro-blank-divergent.png` is the round-3 run that also had `ticks=2 pill=1` in the DOM: it reproduces
`blank-divergent-2debt.png` element for element -- the `$8k..$0` labels, the `Store card` bead, the
`Nov 2026` pill, no curve, no visible x labels. (Its journey ring *did* draw, which shows the two lazy
canvases race independently of each other and of the data.)

## FACT 6 -- the mechanism: two different promises gate the labels and the canvas.

- `useSkiaReady` (`apps/rn/src/utils/skia-ready.web.ts:22-38`) awaits **`LoadSkiaWeb(canvasKitOpts)`
  only** -- the 8 MB CanvasKit wasm. When it resolves, `TrajectoryChart.tsx:369` opens and every RN
  overlay mounts: y-labels, x-ticks, waypoints, the endpoint pill.
- `WithSkiaWeb` (`@shopify/react-native-skia/lib/module/web/WithSkiaWeb.js`) is
  `lazy(async () => { await LoadSkiaWeb(opts); return getComponent(); })`. It waits on the **same shared
  CanvasKit promise and then does one more await** -- `getComponent()` =
  `import('./TrajectorySkiaChart')` (`TrajectoryCanvas.web.tsx:18`) -- plus a Suspense re-render and the
  first Skia paint. In the export that import is its own chunk:
  `dist/_expo/static/js/web/TrajectorySkiaChart-ef7c5f2729e09a30d2062c9966aeca6d.js` (4,298 bytes).
- **So the label gate can never lose to the canvas gate; it can only win.** The window between them is
  exactly the state the pinned frame photographed, and it is the state
  `skia-ready.web.ts`'s own header says must not exist ("a chart that FAILED, which is a worse thing for
  a money app to look like than a spinner"). The guard closes the wasm half of the load and leaves the
  chunk half open.
- Before that window, both are absent: that is `blank-divergent-scrolled.png` (no labels either).

## What is ruled out, and how

| hypothesis | verdict | how |
|---|---|---|
| 1. Short horizon / few months | **RULED OUT** | `trajectoryDomain` returns 6 and the tick fallback emits `Oct`+`Dec` (FACT 1); the loaded page has 2 tick elements in the DOM (FACT 5) |
| 3. Something in this portfolio's domain | **RULED OUT** | the 12-debt control blanks 10/10 under load (FACT 5); the engine output for divergent is a clean 4-point curve (FACT 1); the geometry in the blank frame is correct to 0.2 px (FACT 2) |
| 2. Skia load | **CONFIRMED, but not by the mechanism the README states.** The README's version -- "`useSkiaReady` opens when the chunk fetch *begins*" -- is wrong: `LoadSkiaWeb` resolves after `CanvasKitInit` completes. The real gap is the SECOND await inside `WithSkiaWeb`'s lazy (the component chunk), which `useSkiaReady` does not wait for at all (FACT 6) |
| P1-3 / `trajectoryDomain.ts` | **not implicated** | it returns 6 for this portfolio and 92 for the control; both are correct (FACT 1) |

## Does it reach a real user?

**On web, yes -- as a transient.** It is not tied to any portfolio shape, so every web visitor is exposed
on a cold load; it lasts from the moment CanvasKit resolves until the 4 KB chart chunk lands and paints.
It is short on a fast connection and it is not a permanently broken chart -- but it is precisely the
"confident axis over an empty plot" state the app already decided it did not want to show, and a slow
mobile connection or a busy device widens it. **It is not a wrong number, a wrong curve or a wrong
domain: nothing the user would act on is incorrect.**

**The `divergent` seed has no special exposure.** The frame that was filed is a photograph of a load, and
the same photograph can be taken of the control seed on demand.

**The missing x-axis labels are not a defect at all** (FACT 4) -- in that frame they sit under the tab
bar because the card is at the bottom of an unscrolled screen.

## Is it web-only?

**Structurally yes, by construction -- shown from the code, not measured on device.**
`ChartSkeleton` is referenced from `*.web.tsx` files only (`TrajectoryCanvas.web.tsx:16`,
`JourneyRingCanvas.web.tsx:15`, `AllocationBarCanvas.web.tsx:16`, `CashRunwayCanvas.web.tsx:19`,
`CushionBarCanvas.web.tsx:15`); the native `TrajectoryCanvas.tsx:8` renders `TrajectorySkiaChart`
directly with no `lazy`, no `Suspense` and no fallback, and `skia-ready.ts:11` returns a constant `true`.
There is no code path on iOS that can mount the skeleton. **Not verified on a device** -- but the
absence of a fallback path is a property of the files, not of a run.

## Regenerate

Engine (FACT 1) -- a throwaway script that imports `@/data/migrations` + `@/store/payoffSelectors` +
`@/components/payoff/trajectoryDomain`, hydrates the matrix blob and prints `maxMonth`, the series and
the reconstructed ticks. **Run it from `apps/rn` (or pass `--tsconfig apps/rn/tsconfig.json`) or the
`@/*` aliases do not resolve:**

```bash
cd apps/rn && npx tsx <probe>.ts        # or: npx tsx --tsconfig apps/rn/tsconfig.json <probe>.ts
```

Pixels (FACTS 2-4) -- `sharp` (present at the repo root) reading the pinned PNGs raw: per-row scans for
"darker than the row 4 px above" in x=35..370 give the line rows and their extents; a gold-pixel bounding
box gives the waypoint bead.

Live (FACTS 5-6):

```bash
npm --prefix apps/rn run export:web
npx serve apps/rn/dist -s -l 4319       # NOTE: `serve` may ignore -l and print its own port - read the log
```
then a plain Playwright script (repo root `node_modules/playwright`): fresh context per trial, viewport
402x874, `addInitScript` writing `debtPlanner.rnStore`, `goto /progress`, `waitForTimeout(1800)`, then
count `<canvas>` inside the Payoff Trajectory card and `[data-testid="trajectory-x-tick"]`. Run four
browsers concurrently to force the blank -- serially it does not reproduce on this machine.

## Addendum -- what the divergent seed looks like when it wins the race

`repro-drawn-divergent.png` (same seed, same 1800 ms shutter, serial run): **the curve draws** -- the
blue line falls from $6,800 to $0 at month 3, the `Store card` bead sits on it, the gold endpoint bead
lands under the `Nov 2026` pill. **And the x-axis labels are still not visible**, for the reason in
FACT 4: on an unscrolled 402x874 phone frame the `$0` baseline is the last thing above the tab bar and
the tick row is behind it. That single frame closes both halves of the original observation.
