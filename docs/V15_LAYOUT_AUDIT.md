# v1.5 step 2.15 — Full-app layout & premium-UX pass

_The working doc for v1.5 step 2.15 (the "proving app" audit). Jason: audit **every** screen, phone **and**
iPad, light **and** dark, for whether the layout is actually correct + premium — not just the iPad-specific
gaps of 2.12. Fix what's off to the premium quality bar ([[feedback_premium_quality_bar]]). Created 2026-07-01._

**Why now / why safe:** sequenced after the 2.14 CI gate on purpose — the green functional e2e suite +
keep-green checkpoints protect the many screen changes this pass makes. Every sub-step below: audit →
fix → screenshot-verify (light + dark × phone + iPad) → keep the affected e2e specs green.

**Method per surface:** serve the production build, drive with Playwright at a phone viewport (Pixel 7 /
iPhone 15 Pro Max) and an iPad viewport (iPad Pro 11 portrait + landscape), screenshot light + dark, and
judge against "would a paid, design-led app ship this?" Record findings + fixes per surface below.

**Capture ENHANCEMENTS, not just fixes (Jason 2026-07-02).** The bar is **premium, first-class, on par
with leading fintech** (Copilot / Monarch / Rocket Money-level fit & finish) — so at each surface, actively
scout polish/premium opportunities, not only broken layout. Route them: **low-risk polish that elevates to
the bar → fold into v1.5** (this pass); **larger enhancements (new viz/features) → file to the MASTER_PLAN §9
Deferred backlog** (v1.6+) so nothing's lost. Log every one in the **Enhancements** section below.

---

## Decomposition (ordered sub-steps → mirrored terse in MASTER_PLAN §9 item 2)

- **2.15.1 — Cross-cutting CSS correctness. ✅ DONE + verified (2026-07-02).**
  - ✅ Fixed the two silently-dropped `calc()` paddings in `08-dark-theme-polish.css` (`+7rem`→`+ 7rem` :438; `evn(`→`env(` :757 → both `+ 7rem`, matching the bills/goal sibling modals). Both were on the **add-debt modal**, whose dark bottom-runway was dropped → its "Add Debt" button was overlapped by the floating bottom nav. **Screenshot-verified before/after (dark, phone + iPad):** button now clears the nav on phone; clean/balanced on iPad. Widened before-scan grep confirmed these were the **only** invalid `calc()`/`env()` in the styles.
  - ↳ The phone scroll-runway `padding-bottom` hack (7–15rem across `01-payoff-goals.css`, `04-debt-modals-focus.css`, `08-dark-theme-polish.css`) → **dead space on iPad (no floating nav)** → **moved to the per-tab iPad audits (2.15.2–2.15.5)** — safer to trim each page's runway while viewing it on iPad, in context, than a blind cross-cutting sweep.
- **2.15.2 — Plan tab** — hero/header, streak stat, settings accordion, results/summary strip + since-last-cycle delta.
- **2.15.3 — Bills tab** — debts + expenses + timeline; iPad two-column (dead-space on the Debts column; expand-collapsibles where the taller canvas has room).
- **2.15.4 — Payoff tab** — payoff summary/recommendation strips, trajectory chart, forecast bars, amortization "View Schedule" entry.
- **2.15.5 — Goals tab** — goals list, progress bars, empty state.
- **2.15.6 — Settings + onboarding** — returning-user accordion + first-run modal (shared `PlanSettingsBody`), notifications/app-lock/legal cards, `OnboardingFlow`.
- **2.15.7 — Modals / overlays** — add debt/expense/goal, Pay Cycle History, Amortization Calendar, upgrade paywall, milestone celebration, delete-confirm, windfall. **✅ FIXED (from the 2.15.1 finding):** the modal bottom-runway was **dark-theme only**, so the **light-theme** add-expense/add-goal submit buttons sat under the floating nav (screenshot-confirmed) — added theme-agnostic `.center-modal.bills-modal`/`.goal-add-modal` `+ 7rem` (debt-add already had it). Verified light add-expense button now clears the nav. _(Remaining modals — History / Amortization / paywall / celebration / delete-confirm / windfall — spot-check in progress.)_
- **2.15.8 — Final consistency sweep + regression** — spacing/typography/density token consistency across surfaces; full e2e green; screenshot review light+dark × phone+iPad. **↳ finding (from 2.15.1):** duplicate `.center-modal.debt-add-modal` selector blocks in `08-dark-theme-polish.css` (`:441` + `:754`) — dedupe.

---

## Banked findings (from the 2.12 iPad audit — address in the sub-steps above)

- **[2.15.1] `calc()` bugs** silently dropping padding: `evn(` typo `08-dark-theme-polish.css:757`; missing-space `+7rem` at `:438`.
- **[2.15.1] Phone scroll-runway `padding-bottom`** (7–15rem, to clear the floating bottom nav) recurs across `01-payoff-goals.css`, `04-debt-modals-focus.css`, several `08-dark-theme-polish.css` sections → dead space on iPad (no floating nav). Trim on iPad systematically.
- **[2.15.3] iPad dead-space** on Bills' Debts column; expand collapsibles by default where the taller iPad canvas has room.

---

## Per-surface audit log (fill as each sub-step runs)

