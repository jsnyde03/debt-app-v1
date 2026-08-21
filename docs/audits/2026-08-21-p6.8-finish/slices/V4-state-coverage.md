# V4 — STATE COVERAGE

> Lens V4 of the P6.8 pre-release audit. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Reads `apps/rn/capture-ref/p6.8/phone/<theme>/state-<surface>-<state>.png`, then goes past the
> frames into the source for states the matrix could not seed.
>
> **Status: IN PROGRESS** — appended incrementally as frames are read.

## Method

1. Read every `state-*` frame in both themes (32 frames), light/dark paired.
2. Compare each state against its default-seed sibling (`today.png`, `money-debts.png`, …) to
   tell "this state has no design" from "this surface looks like that anyway".
3. Then read source: `EmptyState.tsx` and every call site, `StorageErrorScreen`, loading/error
   paths, subscription states — asking which states have **no rendering path at all**.

---

## Findings

### V4-1
**Severity:** major
**Surface/State:** Today · many (12 debts / 14 bills) · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-today-many.png`, `apps/rn/capture-ref/p6.8/phone/dark/state-today-many.png`
**Finding:** The Payday Guardian **"COVER NOW"** block has no `many` design — it renders every item as one uncapped middot-joined run-on string, 23 names long in this seed, with no count, no truncation and no "+N more".
**Evidence:** The light frame reads literally: `Bill 1 · Bill 2 · Bill 3 · Bill 4 · Bill 5 · Bill 6 · Bill 7 · Bill 8 · Bill 9 · Bill 10 · Bill 11 · Bill 12 · Creditor 1 · Creditor 2 · Creditor 3 · Creditor 4 · Creditor 5 · Creditor 6 · Creditor 7 · Creditor 8 · Creditor 9 · Creditor 10 · Creditor 11 — $2,658` — four wrapped lines of a single grey paragraph, in the app's most load-bearing card, on the screen a shortfall user lands on. At `single` the same block does not appear at all, so this is the **only** rendering the list has and it was designed for a handful of names. With real creditor names (see V4-4) each entry is 3–5× longer, so the same block becomes a full screen of text. ⚠️ This is also the "grouped rows collapse into one unreadable string" case A1 is hunting, but it is visible without a screen reader.
**Confidence:** high

### V4-2
**Severity:** minor
**Surface/State:** Today · many · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-today-many.png`
**Finding:** In the shortfall (`many`) state the hero progress bar is rendered **100% full and green** directly above amber "Short this paycheck" and a red Guardian "This paycheck won't cover everything".
**Evidence:** Three signals stacked vertically disagree: a completely-filled green bar, then `⚠ Short this paycheck · debt-free by April 2034` in amber, then a red shield and `Cushion $0`. Green-full is the app's success colour everywhere else; here it appears to mean "required has consumed the whole paycheck", which is the worst outcome rendered in the best colour. Compare `single`, where the same bar is a thin green sliver on an "On track" paycheck — the bar therefore means the opposite thing in the two states.
**Confidence:** medium *(the bar's semantics are not labelled in the frame; refuter should read the hero-bar component to confirm it is fill-of-required rather than a Guardian signal)*

### V4-3
**Severity:** minor
**Surface/State:** Today · huge · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-today-huge.png`
**Finding:** Two adjacent cards give opposite verdicts in the same state — the hero says `⚠ Overdue payments need attention` (red) and the Payday Guardian card immediately below says `Looks clear this paycheck` (shield, calm).
**Evidence:** Light `huge` frame, cards 1 and 2, no scroll between them. Guardian's band is computed from cushion-vs-flexible and evidently does not consider overdue items at all, so the app's central signal reports "clear" over the top of an explicit red alert. The `huge` seed sets only `paycheck` and `debts`, so the default scenario's expenses persist and are what turn overdue — the contradiction is nonetheless a real rendering of a reachable state.
**Confidence:** medium *(seed-derived overdue; the contradiction is real but the refuter should confirm Guardian's band ignores overdue in the band calculator rather than in this seed only)*

### V4-4
**Severity:** minor
**Surface/State:** Money → Debts · long-names · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-money-debts-long-names.png`, `dark/state-money-debts-long-names.png`
**Finding:** Debt rows truncate to a single line at ~28 characters, cutting exactly the qualifier that disambiguates two otherwise identical accounts.
**Evidence:** `Chase Sapphire Preferred C…` and `Navient Federal Consolidat…`. The seeded names are `Chase Sapphire Preferred Card — Authorized User` and `Navient Federal Consolidation Loan Group B`; the dropped tails (`— Authorized User`, `Group B`) are the whole point of the name. A user with both their own card and an authorized-user card sees two rows reading `Chase Sapphire Preferred C…`, distinguishable only by balance. The row has vertical room — the amount sits on its own baseline and the `Focus` pill already wraps to a second line here — so this is a 1-line clamp, not a space shortage.
**Confidence:** high

### V4-5
**Severity:** minor
**Surface/State:** Today · long-names · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-today-long-names.png`
**Finding:** The Guardian's advice sentence interpolates the full, unbounded debt name inline, so a long name reflows the app's primary recommendation into a 3-line paragraph — while the hero line 20 px above truncates the *same* name.
**Evidence:** `Apply the spare $955 toward Chase Sapphire Preferred Card — Authorized User when you're ready — your $200 cushion stays protected either way.` versus, in the hero, `Suggested · $955 · Extra payment to Chase Sapphire Pre…`. Same name, two policies, on one screen. The sentence has no truncation at all, so name length maps 1:1 onto card height.
**Confidence:** high

### V4-6
**Severity:** minor
**Surface/State:** Money → Debts · many · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-money-debts-many.png`
**Finding:** At 12 debts the only add-affordance on the screen (`+ Add`, which sits *below* the list) is pushed off-screen — the header carries no `+`, so adding a 13th debt requires scrolling past all twelve first.
**Evidence:** At `single` and `huge` the `+ Add` and `Scan a statement` buttons are visible at rest below the one row. At `many` the viewport ends mid-`Creditor 5` behind the tab bar, and the header shows only `•••`. The affordance is not lost, but it moves from "always visible" to "seven rows of scrolling away" precisely as the list gets long enough that you would want it.
**Confidence:** high

