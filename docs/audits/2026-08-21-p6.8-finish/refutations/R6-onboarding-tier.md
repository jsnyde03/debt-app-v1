# R6 — REFUTATION: ONBOARDING, INPUT VALIDATION & PREMIUM TIER

> **Refuter R6**, P6.8 audit. Repo `debt-app-v1`, branch `v1.7-dev`, working tree at `ae80a88`
> (the slices were written against `dd80f70` — every line citation below was re-verified against the
> tree as it stands *now*, and the drift is called out where it exists).
>
> Brief: **refute, do not confirm.** Default to REFUTED when uncertain. Attack the **mechanism** first,
> because 2 of 3 declared blockers did not survive the last pass and three consecutive audits found
> observations holding while explanations failed.
>
> Six findings under attack: **O1-9** · **P1-10** · **P1-12** · **P1-9** · **V3-1** · **V3-5/V3-6**.
> Written incrementally. Nothing fixed.

---

### R6-O1-9
**Verdict:** **CONFIRMED — mechanism exact, one stated consequence REFUTED, and the scope is 3× wider than reported**

**How I tried to break it.** Five attacks, ordered by how much each would have cost the finding:
1. **Run the expressions** rather than trust the prose.
2. **Trace to persistence** — find a store action, a normalizer or `runMigrations` that rejects the value before it lands.
3. **Check the keyboard** — if iOS `decimal-pad` refuses a second separator, the blocker downgrades to a paste-only edge case.
4. **Check the input component** — a sanitizing `onChangeText` in `TextField` would kill it at the source.
5. **Check the claimed downstream consequence** — the audit says the user's *second launch* opens with a data-repair notice. That is the most falsifiable sentence in the finding.

**What I found.**

*(1) The arithmetic is exactly as claimed.* Run, not reasoned:

```
Number("1.2.3")         => NaN     NaN <= 0 => false     !"1.2.3" => false
Number("1,200")         => NaN     NaN <= 0 => false
Number("-") / Number(".") / Number("1 2")   => NaN, all pass
Number("x") || 0        => 0
JSON.stringify({b:NaN}) => {"b":null}
```

*(2) The guards are verbatim what the slice quotes, at the exact lines it cites.*
`apps/rn/src/components/onboarding/PaycheckStep.tsx:39` — `if (!amount || Number(amount) <= 0)`.
`apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:44` (balance), `:48` (minimum), `:52` (expense amount).
The write is unguarded: `FirstDebtOrBillStep.tsx:62-64` passes `balance: Number(balance)`, `minimumPayment: Number(minimumPayment)`, `apr: Number(apr) || 0`. `PaycheckStep.tsx:59-68` passes `amount` as the **raw string**.

*(3) No layer catches it.* Traced all the way to disk:
- `apps/rn/src/components/ui/TextField.tsx:64` passes `onChangeText` straight through — **zero input sanitization**, no numeric filter, no `maxLength` on these fields.
- `apps/rn/src/store/store.ts:309-329` `addDebt` — no numeric validation. Worse, `:314` seeds `originalBalance: debt.originalBalance ?? debt.balance`, so a NaN balance **propagates into a second field**.
- `apps/rn/src/store/store.ts:301-304` `updatePaycheck` — spread merge, no validation.
- `apps/rn/src/store/store.ts:383` `addExpense` — no validation.
- `runMigrations` does not run on write. It runs on the *next read*, which is a different launch — see (5).

*(4) The keyboard does not save it.* `keyboardType="decimal-pad"` maps to `UIKeyboardTypeDecimalPad`, a plain key layout: UIKit emits the separator character every time the key is pressed and does not disable it after the first press. Validation is the app's job and the app does none, so `1.2.3` is four taps. ⚠️ **And the likelier input is not `1.2.3` at all — it is `1,200`.** `Number("1,200")` is `NaN` and passes the identical guard; a comma reaches the field by paste, by a non-US locale separator, and by autofill. The audit picked the exotic example and understated its own reachability.

*(5) ⛔ **The stated consequence is WRONG — and wrong in the direction that makes the finding worse.***
The slice says: *"On the next launch `repairMoneyFields` rewrites the nulls to 0 and raises a data-repair notice — so a brand-new user's second launch opens with 'we had to repair your data.'"*

Half of that is right. `apps/rn/src/data/migrations.ts:140-154` does repair `balance` / `minimumPayment` / `apr` / `originalBalance` to `0` via `readMoney` (`:44-54`) and pushes a `DataRepair` row into `store.dataRepairs` (`:177`).

**There is no notice.** A repo-wide grep for `dataRepairs` outside tests returns **eight hits, none of them UI**:

```
apps/rn/src/data/defaults.ts:43                                   (initialiser)
apps/rn/src/data/migrations.ts:177                                (writer)
apps/rn/src/data/models.ts:229                                    (the type)
apps/rn/src/data/migrationAudit/invariants.ts:131,134,143,161,163 (a test oracle)
```

No component, no hook, no selector reads it. **The field is written and never displayed.** So the real behaviour is the *opposite* of the slice's: the user's $12,000 debt silently becomes **$0**, with no notice, on screens that will render it as paid off. `migrations.ts:36-42`'s own docstring rules that outcome out in writing — *"coerce silently (a $12,000 debt renders as PAID OFF — wrong and invisible, **the worst of the three**)… only the last one lets the person find out"* — and the app ships the option its own comment calls the worst, because the surfacing half was never built. **That is a second, independent finding sitting inside this one, and no slice has it.**

