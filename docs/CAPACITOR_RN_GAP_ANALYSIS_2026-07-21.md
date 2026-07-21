# Capacitor → RN parity gap analysis (2026-07-21)

**Purpose:** the "nothing silently lost in the RN rebuild" parity sweep — chartered as V17 Phase **D.5**, pulled forward because we're actively *elevating* screens and shouldn't polish on top of silent gaps (surfaced by Jason spotting the missing Timeline + forecast).

**Method:** 5 parallel read-only census agents, one per surface slice (Today/Plan · Progress/Payoff · Money/entities · Timeline/History/Amort · Onboarding/Settings/Native), each tagging every Capacitor feature PRESENT / REDUCED / ABSENT with file evidence + intent. This doc = the synthesis + a disposition per gap. **Status: complete (5/5 slices).**

**Disposition legend:** 🔴 **REBUILD** (oversight / cheap win, uncited) · 🟡 **DEFERRED** (intentional — Phase C revenue-spine, Phase 2/3, or B.9 — has a doc cite) · ⚪ **ACCEPTED** (deliberate drop or fold, no action) · ❓ **DECIDE** (a felt reduction needing a Jason call).

---

## 1. Headline — the material gaps, ranked

| # | Gap | Status | Disposition | Cost |
|---|---|---|---|---|
| 1 | **Per-cycle "where every dollar went" Timeline** (itemized ledger + running balance) | ABSENT | 🔴 REBUILD | **view-only** — `buildMultiCycleTimeline`→`items[]` already flows through `selectCashTimeline`; nothing renders it |
| 2 | **`expenseType` (fixed/variable) dropped from bills app-wide** | ABSENT | 🔴 REBUILD | small — field is in `@core` but RN `ExpenseSheet` + `data/models` silently omit it |
| 3 | **Windfall "Got extra money this paycheck?" flow** | ABSENT | 🔴 REBUILD | small–med — **uncited** (only settings-slice gap with no deferral note) |
| 4 | **In-app review gating regressed** — no persisted "already-asked" guard | REDUCED | 🔴 REBUILD | small — RN fires on `cycleHistory>=2` with no `reviewRequested` persistence; can re-fire, leans on OS throttle only |
| 5 | **Interest-saved "payoff-enabling" + months-saved framing** | REDUCED to a bare number | 🔴 REBUILD | small — copy/state restore |
| 6 | **Milestone celebration overlay** (debt-paid-off / 25-50-75 moment) | ABSENT | 🟡 Phase 3 delight (`DEBT_ELEVATION_PLAN.md:84`) | medium |
| 7 | **4 premium payoff modules** — Smart Insights · Strategy Comparison · What-If · 3-Mo Forecast | ABSENT | 🟡 Phase C — **⚠️ but reshape re-tiers Strategy/What-If/Forecast to FREE** → rebuild as free-parity, not "premium later" | large |
| 8 | **Money list management** — search · debt sort · bill category filter · pagination · FABs | ABSENT | ❓ DECIDE (fine short, unbounded long lists) | med |
| 9 | **Debt-row financial context** — "~$X/mo interest" callout + high-APR priority styling | REDUCED | ❓ DECIDE — loses the "which debt is bleeding you" signal | small |
| 10 | **Inline edit of recommended extra + "outside money" toggle on Today** | ABSENT on card (payday sheet only) | ❓ DECIDE | small |
| 11 | **Swipe-to-mark-paid / swipe edit·delete** on rows | ABSENT (tap/sheet only) | ❓ DECIDE (native gesture; some → B.9) | small–med |
| 12 | **Editable next-paycheck-date override** · **bill presets picker** · **since-last-cycle delta** · **list collapse/paging** | ABSENT/REDUCED | ❓ DECIDE | small each |
| 13 | **Amortization "View Schedule"** (per-debt payoff table) | ABSENT | 🟡 Phase C (`V17_PLAN.md:73,159`) — **but reshape may make it free** → ❓ decide free-vs-premium | view-only (engine ready) |
| 14 | **Paywall / RevenueCat IAP / `hasFeatureAccess` gating** | ABSENT | 🟡 Phase C revenue spine (`V17_PLAN.md:73,102,114,121`) | large |
| 15 | **iCloud backup · AU/NZ · native backup file I/O · storage-corruption banner · app-lock 30s grace** | ABSENT/REDUCED | 🟡 Phase C / B.9 (mostly cited) — grace-period + corruption banner uncited-minor | — |

---

## 2. 🔴 Rebuild bucket — genuine oversights + cheap wins (uncited)

These have **no deferral note** and are cheap to restore:

- **#1 Timeline (where every dollar went)** — view-only; `items[]` already computed. Placement under discussion (rec: Progress `[Cushion | Timeline]` toggle, Freedom Milestones/Table pattern).
- **#2 `expenseType` fixed/variable** — a real **data-model regression**: the field lives in `@core/storage` but RN's `ExpenseSheet` + `data/models.ts` drop it, so add/edit silently lose it. Restore the field + form control.
- **#3 Windfall flow** — the "Got extra money this paycheck?" add-to-paycheck feature (`PlanSettingsBody.tsx:162-213`) vanished with the paycheck-editing move to Today; no doc mentions it. Decide its home (likely the Today paycheck/edit path).
- **#4 In-app review gating** — restore the persisted `rolloverCount`/`reviewRequested` guard so it can't re-prompt; the bare `cycleHistory>=2` check is a behavioral regression.
- **#5 Interest-saved narrative** — restore the "minimums never clear your debt → debt-free by X" (payoff-enabling) state + months-saved framing; RN reduced it to a plain number tile.

