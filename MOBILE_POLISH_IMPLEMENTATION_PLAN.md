# Mobile Polish — Implementation Plan

_Companion to `MOBILE_POLISH_ROADMAP.md`, which defines the **what/why/sequencing**. This document defines the **how**: files touched, concrete steps, and verification per phase. Last updated 2026-06-23._

## Version assignment at a glance

| Version | Phases shipping | What lands |
|---|---|---|
| **v1.2** | P1a, P2, P9a | Icon foundation + nav/buttons/settings/lock screen icons; full haptic coverage; tap-target/grid-breakpoint/keyboard-hint fixes |
| **v1.3** | P1b, P3, P9b | Remaining icons (modals/rows/swipe actions/goals); tab-switch transitions; pagination → mobile-native list pattern |
| **v1.4** | P4, P9c | Empty-state illustrations; hover-only feedback audit |
| **v1.5** | P5 | Context-aware skeleton loading |
| **v1.6** | P6 | Micro-interaction pass + milestone celebration motion |
| **Backlog, pre-v2.0** | P7 | List virtualization (trigger-based, not scheduled to a version) |
| **Backlog, unscheduled** | P8 | Modal transition audit |

Every phase below carries its own **Ships in: vX.X** line so there's no ambiguity about where a given piece of work lands. None of this changes the size classification of the version it rides alongside in `ROADMAP.md` — each phase is scoped small enough to fit beside that version's existing feature work, not to replace or expand it.

---

## P1a — Icon system foundation

**Status: done.** Installed `lucide-react`, added `lib/icons/index.ts`, replaced icons in bottom nav, theme toggle, settings gear, the Bills section switcher, and `AppLockScreen.tsx`. All icon-only buttons in scope already had `aria-label`s from prior work — no gaps found.

**Ships in: v1.2**, alongside notifications/App Store review/App Lock.

**Current state (verified):** Every icon in the app is an emoji or Unicode glyph, inline in JSX (e.g. `components/GoalsSection.tsx`, `components/DebtRow.tsx`, `components/AppLockScreen.tsx`). No icon library is installed.