*(6) The scope is 3× what the slice reports.* The slice names 2 files / 4 guard sites. The class is **7 files / 12 sites**:

```
components/onboarding/PaycheckStep.tsx:39, :55
components/onboarding/FirstDebtOrBillStep.tsx:44, :48, :52
components/entities/DebtSheet.tsx:187, :188          <- the EDIT path
components/entities/ExpenseSheet.tsx:53, :56
components/entities/GoalSheet.tsx:34
components/entities/LivingExpenseSheet.tsx:33
components/plan/PaycheckSheet.tsx:50, :61
```

⚠️ **This contradicts O1-10's premise** *(not my finding to rule on, but it is load-bearing here)*: O1-10 says the onboarding form is *"validated more loosely than every subsequent debt."* On the NaN hole it is not — `DebtSheet.tsx:187-188` carries the **identical** defect, and its extra check `Number(minimumPayment) > Number(balance)` (`:189`) is *also* `false` for NaN, so the stricter path is not stricter here either. The hole is app-wide, not an onboarding regression.

⭐ **The correct pattern already exists in this codebase, sixty lines from a broken one.** `components/plan/WindfallSheet.tsx:50` — `const validAmount = !!amount.trim() && Number.isFinite(n) && n > 0;`. Same sheet family, same `decimal-pad`. The engine boundary guards it too: `store/selectors.ts:44-45` — `if (!Number.isFinite(amount) || amount <= 0 …) return null`. **The fix is a known in-repo idiom that was never swept across the forms.**

*(7) ⛔ The repo has known about this since v1.6, in writing.* `migrations.ts:33-38`:
> *"Measured: v1.6's onboarding guards new debts with `Number(balance) <= 0`, and **`NaN <= 0` is false**, so `Number("12,000")` — a comma, on the first debt a user ever types — passes and persists… v1.6's *edit* path documents fixing exactly this and **the fix never reached onboarding**."*

So the defect was diagnosed, a **read-side** mitigation was built for it, and the **write-side** guard was left in place in v1.7 — in onboarding *and*, contra that comment's own claim, in the edit path too. This is not a new discovery; it is a **shipped, documented, unclosed** one.

**Reachable by a real user?** Yes — first two screens, free tier, no prerequisites:
`/onboarding` → Get started → paycheck field → type or paste `1,200` → **Continue advances** → debt name + balance `12,000` + minimum `250` → **Add & Continue advances** → Completion. Persisted state (read back off the shipped build by the O1 author; re-derived from source by me): `paycheck.amount: "1,200"` (a string, and **never repaired** — `migrations.ts:135-137` only coerces *non*-strings), `balance: null`, `minimumPayment: null`, `originalBalance: null`.

Two in-product consequences follow, and only the first is in the slice:
- **In session:** `selectors.ts:45` returns `null` for a non-finite income, so the entire allocation is null and the app behaves as though the user has **no income at all** — after accepting their entry without complaint. That is why Completion said *"Add a debt any time and you'll get a debt-free date too"* to someone who had just added one.
- **Next launch:** balances repair to `$0` **silently**. A debt named "Visa Card", at $0.

**Residual doubt.** Three, all narrow.
(a) I did not re-drive the shipped build; I verified the guards, the write path, the store actions, the migration, and the *absence of a `dataRepairs` consumer*, from source. My trace agrees with the O1 author's driven repro on every point except the notice — the one claim that needs a *consumer* rather than a *writer*, and exactly the kind an end-to-end repro can appear to confirm if the observer stopped at "the data was repaired."
(b) I have not confirmed on device that a $0-balance debt cannot trip the once-ever `PaidOffFinale` on that second launch. If it can, the cost is materially higher than "a wrong number." **Device-owed; worth one check at P6.14.**
(c) `decimal-pad` behaviour is asserted from the UIKit contract, not observed on hardware. Moot either way — the comma/paste path needs no keyboard argument.

**Severity: blocker stands**, but the framing should change. It is not *"onboarding has a validation bug."* It is *"the app has one money-input idiom, it is wrong at 12 sites including the edit path, and the read-side mitigation built to catch it was never wired to a surface."*

---

### R6-P1-10
**Verdict:** **CONFIRMED**

**How I tried to break it.** The brief asks for a gate elsewhere — in the action, the selector's caller, or the UI that offers the control. I checked all three, plus a fourth line of defence: the "pass by attachment" argument the slice's own table uses to save rows 11–13.

