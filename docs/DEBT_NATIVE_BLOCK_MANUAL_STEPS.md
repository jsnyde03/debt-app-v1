# Debt Planner v1.7 — Native-Platform Block: YOUR Manual Steps

> **What this is.** The native block (Phase 3.5) can't be web-verified — it needs real Apple infrastructure (Developer portal, App Store Connect, a build/signing pipeline, a physical iPhone). **I (Claude) do all the in-repo code + config; YOU do the dashboard/device/decision steps below.** Every step is written assuming zero prior knowledge — exact site → page → field → value.
>
> **Your project's fixed values** (used throughout):
> - **App (bundle) ID:** `com.jasonsnyder.debtplanner` — already registered (the legacy Capacitor app used it). **v1.7 ships as an UPDATE to that same App Store record**, not a new app.
> - **App Group (new):** `group.com.jasonsnyder.debtplanner`
> - **Widget/Live-Activity extension ID (new):** `com.jasonsnyder.debtplanner.widget` (singular — matches the Freedom convention)
> - **Apple Team ID:** `CVCY985YCD` — **same Apple Developer account as Freedom**, so it's the same team (confirm, and I'll wire it into `app.json` — `@bacons/apple-targets` needs it).
> - **Apple Developer portal:** https://developer.apple.com/account → **Certificates, Identifiers & Profiles**
> - **App Store Connect:** https://appstoreconnect.apple.com
> - **Min iOS:** 15.1 (Expo SDK 56 default). Live Activities need iOS 16.1+, Dynamic Island needs **iPhone 14 Pro or newer**, TipKit needs iOS 17+.

> ## ✅ You've done this before — Freedom v1 is the proven template
>
> FinancialFreedom v1 is the **same stack** (Expo SDK 56 + Codemagic) and already ships a live WidgetKit widget. Its setup is our template, so this block is far lower-risk than a first attempt:
> - **Build pipeline** → mirror `FinancialFreedom/codemagic.yaml` (`ios-testflight` workflow): `expo prebuild` → **fetch signing files for BOTH bundle IDs** → `use-profiles --project … --warn-only` → `build-ipa --archive-flags="-destination generic/platform=iOS"` → TestFlight. I adapt it for Debt's monorepo (`cd apps/rn`) + bundle ID + app name.
> - **Widget target** → mirror `FinancialFreedom/targets/widget/` (`@bacons/apple-targets`: `expo-target.config.js` + Swift views) and `src/widget/` (App-Group storage/sync).
> - **The exact provisioning gotchas you hit are documented** → `FinancialFreedom/docs/WIDGET_SIGNING_SETUP.md`. I bake all of them in up front (see the box below), so we shouldn't re-hit them.

> ## ⚠️ THE #1 THING (your words): capabilities → refresh the provisioning profile
>
> A provisioning profile is a **snapshot** of the capabilities at the moment it was generated. **Adding a capability (App Groups, the widget target, Push…) invalidates every existing profile** — the build then fails with *"profile doesn't include the … entitlement."* The fix each time:
> 1. Enable the capability on the **App ID** in the portal (and for App Groups, tick the specific group).
> 2. **Regenerate the profile** — with Codemagic automatic signing, just **re-run the build** and it re-fetches/creates the fresh profile via the ASC API key; if it doesn't, regenerate manually (Section F).
> 3. For the **widget**, its separate App ID needs the same capability, and the build must **fetch signing files for the widget bundle ID too** (baked into the workflow, mirrored from Freedom).
>
> This is a HARD project rule (`feedback_regenerate_profiles_on_capability_change`). I'll call it out in-line every time I add a capability so you know a profile refresh is due.

> ## The Freedom fixes I bake in up front (so we don't re-hit them)
> From `FinancialFreedom/docs/WIDGET_SIGNING_SETUP.md` (all learned the hard way there):
> 1. **Fetch signing files for BOTH** `com.jasonsnyder.debtplanner` **and** `…debtplanner.widget` before `use-profiles` (the main `ios_signing` only does the app → the widget would have "no profile").
> 2. **Pin the archive to iOS:** `--archive-flags="-destination generic/platform=iOS"`. Debt has `supportsTablet: true` (same as Freedom), so without this xcodebuild picks *"My Mac (Designed for iPad)"* → a **false** "widget requires a provisioning profile" that dies before compiling.
> 3. **Scope `--project` to the real app project + `--warn-only`** (not the `**/*.xcodeproj` glob) — several node_modules native modules ship their own `.xcodeproj` with no profile.
> 4. **Declare the App Group in the widget's `expo-target.config.js` `entitlements`** — `@bacons/apple-targets` only auto-mirrors the group if `entitlements` is already truthy, else the widget ships with no App-Group access and reads empty data on device.
> 5. Debt's existing **`plugins/with-local-notifications-only.js`** already strips the Push entitlement (same plugin Freedom needed) — so the app stays local-only and App Groups is its only special entitlement. ✅ already in place.

