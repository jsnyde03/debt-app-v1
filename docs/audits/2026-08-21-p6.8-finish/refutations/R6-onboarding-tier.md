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