**What I found.** Every site, and there is no gate at any of them:
- **The selector:** `apps/rn/src/store/selectors.ts:54` — `paycheckAmount: income + (store.windfall ?? 0)`, inside `buildAllocation`. Cited exactly. ⚡ `isPremium` is computed **three lines above it** (`:51`) and *is* applied to the holdback fractions (`:69-77`) — so the tier flag is in scope and deliberately not applied to the windfall. This is not an availability oversight.
- **The action:** `store/store.ts:555-558` `setWindfall` — `Math.max(0, amount)`. No tier check.
- **The control:** `components/plan/PlanHero.tsx:225-235` renders the "Add extra income" row whenever `onAddWindfall` is passed, and `app/(tabs)/index.tsx:314-315` passes it **unconditionally**. No `isPremium`.
- **The sheet:** `WindfallSheet.tsx:62-67` — `submit()` calls `setWindfall(n)` for both tiers, before any tier branch.
- **What `isPremium` actually gates:** `split` (`:55-58`), the itemized `View` (`:98-114`), and the submit label `'Confirm'` vs `'Add'` (`:81`). That is the whole of it.

`selectWindfallSplit` (`store/guardianSelectors.ts:471-472`) is `selectAllocation({...store, windfall: amount})` minus `selectAllocation({...store, windfall: 0})` — **it computes nothing the free user's plan has not already computed.** Removing it removes a readout and a verb on a button.

The **attachment defence fails here specifically**, and that is the discriminating test. Rows 11–13 pass by attachment because they *narrate a hold premium is actually performing*; a free user has no such hold to narrate. The windfall split narrates an allocation **free already receives**. There is nothing behind it to attach to.

⚠️ **Citation correction:** the invite copy is at **`WindfallSheet.tsx:118`**, not `:115` (`:115` is the branch condition `!isPremium && validAmount`). The quote is verbatim.

**Reachable by a real user?** Yes — free tier, two taps from cold: Today → the "Add extra income" row under the hero (`PlanHero.tsx:225`) → type an amount → **Add**. The plan re-solves with the windfall included. The premium invite is what the free user sees *in place of* the routing rows.

**Residual doubt.** None on the facts — both halves are quotable and there is no gate on any of the four paths. The residual is entirely **whether the price test is the right lens**, which is 🎯's call. The counter-argument available: `§5.3 "free tells you; premium does it"` could be read as permitting a *presentation* gate on a shared engine output. That reading exists — but the slice's own precedent kills it, because `§2.10 R1` applied the price test to the structurally identical smallest-move readout and forced it rebuilt as an action. Applying the rule to one readout and not its twin is the inconsistency, whichever way 🎯 resolves it.

---

### R6-P1-12
**Verdict:** ⛔ **DOWNGRADED — the facts hold, the mechanism does not. A decision DOES exist, it was made AT the gate the spec named, and it was made BEFORE the SKU.**

**How I tried to break it.** The finding's load-bearing sentence is *"a spec decision recorded as a prerequisite was not met and **nothing records it being reversed**."* Two independent things have to be true for that. I attacked the second, because absence-of-a-record is the claim a grep for the *feature name* cannot establish — you have to search for the **decision**, not the word.

**What I found.**

*(1) The facts are exactly right.* `grep -niE "guarantee|money.back|refund"` across `apps/rn/src` returns **no user-facing hit**. Every match is an engineering comment (`_layout.tsx:77`, `models.ts:81`, `demoRun.ts:63`) or the *user's own* windfall copy (`WindfallSheet.tsx:31,80` — *"a bonus, refund, or side gig"*). `premium/purchases.ts:19` defines `LIFETIME_PRODUCT_ID`; `app/paywall.tsx:75` carries **Lifetime $79.99**. Nothing on the paywall says *"cancel free in month one"* or *"not charged until day 30"* either. All confirmed.

*(2) ⛔ **But the decision exists, and the slice did not find it.*** `docs/DEBT_ELEVATION_LOG.md:5215`, under **"2.11 Revenue spine — COMPLETE (2026-07-27)"**:

> **2.11.1 [DECISION] ✅** — prices locked: Monthly $4.99 · Annual $29.99 · Lifetime $79.99 (new); **Lifetime = on-device Premium forever, EXCLUDES Connected + Ava**; **no free trial (the generous free tier is the proof window;** a holiday promo trial is a reversible later add on the existing monthly); privacy claim "100% on-device". … **Jason completed the ASC + RevenueCat setup** (products `paycheck_debt_planner_premium_{annual,lifetime}` + offering + `premium` entitlement).

Set that against the gate the spec actually wrote (`DEBT_ELEVATION_LOG.md:5134`) — three items, not one:
> *"**2.10 gate (at the paywall)** — guarantee window/terms · pin annual + Lifetime prices · Lifetime-scope **[DECISION] BEFORE any StoreKit SKU is created**."*

Scored honestly, **the gate was run and 2 of its 3 items are explicitly closed** — prices pinned, and the Lifetime-vs-portfolio cannibalization item resolved *exactly* as `§215` prescribed ("Debt-only Lifetime scope"). The third is not left silent either: **the proof-window role is reassigned in the same sentence — "the generous free tier is the proof window."** That is the same job the guarantee was hired for (giving the annual/Lifetime buyer something real behind a throttled month one), given to a different mechanism, by 🎯, at the named gate.

*(3) The sequencing instruction was honoured, not passed.* The slice reads *"BEFORE any Lifetime SKU is created"* as violated. The record has the [DECISION] and the ASC/RevenueCat setup in the **same** entry, decision first. The prices being *"none specified yet"* in the spec and `$29.99 / $79.99` in the log is itself proof the gate ran — those numbers did not exist before it.