---

## ⚠️ Read this first — the thing the old plan missed

There is **no iOS build pipeline for this app yet.** The `codemagic.yaml` in the repo builds the **old Capacitor/Next.js app** (`ios/App`), *not* the new React-Native/Expo app in `apps/rn`. That means **all of v1.7 so far has only ever run in a web browser** — RevenueCat purchases, the statement scanner, the frosted blur, every gesture and sheet, and haptics have **never run on a real iPhone.**

So the real first job isn't a widget — it's **standing up a build pipeline for the RN app and getting it onto your phone once.** That first build is also the long-overdue "does all of v1.7 actually work on a device?" check.

---

## ✅ 3.5 MANUAL CHECKLIST — everything YOU do (ASC / portal / device)

_The definitive, current list (verified against the build 2026-07-29). Grouped by where you do it. I do all in-repo code; you do only what's below, and only when I say a feature's ready to test — most 3.5 features batch into one signed device build._

### Already done — no action
- [x] **Build pipeline** — the Codemagic "Debt Planner RN" workflow; first build **green on device** (2026-07-28).
- [x] **App Group** `group.com.jasonsnyder.debtplanner` registered + enabled on the app App ID (2026-07-28).
- [x] **3.5.2 context menu** — verified on the free sim pipeline; the real-device long-press feel batches into the next signed build.

### ① Apple Developer Portal — signing for the widget extension
_Needed before the next **signed device build** (it introduces the widget-extension bundle that hosts **both** the widget (3.5.4) **and** the Live Activity (3.5.3)). This was the one friction spot on Codemagic._
- [x] **P1 — Widget extension App ID `com.jasonsnyder.debtplanner.widget`** (singular) — ✅ **set up in ASC + Codemagic** (Jason 2026-07-29).
- [x] **P2 — App Group on that widget App ID** — ✅ done as part of the widget-extension setup (2026-07-29).
- [x] **P3 — Provisioning** — ✅ the widget extension is wired in Codemagic (2026-07-29). The next signed build should sign both bundles cleanly; if it ever fails on signing, Section F is the manual fallback.
- [x] **(No action) Live Activities need NO extra capability** — `NSSupportsLiveActivities` is in the app Info.plist (I added it via a config plugin). **NO Push Notifications capability, NO APNs key** — the countdown updates locally, not via push.
- [x] **(No action) App Intents / Siri (3.5.5) need NO portal capability** — App Intents auto-register and surface to Siri/Shortcuts on their own.

### ② App Store Connect — for 3.5 specifically
- [x] **No per-feature ASC steps.** Live Activities, widgets, and App Intents need **no** ASC-side declaration; the app record already exists (v1.7 is an update to `com.jasonsnyder.debtplanner`). ASC submission chores (privacy nutrition labels, export compliance, screenshots) are **Phase 6**, not 3.5.
- [ ] **A1 — Internal tester** (so signed builds install on your phone): ASC → your app → **TestFlight → Internal Testing → +** → add your Apple ID. One-time; likely already done from the first build.

### ③ Device — one-time setup
- [ ] **Note your iPhone model** — Dynamic Island renders only on **14 Pro / 15 Pro / 16 Pro+**; the Live Activity Lock-Screen card works on **any iOS 16.1+** iPhone. (The interactive "Payday landed" button + widget interactivity need **iOS 17+**.)
- [ ] **Enable Live Activities:** Settings → **Debt Planner → Live Activities = ON** (and Settings → Face ID & Passcode → **Live Activities** on the Lock Screen, if present).