**Also DECIDE (felt reductions, not clearly oversights):** Money list management (#8), debt-row interest context (#9), inline extra-edit on Today (#10), swipe gestures (#11), next-paycheck-date override / bill presets / since-last-cycle delta / list paging (#12).

---

## 3. 🟡 Intentional deferrals (cited — expected absences, not oversights)

- **Premium payoff modules** (Smart Insights · Strategy Comparison · What-If · Forecast) + **paywall / `hasFeatureAccess`** → Phase C (`DEBT_ELEVATION_READINESS_AUDIT:66,74`; `V17_PLAN.md:73,102`). **⚠️ Reshape moves Strategy/What-If/Forecast to FREE** → sequence them into the elevation as free-parity, not Phase-C-monetization.
- **Amortization "View Schedule"** → Phase C premium depth (`V17_PLAN.md:73,159`) — engine ready (view-only); **decide free-vs-premium** given the reshape.
- **Milestone celebration overlay** → Phase 3 delight (the reserved debt-paid-off spectacle).
- **RevenueCat IAP / purchase / restore / subscription wiring** → Phase C (`V17_PLAN.md:114,121,204`).
- **iCloud backup** (disabled "Soon" row) → Phase C. **AU/NZ** → Phase C. **Payday-Partner reminders+calendar** → Phase C.
- **Native backup file I/O** (RN = copy/paste JSON) + **storage-corruption banner** → B.9/D.6 (`V17_PLAN.md:46,86,108`).
- **On-plan streak** → parked Premium. **History premium lock/upsell** → Phase C.

---

## 4. ⚪ Accepted drops / folds (deliberate — no action)

"Calculate plan" button → folded into Save · Completed-actions + Optional-goals groupings → folded inline · accelerated-vs-base debt-free date → single hero date · admin buttons (standalone rollover, Reset-to-Today) → rollover survives via payday nudge · since-last-cycle delta + multi-cycle view "on home" → relocated to Progress (only the *itemized* Timeline is a true loss) · Living-Expenses → relocated to More→Preferences (RN actually **gained** add+delete) · paycheck edit → moved to Today per IA · debt CSV import → was dead in Capacitor too.

---

## 5. Per-slice detail (gaps only)

**Today/Plan** — near-parity/superset. Losses: inline extra-edit + outside-money (payday-sheet only), swipe-to-mark, next-paycheck-date override, "Show N more", streak (parked), extra-payoff+debt-free demoted (intentional).
**Progress/Payoff** — net gains (ring, rail, Skia trajectory, Drift). Losses: 4 premium modules + amortization + paywall (deferred), milestone celebration (Phase 3), interest-saved narrative reduced, cash-cushion→bars (the Timeline), payoff-order no collapse/paging, since-last-cycle delta, accelerated-vs-base date.
**Timeline/History/Amort** — Timeline itemized ledger ABSENT (#1); History faithful (premium gate deferred); Amortization ABSENT (Phase C).
**Money/entities** — CRUD at parity/broader (living gained add+delete; debt/goal edit broader). Losses: `expenseType` dropped (#2), bill presets picker, all list search/sort/filter/pagination, swipe edit/delete, debt-row interest+APR context, bill-row category/fixed-var/paid state, raw date TextField + reduced validation.
**Onboarding/Settings/Native** — onboarding/demo/theme/notifications/app-lock/delete-all/reset at parity. Losses: windfall (#3, uncited), review gating (#4), app-lock 30s grace, corruption banner (B.9), backup native file I/O (B.9), + the cited Phase-C monetization block.

---

## 6. Rebuild-now batch (Jason-approved 2026-07-21 — folded into the elevation)

Decomposed, ordered. Before/after enhancement scan per sub-item.
1. **✅ Timeline DONE (2026-07-21)** — `CashFlowSection` = `[Cushion | Timeline]` `SegmentedToggle` on Progress (replaces `CashTimeline`); `TimelineLedger` renders `selectCashTimeline` `items[]` as an itemized per-cycle ledger (icon per type · signed amount · running balance, red <$100) in a collapsible cycle accordion (this cycle open). View-only; both themes verified; tsc 0. _After-scan: fixed a latent bug — accordion header used the raw responder API (scroll-capture risk on native) → switched to `Pressable`. P2 Skia bar-elevation stays its own item. Nothing else surfaced._
2. **✅ Interest-saved narrative DONE (2026-07-21)** — `MomentumStats` now takes the full `InterestSaved` and branches: **payoff-enabling** → a "Your plan is working · minimums alone would never clear your debt, debt-free by {date}" banner (fixes a real bug: it previously rendered a misleading "$0 interest saved"); **saving** → the amount + restored "{months} sooner" sub; none → paid-only. Both themes verified; tsc 0. _After-scan: "Paid so far" still dupes the hero → Progress-audit P3 (out of scope). Nothing else surfaced._
3. **`expenseType` fixed/variable** — restore field in RN `data/models` + `ExpenseSheet` + bill-row display.
4. **In-app review gating** — restore persisted "already-asked" guard (store flag + `review.ts`).
5. **Windfall flow** — [DECISION on home] + rebuild "Got extra money this paycheck?" add-to-paycheck.

### Still-open decisions (after the batch)
- **Free-tier premium modules** (Strategy Comparison / What-If / Forecast — now free per reshape) → sequence into the elevation, not Phase C.
- **Amortization** — free (restore) vs. Phase-C premium.
- **❓ DECIDE reductions** (#8–#12) — restore vs. accept; swipe gestures likely ride with B.9.