*(4) The shipped state is the SAFE branch of this repo's own warning.* `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md:57,66`: *"2.10's money-back guarantee may **not be StoreKit-implementable** — Apple owns refunds; verify before marketing it… **Selling a guarantee you can't honor is the exact trust-inversion the moat is built against.**"* And the conditional in 🎯's own round-6 call (`LOG:5150`): *"VERIFY it's honorable through StoreKit; if it isn't (Apple mediates refunds), **default to the 'annual not charged until day 30' framing** … never a refund promise we can't mechanically keep."* **Shipping no guarantee is the compliant outcome of that instruction.** Shipping the words without the mechanism would have been the defect.

*(5) The record also shows the guarantee was churning, not locked.* `DEBT_PREMIUM_ELEVATION_AUDIT_ROUND6_2026-07-23.md:49` — *"(The alternative, revisiting toward a proof-window guarantee, is **the option already weighed and set aside**.)"* — then spec v6 *"reopened from v5"*. A commitment that was set aside, reopened, then superseded at the gate is not a lock that was passed.

**Reachable by a real user?** The *SKU* is: More → "Unlock Premium" → `/paywall` → Lifetime $79.99, free tier, any time. The *missing guarantee* is by definition not reachable — it is an absence. ⚠️ Note `paywall.tsx:69-77`: `$79.99` is the **static web/dev fallback**; on a real device the string comes from RevenueCat, and if packages fail to load the screen errors rather than showing it (`:71-72`). So "$79.99 ships" is true of the decision, not of a hardcoded price a device user can be charged.

**Residual doubt — and it is why this is downgraded rather than refuted.** One thing genuinely survives, and it is small and worth exactly one look from 🎯:
**"The free tier is the proof window" does not cover the Lifetime buyer.** The free tier is what they are paying to leave; it proves the free product, not the Guardian they bought. And 🎯's own fallback framing — *"annual not charged until day 30 — cancel free in month one"* — **cannot apply to a one-time non-consumable**, so the single segment the guarantee was designed for (the $79.99 buyer converting during a deliberately-throttled month one, `§2.0` 40% discovery holdback for N=3 cycles) is the one segment neither branch of the decision reaches. That is a **commercial judgment, not a defect**, and it is 🎯's alone.

**Re-severitised:** major · `[STRUCTURAL]` → **minor · documentation reconciliation**, plus one optional commercial look. The spec (`DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md:171,215`) still reads as though the guarantee is live; the log says it was superseded. **The only work is one line in the spec**, so the next reader is not told something untrue — which is, ironically, exactly the fix P1-9 asks for on the other side of the same slice.

---

### R6-P1-9
**Verdict:** ⛔ **MECHANISM WRONG, OBSERVATION HOLDS — the rule was never reversed, because the code never obeyed it. The spec was written 18 days AFTER the app shipped confetti.**

**How I tried to break it.** The brief said a decision may exist and to look before accepting. I searched four ways: every `confetti` hit in `DEBT_ELEVATION_LOG.md`; every `confetti` hit across `docs/`; `MASTER_PLAN.md` + `MASTER_PLAN_LOG.md`; and the `never confetti` / `not confetti` / `no confetti` string class. Then, having found no decision, I attacked the finding's *other* two claims: the document count, and the word "reversed."

**What I found.**

*(1) No reversing decision exists.* Confirmed. `DEBT_ELEVATION_LOG.md` has exactly **three** confetti lines and every one is a build record, not a decision:
- `:4748` — 3.3.1.3 finale shipped *"Reanimated gold confetti burst"*, no mention of the rule;
- `:4347` — Wave 9 B6 *"deepen the finale confetti — 64 pieces, wider spread"*;
- `:4348` — a capture-evidence note.

`MASTER_PLAN.md` and `MASTER_PLAN_LOG.md`: **zero** confetti hits. The deepening traces to an **agent audit recommendation** (`DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/02-bestinclass-coherence.md` §B6 — *"Confetti coverage is still a band, not a spectacle… a craft call, not a defect"*) that never cites the rule it was contradicting. Per this repo's own standard, an accepted agent rec is not a 🎯 decision. **On its central claim the finding survives.**

*(2) ⛔ But "a locked rule was REVERSED in code" is false — and the dates prove it.*
`docs/V15_TRACK_YOUR_JOURNEY.md:83`, the **v1.5 Capacitor** release, *"Feature-locked **2026-07-02**"*:
> *"New `components/MilestoneBadge.tsx` … **paid-off** (100% — 🏆, medium haptic, **confetti**), **debt-free** (all paid — 🎉, medium haptic, **heavier confetti**)."*

`docs/DEBT_MOTION_SPEC_2026-07-20.md` — the document carrying *"**Never confetti.**"* — was **first committed 2026-07-20** (`4a6c4bc`), **eighteen days later**. Confetti at the paid-off and debt-free moments was **already shipped product** when the rule was written.

So nothing was reversed. **The spec proposed removing an existing behaviour, the removal was never scheduled, and the RN port carried the behaviour across.** That is a different defect with a different fix: the finding says *"either ratify the reversal in the spec, or cut it"* — but there is no reversal to ratify, only a proposal that was never executed and never withdrawn. ⚡ This is the third consecutive audit where **the observation held and the explanation failed**, and it failed the same way: the finding read a doc/code divergence as an *event* (someone changed something) when it was a *non-event* (nobody ever did the thing).