**Implementation steps:**
1. Pick a small, tree-shakeable SVG icon set — `lucide-react` is the recommended default (consistent 24x24 stroke-based icons, actively maintained, no large bundle cost since it's per-icon imports). Evaluate at implementation time but don't over-deliberate; this app already keeps its dependency footprint deliberately small, and lucide is a single well-scoped addition.
2. New `lib/icons/index.ts` — re-export the small subset of icons actually used (lock, shield, target, check, chevron-down/up/right, arrow-up/down, settings/gear, plus/add, etc.), so call sites import from one internal module rather than directly from the library. This keeps a future icon-library swap to one file.
3. Replace icons in this version's scope only: bottom nav (`app/page.tsx`), primary buttons app-wide (`.primary-button`/`.secondary-button` icon usage), the settings sheet, and `AppLockScreen.tsx` (🔒/🛡️). Leave modals, debt/expense rows, swipe actions, and goals for P1b (v1.3) — don't scope-creep into those files this version.
4. Every icon-only button touched in this slice gets an explicit `aria-label` if it doesn't already have one (gets ahead of v1.12's accessibility audit in `ROADMAP.md`, doesn't replace it).
5. Size/stroke consistency: standardize on one icon size per context (e.g. 18px inline, 24px standalone button) via a CSS class or the icon component's `size` prop — don't let call sites pick arbitrary sizes. This convention, once set here, carries forward unchanged into P1b.

**Files touched:** new `lib/icons/index.ts`; `app/page.tsx` (bottom nav, settings sheet), `AppLockScreen.tsx`, shared button styles/components.

**Testing:** Visual regression via Playwright screenshots — capture every tab + the settings sheet + lock screen before and after, diff manually (no automated visual-diff tooling exists yet; same manual-screenshot-review pattern already used for the component-split refactor and onboarding work this session). `npm run lint` will catch unused emoji-string leftovers if any component still imports them.

**Risk:** Low-medium — scoped to a handful of files this version, each change mechanical (swap a glyph for a component) and low-logic-risk. The risk is missing a spot, not breaking behavior.

---

## P2 — Haptic coverage completion

**Status: done.** Audited every `onClick` across `app/page.tsx`, `PaycheckSection.tsx`, `GoalsSection.tsx`, `DebtsSection.tsx`, `RequiredExpensesSection.tsx`, and `LivingExpensesSection.tsx`. Added light haptic to: tab switches, the Bills section switcher, the Settings "Close" button, the Add Debt modal's "Close," goal pagination, and expense pagination. Added medium haptic to: "Calculate plan," "Start Next Pay Cycle," the goal "Save" and "Remove" actions, and the expense "Remove" action. Found several handlers that already had haptics built in (`startEditing`, `saveEditing` in DebtsSection, `handleAddDebt`, `handleAddGoal`) — left those untouched to avoid double-firing.

**Ships in: v1.2**, alongside P1a.

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

## P9a — Tap targets, grid breakpoint, keyboard hints

**Status: done — with one correction.** Bumped `.smart-insight-icon` (`app/page.css`, was 34×34) and `.pagination-compact .text-action-button` (was 32×32) to 44×44. Added `enterKeyHint="done"` to the paycheck amount input in `PaycheckSection.tsx`.

The execution-summary grid breakpoint was investigated and **found to already work correctly** — verified via Playwright at a 390px viewport (iPhone 14 width): computed `grid-template-columns` was `139px 139px` (2 columns), and the rendered screenshot showed a clean layout with no cramping. The `@media (max-width: 768px)` rule already collapses the grid correctly and nothing downstream overrides it. The original audit's claim here was a misdiagnosis — no CSS change was made for this item.

**Ships in: v1.2**, alongside P1a/P2.

---

## P1b — Icon system completion

**Ships in: v1.3**, alongside iPad support.

**Current state (verified):** Same icon inventory as P1a's "Current state," minus whatever P1a already converted. By the time this phase starts, the icon library (`lib/icons/index.ts`) and sizing convention from P1a already exist — this phase only extends usage, it doesn't re-decide the system.

**Implementation steps:**
1. Replace remaining emoji/Unicode UI glyphs in: `AddDebtModal.tsx`, `AddExpenseModal.tsx`, `DebtRow.tsx`, `DebtGroup.tsx`, `ExpenseListItem.tsx`, `GoalsSection.tsx`, `SwipeActionCard.tsx`, and any sort/filter chevrons (↑↓) still remaining in list headers.
2. Do not touch celebratory/decorative emoji used as content (e.g. the 🎉 in `CompletionStep.tsx` once v1.4 onboarding lands, or milestone celebration copy later) — only UI-control glyphs are in scope, same rule as P1a.
3. `aria-label` pass on every icon-only button touched in this slice, same as P1a.
4. Since v1.3 is already touching layout broadly for iPad (per `IMPLEMENTATION_PLAN.md`'s v1.3 section), do a quick check that icon sizing holds up at the iPad two-column breakpoint — no separate icon sizing system for iPad, just confirm the existing convention scales acceptably.
5. After this phase, zero emoji/Unicode UI glyphs should remain anywhere in the app — confirm with a final grep pass before calling P1 (both halves) done.

**Files touched:** `AddDebtModal.tsx`, `AddExpenseModal.tsx`, `DebtRow.tsx`, `DebtGroup.tsx`, `ExpenseListItem.tsx`, `GoalsSection.tsx`, `SwipeActionCard.tsx`.

**Testing:** Same visual-regression-via-screenshot approach as P1a, covering the modals/rows/swipe actions specifically. Final grep for emoji/Unicode glyph patterns across `components/` as a completion check.

**Risk:** Low-medium, same profile as P1a — mechanical swaps, risk is missing a spot rather than breaking behavior.

---

## P3 — Tab-switch transitions

**Ships in: v1.3**, alongside P1b.

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

## P9b — Pagination → mobile-native list pattern

**Ships in: v1.3**, alongside P1b (both already touch `DebtGroup.tsx`).

**Current state (verified):** `components/Debts/DebtGroup.tsx` implements numbered click-pagination (`PAGE_SIZE = 10`, lines 43, 72-75, 130-162) — prev/next arrow buttons plus "Page X of Y" text. No swipe or scroll-based alternative exists. This is the only confirmed pagination instance in the app (the `RequiredExpenses` list doesn't paginate the same way — verify at implementation time whether it shares the same `pagination-compact` CSS class for any reason before assuming it's debt-list-only).

**Implementation steps:**
1. Replace the numbered page buttons with a single "Load More" control at the end of the visible list — tapping it reveals the next `PAGE_SIZE` items, appended rather than replacing the page (standard mobile list pattern, e.g. App Store/Mail).
2. Evaluate true infinite scroll (auto-load on scroll-near-bottom) as an alternative if the "Load More" tap feels like an unnecessary extra step once built — decide based on feel, not in advance.
3. Remove the "Page X of Y" text entirely — it's a desktop-table framing with no equivalent need once paging is replaced by progressive reveal.
4. Confirm `DebtRow.tsx`'s existing swipe actions and the new load-more control don't visually compete for the same screen space at the bottom of the list.

**Files touched:** `components/Debts/DebtGroup.tsx`, `app/styles/02-overdue-pagination-nav.css` (pagination styles replaced with load-more styling).

**Testing:** Manual check with a debt list over `PAGE_SIZE` items — confirm Load More reveals the next batch correctly and no items are duplicated/dropped at the boundary. No regression test needed (pure UI/rendering change, no data mutation).

**Risk:** Low-medium. The boundary logic (which items are visible after N taps of "Load More") needs care to avoid off-by-one errors, but this is presentation-layer only — no debt data or math is touched.

---

## P4 — Empty-state illustrations

**Ships in: v1.4**, alongside the onboarding flow.

**Current state (verified):** Empty states for debts/expenses/goals are text-only — bold heading + one descriptive sentence inside a styled background card (`.empty-debt-state` and equivalents in `app/styles/00-theme-and-base.css:441-450`, dark-mode variant in `app/styles/08-dark-theme-polish.css:491-496`).

**Implementation steps:**
1. Depends on P1a+P1b landing first (v1.2/v1.3, reuses the same icon/illustration visual language) — sequence accordingly.
2. Three small inline SVG illustrations (or large single-icon-as-illustration treatments, simpler than full custom art — evaluate effort vs. payoff at implementation time, a oversized line-icon in a circle is a legitimate "illustration" for this scope) for: no debts, no expenses, no goals.
3. Add the illustration above the existing heading/text in each empty-state render location — likely within `DebtsSection.tsx`/`DebtGroup.tsx`, `RequiredExpensesSection.tsx`/its split children, `GoalsSection.tsx`.
4. No copy changes needed — existing text stays, this is additive visual anchoring only.

**Files touched:** `DebtsSection.tsx` (or `DebtGroup.tsx`), `RequiredExpensesSection.tsx` (or its split `ExpenseListItem`/parent), `GoalsSection.tsx`, plus the new icon/illustration assets from `lib/icons/`.

**Testing:** Visual check per empty state, both themes. No logic risk — purely additive markup.

**Risk:** Low. Sequenced after P1a/P1b to avoid rework; otherwise isolated and additive.

---

## P9c — Hover-only feedback audit

**Ships in: v1.4**, alongside P4.

**Current state (verified):** 15+ `:hover`-only rules exist with no touch equivalent: `app/styles/00-theme-and-base.css` (lines 385, 401-405, 491, 646, 651 — primary/secondary buttons, saved-item rows, collapsible headers), `app/styles/03-nav-results-modals.css` (lines 201, 716 — action pills, section-collapse buttons), `app/styles/09-anim-swipe-media-misc.css` (line 369 — saved-item lift effect). None of these ever fire on a touch device, so any feedback or affordance conveyed only through them is currently invisible to every mobile user.

**Implementation steps:**
1. Grep every `:hover` rule across `app/styles/*.css` and classify each as: (a) purely decorative (fine to leave hover-only, degrades gracefully to "nothing happens," no information lost) vs. (b) conveys real feedback a touch user needs (background change confirming tap registered, elevation indicating interactivity).
2. For category (b), add an equivalent `:active` rule (or extend an existing one) using the touch-active visual language already established by P1a/P1b's icon work — don't invent a third visual treatment for "pressed" state.
3. Leave category (a) as-is — desktop/trackpad users still benefit, and removing them serves no mobile purpose.

**Files touched:** `app/styles/00-theme-and-base.css`, `app/styles/03-nav-results-modals.css`, `app/styles/09-anim-swipe-media-misc.css` — likely others once the full grep is run.

**Testing:** Manual check on an actual touch device/simulator (not a mouse-equipped browser, which would still trigger `:hover` and mask the gap) — tap every button/row/pill category and confirm visible feedback appears.

**Risk:** Low-medium. Mechanical CSS additions, but requires touch-device testing specifically — testing in a desktop browser with a mouse won't reveal whether the fix actually worked, since the mouse will trigger the very `:hover` rules being audited.

---

## P5 — Context-aware skeleton loading

**Ships in: v1.5**, alongside Pay Cycle History.

**Current state (verified):** `components/AppSkeleton.tsx` renders one generic shimmer pattern (placeholder cards + nav items) regardless of what's actually loading, using the `skeletonShimmer` keyframe in `app/styles/09-anim-swipe-media-misc.css:535-542`.

**Implementation steps:**
1. Split `AppSkeleton.tsx` into shape-specific skeleton pieces (e.g. a debt-row-shaped skeleton, a plan-summary-shaped skeleton) that compose into the same overall loading screen, reusing the existing shimmer keyframe/timing — this is a structure change, not a new animation.
2. Render the appropriate composed skeleton based on which tab would be active on load (mirrors the real layout more closely than one generic card stack).

**Files touched:** `components/AppSkeleton.tsx` (split into sub-components, likely a new `components/Skeleton/` directory following this codebase's established pattern of splitting oversized components into a subdirectory).

**Testing:** Visual check only — confirm the skeleton silhouette roughly matches the real content it's standing in for, on each tab.

**Risk:** Low. Purely presentational, shown only during the brief initial-mount window.

---

## P6 — Micro-interaction pass

**Ships in: v1.6**, alongside Debt Milestones + Amortization Calendar + streaks.

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

**Ships in: backlog, pre-v2.0 — not yet scheduled to a specific version.** No implementation plan written yet — revisit only once there's a concrete trigger (real user report of lag with a large list, or a profiling result). If/when triggered: `react-window` or `@tanstack/react-virtual` are the standard low-dependency-footprint options; evaluate at that time rather than pre-selecting now.

---

## P8 — Modal transition audit

**Ships in: backlog, unscheduled.**

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

1. **P1 (icons) touches the most files of any phase, which is why it's split across v1.2 (P1a) and v1.3 (P1b)** rather than bundled into one version — do it incrementally (file-by-file with a visual check) within each slice, not as one sweeping change.
2. **P4 (v1.4) depends on P1a+P1b being fully done (v1.2+v1.3)** — don't start empty-state illustrations before the icon system is complete, or you'll redo the visual language twice.
3. **P6's "only animate new items" requirement is the one real correctness risk in this whole plan** — get the keyed-animation-on-mount pattern right, or list re-renders will look worse than today's instant-appear baseline.
4. **None of P1-P6 require new dependencies except P1a's icon library** (introduced once in v1.2, reused unchanged in P1b/v1.3) — keep it that way; this app's small dependency footprint is a deliberate strength, don't reach for an animation library for what CSS keyframes already handle.
5. **P9c (v1.4) should reuse P1a/P1b's touch-active visual language rather than inventing a new "pressed" treatment** — same rationale as P4 depending on P1, just applied to interaction states instead of iconography.
6. **P9c specifically requires touch-device testing, not desktop-browser-with-mouse testing** — a mouse will still trigger the `:hover` rules being audited, which would mask whether the fix actually worked. This is the one phase in the whole plan where the standard "check in a browser" verification habit doesn't suffice on its own.
7. **P9b (v1.3) and P1b both touch `DebtGroup.tsx`** — do them in the same pass within that version rather than two separate visits to the file.
