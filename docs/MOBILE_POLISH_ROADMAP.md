# Paycheck Debt Planner — Mobile Polish Roadmap

_Companion to `ROADMAP.md` (features/tiers) and `IMPLEMENTATION_PLAN.md` (feature implementation). This document covers a different axis entirely: **visual craft, motion, haptics, and native feel** — not new functionality. Last updated 2026-06-23._

## Why this exists as its own track

`ROADMAP.md` sequences *what the app does*. This sequences *how it feels to use*. The two are deliberately decoupled: polish work should not block or be blocked by feature work, and a small polish pass can ship inside any version's release without derailing that version's actual scope. Treat each numbered phase below as a **parallel, low-risk addition to whichever version is currently in flight** — start at v1.2 since that's the next thing to ship, and fold subsequent phases into v1.3, v1.4, etc. as bandwidth allows. None of this is gated on feature sequencing.

**Hard constraint carried over from this codebase's existing refactor work: visual polish must not regress existing behavior.** Every phase below should ship with the same screenshot/visual-regression discipline already used for the CSS-split and component-split refactors earlier this session.

## 1. Where the app stands today (verified inventory)

A survey of the current codebase found a mixed picture — some areas are already premium-grade, others are the most generic-feeling parts of the app:

**Already strong, don't touch without reason:**
- Design token system (`app/styles/00-theme-and-base.css:1-111`) — full `--space-1`–`--space-6`, `--radius-*`, semantic color tokens. Mature, consistent, used everywhere.
- Dark mode (`app/styles/08-dark-theme-polish.css`) — true OLED-friendly palette with layered radial gradients and glow accents, not a naive color inversion. This is genuinely premium already.
- Safe-area-inset handling — notch/home-indicator aware across nav, modals, sheets.
- Swipe actions + pull-to-refresh (`SwipeActionCard.tsx`, `PullToRefresh.tsx`) — real gesture math (resistance, thresholds), not CSS-only fakery.

**Functional but generic — the actual gap:**
- **Icons are 100% emoji/Unicode** (🔒 🎯 ✔ › ↑↓) — no SVG icon system. This is the single highest-leverage "looks like a hobby app" signal in the whole UI.
- **Tab switches are instant** — no transition between Plan/Bills/Payoff/Goals. Every other piece of motion in the app (modals, swipes, pull-to-refresh) is animated; tab switching is the one major interaction that isn't.
- **Haptics cover ~40% of interactions** — present on swipes, pull-to-refresh, and form toggles, but absent from ordinary button taps, list-item taps, and tab switches. Inconsistent haptic coverage feels more jarring than no haptics at all, because the user can't predict which actions will respond.
- **Empty states are text-only** — bold heading + one sentence, no illustration or icon anchor. Every empty state in the app (debts, expenses, goals) looks the same and conveys nothing about *why* it's empty or what to do.
- **Skeleton loading is generic** — one shimmer pattern reused everywhere, not shaped to the content it's standing in for.
- **No app-wide list virtualization** — fine today, but flagged since "premium feel" includes not janking on a 100-debt power user.

**Desktop-ported patterns — verified via codebase audit, these feel like a responsive desktop layout rather than mobile-first design:**
- **Numbered click-pagination** in the debt list (`components/Debts/DebtGroup.tsx:43,72-75,130-162` — `PAGE_SIZE = 10`, prev/next arrow buttons + "Page X of Y" text). This is a desktop-table pattern; nothing on a phone-sized list of bills/debts should require clicking a page number.
- **Pervasive `:hover`-only feedback** — 15+ `:hover` rules across `app/styles/00-theme-and-base.css` (lines 385, 401-405, 491, 646, 651), `app/styles/03-nav-results-modals.css` (lines 201, 716), `app/styles/09-anim-swipe-media-misc.css` (line 369) on buttons, list rows, action pills, and collapse controls. None of these ever fire on a touch device — any information or affordance conveyed *only* via hover is invisible to every mobile user, every time.
- ~~4-column grid crammed onto phone width~~ — **verified non-issue (v1.2).** The Plan tab's execution summary strip uses `repeat(4, minmax(0, 1fr))` at base, but the existing `@media (max-width: 768px)` breakpoint correctly collapses it to 2 columns and nothing downstream overrides that. Confirmed via Playwright at a 390px viewport: computed `grid-template-columns` was `139px 139px`, rendering cleanly with no cramping. This item in the original audit was a misdiagnosis — no fix was needed.
- **Tap targets below Apple's 44×44pt HIG minimum** — `.smart-insight-icon` (`app/styles/01-payoff-goals.css:119-120`, 34×34) and the pagination buttons themselves (`.pagination-compact .text-action-button`, `app/styles/02-overdue-pagination-nav.css:206`, 32×32).
- **Enter-to-submit with no mobile affordance** — `components/PaycheckSection.tsx:61-65` listens for a literal Enter keydown to submit, with no `enterKeyHint` set on the underlying input, so the virtual keyboard shows a generic "return" key instead of a "Go"/"Done" key that would make the shortcut discoverable on a touch keyboard.