*(3) "Four project documents" is three, and the benchmark under them permits it.* Verified one by one:

| document | line | says |
|---|---|---|
| `DEBT_MOTION_SPEC_2026-07-20` | `:80` | *"**Never confetti.**"* — unambiguous, and it is §5 Tier 3, the finale itself ✅ |
| `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20` | `:33` | *"Composed screen, **never confetti**"* ✅ |
| `DEBT_MOTION_TOOLING_2026-07-20` | `:95` | *"(explicitly not confetti)"* ✅ |
| `DEBT_PREMIUM_STRATEGY_2026-07-21` | `:99` | ⚠️ *"**Drop 'confetti'** — contradicts the locked Skia-spectacle celebration"* — but read in place this is the **Motivation pillar's feature list**, i.e. *don't sell confetti as a premium feature*. It is about the **premium line**, not the motion register. Weakest of the four, and it is doing different work. |

⚡ And the benchmark all three specs derive from **explicitly permits it**. `DEBT_BENCH_VISUAL_MOTION_2026-07-20:62` — *"if confetti appears, it's **layered on genuine progress and used rarely**"*; `:96` — *"use particles (**if at all**) sparingly and **only atop the real win**"*; `:63` bans it only *"on routine actions."* The shipped finale is **once, ever, atop the real win, on the last debt reaching $0.** ⭐ **It satisfies the benchmark on every clause.** The three specs tightened a conditional permission into an absolute and did not carry the reasoning; the finding then counted the tightened copies as four independent votes.

**Reachable by a real user?** Yes, but at most **once in the lifetime of an install**: `PaidOffFinale` fires when the last debt is confirmed to $0. `PaidOffFinale.tsx:44` — `const CONFETTI = 64;` — confirmed verbatim in the current tree, with `GOLDS` at `:45` and the header comment at `:28` (*"a deepened two-wave gold confetti layer that keeps emerging so it BREATHES ~4.7s"*), all exactly as cited. ⚠️ It is also the **least-observed** surface in the audit: `P1-1` establishes the matrix has **no frame of the finale at all**, so every judgment here — the slice's and mine — is from source.

**Residual doubt.** Two.
(a) I searched the repo. A verbal 🎯 call that never reached a file would not be in it — but by this project's own convention an unrecorded decision is not a decision, so that cuts the finding's way.
(b) One live tension I could not settle from documents: `DEBT_3.5_DEVICE_QA_CHECKLIST.md:45` lists *"no jank/stutter **on the confetti**"* as a **pass criterion** for §B3.1. A shipping QA gate that requires confetti to be present is *de facto* ratification — the app has an acceptance test asserting the thing four specs forbid. That is either the strongest evidence the reversal was real and merely undocumented, or the clearest illustration of how far the divergence has propagated. **Either way it is one more artifact to reconcile, not a decision.**

**Re-severitised:** minor (unchanged) — but the recommendation changes. **Cutting it is now the wrong option to offer.** The behaviour predates the rule, satisfies the benchmark the rule was derived from, has a device-QA gate asserting it, and 🎯 has never been asked. **The single correct action is to fix the three specs to match the benchmark they came from** (*"particles only atop the real win, once, ever"*), which costs three edits and no code — and to note that the deepening from 44→64 pieces still has no owner but an agent.

---

### R6-V3-1
**Verdict:** **CONFIRMED — all six sites verified, the reachability attack FAILS (all six ship free), and the `PlanHero` comment is false as charged**

**How I tried to break it.** The brief names the sharpest attack: *"are those six sites reachable by a **free** user, on a surface that ships? A clamp missing on a premium-only sheet is a smaller finding."* I ran that on all six, plus three others: (a) re-verify the line numbers against the current tree, (b) check whether `CountUp` — which one of the six goes through — supplies a default clamp its callers inherit, (c) re-run V3's own "ground truth" count, because if *that* is wrong every downstream enumeration is.

**What I found.**

*(1) All six sites verified, at the exact cited lines, with the exact cited sizes:*

| site | style | size | clamp | reachable by free? |
|---|---|---|---|---|
| `app/history.tsx:43` | `anchorNum` (`:102`) | 30 | **none** | ✅ More → "Pay cycle history" (`more.tsx:171`). `history.tsx:28`: *"**Ships unlocked**; the premium lock + Premium+ full-history upsell…"* |
| `components/entities/AmortizationView.tsx:69` | `echoNum` (`:150`) | 32 | **none** | ✅ pushed route `/schedule/[id]` (`app/schedule/[id].tsx:33`) — **zero** `premium` references in the file |
| `components/money/BillBreakdownSheet.tsx:55` | `echoNum` (`:126`) | 32 | **none** | ✅ `money.tsx:789` — rendered **unconditionally**, no tier branch |
| `components/payday/PaydayCaptureSheet.tsx:482` | `capturedAmount` (`:519`) | 30 | **none** | ✅ `index.tsx:630` — gated on `allocation && summary`, **not on tier** |
| `components/payoff/WhatIfControls.tsx:68` + `:78` | `readout` (`:115`) | 34 | **none** | ✅ its own header, `:34`: *"**A free tool** (the pull readout); the premium Guardian is the proactive push layer."* |
| `components/plan/SpokenForSheet.tsx:59` | `echoNum` (`:161`) | 32 | **none** | ✅ `index.tsx:659`, opened from the Today hero — **zero** `premium` references in the file |

