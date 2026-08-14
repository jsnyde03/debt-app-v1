# Debt Planner — The Elevation Plan · DETAIL LOG

> **This is the detailed record / history for the Elevation build.** The lean operational driver is [`DEBT_ELEVATION_PLAN.md`](DEBT_ELEVATION_PLAN.md); this file holds the full per-item narratives (what shipped, how verified, decisions, after-scans). Completed-item detail lands here; the plan carries a terse roll-up + a pointer. Snapshot taken 2026-07-24 when the plan was de-walled; append new completed detail below the item it belongs to.

---

## Phase-3 Closeout block · session 4 — FOLD ROUND (re-audit findings) (2026-07-30)

Jason's directive (2026-07-30): **fold in EVERY re-audit finding except the Phase-6-owed items.** Done in 6 committed waves, gate green throughout; **full `validate:release:rn` GREEN (83 e2e)** after. Detail per finding → `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/_SUMMARY.md`.
- **Wave 1 (`4ac17b4`) — windfall correctness:** C1 (attribute windfall dollars absorbed covering required+living — worst case a missed paycheck — to the `bills` bucket, so the split is never empty + always conserves) · C4/H3 (largest-remainder whole-dollar rounding → rows sum EXACTLY to the headline) · C3 (guard the sheet on non-empty items) · folded H2 (free invite no longer dresses baseline as premium) + H4 (drop the "automatically" custody-overclaim). T1/T2 (test covers absorbed + cash buckets + exact sums; e2e clicks Confirm + asserts effect).
- **Wave 2 (`d5c7a15`) — B1 finale buttons:** new `Button onDark` prop forces the dark token set on the theme-CONSTANT navy takeover; applied to the finale + the per-debt beat → both themes now show the same correct hierarchy (was: light "Continue" navy-on-navy invisible).
- **Wave 3/6/7 (`fa16bfa`):** H1 share-sheet grammar ("Share your debt-free win") · H5 sentence-case notification titles · C5/T7 (the numberOfLines 1→2 fix had MISSED FormSheet's inline/iPad branch — earlier `replace_all` only matched the modal's indentation) · W2 (metro resolver no longer tries `.native` on web) · W3 (`expo-audio` `microphonePermission:false`).
- **Wave 4 (`8c2a68a`) — a11y:** A1 (Switch `accessibilityLabel`s) · A2 (proof-strip chip → `text.primary`, was 4.25:1 in light) · A3 (finale font caps + scrollable content for AX Dynamic-Type) · A4 (one-utterance grouping on finale stats + windfall rows + ShareCard; ShareCard `allowFontScaling=false`).
- **Wave 9 (`c3f2770`) — share enhancements:** B2 (parameterize `ShareCard` → finale/per-debt/progress variants; wire a Share button + branded card into the per-debt beat + upgrade the archive to the branded image) · B5 (buyer-facing tagline + shield brand mark; the app-icon asset is Phase-6 store work) · B6 (deepen the finale confetti — 64 pieces, wider spread).
- **B3 (verification-evidence):** the composed finale capture now clearly shows mesh + confetti + ring + both buttons together (the mesh alpha bump made "dimensional depth" accurate, not an overstatement).
- **Whole-block after-scan:** the `onDark` prop is a reusable beat-family fix; adding an off-screen capture card duplicates on-screen text (broke 2 e2e assertions → scoped with `.first()`) — a pattern to watch when adding capture artifacts; the metro-`.native`-on-web hardening closes the web-blank class by construction, not just discipline. Only deferred item: B5's app-icon asset → Phase 6 (store presence), consistent with the directive. **Deferred → Phase 6 (unchanged):** PR1 Sentry-breadcrumb scrub (DSN-turn-on gate) · lock-screen bill-name decision · the placeholder-chime swap · the device ledger.
- **RE-AUDIT → ✅ CONSENSUS REACHED (3 rounds, Fable-5).** Round 2 (3 lens-clusters) verified the round-1 fixes hold (C1 fuzzed 400 runs, C4 proven, A2 13.5:1, B1 both-theme) but found new issues incl. one real regression from the B2 fold (per-debt beat's Share unreachable by VoiceOver — the backdrop collapsed the card) → folded (`9a59f85`). Round 3 (2 lens-clusters, confirming) verified those + found 3 LOW residuals (beat one-utterance grouping + AX caps + expo-audio `enableBackgroundPlayback`) → folded (`7d2b6b7`). Round 4 (final confirm) = **CONSENSUS REACHED**: every code-addressable finding across all rounds folded, gates green on a fresh export (e2e 83/83), no new MAJOR. Docs: `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/{R2-*,R3-*,R4-CONSENSUS}.md`. **The Phase-3 CLOSEOUT block is CLOSED. Phase 3 (delight + native) is COMPLETE.** Parked → Phase 6 (unchanged): Sentry-breadcrumb scrub · device ledger (incl. all 3 share-surface captures + finale safe-area) · lock-screen bill-name · placeholder-chime swap · the ShareCard app-icon asset.

## Phase-3 Closeout block · session 3 — EXIT-GATE RE-AUDIT (Fable-5 fan-out) (2026-07-30)

After VIS-3 (a stale-test fix — the proof-strip pills already render) the full `validate:release:rn` gate went **GREEN (83 e2e)**, and the **exit-gate re-audit ran** as a **6-lens-cluster Fable-5 adversarial fan-out** (Jason's call to run it in Fable 5, save all outputs + a synthesis). **Canonical = `docs/DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/`** (`00-INDEX` · `01`–`06` per lens · `_SUMMARY`). **Consensus NOT yet — one fold-round owed** (the block closes only at consensus, not "fixes applied"). Verdict: no true BLOCKER in shipped app code; the 1 build-breaker was CI config (bare Sentry plugin → release-archive upload fail) — **fixed now** via `SENTRY_DISABLE_AUTO_UPLOAD` in `codemagic.yaml`. Cross-auditor convergence was high (Sentry-CI, windfall-conservation, and the incomplete truncation fix each found by 2 auditors). Full triage + fold-order → `_SUMMARY.md`; the fold-round is the next session's work. Added criteria this re-audit: new-native-addition risk · placeholder-asset honesty · copy micro-scrutiny · privacy-claim integrity.

## Phase-3 Closeout block · session 3 — VIS-6 remainder (re-triage → build all four) (2026-07-30)

**VIS-6 was a scope re-triage the closeout audit reserved for Jason. Decision: BUILD ALL FOUR now** (interactive notifications · mesh-gradient · opt-in sound · Sentry scaffold). Windfall (the 5th VIS-6 part) shipped earlier this block.
- **VIS-6a interactive notifications** (`notifications.ts` + `.web.ts` + `_layout.tsx`, committed `c371b74`) — `setNotificationCategoryAsync` action categories (payday/risk/bills, each an `opensAppToForeground` button) attached to every scheduled notification's `categoryIdentifier`; a root `addNotificationResponseListener` routes a tap/action → Today. Web stub mirrors the surface. Delivery device-owed (Phase 6).
- **VIS-6b mesh-gradient** (committed `c371b74`) — a Skia faux-mesh (soft gold/blue/violet radial blobs) behind the finale for depth. Chose Skia over the iOS-18 native `MeshGradient`: renders on ALL iOS versions AND web (CanvasKit), no new native module, no version gate. 3-file Skia pattern (`MeshGradientChart` + native `Canvas` + `.web` CanvasKit loader). Alphas tuned up after a first pass read too faint; both themes verified — clear dimensional depth.
- **VIS-6c opt-in sound** (committed `f155b10`) — `expo-audio` + a **synthesized placeholder** chime (`assets/sounds/debt-free-chime.wav`, a soft C-major arpeggio generated via a scratch script — swap for a mastered asset at Phase 6). `debtFreeSound.ts` (native, guarded) / `.web.ts` no-op. New opt-in pref `debtFreeSoundEnabled` (default OFF — the beat carries itself) + a More → Preferences toggle; the finale plays it only when on. Web export clean (sound excluded); toggle verified both themes.
- **VIS-6d Sentry scaffold** — mirrors Freedom exactly (`@sentry/react-native` 8.18.0 pinned): `utils/sentry.ts` (`initErrorReporting` — **no-op until `EXPO_PUBLIC_SENTRY_DSN` is set** + PII-scrub `beforeSend` + the RN-0.85/New-Arch crash-safety disables from Freedom lesson #14; `wrapRoot`) + `sentry.web.ts` passthrough. `reportError.ts` gained the `setErrorReporter` seam (Sentry routes through it when a DSN exists). `_layout.tsx` calls `initErrorReporting()` at module scope + `export default wrapRoot(RootLayout)`. `@sentry/react-native` bare plugin added to `app.json`. **Disabled scaffold only** — real DSN + CI source-map care (`SENTRY_DISABLE_AUTO_UPLOAD`) = Phase 6.
- **Verified:** tsc + lint green across all four; full RN e2e **81 pass / 2 fail** where the 2 fails are the pre-existing VIS-3 proofofwork (separate item) — confirms the Sentry root-wrap boots web cleanly + no regression. **Device-owed → Phase-6 ledger:** notification delivery/actions · real sound playback + expo-audio compile · Sentry native crash capture (needs DSN) · first compile/autolink of the new natives (expo-audio, @sentry/react-native) — Maestro sim covers compile.

## Phase-3 Closeout block · session 3 — VIS-2 branded share-card (2026-07-29)

**VIS-2 (share the vanquished/finale as a branded image — the one organic-growth artifact) — DONE (web-verified; native capture+share device-owed).** Mirrors Freedom's proven `share-card` pattern ([[reference_freedom_native_widget_template]]).
- **Deps:** added `react-native-view-shot` 5.1.0 (pinned, = Freedom) + `expo-sharing` ~56.0.21. Installed with `--legacy-peer-deps` (monorepo hoists `react-native` → npm resolved it as `undefined` under `apps/rn`; the RN 0.85.3 + view-shot 5.1.0 combo is proven on the same SDK 56 in Freedom, so it's a resolver artifact, not an incompatibility).
- **Utils:** `src/utils/share-card.ts` (native: `captureRef` → PNG → `expo-sharing` share sheet) + `.web.ts` (Web Share API / alert) — the platform split keeps `react-native-view-shot` out of the web bundle.
- **`ShareCard.tsx`:** a branded, **static + View-based** (no Skia/animation, so `captureRef` reliably rasterizes) navy card — gold check ring · "I'm debt-free" · the honest stat trio (vanquished · debts · months) · a "Debt Planner · honest, on-device payoff" brand footer. Fixed 360px width.
- **Wiring:** `PaidOffFinale` renders the `ShareCard` off-screen (`left:-9999`, `collapsable={false}`, a11y-hidden) behind a `useRef<View>`; a new **"Share your win"** secondary button (grouped above "Continue") calls `shareDebtCard(ref, fallbackText)`, errors routed to `reportError`.
- **Verified:** tsc + lint green; web export clean (view-shot excluded on web); full celebration e2e 8/8 both themes; a temp on-screen render confirmed the ShareCard design + the finale's two-button layout in both themes; the finale e2e now asserts the Share button. **Device-owed → Phase-6 ledger:** real `captureRef` rasterization + the iOS share sheet + first autolink/compile of the two new native deps (Maestro sim covers compile).

## Phase-3 Closeout block · session 3 — VIS-1 finale deepen + Core-Haptics AHAP (2026-07-29)

**VIS-1 (Jason ✓ "build the true AHAP module now") — DONE (motion web-verified; native feel device-owed).** The audit: the finale was thinner than spec'd (24 rects, ~2s, a placeholder `success()` haptic; the AHAP was an unbuilt BUILD item mis-parked as device-QA).
- **(a) Motion deepen** (`PaidOffFinale.tsx`) — particle layer rebuilt to breathe ~4.7s: **44** pieces in **two waves** (the second ~850ms behind, so particles keep emerging), varied per-piece fall (1.9–2.7s) + gravity + rotation + wobble + shape variety (streamer/square/dot) across 4 gold shades; a **gold bloom** flashes out from behind the ring at the crescendo (interpolated opacity peak, softened to 0.3/×1.7 after a first pass read muddy). Reduce-motion still snaps + keeps the haptic. Verified both themes (navy takeover by design) + multi-frame temporal capture (bloom+build at 750ms · second wave alive at ~3.2s · clean resolve).
- **(b) Core-Haptics AHAP** — new local Expo module `modules/finale-haptics` (mirrors `scan-vision`: `expo-module.config.json` ios-only · `FinaleHaptics.podspec` · `FinaleHapticsModule.swift`). Swift plays a hand-authored `CHHapticPattern`: a continuous rumble ramping 0.2→1.0 over ~0.9s (intensity parameter curve) + three rising accent transients → a full sharp transient at the peak (aligns with the ring completing) → a ~0.5s settle fade. Fully guarded (unsupported hardware / engine error → silent no-op, never crashes the celebration); engine retained + auto-restart handler. Wired via `haptics.finale()` (`src/motion/haptics.ts`): **lazy** `requireNativeModule('FinaleHaptics')` on iOS (honors the 3.6.6 no-lookup-at-import invariant), an **expo-haptics primitive crescendo** (light→medium→heavy→success) fallback on Android, no-op on web. `PaidOffFinale` calls `haptics.finale()` (was `success()`), fired ~80ms in so the 0.9s build peaks with the ring.
- **Verified:** tsc + lint green; web export clean (ios-only module ignored on web; guarded lookup); celebration finale e2e 2/2 both themes. **Device-owed → Phase-6 ledger:** the AHAP crescendo FEEL + the `FinaleHaptics` module's first compile/autolink (Maestro sim covers compile; real haptics need hardware). Mirrors proven module structure → low CI risk; watch the xcodeproj-glob gotcha on the first Codemagic build.

## Phase-3 Closeout block · session 3 — VIS-6 Windfall Autopilot + sheet-truncation fix + lint cleanup (2026-07-29)

**VIS-6 Windfall Autopilot (the premium beat) — DONE.** Decision (Jason ✓): build now as a **premium beat** — free adds the windfall exactly as before (uncrippled), premium additionally sees the itemized routing + a one-tap **Confirm** (the automation "act", same free-reads/premium-acts shape as the Guardian & Can-I-Afford). Before this, entering a windfall set `store.windfall` and the money silently dispersed into the allocation with no visible effect.
- **Engine:** `selectWindfallSplit(store, amount)` in `guardianSelectors.ts` — a marginal diff of two `selectAllocation` runs (`windfall: amount` vs `windfall: 0`), bucketed into user-facing groups (`bills · safetyNet · emergency · goals · debt · cash`) that partition all 12 canonical `AllocationCategory`s, so — because paid-required + living reserve are windfall-independent — the deltas **sum exactly to the windfall** (money conserved; the honesty property). Bills lead (a caveat), then largest-first (debt tends to headline a healthy plan). Mirrors the established `selectAffordability` re-solve method.
- **UI:** `WindfallSheet.tsx` — premium renders "HERE'S HOW THE APP WILL ROUTE $X" + icon/label/amount rows (debt=blue `trending-down`, emergency=green `savings`, rest neutral; all glyphs in the iOS SF-symbol map) + "Confirm and the app routes it automatically" + `haptics.success()` on confirm; submit label Confirm(premium)/Add(free). Free (value-led, never a locked preview): still adds the windfall + a `PremiumInvite` teasing the routing. Memoized like AffordabilityCard so typing doesn't re-project each keystroke.
- **Tests:** `windfallSplit.test.ts` (money-conservation invariant · multi-bucket routing · base-covers-EF→all-to-debt · ordering · non-positive/no-plan guards) added to `runAppTests`; `windfall.spec.ts` e2e (opens the sheet + routing preview + Confirm; both-theme screenshots) — 3/3 green, full app suite green.
- **Verified:** both themes (light + dark) — single-bucket (all→debt) and multi-bucket ($700 EF + $300 debt) splits both read premium and legible.

**FormSheet subtitle truncation — app-wide fix (Jason caught it in the Windfall screenshot).** `FormSheet` hard-capped the subtitle at `numberOfLines={1}` (both the modal + inline-pane paths), so any subtitle >1 line clipped mid-sentence ("…added to this p…"). Fix: `numberOfLines={2}` (short subtitles unaffected; only the truncating ones gain a line). `CushionFloorSheet`'s ~125-char subtitle still clipped at 2 lines → trimmed to "The cash the Guardian keeps each paycheck before any extra debt payoff." (the slider + $ range convey the "set it" part). **Whole-sheet both-theme verification sweep** (temp spec, since removed): Windfall · Paycheck · CushionFloor · Debt · Bill · Goal · Living · SaveForIt · Backup — all premium, no overflow, subtitles wrap cleanly.

**Lint cleanup (3 pre-existing errors blocking `validate:release:rn`, Jason-confirmed):** (1) `KeyCommandListener.ios.tsx` `react-hooks/static-components` on the JSX native-view element → switched to `createElement(nativeKeyCommandsView(), …)`, which sidesteps the rule's JSX-element-type analysis **while keeping the lazy native lookup** (honoring the 3.6.6 phase-wide invariant that no `requireNativeViewManager` runs at import — a module-scope resolve would've tripped the closeout audit's own standing lens). (2) `plugins/with-app-intents.js` `__dirname` no-undef → `/* global __dirname */` (flat-config-correct; `eslint-env` is dead in flat config). (3) `reportError.ts` stray `// eslint-disable-next-line no-console` removed (the rule wasn't firing there). Lint + tsc green.

**+ NEW pre-release audit gate added to the plan (Jason's ask):** a **Pre-Release Best-in-Class FINISH sweep** at the start of Phase 6 (before submit) — whole-app, frozen build: truncation/overflow · wording/copy · visual premium bar · both-theme parity · state completeness · cross-surface consistency · layout/responsive · interaction/tap-targets · code-level a11y · motion coherence · honesty/premium-framing. Fable-5 adversarial, verified vs real both-theme screenshots. The archetype it exists to systematize: this session's ad-hoc truncation catch. Complements (doesn't replace) the after-3.5 cohesion + wording audits.

## Phase 3.6 · WHOLE-PHASE after-scan (2026-07-29)

3.6's build items (3.6.1–3.6.6) are all done + web-verified; 3.6.7 is the real-iPad pass (owed to Jason's device session). Phase-level scan across the whole phase:
- **Retroactive lesson sweep (the big one):** the mid-phase `.native.tsx`→web-leak crash retroactively applies to the whole codebase. Swept every platform-split file + native lookup: **no `.native.tsx` component files remain** (KeyCommandListener is now `.ios.tsx`), and **every** `requireNativeModule`/`requireNativeViewManager` (both bridges, scan.ts, KeyCommands) is now **lazy** (resolved inside a getter/function, never at import). The web-crash class is closed phase-wide. New memory `feedback_native_tsx_leaks_to_web`.
- **Cross-screen iPad coherence:** all adaptive screens share one approach (`isExpanded` + `Screen` maxWidth/`wide`), with intentional per-screen widths (Money master-detail · Today two-col 900 · Progress wide 980 · More 680) matched to content. Coherent, not divergent.
- **Deferrals filed (→ backlog):** More fuller section two-column (v1.8 polish) · light-mode hover explicit screenshot (theme-correct by construction; §10 covers it). 
- **Build sequencing flagged:** 3.6 device-QA (§10) needs a build cut AFTER the 3.6 commits — the current 3.5 CM build predates 3.6 and it's the `KeyCommands` module's first iOS compile (mirrors the working modules → low CI risk, watch it). Noted in the checklist §10 header.
- **Gate:** full web e2e **63 green** after the phase; the committed gate caught TWO web-crash regressions this phase (/more `.native` bridge · KeyCommandListener `.native.tsx`) that "looked like harness quirks" but were real.

## Phase 3.6 · 3.6.6 — pointer + keyboard (code-complete, device-verify-owed) (2026-07-29)

Jason picked "fold into device pass" — build 3.6.6 code-complete the right way now, real verification rides his imminent iPad session (same model as 3.5.5). Two parts:

**Hover + focus (web-verifiable).** `Button` + `ListRow` gained hover/focus affordances via the **officially-typed** Pressable props (`onHoverIn`/`onHoverOut`/`onFocus`/`onBlur` + local state) — NOT the style-callback's `hovered`/`focused`, which are a **RN-Web-only** extension that would light up on web and do nothing on the iPad pointer (I built that first, caught it via the tsc type gap, and reverted it — the exact native-verification-gap trap). Button: gentle hover opacity lift + a brand focus ring; ListRow: raise to the tertiary surface on hover (`selected` keeps its accent border). Web-verified (screenshot: a hovered Money row sits on the lighter surface vs its neighbor); the iPad-pointer *feel* is device-owed.

**⌘-shortcuts (native, device-owed).** New local Expo module `modules/key-commands` (`KeyCommandsModule` + an invisible `KeyCommandsView` that becomes first responder — interaction stays ENABLED so it can, rendered at a 0×0 frame so it never blocks a touch — and declares `UIKeyCommand`s: ⌘N new-debt · ⌘1/2/3 Today/Progress/Money, emitting `onCommand`). JS: `src/keyCommands/KeyCommandListener.ios.tsx` (mounts the view at the app root, routes tab-switches via `router.navigate` and ⌘N via a latching `keyCommandBus` → `DebtsSection` opens the add-sheet) + a web/Android no-op base file; wired in `_layout.tsx` gated on `onboardingComplete`. Autolinks like the other local modules (no app.json entry).
- **The e2e gate caught a SECOND web crash I introduced** (and it's the reason to keep running it): the listener was first written as `KeyCommandListener.native.tsx` with a top-level `requireNativeViewManager('KeyCommands')`. In this project's web export a `.native.tsx` split *leaks onto web* (unlike the bridges' `.native.ts`, whose base won at runtime) — so the native view resolved+rendered on web, threw "requireNativeViewManager not available on web", and **blanked every route**; the full suite went from 63-green/1.5m to failing/11.6m (every test retried against a blank page). Making the lookup lazy did NOT fix it (the `.native` component was actually rendering, not just imported). The real fix: **rename to `.ios.tsx`** — the codebase's established component convention (`AppIcon.ios.tsx`, `RowContextMenu.ios.tsx`), which resolves on iOS only and never leaks to web (Android also correctly gets the null base instead of a broken iOS-only native call). **Lesson: for a platform-split RN *component*, use `.ios.tsx`/`.web.tsx` + base — NOT `.native.tsx` — in this project.** Re-verified: 63 e2e green (2.1m).
- **Two flagged device-QA risks (3.6.7 §10):** (1) the invisible view holding **first responder** inside RN's tree, and (2) a **root-level** `router.navigate` to a tab landing cleanly vs. the detached-tab-group blank screen `use-go-to-tab` guards against — neither is simulator/web-verifiable. If tab-switches misbehave on device, route them through the tab navigator's jumpTo. Documented inline + in the device-QA checklist.
- **Verified here:** tsc · lint · web e2e (the native module resolves to the web no-op; hover unaffected). Native module + on-device behavior → 3.6.7.

## Phase 3.6 · 3.6.3–3.6.5 — Today / Progress / More adaptive layouts + a real /more web-crash fix (2026-07-29)

**3.6.3 Today → two-column (`c050173`):** on expanded iPad, the Today content splits — the Guardian/payday moment (hero · guardian · affordability · lean) in the left column, the required + recommended action lists in the right, via `TwoColumn ratio={1.05}`; `Screen maxWidth={900}` on expanded. Compact stacks unchanged. Both themes screenshot-verified.

**3.6.4 Progress → wide-canvas (`9b21c86`):** a wider centered column (`Screen maxWidth={980}` on expanded), NOT two-column — the ring hero + cash-flow + trajectory timeline charts read better with width than split. "Using the room." Both themes verified.

**3.6.5 More + long-tail (`365c348`):** More gets a wider settings column (`maxWidth={680}` on expanded, appropriate for a settings list; a fuller section split is a noted future enhancement). The long-tail screens (living-expenses / paywall / onboarding) already inherit `Screen`'s default centered iPad column, so no special layout — 3.6.5's real work was More only. iPad-width both-theme verified.

**Real /more web-crash caught by the e2e gate + fixed (`6864dd5`) — NOT the "harness quirk" it first looked like.** While closing 3.6.5, the full web e2e failed on `premium-entry.spec.ts` (the always-visible "Unlock Premium" reviewer-findability path). Root cause via bisect: navigating to `/more` on web threw `Cannot find native module 'LiveActivity'` and rendered the whole screen blank. `expo-router`'s per-route web chunking pulled the `.native` LiveActivity bridge (reached through `LiveActivityQA`) into the `/more` chunk, where a **top-level** `requireNativeModule('LiveActivity')` throws at import (web uses the no-op base `.ts`, but the `.native` still got bundled into the route chunk). Two complementary fixes:
- `liveActivityBridge.native.ts` + `pendingActionBridge.native.ts` → resolve the native module **lazily on first call**, never at import, so an accidental `.native` load on web can't hard-crash a route. (Belt-and-suspenders; aligns with the platform-split re-export lesson.)
- `more.tsx` → gate the Developer/QA section to `Platform.OS !== 'web'`: it's on-device tooling (Live Activities are iOS-only; Simulate-Premium is for TestFlight) with no purpose on web, and its "Unlock premium features…" subtitle was a strict-mode collision with the paywall's "Unlock Premium" once the crash was fixed.
- **Verified:** tsc · lint (0 errors) · full web e2e **63 passed** · /more renders premium at iPad width in both themes. **Lesson:** the earlier "blank /more" was dismissed as a harness quirk — it was a real crash; the committed e2e gate is what surfaced it. A `.native.ts` that top-level-calls `requireNativeModule` is a latent web-route landmine — keep native resolution lazy.

## Phase 3.6 · 3.6.1 + 3.6.2 — iPad primitives + Money master-detail (2026-07-29, built ahead during the 3.5-verify wait)

**3.6.1 primitives:** `components/ui/TwoColumn.tsx` (side-by-side on expanded ≥1024pt, stacked otherwise — for Today/Progress) · `components/ui/MasterDetail.tsx` (list pane + detail pane on expanded, list-only on compact — Money) · `Screen.wide` prop (opt out of the centered width-cap so an adaptive screen uses the full canvas). Inert until composed; tsc/lint green.

**3.6.2 Money master-detail (flagship):** on the expanded iPad canvas, Money-Debts renders the debt list (left, the selected row accent-highlighted via a new `ListRow.selected`) beside the debt's **edit form INLINE** in the right pane — no modal. Enabled by a new **`FormSheet.inline`** mode (same header + fields + submit/remove, but no Modal/scrim/grabber/swipe/✕ — mirrors `AnimatedSheet.overlay`); `DebtSheet` forwards `inline` and, when inline, renders the payoff schedule as a normal Modal (no nesting to dodge). `MoneyScreen` passes `wide` for Debts-on-expanded (Bills/Goals stay the centered column → their iPad treatment at 3.6.5). Compact (iPhone / portrait iPad) is UNCHANGED — list + modal edit. Verified: tsc · lint · **both-theme iPad screenshots** (list + inline Edit-debt pane, selected-row highlight) · **compact regression-checked** (list renders, no inline pane). Commits `c050173` (3.6.1) · `f3669ef` (3.6.2).

---

## Phase 3.6 · Genuinely-native iPad — DESIGN GATE (decomposed + locked 2026-07-29, not yet built)

Decomposed the pre-authored 3.6 roadmap item with Jason before any code (design-first). **Before-scan correction (the item drifted):** the iPad *foundation* is already built — `utils/sizeClass.ts` (compact <768 / regular ≥768 / expanded ≥1024), `hooks/use-layout.ts`, a sidebar rail (`(tabs)/_layout.tsx` via `Tabs tabBarPosition:'left'` on regular), and a width-capped centered `Screen` on regular. BUT `isExpanded` is referenced NOWHERE and no individual screen adapts its content, so today's iPad = the sidebar chrome around a **centered phone-width column** — exactly the thing 3.6's "not a centered phone column" mandate targets. So 3.6's real scope = the **per-screen native layouts + pointer/keyboard**, not the chrome (which is done).

**Locked decisions (Jason ✓ all three recs, 2026-07-29):**
1. **Sheets on iPad → iPad-native.** Full-height bottom-sheets read phone-y on the big canvas. Money's edit becomes the master-**detail pane** (3.6.2); the remaining modal sheets become centered **form-sheets** (not bottom sheets). Builds on the `AnimatedSheet.overlay` mode just added for the modal-over-modal fix.
2. **Master-detail = Money ONLY.** It's the one list→item surface. Today + Progress are single-object dashboards → **two-column reflow** (gated on `isExpanded`), not master-detail.
3. **Pointer/keyboard = meaningful-but-bounded.** Hover states + focus rings + a handful of ⌘-shortcuts (new debt, tab switch) — not a full desktop keyboard map.

**Decomposition (7 steps, structure-first): 3.6.1 layout primitives → 3.6.2 Money master-detail (flagship) → 3.6.3 Today two-column → 3.6.4 Progress wide-canvas → 3.6.5 More + long-tail → 3.6.6 pointer/keyboard → 3.6.7 verify (both orientations · Split View · Stage Manager compact-within-iPad · both themes · real-iPad device QA).** Sits after the 3.5 native block closes; not the active build yet (3.5.5 verification pending).

---

## Phase 3.5 · 3.5.3 Live Activity — COMPLETE + native-verified (2026-07-29)

The whole Payday Countdown Live Activity is code-complete and native-compile-verified. Two green native-e2e runs: `30456773326` (3.5.3.1–.3 baseline) + `30460864814` (3.5.3.5 producer — the interactive `LiveActivityIntent` + button + module queue fns). Both = compile GREEN + 3/3 Maestro flows (app boots + mounts). The **real** Lock Screen / Dynamic Island render + the payday-landed flow are on the **signed device build** (checklist: `docs/DEBT_3.5_DEVICE_QA_CHECKLIST.md`).

- **3.5.3.5 native producer:** `PaydayLandedIntent` (iOS-17 `LiveActivityIntent`, dup widget+module) appends `{payday-landed}` to the App Group; `LiveActivityModule.readPendingActions`/`clearPendingActions`; `.native` `pendingActionBridge`; drain wired at launch + return-to-foreground; the interactive **"Payday landed"** button on the payday-day Lock Screen state.
- **Undo:** transient `paydayRollback` store field (never persisted) + `applyPaydayLandedIntent` (snapshot→roll) / `undoPaydayLanded` / `dismissPaydayRollback`; the drain dispatches `applyPaydayLandedIntent`; a **"Payday landed — Undo / Keep"** Today ack card (clone of the verified trialConversion card, **both-theme screenshot-verified**).
- **QA trigger (device-QA affordance):** `QA_TOOLS`-gated "Live Activity QA" panel in More → Developer/QA — start each state (Clear/Tight/At-risk/Payday-day) via the bridge, End, Simulate 'Payday landed'; also surfaced Simulate Premium on TestFlight. **Flip `QA_TOOLS=false` before submission.**
- **CM signing prep (caught a real gap):** the CM RN workflow's `ios_signing` only fetched the app's profile → the widget would fail "requires a provisioning profile". Fixed to fetch BOTH bundles (mirrors Freedom, `1e2485b`). Widget App ID + App Group + CM set up by Jason 2026-07-29 → §① of the manual checklist is fully done.
- **Tallies:** JS across 3.5.3 = tsc · lint · **49 app asserts** (30 Live Activity + 19 AppIntent bridge) green. Commits `68918df`·`27705c4`·`7b3fa1b`·`023aad9`·`0feda26`·`5e8f604`·`cf0ce10` (+ docs).

**Completion after-scan:**
- **Owed device checks** (real Lock Screen/DI render · button · App-Group widget data · context-menu feel) → the signed CM build now (Jason triggers) via the checklist; results → the Phase-6 device-QA ledger at 3.5.7.
- **Foreground currentDate freshness** — the countdown recomputes from `paycheck.currentDate`; if that's stale on a long background, the day count could lag until the app refreshes it. Pre-existing app concern, not Live-Activity-specific → noted for a later polish, not v1.7-blocking.
- **Wording** ("Payday landed — I rolled your plan forward…", the sub-lines) = solid placeholders → the whole-app wording/voice audit (after Phase 3.5) polishes.
- No version-necessary fixes surfaced.

**Queue replenishment (never-idle):** 3.5.3 vacates the active-build slot → **3.5.5 App Intents / Siri** promoted to active — design-locked + decomposed (3.5.5.1–.5), and it **reuses the 3.5.3.5 AppIntent→store bridge just device-testable via payday-landed** (build-after-3.5.3 rationale satisfied).

---

## Phase 3.5 · 3.5.3 Live Activity — 3.5.3.1–.3 code-complete, JS-verified (2026-07-29)

Built the Payday Countdown Live Activity through the bridge, JS fully verified (tsc · lint · **30 app asserts** green); the native Swift is written but NOT yet compile-verified (Windows can't build iOS → the batched native-e2e run is owed).

- **3.5.3.1 (data contract):** pure `buildPaydayActivityContent`/`shouldRunPaydayActivity`/`decideLiveActivityAction` (`src/liveActivity/paydayActivityContent.ts`, mirrors `widget/snapshot.ts`) — premium-gated, ~3-day window, day-granular countdown, Guardian passthrough (single source of truth), pure start/update/end reconciler. New `prefs.paydayLiveActivityEnabled` (default true, auto-backfills via the `{...base.prefs}` merge). `+ liveActivityKeys.ts`.
- **3.5.3.2 (SwiftUI):** `targets/widget/PaydayLiveActivity.swift` (ActivityConfiguration: Lock Screen card + Dynamic Island compact/expanded/minimal; Guardian state-dot the only moving color; navy/gold; deep-link → Today) joined `DebtWidgetBundle`; added the `ActivityKit` framework + a `BrandDanger` colorset.
- **3.5.3.3 (bridge):** local Expo module `modules/live-activity` (`LiveActivityModule.swift` start/update/end, all `#available(iOS 16.2)`-guarded so the app is unchanged below; Record payload). Platform-split `liveActivityBridge` (native / web no-op) + thin `liveActivitySync` (debounce + change-gate + idempotent) wired at launch. `NSSupportsLiveActivities` config plugin. Premium-only "Payday countdown" toggle in More → Preferences.
- **Shared-attributes resolution (the flagged unknown):** `PaydayActivityAttributes` is DUPLICATED (widget target + module) — the accepted expo-apple-targets pattern; ActivityKit routes by type name + Codable shape, not module identity. Researched + confirmed against a working expo-apple-targets Live Activity demo.
- **▶ Owed:** native-compile verification (GH native-e2e run) BEFORE building 3.5.3.5 (the "Payday landed" AppIntent) — de-risk the Swift before adding more. Then real Lock Screen / Dynamic Island render = device-QA at 3.5.7.

---

## Phase 3.5 · native-e2e CI speed pass (2026-07-29)

Targeted the dominant cost — the Xcode sim compile (13m27s = 58% of the run; single-arch was already in place). Two safe, no-infra, compiler-level cuts (commit `8f6e803`): **optimization OFF** (`SWIFT_OPTIMIZATION_LEVEL=-Onone` / `GCC_OPTIMIZATION_LEVEL=0` — skips the Release `-O` passes while KEEPING the Release config's embedded self-contained bundle, so the sim app still runs with no Metro; Maestro tests behavior not perf, and the signed Codemagic build stays the optimized final check) + **Clang explicit modules ON** (Xcode 26 default, un-pinned now that the pipeline is reliably green). Result (run `30452956045`, green 3/3): compile **13m27s → 11m42s (~13%, −1m45s)**. Wall-clock barely moved (−27s) because boot+Maestro drifted up on sim variance — the compile gain is the real, repeatable win; run-total keeps bouncing on sim-boot/driver variance.

**Deferred bigger lever — ccache scoped to Pods:** the Pods (RN core, Skia, Reanimated…) are most of the 11m42s and don't change as we develop app code → a warm ccache could cut far more. NOT done here: it broke the widget target before (`unable to spawn ccache-clang.sh`), conflicts with explicit modules, and can't be verified locally (Windows). Do it as a dedicated pass (scope ccache to Pod targets via a Podfile `post_install`, keep the app/widget targets untouched) if build time becomes painful during 3.5.3 iteration.

---

## Phase 3.5 · 3.5.2 — context-menu DONE: Maestro native-e2e GREEN 3/3 (2026-07-28)

3.5.2's last outstanding piece — the native verification — is green. Run `30400688656` (commit `d5d5931`, fast prebuilt core): **01-launch-smoke ✓ · 02-sheet-native-tap ✓ · 03-row-context-menu ✓** on the iOS Simulator, New Architecture. Proves the long-press UIMenu (Edit + Delete) compiles, mounts, and OPENS on New Arch — and that idb can introspect the system UIMenu (the last first-run unknown: "Edit"/"Delete" matched).

**What it took — 3 native fixes for `react-native-ios-context-menu@3.1.3` + its `react-native-ios-utilities@5.2.0`:**
1. **Typed shim** (`src/types/react-native-ios-context-menu.d.ts`) — neither line ships `.d.ts`.
2. **Folly-pin fix** (`plugins/with-context-menu-folly-fix.js`) — podspec hardcodes an ancient RCT-Folly; RN 0.85 ships newer → `pod install` fails; plugin strips the redundant pin.
3. **RCTRootContentView link fix** (`plugins/with-ios-utilities-rootcontentview-fix.js`) — see the dedicated entry below; the legacy Paper class isn't in RN 0.85's prebuilt New-Arch core.

**Maestro selector fix (test-only):** the debt row is a composite a11y element (`groupLabel` → `accessible:true`, label "Visa, $2,400 · …"); Maestro matches the FULL element text as a regex, so a bare "Visa" can't match → flow 03 uses `.*Visa.*`. Same lesson that forced tab testIDs.

**Prebuilt-core flip:** with the link fix living in a plugin, dropped `RCT_USE_PREBUILT_RNCORE=0` — fast prebuilt core restored; Codemagic's signed build needs no override either (`RCT_USE_PREBUILT_RNCORE=0` was tried first at `199c384` and still failed — the plugin is the real fix).

**Version pin (do NOT upgrade):** `react-native-ios-context-menu@3.1.3` EXACT — the 3.2.x line publishes broken (source-only, no built `lib/`, dangling `main`/`types`). `react-native-ios-utilities ^5.2.0` satisfies 3.1.3's `^5.1.4`.

**After-scan (completion):**
- ✅ **idb CAN introspect a system UIMenu** — reusable for 3.5.5.2's "Log payment" menu-action flow (assert its title directly).
- **Reusable `debt-row-*` testID** — worth adding when 3.5.5.2 touches the row (more robust than the regex; the composite row hides child text). Folded into 3.5.5.2, not churned now.
- No version-necessary fixes surfaced. Cost signal (3rd native workaround) already logged; custom-JS-menu stays the fallback if friction compounds.
- Owed device check (real long-press haptics + menu on hardware) → batched into the 3.5.7 signed device build.

**Queue replenishment (never-idle):** 3.5.2 vacates the active-build slot → **3.5.3 Live Activity (Payday Countdown)** promoted to active — design-locked + decomposed (3.5.3.1–.3.5), the 3.5.2+widget native baseline it was gated on is now green.

---

## Phase 3.5 · NATIVE BLOCK — full design lock (2026-07-28)

Locked the design across the whole native block with Jason (before any 3.5.5 code). Ratified the three already-settled items and resolved the two open ones + a unifying design language.

**Native-block design language (the through-line):**
- **Free = the honest glance · Premium = the actor.** Free surfaces: the widget (3.5.4), the two Siri glance facts, basic row actions (Edit/Delete). Premium surfaces: the Live Activity (3.5.3), the Guardian Siri query, voice log-a-payment. Same thesis as the whole app — free is complete, premium is the automation layer ([[feedback_premium_gating_value_led]], [[feedback_no_paywall_basic_functionality]]).
- **Voice:** Guardian is the sole first-person "I"; everything else speaks as "you." **Motion:** calm on reference surfaces (widget, query answers, coach-marks); the emotional beats stay in-app.

**Ratified as-is:** 3.5.2 context-menu (long-press UIMenu: Edit + Delete destructive) · 3.5.3 Live Activity (premium, auto-start ~3 days, day-granular calm countdown, Guardian state-dot the only moving color) · 3.5.4 widget (read-only).

**Decisions (Jason ✓ all, via AskUserQuestion):**
1. **3.5.6 TipKit → DROPPED, folded into Phase 3.5.** Before-scan catch: TipKit anchors *native* tip views to *native* UI, but Debt's in-app screens are RN → it barely reaches them, and feature-discovery overlapped Phase 3.5's interactive tutorial. Resolution: one discovery system in Phase 3.5 as on-brand **RN coach-marks** (iOS-16-safe, Android-reusable), priority target = the invisible long-press context menu. Avoids two competing discovery systems + the RN/native mismatch.
2. **Voice log-a-payment = PREMIUM.** It's the hands-free automation/actor layer, consistent with the Live Activity being premium; the basic in-app manual balance edit stays free (automation axis, not the core job).
3. **The voice intent gets an in-app twin.** Before-scan catch: there is **no discrete "log a payment" action today** — balances move via payday rollover / verify / manual edit. So log-a-payment needs a *new* shared `logManualPayment` store action (reduce balance · clamp ≥0 · re-anchor `lastVerifiedDate`=today · Undo), surfaced as a **"Log payment"** action in the row context-menu (joins 3.5.2's Edit/Delete). The mutation gets a visible, web-verifiable home; Siri reuses the one code path rather than being a hidden voice-only mutation.
4. **Guardian Siri query = committed premium.** The widget snapshot already carries `debtFreeDate` + `remaining` (→ the two free glance queries are ~free to ship). Expand `WidgetSnapshot` now with `guardianState` + a spoken summary + `nextPaycheckDate` (pure JS, unit-tested, same "all formatting stays JS-side" principle as 3.5.4) to power the premium "am I okay this paycheck?" query. Snapshot expansion is additive — doesn't force any widget change.

**Resulting build order (3.5.6 removed):** 3.5.0 ✅ → 3.5.1 ✅ → 3.5.2 (Maestro-verifying) → 3.5.4 ✅ → **3.5.3 Live Activity (next real build)** → 3.5.5 App Intents (after 3.5.3 for the bridge; 3.5.5.1–.5.5) → 3.5.7 close → 3.6 native iPad. Feature-discovery lives in Phase 3.5 (C).

---

## Phase 3.5 · 3.5.2 — context-menu NATIVE FIX #2: RCTRootContentView link failure (2026-07-28)

**⚠️ Reconciliation — a PRIOR fix for this same symbol already existed and empirically FAILED.** Before this session, commit `199c384` "fix(ci): build RN core from source (RCT_USE_PREBUILT_RNCORE=0) to resolve link" (2026-07-28 15:35 EDT) set that env var in `native-e2e.yml` on the theory that building React core from source would provide `RCTRootContentView`. It did NOT: GH run `30392621150` ran on `headSha 199c384` (verified) and still failed at `Ld` with the same undefined symbol at 19:51Z. So `RCT_USE_PREBUILT_RNCORE=0` is **ineffective for this** (and costly — it recompiles all of RN core from source, ~2× wall-clock, and the workflow comment claims Codemagic's signed build would need it too). This plugin is the actual fix. **✅ Follow-up DONE (2026-07-28, after the plugin cleared link — the suite ran, 2/3 passed):** removed the `RCT_USE_PREBUILT_RNCORE=0` override from `native-e2e.yml` (back to the fast prebuilt default) + rewrote the comment + dropped the "Codemagic needs env=0" warning — the plugin makes all of it moot, keeping the free pipeline AND signed builds on fast prebuilt core. Safe because the plugin removes the RCTRootContentView reference outright, so core prebuilt-ness is irrelevant to that symbol; the flip and the Maestro selector fix are separable by failure STAGE (link = flag · Maestro = selector). `199c384` was never logged in the plan; noted here.

**Trigger:** run `30392621150` (the outstanding native verification for 3.5.2, latest of several since the context-menu landed ~18:00Z — the 17:37Z run was green pre-context-menu) got past `pod install` (the Folly fix worked) and failed at the final `Ld` of `DebtPlannerRN.app`:

```
Undefined symbols for architecture arm64:
  "_OBJC_CLASS_$_RCTRootContentView", referenced from:
       in libreact-native-ios-utilities.a[48](RCTView+Helpers.o)
ld: symbol(s) not found for architecture arm64
```

**Root cause.** `react-native-ios-utilities@5.2.0` (latest; satisfies context-menu 3.1.3's `^5.1.4`) hard-references `RCTRootContentView` in `ios/Sources/Extensions+Helpers/RCTView+Helpers.swift` (`RCTRootContentView.self` metatype + `-> RCTRootContentView?` return type). `RCTRootContentView` is a **legacy Paper-renderer class**. The app runs New Arch (`newArchEnabled: true`) against RN 0.85's **prebuilt** React core, which no longer exports that class symbol for third-party linking — so the third-party static lib can't resolve it. Verified it's the ONLY reference to the class in the entire library (grep of both `react-native-ios-utilities` and `react-native-ios-context-menu` ios sources), and it only feeds a nil-able fallback: `closestParentReactContentView` → used solely by `closestParentReactTouchHandler` (line 61), which context-menu calls once as `parentReactView.closestParentReactTouchHandler?.cancel()`. The primary path already walks the superview chain for `RCTTouchHandler` first; the content-view fallback is the last resort.

**Fix.** New prebuild config plugin `plugins/with-ios-utilities-rootcontentview-fix.js` (registered in `app.json` after the Folly fix), same dangerous-mod pattern as `with-context-menu-folly-fix.js`. At prebuild (before pod install compiles the Swift) it rewrites the `closestParentReactContentView` computed property to `var closestParentReactContentView: RCTView? { return nil; }`, removing every `RCTRootContentView` token from the file. Idempotent (marker-comment guard), warns-and-skips if the block shape changes (library fixed it upstream), survives `npm install` restoring pristine source. Behavior impact: the touch-handler fallback returns nil in the rare case the superview-chain walk finds no `RCTTouchHandler` — acceptable; the long-press UIMenu doesn't depend on it.

**Verified locally (Windows, no macOS):** regex dry-run against the real pinned source → matches, and `RCTRootContentView` is fully absent post-patch; plugin `require()`s clean; `app.json` still valid JSON. The real proof is the **re-triggered GH-Maestro sim run reaching a green compile + mount** (Jason triggers) — a Windows box can't link iOS.

**Cost signal (surfaced, not acted on):** 3rd native workaround for this one library (typed shim → Folly pin → RCTRootContentView). Persisting per the greenlit decision + integration-friction-≠-scrap rule; the zero-native-dep custom-JS-menu fallback stays on the shelf if the friction keeps compounding.

---

## Phase 3.5 · 3.5.3 — Payday Countdown Live Activity — DESIGN LOCKED (2026-07-28, not yet built)

Design agreed with Jason before any Swift (design-first). **Concept:** the Live Activity is the *imminent-payday event* surface — the opposite of the always-on widget (which is the long-horizon debt-free-date glance). It auto-appears in the final run-up to payday, counts down, and shows the **Guardian read for that specific paycheck** (clear/tight/at-risk), then resolves at payday. Complementary, not duplicative. Data's all present (scout-verified): `paycheck.nextPaycheckDate` = countdown target; `selectPaydayGuardian().state` + title + safe-move = the live read; the widget's `WidgetBundle` was deliberately built to host it with no restructuring; deployment target already 16.1.

**Locked decisions (Jason ✓ all recs):**
1. **Premium-only.** The Live Activity's value *is* the Guardian read (a bare countdown is thin, and Guardian is premium). Free users keep the always-on widget as their complete glance surface → free complete, premium additive (value-led). Avoids a locked-preview feel.
2. **Auto-start in the final stretch + Settings toggle.** Starts itself when premium AND payday is within ~3 days (on app foreground); ends at payday rollover; toggle in More → Preferences. ~3 days keeps it feeling imminent without being permanent even on weekly pay. Tunable.
3. **Day-granular calm countdown** ("in 3 days" → "Today" on the last day), navy/gold to match the widget; the Guardian **state dot is the only moving color** (calm-data-viz).
4. Tap anywhere → deep-links to the Guardian/payday screen.

**Surface mockups (approved):**
```
Lock Screen card — three Guardian states (colored dot = state; calm tonal, not emoji):
┌───────────────────────────────────────────────┐
│  🏁  PAYDAY IN                  Fri · Aug 1     │
│      3 days                                     │
│  ─────────────────────────────────────────     │
│  🟢 Looks clear this paycheck                   │
│      Cushion safe · $420 free to deploy         │
└───────────────────────────────────────────────┘
  🟡 A little tight this paycheck  · Move $200 from savings to hold your line
  🔴 Very tight this paycheck      · $180 short of your obligations

Dynamic Island:
  Compact:   ( 🏁            3d )         glyph · days-left
  Expanded:  🏁 Payday · Fri, Aug 1 / big "3 days" / 🟡 Tight · move $200 to hold your line
  Minimal:   🏁  (state-tinted flag)
```

**Build sequencing:** build AFTER the current native run confirms the 3.5.2 + widget baseline compiles + boots — so the Live Activity is added onto a known-good build and any new native failure is isolated to it (the one-layer-at-a-time discipline this whole native block has taught). Decomposition (3.5.3.1–.5) is in `DEBT_ELEVATION_PLAN.md`. **Key implementation unknown:** the app-side ActivityKit start/update needs a native bridge (no `expo-live-activity` dep) — a local Expo module or config-plugin Swift + a small JS API; resolve during 3.5.3.3.

**Scope additions (2026-07-28, from the wait-time design pass):**
- **Widget stays read-only** — the interactive action moved OFF the widget (a calm glance surface) ONTO the Live Activity's payday-day state, where it's contextual → **3.5.4 closes**.
- **Payday-landed one-tap (3.5.3.5)** — on "Today", a `AppIntent` button that rolls the cycle (`applyRollover`) + Undo. Because a Swift AppIntent can't touch the JS/MMKV store, it builds the **reusable bridge**: intent → pending action in the App Group → app drains on launch/foreground + refreshes. 
- **⭐ Smart-order decision (Jason ✓):** Jason wants voice **"log a payment"** (3.5.5). Rather than duplicate the AppIntent-mutation machinery, build 3.5.3 first (which pays for the bridge via the payday-landed button), then 3.5.5's log-a-payment rides the SAME bridge + a debt `AppEntity` — the marginal cost drops from ~4–5× to ~2× the query-intent baseline. Effort table + rationale captured in-thread. **iOS-18 Control Center control deferred** → Deferred backlog.

---

## Phase 3.5 · 3.5.2 — iOS long-press context menu — CODE-COMPLETE (2026-07-28)

Long-press a debt row → a native iOS `UIMenu` (Edit + Delete, Delete destructive/red). Tap→edit and swipe→delete are untouched — the menu is a third, iOS-native discovery path (Mail/Files pattern). Files: `RowContextMenu.ios.tsx` (`ContextMenuView` builds the menu from `actions`, `onPressMenuItem` dispatches by `actionKey`, SF-Symbol icons `pencil`/`trash`), base `RowContextMenu.tsx` (transparent passthrough — web/Android unchanged), shared non-split `RowContextMenu.types.ts` (avoids the platform-split self-resolve trap), and the typed shim `src/types/react-native-ios-context-menu.d.ts`. Wired in `ListRow` inside the `onDelete` branch, over the `ReanimatedSwipeable` (menu wraps `rowBody`).

**The packaging saga (why the pin matters).** Started on `react-native-ios-context-menu@^3.2.1` (latest). A clean install has NO built `lib/` — the tarball ships **source-only**, yet its own `package.json` `main`/`module`/`types` all point at `lib/…` files that don't exist (internally inconsistent). Metro/runtime still resolve (via `react-native: src/index`, Expo transpiles the source), but `tsc` follows the dangling `types` → `TS2307`. Jason's "root-entry-file" theory didn't hold — there's no root `index.js`, and it's the package's own manifest pointing at `lib/`, not our config. Verified it's a **3.2.x regression**: `3.2.0` + `3.2.1` are source-only; **`3.1.3` ships built `lib/commonjs` + `lib/module`** AND still carries `RCT_NEW_ARCH_ENABLED`/Fabric flags in its podspec. Pinned `3.1.3` (exact). Neither line ships `.d.ts` (0 files), so a hand-written typed shim is needed regardless — done, typed to our real usage (not `any`). Native matrix confirmed coherent: 3.1.3's own devDep is utilities `^5.1.4`, which our `5.2.0` satisfies; utilities 5.2.0 pulls `DGSwiftUtilities ~>0.46` + `ComputableLayout ~>0.7` from CocoaPods trunk at `pod install`. No config plugin / script-phase / xcodeproj-glob risk (pure autolinked pods).

**Verification.** tsc green; full `validate:release:rn` green (lint + regression + app + scenarios + 63 Playwright e2e, incl. the swipe-delete spec — the base passthrough is structurally inert on web). Pre-commit native-build pass done. Added Maestro flow `.maestro/03-row-context-menu.yaml` (money tab → assert "Visa" row → `longPressOn` → assert Edit/Delete). **Outstanding = the GH-Actions Maestro sim run** (Jason-triggered) — the real check that it compiles + mounts on New Arch; flow 02 already exercises the mount path (money tab renders every row wrapped in `ContextMenuView`), so a compile crash can't hide. Then the signed device build for the tactile UIMenu feel.

**Native `pod install` failure + fix (first GH-Maestro run, 2026-07-28).** The run failed at `xcodebuild` with `'ios/DebtPlannerRN.xcworkspace' does not exist` — a symptom, not the cause: the `.xcworkspace` is generated by CocoaPods, and `expo prebuild` runs pod install best-effort (prints the error, exits 0 anyway), so the job marched on to a workspace that was never created. The real error (from the prebuild step): `[!] Unable to find a specification for RCT-Folly (= 2022.05.16.00) depended upon by react-native-ios-context-menu`. Root cause: BOTH the 3.1.x and 3.2.x lines hardcode `folly_version = '2022.05.16.00'` and declare `s.dependency 'RCT-Folly', folly_version` in the Fabric branch — RN 0.85 ships a newer Folly, so that exact spec doesn't exist. The pin is redundant (the same podspec also calls `install_modules_dependencies(s)`, which supplies RN's correct Folly). Fix = a local Expo config plugin `apps/rn/plugins/with-context-menu-folly-fix.js` (`withDangerousMod` comments the hardcoded pin out of the node_modules podspec at prebuild, before pod install; idempotent, re-runs each prebuild so it survives npm-install restoring the pristine podspec — verified the regex against the real podspec locally). Also hardened `native-e2e.yml`: an explicit fail-loud `pod install` step after prebuild so a CocoaPods error is the failing step with its real message, not the masked "workspace does not exist". Note this is the **2nd** workaround for this library (typed shim for the missing `.d.ts` + this Folly plugin) — both because it publishes roughly; Jason ✓ proceed (duplicative-but-premium affordance he's twice said to ship), with the custom-JS long-press menu as the zero-native-dep fallback if the patch-carrying cost isn't worth it.

**2nd native snag — ccache × explicit-modules (2026-07-28).** After the Folly fix, `pod install` succeeded and the build reached the compile/link phase, then failed at `Ld DebtWidget.appex` with `(2 failures)`. Real cause was systemic, not widget-specific: EVERY pod target emitted `Explicit modules is enabled but the compiler was not recognized`. The GH runner moved to Xcode 26.3, which defaults Clang explicit modules ON — incompatible with a compiler launcher (our `USE_CCACHE=1` → `C_COMPILER_LAUNCHER`), so clang couldn't module-compile and the widget link cascaded. First fix = `CLANG_ENABLE_EXPLICIT_MODULES=NO` on `xcodebuild` (Xcode's own remedy) — which cleared the module noise and revealed **act 2**: `error: unable to spawn process '/../../node_modules/react-native/scripts/xcode/ccache-clang.sh'` on the **DebtWidget** link. RN's ccache wiring set the compiler-launcher path relative to a base var that's empty for the widget-extension target (`@bacons/apple-targets`, in the app project not Pods) → broken path. ccache was now the common thread in both failures, so **ccache was removed entirely from `native-e2e.yml`** (env + install/config/cache steps): its only benefit was incremental compile caching, prebuilt RN core+deps (`RCT_USE_PREBUILT_RNCORE`, ON by default) already carry the big speedup, and this is the FREE unlimited pipeline so wall-clock isn't a $ cost. Kept `CLANG_ENABLE_EXPLICIT_MODULES=NO` as a conservative Xcode-26 choice. A correct ccache setup (widget target excluded) can return later as a deliberate speed pass. Codemagic unaffected throughout (never used ccache).

**3rd native snag — prebuilt-RN-core link failure (2026-07-28).** With ccache gone the build compiled cleanly, then failed at the MAIN-app link: `Undefined symbols … "_OBJC_CLASS_$_RCTRootContentView", referenced from … libreact-native-ios-utilities.a(RCTView+Helpers.o)`. Cause: RN 0.85 ships **prebuilt React Native core** by default (`RCT_USE_PREBUILT_RNCORE=1`); the prebuilt slice doesn't export every RN internal ObjC class, and `react-native-ios-utilities` (context-menu's dep) references `RCTRootContentView` to walk the view hierarchy → compiles, but undefined at link. NOT a library incompatibility — the code built fine; the prebuilt-core optimization just stripped a symbol it needs. Fix = `RCT_USE_PREBUILT_RNCORE: '0'` (build RN core from source; provides the class) as a job env in `native-e2e.yml`. Slower build, correct link. ⚠️ **Codemagic's signed RN build will need the same env** before it first builds the widget + context menu (it built green before those existed). If — contrary to expectation — building from source ALSO lacks the symbol (i.e. RN 0.85 genuinely removed it), that would be a real utilities↔RN-0.85 incompatibility and the custom-JS long-press menu is the zero-native-dep fallback. All prior snags were CI-infra; the RN 0.85 native modules themselves compile.

**Deferred → backlog:** delete the typed shim if/when a context-menu version ships proper `.d.ts`; delete the Folly plugin if the library stops hardcoding Folly.

---

## Phase 3 · Wave C · 3.4.5 decision — Sheet "still-premium?" audit (2026-07-28)

Ran the 3.4.5 decide-first gate as a **3-lens Fable-5 adversarial audit** on real both-theme screenshots (the Add/Edit-debt `FormSheet` + the scrollable payoff-schedule sheet stacked over the frosted edit sheet) + the actual `FormSheet.tsx`/`SheetScrim.tsx`. Lenses: interaction/gesture-physics · visual-craft/both-theme-parity · comparative/cost-benefit.

- **Unanimous verdict: "adequate but not premium."** Not embarrassing (the frosted `SheetScrim` is *above* baseline — better than `@gorhom`'s stock dim), but a few real tells.
- **Unanimous decision: KEEP the `FormSheet` + polish; do NOT migrate to `@gorhom` now.** `@gorhom` improves *feel* (drag-dismiss), not *look*; its headline features (snap points · `BottomSheetTextInput` · dynamic sizing) are **inapplicable** to these single-height form sheets; migrating 5 core add/edit flows to an imperative ref-based stack + re-litigating the hard-won `KeyboardAvoidingView`/lesson-#9 keyboard path is high-churn/low-delta risk during the regression freeze. **`@gorhom` → v1.8 Android**, flip-to-migrate trigger = a designed feature that needs multi-detent snap points or scroll↔drag handoff (a half-expanded browsable sheet). Else it stays scrapped.
- **Load-bearing claims verified against the code/screenshots before acting:** (1) the scrim *slides* up (it's rendered inside the `animationType="slide"` Modal) — TRUE; (2) dark-mode sheet↔backdrop separation is weak (no shadow/hairline/elevated dark surface; light pops via white-on-gray) — TRUE on inspection; (3) missing grabber + swipe-dismiss, text "Close", `DUE DATE (YYYY-MM-DD)` hand-typed field — TRUE in the screenshots.
- **→ Reshaped 3.4.5 = the bounded premium-polish pass** (Jason ✓ full): scrim fade-in-place · dark-mode elevation · grabber + swipe-dismiss · ✕-in-circle header · keyboard-aware backdrop + dirty-guard · date-field cleanup.

### 3.4.5.1–.6 build (2026-07-28) — the FormSheet rewrite

- **Present model (.1):** `FormSheet` Modal → `animationType="none"`; a `progress` shared value springs 0→1 on mount (`useReducedMotion`-gated), driving the sheet's `translateY` (from a measured `sheetH` below → 0) while an `Animated.View` wrapping `<SheetScrim>` fades its opacity 0→1 **in place**. Close animates `progress`→0 + `translateY`→`sheetH` then calls `onClose` (the parent unmounts after, so the exit animation runs while still mounted). Kills the "scrim slides up as a panel" tell.
- **Grabber + swipe-dismiss (.3):** a grabber pill + a `Gesture.Pan().activeOffsetY(8)` on the header/grabber zone only (so taps on ✕/headerAction and body scrolling never dismiss); past 110px or 800px/s → `requestClose`, else spring back. **The Modal content is wrapped in its own `GestureHandlerRootView`** — native Modals render outside the app root, so the app-level root doesn't reach them (the audit's flagged gotcha).
- **Dark elevation (.2):** `elevation.raised[scheme]` shadow + (dark only) a luminous top hairline (`borderTopColor rgba(255,255,255,0.16)`) — the Elevation-language move, since a black shadow can't separate a navy sheet on near-black. Fixes the dark parity gap.
- **Header (.4):** text "Close" → an ✕-in-tinted-circle (`sheet-close` testID); `DebtSheet` drops its subtitle in edit mode (the "View Payoff Schedule" headerAction was truncating it) — add mode keeps the full-width subtitle.
- **Keyboard-aware backdrop + dirty-guard (.5):** a `keyboardDidShow/Hide` ref; a backdrop tap with the keyboard up runs `Keyboard.dismiss()` instead of closing (kills the accidental-form-loss case). A `dirty` prop (wired in `DebtSheet` via a first-render snapshot vs live field-hash) routes tap/swipe dismiss through a `confirmDiscard` (Alert native / `window.confirm` web).
- **Date field (.6):** dropped the `(YYYY-MM-DD)` from the DebtSheet due-date labels (kept the format as a placeholder) — no new native dep.
- **Verify:** `sheet-polish.spec.ts` (✕ closes · swipe-down closes, CDP touch); scan/blur-glass sheet flows still green. `validate:release:rn` — **63 e2e**, both themes screenshot-verified (grabber · ✕-circle · dark separation · clean header).

### 3.4.5.7 build (2026-07-28) — full-consistency shell (Jason ✓ "do everything now")

- **Extracted the shared presentation:** `hooks/use-sheet-presentation.ts` (the scrim-fade + sheet-spring + grabber-pan + keyboard-aware backdrop + `dirty` discard-guard logic, returning styles/handlers) and `components/ui/sheet-styles.ts` (the shell geometry — frosted panel, grabber, dark luminous edge, header, ✕-circle). **`FormSheet` refactored onto the hook** (no behaviour change; gate re-verified) so there's one source of truth.
- **`AnimatedSheet` shell** (`components/ui/AnimatedSheet.tsx`) — grabber + a standard title/subtitle/headerRight/✕ header + children body, on the hook. **Converted `AmortizationSheet` + `BillBreakdownSheet`** to it (dropped their bespoke Modal/backdrop/`SheetScrim`/text-Close). They now fade+spring+grabber+swipe+dark-edge like the FormSheet.
- **`PaydayCaptureSheet`** (a multi-step flow with per-step Back/action headers that don't fit `AnimatedSheet`'s fixed header) → applied `useSheetPresentation` **directly** (like FormSheet): Modal `none` + `GestureHandlerRootView` + `KeyboardAvoidingView` (it had TextInputs and NO keyboard handling before — this fixes that) + animated scrim/sheet + grabber; kept its own step headers.
- **`dirty` wired into all 4 entity sheets** (Debt already; +Expense/Goal/LivingExpense) via a first-render field-hash snapshot vs live — so every add/edit form confirms before discarding on tap/swipe.
- **Verify:** lint + tsc clean; `validate:release:rn` green (**63 e2e**, all sheet flows); Amortization both-theme screenshot-verified (grabber · ✕-circle · dark edge · clean stack over the frosted edit sheet). Every sheet in the app now shares one premium presentation. PaydayCapture's on-device multi-step + keyboard → Phase-6 device-QA.

## Phase 3 · Wave C · 3.4.4 — Swipe-to-delete on rows — COMPLETE (2026-07-28)

**Switch-in reshape (Jason ✓):** the pre-authored "native row interactions" was mostly stale — grep proved: focus is **auto-derived** (`rankDebts(...)[0]`, not settable → drop "mark focus"); tap already opens the edit sheet (→ "edit" redundant); **snooze** has no concept in the code; `markDebtMinimumPaid` exists but has **zero UI callers** (payday-capture-owned → a manual toggle risks divergence); and `react-native-ios-context-menu` (UIMenu) can't be web-verified + adds CI/native-build risk and duplicates the swipe. So 3.4.4 reduced to the one clean, verifiable win — **swipe-to-delete** (the "B.9" the `ListRow` docstring already anticipated). The iOS long-press UIMenu moved to the **3.5 native block**.

- **`ListRow`** gains an optional `onDelete`; when set, the row is wrapped in **`ReanimatedSwipeable`** (the classic `Swipeable` is deprecated + didn't drive on web) with `renderRightActions` → a red Delete action, `containerStyle` clipped to `cardRadius` so the panel matches the row shape. `overshootRight={false}`, `rightThreshold={40}`. Ref (`SwipeableMethods`) closes it on cancel.
- **`confirmDelete`** (`utils/confirm.ts`) — cross-platform destructive confirm: `Alert.alert` is a no-op on RN-web, so web falls back to `window.confirm`; native gets a destructive `Alert`. Delete → confirm → the existing remove action.
- **Wired** on all four row surfaces: Debts (`removeDebt`) · Bills (`removeExpense`) · Goals (`removeGoal`) · Living-expenses (`removeLivingExpense`). Tap→edit is untouched.
- **Testing lesson:** gesture-handler's pan is a **touch** gesture — a Playwright *mouse* drag registers as a tap (edit sheet opens), not a swipe. Proven end-to-end with real **CDP touch events** (`Input.dispatchTouchEvent`, context `hasTouch`): swipe → Delete reveals → tap → confirm accepted → the Visa row is removed, Car remains. `swipe-delete.spec.ts` drives it this way. `validate:release:rn` green — **61 e2e**. Both themes screenshot-verified (the red adapts light/dark).
- **After-scan:** nothing version-blocking. gesture-handler was already a dep → no native rebuild for this. Deferred: swipe-to-mark-paid (blocked on clarifying `minimumPaidThisCycle` ownership) + the iOS UIMenu (→ 3.5).

## Phase 3 · Wave C · 3.4.3 — `expo-blur` frosted glass — COMPLETE (2026-07-28)

Installed `expo-blur` (SDK-matched). Applied with restraint (less-is-more) — glass on chrome, never content cards.

- **Frosted tab bar (compact/iPhone only).** `_layout.tsx`: `tabBarBackground` → a themed `BlurView` (tint by scheme, intensity 70) + `tabBarStyle: { position: 'absolute', backgroundColor: 'transparent' }` so content scrolls under the glass. Safe because the `Screen` scaffold already pads scroll content `insets.bottom + spacing.huge (64)` "to clear the tab bar" — verified nothing is hidden. The iPad rail (`isRegular`, material/left) stays solid — iPhone-first through v1.1.
- **Frosted sheet scrims.** New shared `components/ui/SheetScrim.tsx` = a `BlurView` (tint by scheme, intensity 20) + a light `rgba(0,0,0,0.28)` dim, `pointerEvents="none"` so the sheet's own dismiss Pressable (layered on top) still catches the backdrop tap. Dropped the flat `rgba(0,0,0,0.45)` wash on all 4 slide-up sheets (FormSheet · Amortization · BillBreakdown · PaydayCapture); the small centered Select dropdown keeps its simple dim (a "sheet" scrim there would be overkill).
- **Verify:** new `blur-glass.spec.ts` guards the one behavioral risk — the scrim's `pointerEvents` must not swallow backdrop-dismiss (open the scan sheet → tap backdrop → closes). Flaked once (dark) racing the slide-up → added a 500ms settle before the tap; then green ×2 both themes. `validate:release:rn` green — **60 e2e**. All 4 both-theme screenshots reviewed + Jason ✓ the look. Web frost (CSS `backdrop-filter`) is subtle; the true UIKit material is a **Phase-6 device-QA** item. `expo-blur` adds no entitlements → no provisioning regen.
- **After-scan:** nothing version-blocking. `expo-blur` is a native dep → a native rebuild is needed before device QA (batched into Phase 6).

## Phase 3 · Wave C · 3.4.2 — Chart interactivity (additive only) — COMPLETE (2026-07-27)

**Switch-in reshape (verify-pre-authored-plan):** grepped the actual surfaces — the pre-authored 3.4.2 was ~half redundant with already-shipped work: the Guardian card already carries a full **Safety net / Cushion / To debt / "$X · Your line"** legend + an explicit **"Adjust your line →"** button, and the Cash Runway already has a per-cycle **tap → full detail receipt**. So the cushion-bar zone **tooltip** and the standalone **floor-line tap** were DROPPED (redundant + would busy the calm Guardian card — less-is-more), and the "Cash-Runway scrub readout" was reshaped to **drag-select** (a floating readout would duplicate the receipt). Presented to Jason → ✓ "reshape, additive only."

- **3.4.2.1 Ring next-milestone (progress hero).** First pass: on-arc node labels (next + Free) inside the arc — **visual-verify caught it**: on the 112px ring the "25%" label collided with the center "22%" ("22%25%" mashed), and outside-right would hit the DEBT-FREE column. The nodes already GLOW to mark next/passed/Free, so per less-is-more the ring stays clean and the next checkpoint reads as a **caption in the meta column** — `Next milestone: 25%` (suppressed past 75%, where next IS Free and the DEBT-FREE date already says it). Both themes verified.
- **3.4.2.2 Trajectory scrub names the debt.** `scrubClearedName = activeClears.find(month === scrub.month)` → the readout's third segment becomes `{name} cleared` when the finger lands on a debt's clear-month (the endpoint debt included → "$0 · Car cleared"). Recovers 3.4.1.4's collision-suppressed labels for free.
- **3.4.2.3 Cash-Runway drag-select.** The container claims the responder **only on MOVE** (`onMoveShouldSetResponder`), so a plain tap still falls through to the per-cycle Pressables (tap + a11y) while a drag sweeps the selection continuously; the existing detail receipt IS the readout, so no floating overlay. Light detent haptic per cycle change (`lastSweep` ref). Hook-order fix: the `useRef` had to move above the `cycles.length < 2` early return.
- **Verify:** extended `trajectory-interactivity.spec.ts` (ring caption + scrub `cleared`) + new `cushion-forecast.spec.ts` (drag moves selection off "This paycheck", receipt still reconciles). `validate:release:rn` green — **58 e2e**. Both themes screenshot-verified.
- **After-scan:** nothing version-blocking; the reshape drops + the ring-label pivot are the notable calls (all surfaced to Jason / logged).

## Phase 3 · Wave C · 3.4.1 — Trajectory interactivity — COMPLETE (2026-07-27)

The payoff-trajectory chart gains life: a crisp line, the date read off the bead, a scrub readout, and a bead where each debt falls away.

### 3.4.1.4 — Per-debt payoff waypoints [ENGINE] (2026-07-27)

- **Engine:** refactored `buildPayoffTrajectory` (`packages/core/debt`) — the total-balance loop already pays debts off one at a time (snowball/avalanche) but threw away *when* each cleared. Extracted `simulatePayoff({...}) → { points, clears: DebtClearPoint[] }` that records the first month each pool slot hits ≤0 (index-aligned `meta[]` carries id/name back). `buildPayoffTrajectory` is now a thin `simulatePayoff(...).points` wrapper, so every existing caller + test is untouched. Regression tests added (`testBuildPayoffTrajectory.ts`): smaller-balance clears first under snowball / higher-APR first under avalanche · names+ids carried · last clear == debt-free month · never-payoff debt records no clear · wrapper === `.points`.
- **Selector:** `selectPayoffView` now runs `simulatePayoff` for both strategies and exposes `snowballClears`/`avalancheClears`; the chart picks the active strategy's set.
- **Chart:** intermediate debts only (the last clear IS the endpoint bead/date pill) get a small gold bead ON the curve at their clear-month + a collision-avoided `{name} ✓` label (skip any within 48px of the previous shown label, so 3+ debts don't crowd). Hidden while scrubbing.
- **Bug found + fixed during build (RN gotcha):** first pass wrapped each waypoint's dot+label in a non-absolute intermediate `<View>` → their `position:absolute` coords resolved against that zero-height wrapper (which sits *below* the Canvas in flow), so dots rendered off-plot and invisible. Fix: emit the dot + label as **direct absolute children** of the measured plot container via `flatMap` (matching the sibling y/x axis labels). Lesson: absolute overlays must be direct children of the measured/positioned container, never nested under an in-flow wrapper.
- **Verify:** `traj-waypoint` testID + extended `trajectory-interactivity.spec.ts` (3-debt modest-extra plan → ≥1 waypoint bead + a `✓` label visible). Both themes screenshot-verified (Klarna beads at the top, Visa mid-line label-suppressed near Klarna, Car = endpoint). `validate:release:rn` green — 56 e2e.
- **After-scan:** the collision-suppressed waypoint label (Visa) → folded a follow-on into **3.4.2**: name the debt in the scrub readout when the finger lands on a waypoint. Nothing version-blocking.

### 3.4.1 (.1–.3) — line, pill, scrub (2026-07-27)

- **Switch-in verification (pre-authored-plan check):** grep'd `buildPayoffTrajectory` (`packages/core/debt`) — it computes each debt's payoff in an internal `pool` but returns only total `{month,balance}` points. So "per-debt payoff waypoints" is NOT free presentation (needs a core change + a regression test), unlike the other three parts. Surfaced to Jason → he chose to split waypoints into its own beat **3.4.1.4** and ship .1–.3 first.
- **3.4.1.1 line-crispness** — `TrajectorySkiaChart.tsx`: the sole active stroke carried an always-on `BlurMask blur={3} style="solid"`, softening the line. Split into two layers: a wide (strokeWidth 7, opacity 0.3) `blur=6 style="normal"` underglow behind + a crisp un-blurred 3.5 stroke on top. Same luminosity, sharp line.
- **3.4.1.2 endpoint date pill** — `TrajectoryChart.tsx`: a gold pill (`#10264f` text) at the bead showing `shortDate(debtFreeDate)`; width estimated from the label length so it clamps on-screen at either edge; hidden while scrubbing. Reads the debt-free date off the chart itself.
- **3.4.1.3 touch-scrub** — RN responder (`onResponder*`, works web + native, no gesture-handler) on the plot View → `handleScrub` maps `locationX` to the nearest trajectory point, snaps a vertical guide + a dot on the curve + a floating `{MMM yyyy} · {balance} · {N mo|now}` readout; `haptics.light()` detent on each month change; `endScrub` clears on release. All on existing `mapX/mapY/monthDate` — no engine data. Overlays are RN Views on top of the Canvas (untouched shared Skia component, so identical on web/native).
- **Verify:** `traj-endpoint-pill` / `traj-scrub-readout` testIDs + `tests/e2e/trajectory-interactivity.spec.ts` (rest→pill visible + no readout; drag→readout with `mo|now` + `$`; release→clears). Both themes screenshot-verified. `validate:release:rn` green — **56 e2e** (was 54).
- **After-scan:** nothing version-blocking; scrub honestly reads `$0` at the endpoint, pill clears the axis ticks. No new queue items.

## Phase 3 · Wave B · 3.3.6 — Onboarding + early-journey wins — COMPLETE (2026-07-27)

The last Wave-B item; closes Wave B (6/6). Gate green (54 e2e). Commits `6f5e291`, `2f69392`.

- **3.3.6.1 onboarding finish** — `CompletionStep` now lands the aspirational anchor at the finish: "You could be debt-free by {date}", computed from the store (which holds the entered paycheck + first debt by then; graceful fallback when no date). tsc/gate green; the gated-flow visual → device/manual.
- **3.3.6.2 early Progress hero** — leads FORWARD before any payment: "{remaining} to go" instead of a deflating "$0 of $X paid" (the ring still honestly shows 0%). `earlyjourney.spec`, both themes.
- **3.3.6.3 first-run positioning** — DESIGN-FIRST, Jason picked the **bold reframe**: Welcome now leads with the uncopyable job — "Will you make it to payday?" + a shield + three Guardian-led features (a guardian for every payday · a real debt-free date · spend without the guilt), replacing the table-stakes framing. Copy kept honest across tiers (the free read genuinely tells you what's safe; premium automates the moves). Both themes screenshot-verified.
- **3.3.6.4 verify** — `earlyjourney.spec` (Welcome + early-Progress, both themes); full gate green.

### Wave B — whole-phase after-scan (2026-07-27)
6/6 shipped, gate green throughout. Coherence: the delight beats layer cleanly onto the calm daily surfaces (celebration/milestone fire only on real events; proof-of-work + impact-viz are calm reference/decision surfaces; tactility is app-wide). Cross-item lessons: the plan-hygiene misses (stale duplicate sub-steps · shipped items lingering in the queue · a skipped decomposition) were all caught by Jason → adopted the convention "completed → Shipped roll-up, never `[x]` left in the Active Queue" + "no `▶ NEXT` pointer lines (one entry per item)". Owed to Phase 6: all Wave-B haptics are native-only (feel), the bespoke celebration AHAP, SF-symbol render, and the onboarding-finish gated-flow visual. No version-blocking gaps surfaced.

## Phase 3 · Wave B · 3.3.5 — Tactility bundle — COMPLETE (2026-07-27)

App-wide felt polish (mechanical, no design fork). tsc + lint + full gate green (50 e2e); toggle-thumb screenshot-verified. Commit `1ecddd3`.

- **Slider detent haptic** — a light tick once per step crossed during a drag (a `lastRef` guards per-pixel spam).
- **SegmentedToggle** — rewritten with a single sliding Reanimated thumb (measured segment width → `translateX`, `duration.fast`) + a light tap haptic; covers every toggle (Debts/Bills/Goals · Snowball/Avalanche · Cushion/Timeline). Thumb alignment verified.
- **Commit haptics** — `success()` on the affordability apply / cover-and-apply.
- **`PressableScale`** — a reusable subtle-spring press-scale component; applied to the More-hub `SettingRow`s (replaced the opacity-dim). Available for broader incremental use.
- **List stagger** — wired the `stagger.list` token (via `Motion delay={i*stagger.list}`) into the VanquishedArchive tombstone reveal. Virtualized lists (Money `SectionList`) left un-staggered by design (rows mount on scroll).
- Haptics are native-only (no-op on web) → the "feel" verification is Phase-6 device.

## Phase 3 · Wave B · 3.3.4 — Affordability impact-viz — COMPLETE (2026-07-27)

The §2.9 "Can I Afford It?" animated layer. Design aligned w/ Jason pre-build. Both themes verified, gate green (50 e2e). Commit `3cfb49f`.

- Before-scan: the carve data already lives on the affordability read (`discretionaryNow` = before · `cushionAfter` = after · `floor` · `verdict`), so **no new engine** (3.3.4.1 folded into using the existing fields).
- **`AffordabilityImpactBar`** — as the amount is typed, the cushion carves from its full level down to what's left, landing against the floor-line marker; **green when it clears the line, red on tight/short**. The carved purchase reads as the gray remainder. **Reanimated, not the Guardian's Skia bar** (the before/after carve shape differs from the multi-segment cushion bar; Reanimated matches the free cushion-bar motion + is web-verifiable). Decorative (`accessibilityElementsHidden`) — the card's textual read stays the a11y source.
- Wired into all three verdict branches of `AffordabilityCard` (comfortable/tight/short). The debt-free-date slide stayed the existing "$X less to debt" text (no false-precise recomputed date, per the design).
- Verify: `affordability.spec` both-theme impact-bar screenshots ("$1,400 left · your $200 line", green clearing the floor) + the existing verdict/save-for-it assertions; full gate green.

## Phase 3 · Wave B · 3.3.3 — Guardian proof-of-work ledger — COMPLETE (2026-07-27)

The churn-hole fix (audit F6.1): premium's automation goes invisible on calm cycles; make its accumulating work visible. Design aligned w/ Jason BEFORE build (standing Guardian directive). Both themes verified, gate green (48 e2e). Commits `ac2da18`→`6133783`.

- **Calls (Jason ✓):** PREMIUM ledger only (free Momentum already covered by trajectory/interest-saved/vanquished archive → no duplicate) · a compact VISUAL strip on the **clear-cycle** Guardian card (not prose) · honest metrics only — **dropped "saved by holding vs dumping"** (holding doesn't save interest).
- **3.3.3.1 selector** — `selectGuardianProofOfWork` (premium; pure derivation from `cycleHistory`, no new persistence): held-your-line streak (consecutive confirmed cycles whose cushion reached the floor, via core `reachedFloor`) · cumulative-to-debt (Σ `totalPaidThisCycle`) · reuses `selectCalibrationScore` for the trust line. 8 asserts (streak / gating / honest-null).
- **3.3.3.2 surface** — `GuardianProofStrip`: shield glyph + "Held your line N paychecks · $X to debt · reads matched N/N" (accuracy chip only when `score.proven`), tonal tertiary text, no count-up/haptic (reference surface). Rendered on the clear Guardian card (premium · `brief.state === 'clear'` · has data), above the existing "See your forecast →" drill-down (which opens the full scorecard — display-only strip, no double tap-target).
- **3.3.3.3 verify** — `proofofwork.spec` seeds a held-cycle history → the strip shows "Held your line 5 paychecks · $1,000 to debt", both themes; full gate green. **Note:** the seed didn't cross the calibration `proven` gate so the accuracy chip stayed (correctly) hidden — verify the "reads matched N/N" branch with real proven data at Phase-6 device QA.

## Phase 3 · Wave B · 3.3.2 — Milestone-cross pulse + dead-code retire — COMPLETE (2026-07-27)

Design forks (Jason ✓): **portfolio** milestones (not per-debt) · calm Today ack + ring pulse + haptic (no overlay) · **retire** the orphaned rail. Both themes verified, gate green (46 e2e). Commits `4ce2740`→`5c4cd7d`.

- **3.3.2.1 capture** — before-scan: `computeMilestones` (per-debt) + `milestoneMaxProgress` dedup were wired in `payday.ts` but the crossings were DISCARDED (surfacing deferred "B.9"). Added `portfolioMaxProgress` + transient `pendingMilestone` to the store; `payday.ts` reuses `computeMilestones` on a **synthetic portfolio aggregate** to detect a 25/50/75% journey crossing (100% excluded → the payoff finale owns debt-free), dedup'd once-per-lifetime; `acknowledgeMilestone` clears it. 7 asserts (crossing / 100-excluded / dedup). Test learning: `applyRolloverPayment` only pays down a debt marked `minimumPaidThisCycle`, so the fixtures set it.
- **3.3.2.2 Today ack** — `MilestoneAckCard`: a calm gold-star card with threshold-specific copy ("Halfway to debt-free · 50% paid off — you're over the hump") + a success haptic on appear; wired off `store.pendingMilestone`. Proportional to a mid-journey win (no overlay).
- **3.3.2.3 ring pulse** — `JourneyRingChart` gains an optional `pulseThreshold`; the matching node breathes (animated gold glow via `withRepeat`, static under reduce-motion). Progress passes `store.pendingMilestone?.threshold` → the crossed node pulses until acknowledged.
- **3.3.2.4 retire dead code** (Jason: "retire any dead code") — deleted orphaned `MilestonesRow.tsx` + the dead `DriftResult` type re-export in `payoffSelectors` (`DriftCard` was already gone — backlog item resolved).
- **3.3.2.5 verify** — `celebration.spec` milestone tests (Today ack + Progress ring pulse), both themes; full `validate:release:rn` green. **Edge (noted):** the ack/pulse persist (`pendingMilestone`) until acked on Today — acceptable (the ack card resurfaces next Today visit). On-device pulse-stops-on-ack → Phase-6.

## Phase 3 · Wave B · 3.3.1 — Debt-paid-off celebration — COMPLETE (2026-07-27)

The flagship emotional beat. Design signed off w/ Jason (Skia+Reanimated+Core-Haptics · contained per-debt beat · full-screen finale · archive on Progress; spec `DEBT_CELEBRATION_SPEC.md`). Built structure-first, both themes verified, `validate:release:rn` green (44 e2e). Commits `5a5f32c`→(this).

- **3.3.1.1 logic** — `celebrationSelectors.ts`: `selectVanquishedDebts` (archive rows) · `isLastLiveDebt` (beat-vs-finale detector, called at confirm time before the store mutates) · `selectCelebrationStats` (honest trio). 12 asserts. **Honesty correction (Jason ✓):** interest-saved DROPPED — not derivable at $0 (no cumulative tally / historical extra) → would be fabricated; the trio is total vanquished · debts cleared · months-to-freedom (`onboardedAt`→last clear).
- **3.3.1.2 per-debt beat** — `VanquishedBeat.tsx`: contained Reanimated overlay on the constant navy panel (gold check-pop + haptic · CountUp amount · "freed $X/mo flows to {next}" cascade · Keep-going dismiss · reduce-motion snap). Refinement: Reanimated + existing components, not bespoke Skia (fires repeatedly in a snowball).
- **3.3.1.3 finale** — `PaidOffFinale.tsx`: full-screen navy takeover · the REUSED Skia journey ring swept to gold 100% w/ a "$0 balance" centre · Reanimated gold confetti burst · the count-up trio · Continue. Reduce-motion snaps + keeps the haptic.
- **3.3.1.4 archive** — `VanquishedArchive.tsx` on Progress: the growing trophy shelf (gold-badge tombstones: name · amount cleared · date, most-recent first) + plain-text Share (RN Share, no dep). Wired above Progress's early return so a **debt-free** user sees a calm "Every balance cleared" hero + the archive, not the "add a debt" empty state.
- **3.3.1.5 wiring** — Today's `PayoffInvitationCard.onConfirm` → `confirmPayoff`: `isLastLiveDebt` picks beat vs finale, beat data captured before the clear; overlays live in the single `content` return so the finale renders over the debt-free graduation branch.
- **3.3.1.6 verify** — `celebration.spec.ts` drives the real confirm flow (seeded provisional payoff → tap Confirm → beat/finale) + the archive/debt-free state; 6/6 green, **both themes screenshot-verified** (beat: "Chase Freedom · Vanquished · $4,200 · freed $300/mo→Auto Loan"; finale: gold ring · $0 · "$4,200 vanquished · 1 debt · 7 months"; archive: 2 tombstones). Bespoke Core-Haptics AHAP + on-device motion/Skia/Modal → Phase-6 device-QA.

## Phase 3 · Wave A — foundation polish & perf — COMPLETE (2026-07-27)

Opened by the 3.0 Best-in-Class Enhancement audit (7 lens-auditors × 15 lenses, real both-theme screenshots + external benchmark → `DEBT_PHASE3_ENHANCEMENT_AUDIT_2026-07-27.md`). All 7 items shipped; `validate:release:rn` green (38 e2e); both themes verified. Commits `c017a62`→`a6c6d04`.

- **3.1.1 Perf memoization** — the What-If `extra` field re-ran 3 full payoff sims + 4 Skia SVG re-parses on every keystroke. Memoized the heavy derivations off the stable store (not the input); the after-scan found the SAME pattern on 4 more sites beyond the audit's 2: progress `view`/`whatIf`/`cashCycles` · `TrajectorySkiaChart` path parses · `AffordabilityCard` + `SaveForItSheet` `engineStore` · `money` `selectPayoffView` (3 sims/section-toggle). Today + cushion-forecast `engineStore` deferred (half-measure without downstream selector memoization; no keystroke driver) → backlog.
- **3.1.2 SF Symbols on iOS** — platform-split `AppIcon.ios` → SF Symbols via a tsc-validated `appIconSF` glyph→symbol map (`@/theme/icons`, ~33 glyphs), MaterialIcons fallback for unmapped; `more-button` routed through `AppIcon`. Before-scan corrected a stale premise: the tab bar was ALREADY SF (`TabBarIcon`). Web/Android unchanged; iOS symbol render → Phase-6 device-QA (some symbols iOS-16+ → verify/fallback).
- **3.1.3 Contrast + Dynamic-Type start** — measured all suspect pairs; `text.tertiary` failed AA on cards (3.04/4.04) → bumped `#8695ab→#68758b` (light 4.66) / `#6f83a1→#8496b2` (dark 5.19), still subordinate to secondary; screenshot-verified both themes. Auditor's hero-contrast worry was a verified false alarm (heroSub 7.66/8.62). Guardian 3-stat row `flexWrap`; ring-% + CushionFloorSheet hero numbers capped at 1.4× multiplier. Residual (tertiary-on-page-bg 3.89 large-only · Today-hero cap · AX3/AX5) → Phase-6 a11y pass.
- **3.1.4 Copy coherence** — dropped first-person "we" (5 paywall/onboarding sites → direct "you"/impersonal, per the decided house voice); risk notification rewritten in the Guardian's "I" BUT kept neutral (caught: the audit's "looks tight" wording would've broken the locked cried-wolf constraint); "set aside"→"reserved" at 7 sites ([[reference_set_aside_is_gig_brand]]); warmed 4 flat empty-state titles. ("You're all set!" → B6 · paywall benefit-copy → wording audit.)
- **3.1.5 Free Cushion-bar reshape** — DESIGN FORK (approved by Jason): the free bars encoded `endingBalance` as height but colored by `net`-based status, so a floor line couldn't be drawn coherently. Reshaped to plot `net` breathing-room (the canonical floor-relative quantity) vs a dashed "your $X line" + legend; whole-dollar labels; restructured into aligned value/track/date rows with a floor-line overlay. Premium Cash Runway keeps its depth. Both themes verified. Confirmed the earlier blank-trajectory was a CanvasKit web-load artifact, not a bug.
- **3.1.6 Skia skeletons** — shared `ChartSkeleton` (ghosted ring / gridlines) replaces the bare-empty-`<View>` fallback in all 5 `.web` canvases, so a chart card never flashes empty while CanvasKit loads. Web-only (native compiles Skia in).
- **3.1.7 Dark-hero lift** — `elevation.hero.dark` gains a hairline luminous border (brighter on top) so the navy panel reads as an island against near-black (a black shadow couldn't separate it). Token-level; lifts all hero panels. Light untouched.
- **Task-level after-scan:** cross-item coherent; the before/after-scans corrected the pre-authored audit's scope on 6/7 items (findings = hypotheses — verify-against-current-code earned its keep). Minors → backlog (cents-formatter sweep · cushion-reshape e2e assert · capture-spec-in-gate).

---

## 2.7 BNPL as a first-class obligation — IN PROGRESS (2026-07-24)

### 2.7.1 design gate — before-scan + alignment (2026-07-24)

**Before-scan corrected the pre-authored premise.** The plan hypothesized "display uses `scheduledPaymentAmount × remainingPayments`, engine uses `balance`+`minimumPayment`, nothing reconciles them." Reality (verified vs code) is different and cleaner: `scheduledPaymentAmount`/`remainingPayments` are **dead capture** — collected in `DebtSheet` + CSV import, but read back NOWHERE. The engine (`projectDebtPayoff`/`buildPayoffTrajectory`/`projectCurrentBalance`/`applyRolloverPayment`/`allocatePaycheck`) and the amortization view (`selectDebtAmortization`) both run BNPL off `balance`+`minimumPayment` with `apr` forced to 0; `money.tsx` shows only a "BNPL" pill. So 2.7 is "make the installment the real model," not "reconcile two disagreeing surfaces." `biweekly` recurrence already exists in the type. **Design forks (both my recs, Jason ✓):** installment-native model + balance fallback · "Can I afford this BNPL?" folds into inverse-Guardian ① (build that engine once); 2.7 keeps the BNPL calendar.

## 2.8 Scan-to-prefill — IN PROGRESS (2026-07-25)

### 2.8.1 design gate (2026-07-25)
Before-scan: NO existing scan/camera/OCR infra (deps have no camera/vision/image-picker; the grep hits were false positives); `debtCsv` (text→Debt) is the parser precedent; the app is Expo-prebuild (config plugins + Skia native), so a native module + config plugin is the established pattern. **Agreed w/ Jason:** OCR = **Apple Vision** (on-device, no-Google, on-brand for the trust moat; iOS-first, Android→v1.8 via MLKit) · **build the native module NOW, verify at Phase 6** ("native items can still be built now") · scan a statement/bill → prefill the DebtSheet → confirm · **free initial scan / premium keeps-current**. Structure-first order: parser → native module → UI.

### 2.8.2 core parser — COMPLETE (2026-07-25)
Pure `packages/core/scan/parseStatementText(raw) → { name?, balance?, minimumPayment?, apr?, dueDate? }` — best-effort heuristic (the user confirms everything, so a missing field is never a wrong commit). Same-line `[^\n\d]{0,30}` label→amount anchoring so the "Minimum Payment Due" label can't grab the "New Balance" figure; APR either side of `%`; ISO date normalization (M/D/Y · short-year · "July 15, 2026"); the label→date gap excludes LETTERS so a greedy gap can't eat the month name (the "uly" bug, caught + fixed). Name = first known issuer (Chase/Capital One/Amex/… + Klarna/Affirm) else the first meaningful line. +18 core asserts (`testParseStatementText`) incl. minimum≠balance, partial/junk, 2-digit year. **After-scan:** real-statement layouts (multi-column, OCR noise) will need tuning against real OCR text → device-QA/Phase-6 (can't get real OCR on web); the first-line name fallback can grab a marketing header (low-harm, user confirms) → refinement note.

### 2.8.4 scan-to-prefill UI + confirm — COMPLETE (2026-07-25)
The web-verifiable flow. `DebtSheet` gains a `prefill?: Partial<Debt>` that seeds a NEW debt's fields (title "Add from scan", subtitle "Review the scanned details, then add.") — the user confirms/edits, then Adds (nothing saved without their tap). Money → Debts gets a dashed **"Scan a statement"** entry (`document-scanner` glyph, `AddRow` generalized to take an `icon`) shown only when `isScanAvailable()`; onPress → `scanStatement()` → `parseStatementText` → open the sheet prefilled. **Free** (initial scan-to-add). **Premium keeps-current:** a "Re-scan to update →" link on the edit sheet (premium + native scanner) re-scans to refresh the balance/minimum without retyping — the ongoing-automation half. **Web verification:** `scan.web.ts` returns a SAMPLE statement (+ `isScanAvailable()`=true) so the whole flow is demoable/screenshottable on web while the real OCR is the iOS-native path. `scan.spec.ts` e2e (scan → "Add from scan" prefilled sheet); full e2e **21/21**; **both themes verified** (the prefilled sheet shows Chase/2431.09/56/24.99; the dashed scan entry sits below "Add debt"). **After-scan:** web shows the scan entry with sample data — fine for the demo/verification surface, but if a web build ships revisit hiding it (→ backlog); a free-tier value-led invite for the premium re-scan is a later polish.

### 2.8 Scan-to-prefill — STRUCTURE COMPLETE (native OCR device-QA @ Phase 6) (2026-07-25)
All web-verifiable leaves shipped (parser · native module built · UI · verify). The parse → prefill → confirm flow is proven on the web surface + unit/e2e; the only unverified piece is the native Apple Vision OCR itself (image→text), which is on the Phase-6 device-QA ledger. Coheres with the debt capture (prefill reuses the DebtSheet the user already knows). Free initial scan / premium keeps-current gating in place.

### 2.8.3 native Apple Vision module — BUILT (device-QA @ Phase 6) (2026-07-25)
A **local Expo module** `apps/rn/modules/scan-vision/` (before-scan: no `ios/` committed [managed prebuild], no `modules/` dir → a local module is the correct mechanism; platform-split = base + `.web` stub, per convention). `ScanVisionModule.swift` (Expo Modules API): `scanDocument()` presents `VNDocumentCameraViewController` (system doc scanner, edge-detect + perspective), OCRs each page with `VNRecognizeTextRequest` (`.accurate`, language correction), resolves the joined text ("" on cancel). All Apple frameworks (Vision/VisionKit/UIKit + ExpoModulesCore) — **no new npm dependency, nothing leaves the device**. `expo-module.config.json` (ios · `ScanVisionModule`) + `ScanVision.podspec`. JS: `src/lib/scan.ts` (`requireNativeModule('ScanVision')` → `scanStatement()`, `isScanAvailable()=true`) + `scan.web.ts` no-op (`isScanAvailable()=false`). `NSCameraUsageDescription` in app.json infoPlist. **Verified: tsc + lint green** (nothing imports scan yet → web bundle unaffected). **⚠️ Pre-commit native-build pass:** class name matches config, only system frameworks, camera-only permission; **but the native compile + camera/OCR are NOT web/simulator-verifiable → real-device QA at Phase 6** (autolink from `./modules` is Expo's default, confirm on the first device build) [[feedback_native_module_verification_gap]].

### 2.7.5 Consolidated BNPL calendar — COMPLETE (2026-07-24)

**Design aligned w/ Jason:** a contextual section in Money → Debts (below the debt list), monthly-grouped, free. **Built:** pure core `buildBnplSchedule(debts, fromISO)` — enumerates every upcoming installment per installment-native BNPL (steps `advanceDueDateOnce`, capped at remaining, each with "i of N") + a single next-due row for a fallback BNPL; sorted; skips paid-off + non-BNPL. +14 core asserts (`testBnplSchedule`). `BnplCalendarSection` renders it grouped by month with a per-month subtotal, row = date · provider · "payment i of N" · amount; bounded to a 6-month horizon with a "+ N more" overflow line; contextual (nothing when no upcoming BNPL). Wired into the Debts SectionList footer. **Verified:** tsc · regression · app · scenarios · lint; new `bnpl.spec.ts` calendar test + full e2e 20/20; **both themes visually verified** (JULY 2026 · $216.72 · 3 payments · each installment dated/named; light at parity).

### 2.9 Can-I-Afford-This? (the inverse Guardian) — COMPLETE (2026-07-25)

The premium inverse of the Guardian, and a full ACTOR: enter a purchase → a cushion-aware read → apply / cover / save, with the whole app reshaping reactively. Reuses the Guardian engine throughout (a synthetic one-off re-solve; the tight-top-up; the goals system).

- **2.9.1 design gate** — engine reusable; Today card (Guardian's sibling); free-taste/premium-full; hybrid inline-apply + sheet-for-save; cushion-bar viz → Phase 3. All aligned w/ Jason.
- **2.9.2–2.9.4 read + apply** (`f53da64`) — pure `computeAffordability` (comfortable/tight/short) + `selectAffordability` (re-solve → honest "$X less to debt"); `AffordabilityCard` on Today; `[Apply to this paycheck]` → a named one-off → Guardian/cushion/Recovery recompute reactively + Undo.
- **2.9.6 save-for-it** (`f8ced07` engine · `74f1623`) — DEFECT-driven (Jason: a savings goal funds AFTER debt → "ready by {date}" was false). `Goal.priority` + `priorityPerPaycheck` pace cap → funds before the snowball, capped, scoped. 4-option sheet (fast/balanced/**set-your-own**/debt-first) each w/ its honest trade-off + sign-off. Live-testing fixes: confirmation state · duplicate guards (saved-state + submit ref + name-dedupe) · **sinking-fund surfaces in Recommended Actions before debt, priority-only** (Jason's hard constraint).
- **2.9.5 cover-a-tight-dip** — `[Cover $X from {savings goal}] & apply` (never the EF); reuses `applyTightTopUp`; Undo reverses both via a negative top-up.
- Guardian Safety-net "regression" investigated → NO regression (cold-start-only; demo is `genuineCycleCount:6`; reproduced 0→$480 / 6→$0). Onboarding double-tap fixed (`3a9d928`).
- Verified: tsc · lint · regression (+priority-goal/pace-cap/sinking-fund-in-actions) · app (+13 affordability) · scenarios · **e2e 23/23** · **both themes** (read · 4-option sheet · sinking-fund-in-actions · tight+cover).

**Whole-item after-scan (2026-07-25, Jason asked):**
- **Cover surfaces twice but coherently** — the affordability tight case offers "Cover & apply" (primary); if the user instead picks "Apply anyway" (accepts tight), the Guardian below re-offers its own tight-top-up. Not a conflict (a fallback second chance), but a candidate to unify in the premium-framework audit (one "hold your line" voice). → audit.
- **An applied purchase is a one-off `RequiredExpense`** → it shows in Money → Bills this cycle and, being uncategorized, is `deferrable` in Recovery. Coherent (a discretionary buy *should* be the first thing to cut in a shortfall), but worth an eye in the audit that a "New couch" reading as a deferrable "bill" isn't confusing. → audit/backlog.
- **Dedupe is inconsistent across creation flows** — the save-for-it now dedupes goal names, but `GoalSheet` doesn't (backlog), and the apply flow doesn't dedupe one-off expense names (low-harm; expenses may legitimately repeat). → GoalSheet backlog item covers the important half.
- **`@core` hot-reload gotcha** (surfaced in 2.9.6) retroactively applies to every core edit this session — but all are committed + gate-verified (not live-only), so no re-verification owed; lesson captured to memory (restart Metro after any core change).
- **Card density** — the card now carries inputs + 3 action branches + 2 confirmation states; on a short/tight Today it compounds the stacked-card density → Phase-3 ack-card coordinator (filed).
- No version-blocking findings; all fold to the backlog / the premium-framework audit.

## 2.7 BNPL as a first-class obligation — COMPLETE (whole-item after-scan)

All five leaves shipped (2.7.1 design gate → 2.7.2 installment-native model → 2.7.3 native capture/display → 2.7.4 Guardian-aware cadence + heads-up → 2.7.5 calendar). BNPL now coheres across every surface: the debt row ("2 of 4 · interest-free · /2 wks"), the Guardian ("3 Klarna payments land before your next paycheck" + the crunch it correctly detects), and the Money calendar (the full forward schedule). **Whole-item after-scan:** no new cross-item gaps — the deferred ledger (general sub-cycle undercount · BNPL payoff-rate in `projectDebtPayoff` · originalBalance staleness · monthly-only amortization for a biweekly BNPL) is captured in the backlog; the Premium-framework audit carries the BNPL-cadence-research criterion. Fallback BNPLs (no installment fields) degrade gracefully everywhere (interest-free row · single calendar row · no scaling). Wording throughout is a solid placeholder → the audit's voice lens polishes.

### 2.7.4 Guardian-aware cadence — COMPLETE (engine + surfacing) (2026-07-24)

**Before-scan finding (corrected the "light UX touch" framing):** the allocator counts each obligation ONCE per paycheck cycle at its single due date (`allocatePaycheck` `isDueBeforeNextPaycheck`), and the timeline advances one occurrence per rollover — so a **monthly-paid** user with a **biweekly** BNPL sees ~1 of ~2–3 in-cycle charges → the Guardian under-detects that crunch (and the BNPL retires ~2× too slowly in the monthly payoff projection). Not BNPL-specific (a weekly/biweekly RequiredExpense has the same undercount). **Jason's call: the bounded BNPL-scoped fix** (vs a general per-occurrence allocator refactor).

**Fix (bounded):** reflect the FULL in-window BNPL outflow in the Guardian's CASH read by scaling a BNPL's effective per-cycle minimum to its in-window installment count — leaving paid-flags/rollover/paydown untouched.
- Pure core `bnplInstallmentsInWindow(debt, start, end)` (steps from the due date by cadence via the now-exported `advanceDueDateOnce`, capped at remaining) + `scaleBnplMinimumForWindow`/`…sForWindow` (effective min = count × installment, capped at balance; no-op for ≤1 charge + non-BNPL). +10 core asserts.
- Wired at the two engine boundaries (mirrors the 2.5 trial pattern): `buildAllocation` (cycle-0 window → the Today card reads the full outflow) + `buildMultiCycleTimeline` (a TRANSIENT scaled copy per projected-cycle window → the lookahead; `projDebts` rolls forward unscaled so scaling never compounds).
- App-layer integration test `bnplCadence.test.ts`: monthly-paid + biweekly BNPL reserves $300 (3 charges) not $100; biweekly-paid (aligned) unchanged at $100; the monthly earner's cycle-0 net is correctly tighter. +6 asserts.

**Surfacing (2.7.4.3) — COMPLETE (Jason: minimal named callout).** The Guardian already reads tight on the corrected numbers; this NAMES the cause. App selector `selectBnplBetweenPaycheck` (BNPL-cadence logic kept in the app layer, off core): the highest-count live installment-native BNPL charging 2+× before the next paycheck → a calm caption on the card, all tiers — "Heads up — 3 Klarna payments (about $100 each) land before your next paycheck." Rendered inside the narrated a11y group (spoken via the group label, not twice); quiet for the aligned biweekly-paid case. +2 app asserts. **Both themes visually verified** (calm tertiary caption under the read; light at parity); the Today hero's Required also reflects the scaled outflow ($1,700 = rent + 3× Klarna). Placeholder wording → the audit's voice lens polishes. Full e2e 19/19.

**Verified:** tsc · core regression (incl. the window tests) · app (incl. the integration test) · scenarios · lint · full RN e2e 19/19 (no regression from the timeline change).

**Deferred (filed to backlog):** the general sub-cycle obligation undercount (non-BNPL weekly/biweekly bills — needs a per-occurrence allocator refactor) · the BNPL payoff-RATE undercount in `projectDebtPayoff` (the monthly debt-free-date projection still pays a BNPL 1×/month → retires ~2× slowly; 2.7.4 fixes the cash read, not the payoff-rate).

### 2.7.3 BNPL-native capture + display — COMPLETE (2026-07-24)

**Capture (`DebtSheet`):** BNPL now has its OWN field set instead of the generic debt form — Type moved up; when BNPL: **Provider** (Klarna/Affirm/Afterpay/PayPal/Zip/Sezzle/Other, optional) · **Payment amount** (the installment) · **Payments remaining** · **How often** (BNPL cadence list) · **Next payment** date, with a read-only derived line ("N payments of $X · $Y left · interest-free"). No balance/minimum/APR inputs for BNPL — balance is DERIVED (scheduled × remaining), minimum = the installment, apr = 0 (fixes the 2.7.2 after-scan silent-override + wrong-originalBalance: submit computes both from the terms). New optional `bnplProvider?` on `Debt` (additive, no migration). Cadence defaults to biweekly on the type switch (pay-in-4 is the common case).

**Cadence coverage (Jason mid-build):** BNPL spans biweekly pay-in-4 → 3/6/12/24/48-month financing → one-time (pay-in-30). Modeled as **(cadence × payment count)**: a "48-month plan" = Monthly × 48; one-time added to the BNPL cadence list. No core `Recurrence` enum change. Also filed a **research-all-cadences criterion to the Premium-framework audit gate**.

**Display (`DebtRow`):** an installment-native BNPL reads as its plan — provider pill (or "BNPL") · "`X of N paid`" · "interest-free" (never a meaningless APR) · the installment with a **cadence-aware suffix** (`/2 wks` for biweekly, etc., not a false `/mo`). A fallback BNPL (no installment fields) still reads "interest-free" under a generic "BNPL" pill. Regular debts unchanged (balance · APR · /mo).

**Demo:** the Affirm sample debt upgraded to installment-native (4 × $78.86 biweekly, provider Affirm) to showcase the "of 4" read; the Klarna sample stays a fallback example (both paths render).

**Verified:** tsc · regression · app · scenarios · lint green; new `bnpl.spec.ts` e2e (installment-native + fallback rows) + full RN e2e **19/19**; **both themes visually verified** (rows + the capture sheet) — light at premium parity.

**After-scan (→ 2.7.4 / backlog):** (a) a one-time BNPL entered with >1 payments remaining is contradictory — the engine drops `one-time` from recurring rollover, so it may not pay down N times in projection → 2.7.4 (cadence-aware) or a capture hint; (b) editing a BNPL's remaining doesn't update `originalBalance`, so the "of N" total can go stale on an upward edit (low-harm) → backlog; (c) `AmortizationSheet` builds a MONTHLY schedule off `minimumPayment` — for a biweekly BNPL the "View Payoff Schedule" timing won't match the real biweekly cadence → 2.7.4 / backlog (cadence-aware amortization).

### 2.7.2 installment-native model — COMPLETE (2026-07-24)

**Model:** for a BNPL with BOTH a positive `scheduledPaymentAmount` and `remainingPayments` ("installment-native"), the two installment fields are canonical and `balance`/`minimumPayment` are DERIVED (`balance = scheduled × remaining`, `minimumPayment = scheduled`). A BNPL missing either field is NOT installment-native → the plain balance+minimum fallback path, unchanged. That fallback IS the reconciliation: when installment data exists, balance can't drift from the schedule because it's derived.

- **Pure core helper** `packages/core/debt/bnplInstallment.ts` — `isInstallmentNative` · `normalizeBnplInstallment` (idempotent; no-op returns the same reference so it's safe to apply blanket) · `bnplPaymentsRemaining`/`bnplPaymentsTotal` (derived off the current/original balance for the 2.7.3 "payment 2 of 4" read). Reconciliation-tested: `testBnplInstallment.ts`, +13 core asserts, wired into `runRegressionTests`.
- **Applied at every write seam** so stored data is always self-consistent and the engine needs ZERO read-site changes: `store.addDebt`/`updateDebt` (a BNPL terms edit re-derives balance + is treated as a verification for the date stamps) · CSV import (`debtCsv.ts`) · **migration v5→v6** (`CURRENT_STORE_VERSION` 5→6; reconciles existing installment-native BNPL — those fields were dead pre-v6, so snapping balance/minimum to the entered schedule is the correct fix).
- **Rollover** (`applyRolloverPayment`) — new `syncBnplRemaining` re-derives `remainingPayments` from the paid-down balance at both return points, so "2 of 4" stays truthful as the plan pays down (a no-op for every other debt).

**Verified:** tsc clean · core regression (incl. the new BNPL tests) · app-layer (persistence/migration covered) · scenarios · lint:rn — all green. Web-export e2e deferred to the 2.7.3 UI checkpoint (2.7.2 changed no UI).

**After-scan (→ 2.7.3 / 2.7.4 inputs, not blockers):** (1) the DebtSheet still asks for `balance` AND scheduled/remaining for BNPL — the entered balance is now silently overridden by the terms → 2.7.3 derive/hide the balance field for BNPL; (2) `originalBalance` on a sheet-added BNPL = the entered balance, not the derived → 2.7.3 derive it at capture; (3) no demo BNPL is installment-native (both use the fallback) → 2.7.3 upgrade one demo BNPL to showcase "2 of 4" + biweekly; (4) snowball extra can over-pay an interest-free BNPL — `syncBnplRemaining` keeps it coherent, but "should snowball target a BNPL at all?" → 2.7.4.

---

## 2.6 Close-the-loop + THE RECOVERY PLAN — COMPLETE (2026-07-24)

**Design consensus (Jason "I agree completely") — "one ladder, two directions":** Recovery is the Guardian's existing priority ladder run in the deficit direction; same card/voice/engine, trouble surfaces funnel into one entry. Decisions: classify = category-default + per-bill override; defer = advance the due date one cycle, honestly. Before-scan confirmed the engine already yields the raw materials (`allocation.shortfall` · `unfundedRequiredItems` · `category`/`isAutopay` · the apply primitives).

- **2.6.2 classification (`0e22e14`)** — optional `deferability` override on `RequiredExpense`; pure `classifyDeferability` = override ?? category-default (housing/utilities/medical/insurance essential; subscriptions/other/uncategorized deferrable — offered, never auto-deferred). +8 core asserts.
- **2.6.3 recovery engine (`635a459`)** — pure `buildRecoveryPlan`: ranks deferrable largest-first (fewest defers), running gap-close, minimal suggested set, closeable/residual honesty branch. Debt minimums essential by rule (caller-placed). +13 core asserts.
- **2.6.4 selector + defer action (`d1ff116`)** — `selectRecoveryPlan` (gap = shortfall; cover-now = essentials + minimums; safe-to-defer classified; trials priced) + `deferExpense` (advances due date to next payday). +14 app asserts incl. the defer→gap-shrinks→clears loop + the override.
- **2.6.5 recovery card (`81d377c`)** — `RecoveryPlanSection` inline in `PaydayGuardianCard` (premium), matching its visual language: COVER NOW summary + interactive SAFE TO DEFER checklist (suggested pre-checked, live gap math) + "Keep essential" per-bill override + one-tap "Defer these N → next paycheck" (each `deferExpense`; all surfaces update reactively off the one store). Free keeps the value-led read + invite (the built plan is premium acting). Un-closeable branch honest.
- **2.6.6 verify** — `recovery.spec.ts` 3/3 (renders · apply closes the gap · free gating); full e2e 18/18; regression + app-layer green; **both themes cohesive with the Guardian card** (Jason's hard req). Interest-Saved counterfactual moved OUT → 2.9 Momentum (Jason: no place in recovery).

**Reactivity (Jason asked):** one zustand store, all three tabs subscribe via `useAppStore`; `deferExpense` `set()` broadcasts → Today (shortfall recomputes, card relaxes, hero flips), Money (new due date), Progress (trajectory) all update automatically — the "one engine" enforced at the data layer.

**After-scan (whole-2.6) → convergence audit @ next gate:** (a) **surface unification is partial** — the plan-hero "Overdue payments need attention" line + the Required Actions card still show independently of the recovery card on a shortfall Today (the recovery card is THE entry, but the others don't route into it / overlap) → the consensus's "funnel into ONE entry" is only partly delivered (UX coherence lens); (b) **free shortfall invite copy** — "Premium keeps your cushion at your line" reads off-context when you're short (wording lens); (c) **shortfall-Today density** — recovery card + Required Actions + hero all present (compounds the 2.4/2.5 density finding); (d) the "Keep essential" override is one-directional (deferrable→essential only; an essential-category bill you'd defer isn't reachable from the card → possible ExpenseSheet `deferability` control, backlog).

---

## 2.5 Smart obligation quality layer — COMPLETE (2026-07-24)

**Rescope (before-scan, Jason ✓):** the pre-authored "add 4 capture fields + flag lapsed-trial/one-off/finite-BNPL" premise had drifted badly against current code — **category** (`RequiredExpense.category`), **BNPL term** (`Debt.remainingPayments`/`scheduledPaymentAmount`, captured in DebtSheet + CSV), and **amount-variance** (`RequiredExpense.expenseType`) were ALL already captured; **one-off** is already fully handled by `one-time` recurrence (dropped in both `rolloverPayCycle` and `buildMultiCycleTimeline`); and a deeper read showed **finite-BNPL already retires correctly** via balance-depletion (`DebtSheet` requires `minimumPayment>0`+`balance>0`, `applyRolloverPayment` pays BNPL interest-free to balance→0; `remainingPayments` is amortization-display-only). → **one-off + BNPL-expiry heuristics both SCRAPPED.** Net 2.5 = the two genuine gaps: **trials (unmodeled)** + **variable-bill reserve (flag captured, Guardian never consumed it).** BNPL-as-first-class filed as a new Phase-2 item **2.7** (after the Guardian audit, Jason's call — not required for Guardian since the forecast uses balance+min).

**2.5.1 schema (`08d28a4`)** — optional trial fields on `RequiredExpense`: `isTrial` · `fullAmount` · `fullChargeDate`. Backfill-safe, no migration / no version bump (parses like `cycleTopUp`).

**2.5.3a trial projection (`08d28a4`)** — pure resolver `packages/core/obligations/effectiveObligationAmount.ts`: a trial bills its intro `amount` until its occurrence reaches `fullChargeDate`, then `fullAmount`. Keyed off the obligation's OWN due date (which rollover advances per cycle → converts in the right projected cycle, no cycle index threaded). Applied at the two store→engine boundaries — `selectors.ts` `buildAllocation` (live cycle + forecast cycle-0 base) and `buildMultiCycleTimeline` (cycle-0 param + each rolled `projExpenses`). Reference-stable no-op for non-trial obligations, so byte-identical for everything pre-2.5. +11 core asserts.

**2.5.3b variable-bill buffer (`ebd015f`)** — premium holds `VARIABLE_BILL_BUFFER_FRACTION = 15%` of this cycle's `expenseType:'variable'` obligations as extra cushion. Threaded through `allocatePaycheck` → `combinedHoldback` as a new operand **composed into the uncertainty `max`** alongside discovery/cold-start → folded into the cushion, never STACKED on the discovery reserve (a cold-start user's larger learning reserve absorbs it; post-cold-start it stands alone). Premium-gated (the acting); free undampened. Engine `Expense` type gains optional `expenseType`. Buffer shapes cycle 0 only (deploy-independent carry is unaffected — consistent with the other holdbacks). +variable/combinedHoldback asserts. _After-scan → convergence-audit wording lens: the held buffer surfaces in the `discovery_holdback` ("Settling-in reserve") bucket, whose label mis-describes a permanent variance buffer once discovery decays._

**2.5.2 trial capture UI (`0367e4e`)** — "Free trial or intro price" toggle in `ExpenseSheet` revealing full-price + kick-in-date (mirrors the BNPL reveal in `DebtSheet`); free-trial $0-intro validation relaxed (requires `fullAmount` + a valid kick-in date instead); turning the toggle off clears the trial fields. Bills-list meta gains "· Trial → $X {date}". e2e `trials.spec.ts` (resolver reprices the read: converted→tight, not-yet→clear). Both-theme visual verified (Bills list). ExpenseSheet FormSheet modal → device-QA (RN-web can't drive it).

**2.5.4 trial-ended keep/cancel card (`4cb0ed9`)** — once a trial converts, the resolver bills the full price forever: correct if kept, a phantom bill if cancelled, and the engine can't know which. `selectTrialConversion` (fires when `fullChargeDate <= currentDate`, still `isTrial`; **tier-AGNOSTIC** — a cancelled trial pollutes the free forecast too) drives a calm Today ack-card (matching reserve-release/walk-back): **Keep it** → `updateExpense` sets `amount=fullAmount` + clears trial flags · **I cancelled it** → `removeExpense` · **Not now** → ephemeral dismiss (re-surfaces next open until resolved). One-at-a-time (the next converted trial appears after the first resolves). +9 app-layer selector asserts; e2e asserts the card renders + Keep it resolves it. Both-theme visual verified. _After-scan → convergence audit (UX lens): the "Not now" button sits centered with a loose gap below the action row — tighten/left-align._

**2.5.5 verify — full `validate:release:rn` gate GREEN (post-restart, clean memory):** lint:rn · test:regression · test:app (incl. 9 trial-selector asserts) · test:scenarios · test:e2e:rn **15/15** (incl. the 2.5.4 card) · both-theme visual (Bills list + trial card). Env note: mid-session the gate OOM'd (Metro :8081 + :4319 serve + Playwright Chromium + VS Code exhausted RAM) → machine restart cleared it; the e2e harness-race residual is filed to Phase-4.

**After-scan (whole-2.5) — folded/filed:** variable-buffer "Settling-in reserve" label (→ convergence audit wording lens), "Not now" layout centered/loose (→ convergence audit UX lens), **variable buffer shapes cycle 0 only — forecast/lookahead doesn't widen for variable future cycles** (→ convergence audit accuracy lens), **the trial card adds to the Today ack-card stack** (→ compounds the existing affordance-density finding), ExpenseSheet modal visual (→ device-QA), e2e harness race (→ Phase-4 residual), behavioral mis-entry detection (→ Connected/Plaid backlog). Nothing else needed folding into v1.7. Multiple-converted-trials handled one-at-a-time (accepted for v1).

---

## 2.4.11 final stretch + WHOLE-2.4 after-scan (consolidated from the plan 2026-07-24)

**2.4.11.4 — Guardian honesty edges (all shipped, verified both themes, tsc/lint/core/app green):**
- **4a Two-sided-with-a-why safe move** — `buildGuardianBrief` gains `deployTradeoff`/`tradeoffTargetName`; the selector flags a genuine EF-vs-debt tradeoff (live debt + underfunded EF + not `hasSavingsElsewhere`) → a two-sided move ("Apply the spare $X toward {debt} to save on interest, or build {EF} first if you'd rather strengthen your cushion — your call"); mechanical moves stay single. Wording "Apply the spare $XX" (Jason). Standing "Your call" suppressed when the move carries it. _After-scan → backlog: spare-to-starter-EF (EF<$1k) leaves `deployedToDebt`=0 → the "keeps all as your cushion" branch overstates cushion (reverse-direction; convergence audit)._
- **4b.0 Cushion-bar legend fix** (Jason "perfect, exactly how I envisioned it") — condensed to the hero card's compact legend; the held reserve promoted to a top-row keyed swatch, ordered to the bar's fixed L→R shading (Safety net → Cushion → To debt); "Your line" demoted to a keyed sub-line. Design call (Jason): Cushion = TOTAL protected (reserve nested by shared color, taught by the 3.5 tutorial).
- **⭐ NAMING:** the held reserve is **"Safety net"** — NOT "settling-in reserve" (jargon) and NOT "Set aside" (Gig app's brand). A tooltip → Phase 3; full teaching → the 3.5 tutorial.
- **4b Safety-net release moment** — `priorReserveHeld` + `pendingReserveRelease`; `applyRollover` detects held→free (`deriveConfidenceContext.provisional` pre vs post) → a one-time ack branched on TAPPED (surprise-outflow sum). `selectReserveRelease`/`acknowledgeReserveRelease` + a calm dismissible Today card.
- **4c "Bills complete" attestation + walk-back** — `billsAttested` reduces the discovery fraction 0.4→0.15 (`DISCOVERY_HOLDBACK_ATTESTED_FRACTION`, never skips); a card-contextual toggle (`selectBillsAttestation`/`setBillsAttested`); `recordSurpriseOutflow` walks it back (un-attest + restore + `pendingReserveWalkback` card). Verified: attesting drops the net $680→$255, deploys more to debt, pulls the debt-free date earlier. Follow-on → backlog: a visual "see the impact" (v1.1/1.2).
- **4d Valley debt-free band** — DESIGN CAPTURED → build moved to Phase 3 (trajectory-cone = trajectory work; no scaffolding needed, pure derivation).
- **4b+4c after-scan:** (a) 4b `covered` = full log sum → can overstate; (b) 4c affordance over-promises for variable income (cold-start hold, not bills); (c) walk-back fires on any surprise; (d) ack cards can stack on Today; (e) variable-income release one rollover late (known). All → convergence audit + backlog.
- **2.4.11.6 Verify** — folded all Guardian states onto the RS.6 e2e harness (at-risk · missed/paused · stale · debt-free→savings + clear/tight/shortfall/free/intro), guardian.spec.ts 12/12. Fixed a regression the harness surfaced (4b.0's legend changed "Your line"→"$200 · Your line", breaking the clear spec).

**✅✅ WHOLE-2.4 AFTER-SCAN (Payday Cushion Guardian complete, a major task):**
- **Coherence → the Guardian convergence audit @ 2.6:** (1) multiple honest-but-different numbers on Today (hero "Free $X" vs Guardian "Cushion $Y" vs runway "net" vs post-top-up "$X free/$Y held"); (2) **⭐ premium debt-free date can read LATER than free during cold-start** (premium holds a safety net, free deploys all) — positioning risk, mitigated by attestation + the ~3-cycle release; (3) affordance density (Guardian card + Today ack cards).
- **Cross-cutting lessons:** "surfacing an internal CUMULATIVE quantity as a per-cycle USER number" is a recurring bug class (2.4.9 chart · `waterFill.reserveByCycle` · RS.4); the `@core` junction hot-reload trap (fixed 2.4.6.1.2 metro config); design-first corrected 3× early then held; "premium shows what free structurally can't"; appearance edits must re-run the RS.6 e2e.
- **Deferral ledger:** Phase 6 device-QA (gpp-* icons · native Skia · notification delivery + backgrounded-rollover · ffp:// · VoiceOver) · Phase 3 (4d band · Guardian interactivity) · Phase 3.5 (demo · tutorial) · v1.1/1.2 (attestation impact viz) · convergence audit + backlog (the honesty/coherence items above).
- **Test coverage:** core reconciliation (every engine module) · app-layer (RS baseline) · scenario (reserve lifecycle) · e2e (all states, 12/12). No version-blocking work surfaced.

---

> **Mandate (Jason 2026-07-20):** *"A plan to do things RIGHT, not just evolve because it saves some time. I'm at that level with Freedom and I want the same with Debt. This app is no longer the guinea pig. This app will be at the level or above the rest of the apps by the next version, or it's quickly becoming churn."*
>
> **This SUPERSEDES the "v1.7 = The Robust Build (parity migration + revenue spine)" framing.** Same version (the next ship), bigger ambition: not "migrate + monetize" but **elevate Debt to best-in-class + acquisition-ready.** Scope-creep is explicitly OFF the table as a constraint — comprehensiveness to reach the bar is the mandate. Governed by [[user_debt_app_learning_sandbox]] (guinea-pig role retired), [[feedback_premium_quality_bar]], [[feedback_less_is_more_premium]], [[feedback_agree_design_before_implementing]]. Strategic basis: `MONETIZATION_AUDIT_2026-07-20.md` · `PREMIUM_RESHAPE_SPEC.md`.

---

## The bar (definition of "there")

Debt ships only when it clears **Freedom-v1.0-or-above AND acquisition-ready**, concretely:
- **Structure/IA** expresses what Debt *is* (a payday-triggered emotional payoff journey), designed first-principles — not a generic PFM template carried over by habit.
- **Visual + motion** are a deliberate premium design language; the daily surfaces are calm/restrained, the emotional beats (a debt paid off) are genuinely delightful.
- **Premium is *active substance*** (the reshaped feature set) — worth downloading and paying for, not "smart text."
- **Quality**: a real automated test suite + device-QA'd across the full native surface + iPad; the data-continuity bridge proven on a real upgraded device; **accessibility to WCAG 2.2 AA (Debt's own first-class expression), designed-in and device-verified (VoiceOver/Dynamic Type).**
- **Trust is visible** (the moat: honest, on-device, never sells you more debt) — in the app and the store.
- **Store presence** is acquisition-grade (sells the active/emotional features + the trust positioning), and first-run makes a cold user "get it" in seconds.

## Operating principle 1: DESIGN-FIRST, then build to it

The core mistake to avoid is elevating *after* building. So the foundation (structure, visual language, the reshape, the readiness gap-list) is **designed and signed off BEFORE the build** ([[feedback_agree_design_before_implementing]]). No parity shortcuts; no EVOLVE-to-save-time.

**What Phase B already earned (preserved, NOT wasted):** the RN stack proven, `packages/core` (the engine — never rewritten, per the invariant), the zustand store, the design-token system, the reusable primitives, the Freedom-RN-lessons hardening, and Drift's tested engine. The **experience** gets elevated on top of this foundation; the **core** stays put.

## Operating principle 2: TECHNOLOGY-AGNOSTIC — the tool serves the bar (Jason 2026-07-20)

Don't default to pure-RN by habit; **use native code where it delivers a first-class result RN can't.** Interop is standard: `expo-modules` (clean native modules), Fabric native components (embed SwiftUI/UIKit in RN screens), and extensions (widgets, Live Activities). **Some reshape features FORCE native** — the home-screen widget is SwiftUI-only; Live Activities / App Intents / Siri / Control-Center are iOS-native best-in-class touches.

**Each platform is first-class on its OWN terms (Jason 2026-07-20):**
- **Never weaken iOS to keep Android in lockstep — and vice versa.** Platform-**exclusive** capabilities are embraced, not avoided ("we can only do this on iOS/Android" is NOT a showstopper).
- **"First-class on Android" = Android's OWN native capabilities** (Material You / dynamic color · Android App Widgets + Quick Settings tiles · Wear OS · rich notifications) — designed *as an Android app*, NOT an iOS port. A reskinned iOS design = a second-class port, which fails the bar.
- **What keeps it affordable (not 2× everything):** divergence lives ONLY at the native-capability *edges*. **Shared `packages/core` engine + shared RN app surface** stay common (one codebase for the logic + the bulk of screens); only the platform-native flourishes diverge. "Shared core + shared surface + first-class native edges per platform," not two apps. The engine never goes native (rewrite-the-experience-not-the-core invariant).
- **Sequencing (eyes-open, solo-dev):** those divergent native edges are real extra surface, so iOS gets its first-class native edges now (current focus + revenue); **Android gets its OWN first-class treatment at v1.8** — neither a hostage to the other. Use native **where it earns the result, not everywhere** ([[feedback_less_is_more_premium]]).

---

## The phases

### Phase 0 — Design Foundation _(design-first; Jason signs off before any build)_
- **0.0 Best-in-class benchmark layer** _(Jason 2026-07-20 — "the bar is first-in-class; we don't go in blind or on assumptions")_ — external first-in-class teardowns per bar dimension, feeding the design items: **IA/structure** (→0.1) · **visual language + motion + emotional-moment/delight** (→0.2) · **premium substance + monetization model** (→0.3) · **trust-as-felt + first-run/cold-start** (→0.1/Phase 6) · **native platform touches** (→0.5). Quality/testing is NOT benchmarked (reference = Freedom's shipped suite). Docs: `DEBT_IA_BENCHMARK_2026-07-20.md` + `DEBT_BENCH_{VISUAL_MOTION,PREMIUM_MONETIZATION,TRUST_FIRSTRUN,NATIVE}_2026-07-20.md`. Pairs with the internal 0.4 readiness audit (where WE fall short) — together = the evidence base, no assumptions. **✅ ALL 6 BENCHMARKS DONE (2026-07-20) → synthesized into `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md`** (the design decisions for 0.1/0.2/0.3/0.5; per-surface content proposal + free/premium line + model + the build-order linchpin).
- **0.1 First-principles IA / structure redesign** — question every convention: the nav model, the tab set, the primary surface, *whether it's tabs at all.* Benchmark best-in-class in **any** category, not just finance. Output: the agreed IA.
  - **✅ IA SKELETON AGREED (Jason 2026-07-20, evidence-based) — 3-tab bottom bar + a "•••" More corner:** **Today** (home — the payday "what to pay now" moment; the wedge) · **Progress** (first-class journey — debt-free date, milestones, momentum, the debt-paid-off celebration) · **Money** (consolidated management; opens to **Debts** as its hero section → **Bills** → **Goals**). **More** ("•••" corner) = Data · Preferences · About. **Rationale:** the two reasons-to-open (Today, Progress) own the tab bar; entity-management is reference work collapsed into one sectioned hub. **Evidence:** `DEBT_IA_BENCHMARK_2026-07-20.md` (Q2 consolidate / Q3 tabs — Oura Today·My Health·Vitals + Rocket Money "Recurring" precedents) + the 0.4 audit (IA = the #1 load-bearing P0). Debts→its-own-tab is a one-line promote if it ever tests as buried.
  - **▶ REMAINING in 0.1 — per-surface content design** for Today / Progress / Money. **Proposal DRAFTED (`DEBT_PHASE0_DESIGN_SYNTHESIS` §3), folding in 0.2 (motion/celebration) + 0.3 (premium line) + trust surfaces + native.** ⏳ Awaiting Jason's react to §3 + the open decisions (§6: D-LINE free/premium line · D-LIFE Lifetime · W widget-tier).
- **0.2 Visual design-language + motion system** — a deliberate premium identity (type/color/depth/spacing), the motion language, and the **emotional-moment design** (celebrations, progress-fill, animated numbers). Output: the design language + comps for the key screens + the delight beats. (Resolves D7.)
  - **✅ VISUAL LANGUAGE — comp DONE + Jason-approved (2026-07-20)**, both-theme screenshot-verified (light == dark bar; Jason: "light mode looks like it belongs now"). Identity: cool slate/navy, **navy hero/beat panels constant in both themes** (parity + identity move), light lifted via soft navy-tinted shadow, single blue accent + semantic green/gold, warmth on beats only. All 3 tabs + the beat comped. **Detail + live comp link → `DEBT_PHASE0_DESIGN_SYNTHESIS` §8.**
  - **✅ MOTION SPEC DONE (2026-07-20) → `DEBT_MOTION_SPEC_2026-07-20.md`.** Stack (grounded selection, `DEBT_MOTION_TOOLING_2026-07-20.md`): **Reanimated ~4.3** (Freedom-parity) + **in-house `<Motion>` wrapper** over `motion.ts` (Moti rejected — Reanimated-3-only) + **Skia** for GPU beats/rings (the future portfolio data-viz/generative-delight lever) + **expo-haptics** + one bespoke payoff pattern; **Rive/Lottie deferred**. Celebration tiers choreographed (payday quiet → milestone pulse → debt-paid-off Skia spectacle: ring→$0→freed-payment cascade). **Tab-navigator black-screen trap guarded (hard rule).** **✅ Jason-approved 2026-07-20 ("spec is good").**
  - **▶ REMAINING in 0.2 = apply the tokens to the RN theme** (`apps/rn/src/theme/{colors,motion}.ts`) — that's Phase-1 *build*, not design. 0.2 design is complete pending sign-off. Resolves D7 (full deliberate reset — confirmed).
- **0.3 Premium reshape finalization** — resolve `PREMIUM_RESHAPE_SPEC` D1–D7; lock the active feature set, the free/premium line, and the model (one Premium tier + Lifetime + a portfolio-subscription seam).
  - **✅ D1–D6 DECIDED (Jason 2026-07-20):** D-LINE free/premium line (free finishes the job · premium does it with you every cycle) · D-LIFE one-tier $4.99/mo + annual-seam-built-launch-gated + Lifetime ~$79–99 (2nd offer) + portfolio-sub graduation mechanic · W widget = free-glance/premium-interactive · D5 "Progress" is a first-class tab (via the IA). **Feature set + line + model LOCKED → `DEBT_PHASE0_DESIGN_SYNTHESIS` §4.** **D7 (visual-reset ambition) = the 0.2 doorway → full deliberate reset now.**
- **0.4 Structural-readiness audit** — independent + adversarial: current app vs. the bar → a prioritized gap list that sets the build order + stress-tests the portfolio-subscription assumption (strategy gap #3).
- **0.5 Native-capability pass (technology-agnostic)** — decide, per surface, RN vs. native Swift: which delight/native surfaces go SwiftUI (widget [Swift-only], Live Activities, App Intents, specific delight moments) vs. stay RN (the shared app). Each Swift piece gets an Android-parity note. Output: the tech-choice map feeding the build.
- **0.6 Accessibility design-standard** _(Jason 2026-07-20 — a11y is first-class + designed-in, not a Phase-4 checkbox)_ — the a11y standard woven through every surface + the platform-hook map. **Standard = WCAG 2.2 AA + platform a11y HIG, expressed for Debt's OWN surfaces** (Freedom's `ACCESSIBILITY.md` = a borrowed method/floor, NOT the ceiling or identity — [[feedback_sibling_app_reference_not_ceiling]]). Output: `DEBT_PHASE0_DESIGN_SYNTHESIS` §10 + the ASC Nutrition-Label targets; verified per-theme at build + a device VoiceOver/Dynamic-Type walk at the release gate.
- **GATE:** design foundation signed off. Nothing below starts until it is.

### Phase 1 — Elevate the surface
Rebuild every screen to the **new IA + visual language** (not parity). The Phase-B parity screens are elevated to the bar on the preserved foundation. Both themes, equal ([[feedback_light_mode_equal_premium]]).

**✅ 1.1 Design-system foundation (structure-first) — DONE (2026-07-20).** _Before-scan (verified vs current code): purple-collapse blast radius = ONLY `DriftCard.tsx`; all other components consume `useAppColors()` generically → re-tuning token VALUES propagates. After-scan (whole item): foundation complete (color+elevation+motion tokens · motion stack · `<Motion>`/`<CountUp>`/hooks/haptics · a11y primitives). **Carry-forwards:** `boxShadow`+`overflow:hidden` native-clip → Phase-E device-QA · Skia-web CanvasKit → 1.4 · motion runtime-verify → 1.3 first-use · ListRow/sheets adopt `elevation`/`raised` → 1.2. **▶ NEXT = 1.2 shared chrome.**_
  - **1.1.1 ✅ DONE (2026-07-20)** — retuned `theme/colors.ts` to the approved palette (cool navy-tinted grounds · single blue accent · semantic success/gold/danger) + added the **constant navy hero/beat `surface` tokens** + accent-soft + gold-pill; **removed `purple`** (repointed DriftCard→`accent.primary`); retuned `progressColor`. tsc 0; **verified both themes** on the live Plan screen (single accent applied, semantics clean, no contrast regressions). _After-scan: light cards read flat with only a hairline → confirms 1.1.2 elevation helper is the correct next step (already planned); navy `surface.hero` tokens added but unconsumed until 1.3 (expected). Nothing else surfaced._
  - **1.1.2 ✅ DONE (2026-07-20)** — `theme/elevation.ts` (cross-platform `boxShadow`; **navy-tinted on light**, value + soft shadow on dark; `card`/`raised`/`hero` levels) wired into the `Card` primitive. tsc 0; **both themes verified on the live app — light cards now float** (the parity fix), dark lifts cleanly. _After-scan: ⚠️ `boxShadow` + `overflow:'hidden'` may clip on iOS → **device-QA item (Phase E)**; sheets/FormSheet should adopt `elevation.raised` when touched (1.2). Nothing else surfaced._
  - **1.1.3 ✅ DONE (2026-07-20)** — `motion.ts` extended: `stagger` (list 40ms) + `celebration` timeline (the paid-off beat ms-offsets, DEBT_MOTION_SPEC §5) + exported. tsc 0. _After-scan: pure token additions, consumers land in 1.1.5 / 1.4; nothing surfaced._
  - **1.1.4 ✅ DONE (2026-07-20)** — installed Reanimated **4.3.1** + worklets 0.8.3 + Skia **2.6.2** + expo-haptics + expo-linear-gradient (SDK-56-pinned); `babel.config.js` with `react-native-worklets/plugin` (last). Dev server restarted (cache clear) → **app boots clean on web, 0 console errors**, tsc 0. _After-scan: Skia-web CanvasKit setup deferred to first Skia render (1.4) — install alone doesn't break web; native compile validates in the batched build (Phase E); 11 moderate transitive npm-audit warnings (non-blocking)._
  - **1.1.5 ✅ DONE (2026-07-20)** — `src/motion/`: `<Motion>` (FadeInDown entrance + delay/stagger, `ReduceMotion.System`) · `<CountUp>` (rolling number, tabular-safe, reduce-motion→final) · `useSpringValue` · `useReduceMotion` · `haptics` (web no-op) — all bound to `motion.ts`. tsc 0. _Runtime-verified at first use (1.3 Today hero); device-motion → batched build._
  - **1.1.6 ✅ DONE (2026-07-20)** — `src/utils/a11y.ts`: `headerProps` · `groupLabel` (single-utterance) · `decorative` (cross-platform hide) · `announce` (web-safe). tsc 0; app boots clean. _Consumed as-built from 1.2 on → one fix propagates._

**✅ 1.2 Shared chrome — DONE (2026-07-20).** _Before-scan (verified vs code): route-rename blast radius contained (`_layout` · `use-go-to-tab` TabName · 2× `goToTab('bills')` CTAs · `tab-bar-icon` · `theme/icons`); tab-anim trap already avoided (preserve); SF Symbols not wired (`tab-bar-icon` = MaterialIcons; `expo-symbols` now installed). **Money consolidation is structurally required for the 3-tab IA → 1.5 "Money" FOLDS INTO 1.2** (Jason 2026-07-20). Content elevation of Today/Progress stays 1.3/1.4._
  - **1.2.1 ✅ DONE (2026-07-20)** — SF-Symbol `tab-bar-icon` (expo-symbols iOS + MaterialIcons web/Android fallback) + `tabIcons` {today:`checklist` · progress:`chart.line.uptrend.xyaxis` · money:`creditcard`}. tsc 0.
  - **1.2.2 ✅ DONE (2026-07-20)** — **3-tab IA LIVE:** index→**Today** · payoff→**progress** (git-mv) · new **money** (consolidated Debts-hero/Bills/Goals segments, ported from bills+goals; those routes removed) + `use-go-to-tab` TabName + 2 `goToTab('money')` CTAs. tsc 0; **both themes verified** — tab bar reads Today·Progress·Money, Money opens on Debts, 0 page errors. Tab-nav animation still off (trap preserved). _(1.5 Money DONE here.)_
  - **1.2.3 ✅ DONE (2026-07-20)** — `Screen`/`Section` header roles already present (verified vs code); `ListRow` → **`groupLabel`** (single-utterance a11y) + `accessibilityHint` + **`cardElevation`** (rows lift like cards; propagates to every list). tsc 0. _Sheets adopt `elevation.raised` when next touched (deferred — modals, already distinct)._
  - **1.2.4 ✅ DONE (2026-07-20)** — both themes verified (tab bar Today·Progress·Money · Money segments work), 0 page errors. **✅ 1.2 (shared chrome) COMPLETE.** _After-scan: ⚠️ **Money was CONSOLIDATED (structure) but NOT ELEVATED — I ported the old parity content ("stacked boxes"); the premium visual pass is reopened as 1.5** (Jason flagged 2026-07-20; consolidated ≠ elevated, [[feedback_premium_quality_bar]]). progress.tsx still uses the old lavender payoff hero → 1.4._

**✅ 1.3 Today — DONE (2026-07-20, `e1ad5a6`).** Elevated to the premium bar. Detail → log.

**✅ 1.4 Progress — DONE (2026-07-20, `4072717`).** The journey: navy ring hero · milestones · momentum · cash-cushion timeline (+ transitional chart/strategy/order below). Detail → log.
  - **1.4.R ✅ BUILT + both-theme verified (2026-07-21) — pending Jason sign-off.** MilestonesRow: four flat chips → one connected **journey rail** — green fill sweeps 0→pct on mount, live numberless "you are here" bead rides the fill edge (ring owns the %), next post glows (accent ring), gold-star debt-free destination, single a11y utterance. Dropped the under-"Free" date (deduped with the ring hero, which already shows it). tsc 0. _After-scan: the true "just-crossed-a-milestone" celebration pulse was NOT faked here — deferred to the Phase-3 celebration system, which can hook the EXISTING `milestoneMaxProgress` + payday.ts crossing-detection (surfaced: that infra already exists → the pulse is a real, cheap Phase-3 add, see Phase 3 below). Marker `left`-percent animates fine on web; native motion → the batched device-QA carry-forward._
  - **1.4.T ✅ BUILT + both-theme web-verified (2026-07-21) — pending Jason sign-off.** TrajectoryChart re-done in **Skia** (was a flat SVG line Jason called "meh"): smooth curve + luminous area wash for body, a **blue→gold 3-stop gradient line** (holds blue, blooms to gold only near the finish — navy identity → gold freedom; green stays reserved for "paid"), GPU glow, gold "debt-free" bead + matching label, draw-on (line trims 0→1, area fades, bead blooms; Reduce Motion snaps). Platform-split canvas (`TrajectoryCanvas.web` lazy-loads CanvasKit / base renders native directly); pure `TrajectorySkiaChart` draw component. tsc 0. **🔓 UNLOCK: CanvasKit-web now works** (public/canvaskit.wasm served locally via `scripts/copy-canvaskit.mjs` on install/pre-web, gitignored; loader `locateFile`→`/canvaskit.wasm`; load-on-mount, never blocks boot) → **Skia is available for every future surface.** _After-scan: (1) this is the **FIRST Skia render on native too** — web proves layout/color only; native Skia + the draw-on motion are a **Phase-E device-QA GATE** (elevated: first native Skia, per [[feedback_native_module_verification_gap]]). (2) 8MB wasm = brief blank chart while CanvasKit loads on web (fallback View; web not primary target; nicer skeleton = later polish). (3) ghost/other-strategy line coincides with active for near-equal debts (expected). (4) captured: [[reference_skia_web_canvaskit_setup]]._

**1.5 Money elevation + scale-hardening — ▶ ACTIVE (design LOCKED w/ Jason 2026-07-21, design-first sign-off given).** Money = the CALM reference section (NOT a navy beat — beats live on Today/Progress); premium via hierarchy + restraint, not spectacle. Kill the "stacked boxes." Comp basis `DEBT_PHASE0_DESIGN_SYNTHESIS` §3.
  - **1.5.1 Debts ✅ 2026-07-21** — anchoring **$X remaining across N debts** (whole-dollar, bare + hairline, replaces the 3-cell box) · Focus debt = blue pill + blue progress (others green) · new `AddRow` (dashed) · payoff-order framing folded into the strategy desc (no redundant footer) · strategy toggle kept. New `ui/AddRow` · `ListRow.progressColor` · `utils/format.formatWhole`. Both themes verified, tsc 0. _Gotcha: a NEW `@core` export doesn't hot-reload through the `apps/rn/core` junction (Metro serves stale → runtime "not a function"); use an app-side util during UI work, or restart Metro w/ cache-clear._
  - **1.5.2 Bills ✅ DONE + signed off (Jason 2026-07-21, "I do like it").** Own virtualized `SectionList` (Option A) · **collapsible category groups** (label · count pill · per-paycheck subtotal, chevron, default-expanded) **+ search**, adaptive at ≥8 bills (flat below) · living-reserve **tappable → `/living-expenses`** (More kept) · dashed AddRow. **PACKECK-CENTRIC reshape (design worked out live w/ Jason, supersedes the first "monthly" framing):** hero anchor = **"set aside per paycheck"** (smoothed `monthlyTotal/payCyclesPerMonth`) + `≈ $X/mo` caption (dropped when paid monthly). **One-time bills = their own concern** (own "One-time" group + own hero treatment when all-one-time → shows the one-time sum, **never "$0/mo"** — dissolves the edge, not patches it). **Skia allocation micro-viz in the hero** (`components/money/AllocationBar{Chart,Canvas,Canvas.web}` — platform-split like the ring): one **tonal single-hue** bar (opacity ramp, NOT rainbow — honors single-accent language), category-share segments w/ hairline gaps, quiet left→right **draw-on** (Reanimated), **static number + no haptic** (calm data-viz, NOT a beat). **Hero tap → "Where it goes" breakdown sheet** (`BillBreakdownSheet`) itemizing each bill's smoothed per-check share, categories sorted desc, **lumpy (non-monthly) bills tinted accent** = the "$1,680/yr is quietly $65/check" insight; one-time footer note. tsc 0, 0 console errors; math proven ($1,156/paycheck ≈ $2,504/mo; auto-ins $64.62 · parking $50 tinted). _After-scan: (1) FIRST Skia render on Money → native Skia + draw-on = **Phase-E device-QA gate** ([[feedback_native_module_verification_gap]]). (2) **Evolved the locked "bare-number, static" hero → "bare number + calm allocation micro-viz"** — could become the Money-hero language (Debts/Goals heroes are still bare; coherence follow-on, see sequence). (3) web draw-on starts late (8MB CanvasKit lazy-load) → brief partial bar on first web load, cosmetic; native has no wasm delay. (4) Nested-VList trap avoided (hero/search pinned outside the list)._
  - **1.5.3 Goals ✅ DONE 2026-07-21** — `MoneyHero` (bare **saved** whole-$ + "of $target" sub + "N% funded" caption + a **slim green overall progress bar** — plain View, NOT Skia; calm reference stat) replaces the old 3-cell summary card · rows kept (per-goal progress + Funded pill, already refined) tightened into a `gap:sm` list · **dashed AddRow** replaces the solid button. Page-scroll (small list — no virtualization). Both themes verified, tsc 0, 0 console errors. Removed dead `SummaryCell` + `Button` import. _After-scan: goal row `meta` duplicates the title when a goal is named like its type ("Emergency fund"/"Emergency fund") → minor polish (omit meta when it equals title, or show a target-date) — filed deferred. `HeroProgressBar` is now a reusable primitive → a candidate for the Debts-hero coherence follow-on (overall debt-paydown micro-viz)._
  - **1.5.4 Today Required Actions scale ✅ DONE + signed off (Jason 2026-07-21).** Design worked out live w/ Jason (both recs approved): **capped urgency buckets** inside `RequiredActionsCard` (NOT literal weekly buckets, NOT its own list — avoids nested-VList): **Overdue + Due this week OPEN · Due next week · Later this cycle · Handled COLLAPSED** (each collapsed header shows count + total). Buckets derive from `bucketRequiredRows(rows, currentDate, paidThisVisit)` by days-until-due (<7 / <14 / ≥14); **adapts to cycle length automatically** (weekly payer → all "this week", later buckets empty→filtered). Single-`thisWeek` case renders flat (no headers). **Mark-paid = settle-on-re-entry (rec approved):** a `paidThisVisit` set pins a just-checked row struck-through IN PLACE (never vanishes/jumps); `useFocusEffect` clears it on re-entry so paid items tidy into Handled next visit. Preserves the 1.3 CheckCircle strike-through + undo untouched (money-critical path unchanged). New: `bucketRequiredRows`/`requiredRowKey`/`rowHandledNow` in planSelectors; `RequiredActionsCard` rewritten (bucket blocks); `currentDate` prop from Today. Verified in both themes (this-week/next-week/later/handled render + collapse/expand + mark-paid-in-place), tsc 0, 0 console errors. _After-scan: (1) paid rows sink to the bottom of their bucket (allocation drops→paidRows appends; pre-existing 1.3 sink behavior, now bucket-local — acceptable). (2) Overdue-carried + past-due-autopay-presumed-paid→Handled routing is correct by logic but my seed didn't exercise real overdue/presumed rows → **device/real-data eyeball** at Phase-E QA. (3) focus reset also resets bucket expand-state to defaults each visit (clean/predictable; keep)._
  - **1.5.5 (was) Virtualization** — **RESOLVED: architecture = Option A (per-section virtualized `SectionList`, pinned header), Jason-agreed w/ checkpoints 2026-07-21.** `Debts` + `Bills` each own their scroll (Screen `scroll={false}` for them; hero/strategy/search pinned above the list); `Goals` stays the page ScrollView (genuinely small). **Debts-heavy user (student loans 8–16 accts, BNPL ×5–10, medical) → Debts MUST virtualize too** (Jason's catch — not gold-plating). **1.5.1a Debts→A ✅ 2026-07-21** — pinned hero+strategy + scrolling SectionList (active + PAID-OFF sections); verified small (identical to the ScrollView version → **D not needed**) + large (21 debts: header pins, list scrolls). Process: restructure calls go to the table, not decided solo ([[feedback_surface_restructure_decisions]]).
  - **1.5.6 ✅ done incrementally** — both-theme verify + tsc satisfied per sub-item as built (Debts · Bills · Goals · Today buckets all screenshot-verified both themes, tsc 0 throughout). **→ 1.5 Money COMPLETE (pending 1.5.2/1.5.4 sign-offs).**
  - _Locked treatments (Jason): hero = bare big number + hairline, **calm/static (NO count-up** — the reference section stays still; count-up is the Today/Progress beat) · dashed add-row replaces the solid button · Focus-debt = light touch. **NEW app-wide rule: large list → collapsible GROUPS (category when managing · urgency when acting) + virtualization; NEVER pagination/load-more/inline-expand walls** (mobile idiom, not web)._
  - _Sequence: **Phase-1 surfaces ✅ — Today (Allocation Hero) · Progress (Skia ring + trajectory[+vs-minimums+axes] + crafted cushion bars = screen COMPLETE) · demo-data overhaul** (all 2026-07-21; detail → `DEBT_TODAY/PROGRESS_ELEVATION_AUDIT` + commits `b9defea`→`e19b008`) → **1.5 Money ✅ COMPLETE: 1.5.1 Debts · 1.5.1a virtualize · 1.5.2 Bills (signed off) · 1.5.3 Goals · 1.5.4 Today buckets ✅ (signed off) · 1.5.6 verify** → 1.6 More ✅ → **✅ PHASE 1 COMPLETE. ▶ NEXT = PHASE 2 Premium substance + revenue (DECIDED — Jason 2026-07-21: delight before substance is backwards; the plan itself frames Phase 3 as "built WITH the features", so premium features come first, then their delight beats).** Coherence decision RESOLVED: **Debts hero stays BARE** (Jason — its remaining-figure + payoff-order list is its visual; an overall-paydown bar would duplicate the Progress ring). Deferred → Phase 3: trajectory interactive layer · milestone-cross pulse · tappable ring · iPad. Coherence follow-on: Debts/Goals heroes are bare — decide whether the "calm micro-viz" Money-hero language extends to them (Goals already has per-goal progress). Sign-off pending: on-ring journey (then delete dead `ProgressRing`/`MilestonesRow`)._

  - **1.6 More ✅ DONE 2026-07-21** — before-scan verdict: the hub was ALREADY largely at the bar (`SettingGroup`/`SettingRow` ride the elevated `Card`; B.8 built it design-first) → the pre-authored "refine chrome" premise was mostly stale ([[feedback_verify_preauthored_audit_accuracy]]). Proportionate elevation (agreed w/ Jason): **the trust moment** — the flat About "your data stays on this device" row promoted to a deliberate `TrustCard` at the TOP of More ("Private by design · … never sell you more debt", shield icon) so the **moat is felt, not buried** (the "trust is visible" bar dim) + removed the now-redundant About row + light consistency. Both themes verified, tsc 0, 0 console errors. _After-scan: nothing further surfaced; intentionally light-touch ([[feedback_less_is_more_premium]])._

**✅ PHASE 1 — ELEVATE THE SURFACE — COMPLETE (2026-07-21).** Every surface elevated to the bar in both themes: Today · Progress · Debts · Bills · Goals · More. **Whole-phase after-scan ([[feedback_phase_level_after_scan]]):**
- **[COHERENCE — decision] Hero-language gap:** Money heroes diverge — Bills (Skia allocation bar + tap) · Goals (progress bar) · **Debts (bare)**. Decide whether the calm-micro-viz hero language extends to Debts (e.g. an overall debt-paydown bar via the reusable `HeroProgressBar`) or Debts stays deliberately bare. → a quick Phase-1 coherence polish or fold into the next Debts touch.
- **[COHERENCE] Entrance-motion inconsistency:** `<Motion>` FadeInDown stagger runs ONLY on Today; Progress/Money/More have none. Folds into the **Phase-3 entrance-animation revisit** (Jason flagged) — which must decide APPLY-consistently-or-DROP across all elevated screens, not just retune Today.
- **[GOOD] Trust through-line:** Today's "Private · on your device" (1.3.3) + More's new `TrustCard` state the same moat consistently — keep.
- **[LEDGER] Phase-E device-QA carry-forwards (consolidated):** `boxShadow`+`overflow:hidden` native clip · FIRST native Skia on 3 surfaces (Progress ring · trajectory · Bills allocation bar) + their draw-on motion · CanvasKit-native · `<Motion>`/`<CountUp>` native runtime · Today buckets vs REAL overdue-carried + past-due-autopay-presumed rows.
- **[DEAD CODE] `ProgressRing`/`MilestonesRow`** parked pending the on-ring-journey sign-off → delete when signed off.
- **[RETRO-LESSON] "match motion to surface job"** ([[feedback_match_motion_to_surface_job]]) holds phase-wide, zero violations — no rework.

### Phase 2 — Premium substance + revenue spine
Build the reshaped Premium. **▶ ACTIVE. 🔑 CANONICAL STRATEGY = `DEBT_PREMIUM_STRATEGY_2026-07-21.md`** (audit teardowns → `DEBT_PREMIUM_RESHAPE_AUDIT_2026-07-21.md`). The Phase-0 4-pillar sort was **SUPERSEDED** by a 4-adversarial-audit reshape + a moat/privacy/tiering exploration (Jason 2026-07-21) — "maybe scrap premium" → a coherent 4-tier ladder.
- **Premium IDENTITY = automation** ("the app does the manual work, you confirm" — EFFORT not intelligence; free is already a companion, not a calculator). **Headline = Payday Cushion Guardian** ("am I going to make it THIS paycheck" — proactive shortfall-rescue + surplus, on existing `buildSmartInsights`; un-chattable; the churn answer). **⚠️ HARD build requirement: frame as tight-cycle RISK + safe move, user-correctable buffer — NEVER a false-precise $ verdict (it runs on a projection; a wrong scary alarm churns a stressed user).**
- **MOAT = on-device by default, E2EE the floor** (deliberate evidence-gated eng, NOT purity vow; any server = E2EE-by-construction on Apple's stack [iCloud ADP/CloudKit, keys in user Keychain], we never read plaintext). **4-TIER LADDER: (1) Free on-device front-door · (2) Premium ~$4.99 = automation, on-device/E2EE [THIS phase] · (3) Premium Connected +$5 = opt-in Plaid, tradeoffs TRANSPARENTLY DISCLOSED, isolated backend, never a dependency [~v1.8] · (4) Ava/AI coach = grounded+persistent+actionable, inverts the un-chattable test [future/cross-portfolio; the reserved net-worth/Ava tier].**
- **2.1 One-tier foundation ✅ DONE 2026-07-21.** `SubscriptionPlan = 'free' | 'premium'` (removed `premium_plus`); new **`src/subscription/`** — `features.ts` (`PremiumFeature` set: payday_partner·momentum·drift·auto_adjust·custom_share·interactive_widget·icloud_backup·unlimited_history) · `hasFeatureAccess(plan,feature)` (one-tier: premium unlocks all; pure, moves to `@core` at 2.7) · `useHasFeature`/`useIsPremium` hooks (reactive). Stale Premium+ comments updated (DriftCard·payoffSelectors). **Dev override = a `__DEV__`-only "Simulate Premium" toggle in More** (flips `subscriptionPlan`), so features gate visibly as built. tsc 0, 0 console errors. _Before-scan finding: the real gating (`hasFeatureAccess`/`features`) was never ported to RN — it lived only in the Capacitor `@/lib/subscription` (still 3-tier, untouched, dies Phase 5.5); RN had state but no gating. After-scan: gating is app-side for now → migrate to `@core` for the portfolio-sub entitlement at 2.7; no RN unit test yet (Phase-4 harness)._
- **2.2 Free-tier completion — ✅ COMPLETE (2026-07-22).** Built What-If (2.2.2) · Amortization (2.2.4) · History elevation (2.2.6), all web-verified both themes, tsc/eslint green; **scrapped Forecast (2.2.3) + Smart Insights (2.2.5)** as redundant/weak (kept the free tier lean, not padded). **▶ next Phase-2 build = 2.3 projection auto-maintenance.** _Original scope (design LOCKED w/ Jason 2026-07-22):_ surface the now-FREE modules so "free finishes the job." Engines exist in `packages/core`; only history has an RN surface — the other four live only in the dead Capacitor `SnowballSection.tsx`, never ported. **Design locked:** (i) free/premium line = **pull vs push** — free = full readouts you open/inspect; premium Guardian (2.4) = the proactive/scheduled/monitored layer on top (resolves Forecast↔Guardian + Insights↔Guardian with one principle, coherent w/ the automation identity); (ii) **IA placement** — What-If → Progress (paired w/ the trajectory chart) · Forecast → Progress (into/adjacent the Cash-Flow `[Cushion|Timeline]`) · Amortization → Money›Debts drill-in ("View Schedule") · Smart Insights → Today (calm strip below Required Actions) · History → keep its own destination, uncapped + light elevation; (iii) **altitude** — build to the NEW elevated visual/motion/Skia language, faithful feature scope (no new capabilities). Sub-steps:
  - [x] **2.2.1 ✅ (2026-07-22)** — `src/store/analysisSelectors.ts`: pure `@core`-only selectors (`selectWhatIf`, `selectForecast`, `selectSmartInsights`, `selectStrategyComparison`, `selectDebtAmortization`/`selectFocusAmortization`) ported from old `SnowballSection`'s inline derivation. Foundation for 2.2.2–2.2.5. tsc 0.
  - [x] **2.2.2 What-If ✅ DONE + web-verified both themes (2026-07-22).** Long collaborative design pass (separate box → folded into the trajectory card → **slider** not text box → editable "+$X/mo" w/ adaptive max → **collapsed by default** behind "What if you paid extra?" → outcome moved onto the chart). Final: dashed-green "with extra" overlay curve on the Skia trajectory; a **uniform 3-row legend/comparison table** — each line named + its payoff date, **data color = its line** (gray minimums · **blue** plan · green extra), plan/extra add "$X, N months saved/sooner", dates reconcile with the savings; **gold reserved for the debt-free moment** (endpoint bead + hero) only. New: `src/components/ui/Slider.tsx` (gesture-handler + `GestureHandlerRootView` added at root — gestures now enabled app-wide) · `WhatIfControls.tsx`. **⚠️ device-QA owed** (slider drag + gesture-vs-ScrollView arbitration — web can't verify → Phase-6 ledger). Interactive on-touch chart scrubbing → Phase 3 (captured there). **After-scan:** (1) **gold-usage app-wide coherence** — the build formalized "gold = the debt-free MOMENT only (endpoint bead + hero), never arbitrary text" → sweep Today/Money/More for gold-as-text that isn't a debt-free moment (fold into the Phase-1 whole-phase coherence pass). (2) `selectForecast` (built 2.2.1) may become **dead code** if 2.2.3 Forecast is dropped per its before-scan → remove/repurpose for "upcoming relief" on that call. (3) `Slider` = new reusable `ui/` primitive (first gesture surface). (4) legend mini-table **a11y** — group the 3 rows into one comparison utterance (minor polish, deferred).
  - [x] **2.2.3 Forecast — ✅ RESOLVED, NO BUILD (Jason 2026-07-22).** Before-scan verdict: the shipped Cash-Flow **"Cushion"** view (`selectCashTimeline` — per-pay-cycle ending balance + stable/tight/pressure, built Phase 1) already delivers the free forecast job at a higher bar than the old monthly `projectForecast` → a separate module would duplicate it. `selectForecast` removed (dead). "Upcoming relief" (projectForecast's one distinct bit) routed → Smart Insights (2.2.5 near-payoff readout) + Phase-3 trajectory waypoints (visual) + premium Guardian (2.4 surplus action). Progress stays clean — no second cushion surface.
  - [x] **2.2.4 Amortization drill-in ✅ DONE + Jason-validated live (2026-07-22).** Any debt → its sheet → a blue **"View Payoff Schedule"** action in the FormSheet **sticky header** (Jason's call — always visible, near Close, zero real estate; not a hidden scroll row) → `AmortizationSheet` (modeled on `BillBreakdownSheet`): summary (debt-free date · N month(s) · total interest) · assumption line ("Paying $X/mo — minimum + your extra" on the focus debt, "the minimum" otherwise) · month-by-month table (date · interest · principal · ending balance) · negative-amortization "never pays off" empty state. `selectDebtAmortization` enriched → `DebtAmortization` (debt·schedule·monthlyPayment·isFocus·startDate). Numbers reconcile (Store Card $180 @ focus $322.50/mo → 1 month · $3.45 · $0). tsc/eslint 0. **After-scan:** (1) `FormSheet` gained a reusable **`headerAction`** prop (any entity sheet can now add a header action). (2) summary interest switched `formatWhole`→`formatCurrency` (precise cents, matches the rows). (3) schedule reads SAVED debt values, not unsaved form edits (acceptable; note). (4) `ScrollView` renders all rows — fine for realistic schedules, virtualize if ever needed (defer). (5) **testing gap:** Playwright can't drive Money `SectionList` row taps (real taps work) → note for the Phase-4 RN test harness.
  - [x] **2.2.5 Smart Insights — ✅ SCRAPPED, NO BUILD (Jason 2026-07-22: "the weakest of the previous premium effort… just smart text, not even intelligence smart").** Most of `buildSmartInsights` duplicates Today (cushion status → hero; safe-extra → Recommended Actions) and the reshape audit demoted it as LLM-commodity. Its one additive nugget (near-payoff "upcoming relief") is delivered by the premium Cushion Guardian (2.4, the real stateful version) + Phase-3 trajectory waypoints. `selectSmartInsights` + `selectStrategyComparison` removed (dead). A weak free strip would only blur the free/premium line + dilute the bar.
  - [x] **2.2.6 History ✅ DONE + both-theme verified (2026-07-22).** Confirmed uncapped (`selectHistoryRows` returns all cycles — correct for the reshaped generous-free history; the stale Premium-cap code comment fixed) + reachable (More hub). Light elevation = a calm green **summary anchor** ("$1,740 paid down across 6 cycles" via new `selectHistorySummary`, reconciles with the rows), replacing the plain intro; cards unchanged; falls back to the intro line when <2 cycles. Calm reference surface — no beats/count-up.
  - [x] **2.2.7 Verify ✅** — each built surface (What-If · Amortization · History) web-verified in BOTH themes as it landed; tsc + eslint green throughout; Amortization also validated live by Jason. (Two of the six planned modules — Forecast + Smart Insights — were **scrapped**, not built.)
  - **Exit ✅ MET:** the free-tier surfaces live in RN on the new visual language, both themes verified, tsc/lint green; redundant/weak modules cut instead of built.
  - **🔍 2.2 whole-sub-phase after-scan (2026-07-22):** **Coherence GOOD** — the 3 built surfaces (Progress/Money/More) hold one color system (green=progress/savings · blue=plan/interactive · gold=debt-free-moment-only) and the free/premium pull-vs-push line held (no stepping on the premium Guardian). **NEW pattern → Phase 4:** the web-e2e harness (Playwright + RN-web) has real gaps — slider gestures, Money `SectionList` row taps, and stacked modals all resist synthetic clicks (real taps work; the **deep-link route** is the reliable screenshot path). **Retroactive lesson:** 2/6 planned sub-items scrapped ⇒ the Phase-0 free-tier list was padded — verify pre-authored feature lists vs the CURRENT app before building. **Carry-forward (all captured):** slider drag device-QA → Phase 6 · interactive chart dates + What-If full-impact explorer + history per-cycle drilldown → Phase 3 / v1.8+ · **gold-usage app-wide sweep → STILL OWED** (do in a Phase-2/3 coherence polish) · legend mini-table a11y → deferred.
- **2.3 Projection auto-maintenance** — "always-current balances, no typing." **Design LOCKED w/ Jason 2026-07-22** (design-first full talk-through). **Reframe found at switch-in:** balances ALREADY silently advance at rollover (`applyRolloverPayment` assumes the minimum paid + accrues modeled interest, no label/confirm) = the exact "estimate-as-synced-fact" anti-pattern → 2.3 is partly *retrofitting honesty* onto that, not purely additive. **Locked model (Option A):**
  - Stored `balance` = the **last-verified anchor** (+ new `lastVerifiedDate`); moves ONLY on confirm/correct — never silently. The **projected** balance (anchor → today via the existing per-cycle projection) is the live operative number everywhere (trajectory/drift/allocation), labeled "estimated · verified {date}."
  - **Payday Autopilot = the re-anchor point:** a decay-gated, batched "do these still look right?" step (confirm-all / correct-one) folded into the existing payday flow; the old silent rollover-rewrite becomes a *confirm*. Only surfaces stale debts; freshly-verified never nags.
  - **Payoff = two-beat, verified $0 gates the permanent record:** estimate crossing $0 → immediate *provisional* celebratory invitation ("Looks like you crushed it — confirm to make it official") + pending state; on confirm → full ceremony + permanent "debt-vanquished" archive entry. Never celebrate projected-done. (Full Skia spectacle = Phase 3, now HARD-required to fire only on confirmed $0.)
  - **Free/premium line:** honesty is FREE (honest "updated {date}" label + manual update anytime); the **automation is premium** (continuous daily projection + the payday verify-loop + later scan-to-prefill). Free never ships a stale unlabeled number. [[feedback_no_paywall_basic_functionality]]
  - **Sub-steps (structure-first):**
    - [ ] **2.3.1** data model + migration — add `lastVerifiedDate` to `Debt`; `balance` reinterpreted as the verified anchor (write-trigger moves from silent rollover → user confirm); schema migration defaults existing debts. `packages/core/storage`.
    - [ ] **2.3.2** core projection logic — pure `projectCurrentBalance` (anchor→today via per-cycle `applyDebtPaymentProjection`/`applyRolloverPayment`) + `computeEstimateConfidence` (decay → the payday-prompt gate) + projected-payoff detection; reconciliation-tested (Debt core pattern).
    - [ ] **2.3.3** store layer — selector: debts w/ projected balance + verified date + confidence (evolves `getDebtsWithDisplayBalances`); actions `verifyDebtBalance`/`verifyAllBalances`/manual-update (set anchor + date); premium-gate the projection (`useHasFeature`), free = honest label + manual update; route surface reads through the projected selector.
    - [ ] **2.3.4** display layer — "estimated · verified {date}" (premium) / "updated {date}" (free) label + manual-update affordance on debt rows + debt sheet; new elevated visual language; both themes.
    - [x] **2.3.5 ✅ DONE + web-verified both themes (2026-07-22).** Part 1 (two-date split): `projectCurrentBalance` anchors on `balanceAsOfDate`; migration v3→v4; store verify/add/edit stamp both dates; `applyRollover` stamps `balanceAsOfDate=nextPaycheckDate` only → double-count fixed; reconciliation test added, core suite green. Part 2 (verify card): payday-sheet main review shows "Estimated balances · N haven't been checked in a while" (premium+stale only) → one-tap "These look right" (`verifyDebtBalances`→re-anchor) → "✓ Balances confirmed"; "Update" → a "Check your balances" sub-screen (each debt pre-filled to its rounded estimate, type to correct). Verified via a seeded non-demo premium payday, both themes, 0 console errors. **After-scan:** (i) rollover's `balanceAsOfDate` stamp is app-side (`store/payday.ts`) → not unit-tested → Phase-4 harness; (ii) card placement (after required, before extras) → judge in the 2.3.7 streamline review. **Original spec — (a) Two-date split:** new `balanceAsOfDate` (projection anchor — advances at rollover AND user verify) vs `lastVerifiedDate` (last USER confirmation — drives staleness + the "verified {date}" display, NEVER set by rollover). Fixes the latent double-count where rollover moved `balance` but not the anchor date (projection re-applied the paydown). `projectCurrentBalance` now projects from `balanceAsOfDate`; `computeEstimateConfidence`/display stay on `lastVerifiedDate`. Migration v3→v4 backfills `balanceAsOfDate ??= lastVerifiedDate`. **(b)** `applyRollover` stamps `balanceAsOfDate = nextPaycheckDate` on rolled debts (the fix). **(c) Verify card (Option A):** a stale-balances card in the payday sheet's main review (premium + stale only), reusing the required-card + Adjust-subscreen pattern — one-tap "These look right" → `verifyDebtBalances`(stale→estimate, today); "Update →" sub-screen to correct individual. Verify via a seeded non-demo state (payday is disabled in Demo Mode).
    - [x] **2.3.6 ✅ DONE + web-verified both themes (2026-07-22).** Design Q's resolved w/ Jason: **(1) rollover/marked-payment $0 = CONFIRMED** (marking the final payment IS the confirmation — celebrate directly, no redundant tap); the provisional invitation is specifically the premium **projected**-$0 (anchor still >0, estimate reached $0 on its own). **(2) Invitation on Today.** Built: `selectProvisionalPayoffs` (`isDebtProjectedPaidOff`, premium-only) → `PayoffInvitationCard` on Today — gold border + gold check (debt-free-moment color), "Looks like you crushed {name}!", celebratory-but-PENDING; "Confirm — it's paid off" → `verifyDebtBalance(id, 0, today)` re-anchors to $0 (the confirmed signal the Phase-3 spectacle + 2.8 archive hang off; card clears); "Not yet — update the balance" → Money. Free never sees it (no projection → $0 only via a user action = confirmed). Verified: card renders + confirm clears it, both themes, light=dark parity, 0 console errors, tsc clean. **After-scan:** (i) Phase-3 celebration spectacle + the debts-vanquished archive (2.8) hook the `verifyDebtBalance→0` confirmed signal — wiring point noted. (ii) strict autopay-presumed-rollover-$0 is treated as confirmed (matches "marking = confirmation"); revisit only if it matters → 2.3.7. (iii) "Not yet" goes to the Money tab, not the specific debt sheet → deep-link candidate for the 2.3.7 streamline.
    - [~] **2.3.7 streamline once-over — IN PROGRESS (2026-07-22).** Cross-surface review of the three verify surfaces (debt-sheet · payday batch · payoff confirm). **Verdict: already coherent** (one pattern, consistent "estimated · verified {date}" labels). **#1 ✅ DONE:** debt-sheet action **"Use estimate" → "Apply Estimate to Plan"** (Jason's copy; matches the warm voice; verified). **#3/#4 split out** → Payday-flow backlog (below). **#2 ✅ RESOLVED via Jason's idea — one-tap in-place verify.** A stale premium estimate's caption becomes **"estimated · tap to verify"** in the interactive blue (was amber "verify soon"); tapping it accepts the estimate as the verified balance (`verifyDebtBalance(id, estimate, today)` → re-anchors both dates, caption flips to "verified"). `ListRow.onCaptionPress` (tap on the caption `Text`, `stopPropagation` so the row-tap still opens the edit sheet for corrections; button role native-only to avoid a web nested-`<button>`). Simpler + more discoverable than the batch-sheet approach (dropped) — the row literally says what to do. Verified both themes, tap re-anchors, 0 console errors. **"Un-verify" capability — DECIDED: NO (Jason agreed 2026-07-22).** Three distinct things: *verify* (accept — have it) · *correct* (re-verify with a different number in the sheet — have it) · *un-verify* (make a known number "estimated" again — serves no real goal, and isn't cleanly implementable as a true revert since `verifyDebtBalance` overwrites the anchor with no stored history). The accidental-one-tap concern is low-harm (re-anchors to ~the on-screen number) + always correctable via the sheet, so it doesn't break the app's undo-diligence. Belt-and-suspenders option if ever wanted: a transient in-place "verified ✓ · undo" (holds prior {balance, dates}) matching the mark-paid undo pattern — NOT a persistent capability.
    - [x] **2.3.8 ✅ DONE (2026-07-22).** Full-surface verify: tsc clean · **eslint clean (RN tree + core, 0 errors/0 warnings)** · core regression green · Bills smoke (the one behavior-risk refactor) passes, 0 console errors; all 2.3 surfaces web-verified both themes throughout. **Lint cleanup (Jason: "don't let them accumulate"):** root cause = the RN app inherits the repo's **Next.js** eslint config, whose React Compiler rules misfire on React Native (Reanimated shared values are mutable by design; the RN/Metro build doesn't run React Compiler). Fixes: (a) removed 2 redundant `useMemo`s in `money.tsx` (the compiler-recommended fix for "memoization could not be preserved"); (b) **scoped `apps/rn` eslint override** — `react-hooks/immutability`·`set-state-in-effect`·`refs` off for RN (target an optimizer that isn't active + idiomatic RN patterns), `no-unused-vars` honors `_`-prefix; (c) fixed 2 genuine unused vars (`DriftCard` dead `c` prop · `SegmentedToggle` unused import) + removed 1 now-redundant `eslint-disable`. **Proper fix filed → Phase 5.5** (apps/rn adopts `eslint-config-expo`). **2.3 whole-item after-scan:** feature holds the premium bar (elevated existing capability, ~zero new real estate — Jason's read); carry-forwards all captured (device-QA ledger: slider drag/gesture-arbitration, native Skia, boxShadow clip · Phase-3: interactive chart, entrance-motion revisit, celebration spectacle hooks the confirmed-payoff signal · Payday-flow backlog: two-step + visual elevation · Phase-4: RN test harness incl. app-side rollover `balanceAsOfDate` stamp).
  - **Exit:** premium sees continuously-projected always-current balances, honestly labeled + anchored by the decay-gated payday verify-loop; free sees honestly-labeled as-of-last-update + manual update; payoff fires only on confirmed $0; both themes verified, core math reconciliation-tested, tsc/lint green.
  - **[DISCUSSION] Premium reshape v2 ✅ RESOLVED (2026-07-22)** — Jason's `PREMIUM_TIER_STRATEGY`/`PREMIUM_VISION_PROPOSAL` brainstorm audited into `DEBT_PREMIUM_STRATEGY_2026-07-21.md` §"Premium Vision + Line Audit" (guiding principle: removing a premium feature must remove WORK, not just info; Explain-recs + confidence-ranges → free; Hidden-Cash/Sub-Watch/Bill-Drift-auto → Plaid tier; Opportunity-Engine → cut; motivation → retention not the premium line). No v1.7 scope change — the 2.4+ order stands.
  - **Deferred (backlog):** demo-able Payday Autopilot — it's disabled in Demo Mode (a stale demo payday would pop the sheet), so our flagship loop can't be shown in the demo/marketing; a demo-safe payday walkthrough is a later candidate.
  - **Payday-flow follow-ons (from the 2.3.7 scan, split out — Payday UX, not verify-coherence):** (#3) the two-step **capture-in-sheet → separate "Start Next Pay Cycle" on Today** — decide if it should read as one flow. (#4) **payday-sheet visual elevation** — it's a faithful v1.6 port that never got the Phase-1 elevation pass, yet it's the central premium loop → hold it to the premium bar. Both real; sequence as their own Payday-flow items.
  - **Switch-in before-scan deferrals (filed now):** (1) `DriftBaseline` ALSO holds an anchor → unify the verify-anchor with the drift/Guardian anchor at **2.4** (Guardian absorbs Drift). (2) scan-to-prefill (**2.7**) = the natural "correct" path → seam noted there. (3) confidence-decay threshold tuning needs real-use validation → **Phase 6** (real-device/real-use). (4) `applyRolloverPayment` TODO "make the recommendation interest-aware" (few-$ interest residual at display-$0) intersects projection accuracy → fold into 2.3.2 if cheap, else note there.
  - **2.3.1 ✅ (2026-07-22):** `lastVerifiedDate?: string` on `@core` `Debt` (the anchor); store `CURRENT_STORE_VERSION` 2→3; `runMigrations` backfills existing debts to the app's current date (upgrade starts at zero drift, not an alarming jump); demo debts stamped. tsc 0.
  - **2.3.4 ✅ BUILT + web-verified both themes both tiers (2026-07-22).** `ListRow` gained an optional second `caption` line (+ `captionColor`); `DebtRow` shows `~$X` + `buildEstimateCaption` (premium: "estimated · verified {date}" fresh/aging · "estimated · verify soon" stale=amber `accent.warning`; free: "updated {date}"); Money hero sums projected balances (premium) so it reconciles with the rows; `DebtSheet` shows "Estimated $X today · verified {date}" + a **Use estimate** action (fills the field → Save re-anchors; NEVER silent pre-fill) / free "Updated {date}". Demo debts back-dated (8/38/52 days) to showcase fresh/aging/stale. tsc 0, 0 console errors. Verified: premium $11,406 hero reconciles w/ ~rows both themes; free $11,580 anchor-sum + "updated"; light=dark parity. **After-scan:** (a) **cents on an estimate = false precision → FIXED (Jason-agreed):** estimated balances use `formatWhole` (whole-$ under the `~`, e.g. `~$2,402`); verified/free keep cents. **+ layout-robustness fix (Jason flagged on iPad):** the sheet's "Use estimate" was pinned right via `space-between` and clipped behind the scroll bar on wide widths → restacked left-aligned ("Use estimate →"). (b) `buildEstimateCaption` + ListRow `caption` now reusable if Today/Progress ever surface a balance. (c) **iPad/responsive:** the specific clip was a 2.3.4 component gap (fixed now); genuinely-native iPad re-layout stays a captured **Phase 3** pass + **Phase 6** device-QA gate — the app is deliberately phone-first until then.
  - **2.3.4 design LOCKED (Jason 2026-07-22):** calm/quiet (Money = reference surface, no beats). **Row:** estimated balance gets a `~` prefix + a quiet second caption line — premium "estimated · verified {date}", free "updated {date}", verified-today reads "verified". **Money hero total uses the projected sum** (so rows + hero reconcile). **Debt sheet:** balance field labelled est./verified + a **Verify** affordance (one-tap "Yes, that's right" → re-anchor to today, zero typing · "Enter actual balance" → correct + re-anchor). **Stale (45d+):** caption shifts tone ("verify soon"), NO alarm/badge — the real re-verify moment is the Payday Autopilot step (2.3.5). Needs a small `ListRow` second-caption extension.
  - **2.3.3 ✅ (2026-07-22):** store plumbing (no UI). `store/balanceSelectors.ts` — `selectDebtBalanceView(s)` (premium = projected-to-today; free = anchor; `isEstimate`/`confidence`/`lastVerifiedDate` for the label) + `selectStaleDebtIds` (payday-prompt gate). Store actions `verifyDebtBalance`/`verifyDebtBalances` (the ONLY deliberate `balance` movers); `addDebt` stamps `lastVerifiedDate`, `updateDebt` stamps it on a balance edit (editing a balance = verifying it). New `always_current_balances` premium key. tsc 0. **After-scan / flags:** (a) **[DECISION RESOLVED 2026-07-22, Jason] engine→projection routing split by consumer** — DISPLAY aggregations (row balances + Money hero total) use projected NOW (2.3.4, keeps 2.3 internally coherent); the COMPUTED engine (allocation / debt-free date / trajectory / drift) routes off projected **AT 2.4 as the Cushion Guardian's foundation** (its real consumer — shortfall on a stale anchor would be wrong), with reconciliation tests. Firmly in v1.7 — not "later once proven." Accepted consequence: once routed (2.4), the debt-free date ticks as interest accrues on idle days (honest = the cost of delay). (b) `verifyDebtBalance` deliberately does NOT re-baseline drift — a balance correction should SHOW as drift, not reset it. (c) `PremiumFeature` version-comments are pre-reshape → full reconciliation at 2.10.
  - **2.3.2 ✅ (2026-07-22):** `packages/core/debt/projectCurrentBalance.ts` — `projectCurrentBalance` (anchor→today: whole-month `applyDebtPaymentProjection` steps + prorated partial-month interest; month-stepped = display family, not per-cycle rollover) · `isDebtProjectedPaidOff` (payoff-gate trigger) · `computeEstimateConfidence` (days-since-verified → fresh/aging/stale; `ESTIMATE_STALE_DAYS=45` gates the payday prompt, tunable → Phase 6). Reconciliation-tested (`testProjectCurrentBalance.ts`, wired into the runner); full suite green. **After-scan:** (a) projection assumes **minimum-only** (conservative — over-states a focus debt getting extra, never understates); feeding ACTUAL marked payments per elapsed cycle = a future accuracy refinement (needs per-cycle history) → **defer (Phase 3 / accuracy polish)**. (b) projection vs `getDebtsWithDisplayBalances` composition (double-count of this-cycle's marked minimum) MUST be resolved in **2.3.3** (the store selector owns how anchor-projection + in-cycle display compose).
- **2.4 Payday Cushion Guardian ▶ ACTIVE** — the marketed headline (risk-framed, never a false-precise $); gated `cushion_guardian`; absorbs Drift (→trigger) + Smart-Insights (→intervention). Decomposed:
  - [x] **2.4.1 Foundation — engine off the projected balance ✅ DONE (2026-07-22).** Core `projectDebtsToDate` (maps debts → projected-to-today, re-stamps `balanceAsOfDate` for idempotence, preserves `lastVerifiedDate`) + app `withProjectedBalances(store, isPremium)` boundary wrap (premium projects · free = strict no-op). Wired the forward-looking surfaces — **Today** (allocation/plan/required/summary) + **Progress** (payoff view = debt-free date + trajectory · what-if · cash-cushion timeline). Backward-looking "% paid" stays on raw/confirmed; **Money left on the raw anchor** (management surface — rows must edit the real anchor, already shows per-debt projected via `selectDebtBalanceView`); write-side (payday capture, drift-baseline freeze) stays on the anchor. Reconciliation-tested (map/idempotence/preserve · paydown-vs-neg-am direction · trajectory starts from the projected balance); tsc 0, eslint 0, core suite green; web-verified both themes both tiers, 0 console errors. **Hit the `@core` junction hot-reload trap again** (new export → runtime "not a function" until Metro `--clear` restart). _After-scan deferrals:_ (a) [DECISION, Jason] Progress %-paid (raw) beside a projected debt-free date = deliberate backward/forward split — confirm it reads coherent. (b) `selectDrift` seam works on the projected store but has no live consumer yet (DriftCard pulled) → drift's projected wiring lands at **2.4.3** (Guardian calls `selectDrift(engineStore)`). (c) all-debts-project-to-$0 would flip `hasDebts` false → Progress empty state; handled by the Today provisional-payoff invitation, but note the edge. (d) demo's ≤52-day aging makes the projection visually invisible → consider aging one demo debt further to showcase "cost of delay" (demo-tuning, non-blocking) → **Deferred backlog**.
  - [~] **2.4.2 Unify the anchor → DEFERRED to 2.6 (2026-07-22).** Surfaced during 2.4.3: the Guardian's headline is the projected **cushion** (not drift); drift is only the secondary "material-change" trigger, and its accountability meaning needs **confirmed** balances — the min-only projection would misreport "behind" for anyone paying extra. So anchor-unification + drift-trigger wiring move to **2.6** (close-the-loop), where drift is actually consumed; building it for a not-yet-existing consumer now would be premature.
  - [x] **2.4.3 Guardian engine ✅ DONE (2026-07-22).** Core `guardian/buildGuardianBrief` (pure, reconciliation-tested): 3-band `clear/tight/at-risk` mapped from the **same `toCushionStatus` thresholds** the cash-flow bars use (coherence); two-sided (shortfall → SAVE · surplus → best-move to the focus debt); every $ **hedged** ("about $X", nearest $10) + a safe move, **never a false-precise verdict**; optional lookahead forewarning of the nearest upcoming non-clear cycle. App `selectPaydayGuardian(store)` gathers inputs from `selectAllocation`/`selectCashTimeline`/`selectExtraToDebt` off the passed store (premium → projected). Tests: state precedence · hedging invariant (no cents) · lookahead · focus-debt targeting.
  - [x] **2.4.4 Guardian brief UI ✅ DONE (2026-07-22).** `PaydayGuardianCard` on Today (after the hero): eyebrow + state-colored shield (`gpp-good/maybe/bad`; slate/amber/red — green deliberately absent, matches the cushion bars) + title + hedged detail + safe move + lookahead. **Calm register** (no beat/haptic — risk info; rides Today's entrance stagger, [[feedback_match_motion_to_surface_job]]). **Premium-gating is value-led** ([[feedback_premium_gating_value_led]]): free sees the **real read** for this paycheck (the taste) + a designed blue invitation ("Premium tells you the exact safe move and watches every paycheck") — no lock/blur.
  - [~] **2.4.5 Verify** — ✅ web both themes both tiers, 0 console errors (demo exercises the TIGHT band + lookahead); core suite green; tsc 0, eslint 0. **Owed:** native device-QA (MaterialIcons `gpp-*` render + card in a real build) → Phase 6; a clear/at-risk demo-state eyeball (tests cover the logic) → optional.
  - **After-scan (2.4.3/2.4.4):** (a) [note, Jason] the hero "Free $210" (allocation leftover) sits near the Guardian "about $160 cushion" (projected cycle-ending) — two honest-but-different numbers; confirm it doesn't read as a conflict. (b) `gpp-*` shields are MaterialIcons → verify render on real iOS/Android (Phase 6). (c) free-taste presentation is my value-led call (show the read, gate the move) — flagged for Jason's confirm. (d) the free invitation is non-interactive until the paywall exists → wire `onUpgrade` at **2.10**.
  - [x] **2.4.6 Acting Guardian — auto-protect the cushion floor ✅ DONE (2026-07-22; Jason: "really it's just smart text right now").** Turned the Guardian describe → **ACT**: premium reserves a user **cushion floor (default $200, adjustable — the "bank low-balance alert" model)** as the paycheck buffer, so the WHOLE plan (Today allocation · cushion · payday capture) auto-protects the cushion before any extra payoff; spending stays user-executed (mark-paid), never auto-paid; **only DISCRETIONARY money moves — obligations are never cut** (Jason's priority model: cut recommended/goals first, never a bill/minimum; smoothing past discretionary = 2.4.7 "options", not auto-cut). Built: `cushionFloor` pref + `setCushionFloor` (clamped, $NaN-guarded) + default/migration; `effectivePaycheckBuffer` (premium→floor · free→$50, derived from `subscriptionPlan` → display AND payday) into `selectAllocation` + `selectCashTimeline`; `buildGuardianBrief` reframed; **Skia `CushionBar`** (cushion + payoff segments + floor line across, calm draw-on, platform-split) + **`CushionFloorSheet`** (Slider). Reconciliation-tested; tsc/eslint/core green; web-verified both themes both tiers, 0 errors. Commits `c6f13f4` · `81c575d`. **⭐ KEY LESSON — the `endingBalance` semantic trap:** the timeline's `endingBalance`/cushionStatus = **deployable cash AFTER the buffer is reserved**, NOT the kept cushion → raising the buffer DROPPED it to a $0 false read. Fix: the band follows **HEADROOM after obligations** (`discretionary = paycheck − totalRequired − livingReserve`), with **kept** = `sumCategory('leftover')` · **deployed** = `sumCategory('snowball')`; an affordable cycle reads "covered" for BOTH tiers (a choice to pay debt isn't a risk), premium just keeps more of the headroom. New `selectDiscretionary`/`selectLiquidCushion`. **Copy accuracy (Jason live-QA):** (a) extra fills debts in strategy order → "across your debts, starting with {focus}" (+ plural) when `deploySpread`, "to {debt}" only when single — **holds for avalanche** (focus = highest-APR via `rankDebts`) and snowball; (b) a real shortfall ≠ "tight" → "This paycheck won't cover everything" + honest triage (essentials first). **Open follow-ups → fold into 2.4.7/polish:** (i) **debt-free-date artifact** (floor pushes the date out; the projection assumes cushion held FOREVER) → RESOLVED-BY-2.4.7; (ii) **lookahead** still uses the deployable `endingBalance`, not kept cushion → align; (iii) "Adjust your line →" shows in a shortfall where it's not the move → hide when at-risk/shortfall; (iv) native `gpp-*` glyph + `CushionBar` render → Phase-6 device-QA.
  - [ ] **2.4.6.1 Honesty & correctness hardening — from the 2026-07-22 lock-down audit (`docs/DEBT_GUARDIAN_AUDIT_2026-07-22.md`); do BEFORE 2.4.7 (which amplifies these).** Built 2.4.6 works in the demo but the 4-lens audit found live bugs + honesty gaps. **Two root-cause fixes:** (R1) **ONE metric everywhere** — drive the band, the lookahead, AND the Progress cash-flow bars off floor-relative **HEADROOM** (per-cycle discretionary vs floor), never post-buffer `endingBalance` vs fixed 200/100 (kills the false "next cycle tight" alarms that WORSEN as the floor rises); (R2) **exhaustive discretionary partition** (cushion + EF + debt + goals + true-leftover) that provably sums, reconciliation-tested (kills "all held as your cushion" lying during the EF phase). **Confirmed bugs:** windfall repeated across projected cycles · at-risk cutoff floor-relative (not hardcoded `<100`) · `focusDebtName` from the ACTUAL snowball allocation (not a re-rank) · hedge never renders "$0" for a nonzero amount · **VoiceOver: "Adjust your line" rendered OUTSIDE the narrated container** · hide "Adjust your line" in shortfall/at-risk · bar intro-animates once (no replay on incidental re-render). **Framing:** promise "will your **plan** hold" + "based on what you've entered, not your bank" (not omniscient); present-tense PLAN voice (not "I'm holding/sent" custody); hedge the CLEAR state too (guard false-**reassurance**, not just false-alarm); soften the FREE at-risk taste (still helps, not anxiety→upsell); band hysteresis/dead-band. Verify both themes both tiers + VoiceOver.
  - **[DECISION]s surfaced by the audit (resolve before/within 2.4.7):** **(D1) graduation capstone render home** — `selectPaydayGuardian` nulls at `liveDebts=0`, but the waterfall ENDS at "debt-free & funded → Freedom"; where does the finale live? **(D2) variable/irregular income — IN v1.7 (Jason 2026-07-22, "getting this right is worth the extra diligence"):** the Guardian must handle swinging income (hourly, variable hours, tips, commission, overtime), NOT assume a fixed scalar. **This is MAINSTREAM for the debt app's OWN audience — a large share of debt-carrying people don't earn the exact same each paycheck (NOT a niche or a sibling-app concern, Jason 2026-07-22); planning payoff around income that swings is core.** Design the ranged/uncertain-income read (conservative framing) as part of THIS feature. → review-session topic. **(D3) premium-value positioning** — Guardian-standalone ≈ config + smart-text; market as the automation BUNDLE (2.3+2.4.7) and/or make 2.4.7 visibly DO (auto-pre-fund). **(D4) "watches every paycheck" is unbacked** — soften copy until a Guardian-STATE local notification ships = a REQUIRED backer at 2.6/2.9. **(D5) calibration loop** — no "was the Guardian right?" reconciliation → cries-wolf risk; self-scorecard @ 2.6 or soften-until-proven. **(D6) EF-elsewhere / preachy waterfall** — gate the EF rung on "savings elsewhere?", offer EF-vs-APR as choice-with-why, never blame a guessed "flexible" cost. Tier-4 deferrals (motif/palette coherence w/ Progress bars · first-run floor intro · demo Guardian showcase · pre-2.5 accuracy risk · Drift→Guardian contract · iPad/AX/high-contrast) → in the audit doc.
  - **⭐ PROCESS GATE (Jason 2026-07-22) — before ANY Guardian/2.4.7 build:** (1) a dedicated **COLLABORATIVE review session** of the audit (decide the reshapes + D1–D6 together, not solo); (2) **document the FULL Guardian + Premium spec** (everything we'll build); (3) a **SECOND adversarial-audit round** on that spec; THEN build. My recs on the 6 gates were accepted as the starting position EXCEPT D2 (now in-v1.7); the session confirms/refines them. Diligence > speed — "getting this feature right is worth it." **✅ GATE COMPLETE:** review done (`DEBT_GUARDIAN_REVIEW_DECISIONS_2026-07-23.md`, Clusters 1–7) · spec done (`DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md`) · second audit done (5 lenses → `DEBT_PREMIUM_ELEVATION_AUDIT_ROUND2_2026-07-23.md`).
  - **⭐⭐ ROUND-2 RESOLUTION (Jason 2026-07-23) → SHIP FULL v1.7, nothing half-hardened; the round-2 fixes are the QUALITY BAR, not a cut list.** MVP cut **REJECTED** (deferral = the cold-start/half-pipeline debt this app refuses). Scorecard = **REWORK not defer**. Data substrate = a **structure-first pass FIRST**. Honesty reshapes **adopted**. Distribution IS the bottleneck (Jason) but the differentiated Guardian **is** the distribution lever → the **demo-safe premium showcase + GTM/ASO are first-class**. Lifetime-vs-portfolio-sub + Connected-as-convenience-not-accuracy → **[DECISION]s deferred to 2.10 / ~v1.8**. **▶ RE-SEQUENCED v1.7 BUILD ORDER (decomposed):**
  - **⭐⭐ AUDIT LOOP CONVERGED → BUILD (2026-07-23).** Rounds 3–6 (`DEBT_PREMIUM_ELEVATION_AUDIT_ROUND{3,4,5,6}_2026-07-23.md`) + specs v3→v6; round 6 (6 angles) **unanimous: architecture converged, build at 2.4.D, no round 7.** Decisions: **(A)** income-arrival **paused-deploy** state IN v1.7; **(B)** pricing = annual/Lifetime lead **+ proof-window money-back guarantee**, smallest-move = one-tap **action**, demo **bounded**. **Canonical build artifact = `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` v6** — leaves below are the SEQUENCE; detail lives in the spec. Structure-first order (data→persistence→producers→logic→components→screens last). **▶ ACTIVE = 2.4.D, decomposed to leaves; downstream phases decompose to leaves at their switch-in (verify pre-authored vs CURRENT code first, [[feedback_verify_preauthored_audit_accuracy]]). Every task+subtask gets a before- AND after-scan.**
    - [ ] **2.4.D · Data substrate (structure-first, FIRST).** _Exit: schema + migration + producers + cross-cycle carryover green, reconciliation-tested, ZERO UI._
      - [x] **2.4.D.1 Schema ✅ (2026-07-23).** Core (`debtPlannerStorage.ts`): `GuardianBand` · `CyclePrediction` (forCycle/cushion/state/shortfall/confidenceContext/plannedIncome) · `CycleOutcome` · `IncomeActual` · `SurpriseOutflow`; `PayCycleSnapshot` += optional `prediction`/`outcome`/`disturbed`. App (`models.ts`): `PaycheckConfig` += `incomeVaries`/`leanAmount`/`typicalAmount`/`seasonalStrongMonths?`; `DebtStore` += `inputsAsOf`/`genuineCycleCount`/`onboardedAt`/`incomeActualsLog`/`surpriseOutflowLog`/`currentCyclePrediction`/`currentCycleNotifyState`/`pushLog`/`priorGuardianBand`/`missedArrivals` + `CurrentCycleNotifyState`. **⭐ 2 before-scan corrections vs spec §3.1:** (1) `plannedIncome` lives on the `IncomeActual` log entry, NOT `PaycheckConfig` (which is overwritten → no history); (2) the prediction splits into a store-level `currentCyclePrediction` (in-flight) folded into the snapshot at rollover — the snapshot is a historical end-of-cycle record with no in-flight row. tsc 0, regression green.
      - [x] **2.4.D.2 Migration v4→v5 ✅ (2026-07-23).** `CURRENT_STORE_VERSION` 4→5; all fields added to `createDefaultStore` (income fields in `paycheck`; safe backfill fixed/0/empty, `inputsAsOf=currentDate`); `runMigrations`' `...base,...r` merge backfills additively (doc updated). **`importStore` routed through `runMigrations`** (round-6 data #3 — hardens future iCloud/Phase-D raw callers; idempotent for pre-migrating callers). tsc 0, regression green.
      - [x] **2.4.D.3 Producers ✅ (2026-07-23).** Pure module `store/substrateProducers.ts` (+ `substrateProducers.test.ts`, 15 asserts, tsx-runnable — starts the RN app-layer test pattern): `stampInputsFresh` (3a) · `incrementGenuineCycle` (3b) · `recordCycleIncome` (3c/3e — fixed defaults to planned, variable-no-actual skips, windfall excluded, planned-from-prediction, re-capture replaces) · `recordMissedArrival` (3f, idempotent) · `recordSurpriseOutflow` (3d, positive-only) · `stampOnboardedAt` (set-once). **Wired:** 3a → `updatePaycheck`/`addDebt`/`updateDebt`(balance-discriminated)/`removeDebt`/`verifyDebtBalance(s)`/expense+living-expense mutations (goals/strategy/payment-marking deliberately NOT stamped — not income/bill/balance inputs); 3b → `applyRollover`; 3c/3d/3e/3f → `applyCapture` (new optional `PaydayActuals` 4th arg + `capturePayday` passthrough; the variable/outflow/missed UI affordance is a later component-layer add); onboardedAt → `completeOnboarding`. tsc 0, producer + regression green. **After-scan:** the app-layer test file isn't in `validate:release` yet → the Phase-4 RN test-harness item wires it (no new queue item).
      - [x] **2.4.D.4 Capture-trigger matrix ✅ (2026-07-23).** Pure `store/guardianPredictionCore.ts` (selector-free → tsx-testable; `guardianPrediction.test.ts`, 18 asserts): `deriveConfidenceContext` (§2.0.e — discovery `<3` genuine cycles · cold-start `<4` lean-confirming actuals, fixed-income masked) · `applyStampDecision` (fresh / re-stamp-on-material-change+`restampedMidCycle` / idempotent) · `reconcileClosingCycle` (folds prediction+first-order outcome into the closing snapshot; missed→$0, surprise reduces held cushion, disturbed carries). `guardianPrediction.ts` adds selector-backed `computeCyclePrediction` (maps `GuardianBrief.state/cushion` + `allocation.shortfall` + lean/fixed planned income) + `stampCyclePrediction`. **Wired:** `applyRollover` folds the closing prediction + clears + re-stamps the new cycle; `completeOnboarding` stamps first; new `refreshCyclePrediction()` action for app-open. Prediction stamped ONLY via mutations, never a selector. Demo/import isolation is structural (they never call `applyRollover`). tsc 0, all suites green. **After-scan:** the `refreshCyclePrediction()` **app-open call-site** is a component-layer wire owed with the Today/Guardian surface (2.4.6.1+) — the loop already stamps at rollover+onboarding, so this is a supplementary freshness trigger (covers an upgrader who hasn't rolled yet).
      - [x] **2.4.D.5 `shouldReAnchor` source-flag ✅ (2026-07-23).** `recordDriftBaseline(store, source: 'user' | 'learning' = 'user')` — a `learning` source short-circuits (preserves the frozen baseline; a measurement change, not a plan change → "days ahead/behind" doesn't reset on an app income-refinement); `user` (the default, every current caller) re-anchors normally. Gate lives in the app layer; `shouldReAnchor` (core, already tested) stays pure. The learning CONSUMER arrives with 2.4.7's income nudge. tsc 0, regression green.
      - [x] **2.4.D.6 Forecast cross-cycle carryover ✅ (2026-07-23) — the architectural leaf.** `TimelineCycle` += `net` (= `paycheckAmount − totalRequired − livingExpenseReserve`, UN-CLAMPED — negative on a lumpy-bill cycle; deploy-independent) + `carriedBalance` (the running balance if nothing's deployed: `startingBalance + Σ net`, also un-clamped). New `startingBalance` param (defaults to `paycheckBuffer` = the retained floor = §2.5 `bal_0`). Threaded through cycle 0 + the projection loop via a `cycleNet(result)` helper. **Purely ADDITIVE** — `endingBalance`/`cushionStatus` + all consumers untouched (the water-fill migrates onto the carry track at 2.4.7). Confirmed round-6 F3: the forecast had NO cross-cycle carry today (each cycle restarted from its own paycheck; `endingBalance` clamps `max(0,·)`, erasing the dip). +4 reconciliation asserts (net formula · cumulative-from-start · recurrence `carried_k=carried_{k−1}+net_k` · **negative-net lumpy cycle preserved un-clamped while endingBalance clamps ≥0**). tsc 0, full regression green. **After-scan:** 2.4.7 passes the real current cushion as `startingBalance` + runs the water-fill on `net`/`carriedBalance` (natural next consumer, not a gap).
      - [x] **2.4.D.7 §2.0 reconciliation seams ✅ (2026-07-23).** `selectReadFreshness(store, asOfDate?)` (guardianPrediction.ts) — read-freshness off store-level `inputsAsOf`, NOT per-debt `lastVerifiedDate`, so a rolled-over/auto-maintained debt (whose `lastVerifiedDate` ages by design) doesn't trip the staleness hedge (the 2.1↔2.3 reconciliation); same `ESTIMATE_AGING_DAYS`/`ESTIMATE_STALE_DAYS` thresholds. Pure `classifyFreshness`/`daysBetweenISO` in the core module (injectable → tsx-testable). **Substrate de-gate:** the recording producers are debt-agnostic by construction (verified at debt=0). The prediction-stamp's debt-free read (EF/goals target) is 2.4.8 (graduation). +7 asserts (freshness boundaries · inputsAsOf-not-lastVerifiedDate · de-gate at debt=0). tsc 0, all suites green.
      - **✅ 2.4.D COMPLETE (2026-07-23) — whole-phase after-scan.** All 7 leaves green (schema → migration → producers → capture-matrix → source-flag → cross-cycle carry → §2.0 seams); tsc 0; core regression + 2 new app-layer test files (33 asserts) green. **Substrate CONSUMERS to wire downstream (the accumulated ledger — not gaps, correctly-placed):** (a) `refreshCyclePrediction()` **app-open call-site** → Today mount (2.4.6.1/surface); (b) §2.0 **action/voice gates** consume `deriveConfidenceContext` + `selectReadFreshness` (2.4.6.1); (c) the **water-fill** runs on `net`/`carriedBalance` + passes the real current cushion as `startingBalance` (2.4.7); (d) the **learning nudge** calls `recordDriftBaseline(store,'learning')` (2.4.7); (e) the **variable-income/outflow/missed UI affordance** (the `PaydayActuals` data path exists) → payday capture sheet (2.4.7/surface); (f) the **prediction read at debt=0** (EF/goals target) → 2.4.8. **Retroactive lesson (applies to every app-layer leaf):** tsx can't resolve `@core` VALUE imports → keep pure/testable logic in selector-free modules with injected deps (the D.4 `guardianPredictionCore` split + D.7 `classifyFreshness` injection are the pattern). **App-layer tests not yet in `validate:release`** → Phase-4 harness item wires them.
    - **Cross-leaf checks (only visible viewing the whole substrate):** (1) **Field↔producer audit — 4 fields are INTENTIONALLY schema-ahead-of-producer** (substrate-first): `priorGuardianBand` → 2.4.6.1 hysteresis · `currentCycleNotifyState` + `pushLog` → 2.4.10 notification · `seasonalStrongMonths` → 2.4.7 §2.3 self-declaration UI. Each has a designated home; none is an orphan. (2) **All four §2.0.a signals now have their substrate** — bill-completeness (`genuineCycleCount`+`surpriseOutflowLog`), read-freshness (`inputsAsOf`), lean-verification (`incomeActualsLog`), income-modelability (`incomeVaries`/`seasonalStrongMonths`; the CoV/seasonality *classifier* is 2.4.7). (3) **Key-alignment verified:** the income-actual is written keyed by `nextPaycheckDate` at capture (D.3) and read by `snapshot.cycleEndDate` at rollover (D.4) — same value for the same cycle, so predicted↔actual reconcile can't miss. No version-necessary new work surfaced; the substrate is complete and the calibration pipeline is wired end-to-end through the snapshot (scorecard consumer = 2.4.9).
    - [x] **2.4.6.1 · Hardening ✅ COMPLETE (2026-07-23).** All 6 leaves shipped: partition split + clamp → one-metric `computeState` (3 producers) → §2.0 action/voice gates → confirmed bugs → bar/card UI (Set-aside zone + stale treatment, design shaped w/ Jason) → framing reshapes. Exit met: partition provably sums, ONE `computeState`, §2.0 gates live + visible, bugs fixed, bar/card/framing green both themes both tiers (VoiceOver structural; device-walk → Phase 6). tsc 0, full core regression green throughout.
      - **⭐ WHOLE-ITEM AFTER-SCAN (across the 6-leaf pass):** the §2.0 confidence layer is now wired end-to-end and COHERENT — substrate signals (2.4.D) → action gate (holdback bucket dampens deploy, premium-gated) → voice gate (one-hedge budget + stale cutoff) → VISIBLE ("Set aside" bar zone + neutral stale treatment) → reshaped VOICE (plan-not-custody, observation-not-verdict, private-by-default). **Consolidated deferral ledger (all filed, none silent):** (a) demo cold-start showcase state → **2.4.11**; (b) VoiceOver screen-reader device walk → **Phase 6**; (c) the two §2.1 boundaries + fuller §2.0.d cold-start intro → **2.4.11 first-run**; (d) multi-cycle forecast per-cycle holdback → **2.4.7** water-fill; (e) `rankDebts` Payoff-tab focus divergence (low stakes, display-only) → noted, non-blocking; (f) free at-risk softened copy not visually confirmed (demo is clear-only) → a free-at-risk demo state folds into **2.4.11**. No version-necessary work surfaced beyond the folded-in `computeFlexibleCash` fix. **Retroactive lesson:** the app-layer test files (guardianPrediction/substrate) still aren't in `validate:release` → the Phase-4 RN harness item wires them (already tracked).
      - _Leaves (engine→state→gates→bugs→UI→framing):_
      - [x] **2.4.6.1.1 Partition split + CLAMPED composition ✅ (2026-07-23).** `allocatePaycheck`: the single `leftover` category is split → `cushion_buffer` (buffer emission) + `true_leftover` (residual emission); the union is now the canonical **`AllocationCategory`** 8-bucket set (+`prefunded_reserve`/`discovery_holdback`/`starter_emergency` declared, $0 until fed by 2.4.6.1.3/2.4.7). Exported `PROTECTED_CUSHION_CATEGORIES` (1+2+3+8) + `PUT_TO_WORK_CATEGORIES` (4–7) as the single source. `selectLiquidCushion` → sums PROTECTED (not the buffer alone). New pure `guardian/holdbackComposition.ts`: `combinedHoldback` (clamp `min(prefunded + max(discovery,coldStart), discretionary−floor)`, **prefunded-wins** collision) + `computeDeploy`. Consumers simplified — `buildTimelineItems`/`selectActiveRecommendedActions` now match the buffer by `category==='cushion_buffer'` (no label check). +18 reconciliation asserts (`testGuardianPartition.ts`, wired into the runner): sum-to-discretionary in normal/no-deploy/**tight** (cushion_buffer=min(floor,disc))/**shortfall** cases · cushion=protected · the clamp (within-headroom · over-clamp · prefunded-wins · deploy≥0). tsc 0, full regression green. Behavior-preserving (existing allocation/timeline tests unchanged).
      - [x] **2.4.6.1.2 One-metric `computeState` ✅ (2026-07-23).** `guardian/computeState.ts` (floor-relative bands: at-risk `<floor×0.5` [replaces hardcoded `<100`] · tight `<floor` · clear `≥floor` + hysteresis: downward immediate, upward clears by `HYSTERESIS_BAND=$50`; +19 asserts). **All THREE producers migrated onto it:** card `buildGuardianBrief` (+`priorBand`), forecast `buildMultiCycleTimeline` (`toCushionStatus(endingBalance)`→`computeState(max(0,net),paycheckBuffer,band)` threaded cycle-to-cycle; `guardianState` added to `TimelineCycle`; `cushionStatus` now a display alias so the 10 consumers keep working; NEVER `endingBalance`), `selectPlanSummary` (dropped `paycheck*0.1`/`remainingAfterRequired`→floor-relative). `priorGuardianBand` persisted at rollover (closing band → next cycle's prior) for cross-cycle hysteresis. **Metro DX fix (folded):** `watchFolders` += real `packages/core` + symlink resolution → a new `@core` export hot-reloads instead of needing `--clear` (kills the recurring junction trap). tsc 0, full regression green. **Visually verified (Playwright :8081):** card "clear" + bars "comfortable" correct in dark+light, premium+free, ZERO console errors; light-mode parity held.
      - [x] **2.4.6.1.3 §2.0 action/voice gates ✅ (2026-07-23).** **Action gate:** `allocatePaycheck` now emits the `discovery_holdback` bucket via the clamped `combinedHoldback` (fraction of above-floor headroom, reserved BEFORE any deploy → dampens EF/snowball/goals, stays PROTECTED cushion); fractions (`DISCOVERY_HOLDBACK_FRACTION 0.4` / `COLDSTART_HOLDBACK_FRACTION 0.25`) mapped from `deriveConfidenceContext` in `selectAllocation`, **premium-gated** (like the floor buffer; free deploys undampened). **Also fixed `computeFlexibleCash`** to reserve the held buckets so the recommended-actions surface can't offer to deploy held cash (folded in — same dampen-deploy wiring). **Voice gate:** `buildGuardianBrief` takes `confidence` (freshness + live holdbacks) → §2.0.d hedge budget (at most ONE hedge, priority stale>aging>lean>bills; 'fresh' never hedges; learning hedges premium-only) + the stale **hard cutoff** ("Let's refresh your numbers" + `staleAdvisory` flag, supersedes every read). `selectReadFreshness` relocated guardianPrediction→guardianSelectors (breaks a would-be import cycle). tsc 0; +2 holdback-in-allocation reconciliation cases + clamp/max/prefunded cases + 14 voice-gate asserts, full regression green. **Visually verified (Playwright :8081, both themes both tiers, 0 console errors):** premium dampens deploy (spare $5) + shows the one discovery hedge; free undampened + no hedge; light==dark.
      - [x] **2.4.6.1.4 Confirmed bugs ✅ (2026-07-23).** All 3 verified vs current code, then fixed: **(1) Focus from the ACTUAL allocation** — `guardianSelectors` now names the debt the first `snowball` allocation item targets (`rankDebts` re-ranked raw by balance/apr, ignoring this cycle's paid minimums / skipped-paid-off debts → could name the wrong focus); raw rank kept only as the no-deploy fallback. **(2) Hedge never "$0" for a nonzero** — `about()` floors a nonzero to the smallest hedge unit (`$2` → "about $5", not "$0"). **(3) Windfall not repeated** — `buildMultiCycleTimeline` gains `projectedPaycheckAmount` (the recurring paycheck) for projected cycles; cycle 0 keeps the windfall-inflated `result.paycheckAmount`, future cycles drop it (`selectCashTimeline` passes base `paycheck.amount`; windfall is cleared at rollover per `payday.ts`, so repeating it in the forecast was a pure over-projection). tsc 0; +$0-hedge asserts + a windfall non-repeat regression test (incl. backward-compat default), full regression green; no-regression visual (premium card still names "spare $10 to Store Card", 0 console errors).
      - **After-scan (2.4.6.1.4):** `rankDebts` is still used by `selectPayoffView` (Payoff-tab focus display) with the same latent "raw-rank vs actual-allocation" divergence when a debt is partially paid mid-cycle — LOW stakes (a display of payoff order, not an action claim); noted, not version-necessary for the Guardian. No new queue item.
      - [x] **2.4.6.1.5 Bar + card UI ✅ (2026-07-23; design shaped w/ Jason).** Held reserve exposed on the brief (`heldReserve` = discovery+prefunded, `selectHeldReserve`, clamped ≤ cushion) → **`CushionBar` draws it as a NAMED "Set aside" zone** — the cushion color at 0.5 opacity at the FAR-LEFT of the protected block (§2.0.c: visible, protected, never adjacent to payoff); legend gains the tinted "Set aside" swatch when present. **Stale cutoff** (Jason's pick): neutral `update` shield (no verdict color) + **dimmed bar** + an **"Update needed" chip**. **VoiceOver:** the "Adjust your line" Pressable moved OUTSIDE the `groupLabel` accessible group (its `accessible:true` was swallowing the button) → now its own focusable element. **Hide adjust** in at-risk/shortfall + while stale. **Animate-once:** bar fill runs once on first appearance (ref-guard), no replay on mark-paid/tier-toggle. tsc 0; +heldReserve viz asserts, regression green. **Visually verified (Playwright, injected cold-start + stale states, both themes, 0 console errors):** the "Set aside" tinted zone + coherent copy; the stale neutral shield + chip + dimmed bar; established demo correctly shows no reserve zone.
      - **After-scan (2.4.6.1.5):** the "Set aside" zone only renders when a reserve is live (cold-start/prefunded) — verified via a Playwright-injected state (localStorage only; demo/shipped code untouched). VoiceOver is fixed **structurally** (button now outside the group); the actual screen-reader WALK is a device-QA item → **Phase 6** (consistent with the existing native-a11y deferral). No new queue item.
      - [x] **2.4.6.1.6 Framing reshapes ✅ (2026-07-23; copy drafted per §2.0.d/§2.1, Jason-approved).** **False-reassurance guard:** clear title "You're covered" → **"Looks clear this paycheck"** (observation, not verdict; all 3 clear branches). **Present-tense plan voice (not custody):** "I'm holding … and sending the spare" → **"I've set this paycheck to keep … and put the spare … toward {debt}"** (dest "to"→"toward"); "all held as your cushion" → "this paycheck keeps all of it"; "send more toward debt" → "free up more for debt". **Cold-start earn-trust:** income hedge → "planning from the low side while I learn **what your paychecks reliably clear**". **Softened free at-risk:** "under a healthy $Y" → "a bit tight this one, so keep an eye on the essentials". **Private-by-default:** free invite → "…automatically, **all on your device** — no deciding each paycheck". tsc 0, regression green (hedge/dest test regexes updated), visually verified both themes both tiers. _(Deferred to 2.4.11 first-run per Jason: the two §2.1 boundaries — "based on what you've entered, not your bank" + "not financial advice" — and the fuller §2.0.d cold-start intro.)_
      - **After-scan (2.4.6.1.3) — surfaced, filed to their homes (none silent):** (a) **✅ Demo-coherence RESOLVED (Jason agreed 2026-07-23):** the demo/default seed `genuineCycleCount:0` made the PREMIUM demo exercise cold-start (40% holdback + "getting to know your bills") on a MID-JOURNEY showcase — read as week-one. Fixed: demo seed now sets `genuineCycleCount:6` (matches its 6-cycle track record) → the showcase reads as an established premium user (no hedge, undampened deploy; re-verified both themes). A deliberate cold-start demo state stays **2.4.11's** ("demo bounded to cold-start reality"). (b) The placeholder cold-start copy ("getting to know your bills") → **2.4.6.1.6** refines to the §2.0.d earn-trust wording. (c) `staleAdvisory` flag on the brief → **2.4.6.1.5** renders the neutral stale chip (so a "clear" shield never sits over "refresh your numbers"). (d) The multi-cycle forecast still deploys per-cycle without the holdback → **2.4.7** water-fill applies it on `net`/`carriedBalance`. (e) The premium debt-free date sits LATER than free (floor + holdback dampen deploy: 2029 vs 2028) — already tracked (2.4.6 follow-up (i), RESOLVED-BY-2.4.7). **Nothing version-necessary beyond the folded-in `computeFlexibleCash` fix; no new queue item.**
    - [ ] **2.4.7 · Cash-flow brain ▶ ACTIVE (decomposed at switch-in 2026-07-23).** **Before-scan (verified vs current code):** the carry track (`net`/`carriedBalance`, 2.4.D.6), the `prefundedReserve` param (2.4.6.1.3), the `starter_emergency`/`prefunded_reserve` categories, deploy-from-actual-allocation (2.4.6.1.4), and the `missedArrivals` substrate (2.4.D) all EXIST → 2.4.7 mostly consumes them. **Confirmed not-yet-built:** (i) forecast state-threading — `rolloverDebts` advances due dates but NEVER reduces `debt.balance`, so the projection re-runs on original balances (debts never shrink, minimums never free); (ii) valley-into-forecast — projected cycles use `paycheck.amount`, not `leanAmount`. Structure-first order (forecast correctness → detection → water-fill → wiring → waterfall → paused-deploy → learning → surface):
      - [x] **2.4.7.1 State-thread the forecast (C5) ✅ (2026-07-23).** `buildMultiCycleTimeline` now state-threads BOTH rollover points (cycle 0→1 before the loop + cycle i→i+1 inside): new `stateThreadDebts` reduces each debt's balance by this cycle's minimum+snowball via the shared **`applyRolloverPayment`** (accrues one pay-cycle's interest), and `advanceGoals` tops up funded goals; paid-off debts are filtered out (`balance > 0`), freeing their minimum into later cycles' `discretionary`. Reconciliation: a retired debt's $100 minimum frees → `net` rises 200→300 across the horizon (was frozen without threading). tsc 0, full regression green (updated the debt-minimum-placement test — state-threading correctly pays off its small debt in cycle 0, so its balance was bumped to preserve the due-date-placement intent), app runtime smoke 0 console errors. _(Scope Q RESOLVED — Jason: §2.3 "debt-free date — one engine, two runs" reconciliation kept OUT → filed to the Deferred backlog.)_
      - **After-scan (2.4.7.1):** (a) **goal advancement is built** but its effect is DEPLOY (excluded from `net`/`carriedBalance`/`endingBalance`, only a timeline item once marked-paid) → not directly assertable via the public TimelineCycle API; covered-by-construction + indirectly via the debt-retirement test. (b) The projection now accrues interest per cycle (via `applyRolloverPayment`) — consistent with the REAL rollover; the `applyRolloverPayment` "display↔rollover interest seam" (its own doc note) is the same pre-existing v1.7 concern, unchanged. (c) State-threading widens the potential divergence between the timeline's payoff and `selectDebtFreeDate`'s separate `projectDebtPayoff` → exactly the filed **one-engine-two-runs follow-on**. No new queue item.
      - [x] **2.4.7.2 Valley-into-forecast ✅ (2026-07-23).** New pure `projectedIncome(paycheck)` (selector-free → tsx-tested): variable income projects future cycles on `leanAmount` (the valley you can count on), fixed on the entered amount, with a base fallback when no lean is entered yet (never projects $0). Wired into `selectCashTimeline`'s `projectedPaycheckAmount` (cycle 0 still uses the actual paycheck). +5 asserts (`projectedIncome.test.ts`). tsc 0, regression green. _(Cross-cycle threading of `projectedPaycheckAmount` already reconciliation-tested at the core level, 2.4.6.1.4.)_
      - [x] **2.4.7.3 Crunch detection ✅ (2026-07-23).** New pure `packages/core/cashflow/detectCrunches.ts` — walks the un-clamped `carriedBalance` track (2.4.D.6), groups maximal below-floor runs into `CrunchSegment`s (`startIndex`/`endIndex`/`troughIndex`/`troughDeficit = floor − trough`); single deterministic pass (deploy-independent). +9 reconciliation asserts (`testDetectCrunches.ts`, wired into the runner): no-crunch · at-floor-not-a-crunch · single multi-cycle (trough in middle) · two separate segments · crunch-to-end-of-horizon · single-cycle · negative (un-clamped) balance. tsc 0, regression green. _(Wiring — real cushion as `startingBalance` + running detection off `selectCashTimeline` — lands with the water-fill consumer, 2.4.7.4/.5.)_
      - [x] **2.4.7.4 Backward water-fill ✅ (2026-07-23) — ⚠️ MODEL to confirm at .6 review.** New pure `packages/core/cashflow/waterFill.ts` → `{ prefundedReserve (cycle 0's held-back share), structuralDeficit, reserveByCycle, segments }`. **Key correctness call (F2 no-double-count):** because `carriedBalance` is CUMULATIVE (preceding surplus already carried in), the **structural deficit = the below-floor trough depth directly** (summed across segments) — "covering" it from preceding surplus would double-count. The reserve is a **cumulative DEPLOY cap** (deploy to debt can't exceed any cycle's headroom or the actual balance breaches floor); deploy greedily early, hold the rest. This reduces the spec's "shared-pool / nearest-source / decrement" prose to the clean cumulative-cap formula **for the actionable cycle-0 reserve + total structural deficit** — validated against ALL the spec's mandated scenarios (+8 reconciliation asserts, `testWaterFill.ts`): no-crunch → reserve 0 · tight → hold to keep floor · **flush-then-bill → honest $50 structural, NOT inflated (no false-alarm)** · deploy-masks-crunch + multi-crunch → structural reported (no false-clear) · cumulative cap · cycle-0-below-floor. Cold-start-source = allow (never exclude → no false-alarm); the down-qualify is a display flag (2.4.11). tsc 0, regression green. **→ flag for Jason at .6: confirm the cumulative-cap model matches intent (the spec's per-cycle attribution prose was simplified to the actionable formula).**
      - [x] **2.4.7.5 Wire prefunded into the plan ✅ (2026-07-23).** New shared `forecastCycles.ts` (`buildForecastCycles` — one place both `selectCashTimeline` + the water-fill build the projection identically). `selectAllocation` refactored → `buildAllocation(store, prefundedReserve)`; new **`selectPrefundedReserve(store)`** runs the water-fill over the (prefunded-free `selectBaseAllocation`) carry track, premium-only, **WeakMap-cached by the immutable store** so the forecast builds once per store version despite the many `selectAllocation` calls (recursion broken: forecast uses the base allocation, which is prefunded-independent). The reserve flows → the `prefunded_reserve` bucket → existing `selectHeldReserve` → the SAME "Set aside" bar zone (2.4.6.1.5). tsc 0, regression green, 0 console errors, demo unchanged (no crunch). **End-to-end verified via debug:** no crunch → reserve 0 (correct); a genuine carry-track crunch (`carriedBalances [410, −160, 50…]`) → reserve 210 (cycle 0 holds its surplus), which `allocatePaycheck` clamps to cycle-0's real above-floor headroom. **⚠️ model note for .6:** the water-fill's carry track counts the floor as a one-time carrying balance (`bal_0 = floor + net_0`) while the allocation re-reserves the floor each paycheck — reconciled by the allocation's clamp for the ACTIONABLE cycle-0 reserve, but the two cushion models should be confirmed aligned (same theme as the .4 flag). _Down-qualify-during-cold-start framing = a display flag → 2.4.11._
      - [x] **2.4.7.6 Surplus waterfall re-arch ✅ (2026-07-23; design agreed w/ Jason).** New order in `allocatePaycheck`: floor → **prefunded_reserve (own bucket, split from discovery_holdback)** → discovery/cold-start holdback → **starter EF (gated, `starter_emergency`)** → highest-priority debt (snowball, strategy-sorted) → **fuller EF (`emergency`)** → savings goals → leftover. **Decisions:** starter EF cap = **$1,000** (`STARTER_EMERGENCY_TARGET`, tunable — Jason leaned $500 but agreed $1k is the better target), capped at the goal target; **D5.3 gate** = new `hasSavingsElsewhere` pref (default off → build the starter; on → skip it, deploy to debt first), surfaced as a More→Preferences toggle. The recommended-actions surface **merges** the two EF tranches into one "Add to Emergency Fund" action (the split is internal to the waterfall order). tsc 0, regression green (+prefunded-split + 4 starter/fuller/gate reconciliation cases; updated 4 existing tests that the EF-tranche split touched). Demo unchanged (EF funded → inert), 0 console errors. **Models confirmed as-is (Jason): the .4 cumulative-cap + .5 carry-track-vs-allocation cushion models stand; persistent-cushion refinement → Connected tier.** _(Rich "EF-vs-APR choice-with-why" gate copy → 2.4.11.)_
      - **After-scan (2.4.7.6):** (a) the starter/fuller split makes debt get attacked sooner for users with a large EF goal (starter $1k before debt vs the old full-EF-before-debt) — the better strategy, noted. (b) **Two exploration agents ran (Jason-commissioned):** the **auto-cushion feasibility** → PARTIALLY viable (est-accrual view automatable now; floor-relaxation needs a re-anchor or bank tier) → filed to the Connected-tier backlog; the **premium future-features + roadmap-gaps audit** → captured in `docs/DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md` for Jason's review (top future features: Can-I-Afford-This? · Windfall Autopilot · Auto-Recovery; v1.7 gaps: 2.5 schema-starved, 2.6 catch-up plan, 2.9 Live Activity, 2.10 guarantee-StoreKit, "watches every paycheck" sequencing). ✅ Audit FOLDED into 2.5–2.11 + the future-features queue, and all open decisions RESOLVED (Jason agreed w/ recs 2026-07-23): 2.5 schema-add + heuristic (ML deferred) · 2.6 catch-up plan + Interest-Saved · 2.9 Live Activity · 2.10 guarantee (verify-then-"day 30"-framing) · "watches every paycheck" gated on 2.4.10.
      - [x] **2.4.7.7 Paused-deploy (§2.3.1) ✅ (2026-07-23).** **Before-scan:** verified the substrate — `missedArrivals` field + `recordMissedArrival` (idempotent) + `applyCapture`'s `actuals.missed` path all exist (2.4.D); scouted that paused-deploy needs INCOME-ZEROING in the allocation (not just Guardian copy) or the plan projects phantom income. **Built:** `selectPaycheckMissed(store)` (= `missedArrivals.includes(nextPaycheckDate)` — keyed to the current cycle's end, so a rollover auto-resumes); `buildAllocation` zeroes income when missed (only the windfall is real; projected cycles resume on the recurring income); `buildGuardianBrief` gains a `pausedDeploy` branch that **supersedes every read** (honest "a paycheck didn't land" + deploy 0 + `pausedDeploy` flag, never a phantom clear); `selectPaydayGuardian` passes it; store actions `declareMissedPaycheck`/`undoMissedPaycheck`; a "This paycheck didn't arrive" toggle in `PaycheckSheet`. tsc 0; +7 reconciliation asserts (missed → pausedDeploy · supersedes a would-be-clear · deploy 0 · no phantom copy · free no-safeMove); regression green. **Visually verified (Playwright, injected miss, premium):** coheres across the whole screen — hero "$0 · Short this cycle" · Guardian "A paycheck didn't land" + paused copy · Required Actions "cover from savings/next paycheck"; 0 console errors. **After-scan:** (a) a missed cycle must be EXCLUDED from the §2.9 scorecard (a miss ≠ a prediction miss) → **2.4.9** note; (b) a missed check must NOT lower `lean` (§2.3.1) — the substrate already routes a miss to `recordMissedArrival`, not a low income-actual, so lean-shrinkage excludes it (verified by construction) → confirm at **2.4.8**; (c) resume is automatic on rollover (nextPaycheckDate advances out of `missedArrivals`, which keeps the historical date for the scorecard). No new queue item.
      - [x] **2.4.7.8 Income learning ✅ (2026-07-23; nudge design shaped w/ Jason).** **Before-scan:** verified `incomeActualsLog` (misses excluded → they're in `missedArrivals`), the `recordDriftBaseline('learning')` seam (no-op passthrough, preserves the frozen baseline), `leanAmount`/`typicalAmount`; scouted that `updatePaycheck` re-anchors drift (`'user'`) → the learning apply must BYPASS it via the seam or "days ahead/behind" resets. **Built:** pure `packages/core/income/suggestLean.ts` — shrinkage floor (`typical×0.85`) below N=12, 12th-percentile at N≥12, **smoothed handoff** (blend over N=12→18 so lean doesn't lurch), outlier-robust by construction; +9 reconciliation asserts. App `selectLeanSuggestion` (premium + variable-income + material-change + not-dismissed only, min-N=3); `LeanSuggestionCard` (calm suggest-confirm on Today after the Guardian — up/down copy, "Update to $X" / "Not now"); store `applyLeanSuggestion` (routes through the `'learning'` seam so drift is NOT re-anchored) + `dismissLeanSuggestion` (+ `dismissedLeanSuggestion` field, won't re-nag until it moves). tsc 0, regression green, **visually verified (Playwright, injected variable-income + actuals):** up-nudge "reliably cleared about $2,125 — raise your floor?", 0 console errors. **After-scan:** (a) the confirm-required nudge IS the §2.3 "a large lean shift requires confirm" outlier-guard (never silent); (b) the lean drives the FORECAST (projected cycles), not the current paycheck, so applying reshapes the debt-free date — correct; (c) the down-nudge path exists (symmetric) but only the up-nudge was screenshotted — low risk. No new queue item.
      - [x] **2.4.7.9 Drill-down route ✅ (2026-07-23; design shaped w/ Jason).** **Before-scan:** verified the Progress `CashFlowSection` (Cushion|Timeline lenses, `CushionBars`+`TimelineLedger`) + the pushed-route pattern (`history`/`living-expenses` via `<Screen onBack>` + a `_layout` Stack entry) + `announce` + `withProjectedBalances`. **Built:** a pushed `/cushion-forecast` route (preserves "came from Today" + back, NOT a silent tab-jump) — a **Guardian-sourced header** (the nearest-tight-cycle forewarning from the same brief, which the standalone Progress visitor doesn't get; else "clear ahead") + the reused `CashFlowSection` (Cushion lens + the per-cycle "why" Timeline) + `announce('Cushion forecast')` on open; a **"See your forecast →"** button on the premium Guardian card (own a11y element, hidden while paused/stale). tsc 0, **visually verified (Playwright, premium, navigated in):** header + forecast bars render, back works, 0 console errors. **After-scan:** (a) the **floor-line-across the bars + an explicit crunch-highlight treatment** are viz refinements NOT added (the bars already color by `cushionStatus`; the demo is clear so no crunch showed) → **Phase-3 polish**; (b) reusing `CashFlowSection` gives BOTH lenses (satisfies "reuse `TimelineLedger`"). No new queue item.
      - **✅ 2.4.7 · CASH-FLOW BRAIN COMPLETE (2026-07-23) — whole-item after-scan across the 9-leaf phase.** The forecast is now **state-threaded** (balances shrink, retired minimums free), **valley-on-lean**, with **crunch detection → backward water-fill → prefunded reserves** wired into the plan, the **surplus waterfall re-arch'd** (prefunded-split · starter/fuller EF · savings-elsewhere gate), **paused-deploy** for missed income, **income-learning** (suggest-confirm), and a **drill-down** surface — coherent end-to-end. **Consolidated deferral ledger (filed):** debt-free-date one-engine-two-runs → backlog · persistent-cushion → Connected tier · missed-cycle scorecard exclusion → 2.4.9 · .8 down-nudge + .9 floor-line/crunch-highlight → visual/Phase-3 polish · premium-audit gaps → folded into 2.5-2.11. **Retroactive lesson:** the WeakMap-cache-by-immutable-store pattern (2.4.7.5) is the way to memoize expensive forecast-derived selectors on a hot path — reusable. **Test debt:** `projectedIncome`/`suggestLean`(core, in-runner) tested; the app-layer tsx files still aren't in `validate:release` → Phase-4 RN harness (already tracked). tsc 0, full regression green throughout; every leaf visually verified both/either theme, 0 console errors.
      - **Exit:** forecast state-threaded + reconciliation-green · water-fill correctness proven by the suite · prefunded visible · waterfall re-arch'd · paused-deploy + income learning wired · drill-down route live; both themes; tsc/regression green. _(§2.5 v6 = the artifact; each leaf before-+after-scan; .6/.8/.9 shape design w/ Jason at their switch-in.)_
    - [x] **✅ 2.4.8 · Graduation COMPLETE (2026-07-24).** The Guardian + full autopilot now PERSIST past debt-free — spare re-targeted to savings/wealth (EF→goals), never "cushion"/"debt". All 6 leaves: (.1) de-gated `selectPaydayGuardian` (no null at debt=0; deploy target from the actual EF/goals allocation items) + `selectDeployedToSavings`; (.2) debt-free copy branch in `buildGuardianBrief` (`debtFree` flag → "toward your {goal}" / "Extra savings" / "contribution" / "for your goals"; all paths + paused/shortfall retargeted); (.3) render home — debt-free flows into the SAME autopilot with a calm PERMANENT `GraduationBanner` + `FreedomNextChapterCard` (the app's first cross-app handoff via `ffp://` scheme + App Store fallback), design LOCKED w/ Jason (spectacle stays Phase 3); (.4) substrate persists (prediction-stamp/calibration/income-learning keep running — brief non-null now; §2.4.7.7(b) confirmed by construction); (.5) `CyclePrediction.debtFree` regime marker (2.4.9 grades debt vs debt-free separately); (.6) verify — +11 debt-free reconciliation asserts (`testBuildGuardianBrief`, in the runner), tsc 0, full regression green, visually verified premium+free both themes, 0 console errors. **⭐ AFTER-SCAN:** the whole-plan-replacement was a bigger gap than the spec stated (fixed in .3); `allocatePaycheck` + `heroFraming` + `PlanHero` already handle debt-free (no engine/hero work needed); free-tier bar honestly shows a "To savings" zone. **Deferrals filed (none silent):** (a) **✅ RESOLVED (Jason 2026-07-24):** the real Freedom App Store product URL (`id6789297671`) is wired into `utils/ecosystem.ts`'s fallback; (b) the `ffp://` deep-link + fallback real-device handoff (+ possible `LSApplicationQueriesSchemes`) → **Phase 6** device-QA (browser can't exercise a URL scheme); (c) 2.4.9 must READ `prediction.debtFree` to segment regimes + exclude missed cycles (§2.4.7.7(a)) → folded into the 2.4.9 decomposition below. No version-necessary work surfaced beyond (a).
    - [ ] **2.4.9 · Calibration + reworked scorecard ▶ ACTIVE (decomposed at switch-in 2026-07-24).** Silent internal calibration first; then an honest visible scorecard ("how often my read matched what you confirmed") homed in the drill-down. **⭐ MODEL LOCKED w/ Jason 2026-07-24 (before-scan finding — predictedState is off headroom, the outcome only stores `actualCushionHeld`, no floor stored):** grade **FLOOR-BREACH ON THE CUSHION** — predicted-reached-floor vs actual-reached-floor → false-clear (predicted hold, actually dipped below) / false-tight (warned, actually fine) / match; **store `floor` on the prediction** (additive, like `debtFree`). **Fixed income = score ONLY genuine risk-events** (surprise outflow OR predicted below-floor), else the day-one-protection framing (NOT a hollow ~100%) — the same metric filtered, NOT a separate dimension. Structure-first (scoring core → gates → fixed-income filter → silent/day-one → copy → surface → verify):
      - [x] **2.4.9.1–.3 ✅ Pure scoring core (2026-07-24)** — `packages/core/guardian/calibrationScore.ts` (selector-free, +33 asserts in the runner): `classifyCycle` floor-breach (`match`/`false_clear`/`false_tight`) + `floor` stored on `CyclePrediction` (populated from `brief.floor`); `scoreCalibration` folds exclusions (unconfirmed/`disturbed`/`restampedMidCycle`/provisional/**missed**) + regime segment (`prediction.debtFree`) + N≥4 gate + fixed-income risk-event filter (surprise-moved-cushion OR predicted-below-floor; else uncounted) → `{n, matches, falseClears, falseTights, matchRate, dominantError, proven}`. tsc 0, full regression green.
      - [x] **2.4.9.4 ✅ Silent-first + proven gate (2026-07-24)** — `selectCalibrationScore(store)` runs the score SILENTLY every render off the confirmed history for the CURRENT regime; `.proven` (n≥N) gates number-vs-day-one, `.dominantError` drives the own-the-miss copy branch. The day-one-protection STATE render/copy folds into .5/.6 (the surface). _(After-scan: scorecard grades the current regime → a just-graduated user reads n=0 debt-free → day-one state, honest; `predictedState`/`plannedIncome` unused by the cushion-based model, serve other consumers — no dead-field cleanup needed.)_
      - [x] **2.4.9.5 + .6 ✅ Scorecard copy + surface (2026-07-24, design LOCKED w/ Jason).** `GuardianScorecard` section at the bottom of `/cushion-forecast` (premium): headline "X of N reads matched" (count form), "what this proves" line, false-clear ("Under-warned") + false-tight ("Over-cautious") shown separately, a dominant-error honest line only below the DECOUPLED warn rate (false-clear-heavy OWNS it), unproven (<N) → the §2.0.d "Protected since day one" state (no number/apology). Visually verified 3 states (day-one · proven-good · proven-weak-own-the-miss) dark+light, 0 console errors.
      - [x] **2.4.9.6R ✅ Forecast drill-down → premium CASH RUNWAY chart (2026-07-24, design w/ Jason).** ⛔ FIRM DIRECTIVE (Jason): NEVER dress a free element as premium — the free `CashFlowSection` bars are GONE from the drill-down. Replaced by a real Skia data-viz (`CashRunwayChart` + platform-split canvas + pure `CashRunwaySkiaChart`, web via `WithSkiaWeb`): plots each of the next 6 paychecks' **BREATHING ROOM** (`cycle.net` = income − essentials, the SAME floor-relative headroom the Guardian's band uses) vs the floor line — a below-line paycheck (a crunch free's clamped bars can't show) dips visibly; **tap any cycle** → its plan receipt (Income − Essentials = Left-after-essentials, reconciling per-cycle numbers), + the honest cycle-0 `prefundedReserve` "setting aside $X" note. `selectWaterFillPlan` exposes the full plan. **⭐ 2 Jason bugs fixed same session:** (1) per-cycle "sets aside" used `reserveByCycle` (a CUMULATIVE deploy-cap → inflated $7k garbage) → replaced by the single honest cycle-0 reserve; (2) plotted raw cumulative `carriedBalance` (no-deploy → inflated "$10k cushion") + bad "Cushion then" label → switched to per-cycle `net` ("Left after essentials"). Visually verified crunch+clear, both themes, math reconciles, 0 console errors. _(Minor polish noted: the "your $200 line" label can overlap the runway near the right edge.)_
      - [x] **2.4.9.7 ✅ Verify (2026-07-24)** — floor-line label pulled OUT of the plot into a legend (no runway overlap, Jason); tsc 0, full regression green, crunch+clear both themes, math reconciles, 0 console errors. Native Skia-chart device render → Phase 6.
      - **⭐ SURFACED (Jason 2026-07-24) → filed to 2.4.11:** the Guardian's read is too prose-heavy (card + forecast + all copy) → the `[design w/ Jason]` **Guardian presentation reshape** (present the read VISUALLY, numbers/allocation as presentation, not paragraphs). Premium-quality-bar, not a bug.
    - **✅ 2.4.9 COMPLETE (2026-07-24) — whole-item after-scan.** Honest floor-breach calibration (scoring core → scorecard → silent/day-one) + the premium **Cash Runway** chart replacing the free-copy drill-down. **⭐ Retroactive lessons (Jason-surfaced):** (1) **never dress a free element as premium** — a premium surface must show what free STRUCTURALLY can't (the un-clamped below-floor dip free's clamped bars erase); (2) **when surfacing an internal engine quantity, confirm it's the user-facing PER-CYCLE figure, not a cumulative internal one** — both chart bugs (`reserveByCycle` cumulative deploy-cap · `carriedBalance` cumulative no-deploy) leaked internal quantities into a user number; the fix (plot per-cycle `net`) also re-aligned the chart to the Guardian's OWN band model. **Deferrals (filed):** Guardian presentation reshape → 2.4.11 · Skia native device-QA → Phase 6 · further chart refinement → Phase 3 (Jason) · app-layer selector tests → Phase-4 harness. No version-necessary work left open.
    - [ ] **2.4.10 · Proactive notification ▶ ACTIVE (decomposed at switch-in 2026-07-24).** A neutral risk prompt that brings the user back before a crunch — native delivery batches with 2.9, but the decision logic + copy + scheduling substrate build now. Structure-first:
      - [x] **2.4.10.1 ✅ Decision core (2026-07-24)** — pure `packages/core/guardian/notificationDecision.ts` (+19 asserts in the runner): `decideRiskNotification` = RISK-only (`at-risk` fires; clear/tight in-app) → same-cycle escalation (suppress unless new/worse vs `currentCycleNotifyState`) → hard rolling-window cap (`pushesInWindow`, ≤2/30d); returns `{fire, level, reason}`. tsc/tsx 0, full regression green. **After-scan:** we only ever push `at-risk` so `notifiedRiskLevel` is always at-risk, but the RANK compare future-proofs a later tight-push; the `reason` aids the notify-log/debug. Consumes the 2.4.D substrate — the app selector + stamping producers are .3. **⚠️ deep-link (.4):** the RISK push should ultimately land on the Recovery plan (2.6, unbuilt) → interim target = the shortfall Guardian card on Today.
      - [x] **2.4.10.2 ✅ Neutral copy (2026-07-24, Jason-approved).** `RISK_NOTIFICATION` = "Time to check this paycheck" / "Take a quick look at your plan before this one lands." — under-claims by design (never a verdict / a figure; safe for a never-opened user). In-app **reconcile-to-clear acknowledgment** built: "Good news — this paycheck looks clear after all." + "Got it".
      - [x] **2.4.10.3 ✅ Scheduling + selectors + actions (2026-07-24).** `selectRiskNotification(projectedStore, now)` (premium-only, off the Guardian band + notify substrate) → `decideRiskNotification`; `selectRiskAcknowledgment` (notified-this-cycle + now-clear); store actions `applyRiskNotified` (stamps `currentCycleNotifyState` + bounded `pushLog`, ONLY on real delivery) + `acknowledgeRiskCleared`. Wired into `use-notification-sync` (schedule on risk-signature change, stamp only if delivered → web never falsely marks notified; cancel-on-reconcile-to-clear). tsc 0, regression green, ack banner visually verified (premium, 0 errors).
      - [x] **2.4.10.4 ✅ Delivery hooks (native) wired — real delivery → Phase 6.** `scheduleRiskNotification`/`cancelRiskNotification` (expo-notifications, `ID_RISK` in `ALL_IDS`) + `.web` stub returns false (never stamps). Interim deep-link target = Today's shortfall Guardian card (→ Recovery plan once 2.6 ships). **[BUILD, Phase 6] real device delivery + rollover-while-backgrounded reliability** (schedule-time compute is provisional; a never-opened user gets the provisional read — the neutral copy makes that safe).
      - [x] **2.4.10.5 ✅ "watches every paycheck" UNBLOCKED** — the notification backing now exists; the paywall copy itself lands at 2.10.
      - [x] **2.4.10.6 ✅ Verify** — decision core reconciliation-tested (+19); ack + web-inert delivery verified; native delivery → Phase 6.
    - **✅ 2.4.10 COMPLETE (build phase, 2026-07-24) — whole-item after-scan.** The proactive risk push is logic-complete + wired; only real native DELIVERY + rollover-while-backgrounded reliability remain (Phase-6 device-QA, batched w/ 2.9). Premium-only ("watches every paycheck"). **Deferrals (filed):** native delivery + backgrounded-rollover → Phase 6 · deep-link to Recovery → 2.6 · `selectPaydayGuardian` computed twice (Today + sync hook) → Phase-4 memo. No version-necessary work left open.
    - [ ] **2.4.11 · Reshapes + demo + one-tap ▶ ACTIVE (decomposed at switch-in 2026-07-24).** The last Guardian item before the tier plumbing — polish the honesty edges + the launch-critical demo + the tight-case action. Structure-first:
      - [x] **2.4.11.1 ✅ Guardian PRESENTATION reshape (2026-07-24, w/ Jason).** The Payday Guardian card is now a VISUAL read, not a paragraph: the figures are a **stat row** (Cushion / To debt / Your line), each marker a mini bar-segment swatch (or vertical line for the floor) that **aligns with the cushion-bar zones**; the prose paragraph is kept ONLY for the states where the message matters (shortfall / missed / stale). **⭐ EXACT AMOUNTS (Jason bug):** every concrete figure is now exact whole-dollar (the hero's number) — `amt()` was hedging DOWN to the nearest $5/$10 ($96→"$95"); it + the removed `about()` are gone, the projection honesty stays in the WORDING. Consistency sweep: card + lookahead + free-tier read + runway all exact (scorecard is counts; the LeanSuggestion "about" is an honest learned-estimate). tsc 0, regression green, both themes verified. _(Graph interactivity → Phase 3, Jason.)_
      - [x] **2.4.11.2 ✅ Tight-case one-tap (2026-07-24, design w/ Jason).** **Before-scan finding:** in a premium tight cycle the plan is already all-cushion (deploy 0), so the spec's "defer a goal / drop snowball" levers are already off — the real lever is tapping savings. **Decided w/ Jason:** an honest CALM state + a REAL one-tap ONLY when a lever exists, never a manufactured action. Built: (a) tight read reshaped CALM ("You're covered this paycheck … your cushion rebuilds next paycheck" — a low-cushion cycle, not a failure); (b) `selectTightTopUp` (premium + tight + savings-with-balance) → the "Move $X from [savings] to hold your line" one-tap; `applyTightTopUp` draws it from the goal + records a cycle-KEYED `cycleTopUp` (self-correcting, no migration); the Guardian read lifts the cushion → "Your line's held" acknowledgment; (c) no savings → the honest calm state, no fake action. tsc 0, +3 asserts, regression green; mechanism verified visually (cushion $210→$500, tight→clear on tap). _(Copy visual pending a dev-server `--clear` — `@core` HMR was serving stale copy.)_ **⭐ CROSS-SURFACE AFTER-SCAN:** **✅ FOLDED** — a topped-up cycle is a user intervention, so it's now marked `disturbed` (EXCLUDED from the §2.9 calibration scorecard — else "held via savings" would grade as a natural prediction outcome). **Filed for the convergence audit / Jason:** (a) `selectTightTopUp` currently offers the EMERGENCY fund (find-order) — raiding the safety net for a covered-but-tight cushion dip is questionable; prefer a discretionary savings goal, EF last-or-never (design call); (b) after a top-up the HERO shows paycheck flow ("$210 free") while the Guardian shows total cushion ("$500 held") — different concepts, possible coherence confusion → audit coherence lens; (c) no UNDO for the top-up (missed-paycheck has one) → backlog. **Noted (fine):** partial top-up (savings < gap) stays calm-tight; Progress/runway don't reflect the one-cycle top-up (they're future-cycle forecasts).
      - [x] **2.4.11.3 ✅ Cold-start intro + advice boundary (first-run) (2026-07-24, design shaped w/ Jason).** **⭐ SCOPE CUT (Jason):** the §2.1 *"based on what you've entered — not your bank"* line DROPPED (Plaid on the horizon, opt-in → committing to "not your bank" would go false; keep it clean) → item is premium-only, no free-tier change. Built: `prefs.guardianIntroSeen` (additive, migration-backfilled) · a calm inline dismissible **first-run intro** atop the Guardian on the first premium view (*"Your floor is protected from today. As you log each paycheck, I learn your floor and put your money to work more precisely. Guidance from your numbers — not financial advice. Your call."* `[Got it]`→`updatePrefs`) — non-monotonic/non-surveillance wording per round-6 · a standing **"Your call"** caption under the safe move · wired in Today (`showIntro=isPremium && !!guardian && !guardianIntroSeen`). tsc/lint/test:app green; **e2e 8/8** (added 3 intro specs on the RS.6 harness — shows-once+dismisses / absent-when-seen / free-absent); **visually verified both themes** (calm inset, equal-premium light+dark). **After-scan:** (a) on the FIRST view "not financial advice. Your call." shows in the intro AND the standing "Your call" under the move — one-time overlap, acceptable (intro is once-ever); (b) intro fires for mid-stream upgraders too (backfill false) — intended, copy holds; (c) intro shows in any premium first view incl. tight/shortfall — fine (it introduces the feature, not the per-state read). No new deferrals.
      - [ ] **2.4.11.4** valley debt-free band · advice boundary · reserve insurance-tapped / attestation-walkback copy.
      - [ ] **2.4.11.5** **BOUNDED demo** (launch-critical) — a scripted premium showcase bounded to cold-start reality (never a matured Guardian the month-one buyer can't be) + a free-at-risk demo state.
      - [ ] **2.4.11.6** Verify — both themes both tiers.
    - **⏸ FEATURE WORK PAUSED (Jason 2026-07-24):** 2.4.11.3–.6 · 2.5 · 2.6 are paused behind the regression baseline (now COMPLETE — see below). Resume once the post-baseline gate (convergence audit) clears or Jason elects to resume features.
    - [x] **⭐ RS · COMPREHENSIVE "BREAK-IT" REGRESSION BASELINE ✅ COMPLETE (2026-07-24) — GREEN ACROSS THE BOARD.** All 7 leaves done (RS.1 harness · RS.2 selectors · RS.3 store actions · RS.4 core fuzz · RS.5 persistence · RS.6 RN-web e2e harness · RS.7 green-gate). Suites: core `test:regression` · app `test:app` (RS.1–5) · `test:e2e:rn` (5/5) · `validate:release:rn` runs the lot green. **Bonus infra the phase surfaced + paid down:** the RN app got its FIRST e2e harness (RS.6) + its FIRST scoped lint (RS.7) — both were absent. **⭐ 2 real money-path bugs found + fixed (RS.4).** **WHOLE-PHASE AFTER-SCAN (HARD, done 2026-07-24): (1)** the 2 bugs were ONE class (non-finite input → money output); swept the engine for the `Math.min(acc,x)`/`Σ`-over-array pattern → CONTAINED (only `waterFill` leaked; `holdbackComposition`/`buildPayoffTrajectory` operate on guarded-upstream values). Retroactive consistency: RS.2's bad-input tests sanitize to `null` UPSTREAM of `waterFill`, which is why the bugs only surfaced at RS.4's direct-engine level — confirms the fixes are defense-in-depth. **(2)** the new RN lint immediately caught a real dead import — a standing dividend. **(3) ORPHAN CHECK (coherence):** verified ALL 6 app-layer `*.test.ts` are wired into `runAppTests` AND all 51 core test files are referenced in `runRegressionTests` — no silently-non-running suite. **(4) CROSS-PLAN retroactive catches:** **Phase 5.5.4 (RN eslint-config-expo) is DONE early** (RS.7 delivered it — marked in Phase 5.5); **Phase 4's headline "real automated test harness" is largely DELIVERED** by this baseline (noted in Phase 4). **(5) DEFERRALS FILED to the Phase-4 residual backlog** (not left as inline parentheticals): extend `testEngineFuzz`→`holdbackComposition`; e2e missed/stale/debt-free + mobile viewport; app-layer low-risk CRUD actions. **(6) ✅ LEGACY GATE RETIRED (Jason 2026-07-24):** `validate:release` now runs the RN gate (`→ validate:release:rn`); the old Next-app gate is parked as `validate:release:legacy` until Phase 5.5.1 removes the Capacitor/Next tree. **▶ REPLENISHMENT (active-build slot):** with the baseline green, the paused Guardian feature work resumes (Jason 2026-07-24: remaining Guardian work comes BEFORE the convergence audit). **Next active build = 2.4.11.3** (§2.1 boundaries + cold-start intro), then 2.4.11.4→.5→.6 · 2.5 · 2.6-Recovery; the Guardian CONVERGENCE AUDIT is the gate AFTER that Guardian work, not now. 2.4.11.3–.6 are honesty/UX copy → design-shaped, so align with Jason before building (2.4.11.3 shaping IN PROGRESS). _(Legacy gate: RETIRED per Jason 2026-07-24 — `validate:release`→RN gate.)_
    - [ ] **⭐ RS(archived header) · COMPREHENSIVE "BREAK-IT" REGRESSION BASELINE (decomposed at switch-in 2026-07-24).** Test AND break everything; **green across the board before v1.7 ships** (Jason). Pulls the Phase-4 RN test-harness FORWARD. **Before-scan finding (corrects the vitest assumption):** store+selectors have ZERO `react-native`/`expo` imports (pure `zustand`+`@core`+`@/data`); `apps/rn/core` symlinks `packages/core`; **`tsx` from `apps/rn` resolves the RN aliases** — VERIFIED a selector importing `@core` values runs under tsx with no RN mocks → a **LIGHTWEIGHT tsx harness**, not vitest. Canonical = `docs/REGRESSION_BASELINE_2026-07-24.md`. Structure-first; before/after scan each RS.x:
      - [x] **RS.1 ✅ Harness (2026-07-24).** `apps/rn/src/testing/runAppTests.ts` (tsx runner, sequential `await import`, `.catch`→exit1) wires the 3 existing app-layer tests (`substrateProducers`/`projectedIncome`/`guardianPrediction`). Scripts: `apps/rn` `test:app` = `tsx …runAppTests`; root `test:app` = `npm --prefix apps/rn run test:app`; new root `test:all` (core+app) + **`validate:release` now chains `test:app`** (app-layer green-gated). Verified green from root (core + app). **After-scan:** the wired tests `process.exit(1)` on failure (hard exit — bypasses the runner's `.catch`, so a fail dies without the footer but still non-zero = correct red gate); RS.2+ tests should THROW instead (the runner aggregates/reports) — the pattern to follow. No new deps (tsx, not vitest — before-scan held).
      - [x] **RS.2 ✅ Guardian selectors (2026-07-24).** `guardianSelectors.test.ts` (+36 asserts, throw-based): `selectPaydayGuardian` across **all states × tier × regime** (null/clear/tight/at-risk/shortfall/debt-free-persists/free) + **break-it** (`abc`/`NaN`/`-500`/`0`/spaces/`Infinity` → null no-crash; huge → clear + finite viz); `selectTightTopUp` (offer/gap/cap/no-savings/clear/free); `selectRiskNotification` (premium at-risk fires · free none · clear none · freq-cap); `selectCalibrationScore` (empty → not-proven/null/n0). Fixture builder from `createDefaultStore`. **After-scan:** `GuardianBrief` doesn't expose `shortfall` (input-only) — assert on the title; fixture precision matters (a dropped debt-minimum flips tight↔at-risk). `selectWaterFillPlan`/`selectDeployedToSavings` exercised indirectly (prefunded/debt-free deploy) → a direct planSelectors suite can follow in RS.3.
      - [x] **RS.3 ✅ Store actions + transitions (2026-07-24).** `storeActions.test.ts` (+57 asserts, throw-based) via `createDebtStore()` wired actions + the pure `applyCapture`/`applyRollover`/`runMigrations`: **capture** (fixed-deterministic · reported-actual · missed→arrival-axis · surprise-outflow + non-positive-ignored · re-capture-replaces · variable-no-actual-skips) · **rollover** (advances dates · bumps genuineCycleCount · clears windfall + completed-actions · appends snapshot · **double-apply no-crash monotonic**) · **missed/undo** (idempotent) · **lean** (apply sets floor+clears dismissal · dismiss records) · **top-up** (draws goal · accumulates · **over-draw clamps at 0**) · **risk-notified** (stamps state · **push-log bounded to 24** · ack clears) · **floor clamp** (snap-25 · cap-1000 · neg→0 · NaN/Infinity→200) · **windfall** (neg→0) · **reset** · **migration/import** (null/array/string throw · partial→v5 backfill · idempotent · importStore routes through). **After-scan:** `verifyDebtBalance(s)` round/clamp (money-adjacent re-anchor) NOT in RS.3's enumerated scope → deferred to RS.4/RS.5; `CompletedRecommendedAction.category` is `snowball|emergency|optional_goal` (not `debt`) — fixture corrected.
      - [x] **RS.4 ✅ Core adversarial/fuzz (2026-07-24).** `testEngineFuzz.ts` (+1835 asserts) hammers the newest, least-covered cash-flow-brain + income engine fns (`detectCrunches` · `waterFill` · `suggestLean`) with the break-it menagerie (NaN/±Inf/neg/zero/1e12/fractional × empty/single/all-below-floor/flat) — asserts no-crash + finite outputs + invariants (segment index bounds, reserve-length alignment, non-negative reserves/deficit, n counts only finite-positive). **⭐ Caught + FIXED 2 real money-path bugs:** (1) `waterFill` suffix-min cap folded a non-finite balance into `running` (`Math.min(x, NaN)` cascaded NaN into every reserve) — added the finiteness guard (parity w/ `detectCrunches`); (2) `suggestLean` echoed a non-finite `currentLean` straight out when no usable actuals — guarded the echo. Also folded in the RS.3-surfaced `verifyDebtBalance(s)` clamp/round/date-stamp asserts (app-layer, +6 → RS.3 file now 63). **After-scan:** the two fixes are defense-in-depth (inputs are guarded upstream today) but close a real asymmetry; the root stray `tsconfig.json` (untracked, pre-existing) errors on RN alias resolution — NOT from these files (RN `typecheck` green).
      - [x] **RS.5 ✅ Persistence/migration + corrupt-data (2026-07-24).** `persistenceLifecycle.test.ts` (+21 asserts) drives the store's ASYNC `hydrate`/`save` through a tracking `StorageAdapter`: first-launch seed (1 write) · clean current-version hydrate (NO rewrite) · older-version → migrate + persist · **corrupt non-object → quarantine('migration-failed') → fresh defaults → overwrite, stay hydrated (never brick)** · malformed-nested (`debts:'nope'` → map throws → same quarantine path) · array blob → quarantined · `save` writes + clears the saving flag · `runMigrations` structural edges (future version stamped-down · partial-prefs merge · unknown-field forward-compat passthrough). Complements `testSafeStorage` (key-level) + RS.3's `runMigrations` throw/backfill/idempotence. **Lesson:** the store lifecycle is async but top-level await is unavailable under the cjs transform → async app-layer suites **default-export their runner** and `runAppTests` does `await (await import(...)).default()` (sync suites still self-run on import). **After-scan:** the quarantine/recover path is robust — no bug surfaced; hydrate correctly never writes corrupt bytes back.
      - [x] **RS.6 ✅ Integration/e2e — NEW RN-web Playwright harness (2026-07-24).** **⚠️ Premise-drift caught at switch-in:** the root `tests/e2e` suite targets the LEGACY Capacitor/Next app (:3000, static `out/`); the RN app (where the Guardian lives) had NO e2e harness. So RS.6 STOOD ONE UP (Jason: "set it up"): `apps/rn/playwright.config.ts` (serves the STATIC `expo export --platform web` → `dist/` SPA via `serve -s` on :4319, not Metro — same "serve the build, not the dev server" reasoning as the legacy config) + `tests/e2e/helpers/seed.ts` (localStorage `debtPlanner.rnStore` injection; `runMigrations` backfills a partial blob → minimal seed drives any state; premium = pure `subscriptionPlan==='premium'`, no IAP seam on web) + `tests/e2e/guardian.spec.ts` (5 specs: premium clear[read+safe-move+"Adjust your line"] · tight · **shortfall trouble-flow["won't cover everything"]** · free value-led gating[real read + invitation, no safe-move] · no-plan[card absent, no crash]). Root script `test:e2e:rn`. **5/5 green.** Web export builds clean (Skia/CanvasKit incl.). RN tsconfig excludes `playwright.config.ts`+`tests/` (node/@playwright, Playwright compiles its own). **After-scan:** the harness is reusable for ALL RN-web surfaces (not just Guardian) → future e2e rides it; `dist/`+`test-results/` already gitignored.
      - [x] **RS.7 ✅ Green-gate (2026-07-24).** New root `validate:release:rn` = `lint:rn && test:regression && test:app && test:e2e:rn` — **ran end-to-end GREEN across the board** (RN lint 0 · core all-passed · app RS.1–5 [36+63+21 asserts] · e2e 5/5). Kept the legacy `validate:release` (Next app) untouched. **⭐ RN-SCOPED LINT stood up (Jason directive — the whole-repo lint dragged in legacy Capacitor/Next and timed out >2min):** `apps/rn/eslint.config.mjs` (eslint-config-expo flat + the RN react-hooks/React-Compiler exemptions carried over from root + `_`-unused convention; ignores dist/.expo/core/tests/playwright.config) + `apps/rn` `lint` script + root `lint:rn`; installed `eslint`+`eslint-config-expo` in apps/rn (the "Phase 5.5 adopt eslint-config-expo" fix, pulled forward). **The new lint caught a real dead import** (`applyRollover` in `storeActions.test.ts`) — fixed; 1 style warning auto-fixed (`a11y.ts` Array<T>→T[]). Fast + RN-only now.
    - [ ] **2.10 gate (at the paywall)** — guarantee window/terms · pin annual + Lifetime prices · Lifetime-scope **[DECISION] BEFORE any StoreKit SKU is created**.
  - _(The 2026-07-22 "design-locked" 2.4.7 detail is superseded by the re-sequenced 2.4.7 above + `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` §2.5 v6 — the water-fill smoothing, waterfall re-arch, drill-down route, and Freedom capstone all live there. Full history → MASTER_PLAN_LOG.)_
_(⭐ Premium audit folded in 2026-07-23, Jason-approved — detail → `docs/DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`.)_
- **2.5 Smart obligation quality layer — ⚡ DESCOPED (audit).** The Core ML classifier is **schema-starved** (`Expense`={name,amount,dueDate,recurrence,isAutopay} — no category / trial-start / BNPL-term) → "smart detection" would degrade to a name-string heuristic (the LLM commodity the reshape avoids), and the strategy doc says the confirm-step already gets ~90% of the benefit with no detector. **✅ DECIDED (Jason 2026-07-23, agreed w/ recs) — v1.7 = (i) ADD the capture fields** (obligation category · trial/first-seen date · BNPL term/installments-remaining · amount-variance — cheap schema work, fits the substrate) **+ (ii) a lightweight on-device HEURISTIC** (finite-BNPL auto-expiry via term · trial-lapse via first-seen · amount-variance). **Core ML model → deferred** to the cash-flow future. Finite-BNPL auto-drop (the headline) needs the term field — the concrete case justifying the schema add.
- **2.6 Close-the-loop verification + ⭐ THE RECOVERY PLAN — ⚡ EXPANDED (audit) · flagged a MUST-NOT-GLOSS gap (Jason 2026-07-24).** **⛔ THE GAP:** the Guardian's SHORTFALL state today only DIAGNOSES ("you're about $X short of the bills and minimums — this one needs a plan") + gives GENERIC advice ("cover essentials first") — **it never builds the user's actual plan.** Naming the anxiety without relieving it is worse than silence; and this "I fell behind" paycheck is THE churn moment + the one place a chatbot is useless (it doesn't know YOUR bills / their deferability / can't DO it) → **the single biggest differentiator.** **The ACTIONABLE Auto-Recovery/Catch-Up PLAN** (from their data, reuses `allocation.unfundedRequiredItems` + `computeDrift` + paused-deploy §2.3.1): **Cover now** (true essentials) · **Safe to defer** (ranked lowest-harm: extra payoff→goals→debt minimum[late fee, recoverable, never rent]→BNPL) · **the gap math** ("deferring these frees $Y → covers all but $Z; smallest income to add = $Z, or it carries") · **honest un-closeable branch** (most it can do + what to protect first, never a fake "solved") · **ONE-TAP APPLY** (mark deferrals / drop snowball to minimums — obligations move only on explicit confirm). Framed RESCUE, not blame. **✅ DECIDED (Jason 2026-07-24): essential-vs-deferrable = HEURISTIC v1 + user override** (type-ranked: expenses essential · payoff/goals/minimums/BNPL deferrable; tap to re-tag) — the precise bill-category field is 2.5, not a blocker. **Note (D4/2.4.10):** the notification must deep-link INTO this, not a dead-end diagnosis. **⭐ CROSS-SURFACE after-scan (2026-07-24) — EVERY "you're in trouble" entry point routes to the plan, not just the shortfall card:** (i) SHORTFALL card (the headline); (ii) **PAUSED-DEPLOY** (missed paycheck — today only says "cover essentials from cushion" → same diagnose-without-help, route to Recovery); (iii) **a tapped RUNWAY-CHART crunch** (a looming below-line cycle — today shows the dip but no way to ACT → the forward/"plan-ahead" version of Recovery). The TIGHT (covered-but-under-floor) case is the sibling one-tap smallest-move (2.4.11). **+ surface the Interest-Saved counterfactual** (`computeInterestSaved` exists — un-chattable). Was under-scoped to just "recompute the date."
- **⭐ [AUDIT GATE] GUARDIAN CONVERGENCE AUDIT — SCHEDULED after Guardian complete (2.6 done) (Jason 2026-07-24).** A comprehensive ADVERSARIAL multi-lens review of ALL Guardian functionality (2.3 always-current balances + 2.4.x cash-flow brain + 2.5 obligation quality + 2.6 recovery) — the gate for a **THUMBS-UP that it's a genuinely premium product worth the asking price.** Flagship-feature method ([[feedback_adversarial_audit_until_consensus]]): rotated lenses, CONSENSUS is the gate.
  - **Lenses (rotate):** (1) **correctness/reconciliation** — engine math holds across every state; (2) **honesty/trust** — amounts EXACT (no false-precision), no cried-wolf, projection disclosures present, own-the-miss; (3) **PREMIUM-VALUE / worth-the-price** — does the 2.3+2.4 bundle justify the tier? un-chattable differentiators land? the recovery moment delivers? (4) **UX coherence** — ONE voice · ONE metric · ONE visual language across ALL Guardian surfaces · exact amounts everywhere; (5) **completeness/gaps** — every state handled (clear/tight/at-risk/shortfall/paused/stale/debt-free/graduation/cold-start) + every "you're in trouble" surface routes to HELP; (6) **free/premium line** — free finishes the job, premium is the flywheel, no paywalling basic function ([[feedback_no_paywall_basic_functionality]]); (7) **data-substrate integrity** — calibration/prediction pipeline sound, no demo/import leaks; (8) **cold-start reality** — 100% of week-one users have an honest experience.
  - **⭐ Phase 3 is EXPLICIT — delight + native are DEFERRED, NOT gaps:** the audit must NOT flag missing animation/haptics/scrubbing/native-widget/iPad/celebration as convergence gaps (those are Phase-3's charter). Instead it should ACTIVELY surface a categorized forward list → **(a) Phase-3 polish/delight · (b) enhancements to EXISTING functionality · (c) FUTURE enhancements** — captured to the backlog, not treated as blockers.
  - **Output:** a consensus verdict (thumbs-up = premium & worth-the-price) + findings triaged **MUST-FIX-before-ship vs Phase-3-polish vs future-enhancement.** Fold must-fixes into the version; file the rest.
- **⭐ [SHIP GATE + STANDING] COMPREHENSIVE "BREAK-IT" REGRESSION BASELINE — start NOW, GREEN across the board before v1.7 ships (Jason 2026-07-24).** Set a comprehensive automated-test baseline aimed at **TESTING AND BREAKING the system** — cover anything and everything we can think of, and it must return **green across the board** before 1.7 rolls out. Not happy-path only: adversarial + stress + edge + fuzz.
  - **Coverage layers:** (1) **core engine** (`packages/core/testing` — extend the reconciliation suites with break-it cases); (2) **app-layer** — the store actions + selectors that currently lack tests (the Guardian selectors/actions: `selectPaydayGuardian` states · `selectCalibrationScore` · `selectRiskNotification`/ack · `selectTightTopUp`/`applyTightTopUp` · graduation · substrate producers), which need the **RN app-layer test harness** (the Phase-4 item — PULL FORWARD; the `@core` value-import gap means pure/injected modules or a real harness); (3) **integration/e2e** (Playwright web — the Guardian surfaces + trouble-flows); (4) **native** (Maestro device flows).
  - **Break-it classes:** NaN/Infinity/negative/zero/huge inputs · empty & single-item states · every Guardian state × tier × regime (clear/tight/at-risk/shortfall/paused/stale/debt-free/graduation/cold-start/topped-up) · corrupt/partial persisted data + migration edges · double-apply / stale-cycle / concurrent-mutation · boundary values (floor, N-gates, freq-cap, percentile handoffs) · demo/import isolation (no calibration leaks).
  - **Standing practice:** every new feature lands WITH adversarial/edge coverage (not just happy-path), and the suite stays green at each checkpoint ([[feedback_playwright_maestro_testing]]). Pairs with the convergence audit's correctness lens. **The pre-ship bar: everything we can think of is covered AND green.**
- **2.7 Scan-to-prefill + change-detection** — Apple Vision OCR → pre-fill → confirm (semi-auto); free initial scan / **premium keeps-current = the recurring statement-photo balance re-anchor (future-feature #4, now scoped)** — the #1 capture-retention moat; native, L, confirm-required. Native scan UI batches with 2.9. _(OCR = risky greenfield + most chattable → fast-follow, NOT launch-critical.)_
- **2.8 Momentum reshaped — ⚡ (audit): make the Interest-Saved Ledger the SPINE** (the one always-true, un-chattable number), streaks demoted to support; persistent "debts-vanquished" archive (**verify it hooks the confirmed-$0 signal `verifyDebtBalance→0`, not a projected $0**) + living partner/accountability sharing (recipient never pays). _Retention, not headline._
- **2.9 Widget + App Intents + scan UI — ⚡ (audit): ADD the Live Activity payoff-countdown to the native batch** (self-updating debt-free countdown — top anti-LLM native moat; far cheaper batched while the toolchain is open) + **decompose the interactive-widget App Intents** (mark-paid / log-paycheck from the widget — so the premium interactive widget clears the removes-work bar vs the free glance widget). One native build (with Phase-E device work).
- **2.10 Revenue spine** — RevenueCat + paywall UI (port Gig) + Lifetime 2nd-offer + portfolio-sub seam + analytics + Sentry-8.18; **launch-flip gated on value shipped.** **✅ DECIDED (Jason 2026-07-23, agreed w/ recs): money-back GUARANTEE** — at the pre-SKU gate, VERIFY it's honorable through StoreKit; if it isn't (Apple mediates refunds), **default to the "annual not charged until day 30 — cancel free in month one" framing** (an honest guarantee we can actually deliver), never a refund promise we can't mechanically keep. **✅ DECIDED: "watches every paycheck" copy is GATED on 2.4.10** (the Guardian-state notification) shipping in the same build — no reorder (both are v1.7); the claim simply must not ship without the notification backing it (D4).
- **2.11 E2EE iCloud backup + AU/NZ readiness — ⚡ (audit): verify the ADP-status detection API exists** or fall back to **"encrypted iCloud backup"** wording everywhere (+ reconcile the stale "E2EE-by-construction" strategy line) — honesty-critical. _(Note: backup ≠ **sync**; multi-device sync deferred, named so it's not mistaken for done.)_

**▶ FUTURE PREMIUM FEATURES (post-Guardian, prioritized — audit Deliverable 1; scope into v1.7 vs v1.7.x/v1.8 w/ Jason):**
- **① Can-I-Afford-This? (the inverse Guardian)** — "can I take a $900 vet bill this paycheck?" → the engine re-solves the cycle (breach the floor? what to defer? one-tap protect + debt-free-date ripple). Reuses `allocatePaycheck`+`buildMultiCycleTimeline`; survives debt=$0 (afford-against-EF). **M.** _Top net-new pick._
- **② Windfall Autopilot** — found money → optimal split (cushion → starter-EF → highest-leverage debt) applied in one confirm; `store.windfall` exists, the split IS the waterfall. Two-sided-with-a-why (§2.1). **M.**
- ③ Life-Event Simulator → fold into the Phase-3 What-If explorer · ④ Strategy Auto-Advisor (one-tap apply, `selectStrategyComparison` numbers cheap) — low-pri enhancement · ⑤ Bill-shock autopilot → **Connected tier ~v1.8** (needs Plaid, not on-device).
- **⛔ DO NOT build:** refi/insurance shopping / rate-drop lead-gen — already CUT (violates "we never sell you more debt"); a trust liability.
- **Later (~v1.8): Premium Connected tier** — opt-in Plaid + isolated backend + 2nd StoreKit tier + transparent-disclosure UX (its own workstream; never gates the on-device tier). **Future: Ava AI tier.**
- _No paywall on the basic core job ([[feedback_no_paywall_basic_functionality]]); free finishes the job; lock price early, launch late. Un-chattable = stateful · scheduled · proactive · relational · on-device._

### Phase 3 — Delight + native platform
The emotional layer built *with* the features: the **debt-paid-off celebration**, milestone moments, progress-fill, animated counters, haptics, reanimated micro-interactions — and **genuinely-native iPad** (master-detail/multi-column, not a centered column). Restraint on daily surfaces; delight on the beats.
- **⚠️ HARD REQUIREMENT (from the 2.3 design, Jason 2026-07-22): the debt-paid-off celebration fires ONLY on a *confirmed* $0, never on a projected/estimated $0.** 2.3 establishes the gated trigger (projected-$0 → provisional invitation → confirm → the confirmed signal); Phase 3's full Skia spectacle + the permanent "debt-vanquished" archive entry hang off that confirmed signal. Never pat ourselves on the back for a projected-done.
- **Milestone-cross pulse (surfaced 1.4.R):** the journey-rail node should pulse (spring.bouncy) + haptic the moment a milestone is freshly crossed. Infra already exists — `store.milestoneMaxProgress` + payday.ts crossing-detection — so this is a cheap hook, not new plumbing. Lives here with the celebration system (needs prior-vs-current cross state, which the daily-render rail deliberately doesn't fake).
- **Tappable journey-ring milestones (surfaced 2026-07-21, Jason-agreed):** the on-ring milestone nodes become tap targets → a small detail ("25% — reached Mar 2026" / "50% — projected Aug 2026"). The v1 journey ring ships as a calm status display; interaction gets its own design discussion here in Phase 3. The on-ring node treatment was chosen partly to keep this a clean add, not a retrofit.
- **⭐ Guardian cushion-bar + Cash Runway interactivity pass (surfaced 2026-07-24, Jason — "already thinking of things to make it better"):** an interactivity/delight pass over the Guardian's graphs — the Payday cushion bar (tap/press a zone → its detail, animated transitions as the split shifts, haptics) and the Cash Runway chart (touch-scrub the runway for per-cycle values, richer crunch/floor treatments). The v1 bar + runway ship as calm static reads (with the aligned stat-row legend); interaction gets its own design discussion here. Pairs with the trajectory-chart layer below (shared gesture/haptic language).
- **Trajectory-chart interactive layer (surfaced 2026-07-21, Jason-agreed — the "premium impressive chart" ambition, split from the Phase-1 static-axes slice):** (a) **debt-payoff waypoint markers** on the curve — a dot (+ on-demand label) where each debt clears, so the snowball wins read as steps down the line (needs a small engine helper for per-debt payoff months); (b) **touch-scrubbing** — drag → a vertical guide + value bubble ("Mar 2027 · $6,240 left · 2 debts down") snapping to the curve, with a **haptic** tick crossing each payoff. Interaction + haptics + native-verify = Phase 3's charter; pairs with the milestone-cross pulse above. Phase 1 ships only the static legibility (axes/gridlines/ticks).
  - **⭐ Payoff-date treatment — DECIDED (Jason 2026-07-22, during the 2.2 What-If build).** Long design thread. Rejected: a **3-date bottom legend** (stacking fights "always clean") and a **3rd minimums date** (a number nobody acts on; minimums reads better as its trailing gray line + the "$X saved" figure). **Landed (shipped in 2.2):** exactly **TWO** permanent endpoint dates on the plot — **on-plan** (gold, at its finish bead) and **with-extra** (green, appears while simulating). Two dates are robust *by construction*: with-extra is always earlier → its label sits left, the plan's right, so they diverge and never overlap (the failure mode that killed 3 dates). Colors **line-matched**, **gold only where gold actually is on the chart** (the plan's finish bead) — never gold text unbacked by the plot. **The "$X · Y saved" (plan-vs-minimums) data is NEVER overridden** by the with-extra label (that override was the original bug). **Phase-3 enhancement (NOT now):** richer **on-touch scrubbing** — drag any line → a date+balance bubble at that point, all lines, + a haptic tick crossing each payoff (Skia-capable via the gesture-handler + Reanimated stack; needs the same **device QA** as the What-If slider — touch inside the Progress ScrollView = gesture arbitration). Architecture is ready — the chart holds the trajectory arrays + `mapX`/`mapY`, so scrubbing is a clean add, not a retrofit.
- **⭐ What-If full-impact explorer (Jason 2026-07-22 — POST-Phase-2, NOT now; captured forward idea).** Upgrade What-If from a *summary* (new date + savings + "goes to your Store Card" caption) to a **pressable, viewable drill-in that propagates the extra through the WHOLE model** — shows *exactly* where the extra dollars go **month by month** (the cascade across debts as earlier ones clear — effectively a dynamic per-cycle amortization of the extra) AND how that ripples through every connected surface: the **Cash-Flow cushion** outlook, the **projection/trajectory**, the **payoff order** — the model visibly re-solving to the extra. A deep "see the full ripple effect of paying $X extra" insight tool. **Cousin to the interactive-trajectory layer above** (both are What-If/projection interactivity — sequence together); shares the per-debt-payoff-month engine helper that item needs. **Substantial (cross-surface impact propagation) → likely its own slice or a v1.8 item, not a small add.** The Phase-2 What-If (summary + overlay) is the foundation this builds on.
- **⭐ History per-cycle detail drilldown (Jason 2026-07-22 — future enhancement, NOT now).** Each Pay Cycle History row becomes tappable → a detail view of that cycle: what got paid (per-debt / per-bill breakdown), the plan/allocation that cycle, starting→ending balance, the extra applied. Today the row is a summary (date · balance · paid · delta); the drilldown is the "open the receipt" layer. Needs the snapshot to retain enough per-item detail (`PayCycleSnapshot` may need enriching at capture time). v1.8+ candidate.
- **Revisit the bottom-up entrance animations (Jason 2026-07-21):** the `<Motion>` wrapper's `FadeInDown` rise-from-below entrance + stagger (`src/motion/Motion.tsx`, currently on Today) — Jason's "not sure they're the best now in RN." Reassess the app-wide entrance-motion language here: keep the rise-up entrances, soften them, replace with a subtler fade / Skia-driven reveal, or drop entrance motion on the calm surfaces entirely. Decide once, apply consistently (esp. before more screens adopt `<Motion>`).
- **⚠️ Per-screen iPad RE-EVALUATION required (Jason 2026-07-20):** the Phase-1 screens are elevated **phone-first** and look great on phone, but leave **a lot of empty space on iPad** — the current `Screen` centers a width-capped single column, which doesn't use the real estate. Every elevated screen (Today first) must be **re-evaluated + re-laid-out for iPad** (multi-column / master-detail / adaptive), NOT just a centered phone column. Do this as a deliberate pass in the iPad work, screen by screen.

### Phase 4 — Quality
A **real automated test harness** for the RN app (unit tests for store/selectors/money-math via the `packages/core` reconciliation pattern + e2e for the critical flows — Debt has none today; Freedom shipped with a full suite) + the whole-app gap analysis + reconciliation + both-theme visual verification, kept green.
- **✅ LARGELY DELIVERED by the RS "break-it" baseline (2026-07-24, pulled forward).** The RN app now has: a tsx app-layer harness (`runAppTests`) covering selectors + store actions/transitions + persistence/hydrate, the core engine fuzz sweep (`testEngineFuzz`), and its **first e2e harness** (`apps/rn/playwright.config.ts` over the static web export — RS.6). Green-gated via `validate:release:rn`. Continuous-quality (both-theme visual verification, whole-app gap analysis) remains the ongoing Phase-4 work.
- **Residual test-coverage backlog (RS phase after-scan, 2026-07-24 — low-risk, non-blocking):** (a) extend `testEngineFuzz` to `holdbackComposition` (the other `Math.min`-composition site; guarded-upstream today); (b) RN e2e beyond Guardian/desktop — missed-paycheck (paused-deploy) + stale + debt-free states + a mobile viewport project, riding the RS.6 harness; (c) app-layer coverage for the low-risk CRUD actions not in RS.3's money-critical scope (addGoal/updateGoal/markExpensePaid/toggleRecommendedDone).
- **⚠️ web-e2e harness gaps (surfaced across 2.2, 2026-07-22):** Playwright-on-RN-web can't reliably drive **gesture components** (the What-If `Slider` pan), **`SectionList` row taps** (Money debts), or **stacked modals** — synthetic clicks get intercepted / never fire even though real taps work. Screenshot workaround that DID work: **deep-linking to the route** (`page.goto(URL + '/history')`) instead of clicking through. Plan the harness around this: unit/selector tests for logic, deep-link + component-level for screens, and push gesture/tap flows to Maestro/native + device QA.

### Phase 5 — Data continuity + cutover _(🔒 ship-blocker)_
The migration bridge (existing WKWebView `localStorage` → RN storage), **proven on a real populated upgraded device**, then cutover to the RN app as the shipping app.

### Phase 5.5 — Repo consolidation / dead-code cleanup _(Jason 2026-07-20 — runs AFTER cutover, RIGHT BEFORE the Phase-6 release gate; NOT before)_
The repo currently holds **two apps**: the dead Capacitor/Next app at root + the shipping RN app in `apps/rn` (with shared `packages/core`). Once cutover (Phase 5) proves the RN app IS the shipping app, remove the Capacitor tree and consolidate to a single clean app so we don't ship a two-version repo.
- **5.5.1** remove the root Capacitor/Next surface (old `app/` God-files · `ios/` Capacitor bits · `next.config` · Capacitor config · WebView-only glue), keeping only what `apps/rn` + `packages/core` still use.
- **5.5.2 [DECISION]** final repo structure — promote `apps/rn` to root vs. keep the `packages/core` + `apps/rn` monorepo layout _(rec: keep the monorepo — `packages/core` is shared portfolio-wide; decide at switch-in)._
- **5.5.3** update tooling / CI / docs to the consolidated structure; tsc + tests + build green on the cleaned tree.
- **5.5.4 ✅ DONE EARLY (pulled forward by RS.7, 2026-07-24)** — `apps/rn` now has its **own `eslint-config-expo`** (`apps/rn/eslint.config.mjs`, flat) + `apps/rn` `lint` + root `lint:rn`; installed `eslint`+`eslint-config-expo` in apps/rn. RN code is now linted by RN rules (the react-hooks/React-Compiler misfires carried over as explicit offs). Pulled forward because the whole-repo lint dragged in the legacy tree and timed out, blocking the RS.7 green-gate. _(Root Next.js lint stays for the legacy tree until 5.5.1 removes it.)_
- **Deliberately deferred until release-gate-ready** (both trees stay useful references during the build). **Verify scope against the CURRENT tree at switch-in** — pre-authored cleanup drifts.

### Phase 6 — Launch-ready
**Acquisition-grade store presence** (screenshots + app-preview video + listing selling the active/emotional features + the trust moat) · **cold-start/first-run excellence** (a new user gets it in seconds) · **thorough device-QA gate** (full native surface + Freedom device-only lessons + iPad + the migration) · submit.

**📋 Device-QA ledger (accumulating — verify each on real hardware at the gate; web can't cover these):**
- **What-If slider drag** (2.2.2) — the `Slider` uses a gesture-handler Pan; confirm smooth drag on device AND that it doesn't fight the Progress `ScrollView`'s vertical scroll (gesture arbitration). First gesture in the app → `GestureHandlerRootView` now at root.

---

## Sequencing notes
- Phases 1–3 can interleave per screen (a screen's elevation + its active feature + its delight beat ship together — the cleanest way to hit the bar screen-by-screen).
- Phase 4 quality is continuous, not a tail step.
- The old V17 phases map in: migration → 1/5, revenue → 2, D.5 gap analysis → 0.4/4, D.6 polish/iPad → 1/3, release gate → 6.
- **Version framing is Jason's call:** stays the next shipped version ("v1.7 re-scoped as The Elevation"), or renumber if he prefers.

## Decisions
- **E1 ✅ APPROVED (Jason 2026-07-20)** — the design-first, best-in-class re-scope is ratified; Phase 0 is the active work. **Mode: "approve but talk through as we go"** — Phase 0 is collaborative; 0.1 IA comes back as a *proposal Jason shapes*, never a unilateral lock; the design-foundation GATE (his sign-off before any build) stands.
- **E2 ✅ APPROVED (Jason 2026-07-20)** — Phase 0 opens with **0.4 readiness audit** (solo, adversarial — running) + **0.1 IA redesign** (talk-through) in parallel; the audit informs the IA. 0.2 / 0.3 / 0.5 follow.

---

## 2.11 Revenue spine + Premium-framework audit — COMPLETE (2026-07-27)

_Commits (all local on `v1.7-dev`, unpushed): `3242f23` (Phase-2 rescope + P3-open audit) · `138c206` (2.11.1/2.11.2) · `d278c6a` (2.11.3) · `2e18b5a` (2.11.4) · `b9cb4da` (2.11.5) · `e1e4c99` (2.11.7) · `a0eadfc` (audit doc) · `611a4fb` (2.11.8 fix pass)._

- **2.11.1 [DECISION] ✅** — prices locked: Monthly $4.99 (already LIVE) · Annual $29.99 · Lifetime $79.99 (new); **Lifetime = on-device Premium forever, EXCLUDES Connected + Ava**; **no free trial** (the generous free tier is the proof window; a holiday promo trial is a reversible later add on the existing monthly); privacy claim "100% on-device". **⭐ Debt Premium was ALREADY live via Capacitor RevenueCat** (`lib/subscription/revenueCat.ts`: key `appl_XUWODZnbbJFPbdMTgBTyKNAGGyp`, entitlement `premium`, monthly-only) → the RN app REUSES that project (same bundle id `com.jasonsnyder.debtplanner` → v1.6 subs restore), adds only annual+lifetime. Jason completed the ASC + RevenueCat setup (products `paycheck_debt_planner_premium_{annual,lifetime}` + offering + `premium` entitlement). Checklist doc = `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md`.
- **2.11.2 ✅** — deleted the 100%-unused per-feature gating apparatus (`subscription/` dir gone); app gates uniformly via inline `subscriptionPlan === 'premium'` (documented in `models.ts`).
- **2.11.3 ✅** — ported Gig's vendor-agnostic facade → `apps/rn/src/premium/`: `purchases.ts` (pure, web-safe, entitlement `premium`) · `purchasesClient.ts`/`.web.ts` (`react-native-purchases@^10.4.4` behind `__DEV__`/iOS/key guard + public-key fallback; web stub no-op) · `legal.ts` · `premiumSync` `useInitPremium()` in `_layout` (drives `subscriptionPlan` off the entitlement, detached in dev/web so the Simulate toggle stands). Native pass LOW risk (no `.xcodeproj`, no config plugin); RN native build = Phase 5/6, device-QA owed.
- **2.11.4 ✅** — `app/paywall.tsx` modal route, Debt visual language, 3-plan layout (Annual preselected), billed-price-most-prominent + Apple 3.1.2 (disclosure/Terms/Privacy/restore); RevenueCat facade drives packages, static fallback on web. Both themes.
- **2.11.5 ✅** — shared `PremiumInvite` (tappable → `/paywall`) in Affordability + Guardian cards (Guardian free invite relocated OUTSIDE the narrated a11y group per MF.2). **⭐ Reviewer-findability (v1.1 was rejected repeatedly for a hidden paywall): an always-visible "Unlock Premium" row high in the More hub = the guaranteed path; premium users get manage-sub.** e2e 28/28, both themes.
- **2.11.6 ✅ (collapsed)** — analytics **SKIPPED for v1.7** (RevenueCat's dashboard already gives the purchase/conversion/revenue/churn funnel server-side, keeping "100% on-device" airtight; add paywall-VIEW analytics post-launch only if needed); **Sentry → Phase 6** (needs the RN native pipeline + DSN + config-plugin CI care); **portfolio-sub seam → deferred** (YAGNI — no cross-app sub product yet).
- **2.11.7 ✅** — `premium/config.ts` `PREMIUM_PURCHASABLE` KILL-SWITCH (defaults ON — premium already live, so a kill-switch not a net-new-tier gate; false hides every paywall entry + warns against submitting IAP for that review build). Full `validate:release:rn` green.
- **⭐ Premium-framework audit (Phase-2 close) — round 1 → CONDITIONAL PASS.** 7 independent adversarial lens-auditors (+ BNPL-cadence criterion) vs the real code/docs/market. Verdict: the framework is SOUND and justifies its price (automation identity genuine · free/premium line clean · pricing sound · projection-honesty exemplary · never-sells-debt upheld · moat defensible-as-ethics). No lens found the strategy wrong — every failure was a fixable storefront/wiring/copy defect + 1 correctness bug. Canonical verdict + triaged evidence + fix status = `DEBT_PREMIUM_FRAMEWORK_AUDIT_2026-07-27.md`.
- **2.11.8 fix pass ✅** — Section-A must-fixes + B1: A1 offering-load error state (no unpurchasable static prices on device; App Review 2.1) · A2 entitlement sync gated on `isHydrated` (no hydrate-clobber) · A3 already-premium → Manage, no re-purchase · A4/A5 legal links → rendered GitHub Pages (`jsnyde03.github.io/debt-planner-site/…`) · A6 Lifetime scope disclosed · A7 Lifetime owners get a distinct non-sub row (transient `premiumIsLifetime` off `productIdentifier`, no migration) · A8 removed the free "BNPL-aware" premium bullet · A9 Guardian headline → the action (not "know") · A10 "100% private/no uploads" → "financial data stays on your device" · A11 per-month anchor in the live path · A12 honestly-scoped moat line on the paywall · **B1 `projectDebtPayoff` cadence-normalizes BNPL minimums** (+3 asserts) · B-F1 deleted dead `DriftCard`. Verified: tsc · lint · core regression +B1 · app · e2e 28/28 · both themes.
- **Owed (NOT blocking the build):** launch-FLIP (Jason's value gate) · Phase-6 device/native verification (real RevenueCat purchases · `react-native-purchases` native build · restore for existing subs) · Sentry (Phase 6) · `site/privacy.html` content refresh v1.5→v1.7 (Jason).

---

## 3.5.0 — `createSandboxStore` substrate — ✅ COMPLETE (2026-07-30)

The ephemeral, scriptable, isolated Guardian sandbox the whole of Phase 3.5 stands on. Seven leaves, all
gated green (tsc · lint · core regression · app · scenarios · e2e 90). Commits `b750d23` · `1990425` ·
`bac41b4` · `629f582` · `31a813a` (+ the 3.5.0.6/3.5.0.7 close).

**What shipped, layer by layer:** `sandboxStore` (isolation · frozen clock · honesty ceiling) →
`sandboxScenarios` (persona/personal seeds · clear/tight/at-risk) → `sandboxBeats` (scripted paydays) →
`sandboxHarness` (e2e seam). Clean layering — `store.ts` never imports a sandbox module, so there's no cycle.

**Isolation (3 guarantees + 3 seam guards):** never handed to a sync seam · `hydrate`/`save` neutered on
the instance · `WeakSet` brand; plus `bootstrapPersistence`/`startWidgetSync`/`startLiveActivitySync` now
REFUSE a branded sandbox outright. `useNotificationSync` needs no guard — verified it hardcodes `appStore`
and only ever READS it, so a sandbox can't reach it (closes the note opened at 3.5.0.1).

**Honesty ceiling:** per-purpose (`maxGenuineCycles`) — demo day-one bounded at 1, tutorial at
`DISCOVERY_CYCLES`. Only the cycle channel is tunable; `cycleHistory` + `incomeActualsLog` stay capped, so
a raised ceiling can't buy a proof-of-work streak or clear the variable-income cold start.

### What the per-leaf scans caught (the value of this block)
- **3.5.0.1** — `recordDriftBaseline` reads the WALL CLOCK and fires on rollover/add-debt/onboarding, so a
  driven sandbox anchored a months-old scenario to today. Clock made injectable, default unchanged.
- **3.5.0.2** — the spec's bound was INCOMPLETE: three maturity channels, not one. `cycleHistory` feeds the
  proof strip + calibration DIRECTLY, so three scripted rolls would have claimed "Held your line · 3
  paychecks" on day one.
- **3.5.0.3** — "tight" targeted cushion == floor, which is the CLEAR boundary; the engine read `clear`
  while the tutorial was about to narrate "tight" (and the test had HEDGED, letting it through). Also: the
  safety net is derived and adapts (172/32/0), so no constant could model it → the bill budget is now
  SOLVED against the live engine. Also: fixed living costs collapsed all three states into one identical
  read at ~$700.
- **3.5.0.4** — under a flat ceiling the reserve could NEVER release (verified across 6 rollovers), so the
  arc's payoff was structurally unreachable → the per-purpose ceiling.
- **3.5.0.5** — `CushionFloorSheet` wrote the REAL store directly; and the existing e2e asserted only that
  the *link* renders, so a missing prop would have passed silently.

### Whole-item after-scan (carry-forward)
1. **⚠️ The substrate is unit-proven but NOT render-proven.** `useSandboxStore` has zero consumers and has
   never run inside a real React render — the first exercise is 3.5.3. Named risk, not a defect; there is
   no React test harness in this app (suites are pure tsx by design), so adding one for a single binding
   would be premature. 3.5.3 must not assume the binding is proven.
2. **⚠️ Exit criterion partially met.** "Drives the tutorial e2e" — the SEAM ships (3.5.0.7), but no
   tutorial e2e can exist until there's UI. Carried to 3.5.2's VoiceOver + e2e exit-gate.
3. **⚠️ `cycleHistory` is capped at 1, and the arc has a "scorecard" beat.** The sandbox can show at most
   one recorded cycle, so any scorecard/track-record beat must be framed as *what this will look like*
   (3.5.4 already says "scorecard-as-future") rather than as real history. Flagged so the beat isn't
   designed around data the ceiling forbids.
4. **⚠️ 75 direct `appStore.getState()` calls across 21 files** — the tutorial cannot simply reuse real
   screens. Filed to the 3.5.3 design gate as an architecture call (per-site injection vs an active-store
   context), for Jason.

---

## 3.5.1 — tutorial invitation + reachability — ✅ COMPLETE (2026-07-30, `359c317`)

**Design gate (Jason):** an INVITATION in the VIS-4 ack-slot on the first Today view, never a takeover —
it can't stack, it respects a user who just wants to see their number, and for free it reads value-led
rather than as a pitch. **All four audiences** get one offer: new-premium · new-free · free→premium
upgraders · existing v1.6 users.

**Shipped (6 leaves):** `prefs.tutorialSeen` (`'free'|'premium'|null`, store v7) · `tutorialSelectors`
(the whole audience matrix as one pure function) · `TutorialInviteCard` in the ack-slot **ranked last** ·
`app/tutorial.tsx` scaffold route · replay entries ("How this works" on the Guardian card + a permanent
More row) · retired the static in-card intro.

**Two consequences that fell out of the gate, not obvious up front:**
- `tutorialSeen` could NOT reuse `guardianIntroSeen` — it's already `true` for every existing v1.6 user,
  so reusing it would have silently excluded exactly the audience the gate chose to include. And it had
  to be a VALUE, not a boolean, so an upgrader gets the premium run once.
- The static intro had to retire: leaving both would put the invitation AND an in-card intro on one
  screen for a new premium user — the exact stacking VIS-4 exists to prevent. Its e2e now guards the
  decision rather than testing the removed feature.

**Before-scan correction:** the invitation had no DESTINATION — no tutorial route existed, so nothing was
verifiable end-to-end. 3.5.1 therefore also shipped the scaffold route.

**⭐ Closed the 3.5.0 carry-forward:** the substrate was unit-proven but never render-proven. The scaffold
renders live sandbox values through `useSandboxStore`, and the e2e asserts the FROZEN date (2026-03-02)
on screen — proof it reads the sandbox, not the real store.

**After-scan:** `prefs.guardianIntroSeen` is now orphaned (persisted → delete-vs-leave is a migration
call) → filed to 3.7.C7 · invitation placement above the hero raised as **D5** with a rec · recorded a
harness fact: `seedStore`'s `addInitScript` re-seeds on EVERY navigation, so cross-page persistence
can't be asserted in e2e. +13 asserts, e2e 90→95, both themes.

## 3.5.2 — tutorial path + a11y contract — ✅ COMPLETE (2026-07-31, `fda41a8`)

**Shipped:** `tutorialPath.ts` (pure: stepping bounds, skip, `resumeIndex` clamping, `stepAnnouncement`)
+ its wiring in the route. Content stays 3.5.3's, so the step copy is deliberate placeholder.

**A11y contract:** `announce()` on every step change — the transition is MOTION-ONLY, so that string is
the only signal a VoiceOver user gets; **position spoken first** ("Step 3 of 7…") because there are no
progress dots to glance at; `headerProps` on the step title for rotor jumps; controls outside any grouped
label (MF.2); `Motion` for system reduce-motion.

**Interrupt-resume:** `prefs.tutorialStep`, clamped on read — a stale point past the end restarts rather
than dead-ending, so a future shorter arc can't strand a returning user; cleared on finish/skip so a
completed run doesn't reopen on its last step. Both new prefs land under **v7** (unreleased), so no blob
in the wild can carry one field without the other.

**Before-scan corrections (2):** the shared `Slider` is ALREADY `accessibilityRole="adjustable"` with
increment/decrement actions, so the spec's "adjustable slider" was pre-met by the component; and
Dynamic-Type here means NOT capping body copy — `maxFontSizeMultiplier` appears in only 4 files, all
oversized display numerals, so capping tutorial copy would have been a regression dressed as compliance.

**⚠️ The e2e caught a REAL bug — a repeat of 3.7.A0's class:** `router.back()` no-ops on a cold entry, so
"Finish" did nothing for anyone arriving by deep link or from More. Same `canGoBack()` guard applied.
That's the second occurrence, which strengthens the case for the filed **3.7.C9** bare-`router.back()`
sweep.

**Exit-gate is HALF met, deliberately flagged:** the web e2e now walks every step end-to-end (bounded, so
an unadvanceable step fails rather than hangs), but it **cannot prove VoiceOver** — that half is
device-owed and belongs with the Phase-6 accessibility pass. +31 asserts, e2e 95→99, both themes.

## 3.5.3.0 — active-store rewire — ✅ COMPLETE (2026-07-31, `02a46f2`)

**The problem it solves:** 75 direct `appStore.getState()` calls across 21 files meant Today could only
ever render the user's real money — the reason the tutorial couldn't run over the real screen.

**Shipped:** `StoreContext` (`StoreProvider` + `useActiveStore`) with `useAppStore` made context-aware and
the singleton as the default, so all 39 existing call sites behave identically. Today's 23 writes,
`usePaydayCapture`, and 6 child components converted to `useActiveStore()`. `assertNoRealWrites` is the
backstop: while a sandbox subtree is mounted, any mutation of the real store is reported rather than
silently corrupting real data — the dangerous shape here is a component that READS through the context
and WRITES through the singleton, which has no visible symptom at all.

**After-scan caught a 6th component:** `SaveForItSheet`, rendered by `AffordabilityCard` inside Today,
was still writing via the singleton. Remaining singleton writers are all OUTSIDE Today (Money/More/
onboarding sheets) and only matter if the tutorial ever covers those screens — which 3.5.5's scope
decision (tutorial stays Guardian-only) makes unlikely. +9 asserts; Today renders identically (e2e 99).

## 3.5.3.1 — the in-situ shell — ✅ COMPLETE (2026-07-31, `1de2777`)

**Shipped:** the walkthrough runs OVER the real Today — `tutorialSession` (transient, outside React) +
a thin Today route wrapper (`StoreProvider` + overlay above `TodayContent`) + `TutorialOverlay` (scrim
blocks scripted beats, passes touches through on interactive ones). In-app entries call `startTutorial()`
directly; `/tutorial` survives as the deep-link/e2e entry.

**Before-scan correction that reshaped the leaf:** hosting a copy of Today inside the `/tutorial` Stack
route would have landed a detached tab group — a blank screen on device (`useGoToTab`/Freedom RN lesson
#7). The overlay-on-the-real-tab shape is forced by that, not chosen for elegance. Routing to `/tutorial`
from in-app entries was also removed: three different stack depths each broke a different router verb
(`replace` re-mounted the tab group into two Todays; `back`/`dismissAll` landed wherever the caller was).

e2e 100. Verified: Today shows MAR 16 (sandbox) during the session, AUG 14 (real) after.

## 3.5.3.2 — the persistent "Example" marker — ✅ COMPLETE (2026-07-31, `9fb6537`)

**Why it's load-bearing, not decoration:** the tutorial teaches over the user's real Today with figures
scaled from their own income, and later beats drive the card into tight/at-risk. The invitation copy
scrolls away within a beat, so by beat 5 the only thing standing between "This paycheck won't cover
everything" and a genuine scare about their real money is this marker.

**Design decisions:**
- **Placed beside the VERDICT, not in the eyebrow.** In the meta line it reads as a label for the
  section; next to the state line it reads as a qualifier ON the verdict, which is the job.
- **Accent-outlined pill, never a state color** — it can't be mistaken for a verdict of its own. The
  first pass used the soft accent fill alone; the both-theme screenshot showed dark's `accentSoft`
  (#14264c) sitting invisibly on the card (#152340), so the pill read as bare blue text in dark and a
  proper badge in light. A hairline accent border restored parity ([[feedback_light_mode_equal_premium]]).
- **Derived from `isSandboxStore(useActiveStore())`, not from "a tutorial is running."** The marker's
  entire value is being true about what's rendered; hanging it off the same brand the persistence and
  sync seams refuse on means it cannot drift from the data on screen.
- **Spoken FIRST in the card's group label.** A VoiceOver user can't see the chip but hears the at-risk
  verdict all the same.

**e2e (+2 tests, 100→102):** asserted on EVERY beat rather than once — a persistent marker that lapses on
beat 5 fails exactly where it's needed; that it leaves WITH the sandbox at hand-back (a marker stranded
on the user's own card is the mirror bug: their real read dismissed as an example); and that it never
appears on the real card. Visual script `tests/visual/rn-tutorial-example-marker-theme.cjs` shoots
clear + at-risk × dark + light (at-risk is the case the marker exists for).

**Folded in — both surfaced BY this leaf's verification:**
1. **Today advertised the walkthrough during the walkthrough.** The invitation selector reads the acting
   store, and the sandbox is a fresh store that has of course never seen the tutorial — so "See how your
   Guardian works · Show me" sat at the top of the very walkthrough it was inviting the user into. A
   structural consequence of 3.5.3.1's rewire that only a screenshot could show. Suppressed on example
   money, +e2e.
2. **`npm run e2e:fresh:rn`** — a `serve` left on :4319 from an earlier session is silently reused
   (`reuseExistingServer: !CI`), so the RN suite can run against a stale bundle. It produced a false RED
   here; the same trap gives a false GREEN just as easily, which is the version that ships a bug. The
   legacy app already had `e2e:fresh`; the RN app now has its twin.

**After-scan carry-forward (filed to the leaves they affect, not the backlog):**
- **3.5.3.4 blocker:** a FREE run's sandbox is `subscriptionPlan: 'free'` → `showAdjust` is false → there
  is **no floor control to drag**, for exactly the audience the tutorial most needs to convert.
- **3.5.3.3:** each beat must scroll its subject clear of the bottom dock (at-risk's Recovery section
  sits behind it today); and the **tab bar is outside the overlay**, so it stays tappable on every beat —
  a user can wander to Money's real data mid-session.
- **[D6 · open, for Jason]** marker SCOPE: the hero above the card also shows sandbox money ("$2,000 ·
  Short this paycheck") unmarked. Rec: keep it card-only — the Guardian card carries the verdict, and a
  second marker doubles the chrome on a screen already carrying an overlay.
- **Doc hygiene:** "3.5.3.x" is overloaded — Phase 3's item 3.5 (Live Activity) used 3.5.3.1–.5 in this
  same log. Worth a disambiguating note at the 3.7.C coherence sweep.

## 3.5.3.3.1 — the per-beat spotlight — ✅ COMPLETE (2026-07-31, `3fa1d5a`)

**The problem, seen not reasoned:** 3.5.3.2's at-risk screenshot showed the Recovery section sitting
behind the coaching card that was describing it. The dock is at the bottom, the Guardian card is tall,
and Today scrolls — so "look at this" frequently pointed at something off-screen.

**Shipped:**
- **`tutorialTargets`** — a coached-SUBJECT registry. Two constraints shaped it: it renders for every
  user on every launch, so registration is a ref write and an `onLayout` and nothing more (with no
  provider above it, `TutorialTarget` is a plain `View`); and **3.5.5's coach-marks need exactly this**,
  so ids are free-form and nothing in it knows what a beat is. Built walkthrough-specific, it would have
  been written twice.
- **`useSpotlight`** — measure → scroll into the stage → measure AGAIN. The second measure is the whole
  point: drawing from the pre-scroll rect leaves the highlight behind on screen. Returns null mid-scroll
  (a spotlight sliding across unrelated content reads as a glitch; a brief absence reads as "getting
  there") and when the subject isn't mounted at all, since a beat may point at something the current
  Guardian state doesn't render.
- **The cutout scrim** — four bands around the subject rather than one sheet over everything, plus a
  quiet ring that survives onto the interactive beats where the scrim is gone (there, the outline is the
  only thing still saying "this is the bit we mean"). Four rects rather than an SVG mask: identical
  render on web and device, and plain geometry an e2e can assert.
- **`Screen` scroll seam** (`scrollRef` + `onScroll`, opt-in, inert elsewhere). The alternative was the
  tutorial re-implementing the screen scaffold and then drifting from it.

**Why `scrollDelta` is a pure module with 15 asserts:** every wrong answer is silent — too little and the
beat describes something behind its own dock, too much and the subject leaves the top, a stray non-zero
and the screen twitches on every step. None of it throws, and a render test only says "looked odd". A
subject taller than the stage aligns TOP and accepts overflow; centering would hide the beginning of the
thing the user is being asked to read.

**Folded in — both from looking at the screenshots, neither findable by reading code:**
1. **The tab bar is outside the overlay.** The scrim lives inside the Today screen, so one tap reached
   Money's real data mid-beat — and on the interactive beats, without even a scrim in the way. Tabs are
   now held for the session; Skip remains the way out.
2. **"How this works" was on offer from inside the walkthrough** — an entry that restarts the very
   session you're in, live on any interactive beat.

**After-scan → filed forward:** 3.5.3.3.2 must bump the spotlight's `revision` when a beat changes the
sandbox state (a card that grows leaves the highlight on the old layout) · 3.5.3.3.3 gets per-beat
spotlight tuning (the bar subject's ring currently crops the card title) · 3.5.3.3.4 gets reduce-motion
(the stage scroll is unconditionally animated) and an iPad two-column check.

## 3.5.3.3.2 — beat choreography — ✅ COMPLETE (2026-07-31, `82ab07a`)

**What it buys:** one arc that shows a clear paycheck, then a short one, then a clear one again —
without the user having to produce those states themselves.

**Design:** beats declare the `state` they NARRATE, and entering a beat **re-seeds** the sandbox to it
rather than mutating forward. `build` is pure and the clock is frozen, so beat 5 is byte-identical
whether you arrived from beat 4 or stepped back from beat 6. That is what makes Back exact and stops any
beat inheriting a mess from the one before it. Accepted trade, documented in the type: a change made on
an interactive beat does not survive stepping away and returning — each beat is a fresh scripted stage.

**The arc climbs back OUT of trouble** (beat 6 restages clear) before the hand-back, and it's asserted:
handing someone back to their own money with a red card as the last thing they saw would undo the point
of the walkthrough.

**⭐ The before-scan is what made this leaf cheap — four premises that were wrong, none of which fail
loudly** (Jason asked mid-build whether I'd run it; I had only half-run it, went back and did it
properly, and it paid for itself immediately):
1. **The session used `realStore` in `start()` and dropped it.** Every scripted state is scaled from the
   user's own paycheck, so staging needs it retained for the session's life.
2. **`publishSandbox` captures `scenarioId` in a closure.** Without re-publishing on each stage, the
   harness snapshot reports the OPENING scenario for the rest of the run — a test asserting "the card is
   at-risk on beat 5" would have passed on stale evidence.
3. **The spotlight's `revision` needed the beat INDEX, not just the target.** `recovery` and `yourcall`
   both spotlight the whole card, and the card changes height between at-risk and clear — keyed on
   target alone, the highlight would keep the previous state's geometry.
4. **[Decision] a harness-named scenario now PINS the state for the whole run.** Beat 1 declares `clear`,
   so otherwise the pin survived exactly one render and every screenshot script that asks for a state
   would quietly shoot the wrong one — while still looking like a working tutorial.

**After-scan → filed to 3.5.3.3.3:** the at-risk persona has **nothing deferrable**, so the card reads
"Nothing here can safely wait this paycheck" directly under coaching copy promising "what can safely
wait". The fix is the SCENARIO (give the at-risk persona one deferrable expense) as much as the words —
otherwise the beat's lesson has nothing to demonstrate. Also: the Recovery section is premium-gated, so
a FREE run's Recovery beat shows the honest read + invite and no rendered plan; the copy must be true
for both tiers. Both found by looking at the beat-5 screenshot.

### 3.5.3.3.2 — code-level after-scan (Jason asked; the screenshot pass had not covered this)

The first after-scan was screenshot-driven and found the copy/scenario contradiction. Sweeping the code
just written found one more, and it was the kind that ships:

- **`start` and `goTo` computed a beat's scenario separately.** Two doors into beat 5 — interrupt-resume
  goes through `start`, stepping goes through `goTo` — each with its own copy of the policy. A user
  resuming onto a beat could see a different card than one who stepped onto it, and nothing would fail.
  Both now route through `scenarioForBeat`; the one honest difference (a sandbox must be created from
  *something*, so the opening defaults to `clear` for a stateless beat) is explicit rather than
  accidental. Pinned by an e2e that resumes onto beat 5 and asserts the same shortfall.
- **`stageBeat` narrowed to module-private** — nothing outside used it, and `goTo` is the door.
- **Filed to 3.5.3.3.4:** a re-stage changes the card's content silently under VoiceOver. The step
  announcement describes the new beat, which is probably enough, but it's a device-pass judgement.

_Lesson: the after-scan has two halves — what the RUNNING app showed, and what the WRITTEN code shows.
The screenshot half found the copy contradiction; only the code half found the divergence._

## 3.5.3.3.3 — beat copy + the truth it has to match — ✅ COMPLETE (2026-07-31, `2947601`)

**The principle this leaf ended up being about:** copy that describes a screen it doesn't match teaches
the user to distrust the screen. Two of the three fixes were therefore NOT copy fixes.

**.3.1 — fix the scenario, not the words.** The before-scan root-caused the contradiction found in
3.5.3.3.2: the persona's "Streaming" bill carried `category: 'other'`, and `classifyDeferability`
deliberately defaults everything except `subscriptions` to ESSENTIAL (a rule worth keeping — never call
an unclassifiable bill safe to skip). So the at-risk scenario contained nothing deferrable, and the
Recovery beat taught "what can safely wait" over a card reading "Nothing here can safely wait this
paycheck". Categorised as `subscriptions` — correct in its own right — and asserted, so the beat can
never again lose its subject. Renamed to **"Subscriptions"** (plural): it carries 7% of the bill budget,
~$120, which is absurd for one streaming service and credible for a bundle. The teaching example has to
survive a sceptical glance, and the alternative — shrinking it — would have made it too small to close
any part of the gap it exists to demonstrate.

**.3.2 — the arc's copy**, to two rules: true of what is actually on screen behind it, and true on BOTH
tiers. The Recovery section is premium-gated, so the beat promises what the GUARDIAN does ("works out
what has to be covered now, and what can safely wait") rather than what the user is about to see
rendered — true for a premium user reading a built plan and for a free user reading the honest shortfall
plus an invitation. Deliberately not word-perfect; the whole-app wording/voice audit polishes in one pass.

**.3.3 — the ring crossed the Guardian's title, and the inset was not the cause.** First attempt shrank
`RING_INSET` 6→3 and it still clipped, which was the clue: the target's top margin lived on the CHILD,
so the measured rect began 16pt higher — flush with the title. Moving the margin onto the target is
layout-neutral but changes what gets measured. Inset restored to 6. The **line** target had the same
latent bug (8pt); fixed before it could surface on beat 3.

**After-scan (both halves):**
- _Screenshot half:_ the Recovery beat now demonstrates itself — COVER NOW beside SAFE TO DEFER with a
  real "Defer 1 selected" action, under copy that finally matches.
- _Code half:_ the margin-on-child measurement bug generalises to **any** future `TutorialTarget` whose
  wrapped element carries its own margin — worth remembering when 3.5.5's coach-marks start marking up
  the rest of the app.
- **Filed to 3.5.3.5:** beat 4's copy promises the safety net "releases it once it knows" — that leaf's
  scripted rollover is what has to deliver the release, or the promise dangles.

## 3.5.3.3.4 — verify + close — ✅ COMPLETE (2026-07-31, `86730f5`)

The verify leaf found two real defects, which is the argument for having one.

**.4.1 — an A11Y REGRESSION.** `stepAnnouncement` had **zero production callers**. 3.5.3.1 moved the
overlay off the `/tutorial` route and the announce went with it; nothing failed, because the unit test
covers the pure function rather than whether anyone calls it. The result was a walkthrough that said
nothing whatsoever to a VoiceOver user — the beat transition is motion-only, so that string IS the
signal. Restored **inside `TutorialOverlay`**: the component that draws a step is now the one that
speaks it, so a future host rewrite cannot separate them again. Guarded by a **source check** in the app
suite, in the spirit of the repo's existing `lint:webkit` scan — a web e2e cannot assert this at all,
because `AccessibilityInfo.announceForAccessibility` is a documented **no-op in react-native-web**. An
e2e assertion here would have been theatre; the honest split is a wiring guard now + VoiceOver on the
Phase-6 device pass.

**.4.2 — Reduce Motion** gets the jump, not the glide: a programmatic scroll the user didn't initiate is
exactly what the setting exists to suppress, and the destination is identical either way.

**.4.3 — iPad WAS BROKEN.** Subjects are measured in WINDOW coordinates while the overlay draws in its
own local space, and the two coincide only on a phone. On the regular (iPad) layout the tab bar becomes
a left sidebar RAIL, so the ring rendered ~700pt right of its subject — framing an unrelated row in the
other column. The overlay now measures its own origin and draws relative to it. **Found by shooting the
walkthrough at 1024×768; a phone-only screenshot pass would have shipped it.**

---

## 3.5.3.3 — WHOLE-ITEM after-scan (all four leaves together)

**Pattern 1 — the dominant defect class was "correct but not connected."** Three of the six defects were
integration failures between units that were each individually right, and therefore individually green:
the dropped announce, the stale `publishSandbox` closure, and the `start`-vs-`goTo` policy divergence.
Unit tests structurally cannot catch this class.

**So the scan swept for other instances rather than assuming there were none** — every export in the
tutorial/sandbox modules, checked for a production consumer. Result: `sandboxBeats`' `scriptSurprise`,
`advanceSandboxCycle` and `runBeats` have **none**. They are not a regression — they're 3.5.0.4
substrate built ahead of the beat that consumes them — but they are the identical shape as the announce
bug, and **3.5.3.5 is the leaf that must wire them**. If it doesn't, the surprise→absorb→release arc
silently never happens, while beat 4's copy already promises the release. Filed there. (`resolveScenario`
and `HARNESS_SCENARIO_IDS` also flagged: both benign — internal use and a documented contract export.)

**Pattern 2 — measurement assumptions that only break off-phone.** Two defects, both in the same
machinery: a margin on the CHILD inflating the measured rect (.3), and window-vs-local coordinates
diverging on iPad (.4). **Both generalise directly to 3.5.5's coach-marks**, which will point at
controls all over the app: any measured overlay needs its margins on the target and its rects converted
into the drawing surface's own space.

**Pattern 3 — the verification medium determines what is findable.** Tallying honestly across the item:
screenshots found the copy/scenario contradiction and the iPad breakage; reading the code found the
divergence and the dead wiring; the e2e suite found neither class — it protected against regression in
what was already understood. All three are needed, and "I looked at it and it worked" is not a scan.

**Ledger left open by this item (nothing silently dropped):**
- VoiceOver end-to-end — device-owed, Phase 6, with 3.5.2's half.
- The iPad **sidebar rail is not dimmed** during a session. The overlay cannot reach outside its screen
  container, so fixing it means moving where the overlay mounts — an architecture call, not a tweak, and
  tabs are already held so it is cosmetic. Flagged, deliberately not decided solo.
- `guardian-reserve` as its own target (the reserve beat currently spotlights the whole bar group) → 3.5.3.5.
- The finale spotlights `guardian-card` and must survive the crossfade → 3.5.3.6.

## 3.5.3.4 — drag the floor — ⚠️ BUILT + VERIFIED, EXIT BLOCKED ON [D9] (2026-07-31, `aea6672`)

**Before-scan corrected two premises before a line was written:**
1. **There is no inline slider to drag.** The floor control lives in a modal `FormSheet`, which renders
   ABOVE the tutorial overlay (the 3.7.A0 lesson). So the beat cannot spotlight a control and have the
   user drag it in place — [D7] resolved it as: spotlight the ENTRY, open the real sheet, and carry one
   line of coaching inside it, because the modal covers the coaching card that sent them there.
2. **"The Skia impact viz" was stale.** `AffordabilityImpactBar` already answers this question on the
   sibling surface, in Reanimated. Built a sibling rather than reusing it: both ask "what did this do to
   my cushion", but that one narrates a PURCHASE carving down toward a fixed line — passing a floor
   change through it would have animated correctly and captioned it wrongly. Skia was declined on
   purpose: identical result, plus a device-QA gate.

**Scope discipline on the [D8] allowance:** `isExample` widens exactly two gates (`showAdjust` and the
sheet's render). Every other premium-gated element on the card still reads plain `isPremium`, so a free
walkthrough doesn't quietly inherit Recovery, the safe-move voice, top-up, attestation, the proof strip
or the forecast link. That narrowness is the thing to preserve if this pattern spreads.

**Two defects caught by this leaf's own scans:**
- **A fresh-object selector took the entire tutorial suite down** — `useStore(sandbox, s =>
  selectPaydayGuardian(s.store))` builds a new object every call, so it never compares equal: the exact
  un-cached-snapshot loop this screen already documents in `TodayScreen`. 17 failed / 3 passed; deriving
  outside the selector restored 20/20. The code-level after-scan found it before the run reported.
- **The 3.5.3.3.1 target guard caught my own change** — beat 3 re-pointed to `guardian-adjust` and the
  registered-subject assertion failed immediately. Exactly what it was written for.

**⛔ [D9] — the after-scan's blocking finding, from the screenshots.** With a real drag scripted, the
premium run reads `Cushion $413 → $323 · $90 more to debt this paycheck`. The FREE run reads **`Cushion
$50 → $50 · Same cushion, same plan`** — because a free Guardian is never held to the floor, so moving
the line does nothing. The taste [D8] bought is therefore hollow: the control looks broken, and both the
beat body and the in-sheet coach line ("the whole plan re-solves around it") are false for that
audience — the same defect class 3.5.3.3.3 existed to kill.

**Recommendation: run the SANDBOX as premium for every audience.** This is what the E1 spec always
described — _"free lands on the real free card + invite = the app's best paywall"_ — i.e. the walkthrough
teaches what the Guardian DOES, and the hand-back to their own free card is the conversion moment. The
current `premium: run === 'premium'` scenario option quietly contradicts that. It also dissolves
3.5.3.3.3's both-tiers copy constraint. Alternative: revert [D8] and script the beat for free, keeping
the tier boundary crisp at the cost of the one moment of agency. **Jason's call — it changes what a free
user sees for the whole walkthrough, so it is not mine to make.**

### [D9] resolved — the sandbox runs premium for every audience (2026-07-31, `b7fb64c`)

**Jason chose A.** The engine settled it: `buildGuardianBrief` documents *"premium: held to the floor;
free: the base plan's cushion"*, and the cold-start hedges are premium-only **by design** ("they describe
the premium ACTING"). So under the old shape — sandbox mirrors the user's tier — a free walkthrough had
**three of seven beats with no subject**: a line that did nothing when dragged (3), no safety net to point
at (4), and no reserve to absorb a surprise (5). All three narrated by copy that said otherwise.

**What changed:** `opts.premium` is now `true` regardless of `run`. `run` survives as the AUDIENCE — it
drives `tutorialSeen`, the invitation matrix, and is the finale's input for naming what changes.

**Consequences deliberately accepted:**
- The `PremiumInvite` no longer renders during a walkthrough, so **100% of the conversion framing moves
  to the finale**. That is [D9]'s cost, and it is why **3.5.3.6 is now a HARD GATE** (Jason: "we need to
  make sure .6 holds the bar"): the finale must say plainly that premium did the holding, and for a free
  user name what their own card does and doesn't do. Without it, this is dressing free as premium.
- 3.5.3.3.3's "copy must be true on BOTH tiers" constraint is **retired** — every audience now sees the
  same render, so the copy just has to be true.
- The `isPremium || isExample` widening was **reverted**: redundant once the sandbox is premium, and an
  escape hatch of that shape spreads to the next control and the next. One gate per premium affordance.

**Third instance of the margin-on-child measurement bug** — the ring drew across the attestation line
above the adjust control. Same fix (spacing on the target, label carries none). Three occurrences in one
item is why the audit gate below lists geometry as a standing lens.

**Verified:** e2e 110/110 fresh, with a FREE-seeded user asserting a working drag AND a visible
Safety-net stat — the assertions that pin [D9] rather than trusting it. Both tiers now produce the
identical payoff (`Cushion $413 → $323 · $90 more to debt this paycheck`), both themes.

## 3.5.3.5 — interactive beat B — ⚠️ BUILT, NOT CLOSED (2026-07-31, `b7b91ab`)

**[D10] — the before-scan re-shaped the beat before a line was written.** The settled gate said "tap the
surprise", but a surprise is an **EVENT**: the real app records one at the payday check-in
(`payday.ts:57`), so there is nothing in the Guardian a user could tap that means one happened. Two other
facts landed at the same time: **`DISCOVERY_CYCLES = 3`**, so the reserve only retires after three cycles
(which is what `runBeats` was built for), and the release already has **real product UI** — the
`reserve-release` ack, whose copy branches on whether the net was actually tapped.

So beat B now teaches the **attestation** — a real Guardian control that visibly shrinks the net — and
the surprise → absorbed → released story plays as the scripted payoff of the same beat, driven by the
real producers. The e2e asserts the ack's **surprise-branch** sentence specifically, because the tutorial
has no way to fabricate it: that is what proves the engine wrote it. A second test skips out mid-story
and asserts nothing lands afterwards (the timers are cancelled on beat-change and on end — otherwise
rollovers arrive on a sandbox that has left the screen, or on the next session's).

**⛔ Then the screenshot pass found two defects that every assertion had passed straight through** — the
correctness-vs-feel gap Jason named the same day, demonstrated inside a single leaf:

1. **The payoff lands off-screen.** The release ack renders in Today's ack-slot at the TOP of the screen,
   while the spotlight holds the view mid-card on the attestation. The e2e found the text because it was
   in the DOM; the user never sees it. Worse, the attestation *disappears* once the net retires, so the
   ring is left framing an unrelated line ("Your call"). The mechanism this needs is a **payoff target**:
   when a beat's story completes, the spotlight re-points and scrolls to the result.
2. **The scripted rollovers leave the example plan alarming.** After three rolls the hero reads *"Overdue
   payments need attention · debt-free by December 2035"* (it opened at April 2035). The story makes the
   taught plan visibly WORSE, which teaches the opposite of the beat's point.
   **Root cause sits in the 3.5.0.4 substrate, and this leaf is its first consumer** —
   `advanceSandboxCycle` calls a bare `rolloverPayCycle`, but a real payday goes through
   **`capturePayday(items, decisions, actuals)`**, which is *also* where the real app records a surprise.
   The substrate's own doc claims "a beat calls the same producers the real app calls"; that is true of
   `recordSurpriseOutflow` and **not** true of the rollover path. Fix is to script through `capturePayday`
   with the required decisions settled and the surprise as `actuals` — more faithful, and it removes the
   overdue debris as a side effect rather than papering over it.

_Both are filed as 3.5.3.5.5 / .5.6. Neither is deferrable: the beat currently passes its tests and fails
its user._

## 3.5.3.5.7 — overlay hoisted to the root — ✅ COMPLETE (2026-08-02, `7725105`)

**The move:** the coaching overlay rendered inside the Today screen, so its scrim could only ever cover
what that screen occupies. On the iPad regular layout the tab bar becomes a sidebar RAIL owned by the
navigator — so it sat fully lit beside a dimmed screen. It now mounts at the ROOT layout, above
everything, and the screenshot confirms the rail dims with the rest of the canvas.

`TutorialShell` is the whole seam, and deliberately nothing more: the SCREEN knows where the beat's
subject is (it owns the scroller and the target registry), the OVERLAY knows how tall its dock is, and
each needs the other's answer.

**Mounting it in the TABS layout was the obvious step and was wrong.** Wrapping `<Tabs>` in a container
View to make room for a sibling broke tab presses outright. The root layout already provides a flex
container and needs no wrapper around the navigator. ⚠️ Today itself did NOT move — 3.5.3.1 put the
walkthrough inside the tabs because hosting a COPY of Today in a Stack route lands a detached tab group
(a blank screen on device, Freedom RN lesson #7). Only the overlay view is hoisted.

**`startTutorial` now navigates to Today itself.** All three callers already did, but by convention —
and once the overlay mounts above the navigator, a caller that forgot would coach the user over Money.
Same lesson as the dropped `announce`: put the behaviour where it cannot be left out.

### The BNPL failures — a time bomb, not a regression

Two BNPL specs failed with *"subtree intercepts pointer events"* immediately after the hoist, which read
exactly like a restructure regression. **Stashing to the committed baseline reproduced it**, which is
what ruled the hoist out — worth the two minutes, because the next step would have been unpicking good
work. The real cause: the fixture pinned `nextPaycheckDate: '2026-08-01'`, a date the real clock passed
overnight. A payday in the past is a LANDED payday, so Today auto-opened the payday-capture sheet and its
backdrop covered the tab bar.

A sweep found **nine more specs queued to fail the same way on 2026-09-01**, and `guardian.spec` on
2026-08-07. All now anchor to the run date through a shared `day()` helper whose doc-comment records the
failure mode, so the next author doesn't re-arm it. A suite that starts failing on a calendar date is
worse than one that fails honestly: it burns the debugging on the wrong suspect.

### After-scan → filed forward
- **3.5.3.5.9 (new):** the interactive beats remove the scrim ENTIRELY, so every control on screen is
  live — including More, which pushes a route mid-walkthrough. The plan has promised "passes touches
  through to the target only" since 3.5.3 was written; that was never what shipped. The cutout geometry
  already exists, so the fix is to keep the scrim and cut a real hole at the spotlight rect.
- **3.5.3.7 +7.7:** on iPad the coaching dock now spans the full canvas edge-to-edge, which reads
  unconstrained beside a width-capped app.

## 3.5.3.5.6 — a scripted payday is one that was ATTENDED — ✅ COMPLETE (2026-08-02, `cc68ac8`)

**The defect:** `advanceSandboxCycle` called `rolloverPayCycle` alone. That is not a payday — it is a
payday nobody turned up to, so bills and minimums roll over unpaid. Three of them left the taught plan
reading *"Overdue payments need attention · debt-free by December 2035"* against an opening state of
April 2035. The walkthrough's own story was degrading the example it teaches on, while narrating a
Guardian that looks after you.

**The fix, and why it's the faithful one rather than a patch:** the real app makes two moves at a payday
— `capturePayday` records what happened (obligations settled, income recorded, any surprise reported)
and only then does `rolloverPayCycle` close the cycle. The beat now does both. That also carries the
surprise through `actuals`, the same door the payday check-in uses, so the substrate's own claim — *"a
beat calls the same producers the real app calls"* — is finally true of the rollover path as well. It
had been true of `recordSurpriseOutflow` and quietly false next door.

Settling every obligation is the honest script here: this beat is about a user who paid their bills,
which is precisely the case it teaches.

**+3 assertions** pin it: the story opens clear, three scripted paydays never leave the plan at risk,
and nothing is left flagged as a failed obligation. Every existing assertion passed throughout the
broken version — the defect was only ever visible on screen.

**Verified:** the hero now reads *"On track · debt-free by August 2026"* in green, i.e. the story now
IMPROVES the taught plan (three paydays of real payments) rather than wrecking it.

### After-scan
- **Confirms 3.5.3.5.5 is still outstanding** and now clearly the last blocker on this beat: the same
  screenshot shows the ring still framing "Adjust your line" (the attestation it was pointing at retires
  with the net), and the release ack sitting off-screen at the top.
- **`runBeats(store, n, surprise?)`'s third argument has no production caller** — the tutorial
  deliberately fires the surprise 900ms EARLIER so the absorb is legible as its own moment, then rolls.
  Both paths are legitimate, but this is the same "built, not called" shape the whole-item sweep flagged:
  **3.5.4's demo should use the parameter** (an unattended, faithful capture-with-surprise), or it should
  go. Filed rather than left to be rediscovered.

## 3.5.3.5.5 — the spotlight follows the payoff — ✅ COMPLETE (2026-08-02, `f6e07c5`)

**The insight the defect forced:** a beat that ends in something *happening* has **two** subjects — the
control you act on, and the result. The arc had only ever modelled one. Beat 4's result, the safety-net
release, renders in Today's ack slot at the very top of the screen while the spotlight was holding the
view down on the attestation; so the user watched the beat's payoff occur off-screen, and the ring was
left framing a control that retires along with the net.

The e2e passed throughout, because the ack was in the DOM. That is the same failure shape as the dropped
`announce` and the iPad ring: **present is not the same as perceived**, and only a screenshot ever says so.

**Shipped:** `TutorialStepDef.payoffTarget`; the ack slot registered as a `TutorialTarget` so
`useSpotlight` scrolls it into the stage like any other subject; and — the part worth keeping — which
subject is live is asked of **`selectReserveRelease` on the sandbox**, the same engine selector Today
renders the ack from, rather than a flag the tutorial sets. The highlight therefore cannot claim a payoff
the screen isn't showing. It's part of the re-measure key because it flips mid-beat.

**Verification changed too:** the e2e now asserts the ring OVERLAPS the ack and the ack
`toBeInViewport()`. "It's in the DOM" was precisely the assertion that let this ship.

### After-scan
- **Confirms 3.5.3.5.9:** the screenshot shows the payoff spotlit on a completely UNDIMMED screen —
  beat 4 is interactive, and interactive beats currently drop the scrim entirely rather than cutting a
  hole in it. The ring alone is carrying the focus.
- **Minor:** once the user taps "Got it" the release clears, so the spotlight falls back to
  `guardian-reserve`, which no longer renders — the ring simply disappears. Harmless (the beat is over by
  then) and it degrades to an uncut scrim rather than pointing anywhere wrong, but noted.
- **Two environmental flakes** this run (`affordability`, `blur-glass`) — both `page.goto` navigation
  timeouts under parallel load, both green on retry, neither tutorial-related. Recorded rather than
  "fixed", because inventing a fix for load noise is how real signal gets buried.

## 3.5.3.5.9 — the scrim stays up on interactive beats — ✅ COMPLETE (2026-08-02, `03c608c`)

**A promise the code never kept.** The plan has said "passes touches through to the TARGET only" since
3.5.3 was written. What shipped dropped the scrim *entirely* on interactive beats, so every control on
screen was live — including More, which pushes a route out from under the walkthrough. The gap survived
because the beats worked: you could reach the control, which was the thing anyone would check.

**The fix needed no new mechanism**, which is the interesting part. The cutout scrim built in 3.5.3.3.1
was already exactly this: its four bands capture touches, its hole does not. It was simply never
rendered on the beats that needed it most. The whole change is which condition renders it.

**One deliberate exception:** an interactive beat with no measured rect renders NO scrim. There is no
hole to cut, so a scrim would seal the user in — unable to do the thing the beat is asking of them. An
unguarded screen beats a trap, and a beat whose subject failed to measure is already degraded.

**The e2e contract is a pair, not a single assertion:** the scrim is present on beat 3, AND the click on
"Adjust your line" lands *without* `force`. Either alone is satisfiable by a bug — a scrim that covers
everything passes the first; no scrim at all passes the second. Together they mean the hole is over the
control. A misplaced hole now fails as "scrim intercepts pointer events", which is precisely the failure
worth having.

**After-scan:** it also reads considerably better — a lit control against a dimmed screen is a far
stronger affordance than a bare ring on an undimmed one. That wasn't the goal, but it is partial credit
against 3.5.3.7's control-hierarchy and focus criteria, and worth remembering there: some of the
"premium feel" gap is correctness that hasn't been finished yet, not decoration that hasn't been added.

## 3.5.3.5.8 — [D5], the invitation sits with its subject — ✅ (2026-08-02, `03c7a62`)

It opened Today ABOVE the paycheck hero, having inherited the ack slot's position — an offer leading the
screen ahead of the user's own money, on every launch until answered. It teaches the Guardian, so it now
sits under the Guardian.

**The before-scan is what saved this from being a regression.** `selectTutorialInvite` asks only for
`onboardingComplete`, **not** for a paycheck. A literal reading of [D5] would have silently dropped the
offer for someone who finished onboarding without entering a plan — exactly the newest audience it aims
at, and one the walkthrough serves perfectly well because it runs on a sandbox. The ack slot therefore
survives as the fallback for "no Guardian card to sit under".

**Named consequence:** the invitation leaves the VIS-4 single-ack slot, so a pending ack and the
invitation can now both be on screen. That is what [D5] asks for — different regions — and the invitation
was always the odd one out in a slot otherwise reserved for time-sensitive acknowledgements.

e2e asserts the vertical ORDER (`invite.y > guardian.y`); "is it visible" passed just as happily when it
sat on top of the hero. Six **visual** fixtures were de-fused the same way as the e2e ones — they pinned
`dueDate: "2026-07-01"`, so every screenshot review was being handed a plan reading "Overdue payments
need attention": a broken-looking app that was working fine.

---

## 3.5.3.5 — WHOLE-ITEM after-scan (nine leaves)

**Six defects. Not one was caught by an assertion.** Three came from screenshots, three from reading the
code. The suite went green after each leaf regardless.

**Pattern 1 — PRESENT ≠ PERCEIVED (three instances).** The dropped `announce` (a walkthrough that said
nothing to VoiceOver), the iPad ring drawn 700pt off its subject, and the payoff landing off-screen. Each
passed its assertions because the thing existed; none was *perceivable*. This is now written into memory
as a standing check, and it is the reason the audit gate carries a premium-bar lens with its own reviewer.

**Pattern 2 — CLAIM vs CODE (two instances) → a new audit lens.** Two defects were *documented
intentions that had quietly diverged from the implementation*: "passes touches through to the TARGET
only" (in the plan since 3.5.3 was written, never implemented) and the substrate's "a beat calls the same
producers the real app calls" (true of the surprise, false of the rollover right next to it). Both read
as true to anyone who trusted the doc — which is everyone, including me, until I checked. **Added as a
mandatory lens on 3.5.3.9: re-check every promise the plan and the doc-comments make against the code.**

**Pattern 3 — measurement geometry (four instances of one bug).** Margin-on-child inflating a measured
rect, now the default shape for any coachable control: spacing on the target, none on the label.

**Pattern 4 — time bombs.** Ten e2e fixtures and six visual scripts pinned calendar literals. One had
already expired and produced a failure that read exactly like a regression from the restructure in
flight; a `git stash` to the committed baseline is what disproved it, before any good work was unpicked.
All now anchor to the run date.

**Ledger left open:** VoiceOver end-to-end (device, Phase 6) · the iPad coaching dock spanning the full
canvas (→ 3.5.3.7 as +7.7) · `runBeats`' `surprise` parameter still has no production caller (→ 3.5.4's
demo should use it, or it goes).

## 3.5.3.6 — the E1 hand-back finale — ✅ COMPLETE (2026-08-02, `e17b707`)

**This beat is where [D9] is either honest or a lie.** The walkthrough shows every audience a premium
Guardian, and the `PremiumInvite` doesn't render during a session — so the finale carries 100% of the
conversion framing, and it is the only thing standing between the run and "free dressed as premium".

**The line, per audience.** A free user is told plainly that *premium* is what held the line
automatically every payday, that their own card shows the same honest read, and that deciding what to
hold stays theirs. A premium user is told their Guardian does exactly this with their real paycheck, all
on their device — and is never sold what they already pay for.

**One resolver, deliberately.** `bodyByRun` is read through a single `stepBody()` used by BOTH the
rendered copy and the announcement. Two separate lookups is precisely how a VoiceOver user ends up being
read the premium line off a free screen, and that class of drift has already cost this phase a dropped
announcement.

**The crossfade** keys `Motion` on `isExample`, so sandbox → their own money is a deliberate fade rather
than a jump-cut, and nothing at all under Reduce Motion. The spotlight is released on unmount so a later
session can't paint a ring at the previous one's coordinates before its own measure lands.

**Verified end to end, and this is the bit that matters:** the free hand-back lands on a card showing
**Cushion $50 against a $200 line — visibly NOT held** — with the invitation naming exactly why. The gap
is real, visible, and explained. That is what makes it a paywall rather than a bait-and-switch, and it
is what E1 described from the start.

**Guards:** the e2e asserts both audiences (including that premium is never sold to a premium user); the
unit suite pins the ANNOUNCEMENT parity, which no e2e can — `announceForAccessibility` is a no-op in
react-native-web, so a divergence between spoken and shown copy would be invisible to every other test
in the repo.

### After-scan → filed to 3.5.3.7
- The finale's dock runs to six lines of body and takes roughly 40% of the screen. Correct content,
  but it makes the coached card a strip above it — worth weighing against the dock/control-hierarchy
  criteria rather than treating the copy as untouchable.
- The free hand-back's contrast ($50 cushion under a $200 line) is stark by design. Worth a deliberate
  look during the feel pass: it should read as honest, never as punitive.

## 3.5.3.7 — the premium-feel pass — ✅ COMPLETE (2026-08-02, `98ef579`)

**Why this item existed at all:** Jason, seeing the arc come together — *"the tutorial has to hit the
bar."* Every scan before it had tested CORRECTNESS. None had asked whether the thing feels like Debt,
and the honest answer was no: correct and clear, but generic — a tooltip library bolted onto a premium
app. Naming the six gaps against *what Debt already does* (rather than against taste) is what made it
buildable rather than a matter of opinion.

**What shipped**
- **[D11] the dock is frosted** — the app's own `SheetScrim` idiom (BlurView + a light dim), the same
  material as the tab bar and every sheet. It had been the one floating surface in the app that wasn't.
  Dock ONLY: frosting the scrim bands too would have put five BlurViews on screen and risked softening
  the single thing that must stay crisp.
- **A hairline progress rail.** "Step 3 of 7" made the arc's length something you had to read; the rail
  makes it something you glance at. No counter animation, nothing that reads as gamification.
- **Control hierarchy.** Back / Next / Skip sat in a row as equals, so the way OUT was as loud as the way
  ON. Next leads, Back is a quiet link beside it, Skip is pushed to the far edge and dimmed — reachable
  the instant you want it, never where your eye lands.
- **[D12] haptics** — a light tick as each beat lands; a MEDIUM at the two moments the user actually
  caused something: the floor **saved**, and the bills **attested**. The AHAP crescendo stays reserved
  for the last debt: spending the signature of "you paid off your final debt" on finishing a walkthrough
  would devalue it exactly where it matters.
  - _[E5] Corrected 2026-08-03._ This line said the second medium fired at "the net released". It does
    not — it fires at the **attestation tap**, which is right: a haptic answers the USER's action, and
    the release is the app's own scripted consequence three paydays later. The description was wrong,
    not the code. Worth noting that it was wrong in a *plausible* way, which is how it survived several
    reads: "the net released" is the beat's memorable moment, so the sentence sounded correct.
- **The ring fades in on arrival.** "Travelling spotlight", taken literally, contradicted a deliberate
  3.5.3.3.1 decision — a ring sliding across unrelated content on its way reads as a glitch, not motion.
  Resolved as: hidden in transit, animated in when it lands. No flicker, no skating. Worth recording as a
  case where two good intentions conflicted and the resolution was neither one taken literally.
- **The dock is width-capped on the roomy layout**, having run the full iPad canvas edge-to-edge — a web
  banner beside an app of centred columns.

**Verified by looking, both themes at parity:** content behind now bleeds through the dock, the rail
reads at a glance, and Next/Back/Skip have an obvious order.

**⏳ Device-owed:** the haptics. Neither web nor the simulator can feel them, so their actual weight —
whether the medium beats land as emphasis or as noise — is a Phase-6 judgement. The code-addressable
part is done, which is the standing split.

### After-scan
- The frost is a **new BlurView on a surface that renders over live content**; blur cost and appearance
  on device are a real Phase-6 check (the same one the tab bar and `SheetScrim` already carry).
- **Some of the "premium feel" gap turned out to be unfinished correctness, not missing decoration** —
  3.5.3.5.9's scrim fix improved the feel more than any styling here did. Worth carrying into the audit
  gate's premium-bar lens: ask what is *unfinished* before asking what is *undecorated*.

## 3.5.3.8 — verify the arc as an ARC — ✅ COMPLETE (2026-08-02, `8117c4a`)

The before-scan found two gaps that were invisible precisely *because* every individual leaf was green.

**1. Nobody had ever driven the path a real user takes.** Every test either walked the arc by pressing
Next, or exercised a single beat in isolation. The sequence where the leaves have to work TOGETHER —
interacting on beat 3, then on beat 4, then continuing to the hand-back — had never been run end to end.
The new test does that, and asserts the JOIN rather than the beats: beat 4 must **not** still be showing
beat 3's payoff (a stale before→after would narrate the wrong result under the right copy), and the
hand-back must leave nothing of the sandbox behind.

**2. Every screenshot pass had shot beats piecemeal** — whichever beat the leaf in flight happened to
touch. `rn-tutorial-arc-theme.cjs` now walks all seven in order, in both themes, and flags any beat that
lands without a spotlight. Read as a *sequence* it shows what beat-by-beat cannot: whether the tone
holds, whether the dock jumps around, whether the two themes stay at parity the whole way down.
**Result: 7/7 beats, both themes, no missing subjects.**

**a11y was checked rather than assumed.** I suspected the feel pass had weakened Skip by swapping
`Button` for a raw `Pressable` — `Button` turns out to set only `accessibilityRole` too, so they're
equivalent and there was no regression. Worth recording that the before-scan disproved my own suspicion;
it would have been easy to "fix" something that wasn't broken. Announcement parity stays unit-pinned,
since no web e2e can observe it.

**Device-owed and unchanged:** VoiceOver end to end, and the haptics' actual weight — whether the medium
beats read as emphasis or as noise.

### After-scan → the audit gate
Nothing new surfaced in the code; the item's value was in the two verification gaps themselves. The
generalisable lesson, and it belongs on the audit gate's method rather than in a code comment:
**green leaves do not compose into a green arc.** Both gaps here were about the SEAMS between things
that individually worked — which is the same shape as this phase's dominant defect class
("correct but not connected"), showing up one level higher.

## [AUDIT GATE] 3.5.3.9 — ROUND 1 — ⛔ DOES NOT PASS (2026-08-02)

Seven adversarial lenses on Fable 5, run in parallel. **~30 findings. Every one of them was green in CI
at the time.** A correctness-only gate would have closed here — which is the argument for the gate.

Load-bearing negative claims were re-verified against the code before acceptance
([[feedback_verify_critic_claims_on_user_work]]); the ones marked CONFIRMED below were checked directly.

### Honesty / tier — what [D9] rested on
- **CONFIRMED: the finale tells a free user "you decide what to hold." They cannot.** `showAdjust` is
  premium-gated (`PaydayGuardianCard.tsx:111`) and the card's sheet is the ONLY path to
  `setCushionFloor` in the app. The sentence sits in the one beat D9's honesty depends on.
- **CONFIRMED: beats 4–5 narrate premium behaviour as "your Guardian"** (safety net · attestation ·
  release · Recovery) while the finale names only the *holding* — roughly a third of what was shown.
- **CONFIRMED: beat 2 says "The bar is the whole paycheck."** Its domain is `cushion + deployedToDebt`
  (`PaydayGuardianCard.tsx:101`) — post-obligation discretionary only, ~$740 of $2,000, with the real
  figure in the hero directly above it.
- **CONFIRMED: the 3.5.3.5.8 fallback created a new copy defect** — plan-less users are offered the
  walkthrough, and the finale tells them to look at a card that doesn't exist; they land on
  "Set up your paycheck".

### Correctness
- **CONFIRMED: the scripted surprise UN-ATTESTS the user's own tap.** `substrateProducers.ts:79` flips
  `billsAttested` false and sets a walkback, so ~900ms after the user acts the net jumps back up and the
  control reverts — reading as if their tap silently failed. Beat 4's copy never mentions it.
- **SUSPECTED (arithmetic-backed): the milestone ack outranks the release ack.** The persona seeds at
  24.67% paid; roll 1 crosses 25% → `pendingMilestone` → VIS-4 ranks it above `reserve-release`, so
  `today-ack` never mounts, the payoff spotlight measures null, and — interactive beat, no rect — **no
  scrim renders at all**. Payoff missing AND screen unguarded.
- **CONFIRMED (two lenses independently): the no-real-writes guard fires on every step.**
  `TutorialCoach.tsx:38` writes the real store (`updatePrefs({tutorialStep})`) while the sandbox subtree
  is mounted; `before` never advances, so it re-fires for the rest of the session. Dev-only noise today;
  **once Sentry is wired at Phase 6 it is production error spam** — and the guard built to catch real
  corruption becomes 100% noise. It also hollows out the plan's own "real plan **provably** untouched".
- **Geometry:** nothing tracks window WIDTH (Split View leaves ring/hole/scroll stale) · `stageBottom`
  can collapse ≤ 0 at large Dynamic Type · `HEADER_H` is a constant while the header scales · the dock
  ignores `insets.bottom` (Next/Finish in the home-indicator swipe zone).

### Accessibility
- **CONFIRMED: the `Slider` never sets `accessible={true}`**, so it is absent from the a11y tree and
  beat 3's required action is impossible via VoiceOver. **My own 3.5.2 before-scan recorded the opposite
  as settled fact** — I saw three a11y props and never checked the one that makes them apply.
- Beat 4's entire story is unannounced (one `announce()` in the whole path, per-beat only).
- Nothing hides the content behind the scrim from the a11y tree (no `accessibilityViewIsModal` in src),
  so a screen-reader user has swipe access to what a sighted user is fenced out of.

### The premium bar — NOT MET (the binding criterion)
- **CONFIRMED: the frost is a claim, not a material** — `intensity 24` under an **0.82** opaque layer,
  against `SheetScrim`'s 0.28 and the tab bar's 70. A solid card with smudges.
- The scrim hard-cuts while the ring fades — the ring got the motion pass, the darkness around it didn't.
- **Dark is the weak theme, not light** — scrim is `background.primary` at 0.55, near-black over navy.
- Verdict quoted: *"does not read as a tooltip library — it reads as the app coaching itself"*, finish at
  ~85%, three named blockers.

### CLAIM-vs-CODE (the new lens) — 8 confirmed false/stale claims
Including two comments **in one file asserting opposite scrim behaviour**, `useSandboxStore.ts`'s example
teaching the known fresh-object-selector crash, and **my own LOG mislabelling the second haptic**.

**Its diagnosis of the method, which is the most useful thing this round produced:**
> both prior incidents were fixed in code and in the LOG, but the stale claims survived in the
> doc-comments of NEIGHBOURING files — the sweep after .5.9 and [D9] updated the files that changed,
> not the files that talked about them.

### The pattern worth keeping
Several findings are in code written THIS SESSION while explicitly applying the rule they break — "every
line must be true of the screen" (beat 2), the CLAIM-vs-CODE lens (the Slider note), and the .5.8 fix
that introduced a fresh copy defect. **Applying a rule is not the same as verifying it held.**

---

## 3.5.3.9 — the audit gate, ROUND 1 FOLD (2026-08-03, `7bb9e24`)

Jason's call on the ~30 findings: _"Everything gets folded in. No backlog. No debt."_ One block, all
tiers, ordered by shipping risk. The per-finding ledger lives in `DEBT_TUTORIAL_AUDIT_2026-08-02.md` §I;
what follows is what the fold *taught*, which is the part worth keeping.

### The tests were holding two of the defects in place

The single most uncomfortable finding of the whole exercise, and it surfaced during the fold rather than
during the audit. `tutorial-invite.spec.ts` asserted that the finale's line **"you decide what to hold"
was visible** — the exact sentence finding A1 identified as a lie to free users. `tutorialPath.test.ts`
pinned the literal phrase "premium is the part", so the honest rewrite *failed the suite*.

So the suite could never have caught A1. It was configured to fail if A1 were fixed. This is worse than
a gap in coverage: a gap is silent, and this actively pushed back. Both tests now pin the *intent*
(premium named as the agent, all three behaviours present, the lie absent) rather than the wording —
which also unblocks the whole-app wording audit, which those literals would have fought.

**The generalisable form:** a test that asserts an exact user-facing string is a test that will resist
being made more honest. Assert the property, not the sentence.

### `npm run typecheck` was RED on master

Three pre-existing errors (node globals missing from `tsconfig`). Nobody introduced them in this phase;
they had simply been there. A permanently-failing gate is worse than no gate — it teaches everyone to
skip reading its output, and a real regression hides inside the noise it normalises. Fixed as part of
the fold because "no debt" has to include the debt that was already there.

### Two nulls that owe opposite behaviour

`useSpotlight` returned `rect: null` for two entirely different situations — *the subject is travelling*
and *the subject does not exist* — and the overlay had to treat them oppositely. Absent: render no scrim,
or the user is sealed away from the control the beat is asking them to reach. Travelling: keep the scrim,
because dropping it for the ~380ms of transit re-opened the leak 3.5.3.5.9 had closed.

One value cannot carry two meanings that require opposite responses. Hence the explicit `settling` flag.
Worth remembering as a shape: when a fix keeps reintroducing a bug it already fixed, look for a
**value that is overloaded**, not for a missing condition.

### The animation and the touch target disagreed

[D2] gave the scrim's hole a spring so it irises open rather than hard-cutting. That immediately broke
the interactive beats — a *travelling* band sits over the coached control for the entire length of its
journey, so the tap the beat had just asked for did nothing for ~500ms. The e2e reported it as flakiness
(Playwright retried the click until the band moved off), which is exactly how this class hides: the
suite goes green on a retry and nobody looks.

Fixed by splitting the scrim into a **visual layer** (animated, `pointerEvents: none`) and a **hit layer**
(snaps to the destination). The general rule: **when you animate something that also blocks input,
the input geometry must lead the animation, never follow it.**

### The phantom comment was worth making TRUE

`tutorialTargets` claimed to "re-register on layout" and did nothing of the kind. The reflex is to delete
the false comment. But B4 needed exactly that mechanism — an iPad Split View drag, a Dynamic Type change,
or any reflow the arc didn't initiate left the ring, the cutout and the scroll target at pre-change
coordinates, because the only re-measure trigger was the beat's own `revision` key. Implementing the
claim closed a separate finding.

**A false comment is sometimes a design that was intended and dropped.** Read it as a spec before
deleting it as a lie.

### Verified by arithmetic, not by assumption

E6 arrived as SUSPECTED. `Math.max(25, round(held * 0.8))` — the $25 floor exceeds any net under ~$31,
and the `|| 100` fallback scripted an $80 surprise against a net of **zero**. The sandbox scales from the
user's own pay, so a low-income plan lands there, and it fails *convincingly*: the beat still plays, it
just shows the net being overrun in the one beat whose entire point is that the net holds.

### Deliberately not folded

- **The upgrade re-offer (E4).** Its stated justification has been false since [D9]; whether an upgrader
  should replay seven beats for one changed paragraph belongs to the 3.5.1 design gate. Claim corrected,
  behaviour untouched.
- **The card's stacked text links (C4 remainder).** ~34–36pt targets that cannot reach 44 without
  changing the flagship card's vertical rhythm → **3.5.3.10 `[DECISION]`**, not a unilateral fold.
- **`HARNESS_SCENARIO_IDS`, `guardian-line`, the `BeatResult` channel.** Listed as "built, not called";
  they are test- and 3.5.5-facing seams with live assertions. Deleting working capability to satisfy a
  dead-code metric would have been the wrong reading.

### Gate

Typecheck + lint clean · app-layer + scenario suites green · **116/116 e2e, no flakes** · arc, finale and
reserve-payoff screenshots reviewed in **both** themes. Round-2 re-audit of the three lenses that found
something is in flight — **consensus is the gate, not the first green run.**

---

## 3.5.3.10 + 3.5.3.11 — the two audit decisions, built (2026-08-04, `732dac1`)

Both approved by Jason. Neither was foldable during the audit rounds: one changes the flagship card's
proportions, the other reopens a settled design call.

### 3.5.3.10 — 44pt rows on the Guardian card's links

The four stacked links were ~34–36pt, and two of them are the controls the walkthrough *asks* the user to
operate. `hitSlop` was not available as a fix: they sit 12pt apart, so slop wide enough to reach 44 makes
neighbouring targets overlap and the wrong one wins. The height had to come from the gaps, so each link is
a 44pt row carrying its own padding with the margins shrunk to match. Card grows ~30pt — the honest cost.

### 3.5.3.11 — the marker moves from the card to the canvas

**[D6] revised.** It settled the Example marker as CARD-ONLY, on the reasoning that a hero marker would
double the chrome. That was right about the chrome and wrong about the scope, because of a fact [D6] never
weighed: `personalScenario` seeds the user's **real debts, by name and balance**, into fabricated states.
So on beat 5 their actual bills appear inside an invented $200 shortfall, on the hero and required-actions
cards, with no marker anywhere near them. A screenshot cropped below the Guardian title row carried no
indication that any of it was fictional.

**What shipped is smaller than what was approved.** The recommendation was an "Example" ribbon on the
scrim or dock; the switch-in re-read of [[feedback_less_is_more_premium]] ("try the barest version first;
don't default a secondary indicator to a card") argued that down to **a bare `· Example money` appended to
the dock's existing progress row**. No fill, no border, no new surface — one word in a line of metadata
that is already on screen for the entire session. It marks the whole canvas because the dock is always
over the whole canvas.

The card chip **stays**, and that is not redundancy: it is the marker for when the sandbox renders
*without* this overlay, which is exactly what 3.5.4's bounded demo and 3.5.7's web demo will do.

### Two things the build surfaced that the decision didn't

- **The announcement had no marker.** Adding the visible one created a divergence: a sighted user would
  read "Example money" on every beat while a VoiceOver user heard nothing of it — the one user who cannot
  see the card's chip being the only one never told, on a screen reciting their real debts. Folded into
  `stepAnnouncement`, in the same slot, and pinned by a per-beat assertion.
- **The ring cut through the copy above the attestation.** Absorbing the *entire* gap into the row padding
  measured fine and looked wrong: the spotlight insets 6pt beyond its subject, so a 2pt margin put the
  ring's top edge through "Your call". Margins are `xs`. Found by looking at beat 4 — the rows measure
  identically either way, which is the [[feedback_visual_verify_ui_fixes]] lesson again.

**Gate:** typecheck + lint clean · app + scenario suites green · **116/116 e2e, no flakes** · arc verified
in both themes.

---

## [AUDIT GATE] 3.5.3.9 — rounds 2–10, and the close (2026-08-03 → 2026-08-05)

Full per-round detail lives in `docs/DEBT_TUTORIAL_AUDIT_2026-08-02.md` (§J–§S) — this is the outcome only.

**Ten rounds, and every one of them found something real.** Round 2 caught a trap the round-1 fold had
itself shipped. Rounds 3 and 7 were dominated by findings the PREVIOUS round created — the fold is where
the defects came from, not the feature. Round 4 re-judged the premium bar and passed it; round 8 re-judged
it at pixels and failed it again. Round 5 found the tutorial had broken the ordinary app. Round 6 found the
a11y fences were a no-op on web. Round 9 was the first **locked** round: a test that still passed with the
feature deleted, a walkthrough that discarded work the user had just done, and a round-8 finding that had
never been folded at all. **Round 10 returned one MEDIUM per lens and nothing above it. The gate closed.**

**Three rules the loop produced, and they outlive it:**
- **Convergence is per-SURFACE, not per-round.** A lens that returns PASS retires its surface; the next
  pass narrows to what has not converged. That is scoping, not a moved goalpost.
- **DEVICE-UNVERIFIED findings may not carry a blocking severity.** Round 9's show-stopper was found by
  *reading* RN's source; the mechanism was verified link-by-link but the consequence was measured by
  nobody. Rating an unmeasurable inference as blocking means the gate can be failed by a claim nothing can
  refute — and there is always another native inference available. They route to the Phase-6 device ledger
  instead. Fold anyway where the fix is one cheap property: folding is cheap, blocking is expensive.
- **It cuts both ways: a green harness is not evidence that native is fine.** So the honest claim is
  *converged as far as a web harness can see*, never *converged*.

**Jason, 2026-08-05, when the round count was the obvious thing to complain about:** *"I have no issues
with 10 rounds of an audit if it's finding legitimate issues with the tutorial. That's the audit doing its
job. It sucks that we're always finding new things but that's the point."* The signal is whether findings
are real, not how many rounds it takes; the alternative to finding round 9's in round 9 was shipping them.

**Residue:** ledgered at **3.5.3.9-L**, gated by 3.5.6. The native surface belongs to the Maestro lane and
the Phase-6 device pass — which is what made 3.5.6b the next thing built.

---

## 3.5.6b — a native gate for the walkthrough (2026-08-05)

Round 9 named the real constraint: three of its five blockers sat exactly where a web Playwright suite is
structurally blind — native rendering, an OS lifecycle event, and a test asserting against itself.
`native-e2e.yml` already did the hard part (GH macOS runner → prebuild → compile for the Simulator → boot →
Maestro → artifacts) and had four flows, **none of which touched the walkthrough**. Wiring it in changes
what the next round can SEE rather than searching the same lit area again.

**Now green on a real iPhone 17 Pro Max simulator, iOS 26.2:** flows 01 (launch smoke), 02 (sheet native
tap), 03 (row context menu), **05 (the walkthrough, all seven beats)** and **06 (the interactive beats)**.
The beat screenshots come back as artifacts — the first time anything has seen the walkthrough render on
UIKit rather than in a browser.

### What it cost to get there, and what that says about CI evidence

Several rounds of flow-defect fixing, most of it the same lesson: **an assertion that cannot fail proves
nothing, and neither does a green run that produces no artifacts.** One run passed while writing zero
screenshots (Maestro resolves `takeScreenshot` relative to the FLOW FILE, not the working directory).
Another failed inside Sentry's source-map upload and reported it as a bundling error.

### ⚠️ Flow 04 — the tap that opened a schedule deleted a debt instead (`4f4bd48`)

The one red flow, and it earned the whole lane. It failed on `assertVisible: "Payoff schedule"`, and the
end-of-run screenshot showed Money with **Visa gone** — 3 debts / $11,580 down to 2 / $9,180, exactly
Visa's $2,400. One cause explains both halves:

`FormSheet` renders a destructive **Remove** in its sticky action bar whenever the sheet is editing. The
`debt-view-schedule` row is the LAST child of a ScrollView inside a sheet capped at 92% height, so on a
full debt form it sits below the fold — and `tapOn: id` taps the element's **projected centre**, which is
over the action bar. The tap deleted the debt instead of navigating.

**The flow's own comment asserted "`DebtSheet` has no delete control at all". That was false, and it was
the answer** — the claim-vs-code lens the audit rounds ran against the app, turned on the test.

**Folded (`4f4bd48`):**
- Flow 04 scrolls the row into view before tapping. The debt-count instrumentation stays until a green run
  earns its removal.
- **The entity sheets' Remove now confirms** — `DebtSheet`, `ExpenseSheet`, `GoalSheet`,
  `LivingExpenseSheet`. It was a direct action *by design* (`utils/confirm.ts` said so in a comment), while
  the swipe and the long-press menu — the same destructive act on the same record — both guarded. A stray
  tap on a Simulator destroying a debt and its history in one touch retired the design argument with
  evidence rather than opinion. **Jason's call, 2026-08-05.** `WindfallSheet` stays direct: it zeroes an
  amount, it deletes no record. +`tests/e2e/sheet-remove.spec.ts`, covering the CANCEL direction too.
- **`include-hidden-files: true` on the artifact upload.** Maestro writes its per-command logs, view
  hierarchy and failure screenshots under `maestro-debug/.maestro/tests/<run>/` — a HIDDEN path, which
  `upload-artifact@v4` skips by default. The step named "screenshots + view hierarchy" was shipping
  neither, so the failure had to be diagnosed from a single end-of-run screenshot.

**Gate:** typecheck + lint clean · regression / app / scenario suites green · **123/123 e2e**.

### ✅ 6/6 GREEN — 2026-08-06 (`f45ce18`)

Four runs, and each failed **further along** than the last, on a different real thing. That progression is
the lane working: a destructive mis-tap → a frame report that lies → an Android-only gesture.

- **Run 2** — the swipe landed the tap, and the failure screenshot became *the payoff schedule itself,
  correct*: Visa, **Apr 2033 · 80 months · $2,786.29 interest**, full amortization table. **That is 3.7.A0
  proven on real UIKit presentation semantics** — the thing web structurally cannot model, and the reason
  A0.4 was parked for a device build. Two earlier fixes shipped believing they had solved it.
- **Run 3** — failed at `- back`, which is Android's hardware back button and does nothing on iOS, so
  "Money" was asserted with the schedule still on screen. The header control had an
  `accessibilityLabel="Back"` but its only text is a "‹" glyph, so it now carries `testID="screen-back"` —
  which makes **every** `Screen` in the app drivable from a native flow, not just this one.

**Flow 04's debt-count probe is now a permanent invariant, not instrumentation.** Its own comment said to
remove it once the answer was in. The better call: viewing a payoff schedule is a READ, the assertions pin
that the portfolio is identical before and after, and *a read that mutates is invisible until someone
counts.* Nothing else in the suite counts.

### What the beats look like on UIKit — the first time anyone has seen them

Round 8's visual fixes hold on device: the beat-5 ring stops above the dock with the coaching sentence
uncut, corners are rounded with no nubs, the frost isolates, and "Step N of 7 · Example money" is on every
beat. **The Skia cushion bar paints correctly on beat 1** — the device ledger carried that as a risk after
a web capture showed it unpainted; that was a CanvasKit artifact, and it does not reproduce natively.

**Gate:** typecheck + lint clean · full `validate:release:rn` green · **124/124 e2e** · **Maestro 6/6 on
iPhone 17 Pro Max / iOS 26.2**.

### After-scan

- **The one that matters, and it was never a tutorial bug:** `FormSheet`'s Remove destroyed a record in one
  touch, unconfirmed, while the swipe and the long-press menu on the *same record* both guarded. It shipped
  that way and no suite could see it. It took a robot tapping the wrong pixel on a real simulator to find
  it — the lane's first run paid for the lane.
- **Filed to the ledger (§T L5):** "View payoff schedule" is below the fold on the largest iPhone at
  default type, directly above that destructive Remove. 3.7.A0 moved that entry *for discoverability*.
- **Filed to the ledger (§T L2d):** beat 1 leaves a visible gap at the bottom of the Guardian card where
  the replay link is withheld in sandbox. Withholding rather than disabling is the right shape (round 8
  lens C), but it appears to leave its space behind. Observation from the device capture — **verify by
  measuring before treating it as a defect.**

---

## 3.5.4.0 — [D18] the containment model: KIOSK, with terminal exits (2026-08-06)

**Jason's call.** A demo user reaches nothing outside the run. Tabs held, More withheld, no route escapes;
"Start my real plan" and "Unlock Premium" **tear the session down first, then navigate**, so the paywall is
never reached with a demo still mounted.

The alternative considered was letting the paywall be reachable *in-session* — lens C called "a marketing
demo that demonstrates the paywall" plausible and maybe intended. Rejected on what it costs: `/paywall`
writes the real store via `setSubscriptionPlan`, so `useNoRealWritesGuard` would have to go quiet exactly
where a leak matters most. Terminal exits get the same funnel with none of that.

**Three things fall out of the decision, which is why it was worth settling before any code:**
- `useNoRealWritesGuard` stays **strict** — during a kiosk run any real write genuinely IS a leak, so
  3.5.4.5 shrinks from a signature change to a recorded rationale.
- The App-Preview capture is deterministic: no stray tap can end a take, which was lens C's "breaks the
  take" hazard (tabs live, `MoreButton` → `/more`, which has **Reset** on it).
- Containment needs no per-route allowlist over an open route graph — the thing lens C called
  unmaintainable.

### Before-scan — the fences are a one-member class waiting to happen

Verified against the current tree, not the 2026-08-04 line numbers: **all three fences key on
`useTutorialSession(s => s.active)`** — `holdTabs` (`(tabs)/_layout.tsx:32`), `MoreButton`
(`more-button.tsx:29`), and Today's own gate (`index.tsx:661`). A kiosk demo needs all three.

Adding a second session concept would turn each into a two-condition check — **the one-member fix this
gate hit eight separate times**, where a class gets closed at some call sites and not others. So 3.5.4.1
introduces ONE `inBoundedRun` predicate and converts all three sites *before* the second member exists,
rather than discovering the misses afterwards. Same lesson as `a11yHidden()` and `guardianSubjects`,
applied ahead of the defect instead of behind it.

---

## 3.5.4.7 / .9 / .10 — entries, the funnel seam, and what only looking found (2026-08-06)

### .7 — the entries and exits (`dc5b4d1`, `4a05b05`)

Paywall "See it in action" joins the repointed Welcome entry, both behind the single `isDemoReachable()`.
Exits are terminal via `exitDemo` ([D18]), and `replace` rather than `push` so a back gesture cannot
resurrect a torn-down run. The dock is deliberately **not** the walkthrough's: that one coaches, and this
run is watched, so Back/Next/Skip would imply controls that do not exist and steps the viewer is failing
to take.

**⚠️ The exit test caught a broken conversion path.** `/paywall` sat inside
`Stack.Protected guard={onboardingComplete || inDemo}`, so ending the demo **closed the guard on the way
out**: a not-yet-onboarded viewer who tapped "Unlock Premium" landed in onboarding. Broken for exactly the
audience the demo exists for, and invisible to every other test because nothing else walks that sequence.
The paywall now sits outside the guard — a fix, not a relaxation: buying does not require having entered
your data, and nothing links there pre-onboarding, so it opens no new surface.

**🎯 Jason, 2026-08-06: a real user gets the demo in v1.7.** `isDemoReachable()` no longer rides
`QA_TOOLS`, which would have removed the demo and both entries at the Phase-6 flip — a pre-purchase funnel
built and not shipped. Copy approved as drafted. It also exposed a false claim of mine: `qa.ts` said it was
the ONE definition while `/demo` still carried its own inline copy, written before the helper existed.

### .9 — the funnel seam [D-A] (`91a5c30`)

Analytics was kept out of v1.7's core to protect the moat; the demo re-opened it, because a funnel you
cannot see is one you cannot improve and "did anyone finish the demo" is not a fact about anyone's money.

- **No financial data BY CONSTRUCTION.** Every payload is a closed union of literals — no
  `Record<string, unknown>`, no free-form string, no number in the file's types at all. A reviewer-enforced
  rule holds until the first hurried call site; a type holds at compile time.
- **It sends nothing.** `track` forwards to a sink that is null and stays null. [D-A] asked for the seam;
  the Phase-6 privacy/data-flow audit decides whether anything is attached. Wiring a provider now would put
  an egress in the app ahead of the audit built to trace every egress.
- **Opt-out at the choke point**, with a switch in More — a preference with no control is a field, not an
  opt-out. `analyticsOptOut` is optional, so an existing blob migrates by not having it.

### .10 — two defects only looking could find (`c0d5966`)

Everything passed, and the screen was wrong twice.

- **The disclosure was doubled** — "Example money" on the canvas AND in the dock. The same doubling [D6]
  refused, from the other direction: there the dock owns the marker and the canvas withholds; here the
  canvas owns it, because it sits beside the figures and cannot scroll away from them.
- **The dock sat over the tab bar**, cutting the labels in half — a viewer's first impression of the app
  being a clipped control strip. A demo now HIDES the bar. A walkthrough still shows it, deliberately: it
  coaches over the real app, and the tabs are part of what it is teaching you to use.

The containment test changed with it, and the new assertion is **stronger** — the tabs are not merely
fenced, they are not rendered. `toBeHidden` rather than `toHaveCount(0)`, because `display: 'none'` is how
RN hides a tab bar and on web that leaves the node in the DOM while removing it from layout, hit-testing
and the a11y tree.

`/demo` also joins the axe scanner as its own case rather than assuming Today's coverage carries: a new
dock, a marker with a `header` role, and an audience who has completed no onboarding.

**Gate:** full `validate:release:rn` green · **129/129 e2e** · both themes verified by looking, which is
the only thing that caught either defect. ⏳ Native lane owed — the dock, the hidden tab bar and the route
guard are all native-sensitive.

---

## 3.5.4.8 — retire `demoSeed` [D-B] (2026-08-06, `f4c875e`)

The legacy demo wrote a fabricated plan into the user's **real** store via `importStore(demoStore())` and
set `onboardingComplete` to clear the route guard. "See a demo" and "start using the app with invented
data" were therefore the same action, with no way back to an empty plan — the sin `sandboxStore` was built
to retire, and precisely why a sandbox demo needed the guard to admit it (3.5.4.1) instead of buying past
it.

**Repointed, not removed.** [D-B] is *one honest demo system*, and deleting the Welcome affordance would
have left a gap until 3.5.4.7. It now opens the sandbox demo, which writes nothing real and hands back an
empty plan. `isDemoReachable()` is one definition read by both the route and every affordance offering it,
so an entry can never outlive its destination; `WelcomeStep`'s CTA is **withheld** rather than rendered
dead when it is false — the round-8 "nothing renders dead" rule, one screen earlier.

**The payday-capture gate was removed, not pinned true.** Keeping the read would have been worse than dead
code: a v1.6 user who ever tapped "Try with Sample Data" carries `isDemoMode: true` **forever**, so payday
capture stayed silently switched off for them even after they replaced every number with a real one. That
is a live bug for existing users, fixed here as a side effect of the retirement.

### ⚠️ What was deliberately NOT done

The persisted **field** stays, marked inert. Removing a key from the blob is a schema change, and schema
changes belong to Phase 5's migration bridge — the one place upgrade shapes are adversarially tested and
where data-loss is a declared ship-blocker. Tidying it out inside a feature commit would land that risk in
the wrong place, and an unread boolean costs nothing where it sits.

**After-scan → backlog:** the same is true of `prefs.guardianIntroSeen` (Wave C7), so both drop together
with the Phase-5 migration. Separately, `packages/core/testing` still writes and asserts the legacy
`debtPlanner.isDemoMode` localStorage key — harmless, since it tests the Capacitor tree, but it now reads
as a live contract for a flag the RN app no longer honours. Filed to 5.5.1.

**Gate:** full `validate:release:rn` green · **127/127 e2e**.

---

## 3.5.4.6 — the demo's script, and the extraction it justified (2026-08-06, `c05139d`)

**Reordered, on Jason's call.** 3.5.4.4's extraction had no second consumer: the demo had a session but no
script, so the shared API would have been shaped against a guessed caller. That is lens C's own rule —
*"a refactor with one consumer is speculative; do it when the second consumer exists"* — applied to lens
C's own proposal.

### The boundary was much narrower than specced

With both callers visible, `{sandbox, scenario, stage, story, teardown}` was the wrong shape: `stage(index)`
is beat-shaped and the demo has no beats; scenarios and teardown are session-shaped and trivial. What is
genuinely shared is the **timer registry** — and its argument is present rather than anticipatory:
`_layout` cancels pending stories from ONE global background handler, and iOS releases suspended timers
together on resume, so a run whose timers lived in another module would return with its whole sequence
firing in a tick, behind a handler that looked complete. One array means one cancel covers every run **by
construction** instead of by remembering.

### The script

Covered → tight → cannot-be-made-to-work. **Timed rather than tapped**, because the same run has to serve
the in-app demo, the marketing embed (3.5.7) and the App-Preview capture (3.5.8), and only a timed run
gives the capture identical framing on every take. The at-risk stage **is** the free-tier contrast:
Recovery shown rather than described.

### ⚠️ The invariant the whole item turns on

`maxGenuineCycles` is **not** passed. That ceiling is what lets a scripted payday cross the discovery gate
so the safety net RELEASES — correct for the walkthrough, which teaches what the Guardian does over time,
and a lie in a demo, where nobody watching has a history the app could have learned from. Held reserves and
a scorecard-as-future are the day-one truth.

It would also fail **silently**: the run still plays, it just shows an outcome the viewer cannot have. That
is the [E6] shape exactly — a scripted beat that fails convincingly. Asserted per stage and verified red.

**Left open, deliberately:** the watched-run chrome and its copy. The engine is deterministic and testable;
the words and the pacing affordance are taste-facing and belong with 3.5.4.7's entry points, so they are
one review rather than two.

**Gate:** full `validate:release:rn` green · **127/127 e2e**.

---

## 3.5.4.3 — the canvas marker (2026-08-06)

Lens C's blocking item: without it 3.5.4 can neither ship nor be recorded. The card chip marks the CARD;
everything else a sandbox renders — the hero's paycheck, required and recommended actions, affordability,
Recovery — carried nothing, over debts `personalScenario` seeds **by name** into fabricated states. The
walkthrough's dock covered the canvas, and died with the overlay.

**Built at the scaffold, not per screen.** `Screen` mounts `ExampleCanvasMarker` unconditionally and the
component decides for itself from `isSandboxStore`. So a surface a demo can reach cannot forget to carry
it — *including surfaces that don't exist yet*. The alternative, a prop each screen passes, is the exact
shape this phase keeps being bitten by: a class closed at some of its members. Same reasoning as
`boundedRun` one step earlier.

**Three properties, each of which had a way of being wrong:**
- **Above the scroller.** Asserted by POSITION, not visibility — a marker inside the scroll body stays
  "visible" after a modest scroll while having moved, and leaves the screen precisely when the figures
  below start to look alarming. That is 3.5.3.11's own finding about entry copy scrolling away.
- **`header` role, not decorative.** The rotor is how a screen-reader user finds it after arriving
  mid-screen, and it is the one thing that makes everything below it trustworthy.
- **Spoken once on entry**, sharing the `EXAMPLE_MONEY` constant with the visible half so the two cannot
  drift into describing the same money differently.

**Withheld during a walkthrough**, whose dock already says it on every beat — two disclosures is the chrome
[D6] refused.

**The claim that blocked this is now false and was deleted.** `TutorialOverlay`'s comment said a canvas
marker was owed but unbuildable because "there is no overlay-less render path yet, so it would ship dead."
3.5.4.1's `/demo` is that path. Corrected by deletion per [D17], not annotation.

**Verified red-then-green:** regressing the marker to session-keyed — the precise defect it replaces —
fails both new tests, one for absence in the demo and one for doubling in the walkthrough.

**Gate:** full `validate:release:rn` green · **127/127 e2e**.

---

## 3.5.4.1 — the demo seam (2026-08-06, `70c118f`)

**3.5.4.2 folded in.** The provider hoist, the route guard and the `/demo` route are one unit — none of
them is testable alone, and shipping the architecture without an entry would have been dead code, which is
the thing lens C explicitly warned about.

### The predicate, and why it went first

[D18]'s kiosk means the demo needs *exactly* the fences the walkthrough has. Both were keyed on
`tutorialSession.active`, so a second session concept turns each into a two-condition check — and a class
closed at some of its members but not all is the defect this phase kept shipping (the a11y longhand pair,
the sheet backdrops, `measure`, the route-escape fence), every one found by an audit afterwards.

So `useInBoundedRun` landed *before* the second member existed. The fences never learn a demo exists.

**It bit inside the file being converted.** `MoreButton` had three more `inTutorial` references below the
one being changed — `tabIndex`, `a11yHidden`, and the icon colour. Caught only because the conversion was
a sweep rather than an edit at the site the compiler complained about.

**The boundary is recorded, because a claim of totality is what stops the next reviewer checking:** the
predicate has two consumers, and the other tutorial-keyed reads are correctly arc-specific — beat haptics,
coaching copy, the coached-control fences, and Today's own `TutorialRun` branch. Today needed no change at
all: with the provider hoisted, a demo falls through to `TodayContent`, which reads the sandbox through the
context.

### What shipped

- **`demoSession`** — the persona, not `personalScenario`. The audience is pre-purchase and usually has no
  data to personalise, and a fixed persona is also what makes the App-Preview capture identical on every
  device. Dependency-free on purpose: that is what lets the headless suite assert it.
- **`StoreProvider` above the `Stack`** — not around `<Tabs>`, which the tabs layout records as breaking
  tab presses outright. `useAppStore` reads through the context, so every screen a demo can reach resolves
  to the sandbox; with no demo the value is the singleton and `useNoRealWritesGuard` early-returns, so the
  wrapper is inert for every existing call site.
- **The route guard admits a not-yet-onboarded demo.** That audience is the entire point of the
  pre-purchase entry and is exactly who `Stack.Protected guard={onboardingComplete}` turned away; the
  legacy `demoSeed` got past it by writing `onboardingComplete: true` to the real store.
- **The write-guard stays STRICT.** Its own comment said a scope flag was owed at 3.5.4 "when there is a
  demo caller… changing the signature now would mean guessing the demo's containment model." [D18] answered
  it — a kiosk fences navigation, so `/more` and `/paywall` are unreachable with a demo mounted and the
  premise holds. Per the comment convention the false claim was **deleted**, not annotated. 3.5.4.5 shrinks
  to this paragraph.

### Both tests verified RED before green

- Mutating `end()` into two `set` calls fails the split-frame assertion **by name**.
- Reverting the predicate to tutorial-only fails the fence assertions.

The e2e proves the **fences** — More disabled *and* `aria-hidden`, the tab press refused, the real store's
`onboardingComplete` still `false` — rather than reading the boolean back, which would be a test agreeing
with itself. That is the vacuity class this gate found five times.

**Caught by the machine, on me:** `lint:comments` rejected my own comment in `boundedRun.ts` for a count of
code — and the count was also wrong. [D17]'s convention doing its job on its author.

**Gate:** full `validate:release:rn` green · **125/125 e2e**.

---

## CI — the every-push lane was gating an app that was retired a month ago (2026-08-05, `3c796f0`)

`web-e2e` has been **red on every push since 2026-07-24**, and not once because of the code. That is the
day `validate:release` was repointed at the RN gate; the workflow was never repointed with it, so it kept
running `npm run lint` and `next build && serve out` against the retired Capacitor/Next tree. Root eslint
walks into `apps/rn` and rejects `require()` in `metro.config.js` and the Expo plugins — so it died at the
first step, every time, for a month.

**A permanently-red gate is worse than no gate.** It trains you to ignore the one signal that is supposed
to mean something, and here it meant the real suites only ever ran on Jason's machine. It also sat
alongside the *other* CI-evidence defect found the same day (the hidden-path artifact drop) and the one
before it (a green Maestro run that wrote no screenshots): three instances, one shape — **a gate reporting
a verdict it did not earn.**

Now runs `validate:release:rn`'s contents, split into named steps so a red run says which stage died
without opening the log: typecheck → `lint:rn` + the four house guards → regression → app → scenarios →
the RN e2e against the static web export. Adds the typecheck the local gate does not run, plus the `./core`
symlink it needs on a fresh checkout; drops the WebKit download (the RN config declares one project); and
points the artifact paths at `apps/rn`, where Playwright actually writes them.

**The legacy suite now runs nowhere, deliberately.** 5.5.1 deletes that tree, and its Next build no longer
typechecks against the RN sources it was dragged into — so restoring it would mean fixing a build in order
to delete it.

---

## 3.5.8 — switch-in: the capture research, and the assumption it killed (2026-08-06)

The plan required this item to start cold: *"research the capture tooling against current-year guidance
before assuming Maestro."* Done against Apple's own App Store Connect Help and the tools' own docs, per
[[feedback_verify_asc_against_current_year]]. Three of the audit gate's seven questions closed on the way.

### ⚠️ The plan's headline technical claim was FALSE

`DEBT_ELEVATION_PLAN.md` recorded, verified 2026-07-30, that simulator capture *"yields exact store pixel
dimensions"* and that *"one video at the largest size per device family scales to the rest (currently 6.9″
iPhone)."* Apple's spec table says otherwise, and the difference is structural rather than a detail:

**Every modern iPhone slot — 6.9″, 6.5″, 6.3″, 6.1″ — takes the same 886 × 1920 portrait file.** That is
not a device resolution and never was; it is a fixed delivery size. `simctl` records at the simulator's
native pixels (17 Pro Max ≈ 1320 × 2868), so **an ffmpeg conform step is mandatory, not polish** — scale to
886 wide, crop the ~5px of height the aspect difference leaves, force CFR 30. The plan's own framing had
ffmpeg as an optional trim; it is load-bearing.

The good half: the scaling worry was backwards. One correctly-sized file covers the entire modern iPhone
lineup outright, so there is nothing to re-shoot per size.

Re-verified alongside it: 15–30s · **max** 30fps · ≤500MB · H.264 (10–12 Mbps, up to High Profile L4.0) or
ProRes 422 HQ · audio optional, stereo AAC 256kbps if present · up to 3 previews per language · poster
frame defaults to 5s in.

### Two content rules the storyboard did not account for

- **Previews autoplay MUTED.** Apple's own guidance is that on-screen text carries the meaning. The
  five-beat arc has no text at all — it was designed as an in-app demo watched with attention, and the
  premise changed under it at [D19] without the copy being revisited.
- **Features requiring a subscription must be disclosed.** The at-risk beat *is* the premium contrast —
  Recovery shown rather than described. Undisclosed, that is the exact overclaim shape this project keeps
  auditing itself for. → **[D20a]**, below.

Apple's wording is that previews use *"footage captured on device"*, and QuickTime against a connected
device is the path it prescribes. Simulator capture is not prohibited and ASC validates only resolution —
but that sentence is independent support for the draft-vs-submitted split the plan already chose, so it
stays: auto-capture is the iteration path, a device re-run is the fallback for the submitted asset.

### `maestro record` is OUT, and it is worth saying why

Maestro was the incumbent and this is the part of it that does not survive contact. `maestro record`
composites the flow-command panel beside the app, **defaults to 2× speed**, and renders in the cloud behind
a signed URL. It is a share-your-test artifact. Reaching for it because Maestro was already wired is
precisely the move the plan's own research instruction existed to prevent.

### ✅ [D20] The pipeline (Jason, 2026-08-06) — Maestro drives · `simctl` records · ffmpeg conforms

`xcrun simctl io booted recordVideo --codec h264 --mask ignored` produces clean, unbranded pixels through
the simulator's **Metal** Skia path — the same code path as device, and notably *not* the web CanvasKit
path that produced the unpainted-canvas frame in the 3.5.4.11 review. `--mask ignored` drops the
rounded-corner mask Apple does not want baked in. Maestro's job shrinks to almost nothing because the run
is timed: deep-link, wait, one tap on the payoff invitation, hold.

Rejected, with reasons: **XCUITest** — the most faithful driver, but the recorder is the same `simctl` and
it means a Swift UI-test target with no other consumer · **Detox/Appium** — heavier, no fidelity gain ·
**Rotato / Screen-Studio class** — add the device frames and camera motion Apple prohibits for in-app
footage, and are GUI Mac apps, so no CI · **QuickTime + real device** — retained as the fallback for the
submitted asset, not as the pipeline.

### Audit-gate questions, resolved at switch-in

- **Q3 (the launch-into-demo seam) — nearly free, and already built.** `app.json` declares scheme
  `debtplannerrn`, and `demo.tsx` already reads `capture` off the query string, so
  `xcrun simctl openurl booted "debtplannerrn:///demo?capture=1"` is very likely the whole seam. Proving
  it is a step; building it is not. The plan guessed this would have to be added.
- **Q5 (the "~5s hook" vs Apple's 15–30s contradiction) — dissolved at [D19].** The 5s hook belonged to the
  Guardian-only demo. The current arc runs 0 → 20 000 ms plus the celebration hold, ≈25s, inside the window
  by construction.
- **Q6 (practicalities) — ffmpeg is NOT preinstalled on `macos-15`**; Homebrew is, so the workflow installs
  it. Xcode 26.x is present. Everything else stands.

### ✅ [D20a] the muted-viewer line, and ✅ [D20b] the persona's weight (Jason, 2026-08-06)

- **[D20a]** — one restrained caption over the closing beat, carrying the IAP disclosure and giving the
  muted viewer a single anchor of text. Chosen over an end card (spends seconds, and ends on a card rather
  than on the emotional peak) and over captioning every beat (marketing chrome over an app that has
  refused it).
- **[D20b]** — raise the opening frame from *$2,260 across 2 debts* to **3 debts, ~$18–25k**. The beat's own
  note reads *"three debts, a number you recognise"*; the seed had drifted from its own storyboard.

### ⚠️ What [D20b] costs, surfaced by the switch-in scan and NOT yet priced

`personaDebts` is shared with the **walkthrough**, and its comment states the debts are small deliberately
— *"small, recognisable, and payable, so the payoff beats resolve in-tutorial."* So this is not a
demo-local edit. Two further couplings: the bill-budget **solver** binary-searches against the real
Guardian and throws `infeasible` if minimum payments crowd the paycheck, and a larger balance pushes the
**debt-free date** further out, which is the Progress beat's whole message. Measured, not assumed, at
3.5.8.1; if the walkthrough degrades, the fallback is a demo-specific debt set and the "one honest demo
system" principle takes the hit deliberately rather than silently.

### Doc drift found in passing

The plan's 3.5.4.11 line points at *"Log: 3.5.4.11"* and **no such section exists** — that item's detail
lives only in `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`'s capture section. Recorded rather than
back-filled: manufacturing a narrative I did not write would be worse than a pointer that is honest about
where the record actually is.

---

## 3.5.5 — coach-marks: the PARKED decomposition (moved off the plan 2026-08-06)

Jason re-sequenced 3.5.8 ahead of 3.5.5/.6/.7 on 2026-08-06. Under the one-decomposed-section rule the
coach-mark sequence comes off the plan and waits here; it is retrieved at re-switch-in and **re-verified
against the code then**, because a parked decomposition ages exactly like a pre-authored one.

**Switch-in before-scan (2026-08-06) — the inventory had DRIFTED, two entries did not resolve:**
- **What-If EXISTS and stays in scope** — `components/payoff/WhatIfControls.tsx`, a collapsible
  extra-payment tool behind `whatIfOpen` on the trajectory chart, with a green "with extra" overlay curve.
  *(My first scan claimed it was unbuilt; I had grepped `"what if"` and `simulat`, and the symbol is
  `WhatIf`. Jason corrected it.)* **3.7.B1 is an ENHANCEMENT to it** — drag-the-curve direct manipulation —
  not the feature itself. Collapsed behind a toggle is exactly the hidden-affordance shape this item exists
  for.
- **The payoff-schedule row sits BELOW THE FOLD** on the largest iPhone, directly above a destructive
  Remove (ledger §T **L5**, found by the native lane). Marking an off-screen control is worse than not
  marking it → **L5 is fixed first, in 3.5.5.5**.
- **"income-varies toggle" could not be located** as a user-facing control; the variable-income machinery
  exists (`incomeLearning`, the VIS-5 band) but the toggle does not. Verify at 3.5.5.4, drop it if unreal.

| # | Step |
|---|---|
| 3.5.5.1 | **The coach-mark primitive** — one-at-a-time, dismissible, iOS-16-safe, rendered OUTSIDE gesture handlers. Reuses `TutorialShell`'s geometry publishing rather than standing up a second measuring system; the walkthrough's `measure` retry/staleness lessons apply unchanged |
| 3.5.5.2 | **Register in the VIS-4 single-ack slot** — "one at a time" is a claim about the whole app, not about this component. Unregistered, a mark and the tutorial invite can both fire on the same launch |
| 3.5.5.3 | **Seen-persistence + a replay entry** in More, mirroring the walkthrough's. A discovery layer nobody can re-open is a one-shot |
| 3.5.5.4 | **The corrected inventory** — long-press menu · Cash-Runway scrub · Can-I-Afford · swipe-to-delete · chart scrub · **What-If (distinct from the scrub: it is the collapsed extra-payment tool)** · Log-payment · scan-a-statement · widget/Lock-Screen/Siri. Each verified reachable before it gets a mark |
| 3.5.5.5 | **Payoff schedule: fix L5, then mark it** — the entry 3.7.A0 moved for discoverability is off-screen on the biggest phone Apple sells |
| 3.5.5.6 | **Verify + close** — both themes · a11y (the marks must not fence the control they point at) · e2e · native lane |

**Exit:** every hidden affordance that EXISTS has one calm, dismissible, replayable mark; none fires
alongside another ack; and no mark points at a control the user cannot reach.

**⭐ SCOPE DECISION (Jason 2026-07-31): the tutorial stays GUARDIAN-ONLY; coach-marks are how the rest of
the app is taught.** The Guardian is the one feature with a genuinely novel mental model (money held back
BEFORE payoff; a safety net that builds then releases) — Money/Progress are conventional list/chart
screens. Extending the tutorial would blow the ≤7-beat budget, force the 3.5.3.0 store rewire across
Money's sheets too (`ExpenseSheet`/`GoalSheet`/`LogPaymentSheet` are all still singleton writers), and
teach a swipe four beats before the user is on the screen that has it. Contextual beats a tour.

**+3 INVENTORY ADDITIONS (same discussion) — high-value discoveries the list was missing:**
1. **Scan a statement (§2.8)** — on-device OCR is a real differentiator hiding behind an unremarkable
   dashed row on Money.
2. **What-If simulator (§2.2)** — premium, and DISTINCT from the "chart scrub" already listed.
3. **⚠️ The payoff schedule** — **3.7.A0 MOVED it** (edit-sheet header → row long-press menu + a sheet body
   row). Anyone who knew the old location loses it, and new users have no way to find the menu. Relocating
   a feature without adding it to the discovery layer is how it goes dark.

---

## 3.5.8.1 — [D20b] the persona's weight, and the number that could never be credible (2026-08-06)

Raised the persona from **$2,260 across 2 debts → $19,440 across 3** (Credit card $6,400 @22.99% · Car loan
$11,800 @7.49% · Store card $1,240 @26.99%). The opening beat's own note reads *"three debts, a number you
recognise"* and the seed had drifted from its own storyboard.

**The coupling the switch-in flagged was real but cheap.** `personaDebts` is shared with the walkthrough,
where the comment said the debts were small deliberately *"so the payoff beats resolve in-tutorial."*
Measured rather than assumed, against the real engine:

- All three bands still solve — the bill solver never returns `infeasible`.
- The debt-free date moves **September 2029 → November 2029**. Two months, on 8.6× the balance, because the
  minimums rose with it.
- The payoff prime's target (the smallest debt) is still `Store card` at $1,240, and it still clears.
- Nothing in the suite or the e2e pinned the old figures — the only two references were the definition.

One set serves both consumers. A second debt table is a second thing to keep honest, and the walkthrough
only ever needed the SMALLEST debt to be clearable.

### ⚠️ The finding: a comfortable payday and a market rent are mutually exclusive

The raise pushed rent to **$312/mo — 7% of the persona's $4,333/mo income, and less than its own car
payment.** Swept both plausible levers against the engine before concluding anything:

| lever | swept | rent as % of monthly income, `clear` |
|---|---|---|
| clear-band multiplier | 0.6 → 0.95 | 7% → 11% |
| `PERSONA_INCOME` | $1,400 → $3,200 | 4% → 10% |

Neither is a fix, because the cap is structural: **at `clear` the Guardian only leaves room for total bills
of ≈12% of monthly income**, and rent was 62% of that mix. "Clear" *means* the obligations are small
relative to the paycheck, so no line in that list can look like market rent. It was already wrong before
[D20b] (12%); the raise made it indefensible.

**✅ Jason's call: drop Rent from the mix** rather than render an implausible one. The mix is now Utilities
0.28 · Car insurance 0.24 · Subscriptions 0.18 · Internet 0.16 · Phone 0.14 — every line honest at the
budget the solver can actually afford: **$141 / $121 / $91 / $81 / $71** at `clear`. This persona's housing
is simply not a tracked required expense.

Weighted for `clear` and `tight`, the only two bands the App-Preview arc uses. `at-risk` is walkthrough-only
and its budget is ~2.5× the clear one, so its lines inflate — accepted, because that beat is Recovery
sorting what can wait, and **`Subscriptions` went UP 0.07 → 0.18**, so the deferrable pile the lesson needs
grew rather than shrank.

### ⭐ What only building surfaced: the debt-free date is a minimums-only projection

The date was **identical across clear, tight and at-risk** — the tell. Traced it: extra-to-debt is **$0**,
current *and* steady-state. The full `clear` breakdown of a $2,000 paycheck:

```
bills $504 · minimums $590 · living $370 · cash buffer $200 · safety net $134 · Emergency fund $202 → remaining $0
```

The **starter Emergency Fund absorbs the entire remainder on day one.** So the trajectory beat's date is a
minimums-only, EF-first projection. This is NOT a bug and MF.4 is working as specified — it strips the
temporary cold-start holdbacks, and deliberately keeps the floor and the permanent reservations; the EF is
a goal, not a holdback. It is also exactly what a real day-one user's plan does.

**✅ Jason's call: ship the honest date.** The alternative is graduating the Guardian, which is precisely the
claim `demoRun`'s central invariant refuses. Recorded here because the tell — one number that does not move
across three states — is the kind of thing that looks like a defect to the next reader, and the next reader
should find the answer rather than re-derive it.

### After-scan

- **Fixed in-item:** the e2e's `getByText(/Defer/)` was a loose regex that passed for a reason it never
  stated. A bigger deferrable bill gave Recovery a second line — *"Deferring this covers your $200 gap"* —
  and the regex matched twice, failing strict mode. Tightened to `/Defer it/`, the affordance the beat is
  actually about. The *product* got better here; only the assertion was loose.
- **Reconfirmed, already filed:** running a single spec via a bare `npx playwright test` instead of
  `npm run test:e2e:rn` produced a phantom beat-3 failure that the sanctioned runner does not reproduce —
  the Phase-4 harness race, hit again. Use the script.
- **Noted, no action:** `money.tsx`'s category ordering list still names `housing`, which now matches no
  persona bill. Harmless — it orders whatever exists.
- **→ Deferred backlog (cohesion audit):** the app never shows a debt-free date that reflects its own plan
  working, because on day one the EF takes the surplus. Honest per-screen; worth one look app-wide.

**Gate:** tsc · `lint:rn` + all four house guards · regression · app-layer · scenarios · **e2e 129/129**.

---

## 3.5.8.2 — [D20a] the one line the App Preview says out loud (2026-08-06)

Two obligations found by verifying Apple's current guidance rather than assuming it, both discharged by one
caption on the closing beat — because a teaching surface that has refused chrome everywhere else should not
grow a title card at the end:

1. **Previews autoplay MUTED**, and Apple's guidance is that on-screen text carries the meaning. The arc had
   no narration and no text. It was designed as an in-app demo watched with attention, and [D19] changed the
   audience under it without the copy being revisited.
2. **Subscription-gated features must be disclosed.** Verified which ones the arc actually shows rather than
   guessing: `effectivePaycheckBuffer` gates the cushion floor on premium, the uncertainty holdback the
   "safety net" beat turns on is premium-gated acting, and Recovery is premium outright. Beats 2 and 3 are
   premium *behaviour*, not decoration.

**Copy:** *"Debt-free, one paycheck at a time."* over *"Cushion planning and Recovery require Premium."* The
disclosure names what was SHOWN — a disclosure a viewer cannot map onto the footage is not one.

### ⚠️ The design constraint that made it its own component

`DemoCaption` deliberately does **not** read `chrome`. The dock is withheld for the capture because a video
has nobody to let out — but **the capture is the exact run that owes the disclosure**, so gating the caption
the same way would remove it from the only render that legally needs it. `DemoDock` withholds on `!chrome`;
this renders regardless. That inverted condition is the whole reason it is not a block inside the dock.

**Verified RED first, on precisely that defect:** re-gating the caption on `chrome` fails the new e2e by
name. The test asserts the ASYMMETRY — with `?capture=1` the dock is absent and the caption is present —
because asserting it on a chromed run would have passed while the shipped video carried no disclosure at
all. That is the vacuity class the 3.5.3.9 gate found five times.

### Looked at it, both themes, at PHONE size

The first shot came back at the desktop two-column layout, which is not the frame an App Preview is ever
cut from; re-shot at 402×874. The closing beat reads well in both themes: the payoff invitation
("Looks like you crushed Store card!" → "Confirm — it's paid off") is fully visible and **the caption does
not occlude it** — the defect `?capture=1` exists to prevent, which a bottom-anchored banner could easily
have reintroduced. 3.5.8.1's bills also confirmed on screen as credible.

### After-scan

- **→ 3.5.8.7, not fixed here:** the solved bill budget produces cents — *Utilities $141.10, Car insurance
  $120.95, Internet $80.63, Phone $70.55* — which read computed rather than like real bills. At phone size
  they sit BELOW THE FOLD, and the App Preview is phone-only, so they may never reach frame. Deliberately
  not fixed against an unproven need: 3.5.8.7 shoots every beat's first frame and is the step that will
  actually see whether they do. Related to Wave C1's cents sweep, but distinct — that one is `$X.00`
  formatting; this is figures that are not round in the first place.
- **Noted:** the plan's 3.5.4 line still said *"A real user gets it in v1.7"*, which [D19] reversed —
  `isDemoReachable()` now rides `QA_TOOLS` and the demo leaves the shipped app at the Phase-6 flip.
  Corrected in the same edit as this item.

**Gate:** tsc · `lint:rn` + all four house guards (2 pre-existing warnings in `(tabs)/index.tsx`, 0 errors) ·
regression · app-layer · scenarios · **e2e 130/130**.

---

## 3.5.8.4a — the debt-free date shift: does not reproduce, and now cannot return (2026-08-06)

The first of 3.5.4.11's two open capture defects. **Measured on screen, in the real run, at both beats:
the date does NOT move — November 2029 on the trajectory beat and November 2029 on the closing one.**

### The wrong turn, kept because it is the finding

The first attempt asserted this headlessly, comparing `selectDebtFreeDate` on the trajectory beat's store
against the primed closing beat's. It reported a **five-month shift** (November 2029 → June 2029) and it
was **wrong** — not about the arithmetic, about the subject. Today renders its summary on
`withProjectedBalances(store, …)`, which projects balances forward from **`balanceAsOfDate`** — the exact
field `primePayoff` moves 35 days back. A raw-store comparison is therefore a comparison no screen makes,
and it "found" a discrepancy no viewer can see.

That also settles the 3.5.4.11 note, which named `balanceAsOfDate` a *suspected, unproven* cause. It is the
right mechanism; it is simply not producing a visible shift, because the projection consumes the field the
prime moves and lands back on the same month.

Direction is worth recording too: the raw shift ran **earlier**, not later. The original report was a year
*worse*; whatever produced that is gone (the `minimumPayment` cause was fixed at 3.5.4.11, and 3.5.8.1
re-based the persona underneath it).

### The guard

Asserted in the **e2e**, through the real render, walking the real script — not headlessly. Set-based
across both beats: every date on the closing beat must already have been on the trajectory beat, so a NEW
one appearing fails. The screens are the only place this property is true or false, and asserting it there
is immune to which projection each screen picks — which is precisely what the headless version got wrong.

**Still open — 3.5.8.4b, the unpainted Skia canvases.** Not touchable here: it is a first-frame timing
artifact and the 2026-08-06 Maestro run showed the native Skia path painting correctly, so it needs the
runner, not the web export. Carried to the CI steps.

**Gate:** tsc · `lint:rn` (0 errors) · regression · app-layer · scenarios · **e2e 131/131**.

---

## 3.5.8.5 + 3.5.8.6 — the capture pipeline, authored against what this Maestro build can actually do (2026-08-07)

`.github/workflows/app-preview.yml` + `scripts/conform-app-preview.sh`. One dispatch: boot the largest
iPhone → force DARK → install → deep-link into the scripted demo → `simctl io recordVideo` → ffmpeg
conform → upload the video, the per-beat frames and a notes file.

### ⭐ The before-scan finding that reshaped the design: Maestro CANNOT wait

`06-tutorial-interactions.yaml` records it, established over three CI cycles at ~40 minutes each: **this
Maestro build rejects `extendedWaitUntilVisible` (unknown command) and `timeout` on assertions (unknown
property)**, and Maestro validates an ENTIRE FILE before executing any of it, so one bad command costs
every step in the file.

The demo run is timed and does not reach the payoff invitation until **t=20s**. So Maestro cannot drive
the confirm tap — not for want of fidelity, but because it has no way to wait for a timed sequence. That
flow's own header says it plainly: *"An assertion that races a timed sequence is worse than none."*

**Decision: cycle 1 captures WITHOUT the tap.** The run is self-playing, so `simctl` alone captures it end
to end with no driver in the loop at all. The alternatives were both worse for a first cycle — a coordinate
tap through `idb` (whose install is `|| true` on the runner, i.e. allowed to fail silently), or a pre-warmed
Maestro driver, both unproven machinery standing between us and the artifact. The third option —
auto-confirming from the script — is the one that needs Jason, because `demoRun.ts` explicitly reserves
that tap for the capture driver on honesty grounds, and quietly reinterpreting that invariant is not a
call to make inside a CI change.

### The plan's technical claim, corrected in code

The conform is **load-bearing, not a trim**: every modern iPhone slot takes one fixed **886×1920** file,
which is not a device resolution. The script scales with `force_original_aspect_ratio=increase` and centre
-crops, rather than the obvious `scale=886:-2` — the sim device is chosen at runtime, so its aspect ratio
is not something the script gets to assume, and the bare version silently produces a short frame if the
source is wider than 2.167:1. It then **fails loud** on anything ASC would reject, because the entire point
is that Jason drops the file straight into App Store Connect.

### Verified as far as it can be without a Mac

- Both workflows **parse** (js-yaml).
- The frame-extraction loop **dry-run against a stubbed ffmpeg**, and it caught a real off-by-three: the
  recorder pre-rolls 3s before the deep link, so the beats sit at raw 3/7/12/17/23s, not the script's
  0/4/9/14/20. The first draft extracted the wrong frames and would have done so *silently* — the PNGs
  still appear, just of the wrong beats. `PREROLL` is now one env var every offset derives from.
- The conform's validation branches **dry-run against a stubbed ffprobe** across three cases (correct /
  wrong width / over-length); the two bad ones exit 1 as intended under `set -euo pipefail`.
- `-fps_mode cfr` rather than the deprecated `-vsync cfr`, since this runs against whatever Homebrew
  installs on the day.
- ffmpeg confirmed **not preinstalled** on `macos-15`; Homebrew is. Install step added.

### After-scan

- **⚠️ Found: `native-e2e.yml`'s dispatch note named the wrong branch.** It says the workflow must be on
  "the DEFAULT branch (master)" — **`master` does not exist in this repo**; the default is **`release/v1`**,
  which is where that file actually sits and why its button works. Corrected in both files. This is
  operationally load-bearing for 3.5.8.6: **`app-preview.yml` must land on `release/v1` before the Run-
  workflow button appears at all**, even though the work lives on `v1.7-dev` (dispatch then runs the
  selected branch's copy).
- **→ Deferred backlog:** the ~60-line simulator build recipe is now **duplicated** between `native-e2e.yml`
  and `app-preview.yml`, and it carries expensive native fixes (the ios-utilities rootcontentview plugin,
  `SENTRY_DISABLE_AUTO_UPLOAD`, pod-install-as-its-own-step). Extracting a composite action is the correct
  shape and was deliberately NOT done in the change that first proves the pipeline — a bug in the
  extraction would break the proven native gate as well as this one. Filed rather than left implicit.

---

## 3.5.8 — CYCLE 1: green, and it captured nothing (2026-08-07)

Run 31179021997, 18m8s, every step ✅ — build, boot, record, conform, upload. The conformed file was
**886×1920, 25.000s, constant 30fps, H.264 high@4.0**, validated against Apple's spec by the script's own
checks.

**It was 30 seconds of the iOS Home Screen.**

### What actually happened

`xcrun simctl openurl` was fired at a simulator whose frontmost app was **SpringBoard**, because the warm
step had just terminated the app. iOS answered with a confirmation — **"Open in 'Debt Planner (RN)'?"
[Cancel] [Open]** — and nothing was there to dismiss it. The app never launched; the demo never ran; the
recorder faithfully captured the Home Screen for the full 30s.

**3.5.8.3 therefore has a real answer, and it is not the one the switch-in predicted.** The scheme is
right, the route is right, `?capture=1` is right — and the seam still does not work unattended, because
the failure is not in the app at all. Verification earned its place here: the switch-in had this filed as
*"verification, not construction."*

### ⚠️ The worse defect: the pipeline reported a verdict it had not earned

Every step exited 0. The conform produced a spec-perfect file. The artifact uploaded. Nothing anywhere
asked whether **the screen ever changed** — and the evidence was sitting in the artifact listing the whole
time: seven of the eight extracted PNGs were **byte-identical at 807686 bytes**.

This repo has now shipped that exact shape four times: a green Maestro run that wrote no screenshots · an
artifact glob that skipped a hidden path · `web-e2e` red for a month against a retired app · and this. The
first three were caught by a human noticing. So the fix is a check on the **artifact** rather than on exit
codes: five beats that are supposed to show three different screens cannot all hash the same. Under 3
distinct hashes now fails the run and points at `after-openurl.png`.

### Fixes for cycle 2

- **The app is LEFT RUNNING** through the recording. The prompt is SpringBoard asking permission to
  *switch* apps; with the app already frontmost there is no switch to confirm, so the URL is delivered
  straight to it. (Mechanism-level reasoning, not a guess at iOS's mood — it will be proven or disproven
  by `after-openurl.png` next cycle.)
- **`after-openurl.png`** — one screenshot two seconds after the deep link. Cycle 1 cost a log dig to
  explain; this makes the same failure legible at a glance.
- **The distinct-frame guard** above.
- **`SHOT-NOTES.txt` said `trim: start=s duration=s`** — `inputs` is empty on a tag push and this line,
  unlike the conform's, had no `||` fallback. The conform was correct; only the notes lied.

### What cycle 1 DID prove, and it is not nothing

- The whole macOS build path works end to end on the free runner: ffmpeg install, typecheck, prebuild, pod
  install, unsigned sim build, boot, dark-mode, install. The duplicated build recipe is sound.
- **The conform's premise is now measured, not researched:** the simulator recorded at **1320×2868**, which
  is *not* a resolution Apple accepts. The plan's claim that simulator capture "yields exact store pixel
  dimensions" is false in the concrete, and the conform step is load-bearing exactly as re-verified.
- The tag trigger works, so nothing needs to touch `release/v1`.
- Visible in the frames and already tracked: the app icon is a blank placeholder and the name is
  **"Debt Planner (RN)"** — the Phase-6 display-name ship-blocker, seen in the wild.

---

## 3.5.8.7 — the web reference set, and the cents that reached the opening frame (2026-08-07)

`npm run shots:demo` (`playwright.shots.config.ts` + `tests/shots/demo-beats.shot.ts`) — the five beats,
both themes, phone-sized, in capture mode, with filenames MIRRORING the CI artifact's so the two sets sit
side by side. Deliberately outside `tests/e2e`: it asserts nothing, and the gate should not pay ~50s per
run for screenshots nobody is reading.

### ⭐ [D20b] delivered, and then betrayed itself in the type

The opening frame reads **"$19,440 remaining across 3 debts"** — exactly the beat's own note. But the rows
under it read **"$1,240.00 · 26.99% APR"** and **"$45.00/mo"**, directly beneath a hero reading
**"$19,440"**: the same screen in two conventions, because the hero goes through `formatWhole` and the rows
through `formatCurrency`.

I had deferred this to "3.5.8.7 will see whether cents reach frame" on the guess that they stayed below the
fold. **They are on the first frame of the store video.**

**Root cause, one line:** `formatCurrency` set `maximumFractionDigits: 2`, but USD defaults the *minimum*
to 2 — so whole amounts were being padded to `.00`. Fixed with `minimumFractionDigits: 0` (Jason's call,
2026-08-07): cents render only when there are cents, so a real $1,240.37 still shows in full while
$1,240.00 becomes $1,240. Deliberately not `formatWhole`, which would have rounded money away. 50 call
sites, gate green, **e2e 131/131** — nothing had asserted the old strings. This is Wave **C1**'s root; the
app-wide sweep stays filed.

### Measured: what a beat costs to land

| beat | screen | lands after |
|---|---|---|
| 1 debts | Money (first mount) | **+1157ms** |
| 2 held | Today (first mount) | **+1044ms** |
| 3 absorbed | Today (mounted) | +12ms |
| 4 trajectory | Progress (first mount) | **+931ms** |
| 5 payoff | Today (mounted) | +13ms |

**First mount costs ~1s; re-seeding a mounted screen is free.** So roughly a second of each navigating beat
shows the previous screen — which reads as a transition mid-video, but matters enormously for the OPENING
frame, and is what `start_offset` exists to absorb.

### A limit of this tool, stated so it is not mistaken for evidence

`page.screenshot()` does its own stability wait, so the set's "FIRST" frames are **not** truly first
frames — beat 4's FIRST showed a fully-rendered previous screen rather than a blank one. The web set is a
**content** reference (what each beat should say), not a first-frame-timing instrument. Only ffmpeg pulling
an exact timestamp out of a recording answers that, which is the CI side's job.

Skia did paint on web at +3.3s — ring, cash-flow bars and payoff trajectory all present, with coherent
numbers ($8,160 of $27,600 = 30%). **3.5.8.4b remains genuinely open**, because cycle 1 never rendered the
app.

---

## 3.5.8.3 — CYCLE 2: the guard worked, the hypothesis did not (2026-08-07)

Run 31181729459 **failed at the distinct-frame guard**, which is the correct outcome and the first thing
this pipeline has got right about its own honesty: no spec-perfect video of nothing was uploaded, and
`after-openurl.png` explained the failure at a glance instead of a log dig.

### ⚠️ My cycle-2 hypothesis was wrong, and its own evidence disproved it

Cycle 1's fix reasoned that the prompt was *"SpringBoard asking permission to SWITCH apps; with the app
already frontmost there is no switch to confirm."* So cycle 2 left the app running.

`after-openurl.png` shows the app **running and frontmost** — its onboarding screen is plainly visible —
with **"Open in 'Debt Planner (RN)'?" [Cancel] [Open]** on top of it. iOS confirms a custom-scheme open
regardless of what is frontmost. The mechanism argument was clean and it was simply not how iOS behaves.

Recorded because the wrong reason was as expensive as the wrong fix: a plausible mechanism story is exactly
what makes a hypothesis feel like it does not need testing.

### The failure mode also taught the guard something

ffmpeg extracted **one** frame, not eight. A recording of a static screen carries almost no frames to seek
to, so most timestamps resolve to nothing — the step then printed *"distinct settled frames: 0 of 0"* and
blamed identical beats. **Two different failures reported as one, inside the step written to make failures
legible.** Now separated: no frames says the recording is static and names the screenshot to open; identical
frames says the demo never ran.

### ✅ The fix: the URL leaves the path entirely (Jason, 2026-08-07)

`EXPO_PUBLIC_CAPTURE_DEMO=1` is inlined by Metro at **build** time, so the capture build — and only it —
comes up inside `/demo?capture=1` via `CaptureAutoStart`. **A launch is not an open:** `xcrun simctl launch`
raises no dialog. This removes the failure class rather than working around it, which is why it beat the two
alternatives (Maestro tapping "Open" needs a driver warmed inside the recording window; an `idb` coordinate
tap depends on a tool the runner installs with `|| true`).

Two details that are load-bearing rather than incidental:
- **`CaptureAutoStart` navigates to `/demo?capture=1`; it does not call `demoSession.start()`.** `demo.tsx`
  is the one entry — it starts the session, reads chrome off the query param, fires the funnel event and
  makes the a11y announcement. A second starter would be a second definition of "entering the demo," the
  precise shape `isDemoReachable()` exists to prevent.
- **The warm launch now TERMINATES again**, which is not a revert to cycle 1's mistake. A capture build
  enters the demo *on launch*, so the warm run would play the entire script before the recorder attached.
  The recorded run has to be a fresh launch.

`isDemoReachable()` also ORs in `CAPTURE_DEMO`, so a capture build still works after the Phase-6 `QA_TOOLS`
flip — which is exactly the release the App Preview needs re-shooting for.

**Verified before spending a third cycle:** a flagged web export lands on the demo's opening screen from a
cold, not-onboarded start with the dock stripped; and the unflagged export runs the full e2e gate normally,
which is the real proof the branch is inert (131 tests would fail en masse if the flag leaked).

**⚠️ Process note, logged because the plan already warned about it.** While waiting on one `test:e2e:rn`
I started a second — both spawn `serve` on :4319, and the result was a 22-minute run reporting
"41 passed" of 131 with no failures, i.e. a partial run that exited 0. That is the Phase-4 harness race
(`DEBT_ELEVATION_PLAN.md` §Phase 4) hit deliberately-but-carelessly, and it produces the same thing this
whole item has been fighting: **a green exit code covering an incomplete verification.** One runner at a
time; the gate is not parallel-safe.

### ⚠️ A build-time flag leaked into the NEXT build (2026-08-07) — found the expensive way

Proving `CAPTURE_DEMO` worked meant building a flagged web export. The plain `expo export --platform web`
that followed **set nothing and still produced a bundle with the flag true.** `EXPO_PUBLIC_*` is inlined at
build time and Metro's export cache does not treat it as a cache key.

The symptom was maximally misleading: every route auto-entered the demo, so the whole e2e suite failed with
elements *"resolved but hidden"* — the bounded-run **a11y fence**, working perfectly on screens nobody meant
to fence. 80 tests down, and the first read of it was "the run is slow."

`expo export --clear` fixed it; route-smoke went 10/10 on the identical spec that had just failed, which is
what turns a correlation into a cause. Documented at the flag itself, because the production version of this
is silent and severe: a leaked flag ships an app that boots strangers into a demo of somebody else's money.
Release builds come off fresh CI clones, so the real exposure is local — but "small" is not "none."

**Two misreadings recorded, since both cost real time:**
- `test-results/` subdirectories were read as failures. They are created for **attachments** too, and these
  specs screenshot heavily, so most were residue from earlier runs. The honest signal is `error-context.md`.
- The earlier "phantom" beat-3 failure was blamed on the harness race. It was almost certainly this cache
  poisoning — a flagged export had run before it. The race was real and separate; it was not that failure's
  cause, and attributing it early stopped the search too soon.

**Gate, on a genuinely clean bundle:** `lint:rn` (0 errors) · regression · app-layer · scenarios ·
**e2e 131/131 in 4.7m with zero `error-context.md`** — count and failure-artifacts agreeing, which is the
check this whole item keeps proving is worth more than an exit code.

---

## 3.5.8 — CYCLE 3: it captured the demo, and the cut is still wrong (2026-08-07)

Run 31190169324, 27m55s, **green — and green for real this time**: the distinct-frame guard reported
**5 of 5 settled frames distinct**, `raw.mov` came back at **2.4MB** against 353KB when it was recording a
static screen, and all eleven PNGs landed including beat 5's, which cycle 1 could not even extract.

`EXPO_PUBLIC_CAPTURE_DEMO` + `simctl launch` works. The deep link is gone and so is its dialog.

### ✅ 3.5.8.4b ANSWERED — native Skia paints, and paints BETTER than web

The Progress beat on the real simulator renders the progress ring with its glow, all five cash-flow bars
with the dashed $200 line, and the payoff trajectory with its gradient fill and the "Nov 2029" callout
pill — everything present, nothing missing. The unpainted-canvas defect carried since 3.5.4.11 was
**web-only CanvasKit**, exactly as suspected but never proven until now.

That also settles the plan's standing "honest risk" — *the simulator may not render Skia, `expo-blur` or
the mesh gradient faithfully* — in the positive direction, for Skia at least. It is not a reason to prefer
a device capture.

### ⚠️ But the video opens on four and a half seconds of BLACK

Beat 1's FIRST frame is black. So is its settled frame, 3.3 seconds later. The app is still launching.

**The timeline model was wrong.** Raw-file time is `preroll + LAUNCH-TO-MOUNT + script time`, and only the
preroll was modelled. The demo's clock starts when the router mounts, and a cold launch spends ~5s black
before that — so every beat landed ~5s later than the extraction assumed. The frame labelled `beat-4` was
really beat 3; the labelled `beat-1` frames were the launch. **Every PNG appeared, correctly named, and
showed the wrong beat** — the same silent-mislabelling class the pre-roll dry-run caught before cycle 1,
returning through a different door.

Downstream, the 25s cut trimmed at a guessed 3.6s: it opened on black and ended around beat 5's start, so
the closing beat and its caption were largely outside the video.

### The fix: measure the anchor instead of assuming it

`blackdetect` reports the leading black run; its end **is** the moment the app painted, which **is** the
script's t=0. Every offset — the trim in-point and all ten beat frames — now derives from that measured
value, so it self-corrects when launch time changes instead of rotting silently. A dispatch input still
overrides it for a human who has watched the cut. Recording extended 28s → 40s, because the old tail did
not survive a 5s launch.

Dry-run against cycle 3's real numbers: a `black_end:8.23` yields a trim at 8.63s and beat 3 at raw 17.43s —
which is precisely where the mislabelled frame had shown beat 3's tight state. The fallback (no leading
black) drops back to the pre-roll rather than producing an empty offset.

**Still owed at 3.5.8.7/.8:** the beats' true first frames, now that they will actually be of the right
beats; and whether ~1s of first-mount lag per navigating beat (measured on web, visible again here) wants
the script re-paced.

---

## 3.7.A9 — the variable-income controls, and the front door that never existed (2026-08-07)

Found by 3.5.5's coach-mark inventory scan, which set out to check whether an "income-varies toggle" was
real enough to deserve a mark. It was not real at all.

`incomeVaries` was **read by six engine modules and written by no `.tsx` in the app.** It defaults `false`,
so for every real user it stayed false forever — taking the whole variable-income feature set with it: the
VIS-5 debt-free band, `incomeLearning`, §2.0.a lean verification, and the variable cold-start holdback.
`leanAmount` and `typicalAmount` had no UI either, so this was three missing inputs rather than a toggle.

**Why a green suite never noticed:** `vis5-cone.spec.ts` seeds `incomeVaries: true` **straight into the
store** and asserts the band renders. It passes, correctly. The test and the user were entering through
different doors, and only the test's door existed.

### What shipped (Jason ✅ 2026-08-07 — fold in, both surfaces)

`SwitchRow` "My income varies" + a conditional "The amount you can count on" field, in **`PaycheckSheet`**
and **onboarding's `PaycheckStep`**.

- **Both, not one.** `PaycheckSheet` is the non-negotiable half: every existing v1.6 user migrates with
  `incomeVaries: false`, so onboarding-only would have stranded the entire installed base at false — the
  same unreachability, re-created for the people most likely to have irregular income. Onboarding is where
  it gets *discovered*, since nobody goes looking for a setting they were never asked about.
- **The floor is REQUIRED once the switch is on**, and that is the item's real content rather than form
  politeness: `selectDebtFreeBand` needs `leanAmount > 0`, so a switch with no floor leaves everything
  silent and reads as "I turned it on and nothing happened."
- **Cleared, not remembered, when switched off** — a stale floor would keep feeding the engine a number
  the user has stopped standing behind.
- Placed directly under the amount it qualifies, deliberately away from "This paycheck didn't arrive":
  variability is a standing property of the job, a missed paycheck is a fact about this cycle.

### The test drives the UI, and four wrong turns getting there

`variable-income.spec.ts` touches only controls a finger can reach. Every failure on the way was mine, and
each is worth keeping because each looked like a broken feature:

1. **A too-thin fixture** — no debts or bills, so both income runs produced one date and `hasBand` was
   correctly false.
2. **Copied calendar literals** from `vis5-cone`, which the seed helper explicitly forbids. That spec
   survives its literals only because it never opens a sheet; saving re-stamps `currentDate` to today and
   left every seeded bill overdue.
3. **⚠️ Compared a RAW store** to work out why the band was missing — while Progress computes on
   `withProjectedBalances`. That is precisely the error diagnosed and written up in **3.5.8.4a the same
   morning**, repeated within one session. Writing a lesson down does not install it.
4. **The actual cause: `page.goto` is a full reload**, which re-hydrates from localStorage and races the
   debounced persist. A user tapping the Progress tab never reloads. The test now navigates by tab, which
   is both more truthful and not a race.

**Gate:** `lint:rn` (0 errors) · regression · app-layer · scenarios · **e2e 133/133, zero `error-context.md`**.

---

## 3.5.8 — CYCLE 4: green, and its anchor was a fallback wearing a measurement's clothes (2026-08-07)

blackdetect reported exactly one run — `black_start:3.525 black_end:11.655` — against a guard that demanded
`black_start < 1.5`. **Nothing matched.** The pre-roll shows the simulator's HOME SCREEN, not black; the
blackout begins when the app *launches*. So the fallback fired, `MOUNT` became the pre-roll, and the step
announced *"app painted at raw 3s (launch cost 0.0s)"* while `SHOT-NOTES.txt` recorded
*"measured by blackdetect, not assumed."* It was assumed.

**That is this item's own recurring defect, built into the step written to prevent it** — a confident number
with nothing behind it. The correction is two-part: take the first black run that **ends after the launch**
(the blackout by construction, wherever it starts), and make a fallback **loud and labelled a guess** in
both the log and the notes, via `MOUNT_SOURCE`.

Dry-run against cycle 4's real output: MOUNT=11.655, trim at 12.05s, beats at 11.85 / 15.85 / 20.86 /
25.86 / 31.86 — all inside the 43s recording. **The true cold-launch cost is 8.6 seconds**, which no
constant would have guessed and which is exactly why the anchor has to be measured.

---

## 3.5.8 — CYCLE 5, and why `blackdetect` is the wrong instrument for THIS app (2026-08-07)

Run 31196425053, green, and everything downstream of the anchor is right: **5 of 5 settled frames
distinct**, the guard passed, the conform produced a spec-valid file, and the anchor labelled itself
`measured` rather than silently falling back — the cycle-4 honesty fix working.

**Beat 1's first frame is still black.** blackdetect put first paint at 7.183s; the frame 0.2s later is
pure black.

### The cause, and it is specific

**The app's dark theme is nearly black.** So "the end of the leading black run" lands on some faint frame
before any content renders — a status-bar redraw, a shade of near-black crossing the 0.10 threshold. The
same build measured **8.6s on cycle 3 and 4.2s on cycle 5**. An anchor that unstable is *worse* than a
fixed guess, because it presents as measured: exactly the failure the cycle-4 fix was written to close,
reappearing one level down.

### Replaced with something a dark UI cannot fool

Poll `simctl io screenshot` after launch and watch the **file size**. A blank dark screen is tens of KB of
PNG; a screen carrying cards, type and charts is several hundred — measured on this device family at
**260KB blank vs 434–806KB with content**. Hue-independent, threshold-free in the perceptual sense, and it
answers the question actually being asked ("is there content yet?") rather than a proxy for it.

**The trade-off is written into the workflow rather than left to be discovered:** this takes ~12–18
screenshots *during* the recording, the last landing as the opening beat appears. Earlier cycles took
mid-record screenshots with no visible artifact, so the risk is judged small — but a hitch in a cut's first
second should suspect this poll first. 0.5s intervals kept deliberately: the anchor's precision is the
trim's precision, and the trim decides frame one.

---

## 3.5.5.1 — the coach-mark primitive (2026-08-07)

### The registry moved to the root, and its safety argument was rewritten

`TutorialTargetsProvider` mounted inside a running walkthrough on Today — correct while the walkthrough was
its only consumer, and useless for coach-marks, which point at controls on Money, Progress and More. It now
mounts in the root layout; the Today-scoped mount is **deleted** rather than kept, since two providers would
give the walkthrough a second, shadowing registry.

⚠️ The file's constraint-1 comment justified its inertness with *"the provider lives only inside a running
session, so with no provider above it `useTutorialTargets()` returns a null registry."* True until this
change and false immediately after. **Rewritten, not relocated** — a stale explanation of *why* something is
safe is worse than none, because the next reader trusts it. What holds now: `register` is a ref write,
`subscribe`/`invalidate` are a ref-held listener set, and the only React state (`activeId`) stays null unless
something is actively coaching.

**Guarded by the walkthrough's own suite — 28/28**, then the full gate at **133/133 with zero
`error-context.md`**. That mattered: this is the most heavily audited feature in v1.7 (gate 3.5.3.9, ten
rounds), and a provider move is exactly the kind of change that passes review and breaks behaviour.

### What the primitive is, and what it deliberately is not

- **`coachMarks`** — a session store so small it is almost a variable. One-at-a-time is enforced **by
  shape**: `active` is a single id, so a second `show()` is refused rather than queued into a stack of
  callouts. It is deliberately NOT `tutorialSession`: every containment fence in the app reads that flag, so
  a coach-mark riding it would have inherited the walkthrough's kiosk — tabs held, More withheld. A
  discovery hint that fences the app is worse than no hint.
- **`CoachMarkLayer`** — no scrim, nothing fenced, the control live underneath. The walkthrough dims the
  screen because it needs your whole attention for seven beats; a discovery hint is the opposite errand —
  you are mid-task on real money and the app is mentioning something you may not know exists. If the user
  ignores the hint and taps the thing, that is success, not dismissal. Mounted at the root beside
  `TutorialCoach`, outside the screens' gesture handlers, for the reason the walkthrough already paid for
  twice. iOS-16-safe by omission: plain View/Text/Pressable, no blur.
- **`coachMarkCopy`** — starts with ONE entry, on purpose. Filling it is 3.5.5.4, where each affordance is
  verified reachable first. Writing the full table now would be authoring marks for controls nobody has
  re-checked since the inventory drifted — which is precisely how the parked decomposition came to promise
  an income-varies toggle that did not exist (→ 3.7.A9).

**Gate:** `lint:rn` (0 errors) · regression · app-layer · scenarios · **e2e 133/133, zero failures**.

---

## 3.5.8 — CYCLE 6 failed, and the anchor stops being clever (2026-08-07)

Run 31198616159 **failed at the distinct-frame guard** — 0 frames extracted — and the cause was the cycle-5
fix itself.

**`simctl io screenshot` costs ~1.4s per call.** A poll written as *"0.5s intervals, 20 seconds maximum"*
therefore ran for **54.7 seconds**. The demo's entire 20-second script played out while the loop was still
searching for its start; by the time it reported `content appeared after 54.7s (1242450 bytes)` it had found
a chart-heavy later beat, not first paint. `MOUNT` landed at 57.66s, the beat offsets fell in the static
tail, and ffmpeg could not seek to any of them. The 350KB threshold was also calibrated against frames
extracted from VIDEO in cycle 3, not against `simctl` PNGs — the wrong artifact type.

### Three wrong anchors, and the lesson is about when to stop

| attempt | why it failed |
|---|---|
| guessed constant (3.6s) | opened on ~4.5s of black |
| `blackdetect` | the dark theme is nearly black — 8.6s one cycle, 4.2s the next, same build |
| screenshot polling | ~1.4s per call, so the poll outlived the thing it was measuring |

Six cycles, ~2.5 hours of runner time, on where a 25-second video starts. **Everything else about the
pipeline was proven working after cycle 3.** Automating this was worth two attempts and not three; the
honest read is that the simple version should have landed a cycle earlier.

### ✅ What it is now (Jason 2026-08-07)

A **declared constant** — `LAUNCH_ALLOWANCE: 9` — plus a **contact sheet**: the first 40 seconds at one
frame per second, tiled 8×5 with each second's index burnt in. Three anchors have now been wrong and every
one was discovered by downloading the artifact and opening a PNG; a sheet answers *"when did the app appear,
and is the trim in the right place"* at a glance, and turns the allowance into a number anyone can check
rather than one I asserted. Correcting it is a one-line change.

Less clever on purpose. A measurement that is wrong in a way nobody can see is worse than a constant that is
wrong in a way everybody can.

---

## 3.5.5.2 — "one at a time" re-scoped, because the slot it named cannot carry the claim (2026-08-07)

The parked step read *"register in the VIS-4 single-ack slot — 'one at a time' is a claim about the whole
app, not about this component."* The instruction is right about the claim and wrong about the mechanism, and
the drift is worth recording rather than quietly routing around:

- The VIS-4 slot is a **ternary chain inside Today's component**, not a coordinator anything can register
  with.
- Its own comment already concedes the erosion: *"That ranking only governs the FALLBACK now"* — since
  [D5]/3.5.3.5.8 the walkthrough invitation's normal home is below the Guardian card with no slot
  condition, so **it and an ack already render together.**
- Coach-marks live on Money, Progress and More. The slot cannot see those screens at all.

### The smaller claim was chosen deliberately over the thorough one

A genuine app-wide interruption authority is the complete answer, and it would have **exactly one subject**:
coach-marks are the only cross-screen interruption that exists. Building a coordinator for one client is
architecture written against an imagined second caller — the same shape 3.5.4.6 refused when it declined to
extract a shared API before its second consumer existed.

So: **a screen declares while it is interrupting; a mark refuses to fire during one.** Central enforcement
(`coachMarks` decides), local knowledge (Today knows what an ack is; the store must not have to).

Two details that are load-bearing rather than incidental:
- **A COUNTER, not a boolean.** Two surfaces can be mounted at once — Today behind an iPad detail pane, a
  screen behind a sheet — and a boolean lets whichever unmounts second clear a suppression the other still
  needs.
- **`celebration` is read directly, not inferred from `activeAck`.** The celebration *suppresses* the slot
  rather than ranking inside it, so `activeAck` is null during the finale; keying on it alone would let a
  coach-mark land on the one moment that owns the whole surface.

**Gate:** `lint:rn` (0 errors) · **e2e 133/133, zero `error-context.md`**.

---

## 3.5.8 — CYCLE 7: green, and the frames finally say what is wrong (2026-08-07)

Run 31200718573 passed. The declared anchor worked as designed — it reported itself plainly
(*"assuming the app paints 9s after launch → raw 12.00s (verify on the contact sheet)"*) and the frames then
showed it was too late: **the frame labelled `beat-1` is Today, which is beat 2.** Working back from beat 2
starting at paint+4s, the true paint is under 8.2s, so the allowance is **~5, not 9**.

That is the loop working. A wrong constant that announces itself and is contradicted by its own evidence in
one glance is a different thing from a wrong measurement that looks authoritative.

**Three corrections, all small:**
- `LAUNCH_ALLOWANCE` 9 → **5**.
- **The contact sheet failed to render** — `drawtext` needs libfreetype, which this Homebrew ffmpeg lacks.
  The timestamps were a nicety; the tiled sheet is the point, so the filter is dropped rather than the step.
- **Only 3 of 5 settled frames extracted**, and the cause is real: `-ss` BEFORE `-i` is a fast keyframe
  seek, and once the script ends the screen is static so the encoder emits almost nothing to seek to. Moved
  `-ss` after `-i` (accurate seek). Costs about a second on a 45s file and always returns the frame asked
  for — the same class of silent-partial-evidence this pipeline keeps generating.

**Also visible, and good:** the beat-2 frame renders beautifully on device — the Guardian card, its
"Nudge your line down anytime" line, the safety-net/cushion split, Can-I-Afford below. ⚠️ **Noted for the
review step:** the paycheck reads **$1,747**, not the persona's $2,000 that every web reference shows.
Unexplained, and not chased here — but a store video must not show a number nobody can account for.

## 3.5.5 — the remaining decomposition, parked while 3.5.8.9 runs (2026-08-07)

⚠️ **PROMOTED 2026-08-08** — 3.5.8 closed, 3.5.5 is the active build, and the steps below now live in the
plan. What remains here is the **switch-in re-verification**, which is the part worth re-reading at resume;
the step table is kept only as the record of what was parked. **The plan is the live copy.**

**Switch-in re-verification, done 2026-08-07 against the current code** (the parked decomposition was dated
2026-08-06): **.1 was de-risked** — `store/tutorialTargets.tsx` had been built for this by design (*"3.5.5
needs the same thing… ids are free-form strings and nothing here knows about beats"*), so the work was
mounting its provider app-wide **without losing the inert-when-no-tutorial guarantee**, not building a
second measuring system. **.2's premise had DRIFTED** — the "VIS-4 single-ack slot" is a Today-local
ternary chain, not an app-wide coordinator, and its own comment records that the ranking "only governs the
FALLBACK now"; coach-marks live on Money/Progress/More, where that slot has no reach. **The income-varies
toggle now EXISTS** — it did not resolve at the 2026-08-06 scan, which is what surfaced 3.7.A9.

| # | Step |
|---|---|
| 3.5.5.3 | **Seen-persistence + a replay entry** in More, mirroring the walkthrough's. A discovery layer nobody can re-open is a one-shot |
| 3.5.5.4 | **The corrected inventory** — long-press menu · Cash-Runway scrub · Can-I-Afford · swipe-to-delete · chart scrub · **What-If** (the collapsed extra-payment tool, distinct from the scrub) · Log-payment · scan-a-statement · **income-varies (new, via A9)** · widget/Lock-Screen/Siri. Each verified reachable before it gets a mark. ⚠️ **Start from a fresh read** — this inventory has been wrong once already |
| 3.5.5.5 | **Payoff schedule: fix L5, then mark it** — the entry 3.7.A0 moved for discoverability is off-screen on the biggest phone Apple sells, directly above a destructive Remove |
| 3.5.5.6 | **Verify + close** — both themes · a11y (a mark must not fence the control it points at) · e2e · native lane |

**Exit:** every hidden affordance that EXISTS has one calm, dismissible, replayable mark; none fires
alongside another ack; and no mark points at a control the user cannot reach.

## 3.5.8 — CYCLE 8: the mechanics are fixed, and they revealed the real defect (2026-08-07)

Run `app-preview-20260807-08` (31202129089), green in 27m05s. Frame-by-frame review → the audit doc's
**"Capture verification — CYCLE 8"** section, which carries the full table and the byte sizes.

**The three cycle-7 fixes all worked:** the contact sheet renders, the accurate seek returned 8 of 10
frames instead of 3 of 5, and **the `$1,747` did not reproduce** — beat 5 reads `$2,000`, matching every
web reference. Closed as not-reproducing rather than explained.

### ❌ And the video is still not usable — for a bigger reason than the in-point

The frames, at `MOUNT=8.00s`: **8.20s black · 11.30s Money painted · 15.30s Today with an EMPTY BODY ·
20.30s Progress with its Skia geometry ABSENT · 25.30s Progress fully painted · 28.20s the payoff beat,
correct.** The pairs at 11.30/12.20, 15.30/17.20 and 20.30/22.20 are **byte-identical**, so those were not
mid-animation samples — the screen was genuinely static and blank across each window.

Two thirds of a 25-second store video is an app that has not finished rendering.

### The anchor was never a constant, and two cycles prove it

Cycle 7 (allowance 9) worked back to a paint at **under 8.2s**. Cycle 8 (allowance 5) measured a paint at
**~11s** — same build, same recipe, ~3s apart. `LAUNCH_ALLOWANCE` cannot be tuned into correctness because
it is estimating a quantity that moves.

### One cause under all of it

`CaptureAutoStart` fires on the root layout's mount and `playDemoRun` starts its wall clock there, seconds
before a cold launch on a shared runner paints anything. **The script runs ahead of the screen.** Black
opening, empty Today, geometry-less Progress — all one fact, which is also why three attempts to *infer*
the anchor from the recording each failed differently. The recording cannot be asked when the app was
ready; only the app knows.

⚠️ **The 2026-08-06 hypothesis that the unpainted Skia was web-only is DISPROVED** — it is on the native
simulator, at two consecutive samples, on the beat the whole video exists for.

⚠️ **`warm.png` looks flawless and does not discriminate.** Same script, same per-stage re-seeds, perfect
at 25s — but that is a settled frame, not an arrival frame. So it says the app is fine and says nothing
about the arrival lag, and 3.5.8.8 (sim vs device) is not decidable from it: runner CPU starvation would
vanish on a device, `seedSandbox` blanking the tree on every stage would not.

**Residual, smaller:** `beat-5-settled` (31.30s) still extracts nothing — the same static-tail shape the
accurate seek fixed everywhere else.

## 3.5.8.9 — the app states the moment, and the pipeline stops guessing it (2026-08-07)

Jason chose the **slate** over settle-only and a log timestamp: white is unambiguous against a near-black
theme, it is a fact the app *asserts* rather than one inferred from pixels, and it is trimmed out by
construction.

**What shipped.** `playDemoRun` now separates "the opening state exists" from "the clock is running" and
returns the starter; `demoSession` holds it in `startClock` and `releaseClock()` runs it once.
`CaptureSlate` waits for two frames plus a drained interaction queue, shows one opaque white view for
350ms, and hides-and-releases in the same commit — so the frame the slate stops covering IS the script's
t=0. The workflow finds it with `negate,blackdetect` (there is no `whitedetect`; `pic_th=0.90` because the
Dynamic Island inverts to a bright ~1% patch), derives the trim and every extraction offset from it, and
**fails loudly with no fallback** if it is absent. `LAUNCH_ALLOWANCE` is deleted rather than retuned.

### Why deletion, not a better constant

Cycle 7 worked back to a paint under 8.2s; cycle 8 measured ~11s. Same build, same recipe. Four strategies
had tried to recover that number FROM the recording — a guessed constant, `blackdetect`, screenshot
polling, a declared allowance — and the two independent measurements settle the question: the recording
does not contain it. Only the app knows, so the app says so.

⚠️ **The property that matters is not precision, it is the failure shape.** If the settle before the slate
is too short, the slate lands early and the cut opens early — graded. The old constant being wrong by 3s
put the trim on black and every extracted frame on the wrong beat, with nothing in the artifact saying so.

### ❌ The bug this introduced, and the rule it produced

The hold was keyed on `?capture=1` and the release on `CAPTURE_DEMO`. Those are not the same condition:
`CaptureSlate` is inlined out of every non-capture build, so on the web export the e2e drives
`/demo?capture=1` into a run whose clock nothing could ever start. Two specs failed on a demo frozen at
beat 1.

**Two conditions that must agree are one condition.** The hold now reads `CAPTURE_DEMO`, the same flag that
decides whether a releaser exists; `?capture=1` keeps only the job it can do alone (stripping chrome,
which 3.5.7's embed will want without being a capture build). And the releaser is deliberately NOT gated on
`CAPTURE_DEMO`, so "anything held is always released" holds by construction rather than by two flags
staying in sync.

Also caught by inspection: the slate is mounted **last** in the layout. It had been placed beside
`CaptureAutoStart`, where four overlays render after it — and a slate with anything showing through is a
slate the detector cannot trust.

### ✅ Proved before spending a cycle

A capture-flagged web export, served, driven by a ~40-line script: the white overlay appeared at **1.32s**
(after the app painted), held to 1.59s, cleared, and the script ran through to its closing caption. The
JPEG of those frames collapsed to **3,147 bytes** against 19,265 for the transitional one — independent
confirmation the frame really is flat white, which is the detector's entire premise.

Four minutes, and it would have caught the condition split before CI. Eight cycles at ~27 minutes have
been spent on this class of thing. Filed to the backlog as a permanent pre-flight rather than folded in —
it has to handle the `EXPO_PUBLIC_*` cache footgun and restore the clean bundle, which is a workstream.
(The flagged bundle was replaced with `expo export --clear` and the leak verified absent; the serve on
:4321 was identified by PID and closed.)

### What this does NOT fix

The empty Today on beats 2–3 is a **post-navigation** paint lag, not a launch one — the slate anchors the
timeline, it does not make a screen render faster. So the contact sheet went 1fps → **2fps**: the next
artifact measures how long each screen actually takes to paint after the script moves, which is the
evidence 3.5.8.8 (simulator vs device) needs and does not currently have.

**Gate:** `lint:rn` · `test:regression` · `test:app` (29 assertions, up from 18) · `test:scenarios` ·
`test:e2e:rn` **133/133**.

## 3.5.8 — CYCLE 9: the anchor holds, and the slate fires one beat too soon (2026-08-07)

Run `app-preview-20260807-09` (31208978159), green in 18m14s, `T0 = 2.393s` **found**. Frame review → the
audit doc's cycle-9 section.

**The mechanism works.** All ten frames extracted (cycle 8 got eight — the static-tail fallback closed it),
and beat 2 arrives at `T0 + 4.1s` against a declared `at: 4000`, so the offsets are trustworthy for the
first time. That is the precondition for everything else, and it is what four cycles of anchor-guessing
never delivered.

### ❌ But the app was not on screen when it said it was

`beat-1-FIRST` is the iOS launch-zoom animation. The slate had fired over a root that had not painted.

**The evidence was in the detector's own output and nothing was reading it:** the app holds the slate for
350ms and `blackdetect` reported `black_duration:0.205`. The missing 145ms happened before the window was
composited, so the recorder never saw it. `rAF ×2 + runAfterInteractions` is a *the JS thread got a turn*
signal, not a *content is on screen* one — and on a warm launch the JS thread is free almost immediately.

Two corrections, and the second matters more than the first:
- **Gate on `AppState` reaching `active`** — the OS saying the launch transition is finished, which is the
  earliest moment anything the app draws is in the recording at all — plus an 800ms compositing settle.
- **Assert the recorded slate is as long as the held one.** A shortfall means exactly one thing, and it was
  sitting in the log while the run went green. This is the fourth time this pipeline has produced a green
  run whose artifact was wrong; every one of them had a tell nobody had written a check for.

⚠️ **`CAPTURE_SETTLE_MS` is a constant, and that is not a regression to `LAUNCH_ALLOWANCE`.** That constant
had to predict a cold launch, which moved 3 seconds between cycles. This one covers a fixed compositing
step after a signal the OS gives; being wrong opens the cut slightly early instead of putting every
extracted frame on the wrong beat — and now it fails loudly rather than silently.

### ⚠️ Two smaller findings, both from frames the fixed anchor finally made readable

- **The FIRST-frame offset could not survive a navigation.** `beat-4-FIRST` shows beat 3's screen: at
  `+0.20s` the stage's navigation has not landed, so the sample catches the outgoing screen. → `+0.80s`.
- **A transient `$790` on Today's arrival**, for about half a second before it settles to the persona's
  `$2,000`. Same class as cycle 7's `$1,747`, which did not reproduce. Filed for the review step.

### ⚠️ What cycle 9 does NOT establish

This runner painted **~1s** after launch where cycle 8's took **8–11s**. So "no multi-second blank screens"
is not evidence the arrival lag is fixed — it is more evidence of how much the runner varies, which is the
same fact that killed the declared allowance. 3.5.8.8 still needs a slow-runner cycle, or a device.

**Pre-flight re-run before cycle 10:** slate at 2.25s (was 1.32s — the settle, visible), cleared, script ran
to its closing caption. The `AppState` gate does not strand it where `AppState` is already active.

## 3.5.8.9 CLOSED — CYCLE 10: every beat's first frame is painted (2026-08-07)

Run `app-preview-20260807-10` (31211254519), green in 18m41s. `T0 = 5.267s`, and **the slate recorded
0.377s against the 0.350s held** — the window was composited when it fired, which is exactly what cycle 9
got wrong and what the new assertion exists to catch. 5 of 5 distinct settled frames, no extraction fell
back to the static-tail path. Frame table → the audit doc's cycle-10 section.

**The check that failed in cycles 8 and 9 passes.** `beat-1-FIRST` is a fully painted Money screen —
`$19,440` across 3 debts, all three cards, the Focus badge. Beats 2, 3 and 5 are painted and correct;
cycle 9's transient `$790` did not reproduce, like cycle 7's `$1,747` before it. Both were arrival-render
transients on a slow runner, not wrong numbers.

### ⚠️ The finding that matters more than the fix: cycle 8 was misread, and the correction is load-bearing

`TrajectorySkiaChart` animates over **850ms**; `CushionBarChart` and `JourneyRingChart` animate with it. So
Progress arriving with an undrawn ring and no curve is the **first frame of a designed reveal** — in a
store video, a chart drawing itself is the shot, not a defect. Measured at ~1.7s on this runner against a
6s beat.

But cycle 8 showed byte-identical frames **1.9s apart** with nothing drawn, which an 850ms animation cannot
produce. One explanation covers both: **on a fast runner the reveal plays; on a starved one the animation
never starts.** Cycle 8's runner painted 8–11s after launch, cycle 10's in ~1s.

**That is the evidence 3.5.8.8 was missing, and it points at the device.** The simulator's risk was never
Skia fidelity — 3.5.8.4b settled that and the settled frames are beautiful. It is that a shared runner's
speed decides whether the motion happens *and nothing in a green run says which one you got*. A fast cycle
would look perfect, ship, and the next re-shoot after a UI tweak could silently produce a video whose
charts never draw. The plan's own risk paragraph predicted this shape: the simulator lane is the
draft/iteration path; the submitted asset wants a device.

**Exit met:** a CI artifact that passes the ASC conform, whose every beat's first frame is painted and
correct. What remains is Jason's review of the cut and the two decisions.

## 3.5.8 — the conform ignored the anchor, and I checked the evidence instead of the deliverable (2026-08-08)

🎯 **Jason watched cycle 10's video: *"There is some time before it starts but what's there looks good."***

Measured rather than guessed — mean luminance of the conformed file, decoded frame by frame:

| video t | mean luma | what |
|---|---|---|
| 0 → 3.0s | **0.3** | black |
| 3.9s | **251.1** | **the capture slate, in the shipped file** |
| 4.3s onward | 27.0 | the app |

So the deliverable opened on ~3.6s of black, then flashed the internal timing mark, then started. Nearly
four seconds before anything appears — exactly what he saw.

### The cause: `-ss` before `-i`, in the conform

`conform-app-preview.sh` seeked with `-ss "$START" -i "$RAW"`. Before `-i` that is an INPUT seek, which on
a variable-frame-rate simulator `.mov` lands on the nearest keyframe rather than the moment asked for. The
workflow passed `5.32s`; the file began around raw `1.2s`.

**This is the same lesson the frame extraction learned at cycle 7, in this same pipeline, never carried
across to the step that makes the actual deliverable.** Moved after `-i` (accurate seek).

### ⚠️ The real miss is not the flag — it is what was never examined

Three cycles were spent making the anchor exact, and the step that consumes it was throwing it away. That
survived because **every check in this pipeline looked at PNGs pulled from `raw.mov`, and nothing ever
looked at a pixel of the mp4 being shipped.** The container was asserted thoroughly — dimensions, duration,
frame rate, profile — and the container was fine. The content was never asked about.

The pipeline's own history says this out loud: a green Maestro run that wrote no screenshots, an artifact
glob that skipped a hidden path, a web-e2e red for a month against a retired app, cycle 1's spec-perfect
recording of the Home Screen. Every one is the same shape — *check the artifact, not the exit code* — and
this is that shape one level further in: check the ARTIFACT YOU SHIP, not the evidence beside it.

**So the assertions now run on the conformed file:**
- **the slate must not survive** (`negate,blackdetect` over the output — a full white frame is the one
  artifact this pipeline deliberately creates, and it must never leave it), and
- **it must not open on black** (a black run starting within 100ms of t=0).

Both fail the build. Neither could have passed on cycle 10.

*(Decoding note for anyone reproducing this locally: no ffmpeg on the Windows box can read H.264 —
Playwright's bundled build is `--disable-everything`. Edge decoded it, seeking and drawing each frame to a
canvas for the luma readings above.)*

### ❌ CYCLE 11 — and the new guard aborted the build by PASSING

The trim fix worked (`T0 = 9.195s`, found; the conform honoured it). The run still failed, with **no error
message at all**.

The cause is in the guard I had just written: `FIRST_BLACK=$(ffmpeg … | grep -o 'black_start:…')`. A `grep`
that matches nothing exits 1, `pipefail` propagates it, and under `set -euo pipefail` the command
substitution takes the whole script down. **There was no black to find — so the check succeeded, and
killed the run.** A guard whose success is indistinguishable from its failure is worse than no guard.

Fixed with `|| true`, and reproduced locally in four lines before touching CI.

### ✅ `scripts/test-conform-assertions.sh` — because reading it was not enough

The conform's assertions have now been wrong twice at ~17 minutes a cycle, and the second failure was
invisible to review: the bug was in shell semantics, not in logic anyone could see by reading. So the
assertions now have a test that stubs `ffmpeg`/`ffprobe` on `PATH` and runs the real script — clean video
exits 0, surviving slate exits 1, black open exits 1, out-of-window durations exit 1. Runs in about a
second, anywhere, no Mac.

It asserts CONTROL FLOW, which is the part that broke. Whether `blackdetect` finds a real slate is still
what the CI cycle is for. **Not wired into `validate:release:rn`** — that gate is JS and adding a shell
runner to it is a decision, not a side effect of this fix.

### Also learned: the cut is shorter than requested, and that is fine

Cycle 11 asked for 25s and produced **21.1s**. `simctl` records variable-frame-rate and a static screen
emits NO frames, so once the script ends the recording stops advancing — asking for 25s from a file whose
last frame is at ~30.3s yields what is actually there. It covers the whole arc and sits inside Apple's
15–30s window, so it is not a failure; the conform now SAYS it rather than leaving it to be wondered about.

⚠️ And `T0` was **9.195s** here against cycle 10's **5.267s** — the launch-to-paint variance, again, on the
same build. Every cycle keeps re-proving why the declared allowance had to go.

### ✅ CYCLE 12 — the deliverable opens on the app (2026-08-08)

`T0 = 10.645s` (slate held 0.413s), trim from 10.70s, **886×1920 / 24.30s / CFR 30 / H.264 high@4.0**. Both
content assertions passed silently.

Verified **on the mp4**, decoded frame by frame rather than inferred from the evidence beside it:

| video t | cycle 10 | cycle 12 |
|---|---|---|
| 0 → 3.0s | 0.3 (black) | **27.0 (the app)** |
| 3.9s | 251.1 (the slate) | 27.1 |

**Frame zero is a fully painted Money screen** — `$19,440` across 3 debts, all three cards, the Focus badge.
No dead air, no slate.

`T0` across three cycles: **5.267 · 9.195 · 10.645** — same build, same recipe.

🎯 **APPROVED 2026-08-08: *"The video looks good. Approved."*** — the CUT. Both remaining decisions were
put to Jason with the evidence, and both are now answered.

## 3.5.8.6b + 3.5.8.8 — RESOLVED (Jason, 2026-08-08)

### 6b — the closing beat confirms itself (`useCaptureAutoConfirm`)

The arc is situation → mechanism → proof → trajectory → **triumph**, and the triumph was an un-pressed
button. `demoRun` had reserved that tap for an external driver on honesty grounds — **and that ground had
moved**: the constraint was written to stop a demo that would SHIP from claiming an action its viewer had
not taken, and [D19] pulled the demo out of the app entirely. A marketing video showing what the app does
claims nothing about the viewer. The strictly-more-truthful option (a driven coordinate tap) is the
machinery that already cost three CI cycles at ~40 minutes without landing; chosen against on cost, with
the reasoning recorded rather than the choice quietly made.

Scoped as narrowly as it goes: capture builds only, a live demo only, the FINAL stage only, once — calling
the screen's own `confirmPayoff`, so there is no second definition of "a payoff was confirmed".

⚠️ **It is the per-debt `VanquishedBeat`, not the full-screen `PaidOffFinale`.** The persona carries three
debts and `isLastLiveDebt` is false, so paying one off fires "Store card · Vanquished · Paid off" with the
freed payment. That is the *correct* celebration here and it is consistent with the demo's day-one bound —
the finale would show a viewer a total debt freedom the run has not earned.

### 8 — ship the simulator capture, and make the failure impossible to miss

The simulator's risk was never Skia fidelity (3.5.8.4b) — it is that the chart reveals are ~850ms entrance
animations that **do not start at all on a starved runner** (cycle 8), and nothing in a green run said
which runner you got. A device re-run needs a Mac that does not exist here.

So the guard states it directly: **the Progress beat must CHANGE between its arrival frame and its settled
frame.** If they are byte-identical the reveal never ran — which is precisely the fingerprint cycle 8 left.
Fails the build, with the advice to re-run and, if it repeats, shoot on a device.

**Pre-flighted before the cycle** (the third time this has paid): a capture-flagged web export served
locally reached the closing beat and rendered "Vanquished" unaided. Gate green — `lint:rn` ·
`test:regression` · `test:app` · `test:scenarios` · `test:e2e:rn` **133/133** · conform assertions 5/5.

## 3.5.8 CLOSED — CYCLES 13 & 14: ✅ APPROVED (Jason, 2026-08-08)

Frame-level verification of the approved cut → `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`,
**"Capture verification — CYCLE 14"**.

### Cycle 13 — the celebration reached the file, in its final tenth of a second

6b worked: the app confirmed its own invitation and the celebration was recorded. It landed at the very
end of a 25s cut — **present, and effectively absent.**

The cause is not the celebration; it is that **the script's stage timers are wall-clock and the runner is
not.** On a loaded machine they fire late — cycle 13 still had the Progress beat on screen at 23.8s
against a declared 20s — so a *fixed* 25s trim amputates the ending exactly when the machine is slow, and
only then. The failure is invisible on a fast runner, which is the worst shape a defect can take here.

**Fix: the duration becomes a 29s CEILING rather than a 25s pad** (Apple's window is 15–30). It costs
nothing when the runner is fast, because `simctl` stops emitting frames once the screen is static, so the
cut ends where the content does — cycle 12 asked for 25 and got 24.3.

### Cycle 14 — green, and the one check no guard covers was measured

Run `app-preview-20260808-14` (31244485894), 18m59s. Every guard green; conform `886x1920, 28.933008s,
constant 30fps, H.264 high@4.0`.

**The celebration enters at 24.13s and holds to the 28.93s end — 4.80s of room, against cycle 13's 0.1s.**
Measured by decoding the tail in Edge, because no guard can express "long enough to land": a frame one
tenth of a second before the end is still a frame, and every frame-comparison guard passes on it.

⚠️ **A flat aggregate is not evidence of a still frame.** The gold/luma readings were byte-constant across
the last 4.7s — the exact signature of a video ending on a freeze, and it would have been reported as one.
Checksumming the frames showed continuous change throughout: the celebration settles into a small ~0.3s
looping element that a whole-frame average cannot see. The metric was insensitive, not the footage static.

### ⚠️ The defect found at review: the notes were describing a different file

`SHOT-NOTES.txt` reported `trim: start=measured duration=25s` for a **28.933s** file. The notes step
carried **its own copy** of the conform's default and nobody moved it when the ceiling went 25 → 29 — a
duplicated default, sitting three lines under a comment warning about precisely that kind of quiet
divergence.

Fixed at the root rather than by editing the number: the conform step publishes `TRIM_START`/`TRIM_DUR` to
`GITHUB_ENV` and the notes read those, reporting the **ceiling beside the file's `ffprobe`-measured
length** — the request and the result are different facts and the notes had been conflating them. YAML
re-parses clean; the step is `if: always()` and every value falls back loudly (`NOT SET`, `not measured`).
Not worth an 18-minute cycle to prove on its own — it rides the next capture run.

> **The rule this extends.** [[feedback_check_the_shipped_artifact]] says assert on what leaves the
> building. Cycle 14 adds: **the evidence file beside the deliverable is not automatically true either.**
> It is produced by a different step, which can drift from the one that did the work — and a plausible,
> confident sidecar is harder to doubt than a missing one.

### Retrieval

The CI artifact expires ~90 days from 2026-08-08. The cut is deterministic (frozen base date), so the
pipeline reproduces it — but the UI **will** change before submit (3.5.5, 3.7, the cohesion audit, the
Phase-6 finish sweep), so **the submitted asset is a re-shoot of this pipeline, not this file.** What
cycle 14 establishes is that the pipeline produces an approvable one.

## 3.5.5 resumed — and .5 runs before .3 (2026-08-08)

3.5.8 closed, so 3.5.5 took the active slot. **Order changed at switch-in (Jason):** `COACH_MARKS` holds
one entry and it is registered nowhere, so .3 would have built seen-persistence and a replay entry for a
layer that marks nothing — unverifiable by looking, on a project where looking is what has caught the last
four defects. .5 goes first to make one real mark exist. Ids kept stable; the log and commits reference
them.

### Switch-in findings, against the current code

- **Persistence has a clean home.** `prefs.tutorialSeen`/`tutorialStep` landed under schema **v7**, and
  `models.ts` records that v7 **has not shipped** — so coach-mark seen-state joins v7 without a second
  bump, additive and backfilled by the prefs merge.
- ⚠️ **A trap for .3:** `StoreContext`'s `TUTORIAL_WRITABLE_PREFS = ['tutorialStep','tutorialSeen']` lets
  those two escape the sandbox to the real store, because tutorial resume state must outlive it.
  Coach-mark seen-state **must not join that list** — a mark seen in the Example world would burn a real
  user's one-time hint. It is exactly the entry that gets added by symmetry, so it needs to be a stated
  decision rather than an omission.

## 3.5.5.5 — [L5] the payoff-schedule entry stops being a scroll away (2026-08-08)

**The defect:** 3.7.A0 moved "View payoff schedule" into the debt sheet's body *for discoverability*, and
on the largest iPhone at default type it was below the fold — with the destructive Remove as its nearest
neighbour (native hierarchy 2026-08-06: row at `[20,877][420,925]`). Remove now confirms via
`confirmDelete`, so this is a reachability defect, not the data-loss one the Maestro lane caught.

**The fix:** a `footerAccessory` slot on `FormSheet`, rendered between the scrolling field body and the
sticky actions, in both the Modal and the inline-pane paths. The row moves out of the scroll into it. The
submit button now sits between the entry and Remove, so a mis-tap on a secondary navigation row can no
longer land on a destroy. Both alternatives were already ruled out by hardware: last-in-scroll is the
defect, and the header is where 3.7.A0 started before a presented Modal occluded it.

Gate green — **`validate:release:rn` 134/134**.

### ⚠️ The test I wrote first was unsound, and it passed

`toBeVisible()` cannot express L5 — it is satisfied by a box anywhere in the document, and Playwright
scrolls to an element before clicking it, so the existing spec passed throughout the defect's life
([[feedback_green_suite_often_means_untested]]).

My replacement asserted `y + height <= viewportH` — and that is **not measurable on the web**, because
react-native-web renders the sheet in normal document flow, so the row's absolute `y` tracks the height of
the Money list behind it. It passed once (`y=777`) and failed later (`y=1421`) on the same correct build,
with the DOM order right both times. The number was never about the sheet.

Rewritten to assert the structural claim the web genuinely holds: **the entry is not a descendant of any
scroll container**, and Save precedes Remove after it. That is the thing that changed, and no amount of
form content can undo it. Where the row lands in device points stays the Maestro lane's question — which
is what this spec's own header said before I started.

⚠️ **Also real, and separate:** one run genuinely measured a stale bundle (schedule ordered *after* Remove,
which the fixed source cannot produce). `export:web` is `expo export --platform web` with **no `--clear`**,
and `reuseExistingServer` can skip the re-export entirely. Two different causes wearing the same red X —
the diagnosis only came apart by reading the DOM order in the failure snapshot rather than the coordinate.

**Proved the guard fires:** with the fix stashed and a `--clear` re-export, the new test fails; restored,
6/6. Confirming a guard fails on the defect it names is the only thing that separates it from decoration.

### The coach-mark half — the first real mark, and what it cost to land

**Why it needed building at all:** `CoachMarkLayer` is mounted at the app ROOT by design, and a root-level
overlay is a **sibling** of a presented `Modal` — so on device it renders *behind* the sheet. That is not a
hypothesis; it is the failure `payoff-schedule.spec.ts` opens by describing, and it killed 3.7.A0's header
button. Every one of the six previously registered targets is on Today's main screen, so nothing in the app
had ever exercised this. **The web cannot see the difference** (one DOM tree), so it would have shown a
working mark either way. 🎯 Jason chose the nested layer over re-siting the mark, because .4's inventory has
several more sheet-resident affordances (What-If, log-payment, scan, Can-I-Afford) that hit the same wall.

**Three findings, all kept on the branch:**

1. **The "no orphan targets" invariant assumed a single consumer.** `spotlight.test.ts` asserted every
   registered `TutorialTarget` is coached by some beat — true until coach-marks existed. Widened to name
   *both* consumers (a beat, or an entry in `COACH_MARKS`) rather than deleted, so it keeps its teeth.
2. ⚠️ **Two mounted layers rendered the SAME callout.** On device the root copy is merely hidden behind the
   sheet — but it stays a live `accessibilityRole="alert"` in the tree, so **VoiceOver meets the hint
   twice.** A purely visual reading would have called this harmless. The innermost host now draws and the
   root stands down (a `hosts` count in the store).
3. ⚠️ **A coach-mark could fire DURING the walkthrough**, covering the very subject a beat is explaining.
   3.5.5.2's suppressors are declared by *screens* for their own acks, and the walkthrough is not a screen —
   it is an arc that owns the whole surface for seven beats. The e2e suite caught it the instant a real mark
   existed to fire, by failing "a user who actually DOES the interactive beats completes the whole arc".

**Verified by looking:** both themes at 440×956 — the callout anchors directly above its subject, reads
correctly, and the row stays tappable underneath (a hint, not a modal).

### ⚠️ It was parked not-green for one night, and the cause was the trigger

`validate:release:rn` failed under load in a way an isolated `test:e2e:rn` did not — **135/135 green
isolated, twice; 1–2 failures inside the gate, 2 gate runs out of 2.** The decisive experiment was the
control: running the GATE with the four files stashed failed **only the tests of the feature itself**, so
the interference was ours rather than pre-existing load-sensitivity. That one run is what turned "the suite
is flaky" into "we broke something", and the two readings are not distinguishable without it.

**The cause: `useCoachMark` fired on sheet mount behind a 600ms timer.** `CoachMarkLayer` renders nothing
on a miss or a 0×0 measure, so a mark asked for too early silently never appears — which made "has the
sheet finished presenting?" a question answered by a wall-clock guess. Under load the guess drifts, the
mark lands somewhere it was never meant to, and only a loaded machine ever sees it.

**The fix: ask when the subject LAYS OUT.** `invalidate(id)` is the fact the timer was approximating —
[E5] made `TutorialTarget` fire it on every layout precisely because layout covers mount, reflow and
resize alike. **Three consecutive green gate runs at 135/135**, against 2-for-2 failures before.

> This is the same correction 3.5.8 made fourteen times in a row, in a different file and a different
> week: a quantity that MOVES was being guessed at by the clock, and the fix was never a better constant —
> it was finding the signal the app already emits. Launch time, the anchor, the stage timing, and now a
> sheet's presentation. **When a timer's number feels like it needs tuning, look for what the app could
> state instead.**

Merged to `v1.7-dev` green. The branch `3.5.5.5-coach-mark` keeps the not-green history.

## 3.5.5.3 — offered once EVER, and re-offerable (2026-08-08)

`prefs.coachMarksSeen: string[]`, under the **unshipped v7** so no second bump; the prefs merge backfills
it to `[]`, which is the correct starting state (every existing user eligible for every mark, once). A
LIST rather than a flag or a count because marks arrive over versions and each is its own "have you met
this yet" — a count re-offers everything the moment the list grows.

**Recorded on OFFER, not on dismissal**, following the tutorial invitation's rule: a user who saw the hint
and ignored it has been told, and re-offering it because they never tapped "Got it" would punish the
reading they actually did.

**More → "Show feature tips again"**, beside the walkthrough's replay row because they answer the same
question. It clears **both** records — the persisted list and the session set — or it does not work at
all: clearing only the pref leaves a replay entry that appears to do nothing until the app is quit. The
row confirms in place, because the reset is otherwise invisible (the next mark appears on some other
screen, later) and a silent tap gets repeated.

### The fence moved to a better seam, and a test-runner constraint is why

The walkthrough and demo guards were first written as direct reads inside `show()` —
`tutorialSession.getState().active`. That broke `npm run test:app` outright: `tutorialSession` imports
`expo-router`, the app-layer runner runs under `tsx` with no React Native runtime, and `runAppTests.ts`
states the constraint at the top ("the store + selectors are PURE").

The constraint produced the better design. **A bounded run now declares itself through the same
`addSuppressor()` seam a screen uses for its acks** — one mechanism instead of three, no session lookups
inside the store, and the store stays cheap to test. `useCoachMark` moved to `hooks/` for the same reason.

What each fence protects: the walkthrough owns the whole surface for seven beats, so a hint landing
mid-beat covers the subject the beat explains. The demo is a **sandbox** — a mark records itself to the
REAL store, which `useNoRealWritesGuard` would rightly call a bug — **and it is the App-Preview capture
vehicle**, so an unguarded mark would have appeared in the store video on the next re-shoot.

### ⚠️ Two e2e-harness facts that cost three runs

- **`seedStore` installs an `addInitScript`, which Playwright re-runs on every document load.** So
  `page.reload()` does not model a relaunch — it restores the seeded blob and erases whatever the app
  just persisted. A relaunch is expressed by SEEDING the seen state; after a reset, all navigation must
  be client-side or the harness silently undoes it.
- **Store saves are DEBOUNCED** (`persistence.ts`), so a test that reloads immediately after a write
  reloads a blob that never got it. (Minor product corollary: a force-quit inside the debounce window
  loses the record and the mark is offered once more. Acceptable — it is true of every pref.)

Coverage: `coachMarks.test.ts` (16 assertions — the persisted refusal, the per-id independence, the reset
clearing both records, the suppressor fence not recording a refused mark) + `coach-marks.spec.ts` (4 e2e).
**Gate 139/139.**

## 3.5.5.4 — the inventory was wrong in three ways, and hid a real defect (2026-08-08)

The step exists because the parked list had already been wrong once (→ 3.7.A9). Verified against the
current code, it was wrong again — and not by drift so much as by category.

- **Three "hidden" affordances are plainly visible.** Can-I-Afford is a rendered card on Today
  (`index.tsx:380`), "Scan a statement" is a dashed button on Money, and the income-varies toggle sits in
  view inside `PaycheckSheet`. Marking any of them would be pointing at something already on screen.
- **⚠️ Widget · Lock Screen · Siri cannot be coach-marked at all.** They have no on-screen subject, and
  `CoachMarkLayer` measures a registered view and renders nothing when it cannot. That is a category
  error in the parked list, not a stale entry: those features need a different surface entirely.
- **🎯 Three marks (Jason):** payoff-schedule (shipped) · the row long-press menu · the trajectory scrub.
  Skipped swipe-to-delete (a standard iOS idiom, and destructive) and the Cash-Runway scrub (deep inside a
  pushed route). The long-press earns its mark by revealing **four** actions behind one invisible gesture;
  it is **iOS-gated at the offer**, because `RowContextMenu` is a transparent passthrough elsewhere and a
  hint teaching a gesture that does nothing is worse than no hint.

### ⚠️ The defect the pass was for: log-payment had one door, and it was invisible

`LogPaymentSheet` had exactly ONE trigger in the whole app — `menuActions` inside `RowContextMenu`
(`ListRow.tsx:151`). Off iOS that component is a passthrough, so **on Android and web there was no way to
log a payment at all**, and on iOS only an invisible long-press. Same class as 3.7.A9: a built feature
with no way in, invisible because nothing tracked reachability until something asked.

Fixed by mirroring 3.7.A0 exactly — a visible row in the debt sheet's footer, with the HOST closing the
sheet before presenting, so no sheet is ever presented over a sheet. The prop is **optional** and the row
renders only when supplied: Today opens this sheet add-only, so it passes nothing rather than carrying a
handler that routes elsewhere to do the work.

### A suppressor blocked new marks but did not clear one already up

A mark raised on Progress was still on screen when the walkthrough started — covering the arc it was
supposed to yield to. Blocking the next mark was never the whole claim; **something more important taking
over should dismiss the hint.** `addSuppressor` now clears `active` too. That fixed one of two failing
tutorial tests, which is how the gap was found at all.

### ⚠️ Parked NOT-GREEN on `3.5.5.4-inventory`

`validate:release:rn` fails ONE test under load — tutorial-invite's "completes the whole arc", where
`floor-impact` never appears after the cushion-line slider save. **139/139 green in an isolated e2e run,
twice; the control — this work stashed, i.e. the committed 3.5.5.3 — gates 139/139.** So it is ours, by
the same experiment that settled 3.5.5.5.

⚠️ **No coach-mark is on screen in the failure snapshot**, so the mechanism is timing rather than
occlusion, and the obvious suspect is wrong. Next step is a bisect over the .4 diff — the candidates that
touch a path the tutorial uses are few, and `addSuppressor` is not one of them (it made things better).
`v1.7-dev` stays green at 3.5.5.3.

### ⚠️ CORRECTION (same day): the attribution above was WRONG — the flake is pre-existing

The bisect immediately contradicted it. Reverting `progress.tsx` (the only .4 change that runs during an
in-situ walkthrough) did not fix the gate — **a different beat-3 slider test failed instead.** Both
failures were the same interaction, which is the signature of flake rather than a deterministic break.

So the control was re-run, this time more than once. **The committed 3.5.5.3 state — no .4 work at all —
also fails "completes the whole arc" in the gate.** The single green control run that produced the
original attribution was luck.

> **The lesson, and it is the sharper half of the one recorded at 3.5.5.5.** A stashed control run is the
> right instrument for separating "the suite is flaky" from "we broke something" — but **one sample cannot
> establish stability for an intermittent failure.** A green control at n=1 is exactly as consistent with
> flake as with innocence, and reading it as proof produced a confident, wrong attribution that sent a
> whole item to a branch. Sample the control until it fails or until the run count exceeds the observed
> failure rate.

### The real defect: the suite's one genuinely flaky step

`page.mouse.click` on the cushion-line track, immediately followed by Save. The slider is a
gesture-handler view whose `Pan.onBegin` sets the value on touch-DOWN; a tap landing before the sheet's
presentation settles sets nothing, **Save on an unchanged value is a deliberate no-op** (it renders no
`floor-impact` by design — an earlier audit gated that on purpose), and the assertion three lines later
fails for a product that works.

Fixed by waiting for the line to have actually moved: the tap is idempotent, so it is retried until the
sheet's displayed amount changes. A race turned into a wait.

⚠️ **The first version of that helper polled `aria-valuenow` and failed every run.** Measured rather than
assumed the second time: **react-native-web drops `accessibilityValue` entirely**, so the control renders
`role="slider"` with an `aria-label` and *no* value attributes. Native maps it properly, so this is a
web-only gap — but it means a `role="slider"` with no reported value is what the web a11y suite sees, and
`a11y-axe` does not currently flag it. **→ backlog (web-only; the app ships native).**

**3.5.5.4 merged to `v1.7-dev`.**

## 3.5.5.6 — verified, and 3.5.5 closes (2026-08-08)

All three marks looked at in both themes at 440×956: each anchors directly above its subject, reads
correctly, and the control stays live underneath (a hint, not a modal — proved by tapping the marked row
while its mark is up and landing on the route).

**Coverage:** 16 unit assertions (`coachMarks.test.ts`) + 4 e2e (`coach-marks.spec.ts`) + the
payoff-schedule structural tests. **Gate 139/139, three consecutive runs.**

⚠️ **Observation for the cohesion audit:** in LIGHT theme the callout is a near-white card on a near-white
surface, separated only by a hairline border — legible, and noticeably weaker than the dark theme's
separation. It matches the app's existing card language, so it is a coherence question rather than a
defect, which is exactly what the 3.5.6 both-theme sweep is for.

### ⏳ Three things web structurally cannot answer, owed to the device lane

1. **The in-sheet layer's whole reason for existing.** A root overlay is a sibling of a presented Modal and
   renders behind it on device; react-native-web has one DOM tree and shows no difference. The fix is
   unverified where it matters.
2. **The row long-press mark is iOS-only** — `RowContextMenu` is a passthrough elsewhere, so the web e2e
   never sees that mark at all.
3. **The "Got it" dismiss** is unclickable in web e2e: RN-web lays the sheet out in normal document flow,
   so the callout lands ~1590px down a 956px viewport and Playwright cannot scroll an absolutely-
   positioned layer into view. Not a reachability defect — the screenshots show it correctly placed.

All three are written into the Phase-6 device ledger by 3.5.6.3 rather than left as prose here.

## 3.5.6.1 — the 3.5.3.9-L ledger, worked (2026-08-08)

### 🎯 [L1 / E4] RESOLVED — the upgrader is offered the FINALE, not the arc (Jason 2026-08-08)

The design call the ledger recorded as *unowned*, routed to a 3.5.1 gate that round 4 had already found
closed — so nothing would ever have resurfaced it.

**Why finale-only.** [D9] made the sandbox run a premium Guardian for *every* audience, which means an
upgrader has already seen all seven beats on the same money. The runs now diverge only in the finale's
`bodyByRun`. Replaying the arc would charge a customer's attention — immediately after they paid — for one
changed paragraph, while the finale is genuinely the beat written for who they now are.

Implemented as a start INDEX rather than a second one-beat arc, so the beat, its scenario and its copy stay
the single definition every other entry point uses. Two dock affordances had to go quiet with it: **"Step 7
of 7" describes an arc this run never walked, and Back would lead into six beats it never showed.** ⚠️ The
Example-money marker rides the same line and is deliberately kept — 3.5.3.2 made it persistent on purpose,
and it is the one thing marking the canvas as fictional.

Pinned twice, because the two failures are different: the selector test proves the flag; an e2e JOURNEY
proves the user lands on the hand-back beat with the right chrome — the selector cannot see chrome, and a
green matrix would have passed either way (the original assertion read `?.run` and was satisfied by both
shapes).

### The rest of the ledger

| ID | Outcome |
|---|---|
| **L5** | ✅ **Closed by 3.5.5.5** — the entry is pinned above the sticky actions. ⏳ Its *device* re-verify is still owed: the finding came from a native hierarchy dump, and the fix is verified structurally on web |
| **L3a** | ✅ **Closed on inspection** — the constant now states both findings at the site and points at `spotlight.test.ts`, which derives the registered set by scanning source rather than trusting the literal. The drift it warned about cannot hurt |
| **L3b** | ✅ **Fixed, and it was undersold as "LOW".** `tutorialSession.start` passes `maxGenuineCycles: TUTORIAL_MAX_CYCLES` (3); the invariant passed nothing and fell back to `SANDBOX_MAX_GENUINE_CYCLES` (1). **The discovery holdback flips at 3**, so that bound decides whether a safety net is held — and `guardian-reserve` is a coached SUBJECT. The arc's build-time invariant was proving every beat's subject against a Guardian in a different state from the one the walkthrough shows. Second half: Today computes from `withProjectedBalances(store, isPremium)`; the invariant read the raw store. Still 39/39 after both — the arc holds under the *shipped* shape, which is a stronger claim |
| **L2c** | ✅ **Evidence captured** — `tests/shots/floor-impact.shot.ts` samples `FloorImpactBar` through its spring. Criterion 5 had been judged from code and END states across three reviews, which is the one claim a still of the settled bar cannot support. The frames show the fill travelling (~78% at 60ms → ~45% at 140ms): the [D4] spring is doing its job |
| **L4** | ⏳ **Cannot be recovered here** — round 10's three native-lane sections are gone. Routed to 3.5.6.3 and the Phase-6 device ledger, with the standing instruction: **do not assume the native surface was reviewed** |
| **L2a · L2b · L2d** | ✅ **Closed 2026-08-10 — measured.** See below |

**Gate 141/141.**

### L2a · L2b · L2d — the three spacing items, settled by measurement (2026-08-10)

All three were geometry claims made by looking at a picture, so they were closed by building the
instrument that reads the geometry: **`apps/rn/tests/shots/guardian-spacing.shot.ts`** drives the
walkthrough to beats 1 and 4 and prints real bounding boxes. It asserts nothing (evidence, like
`floor-impact.shot.ts`) — pinning a pt value as a gate would freeze a judgement call as a contract.

⚠️ **Two of the three had already been fixed before the ledger recorded them open.** `66782de`
(2026-08-04) raised `attest` to `sm` and added `lastRowSpacer`, each citing round 4's nit by name — and
the ledger, written 2026-08-06 and stating that every item was "re-verified against the code", still
carried both as open. **A ledger entry transcribed from an audit round carries the ROUND's state, not the
code's.** Same family as [[feedback_check_the_shipped_artifact]]: the evidence beside the thing is not the
thing. What was genuinely owed was the RE-JUDGE — the fixes were never put back in front of the geometry
that produced the complaint — and no amount of re-reading the diff could supply it.

| ID | Measured | Outcome |
|---|---|---|
| **L2a** | "Your call" bottom → ring top = **+2.0pt** (`RING_INSET` 6 confirmed applied) | **Fixed further → +6.0pt.** `sm`→`md` on `attest`. The `sm` fix had been signed off as "2pt to spare", but the number that decides *crowded* is the COMPARISON, not the clearance: "Your call" sits 4pt under the sentence it belongs to, so at +2 it was nearer the ring than its own paragraph and read as attached to the wrong thing. At +6 the grouping matches the copy. Row pitch untouched — the margin sits above the tail, not between rows |
| **L2b** | card bottom below the last text = **45.0pt**, against a row pitch measured at a uniform **48.0pt** | ✅ **Answered.** Round 4 saw ~37 against ~48; `lastRowSpacer` closed it to within 3pt |
| **L2d** | adjust→forecast pitch = **48.0pt**, identical to attest→adjust | ⛔ **NOT A DEFECT — disproven.** A retained slot would read ~96pt. Withholding the replay link removes the row whole. Filed as *unconfirmed, measure before treating it as a defect*, and measuring is what retired it |

**Gate 141/141, zero `error-context.md`.** Frames: `apps/rn/capture-ref/spacing-beat{1,4}.png`.

**After-scan.** (a) The instrument is the durable part — the next spacing complaint gets measured rather
than argued, and the two prior rounds of "is it tight?" cost more than writing it did. (b) ⚠️ **Beat 1's
cushion bar rendered UNPAINTED again**, independently, 600ms after the beat settled — the Phase-6 device
ledger (§3.5.3) has it as a single capture-time observation, and it is now **reproducible on web**, which
is a stronger claim than the one filed. Noted there; still device-owed, since CanvasKit-on-web is not the
shipping renderer. (c) Nothing else surfaced that earns a queue slot.

---

## 3.5.6.2 — the whole-3.5 both-theme + a11y sweep (2026-08-10)

**Gate 141/141 → 145/145**, zero `error-context.md`. The sweep is
`apps/rn/tests/shots/phase35-themes.shot.ts`; frames → `apps/rn/capture-ref/phase35/<theme>/`.

### .1 The inventory — the coverage was not what the docs implied

| Surface | Had frames? |
|---|---|
| the 7-beat arc · the finales | ✅ but from `tests/visual/*.cjs`, a parallel root-level mechanism — and **stale** (arc 08-05, finales 08-04, while [E4] changed the upgrader on 08-08) |
| the demo's 5 beats | ✅ current, and from an in-repo harness (`demo-beats.shot.ts`) |
| **the coach-marks** | ⛔ **none anywhere**, though `coach-marks.spec.ts` said "the both-theme screenshots show the card correctly placed" |
| **the walkthrough at iPad width** | ⛔ **nothing at any width above 440**, though `TutorialOverlay` carries bespoke iPad origin math |

### ⚠️ The find: the walkthrough followed the OS, not the user's chosen theme

`createSandboxBase` starts from `createDefaultStore()`, whose `themeMode` is `'system'` — so every
surface rendered under the sandbox provider ignored the in-app appearance override while the dock, the
tab bar and everything outside it honoured it. **A user who set Dark on a Light phone got a walkthrough
that flipped mid-session**, on the app's flagship teaching surface.

Measured before the fix, and it inverts, which is what proved the mechanism rather than merely fitting it:

| | real card | walkthrough card |
|---|---|---|
| `themeMode=dark`, OS light | `rgb(7,17,31)` | `rgb(230,235,243)` |
| `themeMode=light`, OS dark | `rgb(230,235,243)` | `rgb(7,17,31)` |

⚡ **It survived every prior both-theme review because the reviewing harness set the OS scheme and the
pref TOGETHER** — `rn-tutorial-arc-theme.cjs` passes `colorScheme` to the browser context *and* seeds
`themeMode`. The pinned 08-05 dark frame is correct-looking for the wrong reason. A reviewer's laptop has
them agreeing too, so nothing about looking harder would have found this; the sweep found it by setting
one and not the other, unintentionally at first.

Fixed in `seedSandbox`, applied AFTER `assertScenarioPurity` so `build` stays pure and re-seed
determinism (the demo loop, "start over") is untouched. Theme is the only pref carried: the isolation
exists to keep money out and writes in, and appearance is neither — while `debtFreeSoundEnabled` staying
at its default is the tutorial's no-sound restraint working, so a general prefs merge would have quietly
undone it. Pinned by an e2e that pits the two against each other.

### The second find: an assertion that could not fail

`coach-marks.spec.ts` proved "an unseen mark is offered" with `toBeVisible()`. **Measured: the callout
lands at y≈1266 in an 874pt viewport** — 392pt below the fold, in both themes — and the assertion passed
anyway, because RN-web satisfies `toBeVisible` with a node anywhere in the document. Third instance of
this class in the repo.

Rewritten to what web genuinely proves: exactly ONE callout, and it is the Modal's own copy — which is
precisely what 3.5.5.5 built. Verified by deleting `<CoachMarkLayer nested />` and confirming the test
goes red; the old assertion would have stayed green. Needed a `testID` on the callout and one on the
sheet's modal root. ⚠️ Asserting the callout was inside *the sheet* failed against correct code: the
nested layer is a SIBLING of the sheet inside the Modal's gesture root, deliberately, so subject window
coordinates and the callout frame share one space.

### .3 a11y — extended, and one honest limit

`a11y-axe` covered Today, the demo, a sheet and both beat kinds, but never a coach-mark. Two cases added:
a mark on a screen, and the in-sheet mark — a live `alert` inside a Modal, where a second hidden-but-
focusable copy is exactly what `aria-hidden-focus` exists to catch. The in-sheet case is pinned to a
COMPACT viewport: at desktop width Money is the iPad master-detail, the debt form is an in-tree pane,
there is no Modal, and the nested host correctly never mounts. Label-in-name across the 3.5 controls is
clean — the dock and invite derive their names from their visible text, so they cannot diverge.

### ⚠️ .4 What web cannot settle — including one I tried to fix and could not

- **The iPad ring-origin invariant is NOT web-observable.** An assertion for it was written, then
  **deleted for claiming a guarantee it could not give**: reintroducing the bug (dropping `- origin.x`)
  and re-running at 1194×834 changed nothing, because the overlay's origin is 0 on RN-web at every width.
  The rail is a native layout, not a viewport one. The fix that a comment says "a phone-only screenshot
  pass would have shipped" is currently held by **nothing automated** → the Maestro/iPad lane.
- Beat 5's ring on **iPad landscape** clamps to a short stage and its bottom border cuts through the
  card's closing disclaimer. Portrait is clean. Composition call for the device pass.
- VoiceOver announcement delivery, the rotor, haptic weights: `announceForAccessibility` is a literal
  no-op on RN-web. Unchanged, restated so a green web sweep is not read as an a11y result.

### After-scan

(a) **Two screenshot mechanisms now exist** — `tests/visual/*.cjs` at the root and `apps/rn/tests/shots/`
— and the stale set is the one that masked the theme defect. The root tree is 5.5.1's to remove; filed
there rather than deleted mid-sweep. (b) The beat-1 unpainted cushion bar is **intermittent**, not
reliably reproducible: it appeared in 3.5.6.1's frames and in one light beat-1 here, and not in the
re-shoot. Wording corrected in the device ledger. (c) The demo shares `seedSandbox`, so it inherited the
theme fix for free.

---

## 3.5.6.3 — the 3.5 device debt, consolidated into one runnable place (2026-08-10)

**The switch-in corrected the item's own target.** The step said "consolidate into the Phase-6 device-QA
ledger," but `DEBT_3.5_DEVICE_QA_CHECKLIST.md` already existed and is what a device pass is actually run
from — 371 lines of §0–§12 written for a human with a phone, each item carrying steps + PASS + FAIL. The
plan's ledger was a *second* copy of the same material in a different form. Consolidating into the ledger
would have produced a third. So the checklist became the target and the ledger collapsed to an index.

### What was gathered, and where it had been hiding

| Source | Items |
|---|---|
| plan ledger §3.5.3 only (never in the checklist) | scrim-band frame cost · slider gesture arbitration · beat-1 Skia paint · iOS tab-bar press opacity · 2 Android-only |
| 3.5.5's "owed to the device lane" | the in-sheet mark behind a presented Modal · the iOS-only long-press mark · the "Got it" dismiss |
| 3.5.6.2 | the iPad ring-origin invariant · beat 5 on iPad landscape · the coach-mark's off-screen placement |
| the ledger's L4 / L5, and 3.7 A0.4 | round 10's lost native review · the payoff row above the fold · the route + long-press re-verify |

Landed as **§11.11–§11.16** (six new walkthrough checks) and a new **§13** for the coach-marks (six
checks — the surface had no device section at all). L4, L5, A0.4 and the Android carve-out went to the
file's header, because they qualify the whole pass rather than sitting inside one step.

### ⚠️ §12 was stale, and would have produced false failures

The demo section still described the **3-stage, single-screen, clear→tight→at-risk** script that
**3.5.4.11 replaced on 2026-08-06** with a 5-beat arc navigating Money → Today → Today → Progress →
Today. §12.6 had the dock reading *"Demonstration, 1 of 3"* — it now says 1 of **5**, so a tester
following the old text would have reported the correct app as broken, or worse, ticked it off. Rewritten
against `DEMO_STAGES`.

⚡ Worth naming: this is the same failure as the 3.5.3.9-L ledger recording two already-fixed items. **A
document that describes work carries the state of the day it was written, and nothing tells a reader it
has expired.** Checked, not assumed — the demo entries turned out to be *fine* (`QA_TOOLS = true` ships in
TestFlight, so both doors still open), and only the arc had moved.

### 3.5.6.3.3 — what a simulator lane could take off the device's plate

`native-e2e.yml` boots the newest **iPhone** simulator only, so every iPad claim in the app is verified by
a human or not at all. An iPad target plus a beat-stepping flow would take **four** items off the list,
including the ring-origin invariant that nothing currently guards. Filed to the backlog rather than built
here: a CI lane is its own workstream and wants batching with the next native build. **Recommended as the
next active build once 3.5 signs off.**

### After-scan

(a) The plan's ledger had **drifted from the checklist while both claimed to hold the same list** — the
generalisable form of the two-screenshot-mechanism finding from 3.5.6.2 and the ledger finding from
3.5.6.1: three times in one item, the defect was *two records of one thing*. The rule earning its keep is
one runnable source, everything else an index pointing at it. (b) The checklist's closing line still
promised "next I build 3.5.5 (App Intents / Siri)" — from a build cadence two months gone, and pointing at
a number since reused for the coach-marks; replaced with the real exit and a priority order for a single
sitting. (c) Nothing here needed code, so the gate is unchanged at 145/145.

---

## 3.5.6.4 — the whole-PHASE after-scan (2026-08-10)

**Gate 145/145 → 146/146.** The pass that looks at 3.5 as one thing rather than as eleven items.

### ⚠️ It found a shipped gap: nothing asserted the Example marker was THERE

The suite proved the marker never leaks onto real money (`never appears on the real card`) and stopped.
The claim it actually carries — the marker is on the card for the whole run — rested on having looked at
screenshots. **An assertion for the absence of a thing cannot notice the thing has stopped appearing.**

This is the phase's own highest-severity claim: `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11.9 calls a missing
marker on beat 5 *"the highest-severity result in this entire checklist"*, because that beat renders an
invented shortfall **using the user's own debt names**, and the marker is the only thing between that and
a genuine warning about their money. Now asserted on **all seven beats** (3.5.3.2 made it persistent on
purpose, and a marker that survives six beats and drops on the seventh is the same defect arriving late).
Proved by rendering the marker `false` and confirming the test names the failing beat.

### The cross-item pattern: "which store does this read?"

3.5 introduced a second store, which gave every piece of state a new question. The phase answered it
**explicitly and well** in several places — `coachMarksSeen` reads the REAL store, with the reasoning at
the call site (*"a mark met inside the Example world would otherwise burn the hint the real user has not
been shown"*); `tutorialStep`/`tutorialSeen` are a two-key writable allowlist; money is sandbox-only
behind a purity guard and a write backstop; `inWalkthrough` reads the session rather than the registry.

⚡ **The question was asked for identity, progress and money state — and never for PRESENTATION state.**
That gap is precisely where 3.5.6.2 found the theme flip. Swept the rest of `prefs` to see whether the
class was wider, and it is not: `hasSavingsElsewhere` feeds `skipStarterEmergency`, so the sandbox
default is correct (the persona's money is scripted); `debtFreeSoundEnabled`'s default is right for both
the tutorial's no-sound restraint and capture determinism; the remaining four do not render in a run.
**`themeMode` was the only one. The class is closed with evidence, not assumed shut.**

### The deferral ledger, re-verified rather than re-copied

Each checked against current code: `prefs.isDemoMode` is still inert (only defaults, models and a test
asserting the sandbox never sets it) · `guardianIntroSeen` is still reader-less · `typicalAmount` still
has no writer in any `.tsx`. All three deferrals remain true and keep their destinations (Phase 5's
migration for the two persisted keys, the wording/voice gate for `typicalAmount`).

### ⚠️ Phase 3.5 is NOT closed by this — 3.5.7 is still open

3.5.6's exit line said "Phase 3.5 signed off", and the phase's own build order carries **3.5.7, the
web-embeddable marketing demo**, which is unbuilt and gated on a hosting + privacy call Jason owns. Two
statements in one document disagreeing about whether a phase is finished is exactly the drift this scan
exists to catch, so: **3.5.6.4 closes the 3.5 BUILD; 3.5.7 remains, blocked on a decision.**

### The phase's three recurring defect classes, for the cohesion audit

Named here because the whole-app audit is the next place they can be hunted at scale:

1. **An assertion that passes either way** — 4 instances (the invite's `?.run`, the coach-mark's
   `toBeVisible`, this item's absence-without-presence, and one I wrote and deleted myself).
2. **Evidence cited but never committed** — the coach-mark screenshots, round 10's lost lens outputs (L4,
   unrecoverable).
3. **Two records of one thing, drifting** — the ledger vs the checklist, the two screenshot mechanisms,
   the audit round vs the code, and a stale §12 describing a demo that had been rebuilt.

All three are the same failure at different altitudes: **a claim kept somewhere other than where it is
checked.**

---

## Plan-file cleanup, 2026-08-10 — the narrative the driver was carrying

🎯 Jason: *"Clean up the debt elevation plan. I cannot find what's active, what's next or anything in it."*
Fair, and self-inflicted: this session appended four analysis blocks to a file whose one job is to be
scannable. **Three structural faults, all of which made the first question unanswerable:**

1. **`▶ ACTIVE` was on Phase 3.5, which was finished**, while the real active build — 3.7 Wave A — sat at
   line 183, *below* Phases 4, 5, 5.5 and 6. The reading order contradicted the build order.
2. **`## ▶ NOW` had grown to 19 bullets** mixing the active build with closed items, method lessons, env
   recipes and capture-pipeline lore. Four of the nineteen were things I appended today.
3. **Completed phases carried their full narrative inline** — Phases 0–3 as four dense paragraphs, Phase
   3.5 as ~15 bullets of finished work, A0 as a seven-bullet root-cause essay on a shipped fix.

The rewrite puts the active build and its decomposition **first**, then "then, in order", then what is
blocked on Jason, then the phases in sequence. Everything below moved here rather than being deleted.

### Working notes (moved out of ▶ NOW — operational, not directional)

- **⚠️ No ffmpeg on this machine can read H.264.** Playwright's bundled build is `--disable-everything`, so
  inspecting a capture MP4 locally means Edge: `chromium.launch({ channel: 'msedge', args:
  ['--allow-file-access-from-files'] })`, `goto` the `file://` URL, seek, draw to canvas, read
  `getImageData`. Without the flag the canvas is tainted and luma readings are unavailable. It is how
  cycle 10's black-and-slate opening was found. ⚠️ For "did anything MOVE", **checksum the frames, never a
  whole-frame average** — cycle 14's luma was byte-constant across 4.7s of footage that was not still.
- **⚡ Prove capture-build changes LOCALLY before spending a cycle** (~18 min each; this has paid three
  times): `EXPO_PUBLIC_CAPTURE_DEMO=1 npx expo export --platform web --clear`, serve, drive with
  Playwright. ⚠️ Then re-export **with `--clear`** and verify the flag did not leak.
- **CI history:** `web-e2e` had been red for a month gating the retired Next app; since 2026-08-05 it runs
  `validate:release:rn` on every push. The native lane (`native-e2e.yml`) stays manual.

### Method lessons (kept in the log where lessons belong)

- **A stashed control run separates "the suite is flaky" from "we broke something" — but SAMPLE IT MORE
  THAN ONCE** (2026-08-08). One green control read as proof produced a confident wrong attribution and
  parked a finished item on a branch for a defect it had not caused.
- **A ledger entry transcribed from an audit round carries the ROUND's state, not the code's** (3.5.6.1).
- **A screenshot pass cannot find a defect that only appears when two inputs DISAGREE, if the harness
  always agrees them** (3.5.6.2) — the sharpest of the phase.

### Phase 0–3, as the plan used to state them

- **Phase 0 ✅** — IA (3-tab Today · Progress · Money + "•••" More) · visual language (cool slate/navy,
  constant navy hero panels) · motion spec · premium reshape (one Premium + Lifetime + portfolio-sub seam)
  · readiness audit · a11y standard.
- **Phase 1 ✅** — every surface elevated: Today · Progress (Skia ring + trajectory) · Money
  (Debts/Bills/Goals, virtualized) · More (TrustCard).
- **Phase 2 ✅** — the Payday Cushion Guardian (engine · §2.0 confidence governance · cash-flow brain ·
  graduation · calibration scorecard + Cash Runway · proactive notification · Safety-net reserve lifecycle)
  + smart obligations/trials + Recovery Plan + Can-I-Afford-This + BNPL first-class + scan-to-prefill +
  the revenue spine. Locked via the Guardian convergence audit + the Premium-framework audit.
- **Phase 3 ✅** — Wave A foundation/perf · Wave B delight (celebration · milestone-cross · proof-of-work ·
  impact viz · tactility · onboarding reframe) · Wave C (trajectory + chart interactivity · `expo-blur`
  glass · swipe-to-delete · FormSheet polish) · the native block (Live Activity + Dynamic Island · widgets
  + StandBy · App Intents/Siri · context menu) · genuinely-native iPad · the variable-income band ·
  Guardian Tier-3 · VIS-1 finale + AHAP · VIS-2/B2 branded share · VIS-6 Windfall + notifications + Skia
  mesh + sound + Sentry scaffold. Closed by the closeout audit → 3-round Fable-5 re-audit at CONSENSUS.

### Phase 3.5's build order, as completed

**3.5.0–3.5.3** the sandbox substrate · trigger/intro matrix + replay entries · interactive-a11y scaffold ·
the 7-beat in-situ arc with 2 interactive beats, the persistent Example marker and the E1 hand-back finale;
closed by the 3.5.3.9 gate at round 10. **3.5.3.9-L** the residue ledger (8 open → all disposed at 3.5.6.1).
**3.5.4** bounded demo + GTM funnel: kiosk containment [D18] · sandbox seam + hoisted provider · canvas
marker · the funnel seam with no sink attached. **3.5.4.11** the demo reimagined for the App Preview — the
5-beat multi-screen arc via `DemoDirector`, `?capture=1` stripping chrome. **3.5.5** three coach-marks,
offered once ever, re-offerable from More, refused during any bounded run. **3.5.6b** the native Maestro
lane, 6/6 on real UIKit — caught a data-loss bug (`FormSheet`'s Remove destroyed a record unconfirmed).
**3.5.8** the App-Preview capture pipeline, 14 cycles, cycle 14 approved with 4.80s of celebration room.
**3.5.6** verify + close, four sub-steps (see 3.5.6.1–.4 above).

### A0's root cause, kept because the pattern recurs

`AmortizationSheet overlay` rendered `<View style={absoluteFill}>` as a **SIBLING of** the FormSheet
`<Modal>`, not inside it. On iOS a Modal is a separately-presented view controller, so a sibling overlay
renders **behind** it — the tap fires, state flips, nothing is visible. On web it is one DOM tree, so it
looked correct, which is why the web e2e passed. Two prior fixes missed: `70c8879` fixed a real
gesture-swallow; `2ad1531` swapped nested-Modal → overlay but placed it outside the Modal's tree, moving
the symptom from "tap swallowed" to "tap works, nothing appears". Fixed at A0.2–A0.3 by making the
schedule a real pushed route and deleting `AnimatedSheet.overlay` + `AmortizationSheet` outright, so the
failure class is unreachable rather than merely unused. **This is the same geometry that later explained
the coach-mark nested host (3.5.5.5).**

---

## 3.5.9 — [D21] the demo ships to users again (2026-08-10)

🎯 Jason: *"I am concerned about us nixing the demo mode completely. That removed a useful feature for the
user to try out the app beforehand."*

**[D19] was correct when made and its premise was repaired the same day.** It pulled the demo's entries
because it duplicated the walkthrough — *"as built it never leaves Today, which makes it a Guardian demo,
not a Debt demo"* — and in the same breath ordered the rebuild (3.5.4.11) into a five-beat arc across
Money, Today and Progress. The rebuild landed; the pull never got revisited.

**The measured cost:** `tutorialSelectors.ts:58` returns null unless `onboardingComplete`, so the
walkthrough cannot be offered to a new user. With the demo's entries gone, a shipped build offered **no
way to see what the app does before handing it your financial data.** The demo was built for exactly that
door — its route guard handles a not-yet-onboarded user and checklist §12.1 tests the fresh-install path.
The door was built, verified, and then unhandled.

Fixed by making `isDemoReachable()` unconditional so the Phase-6 `QA_TOOLS` flip cannot take the demo out
of the app — that coupling was the whole point of the old expression and is what must not return.

**And the doors are covered now.** Every existing demo spec navigated straight to `/demo`, so the entire
suite stayed green while the app offered no way to reach it — a destination with no tested door, the class
this repo has now shipped three times. Two tests added, both verified to go red when `isDemoReachable()`
is forced false.

⚠️ **Asserting VISIBLE marker count, not `toBeVisible()`.** Measured: the paywall path leaves **2 marker
nodes in the document and 1 visible** (the route beneath stays mounted) where the other two doors leave 1
and 1. A bare `toBeVisible()` fails strict mode on that path only; a `.first()` would have hidden the
difference rather than describing it. Visible-count is also what §12.5 actually cares about.

**Gate 146/146 → 148/148.**

---

## 3.7.A10 switch-in — the Money page review, and what it changed (2026-08-10)

Jason: *"When I enter a bill it's showing up as a required action but not as an actual debt."*

⚠️ **My first response was wrong and worth recording as such.** I explained the bill/debt split as
correct-by-design and located the problem in the user's mental model. Jason: *"That's wrong. Debts and
bills are still owed. Bills shouldn't be excluded."* He was right that I had defended a constraint instead
of testing whether it was binding.

**Where it landed, after two sharpenings.** The axis the engine actually uses is **terminating vs
perpetual** — does this obligation have a balance that can reach zero? Jason then supplied the decisive
input: that IS his original intent (*"I originally split Expenses and debts… Expenses do not have an end
date… Debts are the items that we want to track"*). **So the model is right and the model-merge hypothesis
is closed** — [D22].

What is wrong is **naming and entry**. The perpetual bucket ships as "Bills", and *bill* is the one word
that collides with every item in the debt list — a credit card bill, a mortgage bill. The sharpest case is
**rent vs mortgage**: same category, same cadence, same fixed amount, one perpetual and one terminating,
and `RequiredExpenseCategory` offers "housing" to both.

⚡ **The load-bearing evidence for why a rename cannot carry this alone: the author of the taxonomy
mis-filed under his own taxonomy.** Hence [D22a] — stop asking the user to classify at all, and ask the
one question they can answer about a fact they know: *does this have a balance you're paying down?*

**⚠️ An agent finding I corrected before relaying it.** The review anchored on
`requiredExpensePresets.ts` offering "Credit Card Payment" and "Loan Payment" as one-tap BILL presets. The
list is real, but its only importer is `components/RequiredExpenses/AddExpenseModal.tsx` — the **legacy
Capacitor tree**. RN's `ExpenseSheet` does not use it, so it is **not a live defect**. Same rule as
[[measure-agent-mechanisms]]: the recommendation was sound, the severity was not.

⚡ **But it produced something better than it claimed.** The v1.6 app *taught* that a credit card is a
bill, one tap. So migrating users arrive **already mis-filed**, and Phase 5's bridge will import that
wholesale — which is why A10.6 hands the detector to the migration rather than leaving it a Money-page
feature.

---

## 3.7.A10.1–A10.2 — the chooser, and the way back (2026-08-10)

**Gate 153/153 → 156/156**, plus 17 app-layer asserts. Frames: `capture-ref/add-chooser/`, `capture-ref/misfiled/`.

### A10.1 — one Add, and the answer routes

The section used to BE the routing. Money now has one Add that asks *"does this have a balance you're
paying down?"* — the terminating/perpetual distinction in the user's own words, about a fact they know —
with three cards carrying concrete nouns, because a noun someone recognises does the classifying that a
definition asks them to do. Picking also switches the section, so the answer visibly lands.

All six entry points replaced: three `AddRow`s and three empty-state CTAs, **including the Debts empty
state**, which is the default landing section and so had the strongest pull toward mis-filing. One
carve-out: **⌘N still opens the debt editor directly** — [D22a] removed the shortcuts because the section
classified *silently*; a keyboard accelerator pressed on purpose is the opposite.

⚠️ **Two defects found by looking at the render, not the diff.** `FormSheet` forces a primary submit,
which put a full-width accent **"Cancel"** at the foot of a screen whose real actions are the three cards
→ switched to `AnimatedSheet`. That shell clamps its subtitle to one line where `FormSheet` allows two, so
the copy **truncated mid-word** on the screen whose whole job is clarity → shortened.

### A10.2 — the half that reaches backward

⚠️ **Category as a detector conjunct was rejected on inspection, contradicting my own earlier
recommendation to Jason.** Requiring category AND name would catch a mortgage (`housing`) and miss every
credit card and car loan, which land in `other` — it destroys recall for no precision gain, because the
name does all the work either way. Said so rather than quietly implementing something different.

Precision comes from a **tight, word-boundary** list of borrowing instruments instead. `Discovery+` must
not match `discover`; `Cardio Gym` must not match `card`; a bare `Payment` matches nothing. Both halves
are pinned, because both fail silently — a miss says nothing, and an over-fire tells someone their rent is
secretly a debt, which is worse.

**The conversion is one write.** `convertExpenseToDebt` removes the expense and adds the debt in a single
`set`: two writes would leave a window where the same money is reserved as an expense *and* projected as a
debt, on the user's real plan. It is **not** silent — an expense carries no balance and no APR, the two
fields that make an obligation payoff-able, so the debt form opens prefilled and the user supplies them
([D22c]).

The hint is tertiary text with no icon, no colour and no badge anywhere else in the app, and **"Not a
debt" is remembered** in `prefs.notDebtExpenseIds` (optional, so a store persisted before this reads as
"nothing dismissed" without a migration). A suggestion that cannot be silenced is an accusation repeated
forever.

### After-scan

(a) The e2e for both items asserts **where the record landed**, not that an editor opened — an editor
proves nothing about which list it writes to, and which list is the entire bug. (b) The gate caught a
regression the diff did not: `sheet-polish` opened its sheet via the old "Add debt" label. (c) `Button`'s
accessible name comes from child text, which `getByLabel` does not match on web — `testID` threaded
through `AddRow`, `Button` and `EmptyState` so a label change cannot silently orphan a test. (d) Remaining
in A10: the rename (A10.3), under-header definitions (A10.4), and **A10.6, handing the detector to Phase
5's migration** — the item with the largest affected population, since v1.6 taught that a credit card is a
bill.

---

## 3.7.A10.3–A10.6 — the words, and where the mistake actually arrives (2026-08-10)

**Gate 156/156**, zero `error-context.md`. Frames: `capture-ref/money-sections/`.

### A10.3 — Bills → Expenses, and the fork A10.1 missed

The Money surface, the sheet (`Add an expense` · `An ongoing cost that doesn't end.`), the search
placeholder and the empty state. **The Guardian's, Today's and the tutorial's "bills" vernacular is
deliberately untouched** — [D22d] routed it to the wording/voice gate, and a sprawling copy change on the
eve of a device build is exactly how an unrelated regression gets in.

⚠️ **And a hole in A10.1, found by the string sweep rather than by the item's own after-scan.**
`FirstDebtOrBillStep` has its own `Debt` / `Bill` toggle — **the first classification any user ever
makes**, at the moment they have the least context, with no explanation beyond a placeholder. A10.1
replaced Money's six entry points and left the one that runs before Money is ever opened. It keeps its
toggle (onboarding is a guided single-purpose step, not a menu) but now names the distinction in the same
words the chooser uses.

### A10.4 — the caption is phrased by the TEST, not by example

The chooser carries nouns — rent, Visa, a car loan — because someone *choosing* needs recognition. The
section caption carries the rule, because someone *already looking at the list* needs to know why the
thing they expected isn't in it. Same distinction, two jobs, deliberately different wording.

### ⚠️ A10.6 — the population that matters is not on the Money page

v1.6's Capacitor app offered **"Credit Card Payment"** and **"Loan Payment"** as one-tap BILL presets
(`requiredExpensePresets.ts:10-59`, still wired into the legacy `AddExpenseModal`). It *taught* that a
credit card is a bill. So upgrading users do not merely risk the mistake — many arrive having already made
it, at the app's own invitation, with a debt-free date that silently omits their largest debt.

`looksLikeDebt()` and `convertExpenseToDebt()` exist now; the **migration bridge has to run them**, because
the row hint only ever reaches someone who happens to open that list. Filed into **Phase 5**, beside the
migration and its adversarial audit — not left in A10, where it would have looked done.

**Also filed to Phase 5 in the same edit:** 🎯 Jason's report that Import Backup asks you to paste JSON.
Scoped there because Phase 5 already owns the native file/share-sheet work, and `BackupSheets.tsx`'s own
comment names the document-picker flow as the intended upgrade to its text-only stopgap.

---

## 3.7.A10.5 — the item's after-scan, and A10 closed (2026-08-10)

**Gate 156/156**, zero `error-context.md`. Frames: `capture-ref/{add-chooser,misfiled,money-sections}/`.

### ⏳ One thing A10 could not verify, stated as a limit rather than skipped

**The first-run fork is not covered by web e2e**, and that is measured, not assumed. Three attempts to
reach `FirstDebtOrBillStep` failed for two separate reasons: the paycheck step **will not advance without
a valid amount**, and **"Skip for now" walks straight past the debt step** to "You're all set". A walk
bent around both would be precisely the fragile flow-shaped test this repo has been burned by — so the
test was deleted rather than tuned, its copy is verified by typecheck and reading, and its behaviour is
routed to **checklist §14.3**, which now says exactly what to look for.

That is the same call as 3.5.6.2's deleted iPad assertion: **do not ship a guard you have not seen fail.**

### After-scan across A10

- **The item found a hole in its own first sub-step.** A10.1 replaced Money's six entry points; the A10.3
  string sweep found the seventh — onboarding's fork, which runs *before* Money is ever opened and is the
  first classification anyone makes. An item's after-scan is scoped to what it touched; the sweep looked
  at the vocabulary and saw further. Worth remembering that a *string* pass catches entry points a
  *screen* pass cannot.
- **Two design defects came from looking at the render, neither from the diff:** a full-width accent
  "Cancel" as the loudest thing on the chooser, and a subtitle truncating mid-word on the screen whose one
  job is clarity. Both were invisible in code review and obvious in a screenshot.
- **`MoneyView`'s internal value is still `'bills'`** while the label reads "Expenses". Deliberate — the
  route/state key is not user-facing, and renaming it would churn the section plumbing for no user gain.
  Named here so it is not later mistaken for a missed rename. → the wording/voice gate, with [D22d].
- **The detector is name-only, and its list is a judgement call that Jason should spot-check on real
  data** — it is the one part of A10 whose failure mode is telling someone their rent is secretly a debt.
- **Device debt added:** checklist **§14** (6 checks) covering the chooser's three doors, the routing, the
  first-run fork, the rescue, the conversion and the remembered dismissal. All of it is new since
  `c050173`, so none of it has ever run on hardware.

### Queue replenishment

**Wave A returns to the active slot**, unchanged in scope — it was displaced by A10, not superseded.
⚡ A10 sharpened the case for it: A10 makes sure an obligation lands in the right bucket; **A1/A2 decide
whether the arithmetic applied to that bucket is right.** Both have to hold, or the debt-free date is
wrong for a different reason.

---

## 3.7 Wave A · A1 and A2 (2026-08-10)

**Gate 156/156**, core regression green, +3 allocator asserts.

### ⛔ A1 — already fixed, and the verification step is what found it

`projectDebtPayoff` scales BNPL minimums by cadence via `bnplMonthlyEquivalentMinimum`, landed in
**`611a4fb` on 2026-07-27 — three days BEFORE Wave A was written on 07-30.** It is also guarded, well:
`testDebtProjection.ts` asserts a biweekly pay-in-4 clears in **2 months not 4**, that the same numbers
labelled `monthly` still take 4 (so the scaling is cadence-specific rather than a blanket BNPL bump), and
that the payoff CHART agrees with the debt-free DATE (R2.1).

So the plan item described a defect that no longer existed. **A.1 — "verify against the current engine
before touching it" — is the step that caught it**, and it is the fifth time today a document has outlived
what it described. ⚠️ **A4–A7 were authored in the same pass and have not been re-verified**; treat each as
a hypothesis, not a defect, before writing code against it.

### ✅ A2 — real, reproduced, fixed

`allocatePaycheck` filtered obligations on a single `dueDate` and summed `amount` **once**. `recurrence`
was on the type and read by nobody in that path. Measured before the fix: a **weekly $50 bill in a 31-day
cycle reserved $50 where $200 was owed** — a 4× under-reserve on the most common sub-cycle cadence.

This is money, not presentation: the Guardian called a paycheck **clear** while three of four occurrences
were unfunded, and the user found out by going short.

**Fixed by expanding obligations into one entry per occurrence, deliberately — not by multiplying the
amount.** Everything downstream reads these as discrete items (the unfunded-item list, partial-coverage
ordering, the affordable-skip count), so a single row carrying 4× the money would fund "Groceries"
all-or-nothing instead of one shop at a time. Each occurrence gets a distinct id, because
`isPaidThisCycle` is keyed by it and reusing the original would mark all four paid when one was.

Occurrences are counted by **stepping the real calendar**, not by dividing days by a nominal period, so
months of different lengths and a cycle straddling one behave correctly.

⚠️ **Two guards against over-correcting shipped with it**, because "expand every obligation" would
otherwise double the app's most common case: a **monthly** bill in a monthly cycle still counts once, and
one whose next occurrence falls after the next payday still counts zero.

### After-scan

⚡ **The whole core regression suite passed untouched.** That is not reassurance — **no existing test used
a sub-cycle expense at all**, which is precisely why the defect survived this long. The gap was in the
test DATA, not in the assertions, and no amount of assertion review would have found it. Worth carrying
into the Phase-6 financial-correctness audit: ask what INPUT SHAPES the suite has never seen, not just
what claims it makes.

---

## 3.5.10 — the interactive demo, and the scripted run goes back to being a video (2026-08-10)

🎯 Jason: *"The demo that's there now is more of an app preview video than a demo… let's create the
interactive demo and then pull the current demo and use it for its intended app preview purpose."*

**Gate 156/156 → 158/158.** Frames: `capture-ref/explore-demo/`.

**The diagnosis.** [D19] pulled the demo from users *because* its remaining job was the store video; 3.5.4.11
then rebuilt it as a 25-second self-driving arc tuned for capture; [D21] re-shipped **that same artifact** to
users as "try before you commit". One artifact, two jobs — and the video's requirements won because they
came first. What a user got was an app preview they could not touch.

Now `demoSession` has a **mode**: `scripted` (App-Preview + 3.5.7's embed) and `explore` (a person). The
route decides from who is watching — `CAPTURE_DEMO`, `?capture=1` or `?mode=scripted` get the script;
everyone else gets the sandbox and is left alone in it.

### ⚠️ The predicate did NOT get forked, and the codebase said so first

The plan was to split `useInBoundedRun`. Its own docblock pre-empted that: *"If a fence ever needs to
distinguish which run is on screen, that is a different question — ask the session directly; do not fork
this predicate."* That is better guidance than mine and it was already written down.

So `useInBoundedRun` is untouched and still means **"sandbox money is on screen"** — the marker, the
no-real-writes guard, coach-mark suppression, the walkthrough not offering itself, and **More staying
fenced even in explore** (it carries Reset and preferences that write the REAL store; settings is not part
of the product story). A new, separately-named `useNavigationHeld()` answers the *other* question, and only
the two navigation fences read it.

The two predicates were ever one only because, until now, every bounded run happened to mean both. The
paired tests say which half broke if someone re-merges them: the kiosk test stays green, the explore test
goes red.

### The exit rides the marker row

Explore has no dock, and a demo a user can walk around needs an exit wherever they walked TO. `Screen`
already mounts `ExampleCanvasMarker` above the scroller on **every** surface a sandbox can reach — keyed on
the money being fictional, never on a session — so the exit inherits that reach instead of needing its own
always-on chrome. One exit, deliberately: "Start my real plan". Premium is sold inside the real app, not
from behind a sandbox.

### ⚠️ Found by looking, not by the suite

The first explore render still had the **scripted dock on it** — narrating "1 of 5" for a run with no
beats, duplicating the exit, and sitting over the tab bar the user now needs (the exact clipping 3.5.4.10
hid the bar to avoid). Ten green containment assertions and not one of them was watching the dock. Gated
to scripted.

### After-scan

- **A web-only limit, measured:** after a tab switch the RN-web tab navigator leaves the previous screen
  mounted *and painted*, so two markers/exits are visible where a device renders only the focused tab. The
  "exactly one on screen" claim is therefore **device-owed** (§12.5 already asks it of the marker); web can
  only prove the exit is present wherever the user navigated.
- The More fence is asserted across **every** matching node rather than `.first()` — a fence that held on
  one of two mounted copies is the "class closed at some of its members" defect this phase kept finding.
- ⏳ **Device debt:** §12 is now two runs, not one. The checklist needs an explore section — free
  navigation, the marker on every screen, More still fenced, the exit reachable from each tab.

### 3.5.10 close-out (2026-08-11)

Device checklist **§12 restructured into two runs**, because it described one and there are now two.
**§12.0 is the EXPLORE run — eight checks, all new, none ever on hardware**: free navigation, the marker
following you across tabs, exactly one marker on screen (⏳ web cannot answer that — its tab navigator
leaves the previous screen painted, so this is device-only), the exit reachable from a tab you navigated
TO rather than landed on, More staying shut, the real plan untouched after a force-quit, poking at real
controls, and VoiceOver.

⚠️ **§12.1–§12.7 were re-scoped honestly rather than left ambiguous.** They describe the SCRIPTED run, and
a device build cannot pass `?mode=scripted` — so they are owed to the capture/embed lane, not runnable
from the app's own doors. Leaving them looking runnable would have produced a tester hunting a tab bar
that is deliberately hidden in a run they cannot reach.

**Queue replenished:** back to **Wave A · A.4 (the A3 honesty ledger)**, with a warning attached — A1 was
fixed three days before Wave A was written, and A3's nine items came out of the same 2026-07-30 pass, so
each is a hypothesis until re-verified. That check is now the cheapest step in the item rather than an
afterthought.

---

## 4.1 promoted over Wave A — the Maestro coverage lane (2026-08-11)

🎯 Jason: *"How much of the 3.5-device-qa-checklist can be verified through Maestro?"* → *"Promote and
let's do this now."*

**Measured, not estimated:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md` carries **136 checkboxes**, 9 of which are
not checks (install steps, "report back", two "if it fails note it" clauses). Of the **127 real checks**,
a Maestro iOS-Simulator lane can **fully carry 68 (54%)**, partly carry **26**, and never touch **33**.
Per-section map + the itemised walkthrough table: `docs/audits/2026-08-11-maestro-coverage/`.

### ⚡ The finding that cost the most to not know

`06-tutorial-interactions.yaml` records, as a lesson bought with **three CI cycles at ~40 minutes each**,
that *"this build rejects `extendedWaitUntilVisible` (unknown command) and `timeout` on assertions
(unknown property)"* — and concludes from it that a timed sequence cannot be waited for. So beat 4's
release ack is asserted by nobody and was **ledgered as device-QA-owed**.

Both rejections were real. **The conclusion was not.** The command is **`extendedWaitUntil`**;
`extendedWaitUntilVisible` has never existed in Maestro, and `timeout` is invalid on an assertion
*precisely because* it belongs to `extendedWaitUntil`. Two wrong spellings of one command produced a
documented capability limit that isn't one, and it is currently written into the flow files as a rule.

Seven further commands the repo has never used, verified against the docs rather than recalled:
`assertScreenshot` · `setOrientation` · `repeat` · `retry` · `runScript`/`evalScript` ·
`waitForAnimationToEnd` · `startRecording`. ⚠️ **This is the [[measure-agent-mechanisms]] shape from the
other direction:** the *observations* were right and correctly recorded, and the mechanism inferred from
them was wrong — so the lane was scoped against a limit that was never measured, only deduced.

### Four checks the documents declare unreachable, and are not

- **§14.3 the first-run fork** — *"web e2e cannot reach this step — it is verified here or nowhere."* Its
  stated blockers are that the paycheck step needs input and "Skip for now" walks past. Maestro has
  `clearState: true` and `inputText`.
- **§12.0.3 exactly one Example marker** — *"web cannot answer this"* because RN-web's tab navigator
  leaves the previous screen painted. A simulator renders only the focused tab.
- **§11.15 the iPad ring origin** — the checklist's own highest-priority item, *"guarded by NOTHING"*. The
  mechanism is the sidebar putting window and local coords ~700pt apart; **an iPad simulator has that
  sidebar.** "No browser test can hold this fix" was true and was read as "nothing automated can".
- **§12.1–§12.7 the scripted demo** — re-scoped 2026-08-11 as owed to the capture lane because *"a device
  build cannot pass `?mode=scripted`"*. True for a human holding a phone; `app.json` declares
  `"scheme": "debtplannerrn"` and `demo.tsx:61` reads `mode` off the route, so `openLink` should reach it.
  **17 checks currently owed to nobody.** Gated on 4.1.1's probe.

**The pattern in all four: a limit that is real for the WEB lane was recorded as a limit on automation.**
Web and simulator are both "not a device", and the documents stopped distinguishing them.

### The honest floor

33 checks are permanently a human with a phone: haptics · Siri · camera · every springboard surface
(widget placement, Lock Screen, StandBy, Live-Activity render) · real StoreKit prices · iPad hardware
keyboard + pointer · Split View/Stage Manager · old-hardware frame rate · VoiceOver speech and rotor
traits. ⚠️ **Nuance kept:** Maestro drives the **accessibility tree**, so exposure and one-utterance
grouping (§12.6's dock, §11.4's reachability behind the scrim) are machine-checkable — flows 03/04
already document composite elements surfacing as one full-text string. Announcement *timing* and rotor
*traits* stay device-owed.

### Deferred-backlog correction

The entry scoping this said an iPad lane *"would take **four** items off the device's plate."* Measured:
the iPad boot alone carries six, and the whole lane carries 68. The four was a guess and it undersold the
item by an order of magnitude — the entry is retired into the active build with that noted.

### ⏸ Wave A · A3 — switch-in verification DONE, item displaced mid-flight

A3's before-scan ran before the redirect and its result must not be re-derived. The nine items were
recovered verbatim from the pre-rewrite plan (`3a75835^`), since the current plan carries only their
short names. **Three are confirmed live against current code:**

- **A3.1 attestation gating** — `selectBillsAttestation` shows on `discoveryHoldbackActive` alone
  (`guardianSelectors.ts:144-146`), with no check that attesting would actually reduce the hold. Discovery,
  cold-start and the variable-bill buffer compose by **`max`** (`holdbackComposition.ts:54`), so attesting
  drops discovery 0.4 → 0.15 while cold-start 0.25 or the variable buffer can still dominate. **The
  affordance can promise a smaller safety net and deliver a reduction of exactly zero.** Live.
- **A3.3 `selectTightTopUp` prefers the EF** — `guardianSelectors.ts:219` is
  `find(g => (g.type === 'emergency' || g.type === 'savings') && g.currentAmount > 0)`: **find-order, with
  no preference at all.** Raiding the emergency fund for a covered-but-tight cushion dip. Live.
- **A3.5 no undo on the tight top-up** — an undo path *exists* but only in the affordability flow
  (`AffordabilityCard.tsx:92` calls `applyTightTopUp` with a negative amount). The Guardian card's own
  top-up (`index.tsx:302`) has none. **Live, and cheaper than it looked** — the mechanism is already built
  and only needs surfacing on the other caller.

Not yet re-verified: A3.2 (starter-EF "keeps it as cushion"), A3.4 (hero-vs-Guardian coherence), A3.6
("hold your line" twice — both sites located: `AffordabilityCard.tsx:117` and the Guardian's top-up),
A3.7 (applied purchase reads deferrable), A3.8 (`GoalSheet` name-dedupe), A3.9 (affordability density).
**Resume here — do not re-run the three above.**

### 4.1.2 — §14 and §13 onto the lane (2026-08-11)

Two flows, 11 checks: `07-money-add-and-rescue.yaml` (§14.1–§14.6) and `08-coach-marks.yaml`
(§13.1–§13.5). Both run after 01–06; 07 clears state because §14.3 only exists on a fresh install, and it
leaves the portfolio 08 runs on.

**§14.3 is the point of the exercise.** The checklist marks it *"⏳ Web e2e cannot reach this step — it is
verified here or nowhere"*, and names its two blockers: the paycheck step will not advance without input,
and "Skip for now" walks past the debt step (`onboarding.tsx:36` — PaycheckStep's `onSkip` goes to step 3,
not step 2). `inputText` types the paycheck and the fork is walked properly. The assertion is the *change*,
not the appearance: the debt clause must be visible AND the expense clause absent, then the reverse after
the toggle — asserting only that the new clause showed would pass with both on screen at once.

⚠️ **Matched on apostrophe-free fragments.** `FirstDebtOrBillStep.tsx:119-120` uses CURLY apostrophes; a
straight one would silently never match, and a selector that can only ever fail is the same class of
useless as one that can only ever pass.

### §14.4 proved in two phases instead of by a count

The checklist asks for Mortgage and Rent added together and the hint under **Mortgage only**. "Only" needs
an element count, and counting is unproven on this build (probe p06) — so the claim is made as **Rent
first, alone, asserting nothing appears**, then Mortgage. That is strictly stronger than a count: a count
of one passes even if the hint is on the wrong row. The names are chosen against `DEBT_WORDS`
(`looksLikeDebt.ts:25-38`) — "Rent" matches nothing, "Mortgage" and "Car Loan" each match one.

The other half of §14.4 — that the hint *belonged* to Mortgage — is then carried by §14.5: the converted
debt form opens **prefilled with the name**, so the prefill is the proof of ownership.

### ⚠️ Before-scan caught a comment that had outlived what it described

`coachMarkCopy.ts:26-27` states the payoff-schedule mark *"is not registered anywhere until L5 puts the
row where a finger can reach it."* It is registered: `DebtSheet.tsx:125` calls
`useCoachMark('payoff-schedule', isEdit)` and `:257` mounts the `TutorialTarget`. A flow written from the
comment would have opened the **Add** sheet and waited for a mark that is correctly never offered there —
failing for a reason with nothing to do with §13.1.

**Fifth instance this session of a document outliving its subject**, and the same shape as A1 (fixed three
days before the plan item describing it was written). The before-scan is the cheapest step in every item
and it has now paid twice in two days.

### What was deliberately NOT claimed

- **§13.6 (VoiceOver hears each hint once)** — the doubling it hunts is a root copy *and* a sheet copy both
  live in the a11y tree. `testID="coach-mark"` exists precisely so a test can count them
  (`CoachMarkLayer.tsx:81-84`), but counting is unproven → the flow asserts **presence, never uniqueness**.
  Asserting "visible" and recording it as "exactly one" is how a check that proves nothing becomes coverage.
- **§13.4's judgement half** (does the hint bury the chart above it?) — a composition call. The flow
  asserts the part that can fail and hands the frame to a human.
- **§12.0.3's counterpart** in these sections, for the same reason.

⏳ **Both flows are unrun.** `inputText` · `hideKeyboard` · `killApp` are documented core commands this repo
has never driven, so first-run tuning is expected — but they are a different risk class from the probe set:
the two commands this build actually rejected were a name that never existed and a property on the wrong
command, not capability gaps. Batched with the probe's repairs for the next cycle rather than spending a
third one.

### 4.1.1 cycle 1 — two answers, five masked, and a diagnosis that fit the evidence and was wrong (2026-08-11)

`gh workflow run native-e2e.yml -f mode=probe` → run 31500975624, ~35 min. Verdicts:

```
PASS  p01-extended-wait      FAIL  p02-openlink-scripted   FAIL  p03-set-orientation
FAIL  p04-assert-screenshot  FAIL  p05-repeat              PASS  p06-evalscript
FAIL  p07-ax5-dark (AX5·dark)
```

### ✅ Two capabilities proven

**`extendedWaitUntil` exists and works.** That closes the finding that started 4.1: the limit recorded in
`06-tutorial-interactions.yaml` — bought with three CI cycles and written into the flows as a rule — was
never real. `extendedWaitUntilVisible` is a name that has never existed, and `timeout` is invalid on an
assertion because it belongs to `extendedWaitUntil`. Every timed payoff in the suite becomes assertable.

**`evalScript` + `assertTrue` work**, which is what §13.6's and §12.0.3's counts need.

### ⛔ The five reds were ONE cause, and it was not any of their commands

`p02` used Maestro's `openLink`. iOS raised **"Open in "Debt Planner (RN)"? · Cancel / Open"** — a
SpringBoard-owned confirmation — and nothing dismissed it. Maestro could not: the flow is scoped to
`com.jasonsnyder.debtplanner`, and the hierarchy it captured at the next failure contains **three
elements, all status bar** (`"No signal"`, the Wi-Fi bars, `"Not charging"`). Not the alert's own buttons.
Not one node of the app.

The modal **persisted for the rest of the run.** p03/p04/p05/p07 each failed on their first assertion with
the target text plainly rendered in their own failure screenshots. p06 passed through the identical
conditions only because it asserts nothing about the screen — an accidental control, and the cleanest
evidence available.

⚠️ **The cost was not the lost cycle. It was the false verdicts.** `p07-ax5-dark`'s red read as *"the app
breaks, or its copy vanishes, under AX5 reflow"* — an alarming and entirely wrong claim about
accessibility, produced by a file that never reached its own question.

### ⚡ The diagnosis that fit everything and was wrong

First reading: *p01 is the only file that waited, so a `clearState` launch outruns the default assertion
timeout.* It explained every PASS and every FAIL in the table exactly. It was false, and **the
contradicting evidence was already in hand** — flow 01 does the same bare assertion after the same
`clearState` launch and has always been green. That contradiction was noticed, written down as an open
question, and the story was acted on anyway because the table fit.

**Fitting the verdict table is not evidence.** The artifacts were: a screenshot showing the text on
screen, and a hierarchy dump showing it absent from the tree. Both were one download away the whole time.
This is [[measure-agent-mechanisms]] arriving from the inside — the recommendation (wait for a stated
signal) was sound and shipped; the mechanism attached to it was invented, and would have entered the
record as measured fact in five files' comments. The comments were corrected in place rather than
quietly, because the wrong story is the more instructive artifact.

### The repair is ORDERING, not cleanup

The probe was built so a parse failure in one file could not mask another's answer. **Device state was a
dimension that design did not consider**, and it defeated it completely: a leaked modal is invisible to
per-file isolation, and the table reads as five capability gaps.

- The deep-link probe moves to **`xcrun simctl openurl`** (through the system, not a link tap) and is
  rewritten as `probe-deeplink/p09-deeplink-scripted.yaml`.
- It runs **LAST**, after the conditions pass, so that if it still leaks a modal it poisons nothing.
- Standing rule added to the probe README: **any file that can change device state outside the app under
  test runs last**, because ordering is the only isolation available here.

### Two facts recovered from the failure

`openLink` **works as a command**, and the **scheme is registered** — iOS recognised `debtplannerrn://`
and offered the app by name. Only the confirmation was in the way, so §12.1–§12.7's 15 checks are still
live, and the question cycle 2 asks is now narrower: does `simctl openurl` prompt?

⚠️ p09 also splits its assertion in two — the **marker** (renders in both modes → did the link route at
all?) then the **dock** (scripted only → did it select the mode?). One assertion could not tell apart two
repairs, which cycle 1 demonstrated by producing exactly that ambiguity.

### 4.1 re-scoped — the bar is CONFIDENCE, and Appium is promoted (2026-08-11)

🎯 Jason: *"The more that we can prove with Appium/Maestro the better. Real device is important but we
have a whole phase dedicated to that. I want us to just be confident enough here to be able to move on."*
· *"Setting up tooling now will save us so much time in the future as well."*

**Two decisions, and both reverse a recommendation I had made an hour earlier.**

**① The exit criterion is no longer a coverage number.** I had proposed capping 4.1 at 4.1.3 and
returning to Wave A, on the grounds that six more tooling sub-steps was too much to do while three
confirmed live correctness defects sat in A3. That argument assumed the value was **v1.7-local**. It is
not: `native-e2e.yml` already mirrors Freedom's lane, so the harness serves v1.8, the Android lane and
the portfolio — **and the findings travel with it**, since the `extendedWaitUntil` correction and the
"a file that leaks device state runs last" rule apply to any repo on this setup. Amortised, the spend
is cheaper than my framing made it look, and the cap was the wrong call.

**② Appium is promoted from the backlog to 4.1.8**, having been filed as *triggered-not-scheduled* with
an explicit "NO for now" the same day. The trigger I wrote (`assertScreenshot`/`setOrientation` coming
back missing) was the right gate for a *replacement* and the wrong one for a *supplement*: it is a second
lane scoped to the gap Maestro cannot close, and Maestro keeps everything it already carries. Scoped to
**§11.15 as a numeric frame-containment assertion** — `rect`/`frame` are exposed element attributes, so
the highest-value item in the checklist stops being a screenshot comparison — plus **§10's three ⌘-key
checks** (`mobile: keys` + `modifierFlags`, iPad-only, Xcode 15/iOS 17+). ⚠️ Scoped against what 4.1.1
**measures**, not against a guess.

### The exit criterion, stated so it can be checked

**Every check in `DEBT_3.5_DEVICE_QA_CHECKLIST.md` sits in exactly one of three buckets, written down:**
automated and green in CI · Phase-6-owed *with the reason stated* · judged not worth automating *with the
reason*. **No check left unclassified.**

That is what turns "confident enough to move on" into a decision rather than a hope. Phase 6 still runs
the hardware pass; this lane's job is that nothing arrives there **unexamined**.

⚠️ **What voids it:** a check moved into bucket 1 by weakening it until it passes.
`06-tutorial-interactions.yaml` already names four assertions that shipped confidence nobody earned, this
item roughly doubles the surface for that mistake, and cycle 1 produced one false verdict already —
p07's red read as *"the app breaks at AX5"* when it had never run.

### Ranking changed with the criterion

§12.1–§12.7 dropped from second to seventh despite being the largest single block (15 checks): it is the
App-Preview/embed vehicle, so it raises confidence in the **asset**, not in the app. The AX/theme
conditions rose, because WCAG 2.2 AA is a stated floor. **Ranking by check count and ranking by
confidence are different orders**, and only the second one answers the question that was actually asked.

### 4.1.1 cycle 2 + 4.1.3 — five commands proven, and the suite turns out to be broken (2026-08-11)

```
PASS  p01-extended-wait  PASS  p03-set-orientation  PASS  p04-assert-screenshot
PASS  p05-repeat         PASS  p06-evalscript
FAIL  p07-ax5-dark       FAIL  p09-deeplink-scripted
```

⚡ **The ordering repair worked.** p09 ran last and poisoned nothing, which is the only reason the five
passes are trustworthy. Cycle 1's five reds really were one leaked modal.

**Proven:** `extendedWaitUntil` · `evalScript`+`assertTrue` · `setOrientation` · `assertScreenshot` ·
`repeat`. **4.1.5's iPad boot — and §11.15 with it — is fully unblocked.**

⚠️ **My Appium trigger did not fire.** I wrote it as "if `assertScreenshot` or `setOrientation` come back
missing"; both passed. Appium is no longer a gap-filler, and 4.1.9 was re-justified accordingly rather
than left standing on a condition that never happened.

### p07 — my stale selector, and the real result underneath it

Failed on `tapOn: "Try with Sample Data"`. **The assertion above it passed**, which is the actual finding:
the copy is still findable at **AX5 + dark**, so the app does not break under reflow, and
`simctl ui content_size`/`appearance` reach it. I verified every selector in the flows written that same
hour and copied this one out of flow 01 without checking it.

### p09 — the door is the OS, not the tool

`xcrun simctl openurl` raises the **identical** "Open in "Debt Planner (RN)"?" dialog. So the confirmation
is iOS 26 behaviour for a custom scheme however the URL is delivered — not an artefact of `openLink`. It
failed at assertion **(1)**, the marker, so the link never reached a demo at all; splitting that assertion
turned what would have been an investigation into one line. Cycle 3 tries a **coordinate tap** (the alert
is not in the hierarchy, but a coordinate tap does not need it). If that fails, the door is Appium's, via
`autoAcceptAlerts` — **a measured gap, replacing the guessed one.**

### ⛔ 4.1.3 — THE SUITE WAS BROKEN, AND GREEN BY NEVER RUNNING

Found only because a probe file had copied a selector out of flow 01.

- **`b67cf5d` (2026-08-10)** deleted **"Try with Sample Data"**. It updated the web e2e spec and the
  device checklist and **never touched `01-launch-smoke.yaml`.**
- **`A10.1`, the same day**, replaced Money's three per-section Add rows with one chooser, breaking
  **`02-sheet-native-tap.yaml`**'s selectors.

**Two commits, two broken flows, neither noticed.**

⚠️ **And the selector was the smaller half.** The deleted button called `importStore(demoStore())` — a
fabricated plan written into the REAL store, which persisted, which is the seed **flows 02–06 each
declare a dependency on**. What replaced it opens a sandbox that deliberately persists nothing. A fixed
selector would have left five flows running against an empty app and failing for reasons that look like
product defects.

**Flow 01 now walks onboarding and adds Visa · Store Card · Car Loan through the real UI.** That is
strictly better than the import it replaces: the fixture was a state no user's fingers could produce,
while this exercises the first-run path, so a break in onboarding fails the suite at step one instead of
hiding behind a seeded shortcut. The three names are load-bearing — flows 03/04 match rows by them.

### The root cause is the lane's trigger, so 4.1.4 guards it

This lane is **manual-dispatch only** (mac minutes), so a stale flow reports **nothing** rather than red,
and it decayed for a day unseen. Fixing the two flows does not stop the third. **4.1.4** adds a cheap
static check on the free lane — every text selector in `.maestro/**` must exist in app source — wired
into `validate:release:rn` beside `check-rn-style-divergence.ts`.

⚡ **This is the plan's own audit-gate defect class arriving in the test suite itself:** *a claim kept
somewhere other than where it is checked.* The flows assert against strings the app owns, and nothing
was checking that the strings still existed.

### 4.1.3 cycle 1 (suite) — 8/8 failed, ONE cause, and a step that lied (2026-08-11)

```
[Failed] 01-launch-smoke      (Assertion is false: "Add your first debt or expense" is visible)
[Failed] 07-money-add-and-rescue  (same)
[Failed] 02 · 03 · 04         (Element not found: Id matching regex: tab-money)
[Failed] 08-coach-marks       (Assertion is false: id: tab-money is visible)
[Failed] 05-tutorial-walkthrough  (No visible element found: "How this works")
8/8 Flows Failed
```

⚡ **Six of the eight are SYMPTOMS**, and flow 01's own header predicted them: *"If this fails, do NOT
patch the later flows — the seed is what broke, and every red after it would be a symptom."* 02/03/04/08
cannot find a tab bar and 05 cannot find the Guardian's replay link because onboarding never completed,
so the app never left the first-run stack. Written down before the run, and it held.

### The one cause: a selector that matched two nodes, only one of them focusable

`TextField` renders a `<Text>` label **and** sets `accessibilityLabel={label}` on the `TextInput` — the
**same string on two nodes**. `tapOn: "Paycheck amount"` resolved to the non-focusable label, nothing took
focus, and `inputText` typed into the void.

⛔ **And every step reported COMPLETED**, including the `inputText`. Maestro's `inputText` succeeds
whether or not anything receives it. So the flow walked on and died three steps later at *"Add your first
debt or expense"*, and the only clue on screen was the app's own validation — **"Enter your paycheck
amount to continue"** — which is the app behaving correctly.

**That is the worst shape a test failure can take: it reported success at the step that was broken, and
red at a step that was fine.** The failure screenshot showed the field still holding its placeholder,
which is what settled it; the per-step `commands.json` showed every command COMPLETED, which is what made
the screenshot necessary.

### Fix: unambiguous by construction

`TextField` gains an optional `testID` forwarded to the `TextInput`, and the **11 fields the lane types
into** carry explicit ids (`field-paycheck-amount`, `field-debt-balance`, …) across `PaycheckStep`,
`FirstDebtOrBillStep`, `DebtSheet` and `ExpenseSheet`. Flows 01 and 07 now target ids, not labels. `tsc`
clean. The component's docblock records **why** the prop exists, so nobody removes it as decoration.

⚠️ **A label is not a selector when the label is also rendered as text.** This is the same class as the
`.maestro` staleness found an hour earlier — a claim about the app kept somewhere the app does not check
— and the cross-check written to verify the wiring (*every `field-*` id used in a flow must exist in app
source*) is a **working prototype of 4.1.4's selector guard**. Build 4.1.4 from it.

⚠️ **Not yet re-run.** Six of the eight flows have never executed past onboarding, so their own selectors
are still unverified — expect more first-run tuning, and expect it to be *shallower* each cycle.

### 3.7 Wave A · A3 — the before-scan is COMPLETE. The ledger of nine is seven. (2026-08-11)

Verified all nine against current code before building any of them. **Two were already fixed — both on
2026-07-29, the day BEFORE the ledger was written on 07-30**, and both by the same `closeout VIS-4` pass,
so the ledger was assembled from notes that predated the work that resolved them.

| # | item | verdict |
|---|---|---|
| **A3.1** | attestation affordance gating | ⚠️ **LIVE** |
| **A3.2** | starter-EF "keeps it as cushion" overstatement | ⚠️ **LIVE** |
| **A3.3** | `selectTightTopUp` prefers the EF | ⚠️ **LIVE** |
| **A3.4** | hero-vs-Guardian number coherence | ⛔ **ALREADY FIXED** — `b8c15d3` (07-29) |
| **A3.5** | no undo on the tight top-up | ⚠️ **LIVE** (cheaper than filed) |
| **A3.6** | "hold your line" offered twice | ⚠️ **LIVE** |
| **A3.7** | applied purchase reads as a deferrable bill | ⚠️ **LIVE** (design call, not a bug) |
| **A3.8** | `GoalSheet` name-dedupe | ⚠️ **LIVE** |
| **A3.9** | affordability/ack density → the ack coordinator | ⛔ **ALREADY FIXED** — `0336e3f` (07-29) |

**The two closed:**
- **A3.4** — `b8c15d3` *"Today hero third bucket 'Free' → 'Flexible' (Jason ✓)"*. `PlanHero.tsx:81` carries
  the reason inline: *"names the discretionary money, distinct from the Guardian's protected 'Cushion'"*.
  That IS the coherence complaint, answered and signed off.
- **A3.9** — `0336e3f` *"ack-density coordinator — single priority ack-slot on Today"*. `activeAck`
  (`index.tsx:197`) is a single union that admits ONE ack, exactly the coordinator the item proposed.

**The seven that are real, with the evidence:**
- **A3.1** `selectBillsAttestation` shows on `discoveryHoldbackActive` alone (`guardianSelectors.ts:144`),
  never checking whether attesting reduces anything. Discovery/cold-start/variable-buffer compose by
  **`max`** (`holdbackComposition.ts:54`), so 0.4 → 0.15 can be fully absorbed by a 0.25 cold-start or the
  variable buffer. **The affordance can promise a smaller safety net and deliver zero.**
- **A3.2** `allocatePaycheck:495` funds the starter EF from `remaining` **before** debt deploy, so a spare
  that all goes to the EF leaves `deployedToDebt = 0` → the `deployedToDebt <= 0` branch
  (`buildGuardianBrief.ts:297`) says *"this paycheck keeps all of it as your cushion"*. It did not: it
  went into a GOAL. ⚠️ Measure the exact figure before writing copy — the claim is directional so far.
- **A3.3** `guardianSelectors.ts:219` — `find(g => (g.type === 'emergency' || g.type === 'savings') && …)`.
  Find-order, no preference. Raids the safety net for a covered-but-tight cushion dip.
- **A3.5** an undo EXISTS, on the other caller only: `AffordabilityCard.tsx:92` calls `applyTightTopUp`
  with a **negative** amount. The Guardian's own top-up (`index.tsx:302`) has none. Surface the existing
  mechanism rather than build one.
- **A3.6** `coverFromSavings` (`guardianSelectors.ts:299`) and `selectTightTopUp` are independent, with no
  mutual guard, and **both cards render on Today** (`index.tsx:295` Guardian, `:380` Affordability). Two
  offers of the same move.
- **A3.7** `AffordabilityCard.tsx:73,83` — `addExpense({… recurrence: 'one-time' })` with **no category**,
  so it defaults to uncategorized → **deferrable** under `classifyDeferability` (2.6.2). "New couch" reads
  as a deferrable bill in Recovery. Coherent by rule; the open question is whether it reads that way to a
  person. **Design call for Jason, not a defect to fix silently.**
- **A3.8** `AffordabilityCard.tsx:56` dedupes goal names; `GoalSheet` does not. Inconsistent across two
  creation flows for the same namespace.

⚡ **Three of nine ledger items across Wave A have now turned out to be already-fixed** (A1, A3.4, A3.9).
The switch-in verification has paid on every single item it has been applied to, and it costs minutes.

### 4.1 ⏸ PAUSED at 4.1.3 — 3.7 finishes first (2026-08-11)

🎯 Jason: *"We need to finish 3.7 before moving on to Phase 4."* The lane is paused **mid-item**, not
abandoned, and Wave A retakes the active slot. Parking the full decomposition here because the plan
carries exactly one decomposed section and it is now Wave A's.

⚠️ **The state it is paused IN matters: the native lane is RED.** 4.1.3's suite repair is built, pushed
and **unverified** — run 31514348038 was still in flight at the pause. The suite had been broken since
2026-08-10 and green-by-never-running, so pausing does not make anything worse than it was, but the lane
cannot be described as working until that run lands. **Record the result when it does, even though the
item is parked** — an unverified repair is exactly the "claim kept where nothing checks it" shape.

**Done:** 4.1.1 (six capabilities proven over two cycles) · 4.1.2 (flows 07/08, 11 checks, unrun) ·
4.1.3 (the repair + `TextField` testIDs, unrun).

**Remaining, in the ranked order established 2026-08-11 (confidence, not check count):**

| # | step |
|---|---|
| 4.1.4 | the selector guard — every text selector in `.maestro/**` must exist in app source, wired into `validate:release:rn`. ⚡ Prototype already written (the `field-*` cross-check) |
| 4.1.5 | the iPad boot — §11.15 ⭐ · §11.16 · §10's two layout checks · §11.8's rotation half |
| 4.1.6 | §12.0 explore (7) |
| 4.1.7 | AX + theme conditions — §11.1 · §11.5 · §8's half. Reduce Motion needs an app-side observable first |
| 4.1.8 | §11's remainder — §11.9 · §11.13 · §11.11 |
| 4.1.9 | the Appium supplement — §11.15 as numeric frame containment · §10's ⌘ keys · `autoAcceptAlerts` |
| 4.1.10 | §12.1–§12.7 (15) — blocked on the deep-link door |
| 4.1.11 | reconcile — the exit |

**The exit criterion, unchanged** (🎯 *"confident enough to move on"*): every check in
`DEBT_3.5_DEVICE_QA_CHECKLIST.md` sits in exactly one of three buckets, written down — **automated and
green** · **Phase-6-owed with the reason stated** · **judged not worth automating with the reason**. None
left unclassified. ⛔ Voided by any check moved into bucket 1 by weakening it until it passes.

⛔ **The deep-link door, measured both ways:** iOS 26 raises the "Open in …?" confirmation for a custom
scheme via Maestro's `openLink` **and** via `xcrun simctl openurl`, and the alert is SpringBoard's — it
never enters the flow's hierarchy. A coordinate tap is staged in `p09` and untried; if it fails, the door
is 4.1.9's.

### 3.7 Wave A · A.3 — the A4–A7 before-scan (2026-08-11)

Same treatment as A3, same result shape: **one item closes outright, one half-closes, two are real.**

| # | verdict | evidence |
|---|---|---|
| **A4** BNPL seam polish | ⚠️ **LIVE** (3 parts) | the required row's amount comes from `allocation.allocations`, and the allocation is built on `scaleBnplMinimumsForWindow(store.debts, …)` (`selectors.ts:65`) — so a biweekly BNPL under a monthly payer **does** show the summed figure ($300) where the user knows a $100 installment. The proposed "for 3 installments" clarification is **unbuilt** — no such copy exists anywhere. ⚠️ A4a (month-stepped vs per-cycle mid-curve divergence) is **cosmetic by its own description** ("they agree at the payoff endpoint") and needs measuring before it earns work |
| **A5** offline Lifetime mislabel | ⚠️ **LIVE** | `premiumResolved` does not exist anywhere in the app. `more.tsx:255` gates the row on `plan === 'premium' && !premiumIsLifetime`, and `premiumIsLifetime` is the **transient** flag derived from `productIdentifier` (2.11.8, deliberately no migration) — so offline, before RevenueCat resolves, a Lifetime owner has `plan='premium'` from storage and `premiumIsLifetime=false`, and briefly sees **"Manage Subscription"** |
| **A6** drift type hygiene | ◐ **HALF** | ⚠️ LIVE: `buildDriftBaseline` (`computeDrift.ts:120`) takes `debts: Array<{ balance; minimumPayment; apr; type? }>` — **no `recurrence`**, exactly as filed. Cadence-correct at runtime because callers pass real debts; the narrowed type is what would let a future `.map` drop it silently. ⛔ CLOSED: **the dead `DriftResult` re-export does not exist** — the type is declared and consumed in `computeDrift.ts` only, with no barrel re-export. Likely went with `DriftCard` (2.11.8 B-F1) |
| **A7** third debt-free-date producer | ⛔ **CLOSE — confirmed clean** | `selectPayoffView.debtFreeDate` → `selectDebtFreeDate` · `selectDebtFreeBand` → the same funnel twice (typical + lean) · the widget (`widget/snapshot.ts:76`) reads `selectPayoffView` · `selectWhatIf*` wraps `projectDebtPayoff` directly, which is a deliberate second SCENARIO, not a rogue producer · the drift baseline stores a **frozen** date, not a computed one. **One engine, one app-layer funnel, no third producer.** Retire the portfolio-level follow-on note |

### ⚡ The pattern is now large enough to state as a number

Across the 2026-07-30 pass, **fourteen items have been verified before building. Five did not survive
contact with the code**: A1 (fixed 3 days before the item was written) · A3.4 and A3.9 (fixed the day
before) · A7 (never a defect — a confirmation that confirms clean) · A6's re-export half (gone).

**That is better than one in three.** The verification costs minutes per item and has never yet been
wasted. It is also the reason the remaining nine are worth trusting: each now carries a file and a line
rather than a description.

**Wave A's real remaining surface:** A3 ×7 · A4 ×3 · A5 · A6a · A8 — and two of those are gated
(**A3.7** on a design call, **A8** on [D4]).

### A.3 AFTER-SCAN (2026-08-11) — 🎯 *"Don't forget to do after scans too"*

⚠️ **Jason is right that these had been getting skipped.** Discoveries were being folded in
opportunistically as they appeared, and the *completion* scan — the pass that asks what only became
visible once the work was done — was not being run at each boundary. That is precisely how adjacent items
get lost, since a before-scan structurally cannot see them. Four things this one surfaced:

**① A6a is a DIVERGENCE, not an omission — and it makes the fix obvious.** The before-scan established
that `buildDriftBaseline` (`computeDrift.ts:120`) takes
`debts: Array<{ balance; minimumPayment; apr; type? }>`. What only shows on comparison: its sibling
`buildPayoffTrajectory` (`buildPayoffTrajectory.ts:11`) takes the same conceptual input **and already
carries `recurrence?`**. Two functions in one directory disagreeing about the shape of a debt. → **folds
into A6a**: match the sibling rather than invent a shape, and the risk drops to nil.

**② `selectWhatIf*` is a second entry point into the engine, and A7's closure should say so.** A7
confirms one *funnel* (`selectDebtFreeDate`) — but `selectWhatIfBaseline`/`selectWhatIf` call
`projectDebtPayoff` **directly**, bypassing it. Correct today (What-If is a deliberate alternate
scenario, not a rogue producer), and a latent trap: **if the funnel ever gains a guard, a floor or a
rounding rule, What-If silently will not have it.** → **filed to the audit gate** (cross-surface number
coherence), not fixed now — there is nothing wrong yet.

**③ A5's gate is probably not one row.** `premiumResolved` is being added to stop ONE mislabel, but the
condition it represents — "RevenueCat has not answered yet" — applies to every premium-dependent surface
that renders before resolution. → **folds into A5's build step as a scoping question**: enumerate what
else reads `plan`/`premiumIsLifetime` on a cold offline launch *before* writing the gate, so it lands
once rather than as row-by-row whack-a-mole.

**④ ⚡ WAVE B HAS NEVER BEEN VERIFIED, and it comes from the same era.** This is the strongest finding
here and only visible now that the rate is known: **5 of 14** Wave A items did not survive contact with
the code. B1–B4 were written in the same period and have had **no** before-scan. B2 in particular
("dropped streak/milestone surfacing") describes something as *missing* — and `pendingMilestone` +
`activeAck` both exist today, so it may well be partly built already. → **added as a numbered step
before Wave B builds anything.**

**Nothing else surfaced.** A7's "retire the portfolio-level follow-on note" turned out to have no
external note to retire — the note was the plan line itself, now closed. Verified rather than assumed:
grepped the code, `FUTURE_VERSIONS.md` and the docs tree; no other reference exists.

### 4.1.3 (parked item) — `hideKeyboard` deleted, not replaced (2026-08-11)

🎯 Jason, watching the run live: *"All of the flows on Wave 2 will fail I think since 01 did. It said
that it could not hide the keyboard."* Correct on both counts — 01 seeds the suite, so its failure
cascades.

⛔ **The command should never have been in the flows.** `OnboardingLayout.tsx:23` states the reason in its
own comment: a `KeyboardAvoidingView` is there **"so the decimal-pad keyboard (which has no return key on
iOS) never covers"** the CTAs, and the ScrollView carries `keyboardShouldPersistTaps="handled"` — so a tap
on the next field or on a button lands **with the keyboard up**. The app had already solved the problem I
added the step to solve.

And on a decimal pad with **no return key** there is no dismiss affordance at all, which is very likely
why Maestro could not hide it. **24 occurrences deleted across flows 01 and 07. Not replaced.**

⚡ **The lesson is the general one:** before adding a step that fights the UI, check whether the UI
already handled it. Three of this lane's failures now share a shape — a step added on an assumption the
codebase had already answered in a comment (`useInBoundedRun`'s docblock, `coachMarkCopy`'s stale note,
and now `OnboardingLayout`'s). **The codebase keeps being right first.**

Run 31514348038 cancelled rather than left to finish: flow 01 fails at step 5 of ~30, so the remaining
~20 minutes of mac time would only re-confirm the cascade.

### 3.7 Wave A · A.4 — A3.1 fixed; A3.3 blocked on a decision (2026-08-11)

**Gate: 158/158, zero `error-context.md`.** lint · tsc · core regression · app · scenarios · RN-web e2e.

### A3.1 — the affordance now answers the question its own copy asks

The offer reads *"All your regular bills entered? I'll hold a smaller safety net."* That is a promise
about an **outcome**, and `discoveryHoldbackActive` could not keep it — it is a pure cycle count
(`guardianPredictionCore.ts:34`) that knows nothing about the money. The three uncertainty reserves
compose by **`max`** over above-floor headroom (`holdbackComposition.ts:54`), so attesting drops discovery
0.4 → 0.15 and changes the combined hold by **nothing** whenever a cold-start reserve, a variable-bill
buffer or a prefunded reserve is already the max — and by nothing at all when there is no headroom.

`selectBillsAttestation` now compares the two worlds and shows only when attesting **lowers** the hold.

⚡ **The test states its own precondition**, which is the part worth copying. It asserts *first* that the
constructed cycle has no reduction available (`attesting changes the hold by nothing`) and only then that
the affordance is withheld. If the construction ever stops producing that cycle, the precondition fails
and says so, instead of the real assertion passing for the wrong reason — the "assertion that passes
either way" defect class this phase keeps hunting.

**Cost: one extra allocation**, not two — `selectAllocation` memoises per store object and the current
store's is already computed for the card this sits on; only the counterfactual store is new. Filed to the
existing memoization backlog entry rather than left implicit.

⚠️ **What made this safe was an existing test, not care.** `guardianSubjects.test.ts` asserts at build
time that each walkthrough beat can find its subject — including beat 4's attestation line. Had the fix
over-corrected, that test would have gone red before any human looked at beat 4. It stayed green. This is
the same test the device checklist cites for why §11.3's old "a beat that can't find its control" check is
now unreachable by construction.

### After-scan

- ⚠️ **The defect class generalises: an affordance that promises an OUTCOME, gated on a PROXY.** Filed to
  the audit gate (wording/voice) as a sweep of the siblings — `selectReserveRelease`,
  `selectReserveWalkback`, `selectRiskAcknowledgment`, `selectTrialConversion`,
  `selectGuardianProofOfWork`: is each gated on the thing it claims, or on something that merely
  correlates? A3.1 is one instance; nothing says it is the only one.
- The extra allocation → the memoization backlog entry.

### ⏸ A3.3 is blocked, deliberately

The original finding flagged "EF last-or-never" as a **design call**, so it is [D24] rather than my pick.
**Recommendation on the record: EF last, not never** — "never" makes the one-tap vanish for anyone whose
only savings IS the emergency fund, which is most people early on, and a covered-but-tight cycle is what a
cushion is for. The dishonesty is not drawing on it; it is drawing on it **silently and first**. So:
prefer a discretionary goal, fall back to the EF, and have the copy name it when it is the EF.

⚠️ A3.7 likewise filed as **[D25]** rather than fixed quietly.

### Five decisions settled (2026-08-11)

🎯 Jason: *"Agree with all your recs except D1."* [D24] · [D25] · [D2] · [D3] · [D4] locked as recommended;
terse forms in the plan's Decisions section. Two consequences worth stating:

- **[D2] came with a live defect attached.** Researching the ownership question found that four readers
  use `minimumPaidThisCycle ?? isPaidThisCycle ?? false` while **`planSelectors.ts:136` filters on
  `d.minimumPaidThisCycle` with no fallback** — so a debt marked paid through the other flag is already
  invisible to that one surface. The decision fixes a real inconsistency, not just a future one.
- **[D4] creates a step, not just an answer.** The rename moves ahead of everything else in Wave A as
  **A.0**, because A8's Siri phrases embed `\(.applicationName)` and cannot be finalised or device-tested
  against a name that is going to change.

### [D1] iOS-18 Control Center — the ORIGINAL REASON HAS EXPIRED

⚠️ Recorded before the discussion, because the premise is what changed. It was deferred during the
3.5.3/3.5.5 sequencing on a **cost** argument — the AppIntent-mutation machinery was unbuilt, and the
marginal cost of a Control Center control was ~4–5× the query-intent baseline.

**That is no longer true.** Every piece it needed now exists: the widget extension
(`apps/rn/targets/widget/`, signing proven), the App Group, `DebtProvider.swift` for data, and
`PaydayLandedIntent.swift` — an App Intent already living *inside* that extension, which is exactly what
a `ControlWidget` binds to. The marginal cost today is closer to one Swift file plus an availability gate.

**So the deferral needs a new reason or a reversal.** The two that survive scrutiny:

1. **Deployment target is `16.1`** (`targets/widget/expo-target.config.js:25`); Control Center controls
   are **iOS 18+**. Additive, no regression — but a slice of users never see it.
2. ⚡ **There may be no control-SHAPED job.** Control Center is for frequent, one-tap, unambiguous
   actions. This app's actions are either **multi-step** (log a payment needs a debt *and* an amount) or
   **rare and dated** (payday landed, which already has a Live Activity button). A glance-only control —
   "here is your debt-free date" — is a widget's job, and the app already ships that widget.

**Standing recommendation: stay deferred, on reason 2 rather than on cost** — and revisit the moment a
genuine one-tap emerges. B4 (swipe-to-mark-paid) is the likeliest source of one.

### [D1] deferred with a trigger · A.0 the rename (2026-08-11)

🎯 Jason: *"We'll leave it deferred and revisit if it becomes viable during the build."* [D1] closes as a
deferral with a **stated revisit trigger** rather than an open question — the difference from its previous
state being that the reason is now *"no control-shaped job"* instead of the expired cost argument, and the
trigger is named: **a genuine one-tap emerging, most likely from B4.**

### A.0 — renamed via `CFBundleDisplayName`, and the before-scan is why

The plan said: flip `app.json`'s `"name"` to `"Debt Planner"`. **Doing that literally would have broken
three CI pipelines.** `expo.name` derives the generated Xcode project name, and `DebtPlannerRN` is
hardcoded **10×**:

- `.github/workflows/native-e2e.yml` — workspace, scheme, the installed `.app` path, and the log predicate
- `.github/workflows/app-preview.yml` — workspace, scheme, `.app` path
- `codemagic.yaml` — `xcodeproj`, workspace, scheme … **the signed TestFlight build**, and the one that
  cannot be validated without spending a build

⚠️ **`codemagic.yaml:12` documents the derivation in its own comment.** That is the fourth time this
session the codebase had already written down the thing that was about to bite.

**So the rename went in as `ios.infoPlist.CFBundleDisplayName: "Debt Planner"`**, leaving `expo.name`
alone. It flips the Home-Screen name and the `\(.applicationName)` that every App Shortcut phrase embeds
— both goals [D4] was about — while every pipeline keeps building.

⛔ **The ship-blocker's wording was also wrong and is corrected:** it said `app.json` "would ship as the
Home Screen + App Store name". The **App Store name is set in App Store Connect** and was never in this
file. Only the Home-Screen name was ever at risk.

⏳ **Honest status: structurally correct, effect NOT yet observed.** No macOS here, so nothing has run
`expo prebuild` against it. The Home-Screen name and the shortened Siri phrases are confirmed on the next
build → checklist §1. ⚠️ `\(.applicationName)` resolving to `CFBundleDisplayName` is the one link I have
not measured; A8.4 is already device-only, so it lands in the same pass either way.

### 3.7 Wave A · A.4 + A.5 — A3.3, A3.5, A3.8 (2026-08-11)

**Gate: 158/158, zero `error-context.md`**, plus lint · tsc · core regression · app · scenarios.

**A3.3 [D24] — preference, not find-order.** `selectTightTopUp` was a bare `find` over
(emergency | savings), so the source was whichever goal the user happened to create FIRST. It now prefers
a discretionary goal and keeps the EF as a **fallback** — excluding it would delete the one-tap for anyone
whose only savings is the emergency fund.

⚡ **And the copy defect was worse than the selector's.** The button read **"Move $X from savings"
unconditionally** — including when it was spending the emergency fund. Calling the safety net "savings"
while drawing on it is the dishonest half; `isEmergencyFund` now drives *"Move $X from your emergency
fund"*. The test seeds the EF **first in the array** so find-order would pick it, which is the only
arrangement that can fail if the preference regresses.

**A3.5 — bigger than filed, for a structural reason.** The item read "no undo for the top-up". The cause
was not a missing button: **`cycleTopUp` recorded `{forCycle, amount}` and no SOURCE**, so nothing reading
only the store could hand the money back. That is exactly why the affordability card *had* an undo — it
keeps the goal in component state — and the Guardian card, the same move on the same money, did not.

`goalId` added (optional, backfill-safe: an older blob offers no undo rather than a control that cannot
complete), dropped again when the accumulated amount returns to 0 so a spent record cannot offer an undo
of nothing. `selectAppliedTopUp` exposes the reversible record; the card renders the undo **where the
offer was**, so the place that spent the money is the place that returns it. **One mechanism, two callers**
— the undo is the same `applyTightTopUp` with a negative amount the affordability path already used.

**A3.8 — one namespace, two writers, one guard.** `GoalSheet` now dedupes names like
`AffordabilityCard.tsx:56`. Case-insensitive and trimmed, and an EDIT ignores itself so renaming a goal to
its own name is not a collision. Without it a save-for-it fund and a hand-made goal could share a name and
then compete for the same priority-capped funding while reading as one goal.

### After-scan

- ⚠️ **`cycleTopUp` accumulates across multiple top-ups but `goalId` holds only the LAST source.** Two
  top-ups from two different goals in one cycle → the undo returns the whole sum to the second goal.
  Narrow (it needs two funded goals and two taps in one cycle) and it cannot lose money — but it can move
  it to the wrong pot. **Filed to the Phase-6 financial-correctness audit**, whose brief is exactly
  boundary inputs across the engine. Not fixed here: the honest repair is a per-source ledger, which is
  more shape than this item earns.
- ⚠️ **A3.8's guard is per-sheet, not per-store.** A third writer would need its own copy — the same shape
  the A3.8 defect *was*. `addGoal` is the real chokepoint. → the audit gate, with the sibling sweep.

### Session close — 2026-08-11

**Wave A: A.0 through A.5 closed. Next is A.6.** All decisions settled except 3.5.7's hosting/privacy.

### 4.1.3's parked run — red, but the failures moved (run `31516616133`)

```
[Failed] 01-launch-smoke (1m44s)  "Will you make it to payday?" not visible
[Failed] 07-money-add-and-rescue  Element not found: "See My Plan  →"
[Failed] 02 · 03 · 04 · 08        tab-money not found       [Failed] 05 · 06  "How this works"
```

⚡ **Read flow 07 before reading the count.** It walked the paycheck step **and** the debt form and died at
the *completion* button — which means **`inputText` works, the `field-*` testIDs work, and dropping
`hideKeyboard` was correct.** Three of the four unproven commands are now proven by a flow getting past
them. 02/03/04/08 and 05/06 remain downstream symptoms of 01.

**Two known next moves, and one of them is a trap:**
1. `"See My Plan  →"` — the label has a **double space** and an arrow glyph (`CompletionStep.tsx:25`).
   Maestro matches an element's full text as a regex, so this is a selector problem, not a UI one.
2. ⚠️ **Flow 01 failed its FIRST assertion after 1m44s — while probe `p01` passes the byte-identical
   opening.** Do **not** theorise about that. Pull the artifact and read the hierarchy dump first; the two
   times a story was invented to fit a verdict table this session, the story was wrong both times.

### What this session actually produced

- **3.7 Wave A:** A.0 (the rename, via `CFBundleDisplayName` — the literal instruction would have broken
  three pipelines) · A.2 + A.3 (both before-scans) · A.4 (A3.1, A3.3) · A.5 (A3.5, A3.8). Gate 158/158.
- **Seven decisions settled:** [D24] [D25] [D2] [D3] [D4] locked; [D1] deferred **with a named trigger**;
  [D22]–[D23] untouched.
- **4.1** built from nothing to two answered probe cycles, 11 new checks, and a suite repair — plus the
  discovery that **the suite had been broken and green-by-never-running since 2026-08-10.**
- **⚡ The number worth carrying forward: of 14 items verified from the 2026-07-30 pass, FIVE did not
  survive contact with the code.** A1 · A3.4 · A3.9 · A7 · A6's re-export half. The before-scan costs
  minutes per item and has never been wasted.

---

## 3.7 A.6 — A3.6 · one cover offer, not two (2026-08-11)

**Gate: 158/158, 0 errors.** Touched `guardianSelectors.ts` · `PaydayGuardianCard.tsx` ·
`AffordabilityCard.tsx` · `affordability.test.ts`.

### ⛔ The ledger's premise was half wrong — REFUTED, with the mechanism

A3.6 read: *"`coverFromSavings` and `selectTightTopUp` are independent, with no mutual guard, and both
cards render on Today. **Two offers of the same move.**"*

They are **not** the same move, and no mutual guard should be built:

- The Guardian's top-up closes **today's** dip: `gap = floor − cushion`.
- The affordability cover closes **today's dip + the purchase**: `gap = floor − cushionAfter`, and
  `cushionAfter ≤ cushion`, so the cover's gap **strictly subsumes** the top-up's.
- Tapping the cover lifts the cushion to the floor → `selectTightTopUp` returns null → the Guardian's
  offer disappears on the next render. Tapping the top-up shrinks the cover's gap by exactly that amount.
  **Either tap resolves the other.** A guard would delete the better-informed of the two offers.

This is Law IV again (`measure-agent-mechanisms`): the recommendation ("there is something wrong here")
was sound; the stated mechanism was wrong. **Sixth of the 2026-07-30 items not to survive contact.**

### ⚡ The real defect the ledger missed: a DOUBLE-COUNT

`selectAffordability` read `selectDiscretionary(base)` with **no `+ appliedTopUp(store)`**, while
`buildGuardianBrief`'s call site (`guardianSelectors.ts`, `discretionary:`) *did* add it. Cash moved from
savings is really in checking, so a reader that omits it is reading a stale cushion.

**Measured on the fixture** (paycheck $2000, min $100, rent $1750 → discretionary **$150**, floor $200,
Vacation $450):

| | Guardian card | Affordability card, $100 purchase |
|---|---|---|
| before any tap | cushion $150, offers to move $50 | dips to $50, cover asks **$150** |
| after the $50 top-up, **unfixed** | cushion **$200 — "at your line"** | dips to **$50**, cover asks **$150** again |
| after the $50 top-up, **fixed** | cushion $200 | dips to $100, cover asks **$100** |

Unfixed, the two cards state different cushions **on one screen**, and the second offer draws $150 more
for a $150 gap that $50 has already been paid into — **$200 out of the goal to close $150.** Fixed, the
two draws sum to exactly the gap.

⚠️ **No test had ever constructed a store with `cycleTopUp` set** — the whole interaction was
green-by-never-exercised.

### ⚡ Sibling found in the same code path: a CAPPED OUTCOME

`topUp = Math.min(gap, goal.currentAmount)`, but the copy was unconditional:

- `PaydayGuardianCard:345` — *"moving $20 over **holds your line** this paycheck."* A $20 pot against a
  $150 gap does not.
- `:366` the applied confirmation repeated it, and **persisted** the lie: once a capped move drains the
  goal to $0, `selectTightTopUp` returns null (no funded goal), so the offer vanishes while the
  confirmation still claims the line is held.
- `AffordabilityCard:117` + the button verb **"Cover"** — a completion claim over a capped amount.

Fix: `holdsLine` on `TightTopUp`, `selectAppliedTopUp` and `coverFromSavings` (plus `floor`/`cushionAfter`
so capped copy can name where the move actually leaves you). All four strings now branch on it; the button
verb drops from "Cover" to "Move" when it doesn't cover.

⚠️ `selectAppliedTopUp` computes `holdsLine` from the **post-move cushion**, not from a flag stored at
apply time — so it stays true if anything else in the cycle moves underneath it. (A stored flag would be
"a claim kept somewhere other than where it is checked", which is 3.5's after-scan defect class ③.)

### Tests — failing-then-passing, verified by reverting

`affordability.test.ts` 15 → 23 asserts. The double-count assertion was confirmed to **fail** against the
pre-fix selector (reverted the one line, re-ran, `❌ FAIL [A3.6 — the $50 already moved … counts toward
the cushion]`, restored). `holdsLine` is a new field, so pre-fix the capped case had no gate at all.

⚠️ **The fixture's arithmetic was wrong on the first attempt** — assumed a $100 purchase on a $150 cushion
was `short`; it is `tight` (`computeAffordability` only says short when `after < 0`). Measured with a
throwaway probe rather than reasoned about. Worth repeating: the numbers in these selectors compose
through `effectivePaycheckBuffer` and are not derivable by inspection.

### After-scan

- **Checked, NOT a defect:** `selectSaveForItOptions:482` omits the top-up too, and correctly — it paces a
  **recurring** per-paycheck save, which a one-cycle borrow must not inflate. Recorded so it is not
  re-flagged by a future sweep.
- **→ Deferred backlog (Engine structure):** `appliedTopUp` is a **manual-opt-in invariant** — three
  cushion readers, each of which must remember to add it, two of which did. The next one will miss it.
  Folding the top-up into the allocation is the structural fix and has engine-wide blast radius → the
  Phase-6 financial-correctness gate.
- **→ Audit gate (wording/voice):** the **capped-outcome** shape added alongside A3.1's proxy-gate sweep.
  Search target: *any copy asserting a completed outcome over a value that is `Math.min`'d, clamped or
  floored.*
- **Queue replenished:** A.7 (A3.2) takes the active slot.

---

## 3.7 Wave A — CLOSED (2026-08-11)

**A.0 – A.10. Gate 158/158, tsc clean on both trees.** Every fix carries a failing-then-passing test,
verified by reverting the source and re-running. Per-item detail is in the A.6 / A.7 entries above and
the commits `72c790d · ce81541 · 0e2331c · d8ab54b · f4b5737 · 700161b · ba77303`.

### ⚡ The number that matters, now final

Fourteen ledger items were carried into Wave A from 2026-07-30. **Five did not exist** (A1, A3.4, A3.9,
A7, A6's re-export half). **Four more were materially misdescribed** — and this half only became visible
during the BUILD, which is the part a before-scan structurally cannot reach:

| item | what the ledger said | what the code said |
|---|---|---|
| **A3.6** | two offers of the same move, no mutual guard | the offers are DIFFERENT and either resolves the other; the real defect was a **double-count** the ledger never mentioned |
| **A3.7** | uncategorized → **deferrable**, so a couch reads as a deferrable bill | uncategorized → **ESSENTIAL**. Exactly inverted: the couch was as un-cuttable as the rent |
| **A8** | phrases "can only shrink by shrinking the NAME" | `INAlternativeAppNames` and phrase STRUCTURE are two other levers; neither touches the name |
| **A4a** | a mid-curve divergence worth fixing | measured: $371 = 4.37% of start, 8.7pt on a 200pt chart, endpoint agrees to 0.23 months. Refuted |

**So roughly 5 of 14 were both real and accurately described.** The before-scan catches the
already-fixed; only building catches the misdescribed. Both passes earn their cost, and **B.0 exists
because B1–B4 come from the identical pass.**

### ⚠️ The gate ran no `tsc`. At all.

Found at A.9.1 while typechecking a shared-type change. `validate:release:rn` chained lint → regression →
app → scenarios → e2e, and never called TypeScript. **A.6 and A.7 had both gone green and been committed
with real type errors in them** (a missing `holdsLine` on a prop type; a possibly-undefined `safeMove`).
The pre-Wave-A baseline was verified clean, so this was a hole actively being filled, not a backlog.

`packages/core` was the worse half, and it took the wave-level after-scan to see it. `apps/rn/tsconfig`
excludes `core` with the comment *"the shared core is typechecked by the Capacitor app, where its interim
`@/lib` backward-deps resolve."* That was true when written — and **`validate:release:legacy` was retired
2026-07-24**, so the money engine had silently had no typecheck for over two weeks. The root `tsconfig` is
broken (it tries to compile `apps/rn` with the wrong aliases) and referenced by no script.

Measured before wiring: **14 errors, every one legacy-tree coupling, zero in the engine.** 8 × the DOM
`Storage` type in legacy seeds → `lib: ["ES2020","DOM"]`. 6 × `@/lib/*` importers → the alias is
RESOLVED, not excluded. ⚠️ Excluding them **silently does nothing** — the core tests import them, so they
come back in through `include`; an exclude that doesn't apply is worse than none, and the first attempt
made exactly that mistake before the re-run caught it.

`typecheck:core && typecheck:rn` now run FIRST in the gate. The alias and the three importers go together
at 5.5.1.

### The wave's other cross-item findings

- **"Two places, one rule" hit three times** — A6a (two debt shapes in one directory, one omitting
  `recurrence`), A5 (the premium ternary duplicated across More and the paywall), A3.6 (one "holds your
  line" claim in four strings). Each was closed by extracting a single authority: `PayoffSimDebt`,
  `premiumKind`, `holdsLine`. → filed to the audit gate as a sweep.
- **A stale comment generated a false ledger entry.** `testClassifyDeferability`'s header described
  `other`/uncategorized as deferrable; its own assertions had said the opposite since MF.1. A3.7 was
  filed matching the header. Had it been built as written, a discretionary purchase would have been made
  *less* cuttable. → filed to the audit gate: docs that disagree with adjacent code manufacture defects.
- **`appliedTopUp` is a manual-opt-in invariant** — three cushion readers, each of which must remember
  `+ appliedTopUp`; two did. → deferred backlog (Engine structure), Phase-6 financial-correctness gate.
- **A4 was logged as "3 parts" and only two are recoverable from the record.** Reported rather than
  invented. Both are resolved (one built, one refuted).
- **One intermittent e2e red** during A.10, on a `toContainText`, which did not reproduce across two
  subsequent full runs. ⚠️ The output was filtered and the test name was lost — a small process miss
  worth not repeating. A.10 touched only iOS Info.plist and Swift, neither of which the web e2e loads.

### Wave A after-scan → the queue

**Wave B takes the active slot, and B.0 is a before-scan of the whole wave** — the same treatment that
paid on every Wave A item it was applied to. Ordered so the likeliest-already-built (B2) is verified
first and the largest (B1) comes after the cheap win (B3) has shipped. [D2] is settled, so B4 is
unblocked; its first move is `planSelectors.ts:136`, the one reader with no `?? isPaidThisCycle`
fallback.

### Session close 2026-08-11 (second session) — Wave A closed, Wave B queued

**Shipped:** A.6 → A.10, then the wave-level after-scan. **8 commits**, `72c790d` … `f002df2`.
Gate **158/158 + tsc clean on both trees** at every commit; every fix has a failing-then-passing test
verified by reverting **only the source** (`git stash` takes the test with it and proves nothing — that
mistake was made once and caught).

**The wave's result, stated plainly:** of 14 ledger items, **5 did not exist and 4 more were materially
misdescribed.** The before-scan catches the first kind; only building catches the second. Written up
above under "3.7 Wave A — CLOSED", and now in `CLAUDE.md` so it survives the session.

**The find worth remembering:** the gate had **never run `tsc`**, and `packages/core` — the money engine
— had been unchecked since `validate:release:legacy` was retired on 2026-07-24. Two commits from *this
session* shipped green carrying real type errors before it was noticed. Both typechecks now run first.

**Also this session:** `CLAUDE.md` was one line (`@AGENTS.md`, five lines of Next.js boilerplate about
the tree 5.5.1 deletes). A fresh session opening this repo was pointed at Next docs and nothing else. It
now carries the reading order, the gate, the environment quirks that cost real time, and the two rules
the engine keeps re-teaching.

**State on close:** tree clean, `v1.7-dev` pushed, no stray dev servers (:4319 / :8081 / Metro all clear).

**⏭ Next session starts at 3.7 Wave B, step B.0** — a before-scan of the whole wave, decomposed in the
plan. B1–B4 are from the same 2026-07-30 pass that produced the 5-of-14 miss rate, so every one is a
hypothesis. **B2 is the prime candidate to close outright**: it describes streak/milestone surfacing as
*dropped*, while `pendingMilestone` and `activeAck` both exist today.

**Still device-owed:** **A0.4** (payoff-schedule re-verify) and **A8.4**. ⚠️ A8.4 now carries the
load-bearing check — that `\(.applicationName)` renders "Debt Planner" and **not** `expo.name`'s
"Debt Planner (RN)". Nothing off-device can settle it, and if Shortcuts shows "(RN)", A8 is not done.

**⏸ Still waiting on Jason:** cut the CodeMagic build (the device build `c050173`/3.6.1 is stale by a
whole phase) · 3.5.7's hosting + privacy specifics · the transient `$790` Guardian flash on Today.

### Session close 2026-08-11 (third session) — Wave B closed, and with it Phase 3.7

**Shipped:** B.0 → B.4, then the wave-level after-scan. **5 commits**, `1881d39` … `5ffad33`.
Gate **158 → 167**, tsc clean on both trees at every commit, zero `error-context.md`.

**The wave in one line:** of 4 ledger items, **1 was refuted outright, 1 was already half shipped, 1 was
wrong in 3 of its 4 stated premises, and 1 was clean** — plus **3 defects that were on no ledger at all**
(the vanishing paid row's `autopayFailedThisCycle` sibling, an `aria-hidden-focus` violation in B.4's own
first draft, and `ListRow`'s always-announced destructive Delete).

**The find worth carrying:** ⚡ **the same failure mode applies to claims written THIS session.** B.1a was
authored, tested and nearly shipped before measurement refuted it; B.4's "re-rendering resets the pan" was
a confident inference from a failure whose real cause (viewport-relative CDP coordinates) was somewhere
else entirely. Both were caught by checking the mechanism rather than the symptom. **A claim's age is not
what makes it wrong** — now in `CLAUDE.md` so it survives the session.

**⚠️ Everything this wave shipped is Today/Progress UI verified against a WEB-ONLY suite**, because the
Maestro native lane has been RED since 2026-08-10. That is why **4.1 takes the active slot** rather than
3.5.7 — it is decomposed 4.1.3 → 4.1.11 at the top of the plan.

**Also recorded:** the `tutorial-invite › the tabs are held while a session is running` intermittent
**recurred** (CI 2026-08-10, local 2026-08-11). Both times the session had ended when the test expected it
running; both times a spec-only re-run passed 33/33. It is timing, not state, and it now has two data
points instead of one.

**State on close:** tree clean, `v1.7-dev`, no stray dev servers (:4319 / :8081 / :8082 / :19000-19006 all
free). **⏭ Next session starts at 4.1.3** — pull the failing run's artifact **before** theorising.

**⏸ Still waiting on Jason:** cut the CodeMagic build (the device build `c050173`/3.6.1 is now stale by
**two** phases) · 3.5.7's hosting + privacy specifics · the transient `$790` Guardian flash on Today.

## 3.7 Wave B · B.0 — the wave before-scan — COMPLETE (2026-08-11)

Every B item read against the current code before anything was built, the treatment that paid on
Wave A. **Result: 1 of 4 survives as written.** One is refuted, one is half-shipped, one is real but
mis-sequenced, and one is real with **three of its four stated premises wrong**. Sources traced:
B1/B2/B3 are `DEBT_PHASE3_ENHANCEMENT_AUDIT_2026-07-27.md:68` (3-F · F10.3 · F10.1); B4 is the
3.4.4 swipe-delete after-scan (log line ~315).

### B1 — drag-the-curve What-If → **REFUTED, on two independent grounds**

The 2026-07-30 premise was: *"collapsed behind a toggle is exactly the hidden-affordance shape this
item exists for."* Both halves of that fail today.

- ⛔ **It is not a hidden affordance.** `TrajectoryChart.tsx:465-475` is a full-width `Pressable` row
  reading **"What if you paid extra?"** in plain language, with a chevron, `accessibilityRole="button"`
  and `accessibilityState={{ expanded }}`. That is a labelled disclosure, not a hidden one.
- ⛔ **The gesture is already taken, and the item never knew it.** §3.4.1 shipped scrub-on-drag —
  horizontal drag on the trajectory reads a date at that point (`trajectory-interactivity.spec.ts:24`,
  both themes). "Drag the curve to bend it" would need the same axis on the same Skia surface. Building
  it means a mode switch or stealing a shipped gesture.
- ⚡ **And the outcome it wanted already exists.** `WhatIfControls.tsx` is no longer a slider in a
  drawer: the amount is a **directly editable** numeric field (uncapped by design — "nobody can know
  what a given person can afford"), the slider max **adapts** to what is typed, and either input bends
  the dashed green overlay live. Direct manipulation of the number, without the gesture collision.

**Verdict: closed as refuted.** The delta between "drag the curve" and what ships is a gesture, not a
capability, and the gesture is occupied.

### B2 — dropped streak/milestone surfacing → **HALF ALREADY SHIPPED**

- ✅ **Milestone: built.** `MilestoneAckCard` on Today gated through the ack coordinator
  (`index.tsx:453`), the ring pulse on Progress (`progress.tsx:161`, `pulseThreshold`), dedup + the
  100%-excluded rule covered by `milestoneCross.test.ts`. Nothing to port.
- ⛔ **Streak: genuinely absent.** `packages/core/debt/computeStreak.ts` exists, is tested
  (`testComputeStreak.ts`), and has **zero importers in `apps/rn`** — the only consumer is the legacy
  Capacitor tree (`app/page.tsx:283`, surfaced at `:1175` as a 🔥 flame + count stat). It is dead code
  in the shipping app.
- ⚠️ **Two design constraints the item predates.** (1) The premium Guardian proof strip already shows
  **"Held your line · N paychecks"** (`GuardianProofStrip.tsx:21`) — a different claim (confirmed
  cushion reached target) than `computeStreak`'s (every required action met), but visually a second
  streak. (2) The legacy treatment is a flame counter, which is the gamification chrome the house
  restraint rules out. A port would carry both problems in.

### B3 — name → time-aware greeting → **REAL, wholly unbuilt, mis-sequenced**

No name is captured anywhere: onboarding is four steps (`Welcome` · `Paycheck` · `FirstDebtOrBill` ·
`Completion`), none asks; there is no `userName`/`firstName` on the store or in `Preferences`; Today's
header is the static `<Screen title="Today">`. Nothing to reuse — this is capture + persistence +
greeting from scratch.
⚠️ **`DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/02-bestinclass-coherence.md:55` deferred it explicitly
"waits on the wording audit"** — and the wording/voice gate runs **after** 3.7. Wave B schedules it
before its own gate. The mechanism can ship now; the strings are audit-owned.

### B4 — swipe-to-mark-paid → **the defect is real; 3 of 4 stated premises are wrong**

| the plan said | the code says |
|---|---|
| "`planSelectors.ts:136`" | ⛔ **:156.** :136 is `const isExpense = …`. The fallback-less reader is `.filter((d) => d.minimumPaidThisCycle && …)` at **:156** |
| "B4's swipe writes through `bulkMarkRequired`" | ⛔ **No.** Today's mark-paid is `handleMark` (`index.tsx:73`) → `markDebtMinimumPaid` / `markExpensePaid`. `bulkMarkRequired` is the **payday-checkpoint** path. The swipe would reuse `handleMark` — still not a third writer, but not that function |
| implied: mark-paid needs the swipe | ⛔ **The row already has a one-tap.** `RequiredActionsCard.tsx:209` renders a `CheckCircle` on every non-autopay required row. The swipe is a **second** affordance for an action that already takes one tap — and legacy was the same (`components/RequiredActionItem.tsx:36`: "Mark-Paid pill **+** swipe") |
| "the one reader with no `?? isPaidThisCycle` fallback" | ✅ **Confirmed, and it bites.** Every other reader has it: `allocatePaycheck.ts:279/298/315`, `deriveRequiredActionView.ts:76`, `applyRolloverPayment.ts:41`, `reconcileAutopay.ts:52`, `recoverySelectors.ts:46`, `getDebtsWithDisplayBalances.ts:26` |

**The live defect, stated precisely.** `minimumPaidThisCycle?` is **optional** (`debtPlannerStorage.ts:67`).
For a debt carrying only `isPaidThisCycle: true`, the allocator *drops* the row (`:279` fallback) and
`planSelectors.ts:156` *declines to re-add it* — so the paid row **vanishes from Today** instead of
showing struck-through and undo-able, which is the exact behaviour the block at `:151-158` exists to
guarantee. ⚡ **The affected population is the Phase-5 migration**, where v1.6 data predates the field.

⚠️ **New find, from the same dig — a stale header of the Wave-A class.** `bulkMarkRequired.ts:3-9`
claims it uses "the SAME paid-state semantics as the Plan tab's per-item toggles (so the two surfaces
can never drift)" — they have drifted. The payday path sets `minimumPaidThisCycle: true` **and**
`isPaidThisCycle: true` (`:36-37`, `:82-83`); `markDebtMinimumPaid` (`store.ts:421`) sets only the
former. Under [D2] that makes the payday path assert **paid in full** on a debt where only the minimum
was covered. **Latent, not live** — measured: no debt reader keys on `isPaidThisCycle` alone today, so
nothing currently mis-reads it. But it is a comment asserting an invariant that the code stopped
holding, which is precisely what manufactured A3.7's inverted item.

## 3.7 Wave B · B.1 — the paid-state readers agree — COMPLETE (2026-08-11)

**Shipped three fixes, all one family: a rule about "is this required item paid" re-derived at each
call site instead of owned once.** Gate 158/158 + tsc clean, 12 new asserts across
`planSelectors.test.ts` (new, wired into `runAppTests`) and `storeActions.test.ts`.

**① `planSelectors.ts:156` — the vanishing paid row.** Added `?? isPaidThisCycle`, matching every other
reader (`allocatePaycheck:279/298/315` · `deriveRequiredActionView:76` · `applyRolloverPayment:41` ·
`reconcileAutopay:52` · `recoverySelectors:46` · `getDebtsWithDisplayBalances:26`). `minimumPaidThisCycle`
is **optional**, so for a debt carrying only `isPaidThisCycle` the allocator dropped the row and this
re-add declined to restore it — the paid row disappeared from Today instead of striking through, which is
the one thing that block exists to prevent. Test fails on the legacy shape before the fix, passes after.

**② Both Today toggles now clear `autopayFailedThisCycle`.** Found while checking ①: core has always
cleared it on mark-paid ("an item the user is now confirming paid is no longer a reported failure") and
**nothing else clears it** — not the rollover. `markDebtMinimumPaid`/`markExpensePaid` did not, so a user
whose autopay failed and who then confirmed it on Today kept a struck-through row still showing
**"Overdue"** (`showOverdue` reads `view.autopayFailed`), and — worse — the item **advanced to the next
occurrence carrying the flag**, permanently blocking `isAutopayPresumedPaid`. It reappeared as a manual
to-do every cycle, for good. Un-marking deliberately does **not** re-flag: reporting a failed autopay is
the payday checkpoint's job, not an undo's.

**③ The stale header, corrected in place.** `bulkMarkRequired.ts` claimed its writes used "the SAME
paid-state semantics as the Plan tab's per-item toggles (so the two surfaces can never drift)". They have
drifted — the RN toggle sets `minimumPaidThisCycle` only, because [D2] reserves `isPaidThisCycle` for paid
**in full**. ⚠️ Verified the direction before touching anything: legacy's `useDebts.ts:144` sets **both**,
so the comment was true when written and the RN store is what narrowed — correctly. The core divergence is
**inert** (measured: no debt reader in either tree keys on `isPaidThisCycle` alone) and pinned by
`testMarksDebtMinimumsBothFlags`, so it is filed, not flipped → **Phase-6 financial-correctness gate**.

## 3.7 Wave B · B.2 — B3, the name and the greeting — COMPLETE (2026-08-11)

**[D26]: the mechanism ships now, the strings belong to the wording gate.** Gate **161/161** (was 158)
+ tsc clean, 25 app-layer asserts + 3 e2e.

- **`prefs.displayName?: string`** — optional, so an existing blob migrates by *not having the key*. Same
  additive rationale the `analyticsOptOut?` comment already sets out; no `CURRENT_STORE_VERSION` bump.
- **`store/greeting.ts` — pure.** `selectGreeting(name, hour)` + `greetingBand(hour)` +
  `normalizeDisplayName`. The **hour is a parameter**: the single `new Date().getHours()` lives at the
  render edge in Today, so every band boundary is unit-testable and no module needs mocking.
  Bands: morning 05–11 · afternoon 12–16 · evening 17–04. Normalisation collapses interior whitespace and
  returns `undefined` for empty, so **"cleared it" and "never set it" are one state** — no reader handles both.
- **Capture in two places, because one would not work.** Optional field at onboarding's finish (committed
  on the CTA, not per keystroke — a persisted write per character for a value only the header reads), and
  editable/clearable in **More → Preferences** (committed on blur, same reason). A name settable only by
  digging into More would never be set; a name that could not be changed would be a defect.
- **The sandbox carries it, exactly like `themeMode`.** `seedSandbox` already copies one pref on the test
  "is this about the person or about the money" — appearance passes, `debtFreeSoundEnabled` deliberately
  does not. `displayName` passes the same test. Without it the walkthrough (which runs over the REAL Today)
  would drop the user's name at beat 1 and hand it back at the end, reading as a glitch.
- **Determinism, deliberately.** The e2e pins the clock with **`clock.setFixedTime`, never `clock.install`**
  — install fakes the timer queue and the Motion/CountUp layer would sit unrendered. `explore-demo.shot.ts`
  is pinned the same way: Today's frame is now time-of-day dependent, and an unpinned reference capture that
  changes for reasons that are not app changes is how the root `tests/visual` set masked a theme defect.
  ⚠️ `helpers/seed.ts` already carried a scar about exactly this class (nine specs queued to fail overnight).

**Three things the after-scan caught that the before-scan could not:**
1. **`useAppStore` resolves to the ACTIVE store, not the real one.** My first comment claimed it read real
   prefs — false, and it would have been a lie sitting next to the code. Corrected, and it is what led to
   the `seedSandbox` carry-over being the right fix rather than reaching for the singleton.
2. **Onboarding already has a testID convention** — `field-onboarding-name` / `field-paycheck-amount`, i.e.
   `field-<context>-<thing>`. My first pass used the same bare `field-display-name` on **both** screens;
   renamed to `field-onboarding-display-name` / `field-preferences-display-name`, which also removes a
   duplicate id across two surfaces before any flow had to disambiguate it.
3. **`TextField` gained `maxLength` / `autoCapitalize` / `onBlur`** (all optional, no call site changed).
   Capping at the input rather than on save matters: a value silently truncated on write reads as data loss.

## 3.7 Wave B · B.3 — B2, the on-plan streak — COMPLETE (2026-08-11)

**[D27]: the streak half only.** Milestone surfacing was already shipped (B.0 established that), and
`computeStreak` had been sitting in `packages/core` with **zero RN importers** since the migration — live
only in the Capacitor tree, where it rendered as a 🔥 flame and a count. Gate **164/164** + tsc clean.

- **`selectOnPlanStreakLabel(store)`** in `planSelectors.ts` — the raw count plus the display rule, so the
  rule is testable rather than living in JSX.
- **On PROGRESS, not Today.** [D27]'s constraint is satisfied structurally, not by a conditional: the
  premium `GuardianProofStrip` ("Held your line · N paychecks") renders inside `PaydayGuardianCard` on
  **Today**, and this renders in the Progress hero's meta column. They state different things — "you did
  everything you could afford" vs "your confirmed cushion held" — but two streaks on one screen read as
  one feature said twice.
- **A caption, not chrome.** Same `textStyles.caption` and colour as the "Next milestone: 50%" line beside
  it. The port that mattered was the read; the badge was the part worth leaving behind.
- **⚡ The floor is the honesty rule.** `ON_PLAN_STREAK_MIN = 2`: at 1 the line fires the first time anyone
  finishes a cycle, celebrating the ordinary. It also does something better than restraint — **it makes the
  claim unreachable on a day-one demo by construction.** `SANDBOX_MAX_HISTORY` clamps a sandbox to ONE
  cycle of history, so no number of scripted rollovers can reach a floor of 2. Pinned as **Channel 2b** in
  `sandboxStore.test.ts`, beside the existing proof-of-work channel — the free streak is the same class of
  claim on a different screen and deserved the same guarantee.
- **Legacy snapshots pinned too.** `isCycleOnPlan` defaults a snapshot with no `allRequiredMet` to on-plan
  (so a later fix never retroactively zeroes a real streak). The display rule now depends on that default,
  so it is asserted here rather than left implicit two files away.

**After-scan → one ledger correction, made atomically:** Wave C7's dead-code list named `computeStreak` as
a deletion candidate *"if [D27] cuts it"*. [D27] ported it instead, so it now has a live reader — it came
off that list in the same edit that marked B.3 done, rather than surviving as a stale instruction to delete
working code.

## 3.7 Wave B · B.4 — swipe-to-mark-paid — COMPLETE (2026-08-11)

**[D28]: an accelerator, never a second way in.** The `CheckCircle` is untouched and remains the
accessible path — the legacy app shipped a Mark-Paid pill *and* a swipe for the same reason. Gate
**167/167** + tsc clean, 3 e2e.

- **One predicate drives both affordances.** `canMark = !(isAutopay && !view.autopayFailed)` gates the
  checkbox AND the swipe, so a row the user cannot mark by hand cannot be swiped either. The alternative —
  repeating the branch — is how the two would come to disagree about who owns a row.
- **One write path, haptic included.** `checkOffHaptic` was extracted from `CheckCircle` and is now shared,
  rather than the "success on check, light on undo" rule being re-derived in the swipe handler. Wave A's
  lesson applied prospectively: agreeing copies are still copies.
- **No confirm**, unlike swipe-to-delete — this is reversible by the same gesture, and the action's own
  label flips to **Undo**.
- **`ListRow`'s swipe was NOT reusable**, contrary to the plan's wording: it is welded to `confirmDelete`
  and the iOS `RowContextMenu`. The *pattern* transferred (`ReanimatedSwipeable` · `overshootRight={false}`
  · `rightThreshold={40}` · an `overflow: hidden` container); the component did not.

### ⚡ B.4 found a live a11y defect — in its own first draft, and one in `ListRow`

`ReanimatedSwipeable` **mounts the action pane whether or not the row is open** (that is how the reveal
animates). Left unguarded that puts a second control for the same action in the accessibility tree of
every row, permanently: VoiceOver announces each bill twice and offers a control nobody can see.

Getting it right took three passes, and each failure taught something worth keeping:
1. **`aria-hidden` alone is not enough.** `a11y-axe` failed with **`aria-hidden-focus`** — react-native-web
   gives every enabled `Pressable` `tabIndex=0`, so the pane was hidden from the reader *and reachable by
   Tab*, which is worse than either alone because it announces nothing when focused.
2. **`focusable={false}` does not clear that tabIndex** (measured, not assumed).
3. **`inert` closes both — and kills pointer events**, so a permanently-inert action is dead to the very
   gesture it exists for. Native is unaffected (`useInert` no-ops off web), but **3.5.7's embed ships this
   build**, so "web only" is not "nobody".

**Final shape:** the pane is `aria-hidden` + `inert` while CLOSED and released on open, via a real
component (`SwipeMarkAction`) because `renderRightActions` is a render callback and hooks cannot live there.

⚠️ **The same shape exists in `ListRow` and was left alone** — its Delete pane is always announced, once
per row, and it is *destructive*. Filed to the premium-accessibility sub-audit rather than fixed blind.

### ⚠️ Two corrections I had to make to my own reasoning, mid-item

- **"Re-rendering resets the pan, so the row snaps shut."** I inferred that from a failing test and
  designed around it. **It was wrong.** The real cause was that **CDP touch coordinates are
  viewport-relative** and Required Actions sits ~1588px down an 874px viewport — the touch landed on
  nothing, the gesture never activated, and the symptom ("the checkbox intercepts pointer events") read
  exactly like a z-order bug. `scrollIntoViewIfNeeded` fixed it, the state-based a11y gate works fine, and
  §3.4.4's swipe-to-delete had only ever escaped this because its row is near the top of /money.
- **The a11y test passed for the wrong reason once.** `{...a11yHidden}` spreads the *function* — no props.
  The assertion still went green because I had also removed the accessible name, so a name-filtered query
  found nothing. `a11yHidden(true)`. **A green assertion is not evidence until you know which failure it
  would have caught.**

## 3.7 Wave B — WAVE-LEVEL after-scan (2026-08-11)

**The wave's result:** 4 ledger items → **1 refuted**, **1 already half-shipped**, **1 wrong in 3 of its 4
premises**, **1 clean**. Plus 3 defects that were never on any ledger (the vanishing paid row's sibling
`autopayFailedThisCycle` leak, the `aria-hidden-focus` violation, `ListRow`'s always-announced Delete).
Gate **158 → 167**.

**① The pattern across both waves, stated once:** *the ledger is reliable about WHERE to look and
unreliable about WHAT is there.* Every Wave-B item pointed at real code; three of four described it wrong.
B.0 caught the stale half in an hour; the misdescribed half only fell out of writing the fix — which is
`preauthored-items-fail-two-ways`, now measured twice.

**② The failure mode is not limited to pre-authored items — it is mine too.** B.1a was authored, tested and
nearly shipped **this session** before measurement refuted it, and the "re-render resets the pan" claim in
B.4 was a confident inference from a misread failure. Both were caught the same way: by checking the
mechanism instead of the symptom. **A claim's age is not what makes it wrong.**

**③ Three surfaces gained a rule that keeps a claim honest by CONSTRUCTION rather than by care** — worth
naming because it is now a repeatable move:
- B.3's streak floor of 2 makes the claim unreachable on a day-one demo, because the sandbox clamps history
  to 1. No flag, no conditional, nothing to forget.
- B.4's single `canMark` predicate makes the swipe and the checkbox unable to disagree.
- B.2's `normalizeDisplayName` makes "cleared" and "never set" one state, so no reader handles both.

**④ Wording debt is accumulating in ONE place, deliberately.** B.2's greeting strings and B.3's streak
caption are both new user-facing copy shipped under [D26]/[D27] with the strings explicitly deferred to the
wording/voice gate. That gate now owns them, and it is captured there — not left as a comment in a
component nobody re-reads.

**⑤ The lane the wave did NOT touch:** every one of these is Today/Progress UI, and the **Maestro native
lane has been RED since 2026-08-10**. Four items shipped against a web-only suite. That is precisely what
4.1 exists to fix, which is why it takes the active slot rather than 3.5.7.

### ⛔ B.1a — REFUTED by measurement, after the test was already written

The after-scan surfaced what looked like a fourth defect: `autopayFailedThisCycle` is named per-cycle,
and the rollover never clears it. A failing test was written asserting the boundary should clear it.
**It was wrong, and the code was right.** A still-**unpaid** failed autopay must carry its flag forward —
that is the only thing stopping the next `reconcileAutopayForRollover` from silently presuming a bill the
user *told us never ran* had been paid. Clearing it re-opens the inverse of the root-cause bug
`reconcileAutopay` was built to fix. The flag rides the **occurrence**, not the cycle; the genuine leak was
the paid path, closed at source by ②.
⚡ **The test was kept, inverted** — it now pins the persistence *and* proves ② propagates across the
boundary (a confirmed bill advances clean), so the assertion **depends on** the fix rather than merely
surviving it.
⚠️ **The lesson is the one Wave A taught, applied to my own work:** a name asserting a scope (`…ThisCycle`)
is a claim, and claims get measured. Two of the three real fixes here came from checking a comment against
its code; the one item that came from *trusting* a name was the false one.

### Two ledger corrections this scan forces

- **[D1]'s revisit trigger is already spent.** It stands on *"revisit the moment a genuine one-tap
  emerges — B4 is the likeliest source."* B4 creates no new one-tap; the `CheckCircle` has been that
  one-tap since the card shipped. [D1] stays deferred on its stated reason (no control-shaped job),
  now with the trigger closed rather than pending.
- **The Wave-A rate held.** 14 items → 5 absent + 4 misdescribed. Wave B: 4 items → 1 refuted, 1
  half-shipped, 1 misdescribed in 3 of 4 premises, 1 clean. Both authoring passes are 2026-07-27/30.
  The before-scan is now paid for twice.

---

## 4.1.3 cycle 2 — the artifact was pulled first, and it refuted both of the ledger's "known fixes" (2026-08-12)

**Method: the run's own artifacts before any theory** — `gh run download 31516616133 -n maestro-report`,
then the per-flow `commands.json`, `screen-hierarchy/*.json`, `logs/device-xctest.log` and the failure
screenshots. Both of the two moves the plan carried forward were wrong, and neither failure was where the
verdict table pointed.

### ① Flow 01 — a DRIVER stall, not the app, not the selector

`device-xctest.log` times it exactly. The assertion ran 17:41:17.876 → 17:42:07.077 on a `timeout: 20000`,
and inside that window the driver made **one** `/viewHierarchy` call: 17:41:18.828 → **17:42:01.550 —
42.7 seconds**. Maestro checks elapsed time *between* polls, so the budget was already spent when the
first sample returned and **the sample was never evaluated**. Every later snapshot in the same run took
60–120 ms.

The app was fine the whole time: the failure screenshot (0.4 s later) shows the screen rendered, and the
failure hierarchy carries `"Will you make it to payday?"` verbatim. ⚠️ **It is a flake, not a constant** —
the same first snapshot took 10 s in run 31514348038. First-hierarchy-of-the-run cost is the thing that
varies. Fix: that one wait is now **180 s**, with the measurement in the file so it is not trimmed back.

### ② Flow 07 — ⛔ THE OPPOSITE OF WHAT THE LEDGER RECORDED

The plan read: *"⚡ `inputText` + the `field-*` testIDs WORK and `hideKeyboard` was never needed (flow 07
walked onboarding **and** the debt form)."* The dump says otherwise. `field-onboarding-name` holds

> **`"Visa Test240065"`**

— the name, the balance and the minimum **concatenated into one field**. The balance and minimum taps
never moved focus; all three `inputText`s went to the name.

**The mechanism, from the frames.** `OnboardingLayout` is a `KeyboardAvoidingView` (behavior=padding)
holding a ScrollView above a **sticky CTA stack**. Keyboard up → the container shrinks → the ScrollView's
viewport ends at the CTA stack (~y450 pt) → `field-onboarding-balance` is clipped out of it. But XCUITest
still reports its frame — **`[20,474][419,526]`, directly under "Add & Continue" `[20,457][420,509]`** — so
`tapOn` finds the element, taps its coordinates, and hits the button.

`"See My Plan  →"` is **not** a defect: the selector is byte-identical to `CompletionStep.tsx:39` (two
spaces + U+2192, confirmed with `cat -A`). The flow never reached that screen. It was ledgered as a known
fix because it was the step the run *stopped* at.

### ③ Why the earlier reading went wrong — and it is this lane's recurring shape

**A flow reaching a later step was read as proof the earlier steps worked.** `tapOn` and `inputText`
report COMPLETED whether or not they land — the same lying-step that already cost a cycle at
`field-paycheck-amount`. And the `hideKeyboard` deletion note generalised a comment about **one** element
to **another**: `OnboardingLayout.tsx:23` says the KAV keeps the keyboard off the **CTAs**; it says nothing
about the fields, and the fields are what broke. *(The deletion itself was right — run 31514348038 has the
driver's words: "Couldn't hide the keyboard … doesn't expose a standard dismiss action." It cannot be
restored.)* ⚡ **Flow 04 already carried this exact lesson in a comment** — *"a visibility assertion here
would pass on the clipped element"* — and it was never generalised past that one file.

### The repair

- **The swipe.** After the name, one `swipe: start "50%, 40%" → end "50%, 18%"` bottoms the form out
  inside the shrunken viewport, clearing all remaining fields of the CTA stack. Percentages, so the iPad
  lane inherits it; the ScrollView clamps at its content end, and these fields *are* the end of the step.
  ⚡ **Proven syntax, not assumed:** flow 04 already uses `swipe: start/end` and failed at *runtime*
  (`tab-money`) in this run — Maestro validates a whole file before executing it, so the file parsed.
  ⛔ `scrollUntilVisible` was rejected: Maestro judges visibility against **screen** bounds, and a clipped
  element with an on-screen frame reads as 100 % visible, so it would no-op.
- **Write-verification.** Each form now asserts the typed text is in the field it was aimed at.
  ⛔ **Anchored — `^Visa$`, not `Visa`.** Maestro's text match is **contains**, proven by this run:
  `"Will you make it to payday?"` matched, which full-match semantics forbid (the trailing `?` is a
  quantifier). Unanchored, the guard matches the corrupt `"Visa Test240065"` and tests nothing. The NAME
  field is the sentinel — it is where every mis-aimed `inputText` accumulates — and it is the one value
  confirmed unformatted in the dump.
- **`FormSheet` gets assertions but NO swipe.** It has the same ScrollView-above-a-sticky-footer shape, so
  the same defect is plausible — but it is **unmeasured**, and a swipe inside a modal with a
  swipe-to-dismiss gesture is a guess. The assertions name it at the right step if it is there, and the
  geometry then comes from that run's dump.

### After-scan

- ⚠️ **A user-facing UX defect, not just a test problem.** With the keyboard up on a small screen a real
  person also cannot see the balance / minimum / APR fields on the onboarding debt step — they must scroll,
  unprompted, on the app's first data-entry screen. RN's usual remedy (`automaticallyAdjustKeyboardInsets`,
  or scrolling the focused input into view) is absent, and the KAV's own comment shows the CTA was the only
  case considered. → **the audit gate** (best-in-class / first-run), with the device pass to judge severity.
- ⚡ **4.1.4's selector guard earns a second job.** It was scoped to "every text selector exists in app
  source". This run proves a selector can exist, resolve, tap, report COMPLETED **and do nothing**. The
  guard should also flag any flow that `inputText`s without a write-verification on the target field.
- ⚠️ **Unverifiable locally.** There is no Mac here, so the repair is verified only by the next dispatch.
  YAML parse-checked against `js-yaml` for all 8 flows + 5 probes; the semantics are argued from the dump.

## 4.1.3a — the built-`.app` cache, and the safeguards are the item (2026-08-12)

🎯 Jason: *"Is there anything that we can do to speed up the 'Build for the iOS simulator' step?"*

**Measured first, from run `31516616133`.** Build = **15m36s of a 31m47s job**; with prebuild (57s) and
pod install (30s) the skippable block is **17m03s**. The rest: boot/install/launch 3m08s · Maestro install
1m29s · npm 1m13s · flows 7m30s.

⚡ **What the build actually spends itself on: other people's pods.** Of ~650 `CompileC` tasks —

| target | tasks | | target | tasks |
|---|---|---|---|---|
| RNScreens | 103 | | MMKVCore | 33 |
| RNReanimated | 103 | | react-native-skia | 27 |
| RNSVG | 94 | | RNGestureHandler / RNSentry / ios-utilities | 25 each |
| ReactCodegen | 57 | | NitroModules | 21 |
| RNWorklets | 44 | | | |

The app's own native code does not reach the top 15. **All of it is invariant until `package-lock.json`
moves** — while the 4.1.4→4.1.11 loop edits `.maestro/**` YAML against an unchanged app.

### The before-scan killed the obvious answer

The workflow already carries it: **ccache was tried and removed 2026-07-28** — RN's wiring set a
compiler-launcher path that did not resolve for the widget-extension target (`@bacons/apple-targets`,
in the app project rather than Pods), failing the `DebtWidget` link with *"unable to spawn
ccache-clang.sh"*, and it conflicted with Xcode 26's explicit modules. ⚡ **The idea I was about to
recommend as the follow-up was already-answered work with a documented mechanism.** Also recorded there,
and worth keeping in view: *"this is the FREE unlimited pipeline, so wall-clock isn't a $ cost"* — the
case for caching is **turnaround**, not money.

### ⛔ The hazard IS the design

A stale `.app` silently reused after app code changed is a suite passing against the wrong binary — this
lane's signature failure, already shipped twice (a green Maestro run that wrote no screenshots; a suite
green because it never ran). Four rules, and they are the deliverable:

1. **The key hashes every input that reaches the binary** — `package-lock.json` (both trees) · `app.json`
   · `package.json` · `index.js` · `metro.config.js` · `babel.config.js` · `src/**` · `plugins/**`
   *(prebuild config plugins)* · `assets/**` · `targets/**` *(the widget)* · `packages/core/**` *(the
   `@core` alias is bundled)* · **and this workflow file, because the build flags live in it.** Every path
   was checked to exist — a typo contributes nothing to `hashFiles` **silently**.
2. **No `restore-keys`.** A partial-key fallback is precisely how a stale binary gets in. Exact or nothing.
3. **Provenance printed on EVERY run** — hit or miss, cached or fresh: source, cache-hit, the key, HEAD,
   and the commit the bytes were built at, copied into `maestro-debug/` so it outlives the log.
4. **Tags never use it**, and a `rebuild` dispatch input forces a clean build — "I don't trust that
   binary" needs a one-click answer that isn't editing the workflow.

⚡ **The first draft of ③ was circular and would have proved nothing.** It diffed the build-commit against
HEAD *filtered to the hashed paths* — the same list the key uses, so it could only ever agree with itself
and could never surface a **forgotten** path. It now prints **every** changed file, unfiltered, with the
instruction to look for anything that plausibly reaches the binary. That is the check that can actually
catch the key being wrong.

Two more guards fell out of building it:
- **A corrupt hit falls through to a full build.** `-x` on the binary + `plutil -lint` on the Info.plist;
  on failure the directory is deleted and the build runs. This is not hypothetical — cache round-trips
  through tar, and a lost executable bit would otherwise reach `simctl install` and fail as something else.
- **`fetch-depth: 0`.** The default depth-1 checkout cannot diff against the build commit, which would
  leave ③ printing "(cannot diff)" forever — *worse* than absent, because it still looks like a check.

### Also folded in — two free flags, both measured

`DEBUG_INFORMATION_FORMAT=dwarf` (the log runs **4 `GenerateDSYMFile` tasks**; nothing in this lane reads
a dSYM — symbolication is the signed Codemagic build's job) and `COMPILER_INDEX_STORE_ENABLE=NO`
(index-while-building serves an IDE, and there isn't one). These help the cache-MISS path, which the
cache by definition cannot.

### After-scan

- ⚠️ **Scope corrected mid-build.** The first draft cached the whole `Release-iphonesimulator` products
  directory — every pod's build output, plausibly GBs, against a 10 GB repo cache ceiling and an upload
  cost that eats the win. Narrowed to the `.app` plus a provenance sidecar: the only thing `simctl
  install` needs. The run now prints `du -sh` of the bundle so the trade stays visible instead of assumed.
- ⚠️ **Unverified.** No macOS here; the first dispatch after this lands is the test, and its FIRST run is a
  guaranteed miss (it populates the cache) — the saving shows on the second.
- ⚡ **The npm install (1m13s) and Maestro install (1m29s) still run on a cache hit.** npm has to: the
  typecheck fail-fast needs `node_modules`, and that gate is worth keeping. `~/.maestro` is cacheable and
  is the next ~1m30s if turnaround still matters after this. → filed as tooling, not promoted.

## 4.1.3 VERIFIED, 4.1.3b, and the lane's first real find (2026-08-12 · run `31598337615`)

**0/8 → 5/8, and flow 01 is green** — the seed the whole suite runs on. Both 4.1.3 fixes are confirmed by
the thing they were aimed at: the swipe reached the covered fields, the 180 s wait held, and every
anchored write-verification passed.

⚡ **The half I deliberately left unmeasured came back negative, which is the point.** Flow 01's
`^Store Card$` / `^Car Loan$` assertions inside `FormSheet` **passed** — the modal sheet does *not* share
the onboarding step's covered-field defect. Asserting rather than patching on a resemblance was right: a
speculative swipe there would have been a fix with no defect under it.

### ⚡ The find — "Move to Debts" told users it had scanned something

Flow 07 walked to command **72** (from 26) and failed asserting `"Add a debt"`. It was not a test bug. The
screenshot shows the debt form, correctly prefilled from the Mortgage expense, headed **"Add from scan"**
and subtitled *"Review the scanned details, then add."* Nothing was scanned. The user tapped a hint saying
their expense looked like a debt.

**Mechanism, exactly:** `DebtSheet.tsx:222` keyed that copy on **`prefill` being truthy**. True by accident
— `prefill` had one producer, §2.8's scanner (`money.tsx:304`). **3.7.A10 added a second**
(`money.tsx:246`, the mis-file rescue) and the reclassify path inherited the scanner's words.

⛔ **This is the audit gate's proxy-gate shape, found in the wild:** copy asserting an **outcome**
("scanned details") gated on something that merely **correlated** with it. The fix needed no new prop —
`convertingExpenseId` was already passed and already drives `convertExpenseToDebt`. **The sheet knew; the
copy never asked.**

**Two stale claims travelled with it**, both the "docs that disagree with adjacent code manufacture
defects" class:
- `scan.spec.ts:27`: *"'Add from scan' mode + its subtitle are reachable **ONLY** through the
  scan→parse→prefill path."* **False since A10 — and the test stayed green the whole time.** ⚡ A green
  assertion on the correct path says nothing about who *else* can reach it.
- `DebtSheet.tsx:62`'s docblock still described `prefill` as scan-only. Both corrected.

**Regression guard put on the FAST lane, not the 30-minute one.** `misfiled-expense.spec.ts` covered the
conversion's **data** and never its **words** — which is how this shipped invisibly. It now asserts the
scan copy is **absent**; the negative is the load-bearing half, since the positive would still pass if the
scan copy came back alongside it. **Gate 167/167, tsc clean both trees.**

⚠️ The convert strings are **placeholders** → the wording/voice gate, per [D26]'s mechanism/strings split.

### 4.1.3b — the suite's order was never guaranteed

Measured from each flow's own start timestamp: `01 → 05 → 02 → 06 → 03 → 08 → 07 → 04`. Not filename
order. Maestro's docs **specify no ordering for a directory argument**, so the suite was depending on
unspecified behaviour, and four flow headers asserted *"Maestro runs flows in filename order"* as fact.

Both remaining failures are that, and nothing else:
- **04** ran **after** 07's `clearState: true` wiped the seed it asserts → no "Store Card".
- **08** ran **before** the same clear. Coach marks are offered **once ever**, so 02–06 had already
  consumed them; **07's clear is what resets the flags 08 needs.** That half was never written down.

⚡ **So every green this suite ever showed was order-luck.** Fixed by listing the eight flows explicitly in
`native-e2e.yml`; the four stale header claims are corrected in place.

⚠️ **ONE invocation, not a loop of eight** — the 42.7 s stall is a *first-snapshot-per-driver-session*
cost, so per-flow invocations would restart the driver and re-pay it every time, turning one flake into
eight. The trade is that Maestro documents no ordering guarantee for a multi-path argument either; the
artifact's start times are the check, and the workflow says so rather than assuming.

### After-scan

- ⚡ **The lane has now paid for itself.** It was promoted to carry 68 of 127 device checks; before running
  a single one of them to completion it found a user-facing honesty defect that **three green web specs and
  two audit passes did not**, because the defect was on a path they exercised for data and not for words.
- ⚠️ **`app-preview.yml` builds the same app and has neither the `.app` cache nor this ordering fix** →
  already filed with the composite-action extraction.

## [D30] — the iPad lane's shape, settled before 4.1.5 is built (2026-08-12)

🎯 Jason, looking ahead at 4.1.5: *"would it make sense to set up a separate Maestro script for iPad runs
instead of using the current one?"*

### The premise that decided it — checked, not assumed

`use-layout.ts` derives **`isExpanded` from WIDTH**, and it branches in **seven** places: `MasterDetail`,
`TwoColumn`, Today, Money, Progress, More, and the debt sheet's `inline` prop (`money.tsx:395`). A wide
iPad is therefore **not the same UI with bigger margins** — Money becomes master-detail and the sheet
renders **inline instead of as a modal**.

That rules out both of the tidy answers:

- ⛔ **One identical set won't do.** `02-sheet-native-tap.yaml` exists to prove a header button *inside a
  modal sheet's swipe-gesture area* is tappable — the bug found on the first device build. On iPad there
  is no modal, so the flow would go **green while testing nothing**. That is bucket-1-by-weakening, the
  named void condition of 4.1's own exit criterion.
- ⛔ **A duplicated `.maestro-ipad/` set is worse**, and this repo has priced it twice: the **two
  screenshot mechanisms**, where the root set's stale frames masked the sandbox theme defect, and Wave A's
  *"two places, one rule"* landing three times in one wave — *"agreeing copies are still copies, they just
  haven't diverged yet."* Eight duplicated flows on a rarely-run lane drift **invisibly**, which is the
  exact mechanism that left this suite green-by-never-running for two days.

### [D30] The shape — three tiers, one directory

| tier | contents |
|---|---|
| **shared** | testID-driven, device-agnostic — 01 (the seed) · 03 · 07 · 08 |
| **iPhone-only** | where the compact presentation IS the subject — 02's modal-sheet header button |
| **iPad-only** | no iPhone equivalent — §11.15's ring origin · §11.16 · §10's layout checks · §11.8's rotation · master-detail + two-column |

Device is a **workflow input** carrying its own explicit flow list — which composes directly with
4.1.3b, where the list already *is* the ordering contract.

⚡ **Most of 4.1.5 is ADDITIVE, not a fork.** Its four named items are all iPad-only checks needing new
flows regardless; splitting the existing eight is the smaller half of the item.

⚡ **4.1.3a pays for this.** The `.app` is device-agnostic and the cache key doesn't mention the device, so
two matrix jobs restore the **same binary** — the marginal cost of an iPad run is ~11 min of Maestro, not
another 17-min build. It moves "run both" from special-occasion to routine.

### ⚠️ Carried forward as a hypothesis, not a fact

Today's geometry is **iPhone-specific**: the swipe percentages come from a 440×956 viewport where the
keyboard covered the form. On iPad the keyboard takes proportionally less and the form may not need
scrolling at all — the swipe *should* clamp harmlessly, and "should" is the word that cost a cycle this
morning. **Read the first iPad run's hierarchy dump before believing any of it carried over.**

⚠️ **And the 68/26/33 split is NOT a fact** (🎯 Jason, same session: *"Do not treat the 33 never figure as
fact"*). It is an authored estimate of the same vintage as the ledger items that came apart in Waves A
and B. This repo has refuted that class of number repeatedly: `extendedWaitUntilVisible` was a documented
capability limit that turned out to be two misspellings of one command; **§11.15 went from "nothing
automated can hold" to a numeric frame-containment assertion in a day**; the iPad lane was filed as worth
**four** checks and measured at 68. **Bucket 3's reason must name a MEASUREMENT**, and anything filed
impossible before Appium lands (4.1.9) has to be re-asked after it. → re-derive the split at **4.1.11**.

## Run `31603811840` — 6/8, the order held, and both reds were mine to understand (2026-08-12)

**6/8, up from 5/8. Execution order was exactly `01→02→03→04→05→06→07→08`** — 4.1.3b confirmed, and 04
went green purely from it. The "Add from scan" fix is confirmed on device too: flow 07 walked *past* the
`"Add a debt"` assertion that failed the run before.

**4.1.3a's four safeguards all fired**: `cache-hit: false` (correct — the populating run), key computed,
`built_at_sha=7e6b056` stamped, save succeeded. ⚠️ **The next two dispatches were NOT cache tests** —
both touched `src/**` or the workflow, which are *in the key* by design. The hit path only runs when
nothing but `.maestro/**` changed.

### ⛔ Flow 07 — the assertion caught a real defect; I had guessed it was my own test bug

`tapOn: field-debt-apr` landed on the sticky **"Add debt"** button covering it and **submitted the form**.
The Mortgage was created at **$180,000 · 0% APR**, the `6.5` typed into a dismissed sheet, and the
assertion failed because there was no sheet left.

⚡ **So `FormSheet` HAS the covered-field defect, and my earlier "it does not" was an over-generalisation
from one field.** Flow 01's `field-debt-name` passes because NAME sits at the TOP, above the footer. I
took a fact about one element and applied it to the sheet — **the identical error I had criticised in the
`hideKeyboard` note that same morning**, where a comment about the CTAs was generalised to the fields.
Fixed with the same swipe. ⚡ The anchored write-verification, added the previous cycle, is what caught it.

### ⛔ Flow 08 — wrong TWICE, and only the source settled it

I said it failed because the directory order put it before 07's `clearState`. Order fixed; it failed
identically. The measured mechanism: `coachMarks.ts:86` refuses a mark already in `prefs.coachMarksSeen`
and `:92` **persists** it on show, while `money.tsx:259` fires this mark on **any** Money render with a
non-empty debts list. **07 spends the mark itself**, and no ordering can fix that — the flow that builds
the portfolio must visit the screen that spends it.

08 now resets through the app's own **"Show feature tips again"** (`more.tsx:164`) and asserts the
confirmation subtitle. ⚡ That is coverage, not a workaround: `more.tsx` says the affordance exists because
*"a mark is offered ONCE ever, so without a way back the whole discovery layer is a one-shot a user can
lose to a mis-tap"* — and **nothing tested it.**

⚠️ Also fixed: `MoreButton` gets an explicit `testID`. Maestro's text match is CONTAINS, so `"More"` would
also match *"More than the balance — this will clear it to $0."*

### The artifact was 322 MB, and 300 MB of it was one file per flow

`device-simulator.log` — Maestro's dump of the **entire simulator syslog**, 118 MB for flow 01 alone,
**never read once.** The app-filtered log is captured separately as `os-log.txt` and crashes have their
own step. Excluded from the upload: ~7 minutes of download per cycle → seconds. ⚡ **The diagnose loop is
what this lane's speed actually depends on** — the build cache saves 17 minutes once, this saves 7 every
time something goes red.

## Audit tooling T1 — the strings inventory ( [D31] ) (2026-08-12)

⚠️ **Documented late, and that is itself the miss.** 🎯 Jason: *"There should be no work completed that is
not documented."* The before-scan below was genuinely run before building; it simply was not written down
until after, which is the part that breaks — an unrecorded scan cannot be checked by anyone, including me.

### Before-scan

- **Existing tooling?** `scripts/check-*.ts` is an established convention (`check-comment-convention`,
  `check-native-a11y-props`, `check-rn-style-divergence`, `check-webkit-flex-controls`), run via `tsx` and
  wired into `lint:rn`. **Followed it rather than inventing a shape.**
- **i18n?** None. Every string is an inline literal — which is *why* the gate is expensive and why an
  extraction step is worth building at all.
- **Gate or report?** Report. It is the audit's INPUT, so it must not fail a build. → T2 files the
  gate-shaped half separately.
- **Verified every premise** rather than assuming: `typescript` resolves from the repo root (so the AST is
  available), 282 RN + 126 core source files (so a parse is cheap).

### After-scan — four failures, all one shape: **looking complete while not being**

1. **Double-count.** Node-valued props (`ctas={<Button label="…"/>}`) harvested nested strings the walker
   already visits independently. ⚡ **Over-reporting is as useless as under-reporting; it just fails in the
   direction that looks thorough.**
2. **⛔ A whole category missing.** `setError('Enter the current balance.')` — validation copy lives in
   function bodies, not JSX, and no rule could see it. **Found only by grepping the output for a message I
   had watched the app render in a screenshot an hour earlier.** Now: every string literal is either
   captured or excluded by a *stated* rule.
3. **Both test conventions leaked in** — `apps/rn`'s `*.test.ts` inside `src/`, and `packages/core`'s
   `testXxx.ts`, which is not a `.test.` file at all. ~1,600 assertion labels drowning the copy.
4. **Useless labels.** `array`/`expr`/`other` held 658 strings under three names nobody could judge.
   Origins now walk to the nearest *named* ancestor, so a string reads as `var:ISSUERS` or `key:detail`.

**Surfaced, and filed:** 210 cross-file duplicates → the wording gate's first task · 923 unclassified
(mostly analytics ids) → a classification pass · the duplicate sweep as a **gate** → **T2** · a scripted
proxy-gate sweep → **T3** · a surface inventory for cohesion → **T4**.

⚡ **What it found immediately:** Guardian copy in plain object keys — `key:detail`, `key:action`
(*"Funds before debt — pauses most of your extra debt payoff while you save."*) — nowhere near a
component, and invisible to any JSX-only scan.

⚠️ **Deliberate:** the generated `.md`/`.json` are **committed**, so a copy change shows up as a readable
diff in review. Exclusions are printed in the report rather than applied silently — "not copy" is a claim
that can be challenged, not an absence nobody can see.

## Audit tooling T3 — the proxy-gate sweep ( [D31] ) (2026-08-12)

### Before-scan

- **Is the premise real?** Measured before building: **164 copy-bearing ternaries** in `apps/rn/src`
  alone, and the samples are exactly the shape — `tipsReset ? … : …`,
  `isEdit ? … : convertingExpenseId ? … : prefill ? …`. Not a hypothetical pattern.
- **Can a script judge it?** ⛔ **No, and pretending otherwise would be the trap.** "Is this gate a proxy"
  is a semantic question about what the words *claim*. What a script can do is put the condition next to
  the copy it selects, turning *"read 400 files and notice"* into *"read 77 rows and ask one question"* —
  which is [D31]'s pattern exactly: **the script extracts, the expensive reader judges a short list.**
- **New script or extend T1?** ⚡ **Extend.** Same walker, same file set, and it needs T1's copy
  classification to tell a word from an id. A second script would re-derive both — the "two places, one
  rule" shape that hit three times in Wave A.
- **Existing tooling?** None of the four `scripts/check-*.ts` covers conditionals.

### After-scan

- ⚡ **Validated by reproducing the defect it was built from.** The row
  `DebtSheet.tsx:238 · prefill · "Add from scan" / "Add a debt"` is the 2026-08-12 live defect, as one
  line. An instrument that cannot re-find the thing that motivated it is not evidence of anything.
- **Nested chains decompose for free.** Branch collection stops at the next ternary, so
  `isEdit ? … : convertingExpenseId ? … : prefill ? …` yields **three** judgeable pairs rather than one
  unreadable blob. That mattered more than expected — the defect lived in the *third* link of a chain.
- ⚡ **The copy/machinery filter reuses T1's classification rather than inventing a second heuristic**
  (`102 of 179` gates dropped as machinery — ternaries over `"reserve-release"`, `"en-US"`). Had this
  grown its own idea of "word vs id", the two would have drifted, which is the defect class the sweep
  exists to find.
- ⚠️ **Surfaced, not fixed:** the 77 rows have not been *judged* yet. The instrument is built; running it
  is the wording gate's work, and it is now a short read rather than a fan-out.

## Audit tooling T4 — the surface inventory ( [D31] ) (2026-08-12)

### Before-scan

- **What does the cohesion gate actually compare?** Cross-surface voice · visual · motion · numbers. T1
  covers voice. Of the rest, **numbers is the sharpest deterministic lens**: measured before building,
  **three** money formatters exist — `formatCurrency`, `formatDisplayAmount` (core) and `formatWhole`
  (rn) — and Wave C's **C1 "cents-formatter"** is already filed against exactly this. Which surface uses
  which turns a hunch into a table.
- **Is the graph traceable?** Yes — ES imports, with `@/*` → `apps/rn/src` and `@core/*` →
  `packages/core` per `apps/rn/tsconfig.json:11-14`. Verified rather than assumed.
- **Direct or transitive?** ⛔ **Transitive.** A screen renders `Card` three imports down through a
  feature component; direct imports describe a file's neighbours, not a surface's vocabulary, and would
  have reported Today as using almost nothing.
- **Extend T1's script or write a new one?** New. T3 was folded into T1 because it needed T1's *copy
  classification* — a rule. This shares no rule with it, only a directory walk. **The "two places, one
  rule" test is about rules being re-derived, not about code looking similar.**

### After-scan

- ⛔ **THE FIRST FINDING WAS THE TOOL'S OWN DEFECT.** It reported `ChartSkeleton` as reached by no
  surface — dead code, a C7 hit. It is imported by `AllocationBarCanvas.web.tsx`,
  `TrajectoryCanvas.web.tsx` and `CashRunwayCanvas.web.tsx`. The resolver returned the **first** matching
  file, so `./AllocationBarCanvas` resolved to the `.tsx` and the `.web.tsx` sibling was never followed —
  **every module reachable only through a platform variant was invisible.**
  ⚡ Caught only because the strings inventory had shown this codebase lazy-loads charts via
  `getComponent`, so "dead chart component" was a claim with a known reason to doubt it. **A tool's own
  output is not evidence until the tool has been checked against something known.** Resolution now unions
  every variant: a bundler picks one per platform, an audit input must not, because the gate's question
  spans platforms. `unreached` went 1 → **0**.
- ⚡ **Real, and now data instead of a hunch: 4 of 15 surfaces reach BOTH `formatCurrency` and
  `formatWhole`** — Today, Money, Progress and History. That is precisely where the same amount can start
  rendering two ways, which is what C1 was filed to ask. → the cohesion gate.
- **6 single-use primitives** — `AddRow`, `AnimatedSheet`, `MasterDetail` (Money), `CheckCircle`,
  `TwoColumn` (Today), `PressableScale` (More). Each is either bespoke work that wants sharing or shared
  code that wants localising; both are the gate's judgement, not the script's.
- ⚠️ **Stated limit, in the report itself:** this is **reachability, not rendering** — a conditional
  branch counts. It over-reports rather than under-reports, which is the right direction for an audit
  input, and saying so stops a reader crediting it with precision it does not have.

## Audit tooling T2 — the duplicate-copy GATE ( [D31] ) (2026-08-12)

⚡ **The first audit lens to become a gate rather than a report.** [D31]'s point in practice: a finding
that becomes a test is paid for once; a finding that stays prose gets re-discovered and paid for again.

### Before-scan

- ⛔ **"Blocked on triaging the 210" was MY mischaracterisation, corrected here.** A baseline is exactly
  how a gate ships against existing debt, and **this repo already has the pattern**:
  `scripts/webkit-flex-controls-baseline.json` + `check-webkit-flex-controls.ts`, which loads a baseline,
  reports only *fresh* findings, and accepts new ones via `--update-baseline`. Followed it rather than
  inventing a shape. **The item was never blocked; I had not looked.**
- ⚠️ **Would the obvious gate be noise?** Yes — and that was worth measuring rather than assuming. Of the
  74 cross-file duplicate COPY strings, the short ones are `"Add"`, `"Save"`, `"Done"`, `"/mo"`, `"More"`
  — words two screens are entitled to share. **A gate that fires on those gets suppressed, which is worse
  than no gate.**
- **Extend T1 or write new?** Extend — it needs T1's copy classification, which is a *rule*. Same test
  that folded T3 in and kept T4 out.

### The threshold is measured, not chosen

Cross-file duplicate copy strings by minimum length: **74** at any length · **30** at ≥12 · **9** at ≥20 ·
**2** at ≥30. Twenty is where the distribution separates — below it, single words; at and above it, every
survivor is a phrase carrying voice. ⚠️ **It is a dial, not a law** — recorded as where the knee sits so a
future change is a decision rather than a silent drift *(the `measured-outcome-is-not-a-target` mistake:
2,589 words was once "where a cut landed" and became a gate that outlived its mechanism)*.

### ⛔ The gate was proven to FAIL before it was trusted

Planted `"A deliberately duplicated audit-gate probe string"` in `more.tsx` and `ExpenseSheet.tsx`, ran
the gate, and confirmed **exit 1** with both file paths named; reverted, confirmed **exit 0**.
⚠️ The first check reported `GATE EXIT=0` and that was *my measurement error* — `$?` after a pipe reports
`tail`'s status, not the command's. Re-run without the pipe: exit **1**. ⚡ **A gate believed green because
the harness around it was wrong is precisely this repo's recurring defect** — it nearly happened while
building the instrument against it.

**Baselined (11):** the three Guardian band phrases (`"A little tight this paycheck"`, `"Looks clear this
paycheck"`, `"Very tight this paycheck"`), four validation messages, and
`"Your plan runs on this floor, so a lighter paycheck never breaks it."` → each is real drift risk and
goes to the wording gate; the baseline records them as *accepted for now*, not as fine.

### After-scan

- ⚠️ **Gate mode writes nothing.** A lint step that regenerates two committed artifacts would leave CI
  with a dirty tree of its own making, and churn a diff locally on every run. Caught before wiring it in.
- **Wired into `lint:rn`** → so it runs inside `validate:release:rn` and on every CI push.
- ⚡ **The three Guardian band phrases living in two files each is a live [D26] item** — the band words
  are a stated product choice, and a product choice written twice diverges. → the wording/voice gate.

## Run `31607274947` — 7/8, and flow 08 found an accessibility defect (2026-08-12)

**7/8.** ⚡ **Flow 07 PASSES** — the `FormSheet` swipe worked and the anchored balance assertion held, so
the covered-field defect is closed on both forms. Order held again.

### ⚡ Flow 08's setup step found a real defect — in the app, not the flow

The reset itself worked: the screenshot shows **"Show feature tips again — Tips will appear again as you
go."** on screen. The assertion still failed, because the failure hierarchy contains the label and **not
the subtitle**.

`SettingRow.tsx:59` set `accessibilityLabel={label}` on the pressable. That makes the row ONE accessibility
element and **replaces** what its children contribute — so every subtitle in More was rendered and absent
from the tree. VoiceOver announced *"Show feature tips again"* and never *"Tips will appear again as you
go."*; likewise *"Look back at your finished pay cycles"*, *"Save a copy of your data"*, and
*"Automatic cloud backup — coming soon"*. **The label says what a row is; the subtitle is the only place
that says what it does — or that it is not available yet.** Sighted users got both.

Fixed as one utterance (`${label}. ${subtitle}`), the house pattern from A4's finale-stat grouping.

⚡ **This is the fourth member of a family already on the ledger** — `CheckCircle`'s unreported checked
state, `Slider`'s dropped `accessibilityValue`, `ListRow`'s always-announced Delete. All four are *a prop
that looks like it exposes something and does not*. ⚠️ **And the native lane keeps finding them first,
because Maestro reads the same accessibility tree a screen reader does** — the web suite cannot see this
class at all.

### ⛔ The artifact exclusion I shipped did nothing

The artifact was **364 MB** and took 3m11s. `device-simulator.log` is still in it, ×8.
**The bug is mine and it is a YAML one:** the `#` comment lines were written INSIDE the `path: |` block
scalar, where every line is literal text — so they became path patterns — and the exclusion itself was
quoted when `upload-artifact` wants it bare. ⚠️ **I stated the fix would take downloads "to seconds" and
never verified it.** The one measurable effect it did have: adding a second entry changed the action's
common-root calculation, so the artifact layout moved from `maestro-debug/…` to `apps/rn/maestro-debug/…`.
→ rides the next change that touches the workflow, since that file is in the cache key.

### The artifact exclusion, second attempt (2026-08-12)

Comments moved above the `path:` key; exclusion written bare and unquoted after the includes. **Syntax
verified against the action's own docs** *(`!` prefix, multi-line block, exclusions last)* and the parse
checked locally: `path` now yields exactly three entries, no `#` lines, no quoted patterns. The docs also
say **"exclude paths do not affect the directory structure"**, which confirms the layout shift was caused
by the bogus include patterns rather than by excluding anything — so the artifact root returns to
`maestro-debug/…`.

⚠️ **Local verification stops at the parse.** Whether the exclusion actually drops the file is a fact
about the runner, and the next artifact's size is the only thing that settles it. Claiming it fixed once
already was the mistake.

## ⛔ Maestro matches LITERAL EQUALITY or a FULL REGEX — never "contains" (2026-08-12)

**A mechanism I documented as proven, in three files, was wrong.** Corrected by measurement, and the
correction changes how every selector in the lane has to be written.

**What I claimed** *(flows 01 and 07, `more-button.tsx`, the T2 rationale)*: Maestro's text match is
CONTAINS, "proven" because `"Will you make it to payday?"` matched — which full-match semantics appear to
forbid, since the trailing `?` is a regex quantifier and nothing consumes the literal `?`.

**What the run measured.** After the `SettingRow` a11y fix, `assertVisible: "Show feature tips again"`
went **RED** against a node whose text is *"Show feature tips again. Re-offer the one-line hints on hidden
features."* A contains matcher passes that. A full matcher does not.

**The model that fits every observation this session:** Maestro tries **literal equality**, then a **full
regex**. So `"Will you make it to payday?"` passes by *equality*, never reaching the regex — which is
exactly what made "contains" look established. `".*It ends\..*"` passes by full regex. `"Debt"` passes by
equality against the segmented option. `"Show feature tips again"` fails both.

⚡ **The codebase already had this right and I read past it.** The existing flows wrap fragments in `.*` —
that *is* the contains idiom here. I invented a rule that contradicted the convention in front of me.

### What it cost, and what it caught

- Flow 08 had **TWO independent blockers**, and the second was invisible until the first was fixed:
  `CoachMarkLayer.tsx:89` composes `` `${copy.title}. ${copy.body}` `` exactly as `SettingRow` now does, so
  `assertVisible: "Press and hold a debt"` **was never going to pass** — with or without the a11y change.
  Found by reading the component instead of dispatching; otherwise it is one more 20-minute cycle.
- Three selectors in 08 rewritten to the `.*` idiom; the `^…$` anchors in 01/07 are **redundant rather
  than load-bearing** and stay only to state intent.
- ⚠️ **The `.*` requirement is systemic**, and it lands on **4.1.4**: every bare-string selector aimed at a
  composed `accessibilityLabel` is a latent red. Flows 01–07 pass because their targets happen to be
  exact-text nodes — *happen to be* is not a property anyone chose.

### Two self-inflicted errors while fixing it, both caught by tooling rather than by care

- A `perl -0pi` replacement containing `$/` **corrupted flow 01**, splicing the file's own header into the
  middle of a comment. Caught by the YAML parse check; reverted and redone with a precise edit.
- `".*…go\..*"` is an **invalid escape in a double-quoted YAML scalar**. The existing convention is `\.`
  (`".*It ends\..*"`). Also caught by the parse check.
⚡ **Both would have burned a full CI cycle**, and neither was caught by reading. Parse-checking every flow
before dispatch is now the cheapest habit in this lane.

## 4.1.4 — the selector guard ( `npm run lint:selectors` ) (2026-08-12)

**A Maestro flow is a claim about the app kept somewhere the app never checks.** Three ways that has bitten
this lane, and the guard is one check per way:

| | the failure | the check |
|---|---|---|
| ① | **Stale** — `b67cf5d` deleted "Try with Sample Data", `A10.1` replaced Money's Add rows; both left the flows behind and the suite was broken for two days reporting nothing | ids and copy must still exist in app source |
| ② | **Lying** — `tapOn`/`inputText` report COMPLETED whether or not they land; flow 07 concatenated three values into one field and "passed" those steps | a flow that types must write-verify |
| ③ | **Fragmentary** — Maestro matches equality or a FULL regex, so a bare selector aimed at a composed label can never match | advisory listing composed-label components |

### Before-scan

- ⛔ **The "working prototype" the plan promised does not exist.** The log says a `field-*` cross-check was
  written during 4.1.1 and to "build 4.1.4 from it" — it was **ad-hoc, never committed**. Checked before
  planning around it. *(The pre-authored-item failure rate holds: this is another one.)*
- Followed the repo's `scripts/check-*.ts` + `lint:rn` convention; `js-yaml` is already a dependency.

### After-scan — the guard's own first outputs were four false-positive classes

**Every one would have got it switched off, which is how ① happens again with a straight face:**

1. **`tab-money` "is in no testID"** — flagged in four flows that demonstrably tap it and pass.
   react-navigation sets it as `tabBarButtonTestID:` (an object property, `(tabs)/_layout.tsx:92`), not a
   JSX `testID=`. Both spellings now count.
2. **Screenshot paths as selectors** — `takeScreenshot: maestro-debug/s13-…` is an output path, and
   `inputText: "2400"` is data. Neither can be in app source.
3. **Multi-line copy read as stale** — `".*count toward your debt-free date.*"` IS in the app, wrapped
   across lines, and the check matched discrete single-line literals. Now searches one
   whitespace-normalised blob.
4. **Seed data and templated text** — `"Visa Test"` is created by the suite *(elegantly, exactly the set of
   `inputText` values)*, and `"Step 4 of 7"` is built from `Step ${n} of ${total}` so it never appears
   whole. Digits are the tell; those advise rather than fail.

⛔ **And one fabricated finding from the guard itself.** It reported both typing flows as unverified.
`selectorsOf` emitted `{id}` and `{text}` as **separate** entries, so `s.id && s.text` was unsatisfiable
and the check could never clear. ⚡ **A confident, specific, entirely invented defect — produced by the
tool built to stop exactly that.** Fixed to emit one entry carrying both.

### ⛔ All three proven to FAIL before being trusted

Planted a bogus `id` → **exit 1**. Planted stale copy → **exit 1**, naming it. Removed a write-verification
→ **exit 0**, and that is the honest result: the flag clears on *any* later verification in the same flow,
so it catches a flow that verifies **nothing** — the state all eight were in this morning — not a single
missing assertion. ⚡ **Renamed `unverified-input` → `no-write-verification` so the name matches what it
enforces**, with the per-form strengthening filed rather than silently skipped.

⚠️ **The advisory initially MISSED `SettingRow`** — the very component whose composed label broke flow 08
and prompted this guard — because the pattern required the template to follow `accessibilityLabel={`
immediately, and SettingRow's sits behind a ternary. **An advisory that omits the case that motivated it
is worse than none.** Now finds all three: `SettingRow`, `CoachMarkLayer`, `AddObligationSheet` *(the
third was news)*.

**Green at 8 flows · 50 testIDs known**, wired into `lint:rn` → `validate:release:rn`.

## Run `31614389654` — 7/8, the artifact fix VERIFIED, and 08's third mechanism (2026-08-12)

⚡ **The artifact is 17 MB, down from 364 MB.** Measured off the API rather than asserted this time. The
`.*` selector fix also worked: flow 08 now clears the reset setup that failed the run before.

### Flow 08, third mechanism — and the reset was never the problem

`.*Press and hold a debt.*` still red. `resetCoachMarks` is correct: `coachMarks.ts:120-124` clears BOTH
the persisted list and the session `shown` set, and its docblock explains why both are required.

**Nothing re-ASKS for the mark.** `use-coach-mark.ts` fires *"once per mount of the subject"* — it latches
an `asked` flag inside a subscription waiting on a `laidOut` event. `/more` is **pushed over** Money, so
Money never unmounts, no layout event follows, and `show()` is never called again however clean the record
is. Fixed with `killApp` + `launchApp`, which is the mount — and which §13.2 below already relies on for
the opposite check, so the command is proven in this very file.

⚠️ **A small product observation falls out of it:** a user who taps "Show feature tips again" and returns
to the screen they were on sees **nothing happen**. The copy says *"Tips will appear again as you go"*,
which is defensible, but the effect is deferred to the next mount of each subject. → best-in-class /
wording gate, low priority.

⚡ **Three separate mechanisms for one red flow**, each invisible until the one before it was fixed:
ordering *(wrong)* → the mark being spent by 07 *(right, but incomplete)* → the composed label
*(`.*`)* → no remount to fire against. **Each fix was necessary and none was sufficient**, which is the
argument for reading the artifact every cycle rather than pattern-matching a verdict table.

## Run `31617084361` — ⚡ THE CACHE WORKS, and flow 08's fourth mechanism (2026-08-12)

### ✅ 4.1.3a VERIFIED — 17m03s of build became 2 seconds

| step | |
|---|---|
| Restore the built `.app` | **1 s** |
| Verify the restored `.app` | **1 s**, passed |
| expo prebuild · pod install · Build · Save | **skipped** |

The first true test of the hit path — every earlier run was a deliberate miss, because each touched
`src/**` or the workflow, both of which are in the key **by design**. This dispatch changed only
`.maestro/**` and docs, which is exactly the loop 4.1.5→4.1.11 will run in.
⚡ **And the artifact fix is verified too: 17 MB, from 364 MB** — a 3-minute download became one minute,
and the layout returned to `maestro-debug/…` as the action's docs said it would.

⚠️ 🎯 Jason read the run as stalled at ten minutes with no flows started. It was not — the flows were
already running; the build had simply finished in *seconds* rather than seventeen minutes, so the run
reached Maestro far earlier than the previous six had trained us to expect.

### ⛔ Flow 08, fourth mechanism — a 500 ms race, and it is a real product defect

`show()`'s guard chain (`coachMarks.ts:75-86`) is: another mark active · a suppressor · the session
`shown` set · **the persisted `coachMarksSeen`**. After a relaunch the first three are clean, so the
refusal has to be the fourth — the cleared record never reached disk.

**`persistence.ts:14` debounces the autosave by 500 ms**, and `flushPendingSave` (`_layout.tsx:103`) fires
on AppState *background*, which a hard `killApp` never sends. The kill landed ~400 ms after the tap.

⚡ **One mechanism explains BOTH failing runs**, which is what makes it credible where three earlier
stories were not: *without* a relaunch nothing re-asks for the mark; *with an immediate* relaunch the
question is asked before the answer is durable. Fixed by navigating back through the UI first — well over
500 ms, and what a user does anyway.

⚠️ **Filed as a product defect, not just a test fix:** a pref changed and then force-quit within 500 ms is
**silently lost**, on a setting whose confirmation the user just watched appear. → Phase 5, which owns
durability.

### The count worth keeping

**Four mechanisms for one red flow**, each invisible until the one before it was fixed: ordering *(wrong)*
· the mark spent by 07 *(right, incomplete)* · the composed `accessibilityLabel` · the persistence race.
**Each fix was necessary; none was sufficient.** Three of the four were plausible stopping points, and
stopping at any of them would have shipped a flow that passes for the wrong reason or fails for a
misattributed one.

## ⛔ Flow 08 was never about the reset — the coach mark does not appear at all (2026-08-12)

**Four explanations, all wrong, all about the same non-problem.** Ordering · the mark spent by 07 · the
composed `accessibilityLabel` · the 500 ms persistence race. Each was plausible, each fixed something
real, and none was the cause — because every one of them explained *why the RESET failed*, and the reset
was never involved.

### The evidence that ended it

Flow 01's own `smoke-seeded-portfolio` screenshot — **taken on a fresh install** (`clearState: true`),
sitting on Money with three debts. `show()`'s guard chain at that moment:

| guard | state |
|---|---|
| another mark active | none |
| suppressors | none |
| session `shown` set | empty (fresh launch) |
| persisted `coachMarksSeen` | **empty by definition — nothing has ever run** |

…and `Platform.OS === 'ios'`, `view.order.length > 0`. **Every gate open, and no mark.** It was in an
artifact I had already downloaded, from a flow that was passing.

⚡ **The lesson is where I looked.** I read the FAILING flow's dump four times and never once checked
whether the thing it asserts happens anywhere else. A passing flow's screenshot answered it in one look.
**When a fix keeps not working, stop asking why the fix failed and check whether the premise is true.**

### The likely mechanism — filed as likely, not settled

`useCoachMark(id, ready)` returns early while `ready` is false and subscribes only once it flips true.
`money.tsx:259` makes `ready` depend on `view.order.length > 0`, and the store hydrates **async** — so on
mount there are no debts and no subscription, and by the time debts land and the effect re-runs, the row's
single `onLayout` → `targets.invalidate(id)` has already fired. `listeners` is a plain `Set` with **no
replay** (`tutorialTargets.tsx:111-119`), so the event is simply missed.

⚠️ **Stated as a hypothesis on purpose.** Four confident mechanisms in a row were wrong here; a fifth
asserted the same way would be worth nothing. It needs a probe or an app-layer test, not another guess.

### What it changes

- **A shipped feature does not work** — the highest-value coach mark in the app *("one invisible gesture
  hiding FOUR actions")* is never offered on iOS. → open defects.
- **Flow 08's §13.3/§13.4 are blocked on the app**, not on the flow. Patching the flow further would be
  writing a test around a defect.
- ⚡ **The lane's value statement gets stronger, not weaker:** this is the second live product defect the
  native lane has surfaced today *(after "Add from scan")*, and both were invisible to a green web suite —
  one because it exercised the path for data and not words, this one because a coach mark cannot render in
  a browser at all.

## ⛔ FIX — a late subscriber missed its only event, so one hint never shipped (2026-08-12)

🎯 Jason, overruling my recommendation to defer it: *"leaving a blocker out there is just bad practice."*
Correct — a shipped feature that does not work is a blocker whatever its surface area.

### What identified it: a CONTRAST, not another story

Four mechanisms had already been asserted and refuted here, so the fifth needed something structural. The
web suite supplied it — `a11y-axe.spec.ts:137` proves a coach mark **does** render (`toHaveCount(1)` on
`/progress`, green). So the machinery works, and the question narrows to what is different about the one
that fails:

| | `trajectory-scrub` — works | `debt-row-actions` — never fires |
|---|---|---|
| `ready` | **unconditional** — constant `true` | `Platform.OS === 'ios' && view.order.length > 0` |
| subscription exists | from mount | only after async hydration flips `ready` |

**The only mark with a data-gated `ready` is the only mark that never appears.** Same code path, one
structural difference — which is a comparison rather than a narrative, and that is why it is worth acting
on where the previous four were not.

### The mechanism

`useCoachMark` returns early while `ready` is false and subscribes when it flips. `invalidate` fires into
a plain listener `Set` with **no replay**, and a row lays out exactly once. So the event arrives before
the listener exists and is simply lost — permanently, because nothing lays out again.

⚠️ It is a **class** defect, not an instance: any future mark gated on loaded data has it, and would fail
the same silent way.

### The fix — make it a STATE, not an instant

`TutorialTargetsProvider` now records which ids have laid out, and `subscribe` replays them to a new
listener. Unregistering clears the id, so an unmounted target is never replayed. A re-measure request is
idempotent, so a subscriber that was there all along just asks again for something it has handled.

**Gate 167/167**, including the two web coach-mark tests — which is the evidence that the replay does not
disturb the path that already worked. ⏳ **The iOS path is verified by the next native run, not by this.**

⚡ **Where the earlier reads went wrong, stated plainly:** all four looked at the flow. This one looked at
the app and asked what distinguishes a working instance from a broken one. The failing artifact could
never have answered that — only the passing case could.

---

## Session close — 2026-08-12

**The native lane went 0/8 → 7/8, and its infrastructure is now proven rather than assumed.**
Commits `4a5078e` … `beba173`, all pushed to `v1.7-dev`. Gate **167/167**, tsc clean both trees, tree
clean, no stray dev servers.

### Shipped

| | |
|---|---|
| **4.1.3** | the RED lane repaired — a **42.7 s first hierarchy snapshot** and a **sticky CTA stack covering the form fields**. Both ledgered "known fixes" were refuted |
| **4.1.3a** | the `.app` cache — **17m03s → 2 s**, verified on a real hit, with provenance printed every run |
| **4.1.3b** | flow order made explicit — Maestro specifies none for a directory; the suite had been order-lucky |
| **4.1.4** | the selector guard — three checks, each proven to FAIL on a planted defect |
| **T1–T4** | the audit tooling: strings inventory · proxy-gate sweep · surface inventory · the duplicate-copy **gate** |
| **[D31]** | the audits change METHOD, not just model |
| **[D30]** | the iPad lane is three tiers in one directory |

**Three product defects found by the lane, all invisible to a green web suite:** the mis-file rescue
claiming *"Add from scan"* · `SettingRow` dropping every subtitle from the accessibility tree · the
`debt-row-actions` coach mark never rendering. Plus a 500 ms pref-durability hole → Phase 5.

### ⚠️ What the next session picks up

1. **Run `31621553581`** — in flight at close. It verifies the coach-mark fix. If still red, the next
   suspect is already written down (`CoachMarkLayer:68` vs `show()`'s record-on-offer at `:92`), and it
   was deliberately left unfixed so a green run stays informative.
2. **4.1.5 — the iPad boot**, under [D30]. ⚠️ Today's geometry is iPhone-specific (440×956); read the
   first iPad hierarchy dump before trusting any of it.
3. **The wording gate now has its inputs** — 793 strings, 210 cross-file duplicates, 77 copy-bearing
   gates to judge. Surfaced, not judged.

### ⚡ The lesson worth carrying, because it cost the most

**Four confident mechanisms for flow 08 were wrong, and all four looked at the failing flow.** What
settled it was looking at a *passing* one — flow 01's screenshot showed the mark absent in the cleanest
possible state, which no amount of re-reading the failure could have revealed. **When a fix keeps not
working, stop asking why the fix failed and check whether the premise is true.**

⚠️ Its sibling: **a documented mechanism is not a measured one.** "Maestro matches contains" was written
into three files as proven, from a single observation that had a second explanation. The codebase already
used `.*` wrappers — the convention was right there and I read past it.

### Run `31621553581` — the coach-mark fix is REFUTED (2026-08-12, after close)

**7/8, still red at `.*Press and hold a debt.*`.** The subscription-race mechanism is **eliminated**.

⚡ **This is the cleanest negative result of the session, and only because the meaning of a red was
written down BEFORE the run:** *"the subscription race is eliminated as a cause, and the remaining suspect
is `CoachMarkLayer:68`."* No story had to be invented after the fact to accommodate it — which is exactly
what went wrong four times earlier today.

**The replay change stays.** It is correct independently — a subscriber that arrives after an event should
still learn about it — and 167/167 says it costs nothing. It simply was not *this* defect.

▶ **Next session starts here, with the suspect already located rather than rediscovered:**
`CoachMarkLayer.tsx:68` returns null when `targets.measure()` resolves null, while `coachMarks.ts:92`
records the mark as offered **before** the layer ever tries to draw. A mark would therefore **burn itself
without rendering** — which fits every observation, including why no amount of resetting helped and why
the fresh-install screenshot showed nothing. First check: whether `measure()` succeeds for a **list row**
(`tutorialTargets.tsx:88` bails when the node lacks `measureInWindow`, and its timeout path also resolves
null).

⚠️ **Five mechanisms asserted here, four refuted. PROBE IT, DO NOT REASON AT IT** — a targeted probe flow
or an app-layer test, not a sixth confident explanation.

## 4.1.4c — the coach-mark PROBE, and 4.1.5.1 the iPad boot (2026-08-12)

🎯 The instruction the previous entry closed on: *"PROBE IT, DO NOT REASON AT IT."* This entry is that
probe. **Nothing here attempts to fix the defect**, and the restraint is the design — a fix riding the
same run would make a green uninformative, which is the mistake the session before last named.

### Before-scan — the pre-authored suspect, verified rather than assumed

The ledgered suspect (`CoachMarkLayer.tsx:68` returns null while `coachMarks.ts:92` has already burned
the mark) **survives contact with the code**, unchanged. Two of its neighbours were ruled out:

- ⛔ **A mismatched registry is impossible.** `CoachMarkLayer` (`_layout.tsx:208`) and the
  `TutorialTarget` are both inside the same `TutorialTargetsProvider` (`:151`–`:214`).
- ⚡ **Why the replay fix was irrelevant is now EXPLICABLE, not merely observed.** Entering Money after
  hydration makes `ready` true on the *first* render, so `useCoachMark`'s effect subscribes during commit
  and `onLayout` fires after it — the listener was already there. Run `31621553581`'s refutation and the
  source now agree, which is the first time in this defect that two things have.

**Two findings, both filed to the plan in the same edit:**

- ⚠️ **`SectionList`'s `index` is per-SECTION, so `debt-row-actions` can register TWICE.** `money.tsx:377`
  wraps `index === 0`, which is also the first **PAID OFF** row — two `TutorialTarget`s sharing one
  registry key, and the `Map` keeps whichever laid out last. The comment at `:374-376` anticipated exactly
  this hazard *for rows* and missed *sections*. **Latent** (the failing flows carry no paid-off debt), so
  it is not this defect and was deliberately **not** fixed here.
- ⚡ **The mark is unobservable to every automated surface except an iOS sim run.** `Platform.OS === 'ios'`
  (`money.tsx:259`) puts it beyond the web e2e and the `tsx` app-layer runner, and
  `phase35-themes.shot.ts:106` already recorded that. **That is why it shipped broken**, and it is the
  whole argument for instrumenting rather than guessing a sixth time.

### What was built

**Five stages, each reported separately** — `hook` (armed, with `ready` and whether a registry was above
it) · `layout` (the subject laid out and the listener heard it) · `show` (accepted, or refused **naming
the guard**) · `measure` (the rect, or `NULL`) · `draw` (the layer's verdict). Recorded into a tiny
RN-free store (`coachMarkProbe.ts`) and rendered on More as `testID="coach-probe"`.

⚡ **Why a RENDERED node rather than a `console.log`.** The lane builds `-configuration Release`, so a
console call *probably* survives to `os-log.txt` — and "probably" is what has already cost this defect
five cycles. A rendered node is in the view hierarchy Maestro dumps on every flow anyway, it can be
asserted on, and it is legible in a screenshot without downloading the artifact.

⚠️ **Mounted on More, not as an overlay.** An always-on readout was the obvious shape and would have put
the seven currently-green flows at risk from a `pointerEvents` slip or an overlapping bound — a
diagnostic that becomes a cause. Flow 08 already visits More to reset the marks, so this costs the suite
nothing it was not already paying.

⛔ **Flow 08 reads the probe BEFORE the assertion, and the order is the whole point.** A failed assertion
aborts the flow, so anything after `.*Press and hold a debt.*` is unreachable on precisely the run that
needs it. Money is screenshotted first, so the state the assertion will judge is recorded before the
navigation perturbs anything.

**Folded in — `qaEnabled()`.** `__DEV__ || QA_TOOLS` was open-coded in **three** places
(`sandboxHarness.ts`, `more.tsx:298`, `tutorial.tsx:39`) and the probe was about to make it four. The
failure mode is specific rather than aesthetic: the Phase-6 shutdown is `git grep QA_TOOLS`, so **a copy
that spells the guard differently is a copy the flip can miss.** Wave A's *"a rule re-derived at each call
site rather than owned once"*, caught before it became a fourth.

### 4.1.5.1 — the iPad boot, batched onto the same run

🎯 Jason chose to batch it. The reasoning that made it nearly free: the probe touches `src/**`, which is
in the `.app` cache key, so a full rebuild was being paid **regardless** — and 4.1.3a made the binary
device-agnostic, so the iPad tier's marginal cost is Maestro time, not another 17 minutes of compile.

[D30] implemented as written: a **`device` workflow input** (`iphone` / `ipad` / `both`) carrying its own
explicit flow list, which is also the tiering — `01-launch-smoke.yaml` is the shared tier, the new
`i01-ipad-boot.yaml` is the iPad-only tier, and **02 is absent because it is iPhone-only by design** (its
subject is a header button inside a modal sheet's swipe area; on a wide iPad the sheet is inline, so it
would pass while testing nothing).

⛔ **`i01` is a MEASUREMENT, not coverage, and says so in its own header.** Every assertion in it holds on
both layouts by design — they exist to carry the flow to the next screenshot. Recording it as coverage
would be 3.5's defect class ① (*"an assertion that passes either way"*).

⚠️ **Rotation is deliberately absent.** §11.8's half needs a command this build has not been shown to
have, and 4.1.1's rule sends unproven commands through `.maestro/probe/` first — a suite flow that dies on
a missing command takes the hierarchy dump down with it.

⚡ **Two authoring bugs caught before the run, both in the step I had just written.** Current iPad names
contain parentheses (*"iPad Pro 13-inch (M4)"*), so the UDID pattern that stopped at the first `(` would
have matched **nothing**; and GitHub runs `run:` under `bash -e`, so a bare `maestro test` followed by
`$?` would have aborted the step before the status line — discarding the "how far did it get" that is the
step's entire output.

### After-scan

- ⚠️ **The coverage split must not count measurement flows.** `lint:selectors` now reports **9 flows**
  because `i01` is one. Any re-derivation of 68/127 that counts files will overstate itself → filed onto
  **4.1.11**, which already owns re-deriving that split.
- ⚡ **The generalizable half of the probe's design:** when the only surface that can observe a defect
  reports one bit, add stages — not theories. Four wrong mechanisms were all compatible with "the
  assertion failed"; no arrangement of these five values supports more than one story.
- ⚠️ **`i01` asserts nothing about column count** (§10, C6) because this build has not been shown to
  express one. Inventing a selector that happens to match is how a check that proves nothing gets recorded
  as coverage → the real §10 checks stay owed to **4.1.5**.

**Gate 167/167**, tsc clean both trees, zero `error-context.md`, no stray dev servers. `lint:selectors`
validates the new `coach-probe` id and all of `i01`'s selectors.

### Run `31626109780` — the reading, PRE-REGISTERED (written before the run landed)

⚡ The previous entry's cleanest result was clean *only* because the meaning of a red was written down
first — *"no story had to be invented after the fact to accommodate it, which is exactly what went wrong
four times earlier today."* So, before this run reports:

| `coach-probe` shows | what it means | next move |
|---|---|---|
| `EMPTY` | the hook never armed — `useCoachMark`'s effect did not run on Money | the mark is not wired on the path the flow walks; read Money's mount, not the mark |
| `hook:… ready=0` | the debts list was empty when Money mounted | a SEEDING/timing defect, not a coach-mark defect — the flow's premise is wrong |
| `hook:… registry=0` | no `TutorialTargetsProvider` above the caller | a mount-order defect in `_layout.tsx` |
| `hook:…` but **no** `layout:` | the subject never laid out, or `invalidate` never reached the listener | back to `TutorialTarget`/`SectionList`; the replay fix would then be necessary but insufficient |
| `show:…=refused(<guard>)` | **the guard names itself** | four mutually exclusive causes collapse to one, whichever is printed |
| `show:…=ACCEPTED` + `measure:…=NULL` | ⭐ **the standing suspect, confirmed** — the mark burns at `coachMarks.ts:92` without ever drawing | fix is to record on DRAW, not on offer; `measure()` on a list row is the thing to repair |
| `measure:…=<rect>` + `draw:…=DREW` | the callout renders and the ASSERTION is what is wrong | the defect is in the flow/selector, not the app — five mechanisms were all aimed at the wrong half |

⛔ **`draw:…=stoodDownFor(hosts=N)` on Money would be its own finding** — a nested `FormSheet` host
outliving its sheet, which would mean the root layer stands down permanently.

**And what a GREEN would mean:** that the trip to More perturbed the outcome. The probe navigates before
the assertion, so a suddenly-passing check is not a fix — it is evidence the mark needs a second layout
pass, which is itself the answer.

⚠️ **The iPad half is read separately and cannot fail this reading.** `01` going red on iPad answers
[D30]'s carried hypothesis directly (the iPhone-tuned swipes did NOT clamp harmlessly), and `ipad-00-boot.png`'s
measured pixel width is what turns "a wide iPad" from a premise into a number.

## W1 — the duplicate-copy triage (2026-08-12)

The interim build during 4.1.4c's CI wait. Full triage → `docs/audits/2026-08-12-duplicate-copy-triage.md`.

### Before-scan — and it corrected the item's own headline number

⛔ **"210 cross-file duplicates, the wording gate's first task" overstated the input by ~2×.** Measured
from the JSON sidecar rather than re-quoted: **210 repeated strings, 110 copy-bearing, 100 not copy at
all** — `space-between`, `decimal-pad`, `chevron-right`, `/paywall`, `optional_goal`.

⚡ **The rule was already written down inside the file that broke it.** The T2 gate filters
`bucket === 'copy'` (`:317`); the report section did not (`:292`); and the T3 table's note twelve lines
below says a row is earned *"only if it selects between strings T1 ALREADY classified as copy — that
reuses one classification instead of inventing a second heuristic."* One file, one rule, followed in two
places out of three. `feedback_the_codebase_already_said_it`, firing on a document one day old.

⚠️ Also caught in the before-scan, and worth recording because it wasted a step: **the shell cwd resets
between turns.** `npm run audit:strings` reported *"Missing script"* and `strings-inventory.md` appeared
not to exist — from `/c/Users/Jason/Hearthlight`. The plan's own Env line already says *"cwd drifts"*.
I nearly filed "T1's output does not exist" as a finding.

### W1.1 — the fix

`copyDuplicates` added as a **separate** list rather than narrowing `duplicates` in place: the T2 gate
reads that one, and a gate whose input silently changes shape is how a baseline stops meaning what it was
accepted for. Verified: gate still reports 11 baselined, unchanged. Each row now carries its bucket mix,
because `copy+unclassified` means *the same text is copy in one place and an enum id in another* — a
coincidence to skip, not a divergence to fix.

### W1.2 — what the triage found

⭐ **A live, user-facing defect rather than a latent one.** `one-time` has **two shipped spellings**: a
user sets a bill to **"One time"** (`ExpenseSheet.tsx:19`) and Money files it under a heading called
**"One-time"** (`money.tsx:631`, matching `DebtSheet.tsx:46`). The "agreeing copies are still copies —
they just have not diverged yet" claim, with the divergence already in the build.

⭐ **The paycheck form is implemented twice, verbatim** — `PaycheckStep` (onboarding) and `PaycheckSheet`
(edit) share ~13 strings including a byte-identical `CYCLES` array, sublabel and all. The largest single
instance of the shape in the app. `FirstDebtOrBillStep` does the same thing to `DebtSheet`'s fields.

**Three groups deliberately left alone**, each on a reason that was already measured: generic UI verbs
(T2's own threshold note — *"words two screens are entitled to share"*), the Guardian band strings (the
second copy is `LiveActivityQA`'s sample content, which **dies at the Phase-6 `QA_TOOLS` flip**), and the
`copy+unclassified` coincidences.

⚠️ **T1 over-reports `copy` two identifiable ways**, both measured: `key:label` when the value is a hex
chart tone (`CashFlowSection.tsx:25-30`'s `barTone()` returns `{grad, glow, label}` where `label` is a
colour — six hexes in the copy bucket), and `return` when the function returns an enum union
(`computeState.ts` bare-returns `"at-risk"`/`"tight"`/`"clear"`). It matters because **794 "copy" is the
wording gate's scope claim**, and this script's line 121 already says an inventory that over-reports is as
useless as one that under-reports. → the 928-unclassified classification pass.

⚡ **The pattern across W1 and the 4.1.4c before-scan, in one session:** three separate premises checked,
**three corrected** — the coach-mark replay mechanism, the 210 figure, and T1's own bucket accuracy. The
before-scan has now paid for itself a third time this session.

### W1.3–W1.4 — the extractions ( 🎯 all four clusters )

Two authorities, both in `store/` following `coachMarkCopy.ts`'s one-subject-per-file precedent:

- **`paycheckForm.ts`** — the paycheck form was written **twice, verbatim**: `PAY_CYCLE_OPTIONS` (sublabel
  and all), every field label and placeholder, two validation messages, the lean-floor help text, and
  `nextPaycheckFrom`/`formatPaycheckDate` — the last two being **duplicated logic**, not just copy, which
  is why they came along rather than being left beside de-duplicated strings.
- **`obligationForm.ts`** — `RECURRENCE_LABEL` · `BILL_CATEGORY_ORDER`/`LABEL` · `FORM_ERRORS`.

⚡ **The design decision that made cluster 2 safe: labels are shared, the OPTION LIST is not.**
`DebtSheet` offers six recurrences and deliberately omits `one-time` (a debt terminates by definition);
`ExpenseSheet` offers seven. Extracting one shared *array* would have silently added an option to the
debt form — a product change nobody asked for. So the module owns a `Record<Recurrence, string>` and each
form keeps its own ordered list of values. The same reasoning kept `BNPL_CADENCE`'s *"Every 3 months"* as
a **stated override** of `RECURRENCE_LABEL.quarterly` rather than a second spelling nobody chose.

**Measured:** copy duplicates **110 → 83** · copy literal sites **794 → 740** · T2 baseline **11 → 5**.
Gate **167/167**, tsc clean both trees, zero `error-context.md`.

### After-scan

- ⚡ **The SHRINKING baseline caught two misses of my own.** Regenerating T2's baseline after the
  extraction produced 4 stale entries and 0 fresh — and two were strings I believed were already
  de-duplicated: a **fifth** site for *"Enter an amount greater than 0."* (`WindfallSheet.tsx:61`, which
  never appeared in the triage list I worked from) and the lean-floor footnote, still written twice
  because I had extracted the field copy *around* it. **A baseline that only ever grows cannot report
  this.** Worth generalising: after any de-duplication, re-derive the gate's baseline and read what
  *disappeared*, not only what appeared.
- ⚠️ **A second live divergence, kept deliberately and now stated.** The identical "no amount entered"
  condition reads *"Enter your paycheck amount to continue."* in onboarding and *"Enter your paycheck
  amount."* in the sheet. A step in a flow may legitimately say "to continue"; the fix was to make it a
  documented per-host difference rather than an accident. → confirm at the wording gate.
- ⚠️ **The repo is CRLF and my first codemod pass silently matched nothing multi-line** while every
  single-line replacement succeeded — a *partial* edit that still typechecked, which is the dangerous
  shape. Normalise to LF, replace, restore the original ending. → working notes.
- ⚡ **The five survivors in T2's baseline are now exactly the five the triage said to leave** — three
  Guardian band strings whose duplicate is `LiveActivityQA` sample content (it dies at the Phase-6
  `QA_TOOLS` flip) and two phrases owed to the wording gate. The gate's baseline and the audit's judgement
  agree, which is what makes the baseline readable rather than a list of accepted debt.

## Run `31626109780` — 7/8, and BOTH failures were mine, in the diagnostic itself (2026-08-12)

Flows 01–07 green. **08 failed at `Assertion is false: id: coach-probe is visible`** — the probe readout,
not the coach mark. The run produced no reading of the pipeline at all.

### ⛔ Miss 1 — the probe was below the fold, and I asserted it without scrolling

"Developer / QA" is the **last** section on More (`more.tsx:300`), so on a phone the readout sits off
screen. **The same class as the sticky-CTA-covering-the-fields defect 4.1.3 found** — committed by the
very flow written to diagnose something else. `scrollUntilVisible` was proven on this build in **three
existing flows** (02, 05, 06) and I did not look. `feedback_the_codebase_already_said_it`, again.

### ⚠️ And the artifact nearly produced a WRONG diagnosis — read what is MISSING, carefully

`coach-probe` appears **zero** times in the failing step's hierarchy dump, which reads as *"the element
never rendered"*. It is not: **`Version` — an unconditional row in More's About section — is also
absent**, while `Show feature tips` and `Export backup` (both higher up the same screen) are present.

⚡ **Maestro's iOS hierarchy reports on-screen nodes only, so absence from a dump is not evidence of
absence from the tree.** Without the `Version` control I would have "confirmed" that the QA section does
not render in a Release build and gone looking for a `qaEnabled()` bug that does not exist. The check that
settled it was finding a KNOWN-rendered element in the same off-screen region — the same move that settled
flow 08 last session: **compare against a case you already understand.**

### ⛔ Miss 2 — the iPad tier was skipped by its own condition

`if: inputs.mode != 'probe' && (...)` gets an **implicit `success()`** in GitHub Actions, and the iPhone
Maestro step had just failed — *as that run was designed to do*. So the iPad measurement was dropped by the
condition meant to schedule it. ⚠️ **`continue-on-error` does not cover this**: it stops this step's own
failure from failing the job and says nothing about running after an earlier one. Two mechanisms,
conflated. Now `!cancelled() && …`.

⚡ **The pattern worth naming: a diagnostic run has to be authored for the world in which the thing it
diagnoses is still broken.** Both misses assumed a green run — one asserted a bottom-of-screen element as
if the flow would arrive there anyway, the other scheduled the iPad tier behind a step that was expected
to fail. The probe design was right; its delivery assumed success.

## W2 — the classification pass (2026-08-12)

W1 asked *"which duplicates are copy?"*; this asks *"which of the 946 unclassified are copy at all?"* —
because the `copy` bucket **is** the wording gate's scope claim, and a claim nobody has checked is not one.

### Before-scan — the gap was not cosmetic, it had already cost W1

⭐ **The classification gap made W1's triage structurally incomplete, and this is measured.**
`key:periodLabel` sat in `unclassified`, so `paywall.tsx:59/75`'s **`"one time"`** never reached the
duplicate list W1 worked from — on the very day W1 settled the `one-time` spelling. *(Different context:
"$79.99 one time" is price prose, not the recurrence option label, so it is a wording-gate judgement
rather than an obvious defect. The structural point stands and is the item's whole justification.)*

⚠️ **Guardian first-person voice was unclassified.** `"Payment logged — I updated your balance."` and
`"Payday landed — I rolled your plan forward to this paycheck."` sat in `other`. The house-voice rule —
*the Guardian is the sole first-person "I"* — is the single thing the wording gate exists to check, and
its input could not see the Guardian speaking.

**Measured before building** (not estimated): 946 unclassified across 307 origins · `other` alone was 318,
of which 253 were identifier-shaped · 444 identifier-shaped overall · 79 hex literals, 6 already in `copy`.

### What was built

- **W2.1 — value-shaped exclusions.** Lowercase kebab/snake tokens and hex/`rgba()` are never copy. Case
  is the discriminator and it is load-bearing: `one-time` is the enum, **"One-time"** is what a user reads.
- **W2.2 — `jsx-expr` → copy.** A literal inside a JSX expression container is rendered text. Ordering is
  what keeps it safe rather than a flood: technical props resolve to `key:justifyContent` etc. above it, so
  only a literal with *no* named context at all falls that far.
- **W2.3 — eleven origins promoted**, each read at its site first, never by which prop name sounds copy-ish.

### ⛔ W2.4 — the verification caught two false negatives in my own rule

**`copy → anything else: 0`**, and 13 entries left the report while classified copy — 6 chart tones, two
`RECURRENCE_LABEL['one-time']` index keys *(which exist only because W1's extraction created them)*, and
the `PlanState`/`GuardianState` values. All correct. But the diff also found two the counts hid:

1. **A literal interpolated into a template is prose.** `` `next milestone ${nextT === 100 ? 'debt-free' :
   …}` `` is a VoiceOver label (`progress.tsx:151`), while `'debt-free'` two files away is a `PlanState`
   value. Shape cannot tell them apart; position can.
2. **JSX text is split around every `{}` interpolation**, so *"Plus $X in N one-time bills — not part of
   your ongoing reserve"* yields the bare fragment `one-time` — identical to the enum by shape, plainly
   prose by position. Found only on a second reading of the drop list, after fixing (1).

⚡ **The principle both share, and it is the transferable one: context, not shape.** It is the same rule
`jsx-expr` is built on. And the method matters more than the rule — **a count moving is not evidence a
rule is right.** Reading all 13 drops and all 99 promotions is what turned two silent losses into two
exemptions.

**Result: unclassified 946 → 346 · copy 740 → 826 · T3 gates 77/184 → 90/139 · copy duplicates 83 → 75.**
T2 baseline unchanged at 5, zero fresh gate findings — the promotions introduced no new ≥20-char
cross-file duplicate.

### After-scan

- ⚠️ **`EXAMPLE_MONEY` already exists as an exported constant, and three sites bypass it.**
  `ExampleCanvasMarker.tsx:14` owns the phrase; `TutorialOverlay.tsx:320`, `DemoDock.tsx:57` and
  `tutorialPath.ts:242` write the literal. ⚡ **The single authority was already created and the copies
  were written anyway** — a sharper version of "two places, one rule". **Filed, not folded:** the clean fix
  moves the constant to an RN-free module, because `tutorialPath.ts` is run by the `tsx` app-layer runner
  and cannot import a component. That is a layering change, not cheap adjacent polish, and all four sites
  agree today. → the wording gate.
- ⚠️ **`"PayPal"` reads as a duplicate and is not one** — `DebtSheet`'s BNPL provider label vs
  `parseStatementText`'s OCR matcher token. The `copy+unclassified` bucket tag is what makes that
  judgeable at a glance, which is why W1.1 added it.
- ⚡ **346 unclassified remain, and they are now the honest number.** The next pass has a much better
  starting point than 946, and nothing was dropped silently — every exclusion is a rule stated in the
  script and printed in the report.

## Run `31630150499` — ⭐ THE PROBE ANSWERED IT (2026-08-12)

**iPhone 7/8**, and this time flow 08 walked *past* the probe assertion and failed at the real one — which
means the readout rendered and the pipeline was measured:

```
hook:debt-row-actions ready=1 registry=1 · layout:debt-row-actions
  · show:debt-row-actions=refused(suppressors=1)
```

⭐ **Every stage worked and `show()` refused on the SUPPRESSOR guard.** The hook armed, the subject laid
out, the listener heard it. **All five previously-asserted mechanisms are eliminated** — including
`CoachMarkLayer:68`, the one written down as the leading suspect, which never even ran because `active`
was never set.

⚡ **The pre-registration paid off exactly as intended.** The reading table written before the run said
`show:…=refused(<guard>)` → *"the guard names itself — four mutually exclusive causes collapse to one."*
No story had to be invented afterwards; the row was already there.

### The defect class — a suppressor outlives the screen you can see

`useSuppressCoachMarks` is held for as long as a screen is **MOUNTED**, and `index.tsx:230` is **Today —
a tab**, which stays mounted for the entire session. So while Today is interrupting (an ack, a
celebration, or a pending walkthrough invitation), **coach marks are suppressed app-wide, on every other
screen.**

⚡ The count-not-boolean design already anticipated two surfaces being mounted at once. What is wrong is
the **lifetime**: it is tied to mount, not to visibility. A backgrounded tab holds a global suppression.

⚠️ **Which of the three holders it is has NOT been measured** — Today's own flags, a leaked `demo-run`, or
a leaked `walkthrough-session`. Five confident guesses have already died on this defect, so the fix is a
measurement, not a sixth: `addSuppressor(reason)` now carries a name, Today computes which of its three
raised it, and the refusal prints `refused(suppressors=1: today:invite)`.

⚠️ **A prediction, recorded before the next run:** if the holder is Today's flag, then *every* coach mark
is suppressed in this state, not just this one — and flow 08 has never reached §13.1 or §13.4, so those
two marks are **untested, not passing.**

### ⛔ The iPad tier ran — and measured the wrong device, which was my bug

Infrastructure is proven end to end: booted, installed, streamed the app log, ran Maestro, uploaded.
**`01-launch-smoke` PASSED on iPad**, which answers [D30]'s carried hypothesis — the iPhone-tuned swipes
clamped harmlessly rather than mis-firing.

But it booted **iPad mini (A17 Pro)**: the selector preferred `grep -i pro` and matched the **chip name**.
Measured **1488px ÷ 2 = 744pt**, and `sizeClass.ts` puts `regular` at ≥768 and `isExpanded` at ≥1024 — so
**744pt is compact.** The run exercised the **phone layout on an iPad**.

⚡ **That is [D30]'s own named void condition — "it would go green while testing nothing" — committed by
the workflow step written to implement [D30].** It also explains `i01`'s failure at `tab-progress`: at
compact width the debt row presents a **modal**, which covered the tab bar and swallowed every
measurement after it.

**Both fixes are the same shape as the defect they close:**
- **Select by MEASURED width, never by name.** Each candidate iPad is booted, screenshotted and measured;
  the widest wins; and the step **fails loud below 1024pt** rather than reporting a pass for checks that
  did not run. A compact "iPad" run is worse than no iPad run.
- **`i01` reordered** so Progress/More/back are measured *before* the debt sheet. A measurement flow must
  not stake its remaining output on a step that can swallow the navigation.

⚡ **The recurring lesson this session, now three for three:** the probe, the iPad picker and the flow
order all failed the same way — **each assumed the happy path while being the thing built to survive the
unhappy one.**

## 4.1.4c‴ — the fix, and a correction to my own caution (2026-08-12)

🎯 Jason, on the run I had just dispatched: *"so this build will not go green"*. Correct, and it should
not have been dispatched that way.

⚡ **The "do not stack a speculative fix" rule was right for the PREVIOUS run and wrong for this one, and
the difference is what the probe now emits.** When the output was a single bit, a green would have been
uninformative — a fix and a flake are indistinguishable. Now the probe emits a **reason string**, so a fix
riding alongside stays informative in both directions:

- mark fires **and** the trace reads `suppress+ today:invite` → holder confirmed *and* defect closed;
- mark still refused **and** the trace names `walkthrough-session` → the focus fix was inert, and the real
  holder is a leaked session release.

Either way the cycle produces the diagnosis. I was about to spend a third ~35-minute run to learn one
string. **Cancelled `31635145613` three minutes in.**

### The fix

`useSuppressCoachMarks` on Today is now gated on **`useIsFocused()`**, not on mount. *(Export verified by
reading `expo-router/build/exports.d.ts:20` rather than assumed — `useFocusEffect` was already in use in
`RequiredActionsCard`, `useIsFocused` was not.)*

Today is a **tab**: it stays mounted for the entire session, so its suppressor was held the whole time an
ack, celebration or walkthrough invitation was pending — including while the user was on Money, Progress
or More. The store's contract already said *"a screen declares while it is INTERRUPTING"*, and a tab
nobody is looking at is interrupting nobody. **The count was never the bug; the lifetime was.**

⛔ **Deliberately NOT applied to `demoSession` / `tutorialSession`.** A bounded run genuinely owns the
whole surface whichever screen is focused, which is the distinction the count exists to express.

⚠️ **It relaxes "one interruption at a time" ACROSS screens, and that is a product judgement, not a
side effect.** A user with a pending ack on Today can now meet a coach mark on Money. They are never seen
together, and the alternative is the measured status quo: the discovery layer dead for every newly
onboarded user. Flagged for the wording/UX gate rather than buried.

⚠️ **A green web suite proves nothing here** — the mark is `Platform.OS === 'ios'`, so no web test can
reach it. 167/167 says nothing else broke; it does not say the fix works. Only the native run can.

### The reading, pre-registered

| next run shows | meaning |
|---|---|
| `suppress+ today:invite` (or `today:ack=…`) **and the mark renders** | ⭐ holder confirmed, defect closed, 8/8 |
| `suppress+ walkthrough-session` / `demo-run` **and still refused** | a session leaked its release — the focus fix is inert and correct anyway; hunt the unreleased suppressor |
| **no `suppress+` at all** and still refused | the holder registered before the trace was cleared — move the probe's reset earlier |
| mark renders **and** no `suppress+` line | it was Today all along and the invite had already been answered — weakest outcome, re-run to confirm |

## Run `31636187156` — the fix landed, and immediately exposed a second defect (2026-08-12)

🎯 Jason, while I was mid-edit on three flows: *"I wouldn't make changes until you can verify from the
error log."* **That call saved the cycle** — all three edits used `tapOn: "Got it"`, and the artifact
proves that could never have worked. The edits were reverted unrun.

### ⭐ The suppressor fix WORKS

Flow 08 walked past `.*Press and hold a debt.*` — red for three runs — and died further along. **The mark
renders.** Everything below follows from that.

### The four failures, from the artifact rather than from reasoning

| flow | died at | cause |
|---|---|---|
| **01** | `tapOn add-choice-debt` | the callout at **[16,556][424,701]** took the `money-add` tap |
| **04** | `assertVisible ".*Store Card.*"` | ⚠️ **CASCADE** — 01 never created Store Card. Not a coach-mark failure |
| **07** | `assertVisible "What are you adding?"` | same interception as 01 |
| **08** | `tapOn "Got it"` | the dismiss button is not an addressable element |

⚠️ **01 died one step AFTER the real fault**, and that lag is this suite's recurring trap: `tapOn` reports
COMPLETED whether or not it lands on what you meant. The hierarchy is what settles it — `Press and hold a
debt` present, `add-choice-debt` and `What are you adding` **absent**, so the chooser never opened.

⚡ **04 is the one my hypothesis got wrong**, and only the artifact could say so. I had written an
assert-and-dismiss block for a payoff-schedule mark it never reached. **It is deliberately left unchanged**
— if the payoff mark does fire there, the next run will say so at `debt-view-schedule`, and that will be
evidence rather than another prediction.

### ⭐ The second defect — `accessible` swallowed the dismiss button

```
resource-id: coach-mark   bounds [16,556][424,701]   children: 0
accessibilityText: "Press and hold a debt. Log a payment, see its payoff schedule, …"
```

Marking the card `accessible` collapses its whole subtree into ONE element on iOS. So the callout is a
**leaf**: one composed label, no children, and no "Got it" at any depth.

**Two things broken by one prop, and only one of them was a test problem:**
- **VoiceOver got a single `alert` with no way to dismiss it.** The container is not pressable and the
  button inside is not focusable, so a double-tap did nothing. `more.tsx` describes this affordance as the
  discovery layer's escape hatch — *"a mark is offered ONCE ever, so without a way back the whole
  discovery layer is a one-shot a user can lose to a mis-tap"* — and it could not be operated.
- Maestro could not address it either, which is how it was found.

⚡ **It hid for months because nothing ever DREW the mark.** The suppressor defect meant every prior native
run refused it, and the web suite structurally cannot reach an iOS-only mark. **A control can be
unreachable indefinitely if nothing renders it** — and fixing the first defect is what made the second
one observable at all.

Fixed by moving `accessible` onto the SENTENCE (which is what should read as one utterance) and leaving
the `Pressable` a sibling, plus `testID="coach-mark-dismiss"` so no flow has to match the word "Got it" —
Today's acks use it too (`index.tsx:470/488/505`).

### The iPad tier — correct selection, unusable method

The width-measuring loop **booted every candidate iPad**, and run 31636187156 spent 20+ minutes there
before the job hit its 60-minute wall and was cancelled mid-tier. The `if: always()` collect/upload steps
still ran so the artifact survived — **luck, not design.**

Replaced with a disk read: every device type ships `mainScreenWidth` / `mainScreenScale` in its
`.simdevicetype` profile, so selection is ~1 second and exactly ONE boot. ⚠️ A failed plist read yields
0pt and lands in the same fail-loud branch as a too-narrow device, with the table printed — a silent
fallback to name-matching is what put a 744pt iPad mini through this lane to begin with. Timeout raised
60 → 75 as headroom against the next surprise.

⚡ **The through-line for the whole session:** every one of these was a case of *the instrument being
authored for the world in which the thing it measures already works.* The probe, the iPad picker, the
flow order, and now three flow edits written against a button that does not exist as an element.

## Run `31642490867` — 7/8, and the iPad guard caught MY bug (2026-08-12)

**01–07 all green**, including the two flows repaired from the artifact. 08 reached **§13.1** — deeper
than it has ever been — and failed on `assertVisible: id: coach-mark`.

### 08 — the payoff-schedule mark is not merely mispositioned, it is ABSENT

Hierarchy at `step-030`: `coach-mark` **0** · `See the whole payoff` **0** · `Edit debt` **2** ·
`debt-view-schedule` **1**. The sheet is open and the subject row is registered; the callout does not
exist. Verified in source rather than assumed: `DebtSheet.tsx:128` calls the hook and `:281` registers
`<TutorialTarget id="payoff-schedule">`, so it is wired.

⛔ **No sixth mechanism is offered here.** §13.1 has never executed before, so this is new ground, and the
instrument that should answer it was pointed at the previous question — the probe read sits EARLIER in
flow 08, so its trace covers `debt-row-actions` and is blind to this attempt.

### ⚡ The probe could not survive being unreachable — fixed two ways

1. **`probeCoachMark` now also writes to the unified log.** The rendered readout can only be read where a
   flow can NAVIGATE to it; a console line is in the artifact whatever screen the run dies on. Kept
   alongside the readout, not instead of it — whether console survives `-configuration Release` is
   unverified, and the next run settles that at no cost if it does not.
2. ⛔ **And `os-log.txt` was covering the WRONG WINDOW.** The boot step's `log stream` is killed after
   25 s — correct for catching a cold-launch crash, which is its job — so the capture ended **before
   Maestro ever started.** Every diagnostic the app logged during the suite was being discarded. The
   Maestro step now runs its own long-lived stream (`os-log-maestro.txt`) and **greps the probe trace
   into the CI log**, so the next reading needs no artifact download at all.

### ⭐ The iPad guard fired on my own parse bug — exactly as designed

| device | plist | computed |
|---|---|---|
| iPad Pro 13-inch (M4) | 2064px / 2.000000x | **0pt** |
| iPad Air 13-inch (M3) | 2048px / 2.000000x | **0pt** |
| iPad mini (A17 Pro) | 1488px / **2**x | **744pt** |

`mainScreenScale` is a FLOAT on most device types and an integer on a few. Bash cannot divide by
`2.000000`, so every wide iPad computed 0pt, the mini "won" at 744pt, and the step **refused to run.**

⚡ **That is the guard working, one layer up from where it was aimed.** It was written to stop a compact
iPad being tested as if it were expanded; what it actually caught was the measurement code being wrong —
and it printed the table that named the cause. A silent fallback would have run the phone layout a second
time. `S=${S%%.*}` fixes it: iPad Pro 13-inch → **1032pt**, above the 1024pt threshold.

⚠️ Also now measured rather than assumed: **only 13-inch iPads are `isExpanded` in portrait.** Pro 11-inch
is 834pt, Air 11-inch and iPad (A16) are 820pt — all `regular`, none expanded. Any future claim about
"the iPad layout" has to say which iPad.

## Run `31646289268` — ⭐ THE IPAD TIER LANDED; the iPhone lane never started (2026-08-12)

### ⭐ 4.1.5.1 is real — an expanded iPad, booted and driven

```
iPad Pro 13-inch (M5) → 2064px / 2x = 1032pt   ← selected, expanded
[Passed] 01-launch-smoke (2m 14s)    [Passed] i01-ipad-boot (52s)    exit 0
```

`01` passing on a **1032pt** device settles [D30]'s carried hypothesis in the affirmative: the shared
tier's iPhone-tuned swipes clamp harmlessly on a wide iPad, exactly as hoped and explicitly not assumed.

⚡ **The width table is now measured fact, and it changes how "iPad" may be said:**

| class | devices | pt | layout |
|---|---|---|---|
| 13-inch | Air 13 (M2/M3) · Pro 13 (M4/M5) | 1024–1032 | **expanded** |
| 11-inch | Pro 11 (M4/M5) | 834 | regular |
| 10.9″ | iPad (A16) · iPad (10th) · Air 11 (M2/M3) | 820 | regular |
| mini | iPad mini (A17 Pro) | 744 | **compact — the PHONE layout** |

⚠️ **Only 13-inch iPads are `isExpanded` in portrait.** Every `[D30]` check about master-detail or the
inline sheet is a claim about *those two sizes*, not about "iPad". And **iPad mini renders the compact
layout** — a tablet getting the phone UI, which is a product question nobody has asked → filed to the
cohesion gate.

### The iPhone lane lost the whole cycle to a driver stall

`iOS driver not ready in time` at 240 s, **before a single flow ran** — build included, ~35 minutes for
zero information. The iPad tier started its own driver minutes later on the same runner and came up fine,
so this is the known cold-sim flake rather than anything new.

Two fixes, and the second is the one that matters:
- Timeout 240 s → **420 s**.
- **A retry bounded to the driver-startup signature.** ⛔ Never on a red flow: a blind retry would double
  the cost of every genuine failure and re-run flows whose `clearState` ordering is load-bearing. Matching
  the message keeps it to the one case that is safe to repeat.

### ⚠️ And my own diagnostic was lying by omission

`grep -F "[coach-probe]" … | tail -40 || echo "(no probe lines)"` — the `||` guards the PIPELINE, whose
status is `tail`'s, and `tail` always succeeds. So the fallback never fired: the step printed a header and
nothing at all, which reads exactly like *"the app logged no probe lines"* when in truth nothing had been
searched, because no flow had run. Fixed with `set -o pipefail`.

⚡ **Same family as the defect this lane exists to catch** — a check that cannot say "I found nothing" is
indistinguishable from a check that found nothing.

## 4.1.4c — the payoff-schedule mark: measured against a position it never occupies (2026-08-13)

### ⭐ The probe named it, and arithmetic confirmed it

```
hook:payoff-schedule ready=1 registry=1 · layout:payoff-schedule
show:payoff-schedule=ACCEPTED
measure:payoff-schedule=400x48@20,1702      ← on a 440×956 screen
draw:payoff-schedule=DREW nested=1
```

The mark was offered, accepted, measured and **drawn** — the nested host (3.5.5.5) worked perfectly. It
drew at `max(insets.top + 8, 1702 − 132) ≈ 1570pt`, entirely off-screen, which is why `coach-mark` was
absent from a hierarchy dump that carries only on-screen nodes.

⚡ **`use-sheet-presentation.ts:112` explains 1702 exactly:**
`translateY: interpolate(progress, [0,1], [sheetH, 0])`. The sheet enters translated down by its **own
full height**. The footer row seats near y≈880; the sheet is ≈820 tall; 880 + 820 = **1700**. The measure
was taken at `progress ≈ 0` — the first frame of the entrance spring.

⛔ **So it is a TIMING defect, not a layout one, and two stale comments sent me the wrong way first.**
`coachMarkCopy.ts:25` still says the control "is currently off-screen … not registered anywhere until L5
puts the row where a finger can reach it", and flow 04's note describes the row as "the last child of the
sheet's ScrollView". **Both describe a layout that no longer exists** — [L5] moved it to
`footerAccessory`, pinned, precisely so it could not be off-screen. I repeated both before checking the
component. *Docs that disagree with adjacent code manufacture defects* — Wave A's lesson, a third time.

⚡ **The real shape: `onLayout` answers "does this exist", never "has this arrived."** It is the same
error `use-coach-mark` already corrected once when it replaced a 600 ms mount timer with the layout
event — the right signal for existence, the wrong one for arrival.

### Fix 1 — re-measure on a STATED signal

`useSheetPresentation` now exposes `settled`, flipped by the entrance spring's own completion callback
(and `true` immediately under Reduce Motion, which snaps). `FormSheet` passes it to the nested layer as
`remeasureOn`, which joins the measure effect's deps. Not a delay — the animation says when it is done.

### Fix 2 — the once-ever record moves from OFFER to DRAW

`show()` no longer writes `coachMarksSeen`; the layer calls `markDrawn(id)` at the one moment it puts
pixels on screen, keyed off the same `DREW` verdict the probe prints — so the trace and the record can
never disagree. Idempotent, since the layer re-renders on every host/rect change.

⚡ **The intent the old placement protected is untouched:** recording still does not wait for a dismissal,
because *"a user who saw the hint and ignored it has been told."* What no longer counts is
drawn-into-the-void. `coachMarks.test.ts` now pins the new contract in three assertions, including the
one that was silently false: **an offer the layer fails to draw stays owed to the user.**

⚠️ Filed, not fixed: an undrawable mark stays `active`, and `show()` refuses while anything is active — so
one stuck mark can block the rest for a session. Pre-existing, not introduced here, and fix 1 removes the
only known cause → the cohesion gate.

## Run `31705617155` — both fixes WORKED; 08 fell at the final assertion, on a selector (2026-08-13)

**01–07 green. 08 reached §13.4, the last check in the file.** iPad tier green again: iPad Pro 13-inch at
1032pt, `01` and `i01` both passing, exit 0.

### ⭐ Three device-owed checks passed for the first time ever

- **§13.1** — the payoff-schedule callout renders **over** a presented Modal rather than behind it. That
  is the whole justification for the nested host (3.5.5.5), and it had never once been asserted on a
  simulator. **Fix 1 (re-measure on the entrance spring's completion) works.**
- **§13.2** — "Got it" dismisses it, and the dismissal survives a real `killApp` → relaunch. **Fix 2
  (record on DRAW) did not disturb the once-ever contract.**
- The hierarchy also confirms the a11y repair in the tree: `coach-mark-dismiss` is now its own node
  carrying `accessibilityText: "Got it"`, where the card used to be a childless leaf.

### §13.4 — the mark was ON SCREEN and the assertion still failed

```
show:trajectory-scrub=ACCEPTED · measure:400x333@20,625 · draw=DREW · record:trajectory-scrub
hierarchy: coach-mark at [16,493][424,635]
```

Drawn, on screen, recorded. The assertion failed because the callout exposes **one composed label** —
`"Drag the curve. Scrub any month to see what you owe and when you land."` — and §13.4 asserted the bare
title. **Maestro matches literal equality or a FULL regex, never "contains."**

⚡ **This file documents that rule twice, and §13.4 still had the wrong form** — because it had never
executed. Its two siblings (§13.3, §13.1) already use `.*…*` wrappers. A rule written down is not a rule
applied; only running the check applies it. ⚠️ Not a regression from the a11y fix either: the composed
label previously lived on the card, so a bare title could never have matched there either.

Fixed with the wrapped form. Flow-only, so the `.app` cache hits.

### 🎯 The iPad tier goes dormant between investments

Jason: *"there's no reason to continuously add another ~8 minutes to the build if it's green."* Agreed —
and it costs nothing to arrange, because [D30] made device a **workflow input**: dropping `-f device=both`
selects the `iphone` default with no workflow edit, so the `.app` cache is untouched.

⚠️ **With a stated trigger, because "until there's a need" is how this suite rotted the first time.** Run
`device=both` whenever a change touches a width-branching surface — `use-layout.ts`, `sizeClass.ts`,
`MasterDetail`, `TwoColumn`, `FormSheet`'s inline-pane path, and the seven `isExpanded` sites across
Today / Money / Progress / More — and for the whole of 4.1.5, whose named items *are* the iPad checks.
⚡ Also honest: `i01` asserts nothing device-specific by design, so today the tier costs 8 minutes for a
boot check. It earns regular runs once 4.1.5 gives it §11.15, §10 and §11.16.

## ⭐ Run `31709717569` — 8/8. THE LANE IS GREEN (2026-08-13)

```
01 1m46s · 02 19s · 03 14s · 04 49s · 05 54s · 06 57s · 07 3m25s · 08 1m34s   |  cache-hit: true
draw:debt-row-actions=DREW  nested=0   record:debt-row-actions
draw:payoff-schedule =DREW  nested=1   record:payoff-schedule
draw:trajectory-scrub=DREW  nested=0   record:trajectory-scrub
```

**All three coach marks draw and record**, including `payoff-schedule` at `nested=1` — the nested host
(3.5.5.5) doing the exact job it was built for, proven on a simulator for the first time. §13's six checks
come off the manual device checklist.

### What 4.1.4c actually cost, and what it bought

Eight dispatches over two days. **Three shipped product defects**, each invisible until the one before it
was fixed:

1. **The suppressor was held by a MOUNTED tab.** Today never unmounts, so while it carried an ack,
   celebration or pending walkthrough invitation, coach marks were suppressed **app-wide** — the discovery
   layer was dead for every newly-onboarded user, which is precisely its audience. Five mechanisms were
   asserted and refuted before the probe printed `refused(suppressors=1)`.
2. **`accessible` on the callout collapsed its subtree**, so the dismiss control was neither focusable nor
   activatable. **VoiceOver users could not dismiss a coach mark.** WCAG 2.2 AA is this app's stated floor.
3. **The subject measured mid-entrance** — y=1702 on a 956pt screen, because the sheet enters translated
   down by its own full height — so the callout drew off-screen while being recorded as seen.

⛔ **None was reachable by reading.** #1 survived five reasoned mechanisms, two audit passes and three
green web specs; #2 could not exist as an observation until #1 was fixed; #3 could not until #2 was.

⚡ **And the honest other half: roughly a third of the cycles went to MY instrument bugs**, not the app —
the probe asserted below the fold when `scrollUntilVisible` was already in three flows; the iPad step
skipped itself on an implicit `success()`; the picker matched a *chip* name; a boot-everything loop ate
the 60-minute timeout; `mainScreenScale` parsed as a float; and a `grep | tail || echo` could not report
"found nothing". Every one shares a shape, now written down: **I kept authoring the instrument for the
world in which the thing it measures already works.**

⚡ **The one change that ended it** was making the probe survive being unreachable — writing the trace to
the unified log as well as the screen, and keeping a log stream alive for the whole suite rather than the
first 25 seconds. From that run on, every fix landed first try.

### 🎯 Two calibrations from Jason worth keeping

- *"I wouldn't make changes until you can verify from the error log."* — saved a cycle outright: all three
  flow edits I had staged used `tapOn: "Got it"`, and the artifact proved that could never have worked.
- *"One missing haptic isn't going to make or break the app."* — the coverage split was made on
  **automatability**, never on **consequence**. Those are different axes and only one is tracked → 4.1.11.

### Where the manual checklist stands

§13 (6) and §14 (6) are now automated, plus the tutorial walk and interactions. ⚠️ Still device-owed and
genuinely so: §13.6's "VoiceOver hears each hint ONCE" (counting matching elements is unproven → probe
p06) and §13.4's judgement half (does the hint bury the chart). 🎯 *"Haptics etc. can only be tested on
device"* — agreed, and the split that survives is **whether it fires** (assertable) versus **whether it
feels right** (yours).

## 4.1.5.2 — §11.15's ring-origin invariant, and two premises that did not survive the switch-in (2026-08-13)

The checklist calls §11.15 its highest-value item and says the fix is *"guarded by NOTHING"*. The plan's
answer was one line: *"as numeric frame containment, from the first expanded-iPad hierarchy dump."*
**Neither half of that sentence was true**, and both were cheap to check.

### ⛔ Premise ① — there is no hierarchy dump

Maestro writes a view-hierarchy dump only on a **failed** command, and `i01-ipad-boot.yaml` passed. Run
`31705617155`'s `maestro-debug-ipad/` is five PNGs, `commands.json`, `maestro.log` and
`device-xctest.log` — and `grep -c '"frame"\|"bounds"'` returns **0** on all three text files. The
evidence 4.1.5.2 said to derive numbers from is a set of screenshots.

⚡ The general form is worth keeping: **a passing measurement flow produces less evidence than a failing
one.** `i01` was deliberately written as a measurement rather than a check, and the artifact it yields on
success is the *weaker* one. Anything that needs the hierarchy has to make the run fail, or get the
numbers from the app.

### ⛔ Premise ② — "numeric frame containment" is Appium's capability, not Maestro's

The phrase came from this log's own **Appium** scoping (§4.1.9: *"`rect`/`frame` are exposed element
attributes"*), and the plan already lists §11.15-as-frame-containment under 4.1.9. Maestro's flow language
has no element-frame access — `evalScript` sees `output` and `maestro.copiedText`, not the hierarchy — so
as written the item imported a capability its tier does not have, and duplicated an item three rows below
it.

**This is the ledger failing in the documented direction**: reliable about *where* to look (§11.15 really
is unguarded, and the iPad tier really is the only place it can be held), unreliable about *what is there.*

### What was built instead — the overlay measures its own ring

🎯 Jason chose the app-side instrument over deferring to Appium: it guards the item this phase and reuses
the pattern that ended five rounds of refuted coach-mark theories.

`TutorialOverlay` now measures the **rendered** ring in window space and compares it with the subject's
own window rect, publishing `tutorial-ring-audit-ok` / `-off` plus the numbers as text.

⛔ **It is not a recomputation of the correction.** Asserting `origin + (spotlight − origin) === spotlight`
is algebra and passes whatever the layout did. The two numbers compared here are independent: where the
layout system actually placed the ring (`measureInWindow` on a host `View` child of it) against where the
registry measured the subject. Remove the correction and the first moves by a sidebar width; the second
does not.

Four things the build had to get right, each of which would have produced a green that meant nothing:

- **A host `View`, not the `Animated.View`.** Whether Reanimated's wrapper ref exposes `measureInWindow`
  is not a question worth a CI cycle. `collapsable={false}` on it for the reason the overlay root already
  carries it — Android's flattener removes exactly this shape, and a flattened probe reports nothing while
  looking like a pass.
- **The measurement is STAMPED with the ring's key.** The ring's remount key is its rounded rect, so a new
  subject remounts the probe and re-measures; without the stamp, a beat change could leave the *previous*
  beat's verdict on screen, green.
- **Y is exempt when the stage clamped.** Beat 5's subject (~697pt) is taller than the stage (~530pt) and
  the ring is deliberately cut at the dock. X is never clamped, so X carries the assertion and the readout
  prints `clampY` when Y is excused. Judging both would have gone red for the overlay behaving correctly.
- **⭐ The readout prints `org`.** `d 0,0` proves nothing alone — it is exactly what a build with *no*
  correction reports on a phone, where the origin is already {0,0}. `org 360,0` beside `d 0,0` can only
  both be true if the subtraction ran. It also states plainly which tier can hold §11.15: on the iPhone
  lane this prints `org 0,0` and the X assertion is vacuous by construction.

**Not on web** — react-native-web puts the origin at 0 at every width, so the assertion would pass either
way there (defect class ①). **Android is in**, because the flattening/status-bar hazard is the same defect
in a different hat.

⚠️ **Deliberately NOT `{...decorative}`.** `aria-hidden` maps to `accessibilityElementsHidden` on iOS and
Maestro reads the XCUITest accessibility tree — hiding the readout from VoiceOver would hide it from the
only thing that checks it. Cost: a QA build speaks one extra line during §11's VoiceOver pass. It leaves
with `QA_TOOLS`, and belongs in the Phase-6 flip's `git grep` alongside the coach-mark probe.

### The flow, and why it is in both tiers unequally

`05-tutorial-walkthrough.yaml` gains the audit assertions at beats 1, 2 and 5, and **joins the iPad list**
(`01 → i01 → 05`, ordered so the measurement flow keeps its clean position). `assertNotVisible` on the
failing id sits beside `assertVisible` on the passing one — the ids are mutually exclusive by construction,
so this distinguishes *"the invariant held"* from *"the audit never rendered"*, which are different
findings behind the same green.

⚠️ **The iPhone pass is not coverage of §11.15** and the flow says so at the assertion. Reading it as
coverage would be the "assertion that passes either way" this repo has already paid for.

### `lint:selectors` could not see a chosen id — fixed, and re-proven

The guard's first output was three false positives: both of its patterns require a quote immediately after
`testID=`, so `testID={ok ? 'a-ok' : 'a-off'}` matched neither. Same failure as the `tabBarButtonTestID`
case the file already documents — right that it could not see them, wrong about what that meant. It now
also pulls quoted literals out of a `testID={…}` expression container (a template-literal id is composed at
runtime and is correctly still skipped). **Re-proven to fail** on a planted unknown id before being
trusted, per T2's rule: 54 testIDs known, and `tutorial-ring-audit-nope` still reds.

### ⚠️ What is still owed

**The planted-defect proof.** Nothing here has run on a simulator yet, and the check is native-only, so the
usual local "prove it fails first" is not available. The order that costs the same and teaches more: run
**with the correction deleted first** — if that comes back `-ok`, the instrument is broken and it is better
to learn that before trusting a green — then restore and run again. Two cycles, ~20 min each, because a
`src/**` change busts the `.app` cache both ways.

### 4.1.5.3–4.1.5.5 before-scan — three more premises, and two defects the screenshots were already carrying

Read off run `31705617155`'s iPad frames, which had been sitting in the artifact since 4.1.5.1 closed.

- ⛔ **"More's two-column" does not exist and was never specified.** `ipad-05` is a single centred settings
  column, and **§10's own text says so** — *"More = a wider centered settings column."* C6 (*"iPad More
  two-column"*) is a Wave-C **aspiration**; the plan had promoted it to a *check*. A flow written from that
  row would have asserted behaviour the app has never had. → whether it *should* be two-column is a
  decision for the audit gate.
- ⛔ **4.1.5.5's "rotation is an unproven command" is stale.** `setOrientation` PASSED in 4.1.1 cycle 2
  alongside `extendedWaitUntil`, `evalScript`+`assertTrue`, `assertScreenshot` and `repeat`. The block had
  outlived the probe that cleared it — and it was also gating 4.1.5.4, which needs a landscape frame.
- ⚠️ **§11.16 is a judgement, not a check.** The checklist asks whether the crop *"reads as a deliberate
  crop or as a rendering fault"*. Automating it can only mean producing the landscape frame; a pass/fail
  here would be a check invented to be passable.

⚡ **And two things the frames show that nothing was looking for.** Both concern `CoachMarkLayer`, which
4.1.5.2's ring audit does **not** cover:

1. **The `trajectory-scrub` mark survives a route push.** The same *"Drag the curve"* card is in
   `ipad-04-progress` (subject present) **and** in `ipad-05-more-two-column`, lying across the More
   settings list where its subject does not exist. ⚠️ **Recorded as an observation with no mechanism.**
   This is the exact component in which five mechanisms were asserted and four refuted; the rule that came
   out of that is *probe it, do not reason at it.* Not obviously iPad-specific — More is a pushed route on
   both layouts.
2. **It is drawn in WINDOW space on the expanded iPad**, starting at the window's left edge and lying
   across the **sidebar rail**, while its subject is entirely inside the content column. That is §11.15's
   coordinate-space failure wearing a different component's name.

⚡ The pattern across 4.1.5 so far: **five stated premises checked, four wrong** — and the two findings that
matter most this session came from *looking at an artifact that had already been produced*, not from
running anything new.

### The caching batch, measured — and it was pointed at 6% of the job (2026-08-13)

🎯 Jason: *"I want to start adding additional caching to the next run as well since we've gotten green
across the board."* Right moment — a workflow edit busts the `.app` key (rule ① hashes this file), and the
next run rebuilds anyway. Wrong batch, as it turns out.

**Step durations, run `31709717569` — a `.app` cache HIT, total job 1326s (22m06s):**

```
650s  49%   Run Maestro flows
529s  40%   Boot, install, launch, capture the app log     ← nothing had ever costed this
 59s   4%   Install dependencies (root + apps/rn)
 22s   2%   Install Maestro (+ idb)
```

⛔ **`~/.maestro`'s filed "measured 1m29s/run" is refuted — it is 22s.** The batch's two speed items total
**81s of 1326s**, and caching can recover only a fraction of that. ⚡ **The step nobody had measured is 6.5×
both of them combined.**

⚡ **The pattern, and it is the same one 4.1.5's before-scan produced twice today: the numbers that get
optimised are the numbers somebody wrote down.** 17m03s was measured, so the `.app` cache got built and
was worth it. 1m29s and "npm install" were the next two written down, so they became the batch. 529s was
never written down, so it was never a candidate — despite being second-largest in the job.

**What was folded in:**

- ✅ **`cache: npm` on `setup-node`** — the one item that survives its own measurement (59s, and
  `--prefer-offline` can only honour the flag if `~/.npm` is populated). ⚠️ **Both lockfiles** in
  `cache-dependency-path`: there are no workspaces here, so naming one produces a key that does not move
  when the other does — the `.app` key's rule ① failure, one tier down. ⛔ Caches the npm *download* cache,
  not `node_modules`: `apps/rn/package-lock.json` is known out of sync, and caching a resolved tree against
  a lockfile that does not describe it is how a build gets dependencies nobody chose.
- ✅ **The 529s step now says where its time goes** — `⏱` laps at device-picked / boot-returned /
  bootstatus / installed / launched / up, plus `simctl bootstatus -b` so the boot wait lands on the boot
  line instead of leaking into whatever runs next.
- ✅ **The flat `sleep 25` is now a poll on the app's own log signal** (`Running application` /
  `RCTContentDidAppear`) with 25s as the ceiling — [[replace timers with stated signals]]. The
  fallthrough is deliberate: if the predicate never matches it behaves exactly like the old sleep and
  still takes the screenshot, because that frame is the diagnostic for the case where the app did not
  come up.

**Not built, with reasons rather than silence:** `~/.maestro` (22s, and it pins the version by accident) ·
**DerivedData** (the largest theoretical win for the `src/**` loop we are actually in — and multi-GB
against GitHub's 10GB per-repo cap, where LRU eviction could take out the 17MB `.app` cache that is saving
17m03s: the optimisation eating the optimisation) · the **nightly / path-filtered trigger**, which is not a
speed item at all — it is rot-prevention, on a `macos-15` runner at a 10× minute multiplier.

### The rot guard — path-filtered, and the two things it does not cover (2026-08-13)

🎯 Path-filtered over nightly: it fires when what it guards moves and costs nothing on the days it does
not, which matters on `macos-15` at a 10× minute multiplier. The lane's real failure mode was never going
red — it was going green by never running, and it has been dispatched by hand all through 4.1.

**Two hazards found while building it, both stated in the file rather than left to be discovered:**

⛔ **A push would have cancelled a manual investigation run.** `concurrency: native-e2e-${{ github.ref }}`
with `cancel-in-progress` plus a push trigger means a routine commit kills a dispatched run on the same
branch. Not hypothetical: three commits landed on `v1.7-dev` today while a dispatched run was mid-build,
and the third touched the workflow file — under a shared group it would have been cancelled **by its own
rot guard**, throwing away the ~17 minutes it had already spent. Fixed by scoping the group on
`github.event_name`, which keeps "supersede the previous push" and leaves a deliberate run alone.

⛔ **`paths:` applies to the tag trigger too, and GitHub cannot express "tags unfiltered, branches
filtered" in one `push:` block.** A tag pushed onto an existing commit carries no changed files, so the
release-gate trigger may now never fire. **Accepted, having checked what it was worth: all 40 runs of this
lane to date are `workflow_dispatch`** — the tag gate has never fired once, and Phase 6 is a human pressing
the button. It was a decorative safety net; the rot guard is a working one. If the tag gate is ever made
load-bearing it needs its own workflow, not a `paths` tweak.

⚠️ **And the guard does not cover the iPad tier.** No push supplies inputs, so `inputs.device` is empty and
automatic runs execute flows 01–08 only — `i01`, flow `05`'s iPad half and §11.15 can still rot
green-by-never-running. Closing it means defaulting pushes to `both` (≈10 extra minutes every automatic
run) or promoting the tier once it stops being a measurement lane → **4.1.11**.

⚠️ **What a path filter structurally cannot see:** rot from outside the repo — an Xcode image bump, a
Maestro release (the installer fetches latest every run), a simulator runtime change. That is the nightly's
one genuine advantage, and it is the same argument as pinning Maestro. Both → 4.1.11.

## Run `31716361639` — §11.15's mechanism is gone, and the check's first red was mine (2026-08-13)

**Both tiers red at `tutorial-ring-audit-ok`**, which is the outcome that says the *instrument* is wrong,
not the app. The readout said which, in one line, on each tier:

```
iPhone   ring  16,407  subj  20,411   org 0,0   d 2,2
iPad     ring 384,369  subj 388,373   org 0,0   d 2,2
```

### ⭐ `org 0,0` on a 1032pt iPad — the correction is an identity

§11.15 has said since 3.5.6.2 that *"the tab bar becomes a left sidebar, which puts window and local
coordinates ~700pt apart"*, and that it was **"guarded by NOTHING"**. The first half is no longer true:
**3.5.3.5.7 moved the overlay to the ROOT, above the navigator, precisely so its scrim would cover that
rail** (`_layout.tsx:194`). An overlay spanning the window has its origin at the window's, so
`spotlight − origin` is `spotlight`, and the ~700pt regression **cannot occur in this arrangement.**

⛔ **A stale comment generated a work item, and the work item survived ten weeks of planning.** This is the
Wave-A defect class with a second measured instance — *"docs that disagree with adjacent code are not
cosmetic; they manufacture defects"* — except here the doc and the code did not visibly disagree: the
comment described a **layout** that a later commit had changed, which no amount of reading either file
catches. Only measuring `origin` catches it.

⚠️ **The correction is not dead code and was not deleted.** `origin` is measured at runtime, so it stays
correct if the overlay is re-nested, and Android's `measureInWindow` can include the status bar. What
changed is the *claim*: defence against re-nesting, not a fix for something the current tree can exhibit.

### ⛔ The first red was the instrument's, and the number named it

`d 2,2` — identical on both tiers **and** on both axes. `StyleSheet.absoluteFill` resolves against the
PADDING box, so the probe child of a 2pt-bordered ring sits 2pt inside its outer edge. A real
coordinate-space fault varies with the layout; a constant inset does not, and that is what identified it
without a second run. `RING_BORDER` is now a named constant read by both the style and the audit.

⚡ **This is the third of ~ten cycles in this lane spent on my own instrument** — and the cheap part is
that the trace was designed to survive being wrong: it printed `ring`, `subj`, `org` and `d` on a FAILING
assertion, so one artifact answered "is it broken", "which way", and "by how much".

### 🎯 The redirect that saved the run

Jason: *"wait, we're not running this against 1.7-dev?"* — I had dispatched the planted-defect branch
first. **That run would have gone green on both tiers** (with `org` at 0, deleting the correction changes
nothing), and I would have read green/green as *"the instrument is broken"* — the right conclusion for the
wrong reason, with the real finding still invisible. Running the shipping build first produced `org` **and**
the confirmation **and** the tolerance bug, in one 22-minute run.

**The general form, and it is now twice in one session:** the cheapest question was *"what is the number?"*,
and I had sequenced a *"does it fail?"* run ahead of it. **Ask the measuring question before the proving
question** — a proof against an unmeasured premise can only confirm the premise.

### What this leaves

- ✅ The instrument **works**: renders, measures, stamps, reports, and survives its own subject failing.
- ✅ The app is **correct** on both tiers — the beat-1 frame shows the ring tight on the Guardian card, and
  Today's two-column iPad layout renders as §10 describes.
- ⏳ The tolerance fix is pushed; the re-run is the confirmation.
- ⛔ **The planted-defect run is now pointless** and is not being spent: with `org 0,0` it cannot fail, so
  it would prove nothing. The bite proof would need a *different* planted defect — perturbing the ring's
  own offset rather than the origin correction → **fold into 4.1.11 if it is still wanted.**

## ✅ 4.1.5.2 CLOSED — run `31720514061`, 8/8 iPhone + 3/3 iPad (2026-08-13)

```
iPad   ring 384,369  subj 388,373  org 0,0  d 0,0
```

Zero offset, ring tight on the Guardian card in the beat-1 frame, both tiers green, zero failures. The
`RING_BORDER` fix was the whole of it.

⚠️ **What §11.15 now holds is NOT what it said it held.** With `org 0,0` the sidebar story is gone; the
assertion's value is that it pins the ring to its subject against *any* future coordinate-space change — a
re-nested overlay, Android's `measureInWindow` including the status bar, the stage clamp. Worth keeping,
worth describing honestly.

### The laps — the 529s step is 261s, and the wait was mine again

```
device picked          3s
boot returned          5s   (+2)
bootstatus complete   92s   (+87)   ← simulator boot
app installed        146s   (+54)
app launched         212s   (+66)   ← cold start of a Release RN app
app reported up      249s   (+37)   ⛔ the poll, and it never matched
step complete        261s   (+12)
```

⚠️ **529s → 261s, and I am NOT claiming the change caused it.** n=1 against n=1, on shared runners; the
laps are what make the next comparison meaningful, not this one.

⛔ **The `sleep 25` replacement failed, twice over.**

1. **The signal does not exist in this build.** `Running application` and `RCTContentDidAppear`: **zero
   matches across 3,590 lines.** This lane builds `-configuration Release` and RN's JS console lines do
   not survive it — something `native-e2e.yml:471` already half-states about the coach probe. ⚡ **The
   evidence was already on my disk**: the previous run's `os-log.txt`, downloaded an hour earlier. I
   asserted a predicate instead of grepping it. [[the codebase already said it]], one layer out — the
   *artifact* already said it.
2. **An iteration count is not a time bound.** `for i in $(seq 1 25)` with a grep over an 800KB log each
   pass cost **37s** — longer than the sleep it replaced. Now `until … [ $(date +%s) -ge $DEADLINE ]`.

⚡ **Measured replacement:** `RCTScrollViewComponentView` at **5.2s after launch** (16:43:20 → 16:43:25.241)
— a UIKit focus notice emitted once a scroll view is on screen. ⚠️ Incidental rather than a contract, so
the ceiling still governs and the fallthrough still takes the screenshot: a frame of a splash is the
diagnostic for the case where the app did not come up, and must not be traded for a faster green.

### ⚠️ Filed — the warmup step duplicates flow 01

`app launched` (66s) + the wait (5–25s) exist to produce `cold-launch.png` and an error grep. **Flow 01
then does its own `launchApp` and `extendedWaitUntil`, and takes `smoke-cold-launch` itself.** The
non-duplicated value is catching a cold-launch crash *before* Maestro, so a fatal JS error reads as an
error grep rather than a Maestro timeout — real, but not obviously worth ~70s. → **4.1.11.**

### The session's own pattern, stated because it repeated three times

**Every wrong thing today was a premise nobody had measured, and every one was cheap to measure:**
the hierarchy dump that did not exist · "numeric frame containment" that belonged to Appium · "More's
two-column" that §10 never asked for · `~/.maestro`'s 1m29s that was 22s · §11.15's ~700pt that had been
designed out · and twice, my own instrument (`d 2,2`, and a predicate with zero matches). ⚡ **Six of the
seven were answerable from an artifact already in the repo or already downloaded.**

### The route-push mark — reproduced on web in one local run (2026-08-13)

The iPad frames showed it; `probe-mark-route-push.spec.ts` proved it. Navigate Progress → More with the
`trajectory-scrub` mark up and **the mark is still visible over the settings list**, subject long gone.

⚡ **It cost nothing to reproduce, and the reason is the contrast that matters.** `debt-row-actions` is
`Platform.OS === 'ios'`, which is why it consumed five CI cycles and a bespoke five-stage probe.
`trajectory-scrub` is offered **unconditionally** (`progress.tsx:73`) — so the same class of defect, in the
same component, was answerable in Chrome in under a minute. **Before assuming a coach-mark question needs
the simulator, check whether THAT mark is platform-gated.**

⚠️ **The mechanism is still not diagnosed and this entry does not guess at one.** Four have been refuted in
this component already.

⛔ **The reproduction is `test.fail()`, deliberately.** The assertion states the correct behaviour, so the
gate stays green while the defect is open and **the test reds the moment it is fixed** — delete the marker
and it is the regression gate. A `skip` rots silently; a bare failure reddens the gate and gets muted.
This is the one shape that cannot become a lie in either direction.

## 4.1.5.3 — §10's layout checks, and the id that had to exist first (2026-08-13)

🎯 Both recommendations agreed: **C6 retired** (More stays a single centred column) and **the route-push
mark admitted as the next active build**.

### The gap was that nothing NAMED the branch

`i01` could not assert §10 because the adaptive layout published nothing to assert on. `TwoColumn` and
`MasterDetail` *are* the iPad layout, and neither carried a testID — so the only available check was "are
these two cards on screen together", which tests where content happened to land, not which layout ran.
That is the "assertion that passes either way" class, and this repo has already paid for it.

**Both branches are now named** — `layout-two-column` / `layout-stacked`, `layout-master-detail` /
`layout-detail-pane` — and naming the *compact* side is the point: `02-sheet-native-tap.yaml` is
iPhone-only by design, so it asserts `layout-stacked` and `assertNotVisible: layout-master-detail`.
⚡ **That is the discrimination proof running in the suite on every run, rather than a human comparing two
screenshots once.** A single id would have been half a check.

`i01` now asserts the split, the detail pane, and `"Select a debt to edit, or add one."` — copy that lives
inside `money.tsx`'s `isExpanded` branch and **cannot exist on a phone**. The flow stops being a
measurement and becomes coverage, which retires its own disclaimer (4.1.5.6, folded in).

⛔ **The sidebar rail is still NOT assertable.** `tabBarPosition: isRegular ? 'left' : 'bottom'`
(`(tabs)/_layout.tsx:59`) with identical testIDs either way — a position-only difference, and Maestro
cannot read a frame. Same wall as §11.15's original framing. → Appium (4.1.9) or never; stated rather than
quietly dropped.

### ⚠️ Caught before it cost a run — `MasterDetail`'s compact branch is unreachable

The first version asserted `layout-single-pane` on the iPhone. It would have red: `money.tsx:402` decides
`isExpanded ? <MasterDetail…> : <>{list}{editor}</>`, so on a phone the component **never mounts** and its
own `!isExpanded` check is a second owner of a rule already decided above it — *"two places, one rule"*,
the shape Wave A hit three times. The testID was removed rather than left advertising coverage of a path
nothing can reach, and the compact side asserts the negative instead.

Gate **168/168** *(167 + the `test.fail()` route-push reproduction)*, tsc clean both trees.

### The poll fix worked, and the second laps reading refuses DerivedData (2026-08-13)

`RCTScrollViewComponentView` matched well inside the ceiling: **`app reported up` +37s → +11s.** The step
now detects readiness instead of silently timing out; ~26s cheaper is the side effect, not the goal.

| lap | `31720514061` | `31725219145` |
|---|---|---|
| bootstatus | 87s | 104s |
| install | 54s | 96s |
| launch | 66s | 22s |
| **wait** | **37s** | **11s** |
| rest | 17s | 31s |
| **total** | **261s** | **273s** |

⚠️ **Totals are stable; composition is not.** Install swung 54→96s and launch 66→22s on shared runners —
so a single-lap comparison is noise, and anyone optimising against one reading will be chasing variance.
That is the main reason to have taken two.

⛔ **DerivedData REFUSED (🎯 agreed).** **~70% of the step is boot + install, which DerivedData cannot
touch**; it helps the compile alone, and the compile is already covered by the `.app` cache for flow-only
iteration — which is what every remaining 4.1.5 item is. Against a benefit that small: multi-GB in a 10GB
per-repo cap, where LRU eviction could take out the 17MB `.app` cache saving 17m03s.

⚡ **The whole caching batch, closed out by measurement rather than by intuition:** one item folded in
(`cache: npm`), one refuted (`~/.maestro`, filed at 1m29s, measured 22s), one refused (DerivedData), one
built with its hazards named (the rot guard). **The step that turned out to matter most was not on the
list**, because nobody had costed it.

## ✅ 4.1.5.3 CLOSED — run `31728370881`, 8/8 iPhone + 3/3 iPad (2026-08-13)

The paired assertions hold in both directions in one run: `layout-two-column`, `layout-master-detail`,
`layout-detail-pane` and the empty-state copy pass on the expanded iPad, while iPhone-only `02` passes
`layout-stacked` and `assertNotVisible: layout-master-detail`. **`i01` is coverage now, not a
measurement** — its disclaimer retires with it (4.1.5.6 folded in).

⚠️ **A 6× outlier worth keeping.** That run's boot step was **547s**, with `app launched` alone at
**+384s** against 22s and 66s in the two prior readings — same code, same step. Nothing was changed that
could explain it. ⚡ It is the strongest evidence yet that **single-run comparisons in this lane are
noise**, and it is why the ccache experiment was built behind an input rather than as a before/after.

## The ccache experiment — cold run `31730150194`

**131 pod xcconfigs patched**, the zero-match guard did not fire, and `Build for the iOS Simulator` came
back at **593s against a 771s baseline.**

⛔ **That number is not evidence and must not be reported as a win.** A COLD ccache should be neutral or
slower — it is writing the cache, not reading it. 593 vs 771 is most likely the same runner variance the
boot step just demonstrated at 6×.

⚠️ **And there is a way this run is a silent no-op that the wall-clock cannot rule out.** The guard proved
the xcconfigs were *patched*; it did **not** prove Xcode *honoured* `CC`. If the setting was ignored, the
build compiled with the default clang, everything passed, and 593s means nothing at all. `ccache -s` is
the only thing that separates those — thousands of cacheable calls versus ~0 — which is why that step runs
`always()`. ⚠️ `brew install ccache` also printed *"Would install 1 formula"* under a tap-trust warning,
which is a second reason to read the stats rather than the clock.

**The decision waits on two numbers: the hit rate, and a WARM build.** Nothing adopts on one run.

## ⛔ ccache — CLOSED by measurement. It cannot cache this build at all (2026-08-13)

Two runs on `perf/ccache-pods`, and the verdict is not a trade-off, it is a wall.

| run | config | build | ccache |
|---|---|---|---|
| baseline `31720514061` | modules ON, no ccache | **771s** | — |
| `31730150194` | modules ON + ccache | 593s | **0/648 cacheable** |
| `31733238482` | modules **OFF** + ccache | **888s** | **0/648 cacheable · "Could not use modules 647/648 (99.85%)"** |

⭐ **`-sv` named the reason, and it refuted BOTH stated mechanisms — mine and the July note's.** That note
said ccache *"conflicted with Xcode 26's **explicit** modules"*. Turning `CLANG_ENABLE_EXPLICIT_MODULES=NO`
changed **nothing**: still 647/648 rejected with *"Could not use modules"*. The blocker is **modules at
all** — React Native's pods compile with implicit `CLANG_ENABLE_MODULES`, ccache declines those by design,
and disabling modules outright is not available because RN's Objective-C depends on them.

⛔ **And the wrong diagnosis cost time to hold: 888s against a 771s baseline.** Giving up explicit modules
surrendered real module reuse and bought zero cacheable compilations. ⚠️ **My own recommendation was
optimistic and wrong** — I estimated a large win from a warm cache; the measured ceiling is zero, because
there is no warm cache to be had.

**What WAS proven, and is worth keeping:** the wiring was exactly right. ccache saw **648** invocations —
matching the documented *"648 of ~650 CompileC tasks are pods"* precisely — so scoping via the generated
Pods xcconfigs captured the correct set and never touched the widget target that broke it in July. The
mechanism was sound; the premise underneath it was not.

⛔ **`sloppiness=modules` is refused, not overlooked.** It would let ccache cache them by ceasing to hash
module contents — the stale-binary hazard the `.app` cache's rule ② was written to prevent. A faster build
that might be the *wrong* build is not a trade this lane makes.

### So 771s is the floor, and the branch stays unmerged as the record

The one remaining avenue is **prebuilt pod binaries** (RN already does this for its core via
`RCT_USE_PREBUILT_RNCORE=1`; extending it to the rest would stop them being compiled at all rather than
trying to cache the compilation). That is a substantial dependency-packaging change, not a CI tweak →
filed, not scheduled.

⚡ **The session's pattern held to the last measurement: five stated mechanisms today, and the ones that
arrived with the most confidence were the ones that were wrong.** The `.app` cache remains the real win
(17m03s → 2s on flow-only iteration), and flow-only iteration is what the remaining 4.1.5 items are.

## ⭐ The `.app` cache was hitting 8% of the time — split it, and re-bundle the JS (2026-08-13)

🎯 *"Let's move forward now with prebuilt pod binaries. It will pay off quickly with how many CI builds we
run."* The instinct was right and the measurement redirected the means.

**Measured across the last 13 non-cancelled runs: 12 paid the full 771s build. Exactly ONE hit the cache.**

⛔ **4.1.3a's headline is therefore overstated and is corrected here.** It calls the `.app` cache *"the
whole 4.1.4→4.1.11 loop"* and prices it at 17m03s → 2s. Both numbers are true; the premise underneath them
is not. It assumed the loop is flow-only YAML iteration. **The loop is 92% `src/**`.** The saving was real
and almost never collected — the same shape as every other number this session: authored once, believed
after, never re-measured.

### Why prebuilt pods was the wrong lever, and this is the right one

`apps/rn/src/**` and `packages/core/**` were in the cache key, and **neither reaches a line of native
code.** They are TypeScript. They change `main.jsbundle` — a RESOURCE inside the .app. So a one-line copy
edit was recompiling **648 identical pod targets**.

Prebuilt pod binaries would have attacked those 648 compilations, kept the app-target compile and link,
required a CocoaPods plugin inside a Podfile that `expo prebuild` regenerates every run, and taken on
New-Architecture/codegen/`use_frameworks!` interactions. **Removing two JS-only paths from a cache key
avoids the entire build instead, on the 92% case, with no dependency-packaging change at all.**

### The hazard this creates, and the guard

A cache keyed without `src/**` that did NOT replace the bundle would run the JavaScript from whenever the
binary was built and **go green against stale code** — rule ②'s stale-binary hazard wearing a different
hat. So the re-bundle lives INSIDE `appverify`, keeping `usable` the single gate every downstream `if:`
reads (one rule, one owner), and **every failure path ends in `usable=false` and a full build.** There is
no branch that proceeds on doubt. Six of them:

- the .app has no `main.jsbundle` → **the swap premise itself is wrong**, so full build. Asserted rather
  than assumed, because there is no macOS here to check it;
- `expo export:embed` fails, or produces an empty bundle;
- ⛔ **the bundle's MAGIC BYTES differ from the one already in the .app** — Hermes ships bytecode, and a
  plain-JS bundle inside a Hermes app is a launch crash twenty minutes downstream reported as a Maestro
  timeout. Comparing against what the binary already contained asserts "same format this binary expects"
  without the workflow needing to know which engine is configured;
- the swap itself fails.

The bundle's sha is printed `old → new` every run, exactly like the binary's provenance (rule ③): an
unchanged sha is legitimate (a `.maestro/**`-only run produces identical JS), but it is the one number that
says which JavaScript is about to be tested.

⚠️ **`assets/**` deliberately stays in the native key** — asset files are copied into the .app by the
native build and the re-bundle does not sync them, so an asset change must bust the binary. `index.js`,
`metro.config.js` and `babel.config.js` stay too, conservatively: they are JS-only, they change rarely, and
a needless full build is a cost while a wrongly-skipped one is a defect.

⛔ **Caught before it ran: `[ "$OLD_SHA" = "$NEW_SHA" ] && echo …`** would have failed the step on every
successful fast-path run. GitHub runs `run:` under `bash -e`, so a `&&` chain whose test is false returns 1
— and false is the NORMAL case here, since the shas differ whenever any JS changed.

## ✅ 4.1.5.4 — the route-push coach mark. Probed, refuted, fixed (2026-08-13)

⛔ **The probe refuted my mechanism before I could build on it, which is the whole reason it exists.** I
expected a STALE RECT: subject unmounts, nothing re-measures, layer draws at coordinates for a screen that
is gone. The reproduction printed the opposite —

```
on Progress — mark @ y=454 · subject nodes=1
on More     — mark visible=true @ y=454 · subject nodes=1
STAGE: subject STILL PRESENT · rect UNCHANGED
```

That would have been the **fifth** mechanism asserted at `CoachMarkLayer` and the fifth refuted. It cost a
43-second local run instead of a 22-minute CI cycle, because `trajectory-scrub` is offered
**unconditionally** while `debt-row-actions` is `Platform.OS === 'ios'`.

⚠️ **And I discounted half of my own probe.** "Subject still mounted" cannot be trusted as evidence about
native: this log already records that **RN-web leaves the previous screen painted while a simulator renders
only the focused tab.** What holds on both platforms is narrower and sufficient — *the mark rendered*, and
the layer cannot render without `active` being set. That named the stage without the DOM's mount count
being load-bearing.

### ⚡ It is 4.1.4c's defect ① again, on the other side of the same boundary

Defect ① was a **suppressor** held by a MOUNTED tab — Today never unmounts, so an ack suppressed coach
marks app-wide. It was fixed by gating on `useIsFocused()`. **The offer was left on mount semantics**, so
the identical confusion — *mount ≠ visible* — survived in the mark itself. `CoachMarkLayer` is mounted at
the ROOT, above the navigator, so a pushed route changes nothing it can see: only the HOST screen knows it
has stopped being the one you are looking at.

**A class fix was applied to one instance and not swept.** Same shape as "two places, one rule", and the
same cost: the second instance shipped.

**The fix:** `useCoachMark` gains a focus gate that `dismiss()`es its own mark on blur.
- `dismiss()`, not `suppress()` — suppressors are a COUNT held by something mounted and owe a matching
  release, which is exactly what made ① app-wide and undebuggable. This is one-shot.
- Nothing is lost by standing down: the once-ever record is written by the LAYER on `DREW` (4.1.4c moved
  it there from OFFER), so a mark that reached the screen is already recorded as seen, and one that never
  drew keeps its turn.

### ⭐ `test.fail()` paid for itself in a single session

The reproduction carried it for the few hours the defect was open, and Playwright reported **"Expected to
fail, but passed"** the moment the gate landed. Marker deleted, assertion unchanged, and it is now the
regression gate. A `skip` rots silently; a bare failure reds the gate and gets muted. **Gate 168/168.**

⚠️ **Still owed:** the iPad's window-space half — the mark drawn across the sidebar rail while its subject
sits in the content column. Not touched by this fix, and it needs its own evidence → 4.1.5.4.4.

## 4.1.5.5 — the iPad callout's other axis, fixed without a native run (2026-08-13)

🎯 *"Let's go as far as we can without pushing a native build."* Everything below is local: two Playwright
probes at an iPad viewport, the gate, and a flow authored ready for the next batch. **Gate 169/169.**

### ⭐ One axis was anchored to the subject and the other to the window

`probe-mark-ipad-rail.spec.ts` at 1194×834, before any explanation:

```
subject column: x=388..1166
mark          : x= 33..1161      ← the full window
⇒ the hint about the trajectory chart started 355px LEFT of its subject
```

The cause reads off the code the moment the two axes are put side by side: `top` was derived from `rect`
with real care — below the subject when there is room, above it otherwise — and `left`/`right` were `0`.
**On a phone that is invisible**, because the subject spans the full width and the two answers coincide.
It took an iPad width to separate them, which is exactly why it shipped.

Fixed by deriving the horizontal band from `rect` too, widening evenly when a narrow subject would squeeze
the sentence into a ribbon, with `spacing.base` as the floor. ⚠️ `wrap`'s static `paddingHorizontal` was
REMOVED in the same edit — left in place it would have doubled the gutter on every phone, which is the
kind of regression a fix aimed at iPad quietly ships.

⚡ **Second defect in a row where the mechanism was in the diff and not in my head**, and both were
reproduced in Chrome in seconds because `trajectory-scrub` is offered unconditionally. The iOS-only mark
next to it cost five CI cycles for the same class of question.

### §11.16 — authored, unrun, and deliberately verdict-free

`i02-ipad-step5-landscape.yaml` rotates FIRST and then walks to beat 5, so it cannot be mistaken for having
answered §11.8 (rotation *mid-step*, which is 4.1.5.6's question — two questions, two flows, neither
standing in for the other). It asserts only what makes the frame worth having: the ring is drawn, and
4.1.5.2's invariant holds on the axis the clamp does not touch — free coverage of the `clampY` exemption
itself. It restores PORTRAIT on the way out, because a file that leaks device state is what made cycle 1
of the 4.1.1 probe read as five capability failures.

**The verdict is Jason's.** §11.16 asks whether the crop reads as deliberate or as a rendering fault, and
a pass/fail here would be a check invented to be passable.

### `lint:selectors` — second false-positive class, same shape as the first

It read `setOrientation: LANDSCAPE_LEFT` as **copy** and reported it stale. The file already keeps an
exclusion list for exactly this (`takeScreenshot`, `inputText`, `openLink`, `runScript`) and it grew by
three: `setOrientation` takes an enum, `evalScript`/`assertTrue` carry JS. ⛔ `repeat` was deliberately
left OUT despite also taking a non-selector argument — it NESTS commands, so excluding it would silently
drop every selector inside the loop from all three checks. Re-proven to fail on a planted stale string
before being trusted, per T2.

## Session close 2026-08-14 — where the fast path actually stands

**Run `31800305248` hit the cache, restored the `.app`, verified the binary, re-bundled the JS — and the
magic-byte guard stopped it on its FIRST live execution:**

```
bundle format changed (c61fbc03c103191f → 766172205f5f4255) — engine mismatch — rebuilding from source
```

`c61fbc03` is Hermes bytecode; `766172205f5f4255` is ASCII `var __BU`. **`expo export:embed` emits plain
JS**, and Xcode's build phase compiles it to bytecode afterwards — re-bundling by hand has to do that
second half too. Fixed with `hermesc -emit-binary`, resolved from THIS tree rather than `PATH` because
Hermes bytecode is versioned and a mismatched compiler would sail past the magic check (both Hermes) and
fail at launch instead.

⭐ **What the run bought, for the price of a full build:** the cache mechanism works end to end; the guard
works, catching a defect whose natural presentation is *an unexplained Maestro timeout twenty minutes
downstream* — the most expensive failure shape this lane has; and **the app is provably Hermes**, which was
an assumption until those bytes printed (`app.json` declares no `jsEngine`).

⚠️ **Two runs from proof, not one.** The workflow file is in the `.app` cache key by design (build flags
live there), so every iteration ON the cache mechanism costs a full build: the next dispatch rebuilds and
repopulates under the new key, and the one after it is the first that can skip the 771s. **Do not spend a
run on that alone** — fold it into 4.1.5.6's batch.

### The day's shape, worth naming once

**Every wrong thing was an unmeasured premise, and almost all were answerable from something already on
disk:** the hierarchy dump that did not exist · "numeric frame containment" that belonged to Appium ·
"More's two-column" that §10 never asked for · `~/.maestro`'s 1m29s that was 22s · §11.15's ~700pt that
3.5.3.5.7 had designed out · the `.app` cache described as "the whole loop" while hitting **8%** · ccache's
blocker being modules-at-all rather than *explicit* modules · and four of mine (the `d 2,2` border, a
predicate with zero matches, a stale-rect story the probe refuted, and reading a sideways screenshot).

⚡ **The counter-pattern that worked every time: measure the cheapest artifact first.** Two shipped
cross-platform defects fell out of Chrome in under a minute each, in the same component that previously
cost five CI cycles — the difference was noticing that one mark is `Platform.OS === 'ios'` and the other
is not.
