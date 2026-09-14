# Class 5 re-audit — lane L1 *(round 1)*

- **Lane:** L1 — the claims and the selectors, plus class 4's tail (`payoffCelebration`)
- **Pin:** `ea3f5e0e` · range `c7df99c2..ea3f5e0e`
- **Worktree:** `C:/Users/Jason/audit-c5r1-L1` (plants) · `C:/Users/Jason/audit-c5r1-L1-base` (attribution at `c7df99c2`, torn down at end)
- **Worst-case spend quote:** ~3M input tokens (18 manifest files / 5.7k lines read in full, consumers followed out, ~25 plant cycles of `test:app`-scoped runs and a handful of `prove:guards --id=` re-executions). No sub-agents. No Playwright.
- **Status: COMPLETE** *(2026-09-14 14:44)*
- **Actual spend:** within the quote. Wall time was dominated by `prove:guards` waiting on L3's `:4319`, about 20 minutes of waits.

## Summary

| severity | attributable | reservoir | class4-tail | total |
|---|---|---|---|---|
| blocker | 0 | 0 | 0 | **0** |
| major | 1 (`L1-1`) | 1 (`L1-R1`) | 0 | **2** |
| minor | 4 (`L1-2`, `L1-3`, `L1-4`, `L1-5`) | 0 | 0 | **4** |
| **total** | **5** | **1** | **0** | **6** |

- **Attributable user-facing defects: 3** (`L1-1`, `L1-2`, `L1-3`). Each was measured at `c7df99c2` and does NOT reproduce there.
- **Closures OPEN by planting: 2** (`L1-4`, `L1-5`). The code at the pin is correct, but nothing reds when it regresses.
- **Class 4's tail (`R5-1`): closed.** Three plants, each red at the row that names it.
- **Cumulative:** the 24 registry proofs whose `unfix.at` is in this lane's manifest were re-executed with `prove:guards --no-record`. **24 of 24 MATCHED**, all `plant-applied=YES · planted=exit 1 · control=exit 0`. Not run: `S1P3-C1-ROWFIGURES` (Playwright → L3) and the four entries this range added (`S1P7-B1-1`, `S1P7-C3-14`, `S1P7-57-2B`, `S1P7-B1-2` → L4's subject). `B1-1` and `B1-2` were measured here by probe instead, and `C3-14` is covered by L4.
- **Tree:** `audit-c5r1-L1` left in place and clean at `ea3f5e0e`, for the driver. `audit-c5r1-L1-base` removed, junctions first.

## Findings

### L1-1 · major · attributable (`.5.2` `C1-2`, `5692ca41`) — a plan-money repair whose honest answer is `$0` can never be answered, and the ack no longer clears it

- **Consequence.** A backup/import with an unreadable `cushionFloor` or `windfall` (both repair to `0`) leaves the plan **permanently** unreadable when the user's true value is `$0` — which for `windfall` is the ordinary value. After *"Got it"* and after re-entering `$0` exactly as the card asks: premium still reserves **$200** against a line the user set to **$0**, the Guardian keeps withholding "your line", and on a lost windfall `mayClaim('required-plan')` and `mayClaim('paycheck-plan')` stay **false** — the Guardian card, affordability, windfall routing and `RequiredActionsCard` refuse for the life of the install. Only escape: type a non-zero value, then change it back (undiscoverable). This is `S1.9.2 C1`'s shape (*"a repair is a question, and it has to be able to be ANSWERED"*) on the plan entity.
- **Where.** `apps/rn/src/store/trustSelectors.ts:593` (`answerableByEdit` now true for `plan`) → `:520` (`!answerableByEdit(r) ? !r.acknowledged` no longer reached, so the ack stops clearing it) → `:529-535` (the plan branch clears only if the value MOVED: `return was === now`). `setCushionFloor(0)` / `setWindfall(0)` on a repaired `0` moves nothing. The debt-balance twin of this problem already has `answerBalanceRepairs` (`:661`); the plan has no equivalent.
- **Measurement.** `class5-reaudit-probes/L1/p1-plan-repair-same-value.ts`, through the real wired store (`createDebtStore`, seeded via `runMigrations`). Outputs `p1-*.L1.out` (pin) and `p1-*.L1-base.out` (`c7df99c2`).
  - pin: `A1 after ack` → `cushionFloor:lost:ack`, `cushionLine {value:200, unread:true}`, buffer `200` · `A2 setCushionFloor(0)` → **unchanged** · `B1 setCushionFloor(0)` with no ack → **unchanged** · `B2` control `setCushionFloor(25)` → repair cleared, `unread:false` (the clearing path works when the value moves) · `C1`/`C2` lost windfall, ack, `setWindfall(0)` → `windfall:lost:ack`, `mayClaim_required false`, `mayClaim_paycheck false`.
  - `c7df99c2`: `A1 after ack` → `planRepairs: []`, `mayClaim_required true` · `C1 after ack` → `planRepairs: []`, both claims true.
