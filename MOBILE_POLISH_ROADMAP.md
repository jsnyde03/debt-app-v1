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

## 2. Sequencing — fold into existing version slots

| Phase | Pairs with | Focus | Size |
|---|---|---|---|
| P1 | v1.2 | Icon system migration (emoji → SVG icon set) | Medium |
| P2 | v1.2/v1.3 | Haptic coverage audit + completion | Small |
| P3 | v1.3 | Tab-switch transitions + iPad-aware motion | Small |
| P4 | v1.4 | Empty-state illustrations (pairs naturally with onboarding's new visual language) | Small-Medium |
| P5 | v1.5 | Context-aware skeleton loading | Small |
| P6 | v1.6 | Micro-interaction pass (button press states, list-item entrance, milestone celebration motion — pairs with v1.6's milestones feature) | Small |
| P7 | Backlog, pre-v2.0 | List virtualization for large debt/expense lists | Small |
| P8 | Backlog | Custom modal transitions per context (sheet vs. centered, matching iOS HIG) | Medium |

**Why this order:** Icons (P1) are the highest-visibility fix and touch the most surface area, so they go first while the codebase is still small. Haptics (P2) and tab transitions (P3) are cheap, isolated, and compound with each other — once both exist, the app's general "responsiveness" jumps noticeably for low effort. Empty states (P4) are timed to land with onboarding (v1.4) since onboarding is already introducing new first-run visual language — reuse that work rather than doing empty-state illustration twice. P5-P6 are timed to pair with features that naturally need them (history view, milestones). P7-P8 are real but not urgent — backlog until there's a concrete trigger (a user with 50+ debts, or a specific HIG-compliance push).

## 3. Phase details (what "done" looks like)

### P1 — Icon system migration
Replace every emoji/Unicode glyph used as a UI icon (not emoji used as actual content, like a celebration 🎉 in a completion message — that's fine) with a consistent SVG icon set. Target: zero `aria-label`-less icon-only buttons remain, and every icon shares stroke weight/scale.

### P2 — Haptic coverage completion
Audit every `onClick`/`onTouchEnd` handler app-wide. Add light haptic to: tab switches, primary button taps, list-item taps that open a detail/edit view. Keep medium/success haptics reserved for commit-level actions (already correct today — don't widen that). Goal: a user should be able to predict "did that work?" from feel alone on every interactive surface, not just swipes.

### P3 — Tab-switch transitions
Add a short (150-200ms) cross-fade or slide between bottom-nav tab changes, consistent with the existing `cubic-bezier(0.2, 0.9, 0.2, 1)` easing already used for swipe responsiveness elsewhere in the app — reuse that curve rather than inventing a second one. Verify it doesn't conflict with iPad's two-column layout (v1.3) before/while building this.

### P4 — Empty-state illustrations
Each of the three empty states (debts, expenses, goals) gets a small inline SVG illustration above the existing text, themed to match the icon system from P1. No new copy needed — the existing text is fine, it's the visual anchor that's missing.

### P5 — Context-aware skeleton loading
Replace the single generic shimmer with shapes that match what they're standing in for (a debt-row skeleton looks like a debt row, not a generic card).

### P6 — Micro-interaction pass
Button press states (the existing `:active` scale transforms are a good foundation — audit for consistency across all button variants), list-item entrance animation reuse (the existing `planItemReveal`/`planSectionReveal` keyframes are good — confirm they're applied everywhere a list grows, not just on the Plan tab), and milestone celebration motion timed with v1.6.

### P7 — List virtualization
Only build this once there's a concrete need signal (real user with a large list, or a profiling result showing jank) — don't build ahead of evidence.

### P8 — Modal transition audit
Survey every modal/sheet in the app and classify each as "should be a bottom sheet" vs. "should be a centered modal" per iOS HIG conventions, then make the transition style match the classification consistently (today's `.settings-overlay` pattern is reused for several different modal *kinds* with one transition style).

## 4. What's explicitly out of scope here

- Any new feature, data model change, or tier gating — that's `ROADMAP.md`'s job.
- Android-specific polish — covered under v1.12 in `ROADMAP.md` once the Android build exists; revisit this document's icon/haptic/motion work for Android parity at that point, don't duplicate effort now.
- Accessibility audit — that's its own explicit roadmap item (v1.12 in `ROADMAP.md`); some of this work (icon `aria-label`s in P1, color-not-as-only-signal in empty states P4) overlaps and should be done with that audit in mind, but a full audit is a separate effort.