⛔ **The reachability attack fails completely. Six for six are free-tier, and four of them are one tap off a primary tab.** The downgrade the brief offered is not available.

*(2) The `CountUp` escape hatch does not exist.* `PaydayCaptureSheet.tsx:482` is a `<CountUp>`, not a `<Text>` — the one site where an inherited default could have saved it. `motion/CountUp.tsx:48` is `return <Text {...text}>{display}</Text>` with **no** `maxFontSizeMultiplier` of its own. It forwards what it is given and is given nothing. (For contrast, three of the *clamped* sites — `progress.tsx:171`, `PaidOffFinale.tsx:158`, `PlanHero.tsx:149-155` — are also `CountUp`s and each passes the prop explicitly. The mechanism is per-call-site, and this call site skipped it.)

*(3) V3's ground truth re-counted and it is exact.* `maxFontSizeMultiplier` = **17 occurrences across 6 files** — `money.tsx:997` ×1 · `progress.tsx:102,171,177` ×3 · `CushionFloorSheet.tsx:70` ×1 · `PaidOffBeat.tsx:116,117,123,127,131` ×5 · `PaidOffFinale.tsx:112,113,117,156,158,160` ×6 · `PlanHero.tsx:154` ×1. `allowFontScaling` = **11, all in `ShareCard.tsx`**. Both figures match the slice to the occurrence. ⚠️ *(My own first pass returned 16/5 files and dropped `CushionFloorSheet` — a truncated-grep artifact of my own, corrected on a second exhaustive run. Recording it because the memory rule about truncated searches hiding a class applies to refuters too, and a sloppier pass would have "refuted" an exact count.)*

*(4) The `PlanHero.tsx:154` comment is false, verbatim as charged.* Read in place (`:151-155`):
> *"T3B (audit L5-7) — **the three tab heroes were the ONLY large figures with no font-scale cap**, while 13 other large-number sites already carry one. At AX5 a 40pt figure scales unbounded."*

Against this tree there are six ≥30pt figures with no cap, none of which is a tab hero. ⚡ **And the shape of the error is the interesting part:** the count was taken by enumerating *heroes*, then written up as a claim about *large figures*. It is `audit_site_lists_undercount` in its native habitat — an enumeration budgeted against the wrong class, then recorded as a completed sweep. The comment is now the reason a future reader will not re-run the sweep.

**Reachable by a real user?** Yes — six of six, free tier. The *consequence* (what an AX5 user actually sees) is Pass-B/P6.14 territory and V3 correctly says so; the **absence** is Pass A and is exact.

**Residual doubt.** One, and V3 already owns it: an *absent clamp* is not by itself a broken layout. RN scales `fontSize` and `lineHeight` together (V3-R1, verified in `RCTAttributedTextUtils.mm` — do not reopen), so a 32pt figure at AX5 becomes ~99pt and **reflows** rather than clipping; whether it then collides or pushes its neighbour off-screen depends on each container, which no static read settles. So the honest severity is *"six unbounded large figures on free surfaces, consequence unmeasured"* — which is major on absence, and a P6.14 row for effect. **I would not downgrade it on that basis**, because the fix (one prop, six sites) is cheaper than the measurement.

---

### R6-V3-5 / R6-V3-6
**Verdict:** **CONFIRMED — the arithmetic is literal. One scope correction (one of the six sites is premium-only) and one correction that makes V3-6 WORSE than filed.**

**How I tried to break it.** Four attacks: (a) verify every constant against the current tree; (b) check whether the labels sit inside a clamped `<Text>` parent — `maxFontSizeMultiplier` **inherits** down nested `Text` (V3-R1), so a clamped ancestor would silently fix all of them; (c) check whether `numberOfLines` bounds the damage as V3-6 claims; (d) check tier reachability, same as V3-1.

**What I found.**

*(a) Every constant is literal and at the cited line.*
- `TrajectoryChart.tsx:263` — `const endPillW = 20 + (debtFreeDate ? shortDate(debtFreeDate).length : 8) * 6.5;` ✅ verbatim.
- `:375` — `left: clamp(endpoint.x - endPillW / 2, PAD.l, w - PAD.r - endPillW)` ✅ both uses in one expression, as cited.
- `:519` — `endPillText: { fontSize: 11, … }`, no clamp ✅.
- `:21` `const H = 200`; `:23` `PAD = { l: 38, r: 14, t: 16, b: 26 }` ✅.
- Styles: `:492` `yLabel {position:'absolute', width: PAD.l - 6 /* 32 */, fontSize:10}` · `:493` `xLabel {width:40, fontSize:10}` · `:517` `waypointLabel {width:80, fontSize:9}` · `:530` `scrubReadoutText {fontSize:11}` · `CashRunwayChart.tsx:236` `xLabel {width:48, fontSize:10}` ✅ all five.
- Offsets: `:332` `top: mapY(v) - 7` · `:340` `left: mapX(t.m) - 20` · `:360` `left: wp.x - 40, top: wp.y - 22` · `:375` `top: baselineY - 30` · `CashRunwayChart.tsx:172` `left: mapX(i) - 24` ✅ all constants, none derived from a measured text width.