- **Reproduces at `c7df99c2`?** **NO** — the ack cleared both. *(The base had its own defect, `C1-2`: `B2` shows a moved value did NOT clear the repair there. The fix repaired the "moved" direction and closed the only exit for the "same value" direction.)*
- **Mechanism (HYPOTHESIS).** `C1-2` made plan repairs answerable-by-edit, which correctly routes them away from the ack. But signal 1 (the value moved) cannot fire when the honest value equals the sentinel, and the plan has no explicit-intent path like `answerBalanceRepairs`. The rule the `trustSelectors.ts:463-469` docblock already states for balances (*"intent that leaves no trace has to be stated by the action that has it"*) was not carried to the plan setters.
- **Remedy (UNVERIFIED).** `setCushionFloor` / `setWindfall` / the lean-paycheck and reserve-balance setters state the answer explicitly, like `answerBalanceRepairs`: a user write to that path removes that path's plan repair even when the value is unchanged. ⚠️ Must not fire from `runMigrations`/hydrate or `importStore` (signal 1's own warning), and the ack must still NOT clear it.
- **Severity note.** Rated **major**, not blocker, because a two-step escape exists. `C1`, the same shape, was a blocker because it had none.

### L1-2 · minor · attributable (`.5.4c` `C3-13`, `77c5f21b`) — the reserve-release card names a debt the plan is not paying

