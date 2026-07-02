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
- **2.15.7 — Modals / overlays** — add debt/expense/goal, Pay Cycle History, Amortization Calendar, upgrade paywall, milestone celebration, delete-confirm, windfall. **↳ finding (from 2.15.1):** modal bottom-runway (`+7rem` to clear the floating nav) is applied **dark-theme only** (`.dark-theme .bills-modal`/`.goal-add-modal`; debt-add's is now theme-agnostic after the 2.15.1 fix) → **light-theme** add-modals lack the runway (button cramped under the nav). Make the runway **theme-agnostic** across bills/debt/goal for parity.
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
| Bills (2.15.3) | ✅ L/D | 🔄 | ✅ **FIXED: iPad search-input stretched vertically** (`.expense-controls`/`.goal-controls` were an implicit flex-row → search stretched to the tall filter-pills column; scoped to column, `02-overdue-pagination-nav.css`). 🔄 **Remaining (iPad two-column):** Debts column ~500px dead-space; "Active Debts" collapsed by default; column imbalance (Living Expenses under Required Expenses on the left while the right Debts column is short). → see Enhancements. | 🔄 |
| Payoff (2.15.4) | ⬜ | ⬜ | | ⬜ |
| Goals (2.15.5) | ⬜ | ⬜ | | ⬜ |
| Settings + onboarding (2.15.6) | ⬜ | ⬜ | | ⬜ |
| Modals/overlays (2.15.7) | ⬜ | ⬜ | | ⬜ |
| Consistency sweep (2.15.8) | ⬜ | ⬜ | | ⬜ |

---

## Enhancements log (elevate to leading-fintech polish — separate from fixes)

_Genuine premium opportunities surfaced during the audit. **Fold** = low-risk polish done in this v1.5
pass; **Backlog** = filed to MASTER_PLAN §9 (v1.6+). Only real, observed opportunities — no invented filler._

**Plan (2.15.2):**
- **Fold** — on iPad's tall canvas, expand the Required-Actions list fully instead of "Show 1 More" (dead clicks + hidden content where there's room). _(Also applies to the Bills accordion pattern below.)_
- **Backlog** — a subtle progress indicator toward the "debt-free by {date}" headline (ring/bar) on the Plan hero; leading-fintech apps make the payoff-date the emotional anchor. _(v1.6 — pairs with the Premium+ history chart.)_

**Bills (2.15.3):**
- **Fold (pending decision)** — iPad Debts-column dead-space: expand "Active Debts" by default on iPad (fills the column + surfaces the 4 debts) and rebalance the two columns (move Living Expenses under Debts on the right, or masonry-balance) so neither column is a long void. _(Behavioral — needs a responsive default + e2e care; recommend doing in 2.15.3, flagged to Jason.)_
- **Backlog** — category filter pills show per-category counts (e.g. "Utilities · 2") — a standard fintech nicety that also signals filter value. _(v1.6.)_
- **Backlog** — the Debts summary card ("$2,391.53 debt · 4 active") gains a slim payoff-progress bar (paid vs original across all debts) — glanceable debt-reduction, on par with Rocket Money / Monarch. _(v1.6 — pairs with Premium+ history.)_
