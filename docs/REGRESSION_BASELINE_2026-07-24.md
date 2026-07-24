# v1.7 Comprehensive "Break-It" Regression Baseline

**Directive (Jason 2026-07-24):** set a comprehensive automated-test baseline aimed at **testing AND breaking the system** — cover anything and everything we can think of, and it must return **GREEN across the board before v1.7 ships.** Not happy-path only: adversarial + stress + edge + fuzz. This pulls the **Phase-4 RN test-harness** item forward to current.

## Approach — lightweight `tsx`, no new heavy tooling (before-scan finding)

The store + selectors have **zero `react-native`/`expo` runtime imports** — they're pure logic (`zustand/vanilla` + `@core` values + `@/data`). `apps/rn/core` symlinks `packages/core`, and **`tsx` run from `apps/rn` resolves the RN tsconfig aliases** (`@/`→`src`, `@core`→`core`) — verified: a test that imports `selectPaydayGuardian` (which pulls `@core` values), builds a store, and runs it works under `tsx` with no RN mocks, no vitest.

So the app-layer harness mirrors the existing `packages/core/testing/runRegressionTests` pattern: a **`tsx` runner that imports app-layer `*.test.ts` files**, run from `apps/rn`. One consistent test idiom across core + app-layer; new tests are cheap to add. (Vitest was the fallback if RN mocking were needed — the before-scan shows it isn't.)

## Coverage layers

| Layer | Home | Runner | Status |
|---|---|---|---|
| **Core engine** | `packages/core/testing/*` | `npm run test:regression` (tsx) | Strong reconciliation coverage; extend with break-it cases |
| **App-layer** (store + selectors + actions) | `apps/rn/src/**/**.test.ts` | NEW `npm run test:app` (tsx, RN aliases) | ~zero selector/action tests → the main gap |
| **Integration / e2e** | `tests/e2e/*.spec.ts` | `npm run test:e2e` (Playwright web) | Extend w/ Guardian surfaces + trouble-flows |
| **Native** | Maestro flows | device | Device-QA (Phase 6); keep light here |

`npm run validate:release` chains lint + all suites; add `test:app` so app-layer is green-gated too. A `test:all` convenience wraps them.

## The "break-it" classes (apply across layers)

- **Bad numbers:** NaN · Infinity · negative · zero · huge · fractional-cents.
- **Empty / degenerate:** no debts · no paycheck · single item · all-paid · debt-free · $0 income.
- **Every Guardian state × tier × regime:** clear / tight / at-risk / shortfall / paused / stale / debt-free / graduation / cold-start / topped-up — for free AND premium, debt AND debt-free.
- **Boundaries:** the floor, `computeState` band edges + hysteresis, calibration N-gate, notification freq-cap window, lean percentile handoff, water-fill cumulative cap.
- **Persistence:** corrupt / partial / unmigrated store · migration idempotence · safe-storage quarantine.
- **State-machine abuse:** double-apply · stale-cycle keys · rollover-while-mid-action · concurrent mutations · demo/import isolation (no calibration leaks).

## Decomposition (RS.x — see MASTER_PLAN §2 for the live queue)

1. **RS.1 Harness** — `apps/rn/src/testing/runAppTests.ts` (tsx runner) + `test:app` script; wire the existing pure app-layer tests in + into `validate:release`. **(foundation)**
2. **RS.2 Guardian selectors/actions** — `selectPaydayGuardian` (all states×tier×regime) · `selectTightTopUp`/`applyTightTopUp` · `selectCalibrationScore` · `selectRiskNotification`/ack/`applyRiskNotified` · graduation · `selectWaterFillPlan`.
3. **RS.3 Store actions + transitions** — capture · rollover · missed/undo · lean · top-up · risk-notified · migrations path.
4. **RS.4 Core adversarial/fuzz** — extend the core suites with the break-it classes across the engine.
5. **RS.5 Persistence/migration + corrupt-data** — extend safe-storage + migration edges.
6. **RS.6 Integration/e2e** — Guardian surfaces + trouble-flows (Playwright).
7. **RS.7 Green-gate** — `test:all` + `validate:release` wiring; confirm green across the board.

**Standing practice:** every new feature lands WITH adversarial/edge coverage; the suite stays green at each checkpoint. Pairs with the Guardian convergence audit's correctness lens.
