# Debt Premium Reshape — Audit Synthesis (2026-07-21)

> Synthesizes four adversarial (default-skeptical) audits of the reshaped premium set against Jason's four questions — (1) good enough? (2) enough? (3) justify $4.99/mo? (4) derivable from a simple LLM chat? — plus the LLM-defensibility lens. Basis: `PREMIUM_RESHAPE_SPEC.md` (the 4-pillar "active-vs-passive" sort), `MONETIZATION_AUDIT`, `DEBT_BENCH_PREMIUM_MONETIZATION`. **This is a proposal for Jason to shape**, not a lock.

## Verdict on the current 4-pillar set: NO headline — an enhancement tier
Judged against "the one feature that alone justifies $4.99/mo," the current set (① Payday Partner · ② Drift · ③ Momentum · ④ Living Plan) fails, in a diagnosable way: **every pillar is a readout, a reminder, or a cosmetic wrapping a free calculator.** And much of it is already-free or LLM-commodity:
- **① Payday Partner** — the spec's premium delta (verify · carry-forward · mark-paid · autopay-failure) **already shipped FREE in v1.6** (`PaydayCaptureSheet`, `reconcileAutopay`, the notifications). D1's "Free = eve-nudge only" is contradicted by the shipped code. Subtract the free parts and the literal delta is "per-bill reminders + calendar sync" — a ~$10/**yr** Undebt-tier commodity. `payday_partner` gates nothing today (no call site).
- **② Drift** — the most differentiated engine (frozen baseline, ahead/behind) but a **pure diagnosis that does nothing** — anxiety without discharge; the "inert smart text" in a sophisticated costume.
- **③ Momentum** — streaks borrowed from Duolingo but the **cadence is wrong** (debt acts per-paycheck, not daily → a fraction of the loss-aversion grip); milestone cosmetics convert weakly (Finch). Retention, not a headline.
- **④ Living Plan** — auto-adjust's "roll freed minimums" + "live recompute" are **already free** (regression-tested `projectDebtPayoff` + reactive selectors — paywalling them is screenshot-diffable credibility risk); amortization + "next move" insights + PDF are **the most LLM-derivable things in the app**.

**The LLM test confirms it:** with the numbers pasted in, a chat does strategy, payoff date, what-if, brag post, and "next move." The only things it *can't* do are the persistent/scheduled/verified/proactive ones — exactly the parts under-built or left diagnostic. **The raw materials for a headline are in the engine; they were never assembled into one.**

## THE HEADLINE — the Payday Cushion Guardian
**Proactive, per-cycle "am I going to make it this paycheck?" — shortfall rescue + surplus optimization — delivered as a recurring Payday Brief.** Two-sided, both from math the engine ALREADY computes (`buildSmartInsights` `projectedBuffer` / "Tight Cycle Warning" / "Recovery Needed") but currently throws away as a passive line:
- **Defense (the save):** days *before* payday, detect the shortfall and intervene — *"You're about to fall $180 short this payday. The move: pay Visa minimum-only, hold the $150 extra — you stay current, your debt-free date slips just 6 days. Apply."*
- **Offense (the surplus):** *"You have $220 of true slack after this cycle's bills — highest-leverage move is the Car loan (saves $612 interest vs spreading)."* — so it fires *every* cycle, not just bad ones.

**Why it's the headline (clears all bars — Def 5 · Val 5 · Diff 5 · Fit 5 · Effort M):**
- It answers the fear that **free deliberately doesn't touch**: free answers *"what's the plan"*; premium answers *"am I going to make it THIS paycheck"* — the fear that recurs every cycle and never stops.
- **Un-chattable:** requires proactive *scheduled* monitoring of *persistent on-device* state. A chat only answers when asked — and by the time a stressed user thinks to ask, they've already overdrafted.
- **It absorbs the inert pillars, giving them a job:** Drift → the trigger · Smart Insights → the intervention · Payday Partner → the delivery mechanism · auto-adjust → "tap to apply."
- **Effort M, not L** — the buffer/drift math exists; the build is the *proactive trigger + scheduled notification + recovery-play UI*.
- **It IS the churn answer** (below).

**The accountability spine under it** (from the Payday Partner audit — "the loop that closes itself"): an **escalating unconfirmed-payment loop** (a bill's due date passes unconfirmed → re-ping → a persistent "1 payment unconfirmed" state on Today + the widget until resolved) + **missed/failed-payment recovery recompute** + the **payday check-in as a scheduled ritual** feeding a forgiving consistency streak. This is the delivery vehicle for the Brief.

## The reshaped premium set

| Tier role | Feature | Note |
|---|---|---|
| **HEADLINE** | **Payday Cushion Guardian / Payday Brief** | proactive shortfall rescue + surplus optimization + the recurring payday briefing; absorbs Drift + Insights + auto-nudge |
| **Spine (strong-supporting)** | Closing-the-loop **payment verification** (escalating unconfirmed + recovery recompute) | the accountability loop a chat can't be |
| Spine | **Payday check-in ritual** → forgiving **$-based consistency streak** | loss-aversion, bridges to Momentum |
| **Retention** | **"Debts vanquished" archive** (a losable war-record) | loss-aversion done right; a chat can't hold your private on-device fight-record |
| Retention | **Living partner/accountability sharing** (recurring shared plan) | relational + recurring = un-chattable; **recipient never pays** |
| Retention | **Widget** = the on-device home-screen surface of the loop (Brief verdict + one-tap mark-paid via App Intents) | flagship native edge; nobody subscribes *for* a widget, but it's the loop on your home screen |
| **→ FREE** (front-door) | amortization calendar · Smart-Insights *readouts* (buffer/strategy deltas) · generous history · momentum line chart · **What-If · Forecast** · debt-paid-off celebration + cascade + basic share | all LLM-commodity or already-free; gating them is a rating-killer. **What-If/Forecast/Smart-Insights are not yet surfaced in RN → building them free is required Phase-2 work (proportionate, not gold-plated).** |
| **CUT / ride-along** | custom share art (Finch trap) · PDF/CPA export (ride-along) · "rolls freed minimums" / "live recompute" as *premium claims* (already free — never market as premium) | no roadmap budget |

Drift is **not** sold as a standalone readout — it becomes the Guardian's trigger. If shown, reframe to dollars/date-moving + a lifetime "original-plan ghost" that never re-anchors.

## The four questions, answered for the RESHAPED set
1. **Good enough?** Yes — the Guardian is a genuine differentiated capability, not an enhancement.
2. **Enough?** Yes — one strong headline + a coherent accountability spine + a retention layer is a real tier (vs. the old grab-bag).
3. **Justify $4.99/mo?** Yes — "we tell you if you're about to fall short, before it happens, every payday" is insurance-grade value for a debt-stressed person; the fear recurs forever.
4. **LLM-derivable?** No — the headline is structurally un-chattable (proactive scheduled monitoring of persistent on-device state).

## The finite-job / churn answer — the headline IS the graduation
"Am I going to make it this paycheck, and where should my freed money go?" is a **cash-flow question, not a debt question** — it *survives debt = $0*. The moment the last debt clears, the same engine re-points from "protect minimums + optimize payoff" to "protect bills + optimize the freed payment into savings/net-worth." That's a native, honest bridge debt-payoff → cash-flow-confidence → the Freedom/net-worth next goal — a graduation, not a cancellation. Stacked with the Lifetime (~$79–99, 2nd offer) + the portfolio-subscription seam. **The headline feature is also the churn answer.**

## Jason's addition — on-device semi-automation (scan-to-prefill) — the SECOND pillar
Jason (2026-07-21): *"How about some semi-automation tools as well? Scanning etc. Current debt is very very very manual."* Correct — every debt/bill is hand-typed (balance · APR · minimum · due date), the #1 onboarding-dropoff friction, and it goes stale the moment a statement arrives. This is the **input-side** counterpart to the Guardian's **output-side** proactivity, and it fits the identity better than anything:
- **It's the on-device, privacy-preserving answer to bank-sync.** Rivals (Rocket Money et al.) auto-update balances by *connecting your bank* — which violates our on-device/"nothing leaves the phone" moat. **Snap-a-statement OCR gives the same "no typing, always current" value without ever connecting an account.** That's a genuine differentiator that *is* the trust identity, not a compromise of it.
- **Recurring by nature** (statements arrive every cycle) → premium-appropriate, and it keeps the data current so the **Guardian's proactive intervention stays accurate** — the two pillars reinforce.
- **Honest framing = "semi-automation", exactly as Jason said: scan → OCR (on-device, Apple Vision) → PRE-FILL the fields → the user confirms/corrects.** It does NOT need to perfectly parse every creditor's layout (that's the brittle part — statement formats vary wildly); it needs to save most of the typing with the user verifying. A pre-fill assist, not a magic auto-import. **No server** (statements are sensitive → on-device only).
- **Ongoing:** scan a new statement → detect balance/APR/minimum **changes** (an APR hike, a new fee) → pre-fill the update + feed the Guardian's change-detection (absorbs audit-#4's "Shock Re-Planner" candidate).
- **LLM/defensibility caveat (honest):** raw OCR extraction is chattable (photo → ChatGPT), and on-device statement parsing is a real **M–L engineering lift with reliability risk**. The defensible app value is the *integration* — auto-populating YOUR persistent plan, monthly, on-device, feeding the Guardian — which a chat can't hold. Frame + build it as *semi*-automation (confirm step) to de-risk reliability.
- **Free/premium line (decision for Jason):** manual entry ALWAYS stays free (gating data-entry = rating-killer). Options: (A) scanning is premium throughout ("don't want to type / want it kept current? Premium does it"); (B) a free scan-to-set-up taste at onboarding (kills the acquisition-friction) + premium ongoing statement-sync + change-detection. **Rec: B** — free initial scan for adoption, premium keeps-it-current.

**The coherent premium story this creates:** *"Premium keeps your plan true and has your back every payday — without you typing everything in or connecting your bank."* Scanning keeps the data current (input); the Guardian acts on it proactively (output). Complete, differentiated, on-device, un-chattable.

## Revised Phase-2 build order (proposal — re-decomposed from the audits)
- **2.1 ✅** one-tier foundation (done).
- **2.2 Free-tier completion** — surface the now-free modules (What-If · Forecast · amortization · Smart-Insights readouts · generous history) so "free finishes the job." Prerequisite to a credible premium line.
- **2.3 Payday Cushion Guardian / Payday Brief** — THE headline (output-side): proactive shortfall + surplus + the recurring brief (on `buildSmartInsights`/`computeDrift`/payday plumbing). Gated `cushion_guardian`.
- **2.4 Semi-automation — scan-to-prefill** (input-side 2nd pillar): on-device statement/bill OCR (Apple Vision) → pre-fill debt/bill fields → confirm; ongoing statement-sync + change-detection feeding the Guardian. Free initial scan / premium keeps-current (rec B). Native scan UI batches with 2.6.
- **2.5 Closing-the-loop verification + recovery recompute** — the accountability spine.
- **2.6 Momentum reshaped** ($-streak + debts-vanquished archive) + Drift-as-trigger + **living partner sharing**.
- **2.7 Widget** (on-device loop surface + App Intents) + the scan UI — batched native build.
- **2.8 Revenue spine** — RevenueCat + paywall (port Gig) + Lifetime 2nd-offer + portfolio-sub seam + analytics/Sentry; launch-flip gated on value.
- **2.9 iCloud + 2.10 AU/NZ.**

## Open decisions for Jason
- **Adopt the Cushion Guardian as the premium headline?** (the core recommendation)
- **Fix D1** in `PREMIUM_RESHAPE_SPEC` — the "free = eve-nudge only" boundary is stale vs shipped code; the real line is free = the sheet + eve/payday/earliest-bill nudge + one-shot verify + silent carry-forward.
- **Confirm the demote-to-free list** (amortization · insights readouts · generous history · momentum chart) and the cuts (custom art, PDF-as-headline).
- **Confirm the revised 2.2–2.9 order** (free-tier completion first, then the Guardian).