### ④ Device — per-feature test (batched into signed builds; I'll say when each is ready)
- [ ] **3.5.2 context menu** — long-press a debt row → native **Edit / Delete** UIMenu (blur + haptic).
- [ ] **3.5.3 Live Activity** — as a **premium** user with payday within ~3 days: the countdown appears on the **Lock Screen** (+ **Dynamic Island** on 14 Pro+); the **Guardian state dot** is the only color that moves. On **payday day**, tap **"Payday landed"** → the app rolls the cycle on next open, with a one-tap **Undo** card on Today. Verify the toggle: **More → Preferences → Payday countdown** (premium-only row) turns it off/on.
- [ ] **3.5.4 widget** — add **Debt-Free Date** to Home + Lock Screen + **StandBy** (charger, landscape). **Read-only by design** (no buttons — the interactive action lives on the Live Activity).
- [ ] **3.5.5 App Intents / Siri** _(built after 3.5.3)_ — "Hey Siri, **what's my debt-free date?**" · "**how much debt is left?**" (both free) · "**am I okay this paycheck?**" (premium Guardian read) · "**log a $200 payment to Visa**" (premium); confirm the **Shortcuts** app lists them. Also test the in-app **"Log payment"** in a debt row's context menu.
- [x] **~~3.5.6 TipKit~~ — DROPPED** (Jason 2026-07-28). Feature-discovery folded into the Phase-3.5 tutorial as RN coach-marks → **no native / portal / device step**.

### Recurring rule
- [ ] **Every capability I add → a provisioning refresh is due** (Section F). Codemagic automatic signing usually handles it on the next build; I flag it in-line each time.

---

## Decision 1 — Build tool: ✅ DECIDED — Codemagic-for-Expo

**Jason chose Codemagic (2026-07-28):** reuse the 500 free minutes/month + the ASC key you already have, rather than add EAS's ~$99/mo. The rest of this sheet follows the **Codemagic** path. The EAS comparison below is kept for the record.

> **What this means in practice:** Codemagic's **automatic code signing** (via your ASC API key) creates & manages certificates and profiles for you — including capabilities like the App Group — so it's *not* the fully-manual profile juggling. The one place to expect friction is the **widget-extension's** separate signing identity (`3.5.3`), where Expo-prebuild + Codemagic is less turnkey than EAS; we'll iterate there if needed. Everything through the App Group should be smooth.

<details>
<summary><b>The original EAS-vs-Codemagic comparison (for the record)</b></summary>

You need something that turns the managed Expo app into a signed `.ipa` and uploads it to TestFlight. Two realistic options:

| | **EAS Build** (recommended) | **Codemagic-for-Expo** |
|---|---|---|
| Provisioning/signing | **Automatic** — EAS creates App IDs, App Groups, extension IDs, and profiles for you, and **re-syncs them every build** when I add a capability | **Manual** — you regenerate + upload a profile in the portal every capability change (and one per extension target) |
| Native targets (widgets/Live Activity) | First-class with `expo-apple-targets` | Works, but you hand-manage each target's signing |
| TestFlight submit | `eas submit` (one command) | Already wired in your `codemagic.yaml` |
| Cost | Free tier = limited builds/mo; paid ~$/build or a plan | You already pay for Codemagic minutes |
| Your existing setup | New account, but reuses your ASC API key | Already set up — but only for the *legacy* app |

**My recommendation: EAS Build.** The native block adds an App Group **and** two new signing identities (the app + the widget extension), each needing capabilities and profiles. EAS automating all of that removes exactly the error-prone manual work that would otherwise be dozens of portal steps and the #1 source of "signing failed" build breaks. The one-command `eas build` / `eas submit` flow is far less for you to babysit.

**If you'd rather stay on Codemagic:** it's doable, but I'd add an Expo workflow (`expo prebuild` → `xcodebuild`), and **you** own the provisioning-profile regen in the portal on every capability change (Section F becomes manual and frequent). Tell me and I'll write that path instead.

_(Decided: Codemagic. The Apple-portal and device steps are the same either way.)_
</details>

---

## Section A — One-time accounts & tools

<details>
<summary><b>A1–A4 — what you need before the first build</b></summary>

**A1 — Apple Developer Program.** You already ship apps, so this is active. Sanity check: https://developer.apple.com/account → it should show your membership (not "enroll"). Note your **Team ID** (top-right, or Membership details — a 10-char code like `A1B2C3D4E5`); I may ask for it.

**A2 — A physical iPhone.** The simulator can't do Live Activities-on-lock-screen, real haptics, the camera scanner, or Dynamic Island. Have an iPhone you can install TestFlight builds on. **Model matters:** Dynamic Island (3.5.3) only renders on **iPhone 14 Pro / 15 Pro / 16 Pro** (and later Pro/all-15+ models); the Live Activity still works on the Lock Screen on any iOS 16.1+ iPhone. Tell me your model so I set expectations for 3.5.3.

