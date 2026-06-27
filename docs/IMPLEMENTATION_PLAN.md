# Implementation Plan — v1.3 onward

_Companion to `ROADMAP.md`, which defines the **what/why/tier**. This document defines the **how**: data model changes, files touched, sequencing, and testing per version. Last updated 2026-06-23._

**Note on v1.2's base scope:** Local Notifications and the App Store review prompt (the two features v1.2 originally shipped to fix) predate this document — they were built before "v1.3 onward" planning began and have no implementation section here. App Lock and Mobile Polish were added to v1.2 *after the fact* (before launch), which is why those two have addenda below.

## Critical path dependency — read this before sequencing anything past v1.14

Three separate roadmap items independently require a **backend** that does not exist today (the app is 100% client-side, `localStorage`-only, no accounts, no server):

- **v1.14** — opt-in leaderboard (needs a server to aggregate anonymous percentiles across users)
- **v2.0** — AI Recommendations (an Anthropic API key can never be embedded client-side; Claude calls must go through a server proxy)
- **v2.1** — Household/Multi-Income (multiple people need to see shared data, which means accounts + sync, not local storage)
- **v2.2** — Bank linking (Plaid access tokens must never touch the client; requires a server to hold them)

Building this four separate times would be wasteful and inconsistent. **Recommendation: stand up the backend foundation once, as explicit Phase 0 of v2.0**, since that's the first item on the roadmap that strictly requires it chronologically. v1.14's leaderboard should be **resequenced to ship its non-backend half (shareable cards) standalone, and its backend half (leaderboard) deferred until the v2.0 backend exists** — detailed in the v1.14 section below.

This single decision is the most important thing in this document. Everything below assumes it.

---

## v1.2 addendum — App Lock (Biometric + Device Passcode Fallback) — done

**Status: shipped, with one correction to this plan.** The original plan below called for App Lock to default ON for new installs. Once built, this was found to block onboarding entirely — a brand-new user with no biometrics/passcode enrollment context would hit a lock screen before ever reaching the welcome flow, and it broke every fresh-install e2e test across all device projects. Fixed in commit `926ebd6` ("Fix App Lock defaulting to enabled for new installs") to **default OFF**, opt-in from Plan Settings instead. Step 4 below is kept for history; the shipped behavior is the opposite of what it says.

**Why this is going into v1.2, not its own version:** v1.2 (notifications + App Store review prompt) is locked but hasn't been submitted/launched yet. App Lock has zero dependencies on anything else in this plan, is quick to build, and thematically belongs with notifications/review as a "trust" feature — not worth spinning up a separate release for. Since v1.3 (iPad) already branched off v1.2-dev, implement this on `v1.2-dev` and merge/rebase those commits forward into `v1.3-dev` afterward.

**Scope:** Gate the app behind the device's native authentication on launch and on resume from background, before any debt/financial data renders.

**Key architectural recommendation: do not build a custom in-app PIN system.** Use iOS `LocalAuthentication` with `LAPolicy.deviceOwnerAuthentication` (not `...WithBiometrics`) — this policy gives Face ID/Touch ID *and* automatically falls back to the device's own passcode if biometrics fail or aren't enrolled. This means zero custom secret storage, zero risk of a weak homegrown PIN implementation, and matches the unlock behavior users already expect from every other secure app on their phone.

**Implementation steps:**
1. Add a Capacitor biometric plugin (community-maintained `LocalAuthentication` wrapper — evaluate options at implementation time) configured for `deviceOwnerAuthentication`, not biometrics-only.
2. New `lib/hooks/useAppLock.ts` — tracks `isUnlocked` state, exposes `requestUnlock()`. Re-locks on background via Capacitor's `App` plugin `appStateChange` listener, not just on cold launch — a lock that only triggers on full app restart isn't a real lock.
3. In `app/page.tsx`, gate the `<main>` render behind `isUnlocked`: render a minimal lock screen (icon + "Unlock" button calling `requestUnlock()`) when locked, following the same pre-render-gating pattern `AppSkeleton` already uses for the mount check.
4. Settings toggle: "Require Face ID to open." **Default ON for new installs** — security should be opt-out, not opt-in, for an app holding debt balances — with clear copy if a user turns it off.
5. **Tier: Free, all tiers.** Gating basic security behind a paywall is a trust/reputation risk in a finance app, not a real monetization lever — no competitor charges for this.

**Data model changes:** none. Purely a render-gating concern, no new storage keys beyond the one settings toggle.

**Testing:** native biometric prompts can't be driven by Playwright (same limitation as v1.7's widget, see below). Manual on-device verification is the primary gate. Add one regression-adjacent unit check: with `useAppLock` mocked to always-locked, confirm no debt/balance data is present in the rendered output before unlock — guards against a future change accidentally rendering sensitive content ahead of the lock check.

**Risk:** Low. Single new dependency (the biometric plugin), no interaction with any other feature, no data model changes.

---

## v1.2 addendum — App Store Compliance: Manage Subscription + Terms of Use Links — done

