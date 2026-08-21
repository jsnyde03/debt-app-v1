# W1 — THE UNAUDITED DELTA

> Lens W1 of the P6.8 pre-release audit. Repo `debt-app-v1`, branch `v1.7-dev`, commit `dd80f70`, shipping as `2.0.0`.
> Scope: **everything landed after the 2026-08-17 whole-app audit gate** — Phase 5 cutover (closed 08-19),
> P6.3 cloud backup, P6.6 splash, R4 store veto, P6.7 CI/Pages guards. None of it has been through a gate.
>
> Findings only — nothing fixed. Mechanism stated separately from recommendation, with its own confidence.

## Status
- [x] **delta enumerated** — 114 commits since 2026-08-17; 312 files, +30,487 / −3,768
- [x] **13 findings** — 1 blocker · 5 major · 6 minor · 1 polish

---

### W1-1
**Severity:** major
**Item:** P6.4/P6.3 copy gate (delta-touching) · **Site:** `scripts/check-apostrophes.ts:36` (the `CONTRACTION` regex) · 23 JSX sites incl. `apps/rn/src/components/more/CloudBackupSheet.tsx:111`
**Finding:** `lint:apostrophes` is structurally blind to `&apos;`, so 23 rendered straight apostrophes are outside the 72-site baseline **and the gate cannot stop that number growing**.
**Evidence:** The gate matches `/[A-Za-z]'[A-Za-z]/` against `ts.JsxText` node text. TypeScript keeps JSX text **raw** — verified directly:

```
JsxText: "This can&apos;t be undone."
```

so `can&apos;t` never matches. Babel decodes JSX HTML entities at build, so it renders as U+0027 `can't`. The codebase itself proves the decode happens: `SaveFailedBanner.tsx:35` and `StorageErrorScreen.tsx:40,43` write `&rsquo;` *expecting* a curly apostrophe. Count in `apps/rn/src`: **23 `&apos;`** vs **4 `&rsquo;`** — the same class typeset two ways, which is L1-22's original complaint, in the encoding the gate cannot see. Sites include `(tabs)/index.tsx:546,581,617`, `(tabs)/money.tsx:166`, `+not-found.tsx:14`, `WelcomeStep.tsx:55`, `PaydayCaptureSheet.tsx:334,336,484`, `GuardianScorecard.tsx:48,49,71`, `WindfallSheet.tsx:101`, and the delta's own `CloudBackupSheet.tsx:111`.
⚠️ The elevation log at `docs/DEBT_ELEVATION_LOG.md:3213-3215` already records `&apos;` defeating a *grep* twice ("search the distinctive WORD, never the punctuation") — but the **gate** built from that same step (log:550-563) never absorbed it. The baseline "73" and the P6.8 sweep scope are both floors: the real surface is ~95.
**Mechanism (confidence: high):** TS `JsxText.text` is unescaped source; the regex requires a literal `'`.
**Recommendation (confidence: high):** teach `sitesIn()` to decode `&apos;`/`&#39;` in `JsxText` before testing, then re-baseline — otherwise the P6.8 sweep normalises 72 sites and ships 23 unchanged.