- **Consequence.** A premium user who has one debt projected to `$0` but not yet confirmed, beside a live debt, is told the freed safety net goes to **"your StoreCard"** — the provisional payoff the plan skips. The allocation sends every dollar of extra to **Visa**, and the Guardian brief on the same screen says *"apply the spare $786 toward Visa"*. One screen, two destinations.
- **Where.** `apps/rn/src/store/guardianSelectors.ts:175-178` (`selectReserveRelease`: `rankDebts(liveDebts(store))[0]`) reads `apps/rn/src/store/trustSelectors.ts:115` (liveness now on the CONFIRMED balance) and ranks with `apps/rn/src/store/payoffSelectors.ts:93`, which sorts on the PROJECTED `balance`. Snowball puts the `$0` estimate first, and avalanche does too when it carries the highest APR. Called on `engineStore` at `apps/rn/src/app/(tabs)/index.tsx:161`.
- **Measurement.** `p2-projected-zero-focus.ts` (X: $100 balance, $120 minimum, verified 2026-05-01 → projects to $0; Y: Visa $3,000). pin, S1 snowball and S2 avalanche: `live [x,y]`, `snowballTo ["y:786"]`, **`reserveReleaseTarget "your StoreCard"`**, brief *"…apply the spare $786 toward Visa"*. `c7df99c2`, both: `reserveReleaseTarget "your Visa"`.
- **Reproduces at `c7df99c2`?** **NO.**
- **Mechanism (HYPOTHESIS).** `C3-13` moved liveness to the confirmed balance, which puts the provisional debt back in `live`. The ranker still orders by the estimate. `selectPaydayGuardian` escaped because it names the focus off the actual `snowball` allocation first (its own comment: *"a raw re-rank can name the wrong debt"*), but `selectReserveRelease` re-ranks.
- **Remedy (UNVERIFIED).** Name the destination the way `selectPaydayGuardian` does, from the allocation's first `snowball` row, falling back to the rank. Or rank only debts whose projected balance is `> 0`, keeping liveness for the `'debt-free'` question.
- **Not filed (the 🎯 decision's consequence):** S3, where every debt projects to `$0`, reads `planState 'normal'`, `debtFreeDate null`, release *"your StoreCard"*, brief *"Nudge your line down anytime to free up more for debt"*. At base it was `'debt-free'` / *"your savings"*, the false claim `C3-13` was raised for. Recorded for the driver and L3, not as a defect.

### L1-3 · minor · attributable (`.5.2` `C1-1`, `5692ca41`) — a legitimately set `$0` line: the card says "tight" and "just above your $0 line" in one breath

- **Consequence.** A user who set their cushion line to **$0** (the slider's minimum, `CushionFloorSheet.tsx:71`) gets an amber *"A little tight this paycheck"* whose own sentence says *"$100 after everything required, **just above your $0 line**, with $60 going to debt"*. The band is still judged against a hidden **$200**, while the sentence and the bar now read `$0` (`reachedFloor: true`).
- **Where.** `packages/core/guardian/buildGuardianBrief.ts:208` now keeps a finite `0` · `:248` computes the band with `computeState(discretionary, floor)` · `packages/core/guardian/computeState.ts:32,44` maps `floor > 0 ? floor : 200` · `:376-378` builds the sentence from the kept `0`.
- **Measurement.** `p3-legit-zero-line.ts`, a readable `cushionFloor: 0` with no repair, premium, $1,000 paycheck. pin: `state tight · floor 0 · reachedFloor true · "…just above your $0 line…"`, and the same at $1,060. `c7df99c2`: `state tight · floor 200 · reachedFloor false · "…a little under your $200 line…"` (consistent with itself, though it printed a $200 line the user never set: `C1-1`'s defect). Control, line `$25`: identical at both trees (`clear`).
- **Reproduces at `c7df99c2`?** **NO** — the contradiction is new. The base's false `$200` was the defect `C1-1` closed.
- **Mechanism (HYPOTHESIS).** `.5.2` separated "unusable" from "zero" in the brief. `computeState` still conflates them, deliberately per `selectors.ts:28-31` (*"measured at 484 cases"*), so the band and the sentence now read two different lines. `guardianPrediction.ts:45` also stamps `floor: brief.floor` (now `0`) for the calibration scorecard (`calibrationScore.ts:96`), so grading can move for $0-line users. **Not measured.**
- **Remedy (UNVERIFIED).** Decide what a `$0` line means for the band. Either pass the same floor to `computeState` that the sentence prints, or keep the sentence on the band's line. Either way, assert that the title's band and the sentence's comparison agree.


### L1-4 · minor · attributable (`.5.2` `C1-3`, `5692ca41`) — `C1-3`'s second site is OPEN: nothing reds when it regresses

- **Consequence if it regresses.** Every refusal that names a lost plan figure would read *"set your cushion line on your cushion line again"*. Five surfaces build that sentence through `unreadInputsFix` → `namedFigures`: Today's Guardian card (`index.tsx:374`), `RequiredActionsCard` (`index.tsx:551`), the Cushion Forecast (`cushion-forecast.tsx:70`), Affordability (`AffordabilityCard.tsx:241`) and Windfall (`WindfallSheet.tsx:153`). **The code at the pin is correct.** The defect is that the closure is not refused.
- **Where.** `apps/rn/src/components/plan/dataRepairsCopy.ts:299` (`if (r.entity === 'plan') return field;`). The first site, `describeRepair` at `:134`, IS pinned.
- **Measurement.** Plant `plants/c13b`, with the `plan` branch disabled:
  - `dataRepairsCopy.test` → **green**. The seeing-control `c13a` in the same file and test is red, so the test sees the file;
  - the full `test:app` → **green**, exit 0, restored byte-identical;
  - no e2e spec contains the sentence or `C1-3` (`git show` census of `apps/rn/tests/e2e/*.spec.ts`);
  - no registry entry pins it.
- **Reproduces at `c7df99c2`?** Cannot be measured as a user defect there: plan repairs were unanswerable, so `namedFigures` never received one. The missing guard is attributable to the closure that exposed the sentence.
- **Remedy (UNVERIFIED).** Add a `dataRepairsCopy.test` row asserting `unreadInputsFix([planCushionRepair], …)` names the line once, and plant it.

### L1-5 · minor · attributable (`.5.2` `C1-1`, `5692ca41`) — `C1-1`'s user-visible half is OPEN at the unit level: `floorUnread` can be dropped and no app test reds

- **Consequence if it regresses.** The Guardian card goes back to printing a confident *"$200 line against it"* inside the sentence explaining the line could not be read (`PaydayGuardianCard.tsx:244` gates on `brief.floorUnread`), which is `C1-1` verbatim. **The code at the pin is correct.**
- **Where.** `packages/core/guardian/buildGuardianBrief.ts:261` (`floorUnread: input.floorUnread === true`) and `guardianSelectors.ts:917` (`floorUnread: line.unread`).
- **Measurement.** Plant `plants/c11brief`, `floorUnread: false`: the full `test:app` → **green**, exit 0, restored byte-identical. `grep floorUnread` over every `*.test.ts` / `test*.ts` returns **0 files**. No e2e spec asserts the withheld figure: `guardian.spec.ts:20` expects *"· Your line"* on a readable store. What IS pinned is the input half: `cushionLine(lost).unread` (`c11unread` red). **Core `test:regression` is green too**, under a valid control (job 4: control exit 0, then the plant exit 0, restored byte-identical). `testBuildGuardianBrief.ts` pins the NaN→200 default and nothing about `floorUnread`.
- **Reproduces at `c7df99c2`?** The field did not exist, so it cannot be measured. The missing guard is attributable to `.5.2`.
- **Remedy (UNVERIFIED).** A `guardianSelectors.test` row: a lost `cushionFloor` gives `selectPaydayGuardian(s).floorUnread === true`, plus a readable-`$0` control that is `false`. Planted both directions.

### L1-R1 · major · reservoir (pass-6 `C3-9`, `S1.13.7.5`) — a premium debt projected to `$0` disappears from Money's debt list

- **Consequence.** A premium user with a debt whose estimate has reached `$0`, still owing it and not yet confirmed, finds it in **no section** of Money: not the active list, not BALANCE UNREAD, not PAID OFF. They cannot open, edit or log a payment on it from the debts screen. The only door left is Today's confirm-payoff invitation. This is the *"in neither the active list nor the paid-off list"* shape `money.tsx:259-263` and `migrations.ts:99` name as a failure.
- **Where.** `apps/rn/src/app/(tabs)/money.tsx:233-236` (`view = selectPayoffView(withProjectedBalances(store, premium))`) → `:383` (`active = view.order`) → `apps/rn/src/store/payoffSelectors.ts:98,132` (ranks `balance > 0` on the PROJECTION). Meanwhile `money.tsx:266` partitions the RAW store, where the debt is live (`$100`), so it is in neither `cleared` nor `unreadBalance`.
- **Measurement.** `p7-money-sections.ts`, debts x ($100, projects to $0), y (Visa), z (cleared). Pin, premium: `active [y] · unread [] · paidOff [z] · missing ["x"]`. Free control: `missing []`. `c7df99c2`: **identical**.
- **Reproduces at `c7df99c2`?** **YES** → reservoir. It arrives from pass-6 `C3-9`'s move of Money onto the projected ranking (`money.tsx:219-229`). Class 5's `C3-13` routed liveness through `confirmedBalance` in `trustSelectors` but not the ledgered re-derivation in `selectPayoffView`, so class 5 left it standing. Not found in `CLASSIFICATION.md` or `DEBT_ELEVATION_BACKLOG.md` (`grep`: "provisional", "projected $0", "neither list").
- **Mechanism (HYPOTHESIS).** Two liveness answers on one screen: the confirmed one (partition) and the estimate one (payoff view).
- **Remedy (UNVERIFIED).** Rank `view.order` from `liveDebts(projected)`, which is confirmed liveness, and keep the ordering on projected balances. Assert that Money's three sections sum to `store.debts.length` on a premium projected store.

## Question 1 — is each class-5 closure in lane L1 refused by planting?

Every plant used `class5-reaudit-probes/L1/plant.py` in `audit-c5r1-L1`. The method, each line of which was followed:
- the anchor must match exactly once, and the plant is confirmed to have landed;
- the file is written in byte mode and restored in `finally`;
- the restore is verified by a byte compare against a pre-plant copy; every restore compared `True`;
- a clean control of the same command runs first. `trustSelectors.test`, `journeySelectors.test`, `dataRepairsCopy.test`, `payoffCelebration.test` and the full `test:app` were each exit 0 clean.

| closure | plant (`plants/*`) | command | result |
|---|---|---|---|
| `C3-13` the projection record | `c313rec` — `withProjectedBalances` stops recording | `trustSelectors.test` | 🔴 *"C3-13 · premium · $100 left · projects to $0 · plan state … expected normal, got debt-free"* |
| `C3-13` liveness reads confirmed | `c313live` — `liveDebts` back to `balance > 0` | `trustSelectors.test` | 🔴 same row, named |
| `C3-13` partition reads confirmed | `c313part` — `partitionDebts` back to `balance > 0` | `trustSelectors.test` | 🟢 **not caught**, and the **full `test:app` is also green** (exit 0). Seeing-control: `c313live`/`c12`, same file and same test, both red. ⚠️ **Not filed as a defect**: every production caller of `partitionDebts`/`clearedDebts` passes the RAW store (`money.tsx:266`, `store.ts:77`, `snapshot.ts:291`, `index.tsx:200,597`, `progress.tsx:193`), so the unguarded line has no reachable projected input today. A guard gap on a latent path |
| `C3-9` `lineIsProjected` | `c39` — flag `false` (also flips the sentence) | `journeySelectors.test` | 🔴 but at *"a fresh portfolio leads forward…"*, i.e. the sentence, not the flag. Re-planted |
| `C3-9` flag only | `c39b` — return `lineIsProjected: false`, sentence kept | `journeySelectors.test` · full | 🔴 *"⛔ C3-9 — the 'to go' arm is projection-derived… got false, expected true"* · full suite exit 1 |
| `C1-2` plan answerable | `c12` — drop `\|\| r.entity === 'plan'` | `trustSelectors.test` · `dataRepairsCopy.test` | 🔴 *"⛔ C1-2 — the plan is answerable…"* · 🔴 *"⛔ C1-2 — a lost cushion line IS answerable… expected lost, got unrecoverable"* |
| `C1-6` one line value | `c16val` — `value: stored` | `trustSelectors.test` | 🔴 *"…computes on the default, never the sentinel 0 — expected 200, got 0"* |
| `C1-1` the loss is reported | `c11unread` — `unread = false` | `trustSelectors.test` | 🔴 *"the owner reports the loss… expected true, got false"* |
| `.5.4d` the line asks `'paycheck-plan'` | `d54claim` — asks `'required-plan'` | `trustSelectors.test` | 🔴 same row (the narrowing interaction the `selectors.ts:407-409` comment records) |
| `C1-3` `describeRepair` plan label | `c13a` | `dataRepairsCopy.test` | 🔴 *"⛔ C1-3 … expected 'Your cushion line', got 'your cushion line — your cushion line'"* |
| `C1-3` `namedFigures` plan label | `c13b` | `dataRepairsCopy.test` | 🟢 **not caught**, and the **full `test:app` is also green** (exit 0). Seeing-control: `c13a`, same file and same test, red. **OPEN → `L1-4`** |
| `C1-1` the brief carries `floorUnread` | `c11brief` — `floorUnread: false` | full `test:app` · `test:regression` | 🟢 **full `test:app` green** (exit 0). No `*.test.ts` names `floorUnread`. `test:regression` **green** too (valid control, job 4). **OPEN → `L1-5`** |
| `R5-1` (class 4's tail) | `r51a` / `r51b` / `r51c` | `payoffCelebration.test` | 🔴 ×3, named — see non-defects |

**Registered proofs.** None of the 28 registry entries the range added (`git show` of both registries: 302 → 330) pins `C3-13`, `C3-9`, `C3-11`, `C1-1`, `C1-2`, `C1-3`, `C1-5`, `C1-6`, or `C3-8` on premium; only `S1P7-57-3-FREE-C3-8-TWIN` exists, and it is Playwright, so L3's. Their commits describe plants done at fix time, but **no durable proof entry exists** for 8 of the 13 `CLASSIFICATION.md` rows or for the plan's `C1-2`/`C1-3`. The planting above is the only re-execution those closures have. *(The registry is L4's subject; recorded here as a membership disagreement.)*

## Question 3 — cumulative: guards whose pinned files are in this lane

`guards-in-lane.mjs` found **29** registry entries whose `proof.unfix[].at` is one of L1's 18 files. Re-executed in `audit-c5r1-L1` with `npm run prove:guards -- --no-record --id=<ID>`: **24**, one at a time, each waiting while `:4319` was held (L3; never touched). Job 3 ran 3 and was refused on the port at the 4th; job 4 ran the other 21. Logs: `job-3.out`, `job-4.out`.

**24 of 24 MATCHED** — every one reporting `plant-applied=YES · planted=exit 1 · control=exit 0`: `S1P4-C4-5-ARITY` · `S1P4-C4-2-MEMBERSHIP` · `S1P3-C5-PAYWALL` · `S1P3-G1-CALIBRATION` · `S1P3-G2-RESERVETARGET` · `S1P3-G3-GUARDIANREGIME` · `S1P3-G4-PLANROUTE` · `S1P3-G5-SAVINGSPOOL` · `S1P4-F-B4-CLASS` · `S1P4-ACK-DOES-NOT-VERIFY` · `S1P5-B5-7-ANSWERABLEID` · `S1P5-C5-3-SHEETBALANCE` · `S1P6-B1-1-UNREADSTILLLIVE` · `S1P6-A3-14-HYSTERESIS` · `S1P6-B1-4-LEDGER-NOT-BAN` · `S1P7-U11-WELDED-TOKEN` · `S1-CLASS4-A2-1` · `S1-CLASS4-A3-1` · `S1-CLASS4-A3-2` · `S1-CLASS4-F7-HEADSUP` · `S1-CLASS4-R2-1-CAP` · `S1P7-R3-2-HEADSUPTOTAL` · `S1P7-R3-4-FREEDPERMONTH` · `S1P7-R4-1-ONETIMELUMP`.

**Not run by L1:** `S1P3-C1-ROWFIGURES` (Playwright → L3), and `S1P7-B1-1-SAVEFORIT-PACE-KEPT`, `S1P7-C3-14-GOALS-HERO-COUNT`, `S1P7-57-2B-CLAIM-LATTICE`, `S1P7-B1-2-OFFER-ASKS-ENGINE`, which are entries the range added and therefore L4's subject.

## Derived class-5 membership, and the disagreements

Derived from `git log c7df99c2..ea3f5e0e` messages, `CLASSIFICATION.md` §CLASS 5, the plan's `.12.6.5` row, and the 28 registry keys the range added:

| id | table (13) | plan | commit in range | registry entry added |
|---|---|---|---|---|
| `C3-13` | ✅ | ✅ | `77c5f21b` `e695f6c5` | ❌ |
| `C3-8` | ✅ | ✅ | `55cf576c` | only `…FREE-C3-8-TWIN` (`.5.7`) |
| `C3-9` | ✅ | ✅ | `905b6836` | ❌ |
| `C3-11` | ✅ | ✅ | `f0f1d36a` | ❌ |
| `C3-5` | ✅ | ✅ | `1cb8c0b7` | ✅ ×2 |
| `C3-1` | ✅ | ✅ | `566bd7d5` | ✅ |
| `C1-1` | ✅ | ✅ | `5692ca41` | ❌ |
| `C1-5` | ✅ | ✅ | none names it; the plan says `.5.4` | ❌ |
| `C1-6` | ✅ | ✅ | `5692ca41` (implied: "one owner for your line") | ❌ |
| `D2-12` | ✅ | ✅ | `a692ff7a` | ✅ |
| `C3-2` | ✅ | ✅ | `a692ff7a` | ✅ ×2 (TS + Swift) |
| `B1-1` | ✅ | ✅ | `2eb87b3f` | ✅ |
| `C3-14` | ✅ | ✅ | `b8db7651` | ✅ |
| `C1-2` | ❌ (pulled from `.12.6.6`) | ✅ | `5692ca41` | ❌ |
| `C1-3` | ❌ (swept inline) | ✅ | `5692ca41` | ❌ |
| pass-6 `C3-6` | ❌ | ✅ | `3066026a` | ✅ ×3 (`S1P6-…`) |
| `B1-2` (class 6) | ❌ | ✅ (`.5.7` ④b) | `ca4184a8` | ✅ |
| `.5.7` unnumbered: replay-once, carry, runway held, confirm funded, hero-date-fit ×2, lattice, lost-field, ledgers ×2, staleness | ❌ | prose only | `67f3c6fb` `ca4184a8` `6f514940` `48aa6697` `e37daf6a` | ✅ |
| `R5-2` (class 4's tail) | ❌ | ❌ | `55fcc88f` | n/a (L4) |

**Counts:** 13 table rows · 17 ids in the plan (13 + `C1-2`, `C1-3`, pass-6 `C3-6`, `B1-2`) plus the unnumbered `.5.7` closures · **77 commits** in the range, including the brief's own `ea3f5e0e`. The brief says 76, which counts the class's commits without the brief. **70 code files** under `apps packages scripts`, matching the brief.

**Disagreements:** (1) `C1-5` is named by no commit message in the range. (2) Seven closed table rows plus `C1-2`/`C1-3` have **no registered proof**, while every `.5.7` closure does. (3) Of `R5-1`/`R5-2`, only `R5-2` has a commit inside the range; `R5-1`'s `2df9ece8` precedes `c7df99c2`, so the brief's framing as a "tail" is correct.

## Files opened

In full: the brief; `RESUME-PROTOCOL.md`; `payoffCelebration.ts` and `payoffCelebration.test.ts`; `trustSelectors.ts`; `balanceSelectors.ts`; `expenseReserveSelectors.ts`; `SaveForItSheet.tsx`; `CushionFloorSheet.tsx`; `computeState.ts`.

Full range diffs: `selectors.ts`, `guardianSelectors.ts`, `buildGuardianBrief.ts`, `journeySelectors.ts`, `logPaymentCopy.ts`, `paywallLead.ts`, `dataRepairsCopy.ts`.

Partial: `selectors.ts:90-277`; `buildGuardianBrief.ts:180-470`; `guardianSelectors.ts` (`:40-60`, `:160-185`, `:840-905`); `planSelectors.ts:425-480`; `celebrationSelectors.ts:40-130`; `store.ts` (`:40-110`, `:390-425`, `:628-640`, `:835-870`, `:935-975`, `:1047-1060`); `projectCurrentBalance.ts:100-130`; `guardianPrediction.ts:30-55`; `calibrationScore.ts:85-110`; `trustSelectors.test.ts` (`:1-80`, `:660-700`, `:780-900`); `check-trust-claims.ts:700-740`; `prove-guards.ts:1-60`; `money.tsx:228-300` (plus greps); `runAppTests.ts:1-80`.

Grep-level only: `requiredPlanTrust.test.ts`, `affordability.test.ts`, `expenseReserve.test.ts`, `dataRepairsCopy.test.ts`, `journeySelectors.test.ts`.

## Measured non-defects (with control)

- **Class 4's tail, `R5-1` (`2df9ece8`), is closed.** `payoffCelebration.ts:120` keys the exclusion on the schedule (`recurrence === 'one-time'`). Clean control of `payoffCelebration.test.ts`: exit 0. Three plants, each restored byte-identical and each red at the row that names the defect:
  - (a) back to the label, `type === 'bnpl' && recurrence === 'one-time'` → red *"R3-4 · debt · one-time … (got 50, expected 0)"*, which is `R5-1`;
  - (b) never exclude → red at *"debt · one-time (got 50)"*, first in loop order;
  - (c) keep the exclusion for `debt` only → red *"bnpl · one-time (got 600, expected 0)"*, which is `R4-1`, so the second row is not vacuous.
  - The population is derived: `Record<Recurrence, number>` × 2 types = 14 rows. No other producer of `freed` exists: `index.tsx:591` and `ShareCard.tsx:58` read `celebration.freed`. *(Probes `plant.py`, `run-test.ts`, `plants/r51*`.)*
- **`B1-1`, the save-for-it pace, is kept.** `p5-saveforit-pace-sweep.ts`: 128 shapes (tier × reserve held × existing priority goal × variable income × quarterly crunch × amount × income), 240 prioritized options, each stored as a goal with its printed pace and re-allocated on the same projected store Today uses. **0 funded below the printed pace**, and no existing priority goal lost funding. The sheet, options and custom caption all read one producer (`SaveForItSheet.tsx:62-64`).
- **`B1-2`, the reserve offer, holds.** `p6-reserve-offer-held.ts`: 72 offers (tier × paycheck 550/900/2000 × already reserved 0/50/100 × pot 0/300 × crunch). Each committed through the real `setExpenseReserveContribution(alreadyReserved + offer)` (`SpokenForSheet.tsx:115`). **The engine held the promised total in 72 of 72**, and `potAfter === selectExpenseReserveNow` in every row. The `Number.MAX_SAFE_INTEGER` probe contribution did not disturb the prefunded rung, which sits after the reserve.
- **The retired `.5.3` predicate is gone from code.** `mayStateProjectedFigure` has 0 hits in `apps`, `packages` and `scripts`. The only near-miss is the local `mayStateProjected` in `money.tsx:441` / `progress.tsx:341`, which asks `mayClaim(store, 'projected-balance')`. It survives in `docs/` only as history.
- **The claim-asker population is floored from code, not typed.** `lint:trust-claims` at the pin is green: `required-plan→1 · projected-balance→2 · solved-projection→4 · paycheck-plan→7` production files. My grep found 8 / 5 files; the extras (`PaydayGuardianCard.tsx:148`, `PlanHero.tsx:163`) are a docblock and a comment. The declared floors are literals checked with `actual !== declared`, a two-sided ledger. `trustSelectors.test.ts`'s `SURFACES` (`:823`) IS a typed list, and the floor is what catches a new asker.
- **The `partitionDebts` total is undisturbed by the projection record.** `p2`, premium, X projected to $0: `live 2 · cleared 0 · unread 0 · total 2`, and `liveDebts` equals `partition.live`. The if/else makes the total hold by construction. At `c7df99c2` the same store read `live 1 · cleared 1`, the `C3-13` defect itself.
- **No second producer of projected balances.** `projectDebtsToDate` has one app caller (`balanceSelectors.ts:22`); every projected store in `apps/rn/src` comes from `withProjectedBalances`. Debt spreads in app source (`store.ts:304,568,588,727,812`, `payday.ts:139`, `sandboxScenarios.ts:326`, `ImportDebtsSheet.tsx:81`) all copy RAW debts on the write side, so none drops a record.
- **The `test:regression` red was my harness, not the suite.** The first control through `plant.py` ran `npm.cmd run test:regression` as a subprocess and exited 1 in 3 s with no output. The same script run directly in bash at the worktree root was green (`✅ All regression tests passed.`). The plant verdict from that run was therefore **discarded, not counted**. `plant.py` was switched to the script's own argv and the control and plant re-run in job 3. **Both were void a second time**: the driver still hard-coded `apps/rn` as the subprocess directory, so tsx looked for `apps/rn/packages/core/testing/runRegressionTests` (`ERR_MODULE_NOT_FOUND`). The control was red again, so the plant's red counts for nothing. `plant.py` now passes the computed `cwd`; the re-run follows `prove:guards` in the same worktree.
- **None of the proofs I re-executed names a forbidden command.** Of the 24, none is `run: typecheck` (RESUME-PROTOCOL rule 11). The one Playwright proof pinned in my files (`S1P3-C1-ROWFIGURES`) was left to L3 and not run.
- **`prove:guards` does exit non-zero on the `:4319` refusal. The `exit=0` I saw was my own script.** In job 3 the proof run faulted at `S1P3-G1-CALIBRATION` (*"something is already listening on :4319"*, which was L3 working; not touched) and the log read `PROVE exit=0`. `prove-guards.ts:166` `fault()` calls `process.exit(1)`. My `job-3.sh` printed `$?` on a line that ran `$(date +%T)` first, and the command substitution reset `$?` to `0`. **Not a defect in the harness**; recorded because it read like one. Job 4 captures `rc=$?` on the next statement.
- **Attribution worktree torn down.** `audit-c5r1-L1-base` (`c7df99c2`) was used for p1, p2, p3 and p7. All three junctions were removed with `rmdir` and verified gone before `git worktree remove`, and the main checkout's `node_modules` and `packages/core` were confirmed intact afterwards. The primary `audit-c5r1-L1` is left in place for the driver.
- **Literal `200` sweep.** No cushion-line fallback remains outside the owner, apart from these deliberate ones: `computeState.ts:32,44` (see `L1-3`), `calibrationScore.ts:96` (legacy predictions), `store.ts:851` (NaN input to the setter), `CushionFloorSheet.tsx:42` (initial slider value on a non-finite prop) and `defaults.ts:53`.