**V3-5's core claim needs no measurement to stand:** `6.5` is a per-character constant, the text it estimates has no clamp, and the same number is the right-edge clamp bound. At any scale > 1 the pill is wider than the value used to keep it on screen. That is arithmetic, and it is right.

*(b) The inheritance escape does not apply.* All five labels are direct children of `View`s (the plot wrapper), not of a `Text`. `maxFontSizeMultiplier` inherits only through nested `Text`. No ancestor clamp exists on either chart. Attack fails.

*(c) ⛔ **V3-6 UNDERSTATES its own finding — and this is the one thing in it I would change.*** It says *"three carry `numberOfLines={1}`, which converts overlap into truncation."* Measured at the JSX, not the stylesheet:

```
TrajectoryChart.tsx:332  yLabel          -> NO numberOfLines
TrajectoryChart.tsx:340  xLabel          -> NO numberOfLines
TrajectoryChart.tsx:360  waypointLabel   -> NO numberOfLines
TrajectoryChart.tsx:376  endPillText     -> NO numberOfLines
TrajectoryChart.tsx:394  scrubReadoutText-> numberOfLines={1}   <- 1 of 2
CashRunwayChart.tsx:172  xLabel          -> numberOfLines={1}   <- 2 of 2
```

**Two, not three — and the two that have it are not the axis labels.** The four unbounded ones are precisely the fixed-width boxes: a `width: 40` `<Text>` with no `numberOfLines` does not truncate, it **wraps**, so at AX5 "Sep 4" becomes two stacked lines of ~31pt glyphs inside a 26pt bottom gutter (`PAD.b`) in a hard `H = 200` plot. The degradation is **vertical overflow into the plot**, not the horizontal truncation V3-6 describes. The mechanism is right; the failure mode named is the milder of the two available.

*(d) Tier reachability splits the finding.*
- **`TrajectoryChart` is FREE** — `progress.tsx:203`, on the Progress **tab**, no tier branch on the chart. Four of the five sites (`yLabel`, `xLabel`, `waypointLabel`, `endPillText` — i.e. **all of V3-5 and most of V3-6**) are free-tier and one tab-tap from cold.
- ⚠️ **`CashRunwayChart` is PREMIUM-ONLY** — `app/cushion-forecast.tsx:38` is `{isPremium ? (<><CashRunwayChart …/>…</>) : (…free branch…)}`. So `CashRunwayChart.tsx:236` **is** the smaller finding the brief describes. It is also the *one* of the six that already carries `numberOfLines={1}`, so it is the least damaged site on the least-reached surface. **Drop it from the headline; it does not carry weight.**

**Reachable by a real user?** V3-5: yes — Progress tab, free, whenever a `debtFreeDate` exists (which is the normal state). V3-6: four of five sites yes, same path; the fifth requires premium. ⚠️ Both are **gated behind the user's own iOS Dynamic Type setting**, so the reachable population is "free users at AX sizes," not "all free users."

**Residual doubt.** Two, and the second one matters for triage.
(a) I could not settle whether `Card`'s container clips. If it sets `overflow: hidden`, the over-wide pill is cut rather than escaping the card — still wrong, but contained. Static read only; **P6.14**.
(b) ⚠️ **These two findings may be moot in practice, for a reason no source read can settle.** `P1-3` reports the *same* chart rendering **nine empty years with a stranded date pill and no curve at all** on the default seed, across three independently-captured viewports. If P1-3 is right, then at 1× scale the pill is already mispositioned for a completely different reason — a **domain** bug, not a **font-scale** bug. Fixing V3-5's 6.5pt estimate would not move that pill one point. **These should be triaged together or the cheaper fix will be credited with the wrong outcome** — and if only one gets done before the freeze, P1-3's is the one a user meets at default settings.

---

## Survivors, ranked by cost-to-fix vs harm

Six findings attacked. **Four survive intact, one survives with its explanation replaced, one is downgraded.** Ranked on the ratio that decides at a freeze — *harm per unit of work*, not severity in the abstract.

| # | finding | verdict | harm | cost | do it? |
|---|---|---|---|---|---|
| **1** | **O1-9** — `Number(x) <= 0`, 12 sites | **CONFIRMED**, scope 3× | first-run data loss, silent | **small** | ⭐ **yes — before freeze** |
| **2** | **NEW: `dataRepairs` has no consumer** | *surfaced by this refutation* | turns #1 from loud into silent | **small–medium** | **yes, or #1's fix must be complete** |
| **3** | **V3-1** — six unclamped large figures | **CONFIRMED**, all free-tier | AX users, layout | **trivial** | ⭐ **yes** |
| **4** | **V3-5 / V3-6** — chart label arithmetic | **CONFIRMED**, 1 site premium-only | AX users, one card | **small–medium** | **yes, bundled with P1-3** |
| **5** | **P1-10** — Windfall Autopilot inverted | **CONFIRMED** | the tier's own rule, backwards | **trivial** *(option a)* | ⭐ **yes — delete a gate** |
| **6** | **P1-9** — confetti vs the specs | **MECHANISM WRONG** | future readers only | **trivial** | **yes — edit 3 specs, not the code** |
| **7** | **P1-12** — the missing guarantee | **DOWNGRADED** | one spec paragraph is stale | **trivial** | **yes — 1 line + 1 🎯 look** |