### W1-2
**Severity:** major
**Item:** P6.3 cloud backup · **Site:** `apps/rn/src/hooks/use-cloud-backup.ts:101-108` (`setEnabled`)
**Finding:** The clobber guard's second refusal — *"a declined restore must suppress backup"* — is wired only to the `AppState` trigger; the toggle's own immediate seed-backup is a second automatic trigger that bypasses it and destroys the remote the user declined.
**Evidence:**
```ts
const setEnabled = useCallback(async (next: boolean) => {
    store.getState().updatePrefs({ cloudBackupEnabled: next });
    if (next && status === 'ready') await backupNow();
```
`backupNow()` calls `backupToCloud` directly — `shouldAutoBackup` is never consulted (by design: `service.ts:110` says *"Manual 'Back up now' deliberately does NOT pass through here: the user is standing in front of it"*). But this is not "Back up now"; it is a **Switch labelled "Back up to iCloud"**, and the write it triggers is not the one the label describes.
The reachable sequence: fresh install → `_layout.tsx:185-210` offers the iCloud restore → user taps **Not now** (`declinedRestore.current = true`) → user onboards → More › iCloud backup → toggles ON → the remote they chose to keep is overwritten with the new, near-empty local plan, in one tap, with no confirmation. `_layout.tsx:99-103` calls that exact outcome *"silently become impossible"* and treats it as load-bearing — for the other trigger.
Aggravating: the sheet is showing `Last backed up <old date>` at that moment (`CloudBackupSheet.tsx:86-90` reads the file's mtime), so the UI displays the very artifact the toggle is about to destroy, and **Restore from iCloud** sits one control below.
**Mechanism (confidence: high):** `setEnabled` reaches `backupToCloud` without passing `shouldAutoBackup`, and `declinedRestore` lives in a `useRef` inside `RootLayout` that the hook cannot see at all.
**Recommendation (confidence: medium):** either route the seed-backup through the guard, or make an enable-with-existing-remote a two-tap confirm that names what is replaced. ⚠️ A refuter should check whether `declinedRestore` is even the right signal here — the durable fact is *"a remote backup exists that this install has never restored"*, which `getCloudBackupStatus` already knows.

### W1-3
**Severity:** major
**Item:** P6.7 CI/Pages guards · **Site:** `.github/workflows/web-e2e.yml:3-4` and `.github/workflows/embed-pages.yml:69-107` (the `[D44]` guard step)
**Finding:** `web-e2e.yml` claims in its own header to run `validate:release:rn` and does not — it omits `test:stamp` and **`test:e2e:embed`** — so the Pages guard gates the marketing embed on a run that never exercises the embed.
**Evidence:** `package.json`:
```
"validate:release:rn": "typecheck && lint:rn && test:stamp && test:regression && test:app && test:scenarios && test:e2e:rn && test:e2e:embed && gate:record -- --from-gate"
```
`web-e2e.yml`'s steps are: Typecheck · Lint · Regression · App-layer · Scenario · **Run the RN e2e suite** — then upload the report. There is no `test:stamp` step and no `test:e2e:embed` step. Yet the header reads *"The every-push gate. Runs `validate:release:rn`"*, and `embed-pages.yml`'s guard is built entirely on that equivalence: *"[D44] — the GATE. 'Deployed' and 'passed the gate' were held together by discipline alone; this is the edge that makes one imply the other."*
The consequence is specific, not theoretical: the guard refuses any SHA without a green `web-e2e`, but the **only** suite that exercises the artifact being published (`playwright.embed.config.ts`, the 10 embed specs the README counts) is the one `web-e2e` does not run. The `build` job's own `grep`-for-base-path assertion is therefore the *first and only* check the embed gets in CI.
⚠️ This is a comment asserting another module's behaviour with **no gate behind it** — the exact class 5.6 refuted by grepping for a single reader, and the exact class `[D49]` was created for one commit earlier.
**Mechanism (confidence: high):** the two step lists were written independently and drifted; nothing compares `web-e2e.yml`'s steps to the `validate:release:rn` chain.
**Recommendation (confidence: high):** either add the two missing links to `web-e2e.yml` (preferred — it makes the header true and the [D44] edge real), or narrow the header and the [D44] docstring to what the run actually proves. Do not leave the claim standing.

### W1-4
**Severity:** minor
**Item:** P6.7 gate freshness · **Site:** `scripts/gateSources.ts:31-43` (`ROOTS` + `EXTRA_FILES`)
**Finding:** The gate fingerprint's file enumeration is short: at least five inputs that change what `validate:release:rn` builds or runs are outside it, so editing them leaves `lint:gate-freshness` reporting a green that no longer describes the tree.
**Evidence:** `ROOTS = ['apps/rn/src','apps/rn/tests','packages/core','scripts']`, plus a hand-listed `EXTRA_FILES`. Missing, all measured against the gate chain:

| file | why the gate depends on it |
|---|---|
| `apps/rn/eslint.config.mjs` | `lint:rn` → `npm --prefix apps/rn run lint` = `eslint . --max-warnings=0`. **Changed in this very delta (+25/−…)** |
| `eslint.config.mjs` (root) | the root `lint` lane, and it is what red-gated `web-e2e` for months |
| `apps/rn/app.config.js` | the `experiments.baseUrl` overlay `test:e2e:embed` builds through — the embed suite's whole subject |
| `apps/rn/scripts/copy-canvaskit.mjs` | `preweb`/`preexport:web`; without it the export has no `canvaskit.wasm` and every Skia chart fails |
| `apps/rn/plugins/**` (7 files) | the Expo config plugins that shape the native build `app.json` references |

`EXTRA_FILES` lists `apps/rn/app.json` but not `apps/rn/app.config.js`, and lists `metro.config.js`/`babel.config.js` but not the lint config — a hand-written enumeration that got most members of the class. ⚠️ `docs/DEBT_ELEVATION_LOG.md` records this exact failure mode measured on **six consecutive items** (`check-sandbox-writes.ts:12-16`: *"Budget the enumeration, not the list"*).
**Mechanism (confidence: high):** `sourceFiles()` walks four roots and one literal array; nothing derives the list from what the gate chain actually invokes.
**Recommendation (confidence: medium):** widen `ROOTS` to `apps/rn` with a skip-list (excluding `node_modules`, `dist*`, `.expo`, `ios`, `android`) rather than continuing to enumerate — an exclusion list fails safe, an inclusion list fails silent. ⚠️ Refuter should check the cost: that pulls `apps/rn/package-lock.json` in, which is already in `EXTRA_FILES`, and `apps/rn/public/canvaskit.wasm` is not a `SOURCE_EXT` so it stays out.

### W1-5
**Severity:** minor
**Item:** P6.3 cloud backup · **Site:** `apps/rn/src/app/_layout.tsx:140-165`
**Finding:** The auto-backup fires on `'inactive'` as well as `'background'` with no throttle, so a normal iOS backgrounding uploads the whole portfolio **twice**, and every transient interruption uploads it once.
**Evidence:**
```ts
if (next === 'background' || next === 'inactive') {
  flushPendingSave();
  suspendStoryOnBackground();
  const current = appStore.getState().store;
  if (shouldAutoBackup(current, { declinedRestore: declinedRestore.current })) {
    void backupToCloud(current, getCloudBackupProvider());
  }
}
```
iOS emits `active → inactive → background` on the way out, so a single backgrounding satisfies the predicate twice. It also emits `active → inactive → active` for an app-switcher peek, Control Centre, Notification Centre and an incoming call — none of which is *"on the way out"*, which is what the comment above the call claims it is guarding.
Two consequences: (a) a full-portfolio ubiquity-file write per interruption, unthrottled, on a path the user cannot see; (b) two `CloudStorage.writeFile` calls to the same `/debt-planner-cloud-backup.json` overlapping in flight, since `backupToCloud` is deliberately fire-and-forget (`void`). The `inactive` branch pre-dates this delta (it was `flushPendingSave`'s, where re-running is idempotent and local); the network write added inside it is new.
**Mechanism (confidence: high for the double-fire; medium for the overlap being harmful):** the predicate was inherited from a local-flush handler where double-firing is free. Whether two overlapping `writeFile`s to one ubiquity path can interleave is device-only and untested.
**Recommendation (confidence: high):** restrict the backup to `'background'`, or keep a last-backup timestamp and skip inside a short window. ⛔ Do NOT restrict `flushPendingSave` — `inactive` is load-bearing for that one.

### W1-6
**Severity:** blocker
**Item:** Phase 5 cutover (the v1.6 bridge) · **Site:** `apps/rn/src/store/persistence.ts:47-49` + `apps/rn/src/store/store.ts:258-262` (`hydrate`'s first-launch branch)
**Finding:** The bridge's documented *"the next launch retries from the untouched source"* is **false for every failure reason**: `hydrate` seeds the default blob on the same launch the bridge skipped, so RN storage is never empty again and the bridge can never run a second time. An upgrader whose first migration attempt fails loses their whole v1.6 portfolio permanently, silently.
**Evidence:** `bootstrapPersistence` runs the two in sequence:
```ts
try { if ((await adapter.read()) === null) await runLegacyBridge(adapter, store); } catch { }
await store.getState().hydrate(adapter);
```
and `hydrate`'s first-launch branch writes unconditionally:
```ts
if (raw === null) {
  set({ isHydrated: true });
  await adapter.write(get().store);   // ← the DEFAULT store. Storage is now non-null, forever.
  return;
}
```
There is no path that ever returns storage to `null` again — `StorageAdapter` has no `clear`, and "reset all data" writes defaults rather than deleting the blob.
So every one of `migrateFromLegacy`'s carefully-distinguished skip reasons is **one-shot**, not retried:
- `'the search was cut short — treating as UNKNOWN, not as "no legacy data"'` (`walkForLocalStorage` hit `MAX_WALK_DIRECTORIES`, or a depth cap, or `webkitRootFrom` returned null because `Paths.cache.uri` was not `…/Caches`)
- `'read threw: …'`
- `'the v1.6 data could not be MIGRATED — deliberately not reported as "no legacy data"'`
Each is written to *preserve* the retry, and there is no retry. `migrateFromLegacy`'s header states the guarantee three times — *"interruption-safe … the next launch retries from the untouched source"*, *"leaves the source intact for the next launch to retry"* — and `readLegacyStores`' `truncated` flag exists solely to feed a decision nothing downstream makes.
⛔ **The test that was supposed to catch this drives the wrong seam.** `migrationAudit/interruption.test.ts:66-74` asserts *"nothing is persisted by the bridge itself — the CALLER writes"* and then calls `migrateFromLegacy` again against the same empty `MemoryStorageAdapter`. It never runs `bootstrapPersistence`, which is the caller, and which writes. The suite proves the retry works in a world where `hydrate` does not exist — the shape commit `7fdd92b` named: *"the agent bought confirmation, not discovery."*
⚠️ Only the *crash-before-write* interruption is genuinely safe, because a crash also skips `hydrate`. That is one branch of four, and the docstring generalises from it.
**Mechanism (confidence: high):** the bridge's idempotence key (`read() === null`) is consumed by `hydrate` one statement later; the two were written against each other's docstrings, not against the sequence.
**Recommendation (confidence: medium):** the cheapest correct fix is to persist a `legacyBridgeAttempt` outcome and re-run on a non-terminal reason — but ⛔ that re-introduces the flag the docstring rejects, so this is a **scope call for 🎯**, not an automatic fix. A refuter should specifically test how *likely* a skip is on a real upgrade container before agreeing to blocker: if `truncated` and the throw paths are unreachable in practice, this drops to major.

### W1-7
**Severity:** major
**Item:** Phase 5 cutover · **Site:** `apps/rn/src/store/persistence.ts:117-119`
**Finding:** `outcome.reason` — the field built so a silent no-op is diagnosable — is discarded by its only production caller, so a failed migration is invisible to the user **and** to Sentry.
**Evidence:**
```ts
const { outcome, store: migrated } = await migrateFromLegacy(adapter);
if (!outcome.migrated || migrated === null) return;
```
`outcome.reason` / `outcome.read` / `outcome.map` / `outcome.quarantineFailed` are never read. `runLegacyBridge`'s `catch` reports, but the *skip* paths do not throw — they return a tagged outcome, by design. `migrateFromLegacy` calls `reason` *"the field that makes a silent no-op diagnosable"*; nothing in the app consumes it. The only reader is `LegacyBridgeProbeReadout`, which (a) reads a **fresh** `readLegacyStores()` rather than the migration's own outcome, (b) is gated behind `qaEnabled()`, and (c) is scheduled for deletion with the `QA_TOOLS` flip.
Combined with W1-6 this is the whole failure surface: a user upgrading from v1.6 whose migration skips sees an empty app, has no message, has no retry, and we get no report.
**Mechanism (confidence: high):** the reporting is at the throw boundary; the skip paths deliberately do not throw.
**Recommendation (confidence: high):** `reportError` (or a breadcrumb) on every `outcome.migrated === false` whose reason is not the fresh-install one, and include `read.truncated` / `read.visited` / `outcome.quarantineFailed`. Cheap, and it is the only instrument that would tell us W1-6 is happening in the field.

### W1-8
**Severity:** major
**Item:** P6.3 cloud backup · **Site:** `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts:41-52` → `service.ts:66` → `_layout.tsx:191-193`
**Finding:** When iCloud knows the backup exists but has not finished materialising it, the read gives up after ~4.2 s and the failure is reported as **"There is no backup in iCloud yet"** — and on a fresh install it also silently burns the one-shot restore offer.
**Evidence:** `readWithDownload` is explicitly written for the fresh-install case (*"this is exactly the moment the feature has to work — a new device, restoring"*). It polls 6 × 700 ms and then:
```ts
    return null;   // download never landed inside the window
```
`restoreFromCloud` cannot tell that apart from an absent file — `if (raw === null) return { ok: false, reason: 'no-backup' }` — and `CloudBackupSheet.report()` renders `'There is no backup in iCloud yet.'` The provider **already knows** the file exists: `CloudStorage.exists()` returned true two statements earlier. The one path that distinguishes "nothing there" from "I could not get it" is discarded, in a codebase whose whole doctrine is that those two are different facts (`hydrate`'s `read-failed`, `readLegacyStores`'s `truncated`, `restoreFromCloud`'s own docstring).
⛔ The worse half is the first-launch offer:
```ts
if (!isHydrated || offeredRestore.current) return;
…
offeredRestore.current = true;          // ← set BEFORE the await
void (async () => {
  const result = await restoreFromCloud(getCloudBackupProvider());
  if (!result.ok) return;               // ← silent, and the one shot is spent
```
A user setting up a new phone on a cold, slow iCloud pull is never offered their backup again for the life of the install, is told nothing, and we are told nothing. Their route out is discovering More › iCloud backup › Restore themselves — and if they instead just enable backup, **W1-2 destroys the remote**.
**Mechanism (confidence: high):** a fixed 4.2 s budget on an unbounded operation, with the timeout collapsed into the same tag as "absent".
**Recommendation (confidence: high):** give the provider a third outcome (`pending`), word it honestly (*"Your backup is still downloading from iCloud"*), and do not consume `offeredRestore` on a non-`no-backup` failure — retry it on the next foreground.

### W1-9
**Severity:** minor
**Item:** P6.3 cloud backup · **Site:** `apps/rn/src/storage/cloudBackup/service.ts:81-90` + `use-cloud-backup.ts:45-55`
**Finding:** Every failure of `isAvailable`/`stat` — a native-init throw, a transient error, a real sign-out — collapses to one status, and the sheet's dead-end copy asserts the one cause it cannot know: *"Sign in to iCloud on this device."*
**Evidence:** `getCloudBackupStatus` catches and returns `{ available: false }`; `useCloudBackup.refresh` catches again and sets `'unavailable'`; `CloudBackupSheet` then renders only `Sign in to iCloud on this device to back up your plan.` and hides every control — including any retry. `createCloudBackupProvider` has a *third* path into this state (`unavailableCloudBackupProvider` after a provider-init throw) which has nothing to do with being signed out. A user who IS signed in is told to sign in, and given nothing to press.
**Mechanism (confidence: high):** three causes, one boolean.
**Recommendation (confidence: medium):** at minimum add a retry affordance; ideally word the message conditionally on whether `isAvailable` answered `false` or threw.

### W1-10
**Severity:** minor
**Item:** R4 / the a11y gate class · **Site:** `scripts/check-native-a11y-props.ts:26` · `apps/rn/src/components/ui/Slider.tsx:106-107`
**Finding:** `check-native-a11y-props` — the guard whose own docstring records being closed at **2 of 4** members — is now closed at **4 of 6**: `accessibilityActions` and `onAccessibilityAction` are equally absent from react-native-web's forwarded-prop allowlist and equally unbanned.
**Evidence:** `BANNED` covers `accessibilityElementsHidden|importantForAccessibility|accessibilityState|accessibilityValue`. Measured against `apps/rn/node_modules/react-native-web/dist/modules/forwardedProps/index.js`, the `accessibilityProps` allowlist contains neither `accessibilityActions` nor `onAccessibilityAction` (nor `accessibilityViewIsModal`, which currently has no live site). `Slider.tsx` uses both, so the slider's increment/decrement rotor actions exist on device and are dropped on web — the platform the entire Playwright + axe suite runs on. The gate is green over it.
⚠️ The props themselves pre-date the delta; the file was edited in it (P6.4.2's `formatWhole` fix), and the gate is the recurring class this lens is looking for. Real impact is bounded — the slider also ships `a11yAdjustableValue` (`aria-valuenow`/`min`/`max`), so web is not *silent*, only actionless.
**Mechanism (confidence: high):** verified against the installed RNW source, not from memory.
**Recommendation (confidence: high):** add the three names to `BANNED` with a declared exemption for `Slider.tsx` if the native actions are wanted, so the next one cannot arrive unannounced.

### W1-11
**Severity:** polish
**Item:** P6.3 cloud backup · **Site:** `apps/rn/src/components/more/CloudBackupSheet.tsx:19,141-145`
**Finding:** Two small honesty/announcement gaps in new copy that never went through the L1 voice lens.
**Evidence:** (a) `formatBackupTime` returns the literal string `'recently'` for an unparseable mtime, so the sheet renders **"Last backed up recently"** — a claim invented to fill a hole, on the one surface whose job is telling the truth about where the user's data is. `'—'` or hiding the line says the same amount and asserts nothing. (b) The `cloud-backup-message` `Text` (the only feedback for "Backed up.", "Restored from iCloud.", and every failure) carries no `accessibilityLiveRegion`/announcement, unlike `SaveFailedBanner`, which was built in the same delta *with* `accessibilityRole="alert"` + `accessibilityLiveRegion="polite"` — the same class, closed in one of two new surfaces. ⚠️ Depth belongs to **A1**; flagged here only because both landed after the audit gate.
**Mechanism (confidence: high) · Recommendation (confidence: high):** mirror `SaveFailedBanner`'s pair onto the message node; drop the `'recently'` fallback.

### W1-12
**Severity:** major
**Item:** P6.7 gate freshness · **Site:** `scripts/gateSources.ts:16-20` (the header's scoping claim)
**Finding:** `gateSources.ts` asserts that `.github/**` and docs are not gate-relevant *"because `validate:release:rn` does not run workflows"* — and three gates already inside `validate:release:rn` read exactly those files. It is a comment asserting another module's behaviour with nothing behind it, and it was false when written.
**Evidence:** The claim:
> *".github/** is likewise out: `validate:release:rn` does not run workflows, so a workflow edit does not invalidate a passing gate."* … *"A docs-only commit must not red — that is [D49]'s own wording."*

`lint:rn` — link 2 of `validate:release:rn` — ends with `lint:lane`, and `scripts/preflight-native-lane.ts:26-31` reads:
```ts
const WORKFLOWS = join(REPO, '.github/workflows');
const ACTIONS   = join(REPO, '.github/actions');
const FLOW_DIR  = join(REPO, 'apps/rn/.maestro');
```
It parses `native-e2e.yml`, `app-preview.yml` and both composite `action.yml` files and exits 1 on 87 structural assertions over them. Two more in the same chain:
- `lint:selectors` (`check-maestro-selectors.ts:28`) reads every `apps/rn/.maestro/*.yaml`
- `lint:closure` (`check-audit-closure.ts:20-25`) reads `docs/audits/2026-08-17-v1.7-audit-gate/findings` **and `docs/DEBT_ELEVATION_PLAN.md` / `docs/DEBT_ELEVATION_LOG.md`** — so a **docs-only** commit genuinely can red the gate, which is the one case the scoping paragraph names as impossible.

So the failure [D49] exists to kill is reachable through the door [D49] built: edit `native-e2e.yml` (or a Maestro flow, or an elevation-log finding id), and `npm run lint:gate-freshness` prints *"the recorded pass still describes this tree"* over a tree where `validate:release:rn` would now exit 1. ⚠️ `lint:lane` predates `gateSources.ts` by many commits (`a7b7346` vs `dd80f70`) — the premise was checkable at the moment it was written.
**Mechanism (confidence: high):** the scope was reasoned from *"the gate runs suites, and suites live in src"*, not from what the 17 `lint:rn` links actually open.
**Recommendation (confidence: medium):** add `.github/workflows`, `.github/actions` and `apps/rn/.maestro` to the fingerprint. ⚠️ Do **not** simply add `docs/` — the [D49] docs-only exemption is deliberate and the right call; the honest fix there is to narrow `lint:closure`'s inputs or to accept the residue and say so. Either way the header must stop claiming a property the tree does not have. ⛔ This compounds W1-4: together they mean the fingerprint misses both build config *and* gate inputs.

### W1-13
**Severity:** minor
**Item:** R4 store veto · **Site:** `apps/rn/src/store/StoreContext.tsx:68-73` · `realWriteGuard.ts:44-53`
**Finding:** The veto is armed from the provider's `useEffect`, which React runs **after** its children's effects — so the sandbox subtree's own mount-time writes fall outside the window the veto is supposed to cover, and the symmetric gap exists on teardown.
**Evidence:** `StoreProvider` calls `useNoRealWritesGuard(store)`, whose effect body begins `const leaveScope = enterSandboxScope();`. The provider and its whole subtree mount in one commit, and React fires effects **child-first**. Any `appStore` action dispatched from a descendant's mount effect therefore sees `sandboxDepth === 0` and is not refused. The cleanup ordering on unmount gives the mirror image: the scope can be released while descendants are still tearing down.
The blast radius is genuinely small — reaching `appStore` at all requires an import that `lint:sandbox` allow-lists, and the four category-4 writers are all declared — so this is a **latent** hole rather than a live defect. It matters because the module's own framing is *"a forbidden write never lands at all"*, and that is true for every window except the first one.
⚠️ Related and un-refuted: `allowRealStoreWrite`'s category-4 list is an **enumeration** (*"Every legitimate real-store writer that can fire while a run is on screen must be wrapped"*), and under refusal an omission is now **silent data loss** rather than a false alarm — the inversion the docstring itself flags. Four entries; this repo has measured such lists short on six consecutive items.
**Mechanism (confidence: medium):** React's child-before-parent effect ordering is certain; that a reachable write exists in that window is **not** established — I found none.
**Recommendation (confidence: low):** arm the scope during render (a ref incremented on first render, released in the effect cleanup) *only if* a refuter finds a live write in the window. Otherwise record it as a known boundary rather than changing initialisation order this close to a freeze.

---

## What I could not judge

1. **Whether W1-6 is reachable in the field.** The bridge's *happy* path was verified on a live device at 5.11. What I cannot establish off-device is how often `walkForLocalStorage` truncates, whether `Paths.cache.uri` is ever not `…/Caches`, or whether `openDatabaseAsync` on a copied WAL pair fails on any real container shape. If all four skip reasons are unreachable in practice, W1-6 drops from blocker to major. **This is the single most valuable thing for a refuter to attack.**
2. **Everything in P6.3 that only iCloud can answer.** Whether two overlapping `CloudStorage.writeFile` calls interleave (W1-5), whether the 4.2 s download window is generous or absurd (W1-8), whether `isCloudAvailable()` can throw on a signed-in device (W1-9). `service.test.ts` and `cloudBackup.test.ts` drive a fake provider — the right seam, and structurally blind to all three.
3. **The splash's known residual (dark in both themes).** `app.json` declares both variants and `userInterfaceStyle` is `"automatic"`, so the config is not obviously the fault. Diagnosing further needs a device or the prebuilt `Info.plist` / asset catalogue, neither of which is in the tree. → **V1 / P6.14**.
4. **Voice and tone of the new copy.** ~30 new user-facing strings landed after L1 ran (all of `CloudBackupSheet`, `StorageErrorScreen`, `SaveFailedBanner`, `SpokenForSheet`, the restore-offer Alert, the rewritten `BackupSheets`). `lint:glossary` and `lint:money` are green over them; no lens has read them for voice. I filed two concrete defects (W1-11) and did not attempt the rest — re-running L1 on a 30-string delta is a scope call.
5. **Whether all 23 `&apos;` sites (W1-1) are user-visible copy.** I counted occurrences in JSX text; I did not classify each. The count is a ceiling on the *typography* problem and a floor on the *gate-blindness* problem.
6. **`QA_TOOLS = true`.** Still on at `dd80f70` (`apps/rn/src/config/qa.ts:9`), so the legacy-bridge / Live-Activity / coach-mark probes are in the shipping tree today. Not filed as a finding because the flip is an explicit later step with a `git grep QA_TOOLS` procedure — but it is a ship-blocker if it is ever assumed done.
7. **`test-results/.last-run.json` is tracked and changed in the delta.** I did not chase whether it should be gitignored; noise, not a defect.

---

## Gates as measured on this tree (`dd80f70`)

All eleven house guards run green, which is the point of W1-1 / W1-4 / W1-10 / W1-12 — every finding above sits in the space the green does not cover:

```
lint:a11y-props ✅   lint:comments ✅   lint:rn-style ✅   lint:local-dates ✅
lint:glossary ✅     lint:money ✅      lint:apostrophes ✅ (72 baselined)
lint:destructive ✅  lint:sandbox ✅ (23 sanctioned)  lint:secrets ✅
lint:a11y-collapse ✅  lint:lane ✅ (87 structural checks)
```
