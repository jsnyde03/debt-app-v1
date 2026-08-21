# R3 — JOURNEY & REACHABILITY (refutation)

> Refuter R3 of the P6.8 audit. Repo `debt-app-v1`, branch `v1.7-dev`.
> Target: the "X has no caller / Y is unreachable" cluster in `slices/M2-journey.md`
> (M2-5, M2-2, M2-6, M2-7, M2-1, M2-9).
> ⛔ Default is REFUTED. A finding survives only where I actively failed to break it.
> **Method:** every claim attacked by (a) whole-repo grep including `node_modules`, `ios/`,
> `apps/rn/modules|targets|plugins` (Swift), the legacy Capacitor tree at the repo root, and both
> e2e suites; (b) looking for prop-threading from a parent rather than a direct call; (c) looking
> for an iOS-only entry point (App Intent, widget, Live Activity, Siri, context menu); (d) asking
> whether a spec drives the path, since a spec that drives it proves a caller exists.

---

## R3-M2-5 — the payoff celebration is unreachable for a free user

**Verdict:** **CONFIRMED** (mechanism accurate as written; one detail is *worse* than the slice says)

**Every caller I found:**
- `setCelebration` — **3 sites, all in one file**: `apps/rn/src/app/(tabs)/index.tsx:179` (the `useState`
  declaration), `:184` (inside `confirmPayoff`), `:497` / `:501` (both `onDismiss` → `null`).
  Whole-repo grep **including `node_modules`** returned exactly two files: `index.tsx` and the M2 slice
  itself. There is no second writer anywhere in the tree.
- `confirmPayoff` — **2 callers**: `index.tsx:484` (`PayoffInvitationCard.onConfirm`) and `index.tsx:192`
  (`useCaptureAutoConfirm(provisionalPayoffs[0], confirmPayoff)` — inert outside a `CAPTURE_DEMO`
  marketing build, and it feeds off the *same* `provisionalPayoffs` array, so it inherits the premium gate
  rather than bypassing it).
- `PaidOffBeat` / `PaidOffFinale` — imported at `index.tsx:18-19`, rendered at `:491` and `:501`, and
  **nowhere else**. Not in `progress.tsx`, not in the tutorial sandbox, not in any sheet.
- `selectProvisionalPayoffs` — 1 caller, `index.tsx:175`. Definition `store/balanceSelectors.ts:112-116`:
  `if (!isPremium) return [];`. `isPremium` derives from `subscriptionPlan === 'premium'`;
  `data/defaults.ts:46` ships `subscriptionPlan: 'free'`.

**How I tried to break it:**
1. **A selector watching `debts` for a zero-crossing.** `store/celebrationSelectors.ts` — read in full — is
   pure read-layer (`selectPaidOffDebts`, `isLastLiveDebt`, `selectCelebrationStats`). Nothing in it fires a
   beat; `isLastLiveDebt` is called *by* `confirmPayoff`, not by anything watching state.
2. **The rollover milestone engine.** `store/payday.ts:128` is the closest thing to a zero-crossing watcher —
   and it explicitly **excludes** the one crossing that matters:
   `const crossedPortfolio = portfolioResult.milestones.find((m) => m.threshold < 100);`
   `store/milestoneCross.test.ts:45` pins it: *"100% never sets a milestone (finale owns debt-free)."*
   So the 100% moment is deliberately handed to a path a free user cannot reach. This **strengthens** the
   finding rather than breaking it: the code has consciously vacated the crossing.
   The per-debt `computeMilestones` result (which does carry `isPaidOff: true` at 100%) is consumed at
   `payday.ts:160` for `milestoneMaxProgress` only — the `isPaidOff` flag reaches no UI.
3. **iOS-only entry.** Every Swift surface in the tree: `plugins/app-intents-swift/{LogPaymentIntent,
   SiriQueryIntents}.swift`, `modules/live-activity/ios/PaydayLandedIntent.swift`,
   `targets/widget/*.swift`. The intents queue exactly **two** action kinds into the App Group —
   `"log-payment"` (`LogPaymentIntent.swift:88`) and `"payday-landed"`
   (`PaydayLandedIntent.swift:24`) — drained by `src/appIntents/drainPendingActions.ts` into
   `logManualPayment` / `applyPaydayLandedIntent`. **Neither touches `celebration`.** `logManualPayment`
   (`store/store.ts:523-540`) clamps the balance with `Math.max(0, …)` and returns; it sets
   `intentRollback`, nothing else. So the *one* iOS-native way to pay a debt to zero is also silent.
4. **The tutorial.** `sandboxBeats.ts` has no payoff beat (grep for `payoff|celebration|PaidOff` returns one
   unrelated comment). `finaleOnly` in `tutorialSelectors.ts:67` is the *tutorial's* last step, not the
   payoff finale — a false-friend name that could have rescued this and does not.
5. **A test that drives the free path.** `apps/rn/tests/e2e/celebration.spec.ts:31` and `:69` seed
   `subscriptionPlan: 'premium'` for every case; `:88`'s archive case seeds debts already at `balance: 0`
   (the steady state, not the beat). The slice's ⚡ is correct — **no test exercises a free payoff.**
6. **A different confirm path.** `verifyDebtBalance` has 3 non-test callers: `index.tsx:183` (inside
   `confirmPayoff`), `index.tsx:638` (`verifyDebtBalances`, the payday-capture batch), and `money.tsx:493`
   (the debt-row caption re-verify). The latter two set a balance to whatever the user types — **including
   0** — and fire no celebration.

**One correction that makes it worse, not better.** `index.tsx:283` states the design intent as *"the
one-time celebration spectacle stays Phase 3 (**gated on confirmed-$0**)."* A free user typing 0 into
`DebtSheet`, or `verifyDebtBalance(id, 0)` from the payday capture's balance check, **is** a confirmed $0 —
it is the most confirmed $0 in the product. The gate the comment describes is not the gate that shipped;
what shipped is gated on *premium projection + confirm*, which is a strictly narrower thing.

**If CONFIRMED — what does a real user loses:** the whole emotional terminus of the product. A free user
who clears every debt they own gets: a Money "PAID OFF" section, a Progress debt-free hero + `PaidOffArchive`,
Today's `GraduationBanner` + `FreedomNextChapterCard` (`index.tsx:293-303`, correctly ungated), and a
"Payment logged" ack with Undo. What they never get, at any point in the arc, is the **one-time spectacle**:
`PaidOffBeat` per debt, and `PaidOffFinale` — the navy takeover, the gold ring sweep, the confetti, the
count-up trio, the share card, the opt-in chime (`more.tsx:306`). A premium user who logs their own final
payment instead of waiting for the projection to notice gets the same silence. The most-photographed screen
in the app fires only for a premium user who lets the estimate get there first and then taps Confirm.

**Residual doubt:** two, both small. (a) I could not run a device build; if some native module fires the
finale outside React state I would have seen it in the Swift, and I did not — `modules/finale-haptics` is
imported only by `PaidOffFinale.tsx` itself. (b) Whether the premium-only invitation is the *intended* tier
line is 🎯's call — but note that even accepting that line, the **premium manual-payment path is silent too**,
which no tier argument covers.
