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

---

## Decomposition (ordered sub-steps → mirrored terse in MASTER_PLAN §9 item 2)

- **2.15.1 — Cross-cutting CSS correctness (do first; clears noise before per-surface work).**
  - Fix the two silently-dropped `calc()` paddings in `08-dark-theme-polish.css`: `evn(`→`env(` (:757) and the missing space `+7rem`→`+ 7rem` (:438). ⚠️ **Corrected scope (2026-07-01):** both are on the **add-debt modal** (`.debt-add-modal` / `.center-modal.debt-add-modal`), i.e. the modal's *internal* bottom padding (currently dropped) — NOT a page scroll-runway. Fixing them applies 7–8.5rem to the modal, a **visual change** → verify the dark add-debt modal (phone + iPad) before/after and keep only if it reads better; don't blind-fix. _(The separate page scroll-runway trim on iPad is the next bullet.)_
  - Systematically audit the phone scroll-runway `padding-bottom` hack (7–15rem across `01-payoff-goals.css`, `04-debt-modals-focus.css`, several `08-dark-theme-polish.css` blocks) → trim on iPad where there's no floating nav (Plan's was fixed in 2.12.3; generalize).
- **2.15.2 — Plan tab** — hero/header, streak stat, settings accordion, results/summary strip + since-last-cycle delta.
- **2.15.3 — Bills tab** — debts + expenses + timeline; iPad two-column (dead-space on the Debts column; expand-collapsibles where the taller canvas has room).
- **2.15.4 — Payoff tab** — payoff summary/recommendation strips, trajectory chart, forecast bars, amortization "View Schedule" entry.
- **2.15.5 — Goals tab** — goals list, progress bars, empty state.
- **2.15.6 — Settings + onboarding** — returning-user accordion + first-run modal (shared `PlanSettingsBody`), notifications/app-lock/legal cards, `OnboardingFlow`.
- **2.15.7 — Modals / overlays** — add debt/expense/goal, Pay Cycle History, Amortization Calendar, upgrade paywall, milestone celebration, delete-confirm, windfall.
- **2.15.8 — Final consistency sweep + regression** — spacing/typography/density token consistency across surfaces; full e2e green; screenshot review light+dark × phone+iPad.

---

## Banked findings (from the 2.12 iPad audit — address in the sub-steps above)

- **[2.15.1] `calc()` bugs** silently dropping padding: `evn(` typo `08-dark-theme-polish.css:757`; missing-space `+7rem` at `:438`.
- **[2.15.1] Phone scroll-runway `padding-bottom`** (7–15rem, to clear the floating bottom nav) recurs across `01-payoff-goals.css`, `04-debt-modals-focus.css`, several `08-dark-theme-polish.css` sections → dead space on iPad (no floating nav). Trim on iPad systematically.
- **[2.15.3] iPad dead-space** on Bills' Debts column; expand collapsibles by default where the taller iPad canvas has room.

---

## Per-surface audit log (fill as each sub-step runs)

| Surface | Phone L/D | iPad L/D | Findings | Status |
|---|---|---|---|---|
| Cross-cutting CSS (2.15.1) | — | — | 2 calc bugs + runway hack | ⬜ |
| Plan (2.15.2) | ⬜ | ⬜ | | ⬜ |
| Bills (2.15.3) | ⬜ | ⬜ | | ⬜ |
| Payoff (2.15.4) | ⬜ | ⬜ | | ⬜ |
| Goals (2.15.5) | ⬜ | ⬜ | | ⬜ |
| Settings + onboarding (2.15.6) | ⬜ | ⬜ | | ⬜ |
| Modals/overlays (2.15.7) | ⬜ | ⬜ | | ⬜ |
| Consistency sweep (2.15.8) | ⬜ | ⬜ | | ⬜ |
