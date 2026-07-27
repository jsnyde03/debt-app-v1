# Debt Planner — Debt-Paid-Off Celebration (3.3.1) — LOCKED design

> **Status:** design signed off (Jason 2026-07-27). The flagship Wave-B emotional beat. Build structure-first.
> **Engine:** hand-rolled **Skia + Reanimated + a Core Haptics pattern** (no new native runtime; the interim
> haptic is `haptics.success()` until the bespoke AHAP lands at Phase-6 device work). **Motion timeline:**
> `motion.ts` `celebration` (panelIn→ringSweep→checkPop+haptic→balanceRoll→cascade→interestSaved→cta).

## Triggers (already wired)
- **Per-debt confirm:** `PayoffInvitationCard.onConfirm` → `verifyDebtBalance(id, 0, date)` (index.tsx). The
  code already comments "the Phase-3 spectacle fires here." Fire the **beat** here; if it's the LAST live
  debt, fire the **finale** instead.
- **Last-debt / graduation:** all live debts cleared → the finale + the existing `GraduationBanner`/Freedom invite.
- Paid-off debts **persist** in the store (`balance: 0`) with `originalBalance` + last-verified date → the
  archive derives from existing data; **no new persistence.**

## The three pieces
1. **Per-debt "vanquished" beat** — a **contained overlay** (NOT full-screen; snowball clears several in a
   row, so it must satisfy without exhausting). The debt lifts into focus, balance rolls to $0, a gold check
   pops + haptic tick, "**{name} — gone**", the amount vanquished, and a "**freed ${X}/mo now flows to
   {next debt}**" cascade line. ~2s, dismissible (tap / auto-dismiss).
2. **Grand finale** (last debt → $0) — the **full-screen Skia spectacle**: navy takeover, gold ring sweeps
   to 100%, particle burst, a **count-up trio** (total paid · interest saved vs minimums · time to freedom),
   haptic crescendo → "You're debt-free" → the Freedom next-chapter invite.
3. **"Debts Vanquished" archive** — lives on **Progress**. A permanent, shareable list of tombstone cards,
   one per cleared debt (name · amount vanquished · date cleared · interest saved) + a share-card export.

## Cross-cutting
- **Reduce-motion:** collapse the timeline to a crossfade into the final state; **retain haptics** (an a11y
  channel), per the `celebration` timeline note.
- **a11y:** announce the count-up end values; the overlay is a focus-trapped, dismissible modal with a clear label.
- **Sound:** none for v1 unless later opted-in (silent-switch-respecting) — the haptic carries the beat.
- **Both themes** verified; the navy takeover is the constant hero surface (identical in light/dark).

## Structure-first build order (3.3.1.1 → .6)
1. **Logic/selectors (pure, tested):** `selectVanquishedDebts(store)` (archive rows: name · vanquished
   amount · cleared date · interest saved) + a last-debt/finale detector for the confirm handler + the
   finale stat trio (reuse `computeInterestSaved` etc.). Throw-based core/app tests.
2. **Per-debt beat overlay** (Skia contained component + Reanimated timeline + interim haptic).
3. **Grand finale** full-screen spectacle (Skia ring/particles + count-up trio).
4. **Archive** on Progress (tombstone list + share export).
5. **Wiring** into the confirm flow (beat vs finale), reduce-motion + a11y.
6. **Verify:** tsc/lint/tests + both-theme screenshots + `validate:release:rn`. (Bespoke Core-Haptics AHAP
   + on-device motion → Phase-6 device-QA ledger.)