**A3 — Nothing else to install.** On the Codemagic path there's **no Expo account, no CLI, no Mac** needed — builds run in Codemagic's cloud macOS and you trigger them from the Codemagic web UI (or a git push). You already have the Codemagic account.
</details>

---

## Section B — Build pipeline (Codemagic path)

> **What I do in-repo:** add a **new Codemagic workflow** ("Debt Planner RN") that installs deps, runs `expo prebuild` inside `apps/rn` to generate the native iOS project, then archives + signs it and ships to TestFlight. Your existing "iOS Android Release" workflow (the legacy Capacitor one) stays untouched. **What you do:** the two steps below, then trigger the build (Section C).

<details>
<summary><b>B1 — Find your App Store Connect API key (you already have one)</b></summary>

Your `codemagic.yaml` already uses an ASC API key (the `AppleConnect` group: an issuer ID, a key ID, and a `.p8` private key). You can **reuse the same key** for EAS so you don't create a second one.

- **App Store Connect → Users and Access → Integrations tab → App Store Connect API.** You'll see the key (a Key ID like `2X9…`, an Issuer ID like a UUID). The `.p8` file itself was only downloadable once — if you saved it (Codemagic has it), great; if not, click **+** to generate a new key with **App Manager** access and download the `.p8`.
- Keep three things handy: the **Issuer ID**, the **Key ID**, and the **`.p8` file**.
</details>

<details>
<summary><b>B2 — Turn on Codemagic automatic code signing (via your ASC API key)</b></summary>

Automatic signing lets Codemagic create & fetch the certificate + provisioning profiles for you (including when I add a capability like the App Group), using the App Store Connect API key you already have — so you're not hand-managing profiles in the portal.

- In **Codemagic → your app (debt-app-v1) → Settings**, confirm the **App Store Connect** integration / API key from B1 is connected (it already is, since the legacy workflow publishes to TestFlight).
- I'll configure the new RN workflow's `ios_signing` for **automatic** signing on `com.jasonsnyder.debtplanner`. On the first build, Codemagic uses the API key to register/fetch the profile automatically.
- **Nothing to pre-create in the Apple portal for the base app.** (The App Group + widget extension come later in Section D; automatic signing registers those too — the extension is the one spot we may need to nudge it, see `3.5.3`.)
</details>

---

## Section C — First RN build → TestFlight (the catch-up QA)

> This is the big one. Getting the current app onto your phone once verifies **everything built in v1.7 so far** that has only ever run in a browser.

<details>
<summary><b>C1–C3 — build, submit, install (Codemagic)</b></summary>

