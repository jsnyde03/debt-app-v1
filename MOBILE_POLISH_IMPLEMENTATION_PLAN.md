# Mobile Polish — Implementation Plan

_Companion to `MOBILE_POLISH_ROADMAP.md`, which defines the **what/why/sequencing**. This document defines the **how**: files touched, concrete steps, and verification per phase. Last updated 2026-06-23._

---

## P1 — Icon system migration

**Current state (verified):** Every icon in the app is an emoji or Unicode glyph, inline in JSX (e.g. `components/GoalsSection.tsx`, `components/DebtRow.tsx`, `components/AppLockScreen.tsx`). No icon library is installed.

**Implementation steps:**
1. Pick a small, tree-shakeable SVG icon set — `lucide-react` is the recommended default (consistent 24x24 stroke-based icons, actively maintained, no large bundle cost since it's per-icon imports). Evaluate at implementation time but don't over-deliberate; this app already keeps its dependency footprint deliberately small, and lucide is a single well-scoped addition.
2. New `lib/icons/index.ts` — re-export the small subset of icons actually used (lock, shield, target, check, chevron-down/up/right, arrow-up/down, settings/gear, plus/add, etc.), so call sites import from one internal module rather than directly from the library. This keeps a future icon-library swap to one file.
3. Grep every component for emoji/Unicode glyphs used as UI icons (not celebratory/decorative emoji in copy — e.g. the 🎉 in `CompletionStep.tsx` stays, that's content, not a UI control). Replace icon-only buttons' glyphs with the matching SVG icon component.
4. Every icon-only button gets an explicit `aria-label` if it doesn't already have one — this phase is a natural place to close that gap since you're touching every one anyway (gets ahead of v1.12's accessibility audit in `ROADMAP.md`, doesn't replace it).
5. Size/stroke consistency: standardize on one icon size per context (e.g. 18px inline, 24px standalone button) via a CSS class or the icon component's `size` prop — don't let call sites pick arbitrary sizes.

**Files touched:** new `lib/icons/index.ts`; every component currently using emoji as a UI glyph — expect this to touch most files under `components/` (`DebtRow.tsx`, `DebtGroup.tsx`, `ExpenseListItem.tsx`, `GoalsSection.tsx`, `AppLockScreen.tsx`, `SwipeActionCard.tsx`, bottom nav in `app/page.tsx`, settings sheet rows, etc.) — this is the widest-reaching phase in the whole polish plan, do it first while the codebase is smallest.

**Testing:** Visual regression via Playwright screenshots — capture every tab + the settings sheet + onboarding (if v1.4 has landed) before and after, diff manually (no automated visual-diff tooling exists yet; same manual-screenshot-review pattern already used for the component-split refactor and onboarding work this session). `npm run lint` will catch unused emoji-string leftovers if any component still imports them.

**Risk:** Medium — wide surface area (many files touched), but each individual change is mechanical (swap a glyph for a component) and low-logic-risk. The risk is missing a spot, not breaking behavior. Do it file-by-file with a visual check per file, not as one giant find-replace.

---

## P2 — Haptic coverage completion

**Current state (verified):** `lib/mobile/haptics.ts` exposes light/medium/success haptic triggers. Used in ~40 call sites today, concentrated in `SwipeActionCard.tsx`, `PullToRefresh.tsx`, and form-toggle handlers in `app/page.tsx`/`DebtGroup.tsx`/`DebtRow.tsx`/`DebtsSection.tsx`. Ordinary buttons and tab switches currently have no haptic feedback.

**Implementation steps:**
1. Audit pass: grep every `onClick` in `app/page.tsx` and every component under `components/` for bottom-nav tab buttons, primary action buttons (Calculate plan, Add Debt, Add Expense, Add Goal, etc.), and list-item taps that open an edit/detail state. Build a checklist (can live as a comment block in `lib/mobile/haptics.ts` or a scratch list during the work, not a permanent doc).
2. Add `triggerLightHaptic()` (already exists per the haptics file) to: bottom-nav tab switches, every primary button tap not already covered, list-item row taps.
3. Explicitly do **not** add haptics to: passive state changes (e.g. autosave ticking), non-interactive renders, or anything already covered (don't double-trigger on swipe-actions that already haptic on threshold/commit).
4. Keep medium/success reserved for actual commit-level actions (debt added, expense marked paid, plan calculated) — this tiering already exists and is correct; P2 is about *coverage*, not changing which tier means what.

**Files touched:** `app/page.tsx` (bottom nav buttons), and any component with a primary action button or list-row tap currently missing a haptic call — likely `DebtRow.tsx`, `ExpenseListItem.tsx`, `GoalsSection.tsx`, `ResultsSection.tsx`/its split children.

**Testing:** No automated test for actual haptic firing (Playwright can't observe device haptics), but each haptic call should be paired with the action it's attached to in a way that's covered by existing e2e specs already clicking those buttons — i.e. if the click is already tested, adding a haptic call inside that same handler doesn't need a new test, just manual on-device confirmation that nothing throws (haptics fail silently on non-native/web per the existing implementation, so this is low-risk even untested).

**Risk:** Low. Additive-only, no logic changes, haptics already fail gracefully outside native context per existing code.

---

## P3 — Tab-switch transitions

**Current state (verified):** Bottom-nav tab switching in `app/page.tsx` swaps `activeTab` state with zero transition — the new tab's content appears instantly. Existing motion in the app uses `cubic-bezier(0.2, 0.9, 0.2, 1)` for swipe responsiveness and a separate `cubic-bezier(0.2, 0.8, 0.2, 1)` for button/list-item transforms, both in `app/styles/09-anim-swipe-media-misc.css`.

**Implementation steps:**
1. New CSS class `.tab-content-transition` (or similar) added to whichever element wraps each tab's rendered content in `app/page.tsx` — likely the top-level conditional render per `activeTab` value.
2. Use a CSS-only cross-fade: on tab change, apply a short `opacity`/`translateY` keyframe (reuse the `cubic-bezier(0.2, 0.9, 0.2, 1)` curve already established, 150-200ms) rather than introducing a JS animation library — this app has no animation library dependency today and that's worth preserving for a simple cross-fade.
3. Verify behavior under React's render cycle: since `activeTab` swaps which JSX subtree renders, the cleanest approach is animating the *new* subtree in on mount (a `key`-based remount with a CSS animation on mount) rather than trying to crossfade out the old one, to avoid extra state tracking. Confirm this doesn't reset scroll position unexpectedly on tabs with long content (Bills, Payoff) — test explicitly.
4. Check interaction with v1.3's iPad two-column layout (if landed) — confirm the transition doesn't look wrong when one column is wider than the other.

**Files touched:** `app/page.tsx` (tab content wrapper), `app/styles/09-anim-swipe-media-misc.css` (new keyframe + class, added near existing animation definitions to keep them co-located).

**Testing:** Manual visual check across all 4 tabs, both themes, both iPhone and iPad viewports (Playwright screenshot before/after on each `activeTab` value). No regression test needed — this is pure presentation with no state logic changes.

**Risk:** Low. Isolated to one render wrapper and one new CSS animation; verify scroll-position behavior explicitly since that's the one thing that could feel broken if done wrong.

---

## P4 — Empty-state illustrations

**Current state (verified):** Empty states for debts/expenses/goals are text-only — bold heading + one descriptive sentence inside a styled background card (`.empty-debt-state` and equivalents in `app/styles/00-theme-and-base.css:441-450`, dark-mode variant in `app/styles/08-dark-theme-polish.css:491-496`).

**Implementation steps:**
1. Depends on P1 landing first (reuses the same icon/illustration visual language) — sequence accordingly.
2. Three small inline SVG illustrations (or large single-icon-as-illustration treatments, simpler than full custom art — evaluate effort vs. payoff at implementation time, a oversized line-icon in a circle is a legitimate "illustration" for this scope) for: no debts, no expenses, no goals.
3. Add the illustration above the existing heading/text in each empty-state render location — likely within `DebtsSection.tsx`/`DebtGroup.tsx`, `RequiredExpensesSection.tsx`/its split children, `GoalsSection.tsx`.
4. No copy changes needed — existing text stays, this is additive visual anchoring only.

**Files touched:** `DebtsSection.tsx` (or `DebtGroup.tsx`), `RequiredExpensesSection.tsx` (or its split `ExpenseListItem`/parent), `GoalsSection.tsx`, plus the new icon/illustration assets from `lib/icons/`.

**Testing:** Visual check per empty state, both themes. No logic risk — purely additive markup.

**Risk:** Low. Sequenced after P1 to avoid rework; otherwise isolated and additive.

---

## P5 — Context-aware skeleton loading

**Current state (verified):** `components/AppSkeleton.tsx` renders one generic shimmer pattern (placeholder cards + nav items) regardless of what's actually loading, using the `skeletonShimmer` keyframe in `app/styles/09-anim-swipe-media-misc.css:535-542`.

**Implementation steps:**
1. Split `AppSkeleton.tsx` into shape-specific skeleton pieces (e.g. a debt-row-shaped skeleton, a plan-summary-shaped skeleton) that compose into the same overall loading screen, reusing the existing shimmer keyframe/timing — this is a structure change, not a new animation.
2. Render the appropriate composed skeleton based on which tab would be active on load (mirrors the real layout more closely than one generic card stack).

**Files touched:** `components/AppSkeleton.tsx` (split into sub-components, likely a new `components/Skeleton/` directory following this codebase's established pattern of splitting oversized components into a subdirectory).

**Testing:** Visual check only — confirm the skeleton silhouette roughly matches the real content it's standing in for, on each tab.

**Risk:** Low. Purely presentational, shown only during the brief initial-mount window.

---

## P6 — Micro-interaction pass

**Current state (verified):** `:active` scale transforms (`scale(0.965-0.992)`) exist on buttons already. `planSectionReveal`/`planItemReveal` keyframes exist for list entrance animation but are confirmed only on the Plan tab — not verified elsewhere lists grow (e.g. adding a new debt/expense/goal).

**Implementation steps:**
1. Audit every button variant (`.primary-button`, `.secondary-button`, icon-only buttons, swipe-action buttons) for consistent `:active` treatment — fix any that are missing it rather than introducing new ones.
2. Apply the existing `planItemReveal` keyframe (or an equivalent) to newly-added list items on the Bills/Debts/Goals tabs, not just Plan — confirm this doesn't fire on initial mount/load (should only animate genuinely new items, not the whole list on every render).
3. Pairs with v1.6's milestone feature: when a milestone badge triggers (per `ROADMAP.md`/`IMPLEMENTATION_PLAN.md` v1.6), give it a celebratory entrance (scale+fade, reusing existing easing curves) rather than appearing instantly.

**Files touched:** `app/styles/09-anim-swipe-media-misc.css` (audit/extend existing keyframes), list-rendering components wherever new items are appended (`DebtGroup.tsx`, expense list parent, `GoalsSection.tsx`), `components/MilestoneBadge.tsx` once v1.6 exists.

**Testing:** Manual check — add a debt/expense/goal and confirm only the new item animates in, not the whole list. No regression test needed (presentation-only).

**Risk:** Low-medium. The "only animate genuinely new items, not the whole list" requirement is the one thing that needs care — get this wrong and re-renders could cause every item to flash/re-animate on unrelated state changes. Use a stable `key` per item (should already exist if list rendering uses `.map()` with proper keys) and trigger animation via CSS `@starting-style`/animation-on-mount patterns scoped to genuinely new DOM nodes, not via a re-triggerable class toggle.

---

## P7 — List virtualization

**Not scheduled.** No implementation plan written yet — revisit only once there's a concrete trigger (real user report of lag with a large list, or a profiling result). If/when triggered: `react-window` or `@tanstack/react-virtual` are the standard low-dependency-footprint options; evaluate at that time rather than pre-selecting now.

---

## P8 — Modal transition audit

**Current state (verified):** `.settings-overlay` pattern (and its `modalUp`/`slideUpSheet`/`centerModalIn` keyframes, already present in `app/styles/09-anim-swipe-media-misc.css`) is reused across several different modal *kinds* — plan settings, add-debt/add-expense modals, onboarding (once v1.4 lands), upgrade paywall — with inconsistent application of which keyframe each uses.

**Implementation steps:**
1. Classify every current modal/sheet by intended iOS HIG pattern: **bottom sheet** (partial-height, swipe-to-dismiss feel — settings, add-item forms) vs. **centered modal** (full attention, no swipe-dismiss — upgrade paywall, confirmation dialogs).
2. Audit current usage of `modalUp` vs `slideUpSheet` vs `centerModalIn` against that classification; fix any modal using the "wrong" pattern for its kind.
3. Standardize: every bottom-sheet-kind modal uses the same entrance/exit keyframe pair; every centered-modal-kind uses the other consistently.

**Files touched:** `app/styles/09-anim-swipe-media-misc.css` (keyframe usage), each modal-rendering component (`AddDebtModal.tsx`, `AddExpenseModal.tsx`, plan settings sheet in `app/page.tsx`, upgrade modal).

**Testing:** Visual check per modal, both themes.

**Risk:** Low. Classification work + applying existing keyframes consistently — no new motion system, just consistent use of what's already built.

---

## Summary: sequencing risks to watch

1. **P1 (icons) touches the most files of any phase** — do it first while the codebase is smallest, and do it incrementally (file-by-file with a visual check), not as one sweeping change.
2. **P4 depends on P1** — don't start empty-state illustrations before the icon system exists, or you'll redo the visual language twice.
3. **P6's "only animate new items" requirement is the one real correctness risk in this whole plan** — get the keyed-animation-on-mount pattern right, or list re-renders will look worse than today's instant-appear baseline.
4. **None of P1-P6 require new dependencies except P1's icon library** — keep it that way; this app's small dependency footprint is a deliberate strength, don't reach for an animation library for what CSS keyframes already handle.