**1 · O1-9 — highest ratio in the slice, and it is not close.**
Harm: a first-run user's debt persists as `null`, silently repairs to **$0** on relaunch, and their income — if it carried a comma — is a string that never repairs at all, leaving `selectors.ts:45` returning `null` forever, i.e. an app that behaves as though they entered nothing. Cost: the correct expression already exists in-repo (`WindfallSheet.tsx:50`); this is a mechanical sweep of 12 call sites plus one shared helper. ⚠️ **Do not fix only the two onboarding sites the slice named** — the edit path (`DebtSheet.tsx:187-188`) has the identical hole, and a partial sweep will read as closed. This is the *second* time this exact fix has been landed in one place and not the others (`migrations.ts:33-38` records the first).

**2 · The silent repair — surfaced here, owned by nobody.**
`migrations.ts` chose "repair and surface" **in writing**, over an option its own comment calls *"the worst of the three."* The repair shipped; the surface did not. It is not, strictly, a separate defect from #1 — it is what makes #1 unrecoverable-by-the-user instead of merely wrong. If #1 is fixed completely at the write layer, new stores stop producing repairs and this drops to a v1.6-restore-only concern. **If #1 is fixed only partially, this must be built.** Sequence them that way.

**3 · V3-1 — the cheapest real fix in the whole audit.**
Six `maxFontSizeMultiplier={1.3}` props, on six lines, matched to a pattern used 17 times already. No design call, no layout change, no new capability. All six are free-tier and four are one tap off a tab. **Delete `PlanHero.tsx:151-153`'s comment in the same edit** — it is now a false claim of completed coverage sitting exactly where the next person would check.

**4 · V3-5 / V3-6 — right, but triage with P1-3 or waste the work.**
Real arithmetic, free-tier, and V3-6's failure mode is worse than filed (wrap-and-overflow, not truncate). But `P1-3` says the same pill is already stranded at 1× for a domain reason. **One fix on the same card, or two fixes competing to be credited.** Drop `CashRunwayChart.tsx:236` from the headline — premium-only and already `numberOfLines={1}`.

**5 · P1-10 — the only one where the fix is a deletion.**
Resolution (a) — demote the routing view to free — is removing an `isPremium` condition and one `PremiumInvite`. It costs less than leaving it, it removes a gate that inverts the tier's own stated rule, and per the slice it is the app's best *"the engine is not making this up"* moment. Resolution (b) (a real windfall action) is new capability at a feature freeze and should not be on the table now. ⚡ **Recommend (a)**, and it is the highest value-per-line in Part B.

**6 · P1-9 — do the documentation fix, drop the code option.**
Nothing was reversed; the app shipped confetti **2026-07-02** and the rule was written **2026-07-20**. Three specs (not four) tightened a benchmark that says *"sparingly, if at all, only atop the real win"* into an absolute, and the shipped finale satisfies every clause of the benchmark. **Cutting it is the wrong option to offer 🎯** — the behaviour is older than the rule and has a device-QA gate asserting it (`DEBT_3.5_DEVICE_QA_CHECKLIST.md:45`). Three spec edits, no code.

**7 · P1-12 — one stale paragraph, plus one look 🎯 may decline.**
The decision exists (`DEBT_ELEVATION_LOG.md:5215`), was made at the named gate, before the ASC setup, and reassigned the proof-window role to the free tier. The spec (`DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md:171,215`) was never updated to say so. **The work is that one line.** The residual — that *"the free tier is the proof window"* does not cover a $79.99 one-time buyer, and 🎯's own day-30 fallback structurally cannot — is a commercial judgment, is 🎯's alone, and is legitimately a "look once, then close it."

---

### Two things this pass changed about the audit, beyond the verdicts

**⚡ The pattern held for a fourth consecutive time: the observations survived and the explanations did not.**
Three of the six carried a stated mechanism that measurement broke — O1-9's *"a data-repair notice fires"* (**no consumer exists**), P1-9's *"a locked rule was reversed"* (**the code never obeyed it; the rule is younger than the behaviour**), P1-12's *"nothing records it being reversed"* (**`LOG:5215` does**). In all three the finding still stands and the *recommendation* changes, which is the same 2-of-4 shape the standing law describes. **Attacking the mechanism first was right, and it is what produced #2 in the table above.**

**⚠️ Two findings were understated by their own authors, in the same direction.**
O1-9 reported 4 guard sites where there are 12, and named `1.2.3` when `1,200` is the reachable input. V3-6 reported 3 `numberOfLines` where there are 2, and named truncation where the real mode is overflow. Both are enumeration budgeted against the wrong class — the same shape as `PlanHero.tsx:151-153`'s false "the ONLY large figures" comment that V3-1 caught, and the same shape my own first clamp-count took before I re-ran it exhaustively. **Three instances in one refutation pass. The countermeasure is not "count more carefully"; it is to state the class and gate on it** — which for O1-9 means a lint rule on `Number(` in a comparison, not twelve edits nobody re-checks.