**Status: shipped.** Added "Terms of Use" (linking Apple's Standard EULA — no custom page needed) and "Manage Subscription" (linking `https://apps.apple.com/account/subscriptions`) to the Settings legal-links row, and "Terms of Use" to the upgrade/paywall screen alongside Privacy Policy/Support. `.settings-legal-row`/`.upgrade-legal-row` CSS gained `flex-wrap: wrap` to handle the now-longer link list cleanly at narrow phone widths (verified via Playwright at 375px).

_Verified gap, not in any prior version of this doc: the app has zero "Manage Subscription" entry point and zero Terms of Use/EULA link anywhere — only Privacy Policy and Support exist in Plan Settings. Given two prior App Review rejections under Guideline 2.1.1, closing this preemptively (rather than waiting for Apple to flag it under Guideline 3.1.2) is cheap insurance worth doing now rather than reactively later._

**Scope:** Two small additions, both purely link-outs, no new logic.

**Implementation steps:**
1. **Manage Subscription link** — add a row to the Settings legal-links area (alongside Privacy Policy/Support) that opens the native subscription management URL. On iOS this is `https://apps.apple.com/account/subscriptions` (or the `manageSubscriptionsRouteURL` available via RevenueCat's `Purchases.getCustomerInfo()`/native sheet if exposed — check RevenueCat's SDK for a direct "show manage subscriptions" call before hand-rolling the URL, since it's a known wrapper around this exact flow).
2. **Terms of Use link** — add alongside Privacy Policy/Support. If a Terms of Use page doesn't exist yet in the `debt-planner-stie` site repo, that's the actual blocker — flag to get one drafted (a standard subscription EULA, often Apple's own boilerplate Terms of Use is acceptable per Apple's own documentation if you don't need a custom one).
3. Add both links to the upgrade/paywall screen itself (`UpgradeSection.tsx`) alongside the existing Privacy Policy/Restore Purchases — subscription terms should be visible at the point of purchase, not just buried in Settings.

**Files touched:** `app/page.tsx` (Settings legal-links row), `components/UpgradeSection.tsx`.

**Testing:** Manual — confirm both links open correctly on-device (the subscription management URL only resolves meaningfully on a real device signed into the App Store, not the simulator).

**Risk:** Low. Pure link-outs, no logic, no data model changes — the only real work is sourcing/drafting the Terms of Use content if it doesn't already exist.

---

## v1.2 addendum — Demo Mode ("Try with Sample Data") — done

**Status: shipped.** The original "Populate Demo Data" seed function existed only as a dev-only debug button (`process.env.NODE_ENV === "development"`), invisible in production — meaning App Review and real users alike had no way to preview the app with realistic data. Turned it into a real, user-facing feature instead of a reviewer-specific backdoor, since Apple's guidelines frown on apps behaving differently for reviewers than real users.

**Implementation:**
1. `lib/testing/seedPlannerState.ts` — converted the hardcoded-calendar-date demo dataset (`demoPlannerState` constant, dated May/June 2026) into `buildDemoPlannerState(today)`, computing every date as an offset from "today" at the moment it's applied. Hardcoded dates would have looked stale/broken the moment "today" moved past them — now the seeded data always looks current. `applyDemoPlannerStateToStorage` also now sets a new `debtPlanner.isDemoMode` flag.
2. New "Try with Sample Data" button on the first-run setup sheet, alongside the existing "Import Backup" — calls the same seed function + reload, now exposed in production.
3. New `isDemoMode` state in `app/page.tsx` (read once via `loadStoredState`) drives a persistent banner ("Demo Mode — viewing sample data") with a "Start My Own Plan" action that clears all storage and reloads back to a clean first-run state.
4. **Deliberately does not mock or unlock Premium entitlements.** Demo data populates debts/bills/goals only — the real subscription state (free, unless actually purchased) still applies, so the paywall triggers exactly as it would for any real user. This keeps the reviewer/user experience honest: they see real premium feature *previews* backed by realistic data, not a faked-unlocked tier.
5. `tests/e2e/planner-visual-state-shots.spec.ts` updated to call `buildDemoPlannerState()` instead of importing the now-removed static `demoPlannerState` export.

**Files touched:** `lib/testing/seedPlannerState.ts`, `app/page.tsx`, `app/page.css` (`.demo-mode-banner`, `.demo-mode-exit-button`, `.first-run-import-row` layout), `tests/e2e/planner-visual-state-shots.spec.ts`.

**Risk:** Low. Additive, and the date-offset refactor was verified to reproduce the exact same relative spacing (overdue/upcoming bills) as the original hardcoded dataset — just anchored to "today" instead of a fixed calendar date.

---

## v1.2 addendum — Settings Toggle Redesign — done

**Status: shipped.** `.toggle-button`/`.toggle-on`/`.toggle-off` (used by the Notifications and App Lock toggles) had zero dedicated CSS — they were rendering as the generic block-button base style with "On"/"Off" text, not a toggle control. Replaced with a proper iOS-style sliding switch (51×31pt track, 27pt thumb, `role="switch"`/`aria-checked` for correct accessibility semantics). Also fixed `.notifications-settings-row`, which had zero CSS and was stacking the toggle below the header text instead of right-aligning it on the same row — added `display: flex; justify-content: space-between` so the toggle now sits compactly beside its label, matching standard iOS settings-row layout.

**Standing rule going forward:** any future toggle/switch control in this app must use this same iOS-style sliding-switch pattern (`.toggle-button`/`.toggle-thumb`), not a generic on/off button. Don't introduce a second toggle visual language.

**Files touched:** `app/page.tsx` (both toggle usages), `app/page.css` (`.toggle-button`, `.toggle-thumb`, `.notifications-settings-row`, `.notifications-settings-card`).

**Risk:** Low. Pure presentation, no behavior change — verified visually in both light/dark themes and both on/off states.

---

## v1.2 addendum — Mobile Polish: Icon Foundation, Haptics, Touch-Target Fixes — done

_Full detail in `MOBILE_POLISH_ROADMAP.md`/`MOBILE_POLISH_IMPLEMENTATION_PLAN.md` (phases P1a, P2, P9a). Summarized here for single-source version sequencing._

**P1a — Icon system foundation:** Done. Stood up `lib/icons/index.ts` (lucide-react re-exports), replaced emoji/Unicode glyphs in the chrome used every session — bottom nav, theme toggle, settings gear, section switcher, `AppLockScreen.tsx`. All icon-only buttons in scope already had `aria-label`s from prior work. Establishes the size/stroke convention P1b reuses in v1.3.

**P2 — Haptic coverage completion:** Done. Audited every `onClick` across `app/page.tsx`, `PaycheckSection.tsx`, `GoalsSection.tsx`, `DebtsSection.tsx`, `RequiredExpensesSection.tsx`, `LivingExpensesSection.tsx`. Added light haptic to tab switches, the Bills section switcher, and previously-uncovered close/cancel/pagination buttons; added medium haptic to commit-level actions (Calculate plan, Start Next Pay Cycle, goal Save/Remove, expense Remove). Several handlers already had haptics built in (`startEditing`, `saveEditing`, `handleAddDebt`, `handleAddGoal`) — left untouched to avoid double-firing.

**P9a — Tap targets, keyboard hints:** Done. Bumped `.smart-insight-icon` (34×34→44×44) and `.pagination-compact .text-action-button` (32×32→44×44); added `enterKeyHint="done"` to the paycheck amount input. **Correction:** the execution-summary 4-column grid's breakpoint was investigated and found to already work correctly at real phone widths (verified via Playwright at 390px: computed `grid-template-columns` was `139px 139px`, rendered cleanly) — the original audit's claim that this needed fixing was a misdiagnosis. No CSS change was made for this item.

**Files touched:** `lib/icons/index.ts` (new), `app/page.tsx`, `AppLockScreen.tsx`, `PaycheckSection.tsx`, `GoalsSection.tsx`, `DebtsSection.tsx`, `RequiredExpensesSection.tsx`, `app/page.css`.

**Risk:** Low-medium. Mechanical, scoped to a handful of files this version — see the polish implementation plan for the full file-by-file breakdown.

---

## v1.3 — iPad Support *(done)*

**Scope:** Make the app a genuine iPad experience, not a stretched iPhone layout.

**Current state (verified):**
- `ios/App/App/Info.plist` → `UIDeviceFamily: [1]` (iPhone only)
- `ios/App/App.xcodeproj/project.pbxproj` → `TARGETED_DEVICE_FAMILY = "1"` (iPhone only, both Debug/Release)
- `app/styles/00-theme-and-base.css:226` → `.app { max-width: 1300px; }` — caps width but the content inside is single-column with zero `min-width` media queries. On an iPad today this renders as a centered, single-column phone layout with large empty side margins — functional but not "designed for iPad."
- Only two breakpoints exist anywhere in the CSS (`app/styles/09-anim-swipe-media-misc.css:262,308`), both `max-width` (768px, 640px) — purely mobile-narrowing, nothing for wider layouts.

**Implementation steps:**
1. **Xcode target**: change `TARGETED_DEVICE_FAMILY` to `"1,2"` (universal) in both Debug and Release configs. Add `UIDeviceFamily: [1, 2]` and `UISupportedInterfaceOrientations~ipad` to include landscape (currently portrait-only) in `Info.plist`.
2. **Layout breakpoint**: add a `min-width: 834px` (iPad mini portrait and up) tier to the CSS. Candidate two-column layouts:
   - Plan tab: Results summary + Timeline side-by-side instead of stacked
   - Settings sheet: render as a centered modal (already has `.settings-sheet`) instead of full-bleed bottom sheet
   - Bills tab: Expenses/Debts switcher could become a persistent side-by-side split instead of a toggle
3. Add the new breakpoint rules to `app/styles/09-anim-swipe-media-misc.css` (where the other media queries live) as `min-width` rules, ordered after the existing `max-width` rules so cascade order is unaffected.
4. Bottom nav: re-check whether a bottom tab bar still makes sense on iPad vs. a sidebar — recommend **keeping bottom nav for v1.3** (lower risk, ships faster) and revisiting a sidebar nav as a backlog polish item, not blocking this version.
5. Test in iPad Simulator (multiple sizes: iPad mini, iPad Air, iPad Pro 13") in both orientations, both themes.

**Files touched:** `ios/App/App/Info.plist`, `ios/App/App.xcodeproj/project.pbxproj`, `app/styles/09-anim-swipe-media-misc.css` (new rules), possibly new component-level conditional rendering if the two-column Plan tab layout needs JSX changes (not just CSS) — check whether `ResultsSection`/`TimelineSection` can reflow via CSS grid alone first before touching JSX.

**Testing:** Manual Simulator pass (documented above) is the primary gate since there's no automated visual regression tooling yet. Add one new Playwright project block in `playwright.config.ts` for an iPad viewport (e.g., `devices["iPad Pro 11"]`) alongside the existing `mobile-chrome`/`iphone-pro-max` projects, reusing existing e2e specs.

**Risk:** Low-medium. Mechanical CSS/config work, but "looks correct on iPad" is subjective — get a visual check before considering this done, the same way the recent file-split refactor was Playwright-screenshot-verified at each step.

---

## v1.3 addendum — Mobile Polish: Icon Completion, Tab Transitions, Pagination *(done)*

_Full detail in `MOBILE_POLISH_ROADMAP.md`/`MOBILE_POLISH_IMPLEMENTATION_PLAN.md` (phases P1b, P3, P9b)._

**P1b — Icon system completion — done.** Replaced all remaining emoji/Unicode UI glyphs: `DebtRow.tsx` (`✔` → `Check`, `›` → `ChevronRight`), `ExpenseListItem.tsx` (category icons via `getRequiredExpenseCategoryIcon` → lucide icons; `✔` → `Check`; `›` → `ChevronRight`), `GoalsSection.tsx` (`🛡️` → `Shield`, `🎯` → `Target`, `›` → `ChevronRight` — decorative `🎉`/`👑` in the momentum card intentionally kept), `DebtsSection.tsx` (`↑`/`↓` sort arrows → `ArrowUp`/`ArrowDown`). Added `Check`, `ChevronRight`, `ArrowUp`, `ArrowDown`, `Shield`, `Zap`, `Tv`, `Pill`, `Bookmark` to `lib/icons/index.ts`. Added `.paid-off-icon` CSS class (`--success-color`, `inline-flex`, `vertical-align: middle`). Updated `.row-chevron` to `inline-flex`/`align-items: center` for SVG. `AddDebtModal.tsx`, `AddExpenseModal.tsx`, `DebtGroup.tsx`, `SwipeActionCard.tsx` had no emoji to replace.

**P3 — Tab-switch transitions — done.** Added `@keyframes tabContentIn` (opacity 0→1, translateY 8px→0, 160ms `cubic-bezier(0.2, 0.9, 0.2, 1)`) and `.tab-content-transition` class to `09-anim-swipe-media-misc.css`, with `@media (prefers-reduced-motion: reduce)` disabling it. Wired with `<div key={activeTab} className="tab-content-transition">` wrapping all per-tab conditional blocks in `app/page.tsx` — key-based remount fires the animation on every tab switch without extra JS state. First `prefers-reduced-motion` usage in the codebase; standing rule going forward: every new animation must include this guard.

**P9b — Pagination → mobile-native list pattern — done.** The "current state" claim that `DebtGroup.tsx` was the only pagination instance turned out to be wrong — `GoalsSection.tsx`, `RequiredExpensesSection.tsx`, and `SnowballSection.tsx`'s payoff-order list shared the exact same `pagination-actions pagination-compact`/`pagination-status` markup and CSS. Converted all four to a single "Load More" button (`visibleCount` state replacing the 1-based page number, slicing `items.slice(0, visibleCount)`, incrementing by the page size on tap) rather than leaving three call sites on stale numbered pagination while one moved on. Removed `.pagination-compact`/`.pagination-status` CSS entirely; repurposed the already-present-but-unused `.load-more-actions` class plus a new `.load-more-button` style. Verified via Playwright against a seeded 15-item debt list: Load More reveals the next batch with no duplicates/drops at the boundary.

**Files touched:** `lib/icons/index.ts`, `DebtRow.tsx`, `ExpenseListItem.tsx`, `GoalsSection.tsx`, `DebtsSection.tsx`, `app/page.tsx`, `app/styles/03-nav-results-modals.css` (`.row-chevron` update, `.paid-off-icon` new), `app/styles/09-anim-swipe-media-misc.css` (`tabContentIn` keyframe + `.tab-content-transition`), `app/styles/02-overdue-pagination-nav.css`.

---

## v1.3 addendum — iPad Native Polish *(done)*

**Scope:** Elevate the iPad experience from "universal binary with one two-column breakpoint" to a genuinely native iPad layout — sidebar navigation, side-by-side Bills columns, and centered modals/sheets. Nothing in this version adds features or changes data; it is pure layout and navigation chrome. Shipped as part of v1.3 rather than a separate release because v1.3 already establishes iPad support; completing the native feel in the same release avoids shipping a half-finished iPad experience.

**Why merged into v1.3, not deferred:** Onboarding (next release) introduces new first-run UI that must look correct on iPad from day one. Building the sidebar nav and two-column Bills *before* onboarding means onboarding is built against the real iPad chrome rather than the phone-style bottom nav. Doing it after would mean fixing onboarding's iPad layout twice.

**Current state (post-v1.3):**
- Single `@media (min-width: 834px)` block in `09-anim-swipe-media-misc.css` with three rules: `.card { max-width: 640px; margin-inline: auto }` and `.plan-tab-grid { display: grid; grid-template-columns: 1fr 1fr }`.
- Bottom nav still fixed to the bottom on iPad — no sidebar alternative.
- Bills tab still uses a section-switcher toggle on iPad — no side-by-side columns.
- Settings sheet and all add-item modals are full-bleed bottom sheets on iPad.

**Implementation steps:**

### Step 1 — Sidebar navigation on iPad

Replace the floating bottom tab bar with a left sidebar on iPad (834px+). CSS-only approach — render both navs in JSX, hide the correct one per breakpoint.

1. In `app/page.tsx`, add a `<nav className="sidebar-nav">` alongside the existing `<nav className="bottom-nav">` (same four tab buttons, identical `activeTab` state — no new state or handlers needed). The sidebar renders `aria-hidden="true"` on small screens and the bottom nav renders `aria-hidden="true"` on large screens, both controlled via CSS `display` rules.
2. In `app/styles/03-nav-results-modals.css`, add inside the existing `@media (min-width: 834px)` block (or extend it in `09-anim-swipe-media-misc.css` where the other breakpoint lives — keep all 834px rules together):
   - `.bottom-nav { display: none }` — hides bottom nav on iPad
   - `.sidebar-nav` — `position: fixed; left: 0; top: 0; bottom: 0; width: 80px; display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; background: var(--bg-secondary); border-right: 1px solid var(--border-color); z-index: 50`
   - `.sidebar-nav-item` — vertical stack of icon + label, `width: 100%; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 12px 0; color: var(--text-secondary)`
   - `.sidebar-nav-item.active` — `color: var(--accent-color); background: rgba(37,99,235,0.08); border-radius: 12px; margin: 0 8px; width: calc(100% - 16px)`
3. Adjust `.app-content` padding-left at 834px+ to account for the 80px sidebar: `padding-left: calc(80px + 16px)`.
4. The sidebar icon size can be `size={22}` (slightly larger than bottom nav's 20 — sidebar icons benefit from breathing room).

**Sidebar nav label consideration:** Bottom nav uses `<small>` for labels. Keep labels on the sidebar (rotated? below icon? beside icon?). Recommend **icon + label stacked** (same as bottom nav) at `font-size: 0.66rem` — the sidebar is narrow (80px) so labels must be short. "Payoff" becomes the constraint word — it fits at this size.

### Step 2 — Two-column Bills on iPad

On iPad, eliminate the Expenses/Debts toggle and render both sections as persistent side-by-side columns.

1. In `app/page.tsx`, the bills section currently renders three conditional blocks gated on `activeTab === "bills"` and `billsView`. At 834px+ we want to show both simultaneously. Cleanest approach without a new hook: add a CSS class `bills-two-column` on a wrapper div that contains all three bills blocks, and use CSS to:
   - Hide `.mobile-section-switcher` at 834px+ (the toggle is not needed)
   - Display `RequiredExpensesSection` and `DebtsSection` as a two-column grid instead of stacking
2. Wrap the three bills conditional blocks in `<div className="bills-tab-content">`. At 834px+ via CSS: `display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start`. The switcher block (`mobile-section-switcher`) gets `display: none` at 834px+. Both sections are now always visible.
3. Because both sections render simultaneously at 834px+, the `billsView` state no longer matters on iPad — both are visible regardless. No `billsView` state change needed; CSS handles it.
4. **Edge case:** When both sections render at once on iPad, the `{activeTab === "bills" && billsView === "expenses"}` and `{activeTab === "bills" && billsView === "debts"}` conditionals mean on iPad (where no switcher exists) one section is always hidden. Fix: on iPad both conditions must render. Approach: at 834px+ use `:not(.mobile-section-switcher)` visibility trick OR change the conditions to render both `RequiredExpensesSection` and `DebtsSection` unconditionally when on the bills tab, regardless of `billsView`. The latter is simpler — no CSS trick needed, and `billsView` state naturally becomes inert on iPad since CSS handles layout. This does mean a small JSX change: render both bills components on the bills tab always, not conditionally on `billsView`. The `mobile-section-switcher` and its `billsView` state still exist for phone but do nothing on iPad.

### Step 3 — Centered modals and sheets on iPad

At 834px+, all bottom sheets (settings, add-item modals) should appear as centered modals — not full-bleed sheets from the bottom.

1. Add to the 834px+ media query:
   ```css
   .settings-overlay {
       align-items: center;  /* overrides align-items: flex-end */
   }
   .settings-sheet,
   .bills-modal,
   .debt-add-modal,
   .goal-add-modal,
   .sort-sheet {
       border-radius: 24px;  /* all four corners rounded, not just top */
       max-height: 80vh;
       animation: centerModalIn 0.2s ease;  /* use centered animation, not slideUpSheet */
   }
   ```
2. This is purely CSS — no JSX changes. The `.settings-overlay` `align-items: center` moves the sheet to the center of the screen; the border-radius change makes all corners rounded (not just the top two). `centerModalIn` already exists in the animation library.
3. Verify the `backdrop-filter: blur(8px)` on `.settings-overlay` still looks correct when centered — it should, since it's on the overlay, not the sheet.

### Step 4 — `.app-content` padding adjustment for sidebar

Without adjustment, the sidebar overlaps the content on iPad since `.app-content` doesn't know about it.

1. In the 834px+ breakpoint, add `padding-left: calc(80px + max(16px, env(safe-area-inset-left)))` to `.app-content`, matching the sidebar width + the existing left safe-area inset already applied.
2. This is the same pattern already used for notch/home-indicator insets — just extending it to account for the sidebar.

**Files touched:** `app/page.tsx` (add sidebar nav JSX, adjust bills conditionals), `app/styles/03-nav-results-modals.css` (sidebar nav classes) OR `app/styles/09-anim-swipe-media-misc.css` (extend 834px breakpoint — prefer keeping all 834px rules in one place), `app/styles/08-dark-theme-polish.css` (dark theme sidebar background if needed).

**Testing:** Manual Simulator pass at iPad mini (1024×768pt landscape, 768×1024pt portrait), iPad Air, iPad Pro 13" — confirm sidebar appears, Bills two columns, modals centered. Also verify phone breakpoint unchanged (sidebar hidden, bottom nav visible, bills switcher works). Playwright screenshots at iPad Pro 11 viewport (already added in v1.3) before/after.

**Risk:** Low-medium. The most complex piece is the bills tab conditional change (Step 2 JSX) — requires care to avoid showing both RequiredExpensesSection and DebtsSection on phone, where only one should show at a time. Keep the `billsView` conditional intact for phone; only strip it for iPad via the CSS rendering approach or a width-aware state.

**Dependency note for v1.4 (Onboarding):** The onboarding flow (`OnboardingFlow.tsx`, `components/Onboarding/`) will be a full-screen overlay when triggered. It must be built to render correctly in the sidebar-aware layout — specifically, the sidebar should not be visible during onboarding (the onboarding overlay sits above it at `z-index` above 50, so this is automatic as long as onboarding's overlay uses `z-index: 100`+). No additional work needed in v1.4 Onboarding for this, just verify during testing.

---

## v1.3 addendum — Landscape Two-Column Layouts (Goals + Payoff) *(done)*

**Scope:** Goals and Payoff tabs looked centered/narrow in iPad landscape (1024px+), unlike Bills which had a native two-column feel from the 834px+ work above. Added a second breakpoint at 1024px+ giving both tabs an interior two-column grid layout.

**Goals (`components/GoalsSection.tsx`, `app/styles/09-anim-swipe-media-misc.css`):**
- Added `.goals-tab-layout` grid wrapper (`240px | 1fr`) around the has-goals path: left column (`.goals-summary-col`) holds the summary strip, search input, and motivation card; right column (`.goals-main-col`) holds the goal cards and Load More.
- The empty-state path (no goals yet) renders full-width without the wrapper — no layout change for new users.
- At 1024px+: `.goals-main-col .goals-list` keeps its `1fr 1fr` grid (cards stay two-column within the right col); `.goals-main-col .compact-debt-edit-card` spans both columns.

**Payoff (`components/SnowballSection.tsx`, `app/styles/09-anim-swipe-media-misc.css`):**
- Added `.payoff-tab-layout` grid wrapper (`300px | 1fr`) around the has-debts ternary branch: left column (`.payoff-summary-col`) holds Focus Debt strip, Strategy Selector, Summary cards (Debt Free date, With Recommendation), and Premium Payoff Hero; right column (`.payoff-detail-col`) holds Smart Insights, Strategy Comparison, What-If Simulation, and Payoff Order collapsible.
- The empty-debts path (no current target) renders the existing `empty-debt-state` card full-width — no change.
- **TypeScript note:** JSX `{/* comment */}` placed immediately after a ternary branch's root closing tag is invalid — the parser is back in JS expression context after the `</div>`, so `{...}` is interpreted as a block statement. Fixed by removing inline comments from the two closing div tags (`</div>{/* end payoff-tab-layout */}` → `</div>`).

**Files touched:** `components/GoalsSection.tsx`, `components/SnowballSection.tsx`, `app/styles/09-anim-swipe-media-misc.css` (new `@media (min-width: 1024px)` block).

**Risk:** Low. CSS-only breakpoint (both wrapper divs are always rendered, single-column on mobile via block default — no mobile regression). TypeScript error was caught pre-push by `npx tsc --noEmit`.

---

## v1.3 addendum — Delete All Data + Settings Polish *(done)*

**Scope:** Destructive reset action accessible from Settings; settings sheet iOS-native sizing and feel on iPad; upgrade modal overflow fix.

**Delete All Data:**
- Two-tap confirmation pattern in the settings sheet: "Delete All Data" text button → warning paragraph + "Cancel" / "Delete Everything" inline. State: `showDeleteConfirm` (boolean) in `app/page.tsx`, reset to `false` on settings sheet close and on Calculate.
- Only shown outside first-run setup (`!isFirstRunSetup` gate) — no reason to expose this on a brand-new plan.
- The confirmed action reuses the existing `handleExitDemoMode()` (which does `localStorage.clear(); window.location.reload()`) — no new reset logic needed.
- Haptics: light on first tap ("Delete All Data"), medium on second tap ("Delete Everything").
- CSS added: `.settings-danger-zone`, `.danger-text-button`, `.delete-confirm-row`, `.delete-confirm-text`, `.delete-confirm-actions`, `.danger-destructive-button` (in `app/styles/03-nav-results-modals.css`).

**Settings sheet iPad sizing:**
- At 834px+, `.settings-sheet` gets `max-width: 600px; padding: 1.75rem 2rem; max-height: 88vh` — renders as a centered modal-sized sheet rather than a full-width bottom sheet, matching native iOS Settings presentation.
- `.settings-overlay` gets `padding-left: 80px` to offset the sidebar so the sheet visually centers in the visible content area (not the full screen width including sidebar).

**Upgrade modal overflow fix:**
- `.upgrade-modal-card`: changed `overflow: hidden` → `overflow-x: hidden; overflow-y: auto` so content scrolls on shorter viewports (the decorative orb is clipped by `overflow-x: hidden` as before, but content is no longer clipped when the card is taller than the screen).

**Dev-only "Populate Demo Data" button removed:**
- The dev-only `process.env.NODE_ENV === "development"` populate button in `app/page.tsx` was removed (and its CSS in `03-nav-results-modals.css`). The `handlePopulateDemoData` function itself is kept — still called by "Try with Sample Data" in first-run setup. See the Demo Mode addendum for context.

**Playwright nav selector fixes:**
- All nav-click selectors across 7 spec files replaced with `.bottom-nav-item:visible, .sidebar-nav-item:visible` pattern — the prior `getByRole("button", { name: /Goals/i })` matched both sidebar and bottom nav simultaneously on iPad viewports, causing Playwright strict-mode violations.
- Added `expect(heading).toBeVisible()` guards after each Payoff/Goals nav click before screenshotting — ensures React has flushed state before `page.screenshot()`.
- Global test timeout raised from 30s to 60s in `playwright.config.ts` (screenshot-heavy spec was hitting the 30s ceiling at 9 screenshots per test).

**Files touched:** `app/page.tsx`, `app/styles/03-nav-results-modals.css`, `app/styles/07-premium-upgrade.css`, `app/styles/09-anim-swipe-media-misc.css`, `playwright.config.ts`, all 7 `tests/e2e/planner-*.spec.ts` files.

---

## v1.3 addendum — UI/UX Polish Pass *(done, 2026-06-27)*

**Scope:** CSS-only visual polish pass across all app stylesheets. No business logic, state, routing, or data model changes. Goal: premium fintech feel with refined spacing, depth, and motion.

**Card visual depth** (`00-theme-and-base.css`, `08-dark-theme-polish.css`):
- `.card` border opacity raised from `0.12` → `0.14`; layered box-shadow with inset top highlight and inset bottom shadow line
- `.dark-theme .card` explicit shadow stack (22/28/18% opacity layers) so dark cards read as floating surfaces rather than flat tiles
- `.compact-add-button` base style added (`padding: 9px 14px; font-size: 0.88rem`)

**Summary card depth** (`02-overdue-pagination-nav.css`):
- `.summary-card` layered box-shadow with inset top highlight; `.dark-theme .summary-card` glass treatment with inset highlight and depth shadow

**Living summary card** (`03-nav-results-modals.css`):
- `.living-summary-card` padding reduced to `11px 13px` (from inherited `13px`), glass background and subtle shadow — rule placed in `03-nav-results-modals.css` to correctly override the earlier `.summary-card` rule from `02-overdue-pagination-nav.css`

**Goal card spacing** (`01-payoff-goals.css`):
- `.goal-card-content` gap: `4px` → `5px`
- `.goal-type-icon` size: `26px` → `28px`
- `.goal-progress-track` height: `6px` → `7px`

**Premium hero inner shine** (`01-payoff-goals.css`):
- `.premium-payoff-hero::before` pseudo-element adds a 45%-height top-to-transparent gradient at 9% white opacity. Used `::before` not `::after` since `::after` already renders the "+" character.

**Upgrade button** (`07-premium-upgrade.css`):
- Blue-to-purple gradient background with glow shadow and inset highlight; first feature item gets `--premium-featured-border` treatment

**Timeline** (`05-timeline-whatif.css`):
- List gap: `6px` → `14px` (further increased by linter)
- Item vertical padding: `11px` → `12px`
- Right column min-width: `112px` → `116px`
- `.timeline-running-cash`: `font-size: 0.84rem; opacity: 0.62; margin-top: 4px; font-variant-numeric: tabular-nums`
- Connector line: `border-radius: 999px`, richer blue/purple gradient stops

**Motion** (`09-anim-swipe-media-misc.css`):
- `@keyframes cardReveal` (opacity + translateY + scale) added
- `.goal-list-item` staggered entrance: 200ms cubic-bezier, 5-item nth-child delay chain (0/30/60/90/120ms)
- `prefers-reduced-motion` fallback guard on all new animations

**Page-specific headings** (`app/page.tsx`):
- Hero `<section>` now conditionally applies `hero hero-page` class on non-Plan tabs
- Bills/Payoff/Goals each render a distinct `page-heading`/`page-subheading` pair instead of the repeated "Debt Planner" title

**Dark theme polish** (`08-dark-theme-polish.css`):
- `.dark-theme .living-summary-card` gradient glass background with inset highlight

**Premium UX audit** (`premium-ux-audit.md`):
- Full audit of current product quality: 4 current strengths, 5 critical UX gaps, 6 visual/interaction polish items, 4 feature enhancements, 2 foundation quality items — with priority matrix. Written as input for future planning, nothing implemented from it.

**Files touched:** `app/page.tsx`, `app/styles/00-theme-and-base.css`, `app/styles/01-payoff-goals.css`, `app/styles/02-overdue-pagination-nav.css`, `app/styles/03-nav-results-modals.css`, `app/styles/05-timeline-whatif.css`, `app/styles/07-premium-upgrade.css`, `app/styles/08-dark-theme-polish.css`, `app/styles/09-anim-swipe-media-misc.css`, `premium-ux-audit.md` (new).

**Testing:** No regression tests needed — zero logic changes. Visual pass on Plan/Bills/Payoff/Goals tabs in both light and dark themes sufficient. Existing Playwright spec suite unchanged.

**Risk:** Low. CSS-only, no logic changes. Cascade was carefully managed — the `living-summary-card` rule consolidation required moving the rule to `03-nav-results-modals.css` to correctly win over the `.summary-card` base rule from `02-overdue-pagination-nav.css`; light-mode rule in `00-theme-and-base.css` was removed to avoid the higher-specificity file overriding it.

---

## v1.3 addendum — Critical Immediate Fixes (Second Audit Pass) *(done, 2026-06-27)*

**Scope:** Two code-verified gaps found during a second audit pass that are P0 and require fewer than 10 lines of code each. Ship immediately to `v1.3-dev` before cutting the v1.4 branch — these are the kind of bugs that, once you know about them, feel embarrassing to leave in.

### Rollover Haptic + Status Message (audit #19a) — 2 lines

**The gap (verified `app/page.tsx:625`).** `handleRolloverPayCycle()` — the most emotionally significant action in the entire app — fires no haptic and shows no status message. A user just completed a full pay cycle of financial discipline and receives zero acknowledgement. Every other major action in the app has at least a light haptic; this one has nothing.

```ts
// app/page.tsx — handleRolloverPayCycle()
async function handleRolloverPayCycle() {
    triggerMediumHaptic();           // ← add this (top of function)
    saveResetSnapshot();
    // ... existing rollover logic ...
    incrementRolloverCount();
    void maybeRequestAppReview();
    setStatusMessage("Cycle complete — great work!"); // ← add this (bottom)
}
```

**Files touched:** `app/page.tsx`. **Risk:** Zero.

### Currency Input Keyboard Type (audit #21) — 1 line per field, ~8 fields

**The gap (verified in `PaycheckSection.tsx`, `AddDebtModal.tsx`, `GoalsSection.tsx`, `AddExpenseModal.tsx`).** All currency fields use `type="number"` which on iOS shows a number pad *without a decimal point*. Users can't enter cents. The correct approach for currency on iOS is `type="text" inputmode="decimal"`.

Change every `type="number"` on a currency/amount field to `type="text" inputmode="decimal" pattern="[0-9]*"`. The `pattern` attribute prevents non-numeric characters from being submitted on mobile browsers that validate it.

**Files touched:** `components/PaycheckSection.tsx`, `components/Debts/AddDebtModal.tsx`, `components/GoalsSection.tsx`, `components/RequiredExpenses/AddExpenseModal.tsx`, `components/LivingExpensesSection.tsx` (if it has number inputs).
**Risk:** Very low. Verify that existing number-parsing logic (`parseFloat(value)`, `Number(value)`) still works with the new field type — it should, since the value attribute returns the string content regardless of `type`.

---

## v1.3 addendum — UX Quick Wins (from Premium Audit) *(done, 2026-06-27)*

**Scope:** Two trivial changes identified in `premium-ux-audit.md` that are zero-risk, zero-dependency, and too small to block on a dedicated version. Ship as a standalone push to `v1.3-dev` before cutting the v1.4 branch.

### Dark Mode Follows System Setting (audit #18) — 2-line change

**The gap.** First-time users always land in light mode; iOS users who've set system dark mode expect apps to respect `prefers-color-scheme: dark` on first launch. The current `useDarkMode` hook initializes without reading the system preference.

**Implementation:**
```ts
// lib/hooks/useDarkMode.ts — in the useState initializer
const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = loadStoredState("debtPlanner.darkMode", null);
    if (stored !== null) return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
});
```
The user's explicit toggle remains the override for all subsequent launches. No other changes needed.

**Files touched:** `lib/hooks/useDarkMode.ts`.
**Risk:** Minimal. Read-only `matchMedia` call with a null-safe fallback; no side effects.

### Bottom Nav Active State — Glow + Indicator (audit #6)

**The gap.** The active nav item uses a flat blue pill background. Premium fintech apps typically layer: pill fill + subtle icon glow + thin top-edge indicator line.

**What to add:**
```css
/* 08-dark-theme-polish.css — enhance .dark-theme .bottom-nav-item.active */
.dark-theme .bottom-nav-item.active {
    box-shadow: 0 0 18px rgba(96, 165, 250, 0.28), inset 0 0 0 0 transparent;
}
/* 00-theme-and-base.css (or 09-anim-swipe-media-misc.css) */
.bottom-nav-item.active::before {
    content: "";
    position: absolute;
    top: 0; left: 16px; right: 16px;
    height: 2px;
    border-radius: 0 0 2px 2px;
    background: var(--accent-color);
    opacity: 0.85;
}
```
The `::before` line requires `position: relative` on `.bottom-nav-item` (verify it already has this from the icon work in v1.2/v1.3).

**Files touched:** `app/styles/00-theme-and-base.css` or `app/styles/08-dark-theme-polish.css`.
**Risk:** Minimal. CSS-only.

---

## Pre-v1.4 — Foundation Fix: Storage Error Handling (from Premium Audit #16) *(done, 2026-06-27)*

**Scope:** `premium-ux-audit.md` #16 flags that `loadStoredState` silently returns defaults on any JSON parse error, meaning corrupted localStorage silently wipes user data. The full schema versioning + migration solution is planned for v1.10 — but a minimal try/catch fix should ship before v1.4 onboarding goes out, since onboarding is the moment new users will first have real data that could be lost.

**What v1.10 plans (full solution):** `schemaVersion` key, migration runner in `lib/storage/migrateState.ts`, error instrumentation tied to v1.11's analytics.

**Minimal fix to ship now:**
1. In `lib/storage/loadStoredState.ts`, wrap the `JSON.parse` call in a try/catch that logs a `console.warn` with the key name and error message, then returns the default — the existing fallback behavior, but no longer silent.
2. Add a `debtPlanner.schemaVersion` key written on every save (value: `1` for now). When loading, if the key is missing it's fine (old data); if it's present and mismatches the code constant, log an additional warning so it's visible in crash reports once v1.11 analytics ships.

**Files touched:** `lib/storage/loadStoredState.ts`, and the save-state path in `app/page.tsx` (wherever `localStorage.setItem` is called for debt planner state — add the version write alongside existing saves).
**Risk:** Very low. No behavior change — just adds logging to the existing error path and a version key that currently does nothing on load.

---

## v1.4 — Onboarding Flow

**Scope:** Replace the bare "enter paycheck amount" first-run sheet with a guided multi-step flow.

**Current state:** `app/page.tsx` gates on `isFirstRunSetup` (derived from `hasConfiguredPaycheck`) and shows the same `PaycheckSection` settings sheet used for ongoing settings, just with different copy ("Create Your First Plan" vs "Plan Settings") and an `Import Backup` shortcut. There's no walkthrough of what the app does.

**Implementation steps:**
1. New `components/Onboarding/` directory:
   - `OnboardingFlow.tsx` — step-state container (`useState<number>` for step index)
   - `WelcomeStep.tsx` — what the app does, 1 screen
   - `PaycheckStep.tsx` — reuses the existing paycheck amount/cycle fields (extract shared fields from `PaycheckSection` if reasonable, or just duplicate the small form — duplication is fine here per "avoid premature abstraction")
   - `FirstDebtOrBillStep.tsx` — optional quick-add of one debt or bill so the user sees a populated plan immediately, with a "Skip, I'll add later" option
   - `CompletionStep.tsx` — "Here's your plan" handoff into the main app
2. New `lib/hooks/useOnboarding.ts` — step state + a `debtPlanner.hasCompletedOnboarding` localStorage flag so it never shows again.
3. In `app/page.tsx`, swap the `isFirstRunSetup` branch's `<PaycheckSection>` render for `<OnboardingFlow>` when `!hasCompletedOnboarding`.
4. Decide: should onboarding require completing all steps, or allow skip-to-end at any point? Recommend allow-skip throughout — this is a planner app, not a game, and forcing steps risks abandonment.
5. **First-launch empty state (audit #2):** After completing onboarding, a new user with zero debts still sees a blank Plan tab. Replace the blank card stubs with a single "welcome to your plan" card: *"Your debt-free date is waiting. Add your first debt to see exactly what to do this paycheck."* This is one conditional render in the Plan tab's `ResultsSection` area — no new routing or architecture. It bridges the gap between onboarding completion and the user's first meaningful plan output.

**Data model changes:** none beyond the one new localStorage flag.

**Testing:** New Playwright spec `tests/e2e/onboarding-flow.spec.ts` covering: fresh install → complete all steps → lands on Plan tab; fresh install → skip everything → still lands in app correctly with empty state.

**Risk:** Low. Pure UI addition, no engine/data changes.

---

## v1.4 addendum — Mobile Polish: Empty-State Illustrations, Hover Audit

_Full detail in `MOBILE_POLISH_ROADMAP.md`/`MOBILE_POLISH_IMPLEMENTATION_PLAN.md` (phases P4, P9c)._

**P4 — Empty-state illustrations:** Small inline SVG illustration above the existing text for each of the three empty states (debts, expenses, goals), themed to match the icon system completed in v1.2/v1.3. Depends on P1a+P1b being done — don't start before then.

**P9c — Hover-only feedback audit:** Every `:hover`-only CSS rule (`app/styles/00-theme-and-base.css` lines 385/401-405/491/646/651, `app/styles/03-nav-results-modals.css` lines 201/716, `app/styles/09-anim-swipe-media-misc.css` line 369) gets an equivalent `:active`/touch-triggered state, using the touch-active visual language already established by the icon work. **Must be tested on an actual touch device/simulator, not a mouse-equipped browser** — a mouse still triggers the `:hover` rules being audited, which would mask whether the fix worked.

**Files touched:** `DebtsSection.tsx`/`DebtGroup.tsx`, `RequiredExpensesSection.tsx`, `GoalsSection.tsx`, `app/styles/00-theme-and-base.css`, `app/styles/03-nav-results-modals.css`, `app/styles/09-anim-swipe-media-misc.css`.

**Risk:** Low-medium. Additive markup (P4) plus mechanical CSS additions (P9c); the only real risk is skipping touch-device verification on P9c and shipping an untested fix.

---

## v1.4 addendum — UX Polish + Paywall Improvements (from Premium Audit)

**Scope:** The 11 items below come from `premium-ux-audit.md` and are appropriately sequenced here — alongside onboarding, which is the version where users first experience the app's value and the paywall's conversion matters most. All are CSS/JSX-only changes; none touch business logic, calculations, or data models. The windfall allocator (#12) was originally planned for v1.5 but is pulled forward here since it has zero dependencies on v1.5's cycle-history work.

Bundle into a single PR, shipped alongside the v1.4 onboarding work. Each item below is independently implementable — if time is short, cut from the bottom of the list first (priority order: #3 → #4 → #5 → #8 → #12 → #7 → #9 → #10 → #11 → #14 → #17).

### #3 — Debt-Free Date in Execution Summary Strip

The execution-summary-strip on the Plan tab currently shows: Paycheck / Bills / Minimums / Extra. The "Extra" cell (leftover snowball extra payment) is the least emotionally resonant. Replace it — or add a 5th cell at a narrower column width — with a **"Debt-Free"** cell showing the computed payoff date (e.g., "Apr 2028").

- The date is already computed in `buildSmartInsights` as `snowballDebtFreeDate` — make it available to the Plan tab's render (likely pass it down through `ResultsSection` props or compute it inline from the same projection values already available on the Plan tab).
- Styled with `font-variant-numeric: tabular-nums` and `font-weight: 900`, same as the other `strong` elements in the strip.
- Show "Add debts" or `—` when no debts exist.

**Files touched:** `components/ResultsSection.tsx` (or wherever the strip renders), `app/styles/03-nav-results-modals.css`.

### #4 — Mark-Paid Transition Animation

When a debt or required expense item changes to its paid state (after `handleMarkDebtMinimumPaid`, `handleMarkDebtSnowballPaid`, `handleMarkExpensePaid`), there is no visual acknowledgement beyond the state change. Add two animations:

1. `@keyframes cardExit` — companion to the existing `cardReveal`: `from { opacity: 1; transform: scale(1); } to { opacity: 0.72; transform: scale(0.99); }`, 200ms, plays once when the paid state is first applied (via a conditional class `animating-paid` applied for one render, then removed).
2. `@keyframes checkPulse` — a green checkmark overlay that appears on the amount cell and fades out over 400ms: `from { opacity: 1; transform: scale(1.2); } to { opacity: 0; transform: scale(0.8); }`.

The haptic feedback already fires (correct) — these animations complete the feedback loop visually.

**Files touched:** `app/styles/09-anim-swipe-media-misc.css` (keyframes), whichever component renders the paid-state class on debt/expense rows (likely `components/Debts/DebtRow.tsx` and `RequiredExpensesSection.tsx` or similar).

### #5 — Smart Insights Card Typography

The premium Smart Insights cards have excellent content but flat visual hierarchy — title, body, and action line are too similar in weight for the eye to know where to start. Three CSS-only improvements:

1. `.insight-title` (or equivalent class): `font-size: 1.12rem; font-weight: 900;` (up from current ~1.05rem/700)
2. `.insight-action` (or equivalent): add a `→ ` bold prefix OR a faint chip background (`background: rgba(148, 163, 184, 0.08); border-radius: 8px; padding: 4px 8px;`) to visually separate it from body text
3. Severity left-border: widen from ~2px to 3–4px; add a matching very-low-opacity tinted background wash on the card (e.g., `background: rgba(34, 197, 94, 0.04)` for "good" severity) so severity is scannable at a glance without reading the border width.

**Files touched:** Find the Smart Insights card CSS classes in `07-premium-upgrade.css` or `06-forecast-and-payoff-shell.css` — grep for `insight` class names to locate.

### #8 — Plan Tab Hero Personalization

Once a user has debt data (`activeDebts.length > 0`), replace the static subtitle *"Enter a paycheck and see exactly what to do next."* with a contextual line derived from already-computed values:

- If debt-free date is known: *"You're on track to be debt-free in [N] months."*
- If `projectedBuffer < 200`: *"Tight cycle — protect your minimums first."*
- Default (data exists but no special state): *"Here's what to do this paycheck."*

This is a conditional JSX expression in `app/page.tsx`'s hero render block, using values already in scope. No new computation needed.

**Files touched:** `app/page.tsx`.

### #12 — Windfall/Bonus Allocator (pulled from v1.5)

_(Moved here from the v1.5 addendum — has no dependency on v1.5's cycle-history work and is high enough impact to ship sooner. The v1.5 addendum is updated to reflect this.)_

See the original spec in the v1.5 addendum section below — implementation steps, data model changes, testing, and risk notes are preserved there for reference and should be treated as canonical even though the implementation ships here.

**Short summary:** A "Got extra money?" button in Plan Settings opens a single-input form. The windfall amount is added to the current `amount` for that one run — no new allocation logic, just a UI shortcut that pre-populates the paycheck field with `currentPaycheck + windfall`. Tier: Free.

### #7 — Category Icons on Bills and Debts

The `RequiredExpenseCategory` type already has 6 values (`housing`, `utilities`, `insurance`, `subscriptions`, `medical`, `other`). Map them to Lucide icon components (already imported via `lib/icons/index.ts`) rendered as small 14px icons inside a color-tinted chip badge:

| Category | Icon | Color |
|---|---|---|
| housing | `Home` | blue |
| utilities | `Zap` | amber |
| insurance | `Shield` | green |
| subscriptions | `RefreshCw` | purple |
| medical | `Heart` | red |
| other | `MoreHorizontal` | gray |

For debts: `type === "bnpl"` gets a distinct "BNPL" text badge (see #14 below); `type === "debt"` gets a credit card icon.

**Files touched:** `components/RequiredExpensesSection.tsx` (or its sub-components), `components/DebtsSection.tsx` (or `DebtRow.tsx`), `app/styles/00-theme-and-base.css` (new `.category-icon-chip` class).

### #9 — Display Amount Styling ($ + Cents Split)

For the largest financial numbers in the app (hero card totals, recommended payment amounts, execution strip figures), style the dollar sign at ~60% of the number's `font-size` and the cents at ~70%, matching the "tabular split" treatment used by Copilot, Robinhood, and Credit Karma.

**Approach:**
```tsx
// New helper: formatDisplayAmount(amount) → { dollars: string, cents: string }
// Renders as:
<span className="display-amount">
    <span className="display-amount-symbol">$</span>
    {dollars}
    <span className="display-amount-cents">.{cents}</span>
</span>
```
```css
.display-amount-symbol { font-size: 0.6em; vertical-align: super; font-weight: 700; }
.display-amount-cents  { font-size: 0.7em; vertical-align: super; font-weight: 700; }
```

Apply only to the Plan tab's largest hero numbers — not to every currency string in the app (which would add noise rather than premium feel). Identify target call sites by searching for the `formatCurrency` helper's usage in hero-visible components.

**Files touched:** New `lib/utils/formatDisplayAmount.ts`, `app/styles/00-theme-and-base.css`, 2–4 component call sites.

### #10 — Directional Tab Transitions

The current `tab-content-transition` fades content in. Extend this to a directional slide that mirrors tab order (Plan=0, Bills=1, Payoff=2, Goals=3) — forward tabs slide from right, backward tabs slide from left.

**Approach:**
```tsx
// app/page.tsx — track direction alongside activeTab
const prevTabRef = useRef(tabOrder[activeTab]);
const direction = tabOrder[activeTab] >= prevTabRef.current ? "forward" : "backward";
// Pass as data-direction attribute on the transition wrapper
<div key={activeTab} className="tab-content-transition" data-direction={direction}>
```
```css
.tab-content-transition[data-direction="forward"]  { animation: tabSlideInRight 180ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
.tab-content-transition[data-direction="backward"] { animation: tabSlideInLeft  180ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
@keyframes tabSlideInRight { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: none; } }
@keyframes tabSlideInLeft  { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
    .tab-content-transition[data-direction] { animation: tabFade 150ms ease both; }
    @keyframes tabFade { from { opacity: 0; } to { opacity: 1; } }
}
```

**Files touched:** `app/page.tsx`, `app/styles/09-anim-swipe-media-misc.css`.

### #11 — Upgrade Screen Preview Card

The paywall lists feature names but doesn't show what they look like. Add a frosted-glass preview card beneath the feature list containing a **static mock** of one premium card (e.g., a grayed/blurred version of the "Buffer looks stable" Smart Insights card layout with sample data). This is pure HTML/CSS — no live data, no logic.

```html
<div class="upgrade-preview-card">
    <div class="upgrade-preview-label">Smart Insights preview</div>
    <div class="upgrade-preview-insight-mock" aria-hidden="true">
        <!-- Static HTML mock of an insight card -->
    </div>
    <div class="upgrade-preview-blur-overlay">Unlock with Premium</div>
</div>
```

The blur overlay uses `backdrop-filter: blur(4px)` on an absolutely positioned element over the mock, with a "Unlock with Premium" label in the center. This makes the abstract feature list concrete and visually demonstrates what the user is buying.

**Files touched:** `components/UpgradeSection.tsx`, `app/styles/07-premium-upgrade.css`.

### #14 — BNPL Visual Differentiation (pre-cursor to v1.10)

The `debt.type === "bnpl"` field is stored but never surfaced in the Bills tab debt list. Before v1.10 fixes the underlying BNPL calculations, at least make BNPL debts visually distinct:

- Add a `BNPL` badge (small pill, e.g., purple) on BNPL debt rows
- If `remainingPayments` is present, show *"X payments left"* instead of the APR field (BNPL is effectively 0% APR — showing APR for a BNPL debt is misleading)
- If `scheduledPaymentAmount` is present, show it as the fixed payment amount

Pure render change in `DebtRow.tsx` or wherever individual debt items render.

**Files touched:** `components/DebtsSection.tsx` (or `DebtRow.tsx`), `app/styles/` (new `.bnpl-badge` style).

### #17 — Basic Aria-Label Audit

Before v1.12's full accessibility audit, close the most obvious gaps that could trigger App Store accessibility rejections:

1. Grep for all `<button>` elements in `components/` — verify each has either a visible text label or an `aria-label` attribute. The icon-only buttons (theme toggle, settings gear, sort direction, swipe-action delete) are the most likely to be missing labels.
2. Add `role="region"` + `aria-label` to major content sections (debt list, expenses list, plan results) so screen reader users can navigate between them.
3. Verify swipe-to-pay items have a tap/button fallback visible to VoiceOver — the swipe gesture alone is inaccessible. The existing "Mark Paid" button (if it exists in the item's non-swiped UI) may already cover this; if not, add one.
4. `aria-live="polite"` is already on the save-status toast (correct) — check for any other dynamic numeric regions that update without user action (running balance, buffer amount after marking paid) and add `aria-live="polite"` there too.

**Files touched:** Various `components/*.tsx` files (additive `aria-label` props only), possibly `app/page.tsx`.

### #27 — 3-Way Theme Selector: System / Light / Dark

Replace the floating icon button in the hero header with a proper 3-way segmented control in Settings. This was explicitly requested as a quality/professionalism improvement and is the correct iOS convention.

**`lib/hooks/useDarkMode.ts` — new 3-state type:**
```ts
export type ThemePreference = "system" | "light" | "dark";

export function useDarkMode() {
    const [theme, setTheme] = useState<ThemePreference>(() =>
        loadStoredState("debtPlanner.theme", "system")
    );

    useEffect(() => {
        localStorage.setItem("debtPlanner.theme", JSON.stringify(theme));

        const resolvedDark =
            theme === "dark" ? true :
            theme === "light" ? false :
            window.matchMedia("(prefers-color-scheme: dark)").matches;

        // Apply dark class, StatusBar.setStyle, etc. using resolvedDark
        applyDarkMode(resolvedDark);
    }, [theme]);

    // Add matchMedia listener when theme === "system" so the app
    // responds in real-time to OS theme changes without a reload
    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => applyDarkMode(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    return { theme, setTheme };
}
```

**Settings UI:** A segmented control (3 pill-buttons in a row: `System | Light | Dark`) inside the Settings sheet. The active option has the accent color background; inactive are ghost/muted. This replaces the floating icon toggle in `app/page.tsx`'s hero header — remove that button entirely once the Settings control exists.

**Files touched:** `lib/hooks/useDarkMode.ts`, `app/page.tsx` (remove hero toggle, update call sites from `setDarkMode(bool)` to `setTheme(preference)`), Settings UI component.

### #20 — Swipe-Delete Undo Toast

**The gap (verified `components/Debts/DebtRow.tsx:197`).** Swipe-left → Remove calls `onRemoveDebt` immediately with no confirmation and no undo. This is the only irreversible per-item action with no guard. Implement an undo toast pattern.

**Implementation:**
1. In the parent list state (e.g., `useDebts`), instead of removing immediately, move the deleted item to a `pendingDelete: { item: Debt; timeout: number } | null` state.
2. `setDebts(current => current.filter(d => d.id !== id))` still runs — the item disappears from the list.
3. Simultaneously show a toast: "Debt removed. [Undo]". The "Undo" button calls `setDebts(current => [...current, pendingDelete.item])` and clears `pendingDelete`.
4. After 5 seconds, the timeout fires: `pendingDelete` is cleared and the deletion is final (nothing more to do — it was already removed from state).
5. Same pattern for expense deletion.

**Files touched:** `lib/hooks/useDebts.ts`, `lib/hooks/useRequiredExpenses.ts`, a new `UndoToast.tsx` component or extended `statusMessage` system in `app/page.tsx`, `app/styles/` (toast styling).

### #22 — Sheet Grabber Handles

CSS-only addition to all bottom sheets. The grabber is a visual affordance that the sheet is draggable/dismissible.

```css
/* app/styles/03-nav-results-modals.css */
.settings-sheet::before,
.upgrade-modal-card::before {
    content: "";
    display: block;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: rgba(148, 163, 184, 0.32);
    margin: 0 auto 16px;
    flex-shrink: 0;
}
.dark-theme .settings-sheet::before,
.dark-theme .upgrade-modal-card::before {
    background: rgba(255, 255, 255, 0.18);
}
```

Apply to Add Debt modal, Add Expense modal, and the Goals edit modal as well — grep for all `position: fixed` bottom-anchored containers.

**Files touched:** `app/styles/03-nav-results-modals.css`, `app/styles/04-debt-modals-focus.css` (if modals are styled there).

### #23 — Toast Animation (Save-Status-Toast)

```css
/* app/styles/09-anim-swipe-media-misc.css */
.save-status-toast {
    animation: toastEnter 200ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}
@keyframes toastEnter {
    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
.save-status-toast.exiting {
    animation: toastExit 180ms ease both;
}
@keyframes toastExit {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-6px); }
}
@media (prefers-reduced-motion: reduce) {
    .save-status-toast, .save-status-toast.exiting { animation: none; }
}
```

The `.exiting` class requires a small JS change: instead of clearing `statusMessage` directly on the timeout, set an `isToastExiting` flag for 180ms (the exit animation duration), then clear `statusMessage` after that delay.

**Files touched:** `app/styles/09-anim-swipe-media-misc.css`, `app/page.tsx` (statusMessage timeout logic).

### #24 — Staggered Animations on Debt and Expense Lists

Apply the identical `cardReveal` + staggered nth-child delay pattern already used on `.goal-list-item` to `.debt-list-item` and the required-expenses list items.

```css
/* app/styles/09-anim-swipe-media-misc.css — add alongside existing goal-list-item rules */
.debt-list-item {
    animation: cardReveal 200ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}
.debt-list-item:nth-child(2) { animation-delay: 30ms; }
.debt-list-item:nth-child(3) { animation-delay: 60ms; }
.debt-list-item:nth-child(4) { animation-delay: 90ms; }
.debt-list-item:nth-child(5) { animation-delay: 120ms; }
/* Same pattern for the expense list item class — identify the correct class name in RequiredExpensesSection */
@media (prefers-reduced-motion: reduce) {
    .debt-list-item { animation: none; }
}
```

**Files touched:** `app/styles/09-anim-swipe-media-misc.css`. **Risk:** Minimal — uses the existing `cardReveal` keyframe already present in the file.

### #25 — Interest Cost Per Debt Callout

Display the monthly interest cost on each non-BNPL debt card row. The function `lib/debt/calculateMonthlyInterest.ts` already computes this exactly — it just isn't shown.

```tsx
// In DebtRow.tsx or wherever debt balance is displayed:
import { calculateMonthlyInterest } from "@/lib/debt/calculateMonthlyInterest";

const monthlyInterest = debt.apr > 0 && !debt.isPaidOff
    ? calculateMonthlyInterest(debt.balance, debt.apr)
    : 0;

// Render (only when monthlyInterest > 0):
{monthlyInterest > 0 && (
    <span className="debt-interest-callout">
        ~{formatCurrency(monthlyInterest)}/mo in interest
    </span>
)}
```

Style `.debt-interest-callout` as `font-size: 0.75rem; color: var(--status-bad-strong); opacity: 0.85` — noticeable but not alarming, purely informational.

**Files touched:** `components/Debts/DebtRow.tsx` (or wherever balance renders), `app/styles/`.

### #26 — Haptic Grammar Completion

Audit and fix the haptic grammar for all significant actions. Verified gaps:

| Action | Current | Should be |
|---|---|---|
| Mark expense paid (swipe) | Medium ✓ (ExpenseListItem:181) | Medium ✓ |
| Mark debt minimum paid | Medium ✓ (DebtRow:151) | Medium ✓ |
| Rollover (Start Next Cycle) | **None** ✗ | Medium |
| Successful backup import | **None** ✗ | Medium |
| Successful CSV import | **None** ✗ | Medium |
| Validation error (empty required field) | **None** ✗ | Error (see below) |
| Delete debt/expense (swipe) | Light (DebtRow:198) | Medium |

Capacitor doesn't expose a dedicated "error" haptic style through `@capacitor/haptics` at the `ImpactStyle` level, but can be approximated via `Haptics.notification({ type: NotificationType.Error })` — check whether this is already imported in `lib/mobile/haptics.ts` and add a `triggerErrorHaptic()` export if not.

**Files touched:** `lib/mobile/haptics.ts` (add `triggerErrorHaptic` if needed), `app/page.tsx` (rollover + import handlers), `components/Debts/AddDebtModal.tsx` + `components/RequiredExpenses/AddExpenseModal.tsx` (error state), `components/Debts/DebtRow.tsx` (delete swipe action).

### #28 — Privacy/Local-Storage Trust Messaging

Add one line to the Settings sheet, near the Backup & Restore section:

```tsx
<p className="settings-privacy-note">
    Your data stays on this device — nothing is uploaded or shared.
</p>
```

Style: `font-size: 0.78rem; color: var(--text-secondary); text-align: center; margin-top: 8px`. No icon needed — the text alone is sufficient and avoids the "too much marketing" feel.

**Files touched:** Settings sheet JSX (in `app/page.tsx` or `components/PlanSettings/PlanSettingsSheet.tsx` once that refactor ships).

---

## v1.5 — Pay Cycle History

**Scope:** Persist a snapshot of each completed pay cycle so users (and later, AI in v2.0) can see trends over time.

**Current state:** `handleRolloverPayCycle` in `app/page.tsx` advances `currentDate`/`nextPaycheckDate`, recalculates debt balances with interest, and clears `completedRecommendedActions` — but throws away the prior cycle's state entirely. Nothing is retained.

**Implementation steps:**
1. New type in `lib/storage/debtPlannerStorage.ts`:
   ```ts
   export type PayCycleSnapshot = {
       cycleEndDate: string;
       totalDebtBalance: number;
       totalPaidThisCycle: number;
       completedRecommendedActions: CompletedRecommendedAction[];
       payoffStrategy: "snowball" | "avalanche";
   };
   ```
2. New `lib/hooks/usePayCycleHistory.ts` — owns `cycleHistory: PayCycleSnapshot[]` state + `debtPlanner.cycleHistory` persistence, exposes `recordCycleSnapshot(snapshot)` and a tier-aware `visibleHistory` getter (slices to last 6 for Premium, full array for Premium+).
3. In `app/page.tsx`'s `handleRolloverPayCycle`, call `recordCycleSnapshot(...)` with the pre-rollover state **before** mutating debts/clearing completed actions.
4. New `components/HistorySection.tsx` — list/chart of past cycles, gated via `hasFeatureAccess` (Premium = capped list with an upsell row at the cap, Premium+ = full list).
5. New nav entry point — likely a row inside Plan Settings ("View Pay Cycle History") rather than a 5th bottom-nav tab, to avoid crowding the nav.

**Data model changes:** new `PayCycleSnapshot` type, new `debtPlanner.cycleHistory` storage key.

**Tier gating:** extends `hasFeatureAccess` — first real use of "same feature, different limit per tier" rather than "feature on/off," which is good groundwork to validate before the bigger v1.9 3-tier rework.

**Testing:** regression test in `lib/testing/` verifying a rollover produces exactly one new snapshot with correct totals; e2e test verifying the History view shows capped vs. uncapped results per mocked tier.

**Risk:** Low. Additive, no existing behavior changes except adding one snapshot-write call inside an existing handler.

---

## v1.5 addendum — Windfall/Bonus One-Time Allocator (Free)

_**Implementation moved to v1.4 addendum** (see "UX Polish + Paywall Improvements" above) — the feature has no dependency on v1.5's cycle-history work and is high enough impact to ship sooner. The full implementation spec is preserved here as canonical reference._

**Scope:** Let a user enter a one-time extra amount (a bonus, tax refund, etc.) and run it through the existing allocation engine as an immediate extra payment, without it needing to be a recurring paycheck.

**Implementation steps:**
1. New UI entry point — a "Got a windfall?" action on the Plan tab (or inside Plan Settings), opening a small form: one amount input.
2. Reuse the existing snowball/avalanche extra-payment path in `lib/engine/allocatePaycheck.ts` — a windfall is just a one-time extra-payment amount fed through the same allocation logic already used for the recurring snowball/avalanche extra, not a new calculation. Do not duplicate the allocation math.
3. Apply the result via the existing `handleMarkRecommendedAction`/debt-payment flow so it's tracked consistently with regular recommended actions (same `completedRecommendedActions` ledger, `paymentSource: "paycheck"`).

**Data model changes:** none — reuses existing types and the existing allocation engine.

**Tier:** Free, all tiers — per `ROADMAP.md` §2, this is explicitly called out as fitting the free engine as-is, not a Premium hook.

**Testing:** regression test confirming a windfall amount run through the engine produces identical allocation behavior to an equivalent recurring extra-payment amount (same engine, same math — this test guards against the UI accidentally diverging from the existing allocation logic).

**Risk:** Low. Thin UI layer over an already-correct, already-tested engine path.

---

## v1.5 addendum — Mobile Polish: Skeleton Loading

_Full detail in `MOBILE_POLISH_ROADMAP.md`/`MOBILE_POLISH_IMPLEMENTATION_PLAN.md` (phase P5)._

**P5 — Context-aware skeleton loading:** Split `components/AppSkeleton.tsx` into shape-specific skeleton pieces (debt-row-shaped, plan-summary-shaped) reusing the existing `skeletonShimmer` keyframe, composed based on which tab would be active on load.

**Files touched:** `components/AppSkeleton.tsx` (split into a new `components/Skeleton/` subfolder, following this codebase's established split-into-subdirectory pattern).

**Risk:** Low. Purely presentational, shown only during the brief initial-mount window.

---

## v1.5 addendum — Page Orchestrator Refactor, Phase 1 (Mechanical Relocations)

_Full detail in `PAGE_ORCHESTRATOR_PLAN.md`. This is the first of five phases moving `app/page.tsx` from "main brain" to orchestrator; sequenced to start here since v1.5's own feature scope (pay cycle history) is small and doesn't touch the same surface area, minimizing merge risk._

**Scope:** Move `handleImportDebtsCsv` into `lib/hooks/useDebts.ts` as `handleImportCsv`; give `livingExpenses` its own `lib/hooks/useLivingExpenses.ts` (one state, one effect, closing the last inconsistency with the other domain hooks); extract `getDebtDisplayBalance` + the `debtsWithDisplayBalances`/`activeDebts`/`paidOffDebts` derivation into a pure `lib/debt/getDebtsWithDisplayBalances.ts`.

**Files touched:** `lib/hooks/useDebts.ts`, new `lib/hooks/useLivingExpenses.ts`, new `lib/debt/getDebtsWithDisplayBalances.ts`, `app/page.tsx`.

**Testing:** `npx tsc --noEmit`, `npm run lint`, manual dev-server check (all 4 tabs, both themes) — pure relocation, no regression-test need.

**Risk:** Low. No logic change, only relocation.

---

## v1.5 addendum — Data Visualizations + Since-Last-Cycle Delta (from Premium Audit)

**Scope:** Two related items from `premium-ux-audit.md` sequenced here because both depend on data that v1.5 establishes: the payoff trajectory chart needs `projectDebtPayoff` to run across multiple months (same data v1.5's history snapshots capture), and the delta indicator needs a previous-cycle snapshot to diff against (v1.5 is the first version that stores one).

### #1 — Debt Payoff Trajectory Chart (audit #1 — highest-impact item in the entire audit)

**The gap.** The app is all numbers and text. Every premium fintech competitor shows charts. The emotional core of a debt payoff app is *seeing the finish line* — a visual line descending toward zero over time. The data is already computed; the chart is missing.

**SVG only — no chart library.** The data sets are tiny (≤10 debts, ≤36 months). A library adds bundle weight and a style integration cost that isn't worth it at this scale.

**Three visualizations, in priority order:**

**1a. Debt Payoff Trajectory** (Payoff/Snowball tab) — the primary and most impactful chart. Two lines: snowball balance over time, avalanche balance over time, both plotted monthly until $0. Built from the existing `projectDebtPayoff` function — call it for each strategy and collect the `projectedDebtBalance` array, then render as a two-line SVG path.

```tsx
// Pseudocode — exact values TBD during implementation
const snowballPoints = projectDebtPayoff({ debts, strategy: "snowball", extraPayment }).map(
    (m, i) => ({ x: (i / totalMonths) * chartWidth, y: chartHeight - (m.balance / maxBalance) * chartHeight })
);
// Render as <polyline points={snowballPoints.map(p => `${p.x},${p.y}`).join(" ")} />
```

Label the point where each line hits zero with the payoff date. This is the most emotionally compelling screen in the app once built.

**1b. 3-Month Cash Flow Status Bars** (Plan tab, inside Forecast card) — replace the current `ForecastMonth` text-list rows with 3 horizontal status bars, color-coded by `ForecastStatus` (`stable`=green, `tight`=amber, `pressure`=orange, `recovery`=red). The month label and description text remain beneath each bar. The bar adds a "how healthy is this month?" at-a-glance read without replacing the explanatory text.

**1c. Per-Debt Progress Bar** (Bills tab, debt list items) — a thin horizontal bar beneath each debt's name showing `(originalBalance - balance) / originalBalance` percent paid off. `originalBalance` already exists on the `Debt` type. CSS-only bar (no SVG), styled similarly to the goal progress bars in the Goals tab. Makes the debt list feel like a progress dashboard, not a spreadsheet.

**Files touched:** `components/SnowballSection.tsx` (1a), `components/ResultsSection.tsx` or wherever the Forecast card renders (1b), `components/DebtsSection.tsx` or `DebtRow.tsx` (1c), `app/styles/` (new chart and progress-bar styles), possibly new `components/Charts/PayoffChart.tsx`.

**Risk:** Low-medium. SVG coordinate math is straightforward but requires care around edge cases (zero debts, single debt, debts with zero APR). The payoff trajectory needs to handle the case where snowball and avalanche produce identical results (don't show duplicate lines — show one, label it as "Both strategies"). Test against the demo dataset.

### #13 — Since-Last-Cycle Delta Indicator (audit #13)

Once v1.5's cycle history stores snapshots, the execution-summary-strip can show progress relative to the previous cycle.

**What to add:**
```
Total Debt  $18,420  ↓ $342 since last paycheck
```

Implementation:
1. In `usePayCycleHistory.ts` (new hook from v1.5), add a `previousSnapshot` getter that returns the most recent completed snapshot (or `null` if no history yet).
2. In the execution-summary-strip, compute `delta = previousSnapshot.totalDebtBalance - currentTotalDebt`. If `delta > 0` (debt reduced), render a green `↓ $X` sub-line. If `delta < 0` (debt added), render amber `↑ $X`. If no previous snapshot, render nothing (first cycle, no comparison available yet).
3. Apply `font-variant-numeric: tabular-nums` to the delta value for alignment.

**Files touched:** `lib/hooks/usePayCycleHistory.ts` (getter), `components/ResultsSection.tsx` (or wherever the strip renders), `app/styles/03-nav-results-modals.css` (new `.summary-strip-delta` style).
**Risk:** Low. Purely additive display; the snapshot is already written by v1.5's rollover work.

---

## v1.6 — Debt Milestones + Amortization Calendar + Streaks

**Scope:** Three related but separable features — ship as one version since they share the "celebrate progress" theme, but implement independently.

### Milestones
1. New `lib/debt/computeMilestones.ts` — pure function comparing `debt.balance` against `debt.originalBalance` per debt, returning crossed thresholds (25/50/75/100%) plus an "all debts paid off" check across the whole list.
2. New `components/MilestoneBadge.tsx` — small celebratory card/toast, triggered when a rollover crosses a threshold (compare pre/post rollover milestone state in `handleRolloverPayCycle`).
3. Free tier gets badges with no calendar; Premium+ unlocks the full calendar (below) which puts milestones in context.
4. **Debt payoff celebration moment (audit #19b):** When `computeMilestones` detects a debt crossed the 100% threshold (balance === 0 after rollover), trigger a distinct "debt paid off" experience beyond a standard milestone badge — this is the emotional peak of the entire app. Specifics TBD at implementation time, but should include at minimum: a `triggerMediumHaptic()`, a full-width celebration card (`MilestoneBadge` variant with confetti-style CSS animation), and the debt's name displayed prominently ("Credit Card — PAID OFF"). This is the moment users screenshot and tell friends about; it should feel earned.

### Amortization Calendar (Premium+)
1. New `lib/debt/buildAmortizationSchedule.ts` — given one debt + its minimum payment (and optional extra payment), produce a month-by-month `{ month, startingBalance, interest, principal, endingBalance }[]` until payoff. This is structurally similar to the existing `lib/debt/applyDebtPaymentProjection.ts` (single-month step) — likely just loops that function and collects results, reusing it rather than duplicating the math.
2. New `components/AmortizationCalendar.tsx` — per-debt table/calendar view, accessible from each debt row in `DebtsSection` (or `DebtRow`) via a new "View Schedule" action, gated via `hasFeatureAccess`.

### Streaks
1. Depends on v1.5's `cycleHistory`. New derived value: count consecutive snapshots where `totalPaidThisCycle >= totalRequired` (on-track), broken on any cycle that fell short.
2. Surface as a small stat ("4-cycle streak 🔥") near the top of the Plan tab — free tier gets the count, Premium+ gets the historical chart (reuses History view from v1.5).

**Data model changes:** none new beyond what v1.5 added — milestones and streaks are computed from existing/v1.5 data, not stored.

**Testing:** regression tests for `computeMilestones` (threshold-crossing edge cases — e.g., paying off a debt in one lump sum should report ALL crossed thresholds, not just 100%) and `buildAmortizationSchedule` (verify final month's `endingBalance` is exactly 0, verify total interest matches `projectDebtPayoff`'s existing `totalInterestPaid` for the same inputs — these two functions must agree).

**Risk:** Medium. The amortization schedule must mathematically reconcile with the existing payoff projection engine — if they disagree, that's a trust-breaking bug in a finance app. Budget time for a reconciliation test, not just unit tests in isolation.

---

## v1.6 addendum — Settings UX Rework (from Premium Audit #15)

**Scope:** The Plan Settings is currently a modal (slide-up sheet). For returning users adjusting a single setting, opening a modal to change one field feels heavy. `premium-ux-audit.md` #15 recommends converting it.

**Decision required before implementation:** Two viable approaches:
1. **Accordion/in-place expansion** — the settings gear + theme toggle expand into a settings panel below the hero heading, in-line with the page content, without a modal overlay. Feels native on mobile, avoids navigation complexity, keeps the 4-tab constraint intact. Recommended.
2. **Dedicated Settings tab** — 5th tab in the bottom nav. Simpler to implement but crowding 5 items in the bottom nav may feel cluttered on 375px-wide phones.

Recommend **Option 1 (accordion)** — align with the existing `plan-section-body` expand/collapse pattern already in the codebase. The settings gear becomes a toggle that expands the settings block in-place, using the same `max-height`/`opacity`/`transform` transition pattern already present.

**Note on theme toggle relocation:** If this accordion ships, relocate the theme toggle from the hero header (where it's currently an icon button that can be missed) into the Settings accordion as a proper 3-way selector (System / Light / Dark) — see the related discussion below. The hero's floating icon button can then be removed.

**Files touched:** `app/page.tsx`, `components/PlanSettings/PlanSettingsSheet.tsx` (or its successor from the v1.6 Page Orchestrator Phase 2 work), `app/styles/03-nav-results-modals.css`.
**Risk:** Medium. The settings modal is used during first-run onboarding (v1.4) — verify the accordion approach still works correctly in the `isFirstRunSetup` branch, or keep the modal form for first-run only and switch to the accordion for returning-user settings.

---

## v1.6 addendum — Mobile Polish: Micro-Interaction Pass

_Full detail in `MOBILE_POLISH_ROADMAP.md`/`MOBILE_POLISH_IMPLEMENTATION_PLAN.md` (phase P6)._

**P6 — Micro-interaction pass:** Audit every button variant's `:active` scale transform for consistency; apply the existing `planItemReveal` keyframe to newly-added list items on Bills/Debts/Goals tabs, not just Plan (must only animate genuinely new items, not re-trigger on unrelated re-renders — the one real correctness risk in this phase); give this version's own milestone badges a celebratory entrance reusing existing easing curves. Per the standing rule established in v1.3's addendum, every new animation here also needs a `prefers-reduced-motion` fallback — don't skip it because it feels like "just a small bounce."

**Files touched:** `app/styles/09-anim-swipe-media-misc.css`, list-rendering components (`DebtGroup.tsx`, expense list parent, `GoalsSection.tsx`), `components/MilestoneBadge.tsx` (new this version per the feature plan above).

**Risk:** Low-medium. The "only animate new items" requirement needs a stable per-item `key` and a mount-scoped animation trigger, not a re-triggerable class toggle.

---

## v1.6 addendum — Page Orchestrator Refactor, Phase 2 (JSX Componentization)

_Full detail in `PAGE_ORCHESTRATOR_PLAN.md`. Presentation-only relocation, no logic change — reasonable to bundle alongside this version's milestone/amortization feature work since it touches a different layer (JSX structure, not calculation logic)._

**Scope:** Extract `components/AppHeader.tsx` (hero block: title, last-saved indicator, status toast, theme toggle, dev-only buttons), `components/BottomNav.tsx` (4-button nav), and `components/PlanSettings/PlanSettingsSheet.tsx` (the entire settings overlay, preserving its onboarding-vs-settings branch) with `NotificationsCard.tsx`/`AppLockCard.tsx`/`LegalLinks.tsx` split out the same way `AddDebtModal`/`AddExpenseModal` were split from their parents. Mirrors the existing `components/Debts/`, `components/RequiredExpenses/`, `components/Onboarding/` folder convention.

**Files touched:** new `components/AppHeader.tsx`, `components/BottomNav.tsx`, `components/PlanSettings/` (4 new files), `app/page.tsx`.

**Testing:** `npx tsc --noEmit`, `npm run lint`, manual dev-server check (all 4 tabs, settings sheet, both themes).

**Risk:** Low. Relocation + prop-drilling only; `PlanSettingsSheet` will take many props by necessity (same accepted pattern as `OnboardingFlow`'s ~30 props today).

---

## v1.7 — Home Screen Widget + Live Activities/Dynamic Island + Custom App Icons

**Scope:** Native iOS features outside the Capacitor/JS layer entirely.

**Implementation steps:**
1. **Widget**: requires a new **Widget Extension target** in the Xcode project (SwiftUI `WidgetKit`), not buildable from the JS/Capacitor side. Needs:
   - An **App Group** (e.g., `group.com.jasonsnyder.debtplanner`) shared between the main app and the widget extension
   - The main app must write a small summary blob (days to next paycheck, total debt remaining, debt-free date) to the shared App Group container — likely via a tiny Capacitor plugin call or a `UserDefaults(suiteName:)` write triggered from JS on each relevant state change (paycheck date change, debt balance change)
   - Widget reads that shared blob on its own refresh timeline (WidgetKit manages refresh, app doesn't push to it directly)
2. **Live Activities / Dynamic Island**: built on top of the exact same App Group + summary-blob infrastructure as the widget — this is why it's sequenced into v1.7 rather than its own version. Needs:
   - `ActivityKit` (iOS 16.1+) integration in the widget extension target — a Live Activity is a special kind of widget, not a separate Xcode target.
   - Start/update/end the activity from the main app (via the same small native plugin used for the App Group write) at the natural trigger points: starting a Live Activity when the user has an active payoff plan, updating it on each relevant state change, ending it if the user disables the feature or pays off all debts.
   - Dynamic Island support comes largely "for free" once the Live Activity exists — iOS renders the same activity in the Island automatically; the main design work is the compact/minimal/expanded view layouts ActivityKit requires.
   - Content: "Debt-free in 14 months" or "Payday in 3 days" — reuse the same summary data already being computed for the widget, don't build a second data pipeline.
3. **Custom icons**: iOS supports alternate app icons natively (`UIApplication.shared.setAlternateIconName`), but Capacitor has no built-in bridge for this. Either write a tiny custom Capacitor plugin (a few lines of Swift) or use a community plugin if one exists and is well-maintained — evaluate at implementation time rather than committing to a specific package now.
4. All three features are **Premium-gated in the JS layer** (show/hide entry points in settings based on `hasFeatureAccess`), but the underlying OS capability isn't something the JS layer can truly lock — acceptable since this matches how the rest of the app's premium gating already works (client-side only, no DRM).

**Files touched:** new Xcode target + Swift files (outside `lib/`/`components/`), a new small native plugin if going that route, `components/PaycheckSection.tsx` or a new Settings subsection for icon picker UI.

**Testing:** manual on-device only — widgets, Live Activities, and alternate icons cannot be meaningfully tested in CI/Playwright since they're native OS surfaces. Live Activities specifically need testing on a physical device with Dynamic Island hardware (iPhone 14 Pro or later) to verify the compact/expanded Island states, not just the lock-screen presentation.

**Risk:** Medium-high relative to its size — this is the first version requiring native Swift work beyond Capacitor's JS bridge, and Live Activities add a second ActivityKit-specific learning curve on top of WidgetKit. Recommend timeboxing exploration before committing the version slot; if the App Group + widget plumbing proves heavier than expected, ship custom icons alone first, then the widget, then Live Activities last (in that order of increasing native complexity) rather than letting any one feature block the others.

**Business note:** per `ROADMAP.md` §2, this is the activation point for **Premium's annual pricing** ($39.99/yr) — a RevenueCat/App Store Connect product-configuration task, not code, but sequence it alongside this version's launch since this is when Premium's feature set becomes stable enough to sell a year-long commitment against.

---

## v1.7 addendum — Page Orchestrator Refactor, Phase 3 (Backup/Snapshot Hook)

_Full detail in `PAGE_ORCHESTRATOR_PLAN.md`. Pure JS/TS work, independent of this version's native Swift widget work — safe to run in parallel since neither touches the other's files._

**Scope:** New `DebtPlannerBackup` type in `lib/storage/debtPlannerStorage.ts` matching `buildBackupData`'s current shape (currently untyped). New `lib/hooks/usePlannerBackup.ts` owning `buildBackupData`, `saveResetSnapshot`, `handleExportBackup`, `handleImportBackup`, `handleResetToToday` — takes every domain value/setter it currently closes over as parameters, same pattern as `useSubscription`/`useNotificationsSetting`. `useDebts`/`useRequiredExpenses`'s existing `saveResetSnapshot` constructor parameter switches to come from this hook's return value instead of being defined inline in `page.tsx` — verify hook initialization order still resolves.

**Files touched:** `lib/storage/debtPlannerStorage.ts`, new `lib/hooks/usePlannerBackup.ts`, `app/page.tsx`, `lib/hooks/useDebts.ts`, `lib/hooks/useRequiredExpenses.ts`.

**Testing:** `npx tsc --noEmit`, `npm run lint`, manual export → import round trip, one "Reset to Today" exercise.

**Risk:** Low-medium. Wide-signature hook by necessity, not a design flaw; the hook-initialization-order dependency (backup hook's output feeds into `useDebts`/`useRequiredExpenses`) is the one thing to verify carefully.

---

## v1.8 — Multi-Scenario Planning

**Scope:** Let users save and compare multiple named what-if scenarios instead of one ephemeral simulation.

**Current state:** `components/SnowballSection.tsx` already has a full what-if simulator (`simulationExtraPayment`, `simulationStrategy` state, `projectDebtPayoff` calls) — but it's a single, unsaved, in-memory scenario that resets on navigation.

**Implementation steps:**
1. New type: `Scenario = { id: string; name: string; extraPayment: number; strategy: "snowball" | "avalanche" | "recommended"; createdAt: string }`.
2. New `lib/hooks/useScenarios.ts` — CRUD over a `debtPlanner.scenarios` array, capped (e.g., 3) for Premium+, since this is explicitly a Premium+ feature.
3. New `components/Scenarios/ScenarioComparisonView.tsx` — runs `projectDebtPayoff` once per saved scenario against the same current debt state, renders a side-by-side comparison grid (reuse the visual pattern already in `SnowballSection`'s strategy-comparison card).
4. The existing single-scenario simulator in `SnowballSection` becomes the "create a new scenario" entry point — "Save This Scenario" button persists the current simulation inputs as a named `Scenario`.

**Data model changes:** new `Scenario` type, new `debtPlanner.scenarios` storage key.

**Testing:** regression test confirming running the same inputs through the saved-scenario path and the existing ephemeral simulator path produce identical projections (they should call the same underlying `projectDebtPayoff`, just with different state management around it — this test guards against the new code accidentally diverging from the existing simulator's logic).

**Risk:** Low-medium. Mostly UI/state-management work layered on an already-correct calculation engine.

---

## v1.8 addendum — Probabilistic Payoff Projections (Variable/Gig Income)

**Scope:** Instead of one deterministic debt-free date, run the existing projection engine across a distribution of possible paycheck amounts and show a date range with confidence bands — for users whose income isn't a fixed, predictable number every cycle.

**Why this pairs with Multi-Scenario Planning, not its own version:** Both features are "run the existing projection engine multiple times and compare results" — multi-scenario varies the strategy/extra-payment inputs, this varies the income input. Same underlying math, same UI pattern (comparison view), same version.

**Implementation steps:**
1. New income-variance input: instead of (or in addition to) a single paycheck amount, let the user enter a range (min/typical/max) or recent-history-based variance for gig/freelance income. Keep this opt-in — fixed-income users should see zero change to today's single-number flow.
2. New `lib/forecast/projectPayoffDistribution.ts` — runs `projectDebtPayoff` (the same function already used everywhere else, not a new calculation) N times (e.g. 200-500 simulated paycheck sequences sampled from the entered variance) and aggregates the resulting payoff dates into percentile bands (e.g. "50% chance debt-free by X, 90% chance by Y"). This is a sampling/aggregation layer on top of the existing engine, not new financial math — the reconciliation-test discipline from `ROADMAP.md` §6 still applies: verify the median outcome of the distribution matches a single deterministic run at the average income.
3. New `components/Payoff/ProjectionDistributionChart.tsx` — visualizes the range (a simple band chart: earliest/median/latest debt-free date), reusing `SnowballSection`'s existing chart/visual patterns rather than introducing a new charting approach.
4. Surface this as an alternative view within the existing Multi-Scenario comparison UI (a toggle: "Fixed income" vs. "Variable income" mode) rather than a fully separate screen.

**Data model changes:** new optional income-variance fields on the paycheck settings (additive, fixed-income users are unaffected).

**Tier:** Premium+, matching Multi-Scenario Planning.

**Testing:** regression test verifying the distribution's median outcome matches the deterministic `projectDebtPayoff` result for the average income value in the entered range — this is the critical correctness check, since a probabilistic feature that quietly disagrees with the app's own deterministic math everywhere else would be a trust-breaking bug in a finance app.

**Risk:** Medium. The sampling/aggregation logic is new (even though it's built on the existing, already-correct engine), and presenting probability ranges clearly without confusing or alarming users takes real UX care — a "you might not be debt-free until 2 years later than expected" framing needs to be handled thoughtfully, not just mathematically correctly.

---

## v1.8 addendum — Page Orchestrator Refactor, Phase 4 (Plan-Execution Hook)

_Full detail in `PAGE_ORCHESTRATOR_PLAN.md`. Thematically paired with this version's own scenario-planning feature — both are about how the user's plan-execution state is tracked and presented._

**Scope:** New `lib/hooks/usePlanExecution.ts` owning `payoffStrategy` state+persistence, `completedRecommendedActions` state+persistence, `recommendationOverrides` state (stays unpersisted, matching today's behavior), `handleMarkRecommendedAction` (the goal-balance reconciliation math), `getCompletedRecommendedAmountForDebt`. Takes `goals`/`setGoals` and `saveResetSnapshot` (from v1.7's `usePlannerBackup`) as parameters.

**Files touched:** new `lib/hooks/usePlanExecution.ts`, `app/page.tsx`.

**Testing:** `npx tsc --noEmit`, `npm run lint`, manual check — mark and un-mark a recommended action against a goal, confirm the reconciliation math still nets to zero.

**Risk:** Low-medium. The goal-balance reconciliation math is the one piece of real logic moving here (not just relocation) — verify it behaves identically pre/post move with the manual check above.

---

## v1.9 — 3-Tier Subscription Infrastructure + Export/Backup Automation + External Payment Logging

**Scope:** This is the version where the tier model used loosely by v1.5-v1.8 above gets formalized. Should ship *before* v1.6-v1.8 in practice if any of them slip — flagging here that the roadmap's ordering (3-tier infra at v1.9, after several Premium+-gated features already shipped) only works if those earlier features are built tier-aware from day one rather than retrofitted. Recommend treating "use `hasFeatureAccess` correctly, even before it formally supports 3 tiers" as a standing rule starting now, not just at v1.9.

**Current state (verified):** `lib/subscription/plans.ts` → `SubscriptionPlan = "free" | "premium"`. `lib/subscription/hasFeatureAccess.ts` → binary, `plan === "premium"` grants everything. RevenueCat integration (`lib/subscription/revenueCat.ts`) reads a single `"premium"` entitlement ID.

**Implementation steps:**
1. Expand `SubscriptionPlan` to `"free" | "premium" | "premium_plus" | "ultimate"`.
2. Expand `lib/subscription/features.ts`'s `PremiumFeature` union to include the new Premium+/Ultimate features built in v1.5-v1.8 (history depth, amortization, scenarios, net worth, etc.) plus a `minimumTier` mapping per feature.
3. Rewrite `hasFeatureAccess(plan, feature)` as a tier-ordinal comparison (`free=0, premium=1, premium_plus=2, ultimate=3`) against each feature's `minimumTier`, rather than the current single boolean branch.
4. RevenueCat: configure 3 additional entitlement IDs (or one entitlement with tiered product IDs — decide based on what RevenueCat's dashboard supports cleanly for the product catalog) and update `getSubscriptionPlan()`/`purchasePremium()` to map products → the new 4-value type.
5. **Audit every existing call site** of `hasFeatureAccess` (currently in `SnowballSection.tsx`, and the v1.5-v1.8 components if built first) to confirm they pass the right feature key and get correct tier gating under the new system — this is the actual risk of this version, not the type change itself.
6. Export/backup automation: extend `lib/storage/backup.ts` with a scheduled trigger (e.g., a periodic check on app foreground — "if last backup > 7 days ago, auto-export to... " — note: without cloud storage, "automatic backup" on iOS realistically means writing to the Files app via the share sheet's "Save to Files" target, or iCloud Drive if accessible from a sandboxed Capacitor app. Verify iCloud Drive write access is feasible from the WKWebView/Capacitor sandbox before committing to this UX — if not feasible, scope this down to "more prominent backup reminders" rather than true automation). This covers the "scheduled automatic backups" half of `ROADMAP.md` §3's v1.13 tag; the other half (PDF/CSV reporting) ships later at v1.13 itself, see that section.
7. External payment logging UI: add a "Log Payment Made Outside the App" action (likely in `DebtRow`/`ExpenseListItem`'s swipe actions or edit mode) that calls `onMarkRecommendedAction(..., paymentSource: "external")` — the handler already supports this exact parameter, this is purely a missing UI entry point, not new logic.

**Data model changes:** `SubscriptionPlan` type widened (breaking-ish — anything doing exact equality checks like `plan === "premium"` instead of using `hasFeatureAccess` needs auditing too).

**Testing:** this is the highest-test-value version in the whole v1.x sequence — write a regression test matrix: every `PremiumFeature` × every tier → expected boolean, to lock in correct gating before it ships. Re-run the full e2e suite with each of the 4 tiers mocked via `debtPlanner.mockSubscription`.

**Risk:** Medium-high. Not technically hard, but it's the version most likely to introduce a silent "wrong tier got access" bug if the call-site audit (step 5) is rushed.

**Business note:** per `ROADMAP.md` §2, this is the activation point for **Premium+'s annual pricing** ($79.99/yr) — once the 3-tier model is formalized and Premium+ is a real, distinct tier rather than "Premium plus extras."

---

## v1.10 — BNPL Real Calculations + Schema Versioning

**Scope:** Two independent cleanup items bundled for efficiency — biometric app lock was originally slotted here too but moved up to ship as part of v1.2 instead (see the v1.2 addendum at the top of this document).

### BNPL real calculations
**Current state (verified):** `Debt.remainingPayments`/`Debt.scheduledPaymentAmount` are populated by `lib/imports/debtCsv.ts` when `type === "bnpl"`, but `lib/engine/allocatePaycheck.ts` and `lib/debt/projectDebtPayoff.ts` treat every debt identically regardless of type — BNPL installments are typically fixed, interest-free, fixed-count payments (e.g., "4 payments of $87.50"), fundamentally different math from a revolving, interest-accruing credit card.

1. In `lib/debt/projectDebtPayoff.ts`, branch on `debt.type === "bnpl"`: instead of amortizing `balance` against `apr`/`minimumPayment` each month, decrement `remainingPayments` by 1 and reduce `balance` by `scheduledPaymentAmount` each cycle, with **zero interest accrual** (BNPL is APR=0 by definition in this model). Payoff date = `currentDate + remainingPayments * cycle length`, not an amortization calculation.
2. Same branch needed in `lib/engine/allocatePaycheck.ts`'s minimum-payment logic — a BNPL "minimum" each cycle IS the `scheduledPaymentAmount`, not a flexible minimum.
3. Decide: can a user apply extra/snowball payments to a BNPL debt to pay it off early? Realistically most BNPL providers don't allow early payoff to reduce remaining installment count — recommend **excluding BNPL debts from snowball/avalanche extra-payment targeting** (they get paid their fixed schedule and nothing more), which is both more realistic and less work.

### Schema versioning
1. Add a `version: number` field written alongside the existing `debtPlanner.*` keys (or a single new `debtPlanner.schemaVersion` key).
2. New `lib/storage/migrateState.ts` — a migration runner that checks the stored version against the current code's expected version and applies migration functions in sequence. **No migrations needed yet** since this is the first version to track it — this step is purely about having the *mechanism* in place before it's actually needed, so the next schema-breaking change (likely v2.1's household model) doesn't repeat today's "parse error silently wipes everything" problem.
3. Change `loadStoredState`'s silent-fallback-on-parse-error behavior to at least log/flag a corrupted-state event (ties into v1.11's analytics, sequence-dependent — if v1.11 ships first, instrument this then; if this ships first, add a placeholder hook).

**Risk:** Low-medium per item; bundle risk is mainly about scope creep — keep these two strictly independent in implementation so one slipping doesn't block the other.

---

## v1.10 addendum — Page Orchestrator Refactor, Phase 5 (Rollover Engine — final phase)

_Full detail in `PAGE_ORCHESTRATOR_PLAN.md`. This is the highest-risk phase of the orchestrator refactor, deliberately paired with v1.10 since this version is already doing deep debt-math surgery (BNPL real calculations) with its own reconciliation-test requirement — better to take on all the "scary debt math" risk in one carefully-tested version than spread it across two._

**Scope:** Add a new pure function (`lib/recurrence/rolloverPayCycle.ts` or a sibling `lib/debt/applyRolloverPayments.ts`) taking `(debts, completedRecommendedActions)` and returning debts with interest applied and minimum+snowball payments deducted — extracting the math currently inline in `handleRolloverPayCycle`'s `.map()`, reusing `calculateMonthlyInterest`. `handleRolloverPayCycle` itself moves into `usePlanExecution.ts` (from v1.8) or a dedicated `useCycleRollover.ts` if that hook is getting too wide by this point — decide based on actual line count at implementation time.

**Mandatory reconciliation test:** a regression test in `lib/testing/` asserting the new pure rollover-payment function produces identical output to the pre-refactor inline logic for a representative case (debt with interest + partial minimum + snowball spillover). Pair this test alongside this version's own BNPL reconciliation test — both exist for the same reason (silent math drift in a finance app is the worst bug class).

**Files touched:** `lib/recurrence/rolloverPayCycle.ts` (or new `lib/debt/applyRolloverPayments.ts`), `lib/hooks/usePlanExecution.ts`, `app/page.tsx`, new regression test in `lib/testing/`.

**Testing:** `npx tsc --noEmit`, `npm run lint`, the new reconciliation regression test, full `npm run test:regression`, one real "Start Next Pay Cycle" exercise with a debt carrying interest + a partial minimum + a snowball payment, checked against the pre-refactor balance by hand.

**Risk:** Medium. The one phase across the whole orchestrator refactor where "looks the same" isn't enough without a test backing it — do not skip the reconciliation test for schedule pressure.

**With this phase complete, `app/page.tsx` reaches its target end state: ~400-500 lines of hook composition, the `result` useMemo, mount/lock gates, nav state, and section-component rendering — no backup logic, no rollover math, no goal-reconciliation math, no CSV parsing, no hand-written settings-sheet markup. See `PAGE_ORCHESTRATOR_PLAN.md` for the full before/after picture.**

---

## v1.11 — Analytics + Crash Reporting

**Scope:** Zero instrumentation exists today. This version doesn't ship user-facing features — it makes every future version measurable.

**Recommendation:** **PostHog** for product analytics (has a generous free tier, strong privacy controls/self-host option, which matters for a personal-finance app where users are trusting you with sensitive data) and **Sentry** for crash reporting (industry standard, good Capacitor/React Native-adjacent support).

**Implementation steps:**
1. New `lib/analytics/track.ts` — thin wrapper (`track(event, properties)`) so the rest of the codebase never imports PostHog directly; makes swapping providers later a one-file change.
2. Instrument key funnels: onboarding step completion (from v1.4), paywall view → purchase conversion, feature-gate hit (free user taps a locked feature — critical for knowing what to build/promote next), rollover completion, backup export/import.
3. Sentry: initialize in `app/layout.tsx` for web-rendered errors, plus native-side initialization in the Xcode project for crashes that happen outside the WebView (Capacitor bridge issues, native plugin crashes).
4. **Privacy**: never send debt amounts, balances, names, or any financial figures as event properties — track *that* an action happened, never *what the numbers were*. Write this constraint down in `lib/analytics/track.ts` as a comment so future feature work doesn't accidentally leak financial data into analytics events.

**Risk:** Low technically, but the privacy constraint above is the one thing that must not be gotten wrong — a debt-tracking app leaking even aggregate balance data to a third-party analytics vendor is a real trust/legal exposure. Treat this as a hard rule, not a guideline.

---

## v1.12 — Android Build + Accessibility Audit

**Scope:** Two unrelated large efforts bundled only because both are "platform parity" work, not because they share implementation.

### Android
**Current state (verified):** `@capacitor/android` is an installed dependency, but no `/android` directory exists — Android has never been built even once.

1. `npx cap add android` to generate the project.
2. Android-specific plugin config: `LocalNotifications` icon already has an `iconColor`/`smallIcon` config that's Android-flavored (the current config in `capacitor.config.ts` looks like it was already written with Android in mind) — verify it actually resolves correctly once the Android project exists.
3. RevenueCat: configure Google Play product IDs (separate from the existing App Store product IDs) — this is a RevenueCat dashboard + Google Play Console task, not just code.
4. In-app review: `@capacitor-community/in-app-review` supports both platforms already per its docs — verify the existing `lib/review/requestAppReview.ts` call works unmodified on Android (it should, but confirm on a real device since Google Play's review API has stricter quota/eligibility rules than Apple's).
5. Test the full app on an Android emulator + at least one physical device — pay particular attention to back-button behavior (Android has a hardware/gesture back button with no iOS equivalent; verify it doesn't unexpectedly exit the app from a modal).

### Accessibility audit
1. Systematic pass over every interactive element for `aria-label`/accessible names — some already exist (`settings-icon-button` has one), many don't (icon-only buttons across `DebtRow`, `ExpenseListItem`, swipe actions).
2. VoiceOver (iOS) and TalkBack (Android, once the build exists) manual pass through every tab and modal.
3. Color contrast check for both themes — particularly the status pills (`overdue`, `warning`, etc.) which use color as the primary signal; verify they also convey status via text/icon, not color alone.
4. **Dynamic Type support (verified gap):** `app/page.css` has 826 `px`-based size declarations vs. 250 `rem`-based — heavily fixed-pixel sizing means iOS's text-size accessibility setting likely doesn't scale most of the UI today. Audit and convert font-size (and ideally spacing) declarations to `rem` so they scale with the system text-size setting; test at the largest Dynamic Type sizes specifically, since that's where fixed-px layouts visually break first (text clipping/overlap).
5. **`prefers-reduced-motion` audit (verified gap, partially closed in v1.3/v1.6):** confirm every animation added across the whole app — not just the ones explicitly flagged in v1.3/v1.6's polish addenda — has a `prefers-reduced-motion` fallback, including the swipe-action and pull-to-refresh gesture animations that predate this rule being established.

**Risk:** High relative to effort estimate — first-time Android builds reliably surface platform-specific surprises (notification permissions flow differs from iOS, back-button handling, different WebView quirks). Treat the size estimate in `ROADMAP.md` ("Large") as a floor, not a ceiling.

---

## v1.13 — Net Worth Tracker + Debt Consolidation/Refinance Calculator + PDF/CSV Reporting

**Note on scope vs. `ROADMAP.md`:** §3 tags "scheduled automatic backups + PDF/CSV reporting" together at `[v1.13]`, but scheduled backup automation already shipped as part of v1.9 (see that section's step 6) — only PDF/CSV reporting remained unimplemented, so it's added here as its own subsection rather than duplicating backup work already covered upstream.

### Net Worth Tracker (Premium+)
1. New minimal `Asset = { id: string; name: string; value: number }` type — deliberately simple (no asset categories/appreciation modeling) for v1, matching the project's "no premature abstraction" pattern.
2. New `lib/hooks/useAssets.ts`, new `debtPlanner.assets` storage key.
3. Net worth = `sum(assets) - sum(debt.balance)`, computed fresh each render (no need to store it).
4. History chart reuses v1.5's `cycleHistory` — extend `PayCycleSnapshot` with a `netWorth` field going forward (existing snapshots won't have it; render gracefully with a gap rather than backfilling, which isn't reliably possible).

### Consolidation/Refinance Calculator (Premium+)
1. New `lib/debt/calculateConsolidation.ts` — pure function: given the current debt list and a hypothetical `{ apr, termMonths }` consolidation loan, compute the new loan's total interest/monthly payment via the *same* amortization math already in `lib/debt/applyDebtPaymentProjection.ts` (reuse, don't reinvent), and compare against the current debts' projected `totalInterestPaid` from `projectDebtPayoff`.
2. New `components/ConsolidationCalculator.tsx` — input the hypothetical loan terms, side-by-side comparison (same visual pattern as Strategy Comparison in `SnowballSection`).
3. Explicitly **does not initiate any real loan** — this is a what-if calculator only, no lending partner integration. Keep the copy clear that this is illustrative, not an offer, to avoid any regulatory implication of operating as a loan originator/broker.

### PDF/CSV Reporting (Premium+)
1. New `lib/storage/exportReport.ts` — builds a structured report (current debts, payoff projections, pay cycle history from v1.5, net worth from this version) into CSV first (simplest, no new dependency — reuses the same shape as the existing JSON backup, just flattened to rows).
2. PDF: evaluate a lightweight client-side PDF library at implementation time (this app keeps its dependency footprint deliberately small — don't reach for a heavy PDF engine if a simpler "print to PDF" via the system share sheet/native print API gets the same result with zero new dependencies).
3. Entry point: a "Export Report" action in Plan Settings, alongside the existing Export/Import Backup actions (reuse that section's UI pattern, don't invent a new one).
4. This is explicitly a different artifact from the JSON backup (`lib/storage/backup.ts`) — the JSON backup is for restoring app state; this report is for reading/sharing a summary outside the app. Keep the two code paths separate; don't try to unify them.

**Risk:** Low-medium for net worth (simple, additive). Low technical risk for the calculator, but **flag the regulatory copy point above as a hard requirement**, not a nice-to-have — a finance app suggesting specific loan terms without the right disclaimers is a real compliance risk. Reporting risk is low — read-only, additive, no data model changes.

---

## v1.14 — Shareable Milestone Cards + Animated Year in Review (ships now) + Opt-In Leaderboard (deferred)

**Resequencing note:** per the critical-path dependency at the top of this document, only the shareable-card and Year-in-Review halves of this version ship at v1.14. The leaderboard half moves to ship alongside or just after v2.0's backend foundation.

### Shareable cards (ships at v1.14, no backend needed)
1. Add `@capacitor/share` (not currently installed) for the native share sheet.
2. New `components/ShareableMilestoneCard.tsx` — renders a styled summary (debt-free date, % paid off, current streak) to an offscreen DOM node, captured to an image via a DOM-to-image library (evaluate options at implementation time — keep the dependency footprint small, this app currently has almost no heavy dependencies and that's a deliberate strength worth preserving) or, if simpler, a native screenshot of a dedicated share-preview screen.
3. Trigger from the existing milestone-badge moment (v1.6) — "Share this milestone" action.

### Animated "Year in Review" recap (Premium+ depth, free hook teaser — ships at v1.14, no backend needed)
1. New `components/YearInReview/YearInReviewFlow.tsx` — a full-screen, multi-slide animated recap (Spotify-Wrapped-style: total paid off, debt-free progress, best month, current streak, milestones hit), built from the same `cycleHistory` data already collected by v1.5's Pay Cycle History — no new data collection needed, this is a presentation layer over existing data.
2. Free tier gets a single teaser slide (e.g., total paid off this year) as a hook; Premium+ unlocks the full multi-slide animated recap — matches the "Free hook / Premium+ depth" tier note already in `ROADMAP.md` §4 for this version.
3. Reuse the shareable-card infrastructure above (`@capacitor/share`, the same image-capture approach) so each slide is independently shareable — the sharing mechanic doubles as organic marketing, which is the actual strategic point of building this, not just a nice-to-have.
4. Trigger: a "Your Year in Review" entry point surfaced once per year (or per N completed pay cycles for users without a full year of history yet — don't gate this purely on calendar-year boundaries given how recently the app will have launched).
5. Animation work here should follow the `prefers-reduced-motion` standing rule established in v1.3/v1.6 — this is the most animation-heavy feature in the whole app, so it's the most important place to get that fallback right.

**Data model changes:** none — pure presentation over v1.5's existing `cycleHistory`.

**Testing:** manual visual check across a range of history lengths (1 cycle, a few months, a full year+) to confirm the recap degrades gracefully with partial data rather than assuming a full year always exists.

### Leaderboard (deferred until backend exists)
- Needs: an account/anonymous-ID system, a server endpoint to submit a percentile-relevant stat (e.g., "% of debt paid off," never raw dollar amounts) and retrieve an aggregate comparison, and real thought about what's worth comparing without being either discouraging or privacy-invasive. Revisit scope entirely once the v2.0 backend exists — don't pre-build against assumptions made today.

---

## v2.0 — AI Recommendations (Claude API) + Statement Auto-Import (OCR + AI)

**Scope:** The biggest architectural shift in the roadmap — first version requiring a server. Two AI-dependent features land here since both need the same backend foundation and neither can ship before it exists.

### Phase 0: Backend foundation (do this first, unblocks Phase 2 below, v1.14's leaderboard, v2.1, v2.2 too)
1. Stand up a minimal backend — a Next.js API route layer is the path of least resistance given the app is already Next.js, but note **the current app is statically exported** (`capacitor.config.ts: webDir: 'out'`, implying `next build` with static export for the Capacitor WebView). API routes need a server runtime, which static export doesn't provide. Decide between: (a) a *separate* small backend service (e.g., a lightweight Node/Express or serverless function deployment, decoupled from the statically-exported client app) or (b) restructuring the Next.js app to support both a static client export and server-rendered API routes via a different deployment target. **Recommend (a)** — keep the existing client app's build/deploy story untouched, stand up a thin separate API service the client calls over HTTPS. Lower risk, smaller blast radius on a working app.
2. This backend needs, at minimum: a way to identify a client without full accounts yet (an anonymous device-bound ID is enough for v2.0; full accounts only become necessary at v2.1's household sharing) — store this ID locally, send it with requests for rate-limiting/abuse prevention, nothing else.
3. Set up the Anthropic API key **server-side only**, never shipped in the client bundle.

### Phase 1: AI insights
1. New `lib/ai/buildAIInsights.ts` (client-side) — assembles a structured snapshot of the user's plan (same shape already fed into the existing rule-based `buildSmartInsights`) and sends it to the new backend endpoint.
2. New backend endpoint — receives the snapshot, builds a prompt instructing Claude to return insights in the *exact same shape* as the existing `SmartInsight` type (`title`, `message`, `severity`, `action`), so the existing `components/Results/...` and `SnowballSection` rendering code needs **zero changes** — only the data source changes.
3. Fallback: if the AI call fails/times out, fall back to the existing rule-based `buildSmartInsights` silently — never show an error state for this, since the rule-based engine is a perfectly good degraded experience, not a broken one.
4. This is Ultimate-tier gated; Premium/Premium+ continue getting the rule-based engine they already have. No regression to non-Ultimate users.

**Data sent to the backend**: explicitly enumerate it in code review — paycheck amount, debt balances/APRs/names, bill amounts/names, goal progress. This is real financial data leaving the device for the first time in this app's history; needs a clear privacy policy update and explicit user consent surfaced before first use, not buried in settings.

**Testing:** mock the backend response shape in regression tests to verify the rendering layer handles both AI-sourced and rule-based `SmartInsight[]` identically (since they share a type, this should mostly be free, but verify explicitly). Add a chaos test: backend returns malformed/empty response → fallback triggers correctly.

**Risk:** High. First server, first time financial data leaves the device, first external AI dependency with real latency/cost/failure modes. This is the version to be most conservative and most tested on the whole roadmap.

### Phase 2: Statement Auto-Import (OCR + AI extraction)

**Scope:** Let a user photograph or upload a credit card/loan statement and have AI extract the debt's name, balance, APR, minimum payment, and due date automatically, instead of typing each field by hand. The single biggest friction-reduction opportunity in the app — manual debt entry today is a real onboarding drop-off risk.

**Implementation steps:**
1. Capacitor Camera plugin (`@capacitor/camera`, not currently installed) for photo capture, or a standard file input for uploading an existing image/PDF.
2. New backend endpoint — receives the image, sends it to Claude (which has native vision/document understanding) with a prompt requesting structured extraction in the exact shape of the existing `Debt` type's input fields (`name`, `balance`, `apr`, `minimumPayment`, `dueDate`). Reuses the same backend service stood up in Phase 0 — no second server.
3. New `components/ImportFromStatement/StatementScanFlow.tsx` — capture/upload → loading state → pre-filled review form (always show the extracted values for user confirmation/correction before saving, never auto-save unreviewed AI output directly into the debt list — a misread APR or balance is a real-money mistake, not a cosmetic one).
4. On confirm, route through the existing `handleAddDebt` validation path unchanged — extracted data is just pre-filled form input, not a new data path into the engine.
5. **Cost/tier note:** each scan is a real Claude API cost (image + vision processing). Tier-gated Premium+ to start, but watch usage once shipped — if cost-per-scan is meaningfully higher than the rest of Premium+'s feature set justifies, revisit whether this needs its own rate limit (e.g. N scans/month) or an Ultimate-only gate. Don't pre-build a complex quota system speculatively; add one if real usage data shows it's needed.

**Data sent to the backend:** the statement image itself, which may contain more information than just the four extracted fields (account numbers, full name, address). **Do not log or retain the raw image server-side beyond the request lifecycle** — process and discard. This is more sensitive than the numeric snapshot already flagged in Phase 1's privacy note above; treat it with at least that level of care, arguably more.

**Testing:** can't meaningfully unit-test OCR/AI extraction accuracy in CI — budget real manual testing against a variety of real-world statement formats (different banks/card issuers format statements very differently) before shipping. Regression test the deterministic part only: confirm the review-form-to-`handleAddDebt` path behaves identically to manual entry once values are confirmed.

**Risk:** High. Real-money accuracy risk (a misextracted APR or balance silently corrupts a user's plan) mitigated only by the mandatory review-before-save step in implementation step 3 — do not skip or weaken that step under schedule pressure. Also inherits all of Phase 1's first-AI-dependency risk profile (latency, cost, failure modes).

**Business note:** per `ROADMAP.md` §2, this is the activation point for **Ultimate** as a sellable tier at all (monthly first; introduce **Ultimate annual** at $119.99/yr a few weeks after monthly launch, once some retention data exists) — not before. Don't expose Ultimate as purchasable in RevenueCat/App Store Connect until Phase 1 (AI Recommendations) has actually shipped; selling a tier with no deliverable value, even briefly, repeats the same category of trust problem as this app's prior App Review rejections.

---

## v2.1 — Household / Multi-Income Support

**Scope:** Now that v2.0 has a backend and an anonymous device ID, this version needs to upgrade that to **real accounts** (so two people's devices can reference the same household), which is a bigger lift than v2.0's anonymous ID alone.

**Implementation steps:**
1. Add real authentication (email magic-link or Sign in with Apple — recommend Sign in with Apple given the app is iOS-first and it requires zero password infrastructure).
2. New household data model on the backend: a household has members, each member can have their own paycheck schedule; bills/debts/goals belong to the household, optionally attributed to a member.
3. **Engine change** (the hard part): `lib/engine/allocatePaycheck.ts` currently takes one `paycheckAmount` + one `nextPaycheckDate`. Multi-income requires either (a) merging multiple paychecks into one combined cash-flow timeline before calling the existing engine once, or (b) a deeper rework of the engine to natively understand multiple income events on different dates. **Recommend (a)** — pre-merge incomes into a single combined timeline of cash-in events feeding the existing engine, rather than rewriting engine internals that are currently well-tested and working. This keeps the blast radius on a financially-critical, already-correct piece of code as small as possible.
4. Permission roles (view-only vs. edit) enforced server-side, not just hidden in the UI.
5. Sync: household data now lives on the backend as source of truth; local storage becomes a cache/offline-fallback layer rather than the source of truth it is today. This is a meaningful architecture inversion — budget real time for it, don't treat it as "just add a sync call."

**Risk:** High. Both a product-complexity risk (shared finances between people is sensitive) and a technical risk (the local-storage-as-truth → backend-as-truth inversion touches almost everything).

---

## v2.2 — Bank Linking (Plaid) — Evaluation Gate, Not a Commitment

Per `ROADMAP.md` §5, this is explicitly a **decision point**, not a guaranteed build. If pursued:

1. Plaid Link SDK integration — Capacitor has no official Plaid plugin; likely a WebView-based Plaid Link flow (Plaid supports a hosted Link flow that works in a webview) rather than a native SDK integration, to avoid building a custom native plugin.
2. Plaid access tokens are exchanged and stored **only on the backend** (built in v2.0/v2.1) — never on the client, ever.
3. A transaction sync job (backend, scheduled) pulls new transactions periodically.
4. Only once real transaction data exists do subscription-audit and spending-categorization features (currently backlog items in `ROADMAP.md` §3) become worth building — they were explicitly deferred because they're not valuable against manually-entered data.

**Recommend:** treat v2.2 as a standalone "spike" — timeboxed technical evaluation (Plaid sandbox integration, cost modeling at expected user volume, compliance review) before committing a full version's worth of roadmap time to it.

---

## v3.0 — AI Chat / Conversational Interface + AI Negotiation Coach

Builds directly on v2.0's backend + Claude integration.

### AI Chat
1. New backend endpoint supporting multi-turn conversation (maintains message history server-side per session, doesn't trust the client to replay full history).
2. Tool use: give Claude function-calling access to query the user's *actual* current plan data server-side (debt list, next paycheck, goals) rather than relying on the user to describe their situation in the chat — this is what makes it actually useful vs. a generic finance chatbot.
3. New `components/AIChat/` — chat UI, likely a new tab or a modal accessible from the Payoff tab.
4. Same fallback philosophy as v2.0: if the AI is unavailable, the chat surface should say so clearly rather than silently failing — unlike the insights fallback (which can silently degrade to rules), a chat interface with no AI behind it doesn't have a meaningful non-AI fallback, so this needs honest unavailability messaging instead.

### AI Negotiation Coach (elevated from a one-line backlog idea — see `ROADMAP.md` §2 Ultimate tier)
1. Reuses the exact same multi-turn conversation infrastructure built for AI Chat above — this is a second *use case* for that surface, not a second conversational AI system. Don't build parallel chat plumbing.
2. Two output modes from one underlying conversation: (a) a generated artifact — a written negotiation letter and a phone-call script, both grounded in the user's actual debt data (current APR, balance, payment history) via the same tool-use access as AI Chat; (b) an interactive coaching mode — the user tells the AI how the call is going turn-by-turn ("they offered 18%, what do I say?") and the AI responds with the next thing to say, genuinely coaching through the live call rather than just handing over a static script upfront.
3. New entry point from each debt's detail/edit view ("Negotiate this rate") — surfaces the letter/script generation immediately, with the live-coaching mode as a secondary "Get live help during the call" action for users who want it.
4. Same fallback philosophy as AI Chat: if the AI is unavailable, say so clearly — there's no meaningful non-AI version of "coach me through this negotiation call" to fall back to.

**Risk:** Medium-high, but lower than v2.0 since the hard architectural problems (backend, AI integration, fallback philosophy) were already solved there. The negotiation coach's main risk is content quality, not technical risk — a bad negotiation script actively damages user trust in a way a mediocre insight card doesn't. Budget real review time for prompt quality before shipping, not just functional testing.

---

## v3.1 — Apple Watch + Siri Shortcuts

1. New Watch App target in Xcode, sharing the same App Group set up in v1.7 for the widget — reuse that plumbing rather than building parallel data-sharing infrastructure.
2. SiriKit/App Intents for shortcuts like "what's my debt-free date" — read-only queries against the shared App Group data, no new backend dependency.

**Risk:** Medium. Native-only work, but builds on v1.7's already-solved data-sharing pattern rather than starting fresh.

---

## Summary: sequencing risks to watch

1. **v1.9's 3-tier rework should conceptually start now**, even though it's numbered after v1.5-v1.8 — those versions should be built tier-aware from day one to avoid a retrofit.
2. **v1.14's leaderboard half doesn't ship until v2.0's backend exists** — don't build against an assumed backend shape before v2.0 designs it for real.
3. **v2.0 is the hinge point of the entire roadmap** — first server, first external data leaving the device, first AI dependency. Everything after it (v2.1, v2.2, v3.0) builds on decisions made there. Get v2.0's backend foundation right; don't rush it to hit a version-number cadence.
4. **The engine (`lib/engine/allocatePaycheck.ts`) and projection math (`lib/debt/`) are the most load-bearing, best-tested code in the app.** Every version that touches them (v1.6's amortization, v1.10's BNPL, v2.1's multi-income) should reuse existing functions rather than duplicating math, and should include a reconciliation test against the existing engine's output — this is a finance app; silent math disagreements between features are the worst possible bug class.
5. **Mobile polish (`MOBILE_POLISH_ROADMAP.md`/`MOBILE_POLISH_IMPLEMENTATION_PLAN.md`) and the `app/page.tsx` orchestrator refactor (`PAGE_ORCHESTRATOR_PLAN.md`) now ride alongside v1.2-v1.10 above as version addenda** — see each version's addendum section for what lands. Two polish items remain deliberately unscheduled and are **not** mapped to a version: **P7 (list virtualization)**, trigger-based — only build once a real user reports lag with a large list; and **P8 (modal transition audit)** — backlog until there's a concrete HIG-compliance push. Don't pull these into a version ahead of that trigger.
6. **The orchestrator refactor's Phase 5 (v1.10) is gated on Phases 1-4 (v1.5-v1.8) shipping first** — each phase's hook depends on the previous one's output (e.g. Phase 4's `usePlanExecution` needs Phase 3's `usePlannerBackup` for `saveResetSnapshot`). If any of v1.5-v1.8 slip or get reordered, the orchestrator phases must move with them, not stay pinned to the original version number.
7. **Full cross-reference audit completed 2026-06-23** against `ROADMAP.md` §3/§4, both mobile-polish docs, and `PAGE_ORCHESTRATOR_PLAN.md` — every `[vX.X]`-tagged feature now has matching implementation coverage at the correct version. Fixes made: added the previously-unscheduled Windfall/Bonus Allocator to v1.5; added PDF/CSV Reporting to v1.13 (was tagged in `ROADMAP.md` but had no implementation section); corrected `ROADMAP.md`'s Apple Watch/Siri tag from `[v1.9 / v3.x]` to `[v3.1]` to match the table and this doc; updated the v1.2 App Lock and Mobile Polish addenda to reflect what actually shipped (App Lock default flipped to OFF, P9a's grid-breakpoint item found to need no fix).
8. **Do not expose the Ultimate tier as purchasable until v2.0 actually ships** (see `ROADMAP.md` §2.5's tier-value audit) — every Ultimate feature, including the new negotiation coach, depends on the v2.0 backend, which is itself gated behind v1.5-v1.10. Selling a tier with no deliverable value for an extended stretch is a trust risk, the same category of problem as the App Store rejection this app already worked through once.
9. **Statement Auto-Import's mandatory review-before-save step (v2.0 Phase 2) is a hard requirement, not a nice-to-have** — a misextracted APR or balance silently corrupts a user's real financial plan. Never auto-save AI-extracted statement data without explicit user confirmation first.
10. **v1.7's three native features (widget, Live Activities, custom icons) should ship in increasing order of native complexity** — icons first, widget second, Live Activities last — since Live Activities builds on ActivityKit on top of the WidgetKit foundation the widget already establishes.
