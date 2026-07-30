# Lens 06 — Test-coverage integrity + Data/Privacy (Phase-3 closeout re-audit, 2026-07-30)

**VERDICT: FINDINGS: 6** (4 actionable test holes, 1 privacy tightening for Phase 6, 1 code-consistency gap found while checking coverage) — plus 2 acknowledged native-only holes already on the Phase-6 device ledger and 3 explicit privacy CLEAN confirmations. Nothing here is a ship-blocker for the closeout; T1/T2/T7 are the cheap, worth-doing-now locks.

Verified against: `apps/rn/src/store/windfallSplit.test.ts`, `apps/rn/src/testing/runAppTests.ts` (windfall test IS registered, line 59), `apps/rn/tests/e2e/windfall.spec.ts`, `apps/rn/tests/e2e/celebration.spec.ts`, `apps/rn/src/store/guardianSelectors.ts` (§Windfall), `apps/rn/src/components/plan/WindfallSheet.tsx`, `PaidOffFinale.tsx`, `ShareCard.tsx`, `share-card.ts`, `utils/sentry.ts` + `sentry.web.ts` + `reportError.ts`, `notifications/notifications.ts` + `.web.ts`, `utils/debtFreeSound.ts` + `.web.ts`, `components/ui/FormSheet.tsx`, `docs/DEBT_ELEVATION_LOG.md` (session-3).

---

## Test-coverage findings

### T1 — Windfall: 4 of 6 buckets never exercised; the "bills lead" ordering rule is untested
- **SEVERITY: MEDIUM** · `apps/rn/src/store/windfallSplit.test.ts` vs `guardianSelectors.ts:328-362`
- **Gap:** the suite locks money-conservation, multi-bucket (emergency+debt), the funded→debt case, and the guards — good. But of the 6 bucket groups (`bills · safetyNet · emergency · goals · debt · cash`) only `emergency` and `debt` ever receive money in any test. And the ordering assert (`items[0].amount >= items[last].amount || items[0].key === 'bills'`) only locks descending sort — the **bills-first-even-when-smaller** branch is unreachable because no scenario routes money into `bills`.
- **Risk:** a regression in the bills/safetyNet/goals/cash grouping (e.g. an `AllocationCategory` rename or a mis-mapped category) or in the bills-lead sort ships silently. Money-conservation would only catch it if the *test scenario* happens to route into the broken group.
- **Fix:** two added cases: (1) a scenario with an unpaid required expense due in-window so `bills > 0`, asserting `items[0].key === 'bills'` while a larger `debt` delta exists; (2) a large windfall on a fully-funded plan (EF done, goals present) so `goals`/`safetyNet`/`cash` each go nonzero, re-asserting conservation across all buckets.