| Surface | Phone L/D | iPad L/D | Findings | Status |
|---|---|---|---|---|
| Cross-cutting CSS (2.15.1) | ✅ (dark) | ✅ (dark) | 2 calc bugs fixed (add-debt runway); iPad runway trim → per-tab; light-modal runway → 2.15.7; dup selector → 2.15.8 | ✅ |
| Plan (2.15.2) | ✅ L/D | ✅ L/D | **Premium, no fixes.** Metric grid adapts 2×2 (phone)→1-row (iPad); on-track card, actions list, dark banner all clean. Soft note: iPad "Show 1 More" hides 1 action on the tall canvas (could expand) — low-pri, → 2.15.8. Plan iPad runway already trimmed (2.12.3). | ✅ |
| Bills (2.15.3) | ✅ L/D | ✅ L/D | ✅ **iPad search-input stretch** fixed (`.expense-controls`/`.goal-controls` → column). ✅ **iPad Debts-column dead-space** fixed — "Active Debts" now auto-expands on the ≥834px two-column layout (post-mount `matchMedia`, mirroring TimelineSection; `DebtsSection.tsx`), so the column fills with the rich debt detail (balance/APR/interest/BNPL) and the two columns balance. e2e: made data-entry's expand-click + asserts robust to the auto-expanded row; keep-green 9/9 across phone + both iPads. Minor: Living-Expenses column placement (left vs right) → 2.15.8 sweep. | ✅ |
| Payoff (2.15.4) | ✅ L/D | ✅ L/D | **Premium, no fixes.** Single-column (correct for the sequential flow — no iPad dead-space); focus-debt card, snowball/avalanche toggle, timeline strips, trajectory chart + premium gating all clean; chart renders well at phone width. Enhancement (chart axis context) → below. | ✅ |
| Goals (2.15.5) | ✅ L/D | ✅ L/D | **Premium, no fixes.** Metric grid (Total Saved/Goal/Progress), motivational card, goal cards (icon + saved-of-total + progress bar + "$ left"), clean single-line search (the 2.15.3 `.goal-controls` column fix covers this). Minor: sparse-data whitespace below on iPad (only 2 demo goals; fills with real data). | ✅ |
| Settings + onboarding (2.15.6) | ✅ L/D | ✅ L/D | ✅ **FIXED: over-wide settings form on iPad** — the returning-user accordion body was full-bleed (~1200px, stretched paycheck/date inputs); constrained `.plan-settings-accordion-inner` to a centered **640px** column on ≥834px (`03-nav-results-modals.css`); phone unchanged. Onboarding + first-run modal were screenshot-verified recently (2.8 modal / 2.13 onboarding) and read clean — not re-shot this pass. | ✅ |
| Modals/overlays (2.15.7) | ✅ add-modals + paywall | ✅ | ✅ **Light-modal runway fixed** (bills/goal add-modals, above). **Add-debt/expense/goal modals premium** in both themes. **Paywall** bottom-sheet premium (purple gradient, clear value prop); "Loading price…" is a **web-only artifact** (RevenueCat absent in web — real device shows the price) + confirm sheet/nav layering on-device. **Not individually shot this pass:** Pay Cycle History / Amortization Calendar / milestone celebration / delete-confirm / windfall (standard overlays — quick follow-up). | 🔄 |
| Consistency sweep (2.15.8) | 🔄 | 🔄 | **Full-suite regression: 114 passed** across all 4 projects — every 2.15 fix keeps the suite green. ⚠️ **1 hard failure = the pre-existing known-flaky `planner-herdening.spec.ts:49`** (old-seed-pattern race, `storedDebtNames` empty; failed both retries on ipad-pro-11 — **worsening**, was a retry-pass flake in 2.14). NOT caused by 2.15; tracked for the v1.6 seed migration — **but it now threatens the CI gate → recommend pulling its migration forward.** Remaining sweep: Living-Expenses column rebalance, dedup `.center-modal.debt-add-modal`, secondary-modal spot-checks. | 🔄 |

---

## Enhancements log (elevate to leading-fintech polish — separate from fixes)

_Genuine premium opportunities surfaced during the audit. **Fold** = low-risk polish done in this v1.5
pass; **Backlog** = filed to MASTER_PLAN §9 (v1.6+). Only real, observed opportunities — no invented filler._

**Plan (2.15.2):**
- **✅ Folded (done 2026-07-02, Jason-approved)** — required + recommended action lists **auto-show-all on iPad** (≥834px), removing the "Show N More" dead click where there's vertical room (`ResultsSection.tsx`, post-mount `matchMedia`, mirroring the Timeline/Active-Debts pattern). Screenshot-verified iPad (all 7 required actions show); keep-green paycheck-flow 10/10.
- **Backlog** — a subtle progress indicator toward the "debt-free by {date}" headline (ring/bar) on the Plan hero; leading-fintech apps make the payoff-date the emotional anchor. _(v1.6 — pairs with the Premium+ history chart.)_

**Payoff (2.15.4):**
- **Backlog** — the "Payoff Trajectory" chart is bare two lines with no axis/date/balance context. Add date markers (x) + balance context (y) and/or a hover/tap tooltip showing the balance at a given month — leading-fintech payoff charts (Undebt.it, Monarch) do. _(v1.6 — pairs with the Premium+ history chart.)_

**Bills (2.15.3):**
- **✅ Folded (done 2.15.3)** — iPad Debts-column dead-space: "Active Debts" now auto-expands on the ≥834px two-column layout (post-mount `matchMedia`), filling the column + surfacing the 4 debts. The optional Living-Expenses column-rebalance (masonry-balance of the two columns) was left as a smaller polish → **2.15.8 sweep** (or backlog if it needs a grid-structure change).
- **Backlog** — category filter pills show per-category counts (e.g. "Utilities · 2") — a standard fintech nicety that also signals filter value. _(v1.6.)_
- **Backlog** — the Debts summary card ("$2,391.53 debt · 4 active") gains a slim payoff-progress bar (paid vs original across all debts) — glanceable debt-reduction, on par with Rocket Money / Monarch. _(v1.6 — pairs with Premium+ history.)_