After I've added the RN workflow to `codemagic.yaml` and confirmed the config:
- **C1 — Build:** in **Codemagic → debt-app-v1 → Start new build** → pick the branch (`v1.7-dev`) → pick the **"Debt Planner RN"** workflow → **Start build**. It runs in the cloud (~20–30 min: install → `expo prebuild` → pod install → archive → sign). You get a success/failure email. _(Watch the first one's minutes — an `expo prebuild` + pod install cold build is the heaviest; caching makes #2+ faster.)_
- **C2 — Submit to TestFlight:** the workflow's `publishing` block auto-uploads to App Store Connect → TestFlight (same as your legacy workflow), so C2 is automatic on a green build. If Apple flags anything (e.g. an encryption/export question), answer it in App Store Connect → your app → TestFlight.
- **C3 — Install:** on your iPhone, install **TestFlight** from the App Store, sign in with your Apple ID, and the "Debt Planner" build appears (allow a few minutes for Apple to finish processing). Tap **Install**.
  - First time, add yourself as an **Internal Tester**: App Store Connect → your app → **TestFlight → Internal Testing → +** → add your Apple ID.
</details>

<details>
<summary><b>C4 — Catch-up QA checklist (the whole v1.7 surface on a real phone for the first time)</b></summary>

Walk these on the device and note anything broken (I fix in-repo, you rebuild):

- [ ] **App launches** past the splash, no white screen (New Architecture runtime).
- [ ] **Premium purchase (RevenueCat):** open the paywall → buy the Monthly (use a **Sandbox Apple ID** — App Store Connect → Users and Access → Sandbox Testers → create one; sign into it on the phone under Settings → App Store → Sandbox Account). Confirm premium unlocks; test **Restore**.
- [ ] **Statement scanner (scan-vision):** Money → Scan a statement → camera opens → scan a real card statement → fields prefill. (Camera permission prompt shows your copy.)
- [ ] **Frosted glass (expo-blur):** the tab bar + a sheet backdrop show the real UIKit blur (should look richer than the web preview).
- [ ] **Gestures:** swipe-to-delete a debt row; open a sheet and swipe it down to dismiss; scrub the payoff trajectory + Cash-Runway charts.
- [ ] **Haptics:** you feel the detent ticks on the chart scrub / slider, and a success tap on payday capture.
- [ ] **Sheets:** the add/edit sheets spring up, the keyboard doesn't cover the Save button, and the grabber works.
- [ ] **Notifications:** the payday/risk local notifications fire (may need to leave it overnight or fast-forward — I can add a debug trigger).
- [ ] **Both themes** look right; **Dynamic Type** (Settings → Accessibility → Display & Text Size → Larger Text) doesn't break layouts.
- [ ] **Face ID unlock** (if enabled) works.

**This checklist is also the Phase-6 pre-submit gate for the non-native surface** — passing it here retires a lot of deferred risk early.
</details>

---

## Section D — Per-native-feature manual steps

> I build each feature in-repo; **you** do only the dashboard/device bits below, and only when I say the feature is ready to test. On **Codemagic** automatic signing, most "portal" steps happen on the next build — I've marked the few that are truly manual (the widget App ID being the main one).

<details>
<summary><b>3.5.1 — Native substrate (App Group)</b></summary>

The App Group is the shared container the app and its widgets/Live-Activity read the same data from.

- **Codemagic (automatic signing):** I declare `group.com.jasonsnyder.debtplanner` in the Expo config; on the next build, Codemagic's automatic signing **registers the App Group + enables it on your App ID** via the ASC API key. Usually zero manual steps.
- **If automatic signing doesn't pick it up (verify/fix manually):** developer.apple.com/account → **Identifiers** → top filter dropdown **App Groups** → **+** → register `group.com.jasonsnyder.debtplanner`; then **Identifiers → App IDs →** `com.jasonsnyder.debtplanner` → check **App Groups** → point it at that group → **Save**. Re-run the build.
- Then rebuild (C1) + reinstall (C3). Nothing visible changes yet — this is plumbing.
</details>

<details>
<summary><b>3.5.2 — iOS long-press context menu</b></summary>

Pure code + a native dependency (`react-native-ios-context-menu`). **No portal steps.** You just rebuild (C1) + reinstall and long-press a debt/bill row to confirm the UIMenu (Edit / Delete) appears with the native blur + haptic. (I run a pre-commit CI check so the new native dep can't break the build.)
</details>

<details>
<summary><b>3.5.3 — Live Activity + Dynamic Island (payday countdown)</b></summary>

This lives in the **widget extension target** — the same second bundle as the widget (`com.jasonsnyder.debtplanner.widget`, **singular**); no new bundle ID beyond the widget's.

- **Codemagic (the friction point):** the extension needs its OWN App ID (`com.jasonsnyder.debtplanner.widget`) + profile. Automatic signing *should* create them, but this is the least-turnkey spot — **if the build fails on the extension's signing**, do **P1 + P2** in the checklist above (register the App ID, tick the App Group), then re-run. I'll give you the exact error-to-action if it happens.
- **Design:** premium-only · auto-starts when premium + payday is within ~3 days (toggle: **More → Preferences → Payday countdown**) · day-granular countdown · the **Guardian state dot** is the only moving color · tap → opens the app to Today.
- **On device (you test):** as a **premium** user near payday → the Live Activity appears on the **Lock Screen** and (iPhone 14 Pro+) the **Dynamic Island** (long-press it for the expanded view). On **payday day (0 days)** an interactive **"Payday landed"** button shows (**iOS 17+**) → tap it → on next app open the cycle has rolled and a **"Payday landed — Undo / Keep"** card is on Today. Confirm the Preferences toggle turns it off.
- **Settings check:** **Settings → Debt Planner → Live Activities** must be ON (and Lock-Screen Live Activities enabled).
- **No push:** updates are **local** (no APNs key, no Push capability). Remote/push updates would be a later enhancement.
</details>

<details>
<summary><b>3.5.4 — Widgets + StandBy</b></summary>

Uses the same extension target as 3.5.3 (no new bundle ID). **Read-only by design** (Jason 2026-07-28) — a reference/glance surface with no buttons; the interactive action lives on the Live Activity's payday state (3.5.3.5), where it's contextual.

- **On device (you test):** long-press the Home Screen → **+** (top-left) → search "Debt Planner" → add the widget (small + medium + large). Add one to the **Lock Screen** too (long-press Lock Screen → Customize → add a widget → the circular / rectangular / inline accessory). **StandBy:** phone on a charger, landscape → the widget should appear. Confirm the debt-free date / payoff ring / remaining all read correctly and match the app.
</details>

<details>
<summary><b>3.5.5 — App Intents / Siri (queries + log-a-payment)</b></summary>

Code-only (**no portal step** — App Intents auto-register). Built **after** 3.5.3 (reuses its AppIntent→store bridge).

- **On device (you test):** say — free glances: *"Hey Siri, what's my debt-free date?"* · *"how much debt is left?"*; premium: *"am I okay this paycheck?"* (the Guardian read) · *"log a $200 payment to Visa"* → confirm Siri runs each. Check the **Shortcuts** app (and Settings → Siri & Search → Debt Planner) lists them. Also test the in-app twin: a debt row's long-press context menu has a **"Log payment"** action.
- **Control Center control** was **deferred** to a later version (App Intents + Siri + the Live-Activity action already cover the quick-action ground for v1.7).
</details>

<details>
<summary><b>~~3.5.6 — TipKit~~ — DROPPED (Jason 2026-07-28)</b></summary>

Native TipKit can't reach Debt's React-Native screens and overlapped the Phase-3.5 tutorial, so feature-discovery was folded into that tutorial as on-brand **RN coach-marks** instead. **No native / portal / device step for 3.5.** (It resurfaces as part of the Phase-3.5 interactive tutorial later.)
</details>

---

## Section E — Device setup (once)

<details>
<summary><b>Developer mode + TestFlight</b></summary>

- **Developer Mode** (iOS 16+): first time you install a dev/TestFlight build, iPhone → **Settings → Privacy & Security → Developer Mode → On** → restart → confirm. (TestFlight builds usually don't require this, but a direct `eas build --profile development` install does.)
- **TestFlight app:** installed from the App Store, signed into your Apple ID. All our test builds land here.
- **Sandbox Apple ID** (for testing purchases without real charges): App Store Connect → **Users and Access → Sandbox → Testers → +**. On the phone: **Settings → App Store → Sandbox Account** (appears only after a TestFlight build with IAP is installed) → sign in with the sandbox tester.
</details>

---

## Section F — The recurring rule: capability change → provisioning

<details>
<summary><b>What happens each time I add a native capability</b></summary>

Every time I add a capability (App Group, an extension, Push, etc.), the signing profile must be regenerated or the build fails with a signing error.

- **Codemagic automatic signing (your path):** on most capability changes it **re-fetches/creates the profile automatically** on the next build via the ASC API key — no action from you.
- **Manual fallback (only if a build fails on signing):** developer.apple.com/account → **Profiles** → find the app's (and each extension's) distribution profile → **Edit → Generate** (it picks up the new capability) → **Download** → upload to Codemagic (or just re-trigger the build so automatic signing regenerates it). Do this for **both** the app ID and the widget-extension ID if the extension is involved.
</details>

---

## What I'll do in-repo (so the boundary is clear)

You do the dashboards/device; **I do all of this** and tell you exactly when to build/test:
- Add the **Codemagic-for-Expo workflow** to `codemagic.yaml` (install → `expo prebuild` in `apps/rn` → pod install → archive → automatic sign → TestFlight).
- Add `expo-apple-targets` + the widget/Live-Activity target (SwiftUI views for the Live Activity, widgets, Dynamic Island).
- Declare the App Group + wire the shared data store (app writes → extension reads).
- Add `react-native-ios-context-menu` + wire the row UIMenu.
- Write the App Intents / Siri intents (queries + log-a-payment) + the AppIntent→store bridge. _(TipKit dropped → RN coach-marks in the Phase-3.5 tutorial.)_
- Add debug triggers so you can test payday/Live-Activity/tips on demand.
- Run the pre-commit native-build checks (CI xcodeproj-glob, config-plugin sanity) before each native dep lands.

---

_Living doc — I'll update it as each 3.5.x feature is ready to test. Canonical plan: `DEBT_ELEVATION_PLAN.md` §3.5._