### T2 — Windfall e2e stops at "Confirm visible" — the Confirm→`setWindfall` wiring is unlocked end-to-end
- **SEVERITY: MEDIUM-LOW** · `apps/rn/tests/e2e/windfall.spec.ts:35` vs `WindfallSheet.tsx:56-61`
- **Gap:** the e2e asserts the routing eyebrow + the Confirm button render; it never clicks Confirm. Unit tests cover `setWindfall` itself (clamp, rollover-clears — `storeActions.test.ts:183-189, 99-107`), but no test anywhere asserts the sheet's submit actually dispatches `setWindfall(n)` with the parsed amount.
- **Risk:** a submit-handler regression (Confirm silently no-ops, or dispatches the stale `current`) passes the entire suite. The sheet-internals-unqueryable constraint doesn't apply: Confirm is a reachable button.
- **Fix:** extend the first e2e — click Confirm, assert the sheet closes, then assert the effect on Today (or read the persisted store via `page.evaluate` on localStorage, as other specs' seed helper does in reverse).

### T3 — Share capture/share path: e2e locks only the button; capture is device-owed (ACKNOWLEDGED)
- **SEVERITY: LOW (acceptable)** · `celebration.spec.ts:58` · `share-card.ts`
- `captureRef` + `expo-sharing` are native; web resolves `share-card.web.ts`, so the real PNG-capture path is structurally untestable in this suite. It IS on the session-3 device-owed ledger. Residual risk worth naming: `onShare` failures are swallowed into `reportError` (`PaidOffFinale.tsx:73-79`) — a broken share is **silent for the user**, so the device-QA checklist must include *tapping* Share and seeing the sheet with the card image, not just the finale rendering. Add that line to the Phase-6 device checklist.

### T4 — Interactive notifications: zero tests for category registration / response routing (ACKNOWLEDGED)
- **SEVERITY: LOW (acceptable)** · `notifications/notifications.ts:37-58`
- No unit or e2e touches `registerNotificationCategories` / `addNotificationResponseListener` (the module imports `expo-notifications` at module scope → not node-testable without extraction; the web stub no-ops). Delivery/actions are on the Phase-6 device ledger, and the web stub mirrors the full export surface (re-export gap avoided — checked). Acceptable as native-only. Optional cheap lock: the routing predicate (`category in CATEGORY_ACTIONS`) and the category↔schedule attachment are pure enough to extract to a testable helper if a regression ever bites; not required now.

### T5 — Mesh gradient: a CanvasKit load failure degrades silently; no assertion the mesh painted
- **SEVERITY: LOW** · `MeshGradientCanvas.web.tsx` · `celebration.spec.ts:50-59`
- The finale e2e does boot with `WithSkiaWeb` mounted (a synchronous crash in `MeshGradientChart` would fail the spec — partial cover), but the web loader's `fallback={null}` means a CanvasKit fetch/locateFile regression renders *nothing* and every assertion still passes; the mesh exists only in screenshots nobody diffs. On native it's compile-time Skia (Maestro covers compile).
- **Risk:** cosmetic-only (the LinearGradient base still shows) — low. **Fix (optional):** in one finale spec, wait for and assert a `canvas` element inside the finale modal, which also guards the canvaskit copy-on-install regression class ([[reference_skia_web_canvaskit_setup]]).

### T6 — Sound: the More toggle + pref persistence have no test; finale gating unlocked
- **SEVERITY: LOW** · `more.tsx:192` · `PaidOffFinale.tsx:49,57`
- No e2e asserts the "debt-free sound" switch exists on More, persists `debtFreeSoundEnabled`, or that the finale respects it (playback itself is native + web-no-op, so web can't verify sound — fine, device-owed and ledgered). The gating line is trivial (`if (soundEnabled) play`), so the real exposure is the *toggle wiring* (a `updatePrefs` key typo would silently orphan the switch).
- **Fix:** a 5-line addition to an existing More/enh-audit spec: toggle the switch, reload, assert it stayed on.

### T7 — FormSheet truncation fix not mirrored to the inline (iPad) pane; no test locks either
- **SEVERITY: LOW** · `components/ui/FormSheet.tsx:73` (inline: `numberOfLines={1}`) vs `:128` (modal: `numberOfLines={2}`)
- **Gap found while checking coverage:** the session-3 "sheet-truncation fix" raised the *modal* subtitle to 2 lines, but the 3.6.2 inline pane (iPad Money master-detail renders the SAME entity sheets — e.g. LivingExpenseSheet's 68-char subtitle) still clamps to 1 line, so the same class of truncation persists on iPad. And no e2e locks non-truncation on either path (`ipad-layouts.spec.ts` doesn't assert subtitle text integrity).
- **Fix:** change line 73 to `numberOfLines={2}` (one token, matches the fix's intent); optionally assert the full subtitle string is visible in an ipad-layouts spec. Fold into the closeout fixes.

### T8 — Sentry test-safety: VERIFIED CLEAN (no finding)
- `@sentry/react-native` is imported ONLY by `utils/sentry.ts`, which is imported ONLY by `_layout.tsx`; no `runAppTests` import path reaches it (the `reportError` seam is dependency-free by design, and `__DEV__` is guarded for node). Web e2e resolves `sentry.web.ts` (passthrough) — the 81-pass run confirms the wrapped root boots. `initErrorReporting` hard-returns without `EXPO_PUBLIC_SENTRY_DSN`. No hole.

---

## Data/Privacy findings

### PR1 — Sentry breadcrumbs are not scrubbed; touch/navigation breadcrumbs could carry labels once a DSN goes live
- **SEVERITY: LOW now (DSN unset) → MEDIUM at Phase-6 turn-on** · `utils/sentry.ts:25-30, 48-50`
- `beforeSend` deletes `user`/`request`/`contexts.device` and `sendDefaultPii: false` — good. But `Sentry.wrap` enables touch + navigation breadcrumb instrumentation, and `beforeSend` leaves `event.breadcrumbs` untouched. Touch breadcrumbs can carry component labels and this app's buttons embed financial content (e.g. the payoff confirm's `Confirm … paid off` label, amounts in accessibility labels), and navigation breadcrumbs can carry route params. Today this is moot (no DSN, nothing sends), so NOT a closeout blocker.
- **Fix:** make it an explicit Phase-6 DSN-turn-on gate item: add a `beforeBreadcrumb` filter (drop or strip `touch` breadcrumb labels; whitelist route names only) OR verify empirically that no amount/debt-name reaches a breadcrumb, as part of the §Phase-6 privacy/data-flow audit. One line in the plan's Phase-6 item now so it can't be forgotten.

### PR2 — `reportError` call sites: VERIFIED CLEAN
- All 6 call sites (`liveActivitySync.ts:59`, `widgetSync.ts:46`, `widgetStorage.native.ts:43,58`, `PaidOffFinale.tsx:77`, `drainPendingActions.ts:26`) pass only constant `{subsystem, operation}` strings; no financial values enter `extra`. Only free-form content is the thrown error's own message (bridge/IO errors — no store values embedded by current throwers). Clean.

### PR3 — Share card content: VERIFIED CLEAN (by design)
- The captured card + `fallbackText` expose exactly totalPaid / debts-cleared / months + the brand line — no debt names, no account data, no PII, and it is user-initiated. This is the intended organic-growth artifact; acceptable.

### PR4 — Notifications: VERIFIED CLEAN (local-only)
- No remote push (no `aps-environment`), everything scheduled on-device; the risk push is deliberately neutral (no verdict/figure); the new interactive categories add buttons, not content; `opensAppToForeground` means no background mutation. One pre-existing (B.9, not this session) observation: the bills alert puts the **bill name** on the lock screen ("`{name}` is due soon") — mild, conventional for finance apps, acceptable; note it in the Phase-6 privacy audit for a conscious keep decision.

---

## Recommended dispositions
- **Fold into closeout now (cheap, locks real behavior):** T1 (two windfall cases), T2 (confirm-click e2e), T7 (one-token inline fix).
- **Phase-6 ledger additions (one line each):** T3 (device QA must TAP Share), PR1 (beforeBreadcrumb at DSN turn-on), PR4 (bill-name-on-lock-screen keep decision).
- **Optional/defer:** T5 (canvas-exists assert), T6 (toggle-persistence e2e), T4 (extract routing predicate).