## 2. Sequencing — fold into existing version slots

| Phase | Ships in | Focus | Size |
|---|---|---|---|
| P1a | **v1.2** | Icon system foundation + highest-visibility chrome (bottom nav, primary buttons, settings sheet, App Lock screen) | Small-Medium |
| P2 | **v1.2** | Haptic coverage audit + completion | Small |
| P1b | **v1.3** | Icon system completion (modals, debt/expense rows, swipe actions, goals) | Small-Medium |
| P3 | **v1.3** | Tab-switch transitions + iPad-aware motion | Small |
| P4 | **v1.4** | Empty-state illustrations (pairs naturally with onboarding's new visual language) | Small-Medium |
| P5 | **v1.5** | Context-aware skeleton loading | Small |
| P6 | **v1.6** | Micro-interaction pass (button press states, list-item entrance, milestone celebration motion — pairs with v1.6's milestones feature) | Small |
| P7 | **Backlog, pre-v2.0** | List virtualization for large debt/expense lists | Small |
| P8 | **Backlog, unscheduled** | Custom modal transitions per context (sheet vs. centered, matching iOS HIG) | Medium |
| P9a | **v1.2** | Tap-target sizing fixes + execution-summary grid breakpoint + `enterKeyHint` pass | Small |
| P9b | **v1.3** | Pagination → mobile-native list pattern (debt list) | Small |
| P9c | **v1.4** | Hover-only feedback audit → touch-equivalent affordances | Small-Medium |

Every phase above is sized to ride alongside that version's existing feature scope without changing its size classification in `ROADMAP.md` — none of these are large enough on their own to justify inserting a new version number into the existing v1.2-v3.1 sequence, which would force renumbering everything downstream.

**Why this order:** Icons are the highest-visibility fix and touch the most surface area, so the work starts immediately (v1.2) rather than waiting — but it's split across two versions (P1a in v1.2, P1b in v1.3) since "replace every icon in the app" is too large to bundle into one version alongside that version's other scope without risking it becoming a "big bet," which this app's release philosophy explicitly avoids for v1.x. P1a covers the chrome a user sees in every session (nav, primary buttons, settings, lock screen); P1b mops up the rest (modals, rows, swipe actions) once v1.3's broader layout work is already touching many of those same files for iPad support — sequencing them together avoids touching the same components twice in adjacent versions. Haptics (P2) is small enough to finish entirely within v1.2 alongside P1a. Tab transitions (P3) lands in v1.3 alongside P1b for the same reason — both are quick, isolated, and compound with each other once both exist. Empty states (P4) are timed to land with onboarding (v1.4) since onboarding is already introducing new first-run visual language, and depends on P1 being fully complete (v1.3) so it can reuse that icon language rather than doing illustration twice. P5-P6 are timed to pair with features that naturally need them (history view, milestones). P7-P8 are real but not urgent — backlog until there's a concrete trigger (a user with 50+ debts, or a specific HIG-compliance push).

The desktop-pattern fixes (P9a-c) slot in alongside the work already happening each version rather than getting their own dedicated slots: P9a (v1.2) is pure CSS/attribute tweaks, low effort, pairs naturally with P1a/P2's general touch-quality focus. P9b (v1.3) targets `DebtGroup.tsx`, which P1b is already touching for its icon pass — fixing pagination in the same version avoids a third visit to that file. P9c (v1.4) is the widest-reaching of the three (touches buttons/rows/chips across most components, similar profile to the icon migration) and is timed for v1.4 since by then P1a+P1b have already established the visual language for what a "touch-active" state should look like, so the hover audit can standardize on that rather than inventing yet another visual treatment.

## 3. Phase details (what "done" looks like)

### P1a — Icon system foundation (v1.2) — done
Stood up `lib/icons/index.ts` (lucide-react) and replaced icons in the chrome used every session: bottom nav, theme toggle, settings gear, section switcher, App Lock screen.

### P2 — Haptic coverage completion (v1.2) — done
Audited every `onClick` handler across `app/page.tsx`, `PaycheckSection.tsx`, `GoalsSection.tsx`, `DebtsSection.tsx`, `RequiredExpensesSection.tsx`, and `LivingExpensesSection.tsx`. Added light haptic to tab switches, the Bills section switcher, and previously-uncovered close/cancel/pagination buttons; added medium haptic to "Calculate plan," "Start Next Pay Cycle," "Add Goal," and "Remove" actions. Several handlers (`startEditing`, `saveEditing`, `handleAddDebt`, etc.) already had haptics built in — those were left untouched to avoid double-firing.

### P1b — Icon system completion (v1.3)
Finish the migration: modals (Add Debt/Add Expense), debt/expense rows, swipe actions, goals. Target: zero `aria-label`-less icon-only buttons remain anywhere in the app, and every icon shares stroke weight/scale.

### P3 — Tab-switch transitions (v1.3)
Add a short (150-200ms) cross-fade or slide between bottom-nav tab changes, consistent with the existing `cubic-bezier(0.2, 0.9, 0.2, 1)` easing already used for swipe responsiveness elsewhere in the app — reuse that curve rather than inventing a second one. Verify it doesn't conflict with iPad's two-column layout (v1.3) before/while building this.

### P4 — Empty-state illustrations (v1.4)
Each of the three empty states (debts, expenses, goals) gets a small inline SVG illustration above the existing text, themed to match the icon system from P1a/P1b. No new copy needed — the existing text is fine, it's the visual anchor that's missing.

### P5 — Context-aware skeleton loading (v1.5)
Replace the single generic shimmer with shapes that match what they're standing in for (a debt-row skeleton looks like a debt row, not a generic card).

### P6 — Micro-interaction pass (v1.6)
Button press states (the existing `:active` scale transforms are a good foundation — audit for consistency across all button variants), list-item entrance animation reuse (the existing `planItemReveal`/`planSectionReveal` keyframes are good — confirm they're applied everywhere a list grows, not just on the Plan tab), and milestone celebration motion timed with v1.6.

### P7 — List virtualization (backlog, pre-v2.0)
Only build this once there's a concrete need signal (real user with a large list, or a profiling result showing jank) — don't build ahead of evidence.

### P8 — Modal transition audit (backlog, unscheduled)
Survey every modal/sheet in the app and classify each as "should be a bottom sheet" vs. "should be a centered modal" per iOS HIG conventions, then make the transition style match the classification consistently (today's `.settings-overlay` pattern is reused for several different modal *kinds* with one transition style).

### P9a — Tap targets, grid breakpoint, keyboard hints (v1.2) — done
Bumped `.smart-insight-icon` and the pagination buttons to a 44×44pt minimum hit area. Added `enterKeyHint="done"` to the paycheck amount input. The execution-summary grid breakpoint was investigated and verified already correct — no fix needed (see §1 above).

### P9b — Pagination → mobile-native list pattern (v1.3)
Replace `DebtGroup.tsx`'s numbered click-pagination with a mobile-standard pattern — most likely a "Load More" tap target at the list's end, or true infinite scroll if the gesture/scroll-listener cost is low; either removes the "Page X of Y" desktop-table framing entirely. Land alongside P1b since both already touch this file.

### P9c — Hover-only feedback audit (v1.4)
Every `:hover`-only rule across the CSS (buttons, list rows, action pills, collapse controls) gets an equivalent `:active`/touch-triggered state, since `:hover` never fires on a touch device — any feedback that exists *only* on hover is currently invisible to every mobile user. Standardize on the touch-active visual language already established by P1a/P1b's icon work rather than inventing a new one.

## 4. What's explicitly out of scope here

- Any new feature, data model change, or tier gating — that's `ROADMAP.md`'s job.
- Android-specific polish — covered under v1.12 in `ROADMAP.md` once the Android build exists; revisit this document's icon/haptic/motion work for Android parity at that point, don't duplicate effort now.
- Accessibility audit — that's its own explicit roadmap item (v1.12 in `ROADMAP.md`); some of this work (icon `aria-label`s in P1, color-not-as-only-signal in empty states P4) overlaps and should be done with that audit in mind, but a full audit is a separate effort.

**One standing rule that isn't its own phase:** starting with P3 (v1.3, the first phase to add real motion), every new animation must ship with a `prefers-reduced-motion` fallback — verified zero such media queries exist anywhere in the CSS today. This was folded into P3 and P6's implementation steps directly rather than getting its own phase number, but it applies to any future motion work too, not just those two.
