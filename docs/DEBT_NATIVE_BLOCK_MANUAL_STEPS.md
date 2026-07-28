# Debt Planner v1.7 — Native-Platform Block: YOUR Manual Steps

> **What this is.** The native block (Phase 3.5) can't be web-verified — it needs real Apple infrastructure (Developer portal, App Store Connect, a build/signing pipeline, a physical iPhone). **I (Claude) do all the in-repo code + config; YOU do the dashboard/device/decision steps below.** Every step is written assuming zero prior knowledge — exact site → page → field → value.
>
> **Your project's fixed values** (used throughout):
> - **App (bundle) ID:** `com.jasonsnyder.debtplanner` — already registered (the legacy Capacitor app used it). **v1.7 ships as an UPDATE to that same App Store record**, not a new app.
> - **App Group (new):** `group.com.jasonsnyder.debtplanner`
> - **Widget/Live-Activity extension ID (new):** `com.jasonsnyder.debtplanner.widgets`
> - **Apple Developer portal:** https://developer.apple.com/account → **Certificates, Identifiers & Profiles**
> - **App Store Connect:** https://appstoreconnect.apple.com
> - **Min iOS:** 15.1 (Expo SDK 56 default). Live Activities need iOS 16.1+, Dynamic Island needs **iPhone 14 Pro or newer**, TipKit needs iOS 17+.

---

## ⚠️ Read this first — the thing the old plan missed

There is **no iOS build pipeline for this app yet.** The `codemagic.yaml` in the repo builds the **old Capacitor/Next.js app** (`ios/App`), *not* the new React-Native/Expo app in `apps/rn`. That means **all of v1.7 so far has only ever run in a web browser** — RevenueCat purchases, the statement scanner, the frosted blur, every gesture and sheet, and haptics have **never run on a real iPhone.**

So the real first job isn't a widget — it's **standing up a build pipeline for the RN app and getting it onto your phone once.** That first build is also the long-overdue "does all of v1.7 actually work on a device?" check.

---

## ✅ Master checklist (tick as you go)

**Decisions**
- [ ] **D1 — Build tool:** EAS Build (recommended) or Codemagic-for-Expo → see [Decision 1](#decision-1--build-tool-eas-vs-codemagic)

**One-time setup (Section A + B)**
- [ ] A1 — Confirm Apple Developer Program membership is active ($99/yr)
- [ ] A2 — Have a physical iPhone (+ USB cable or same Wi-Fi); note the model (Dynamic Island needs 14 Pro+)
- [ ] A3 — Create/confirm an Expo account (if EAS)
- [ ] A4 — Install Node + the EAS CLI on your computer (if EAS)
- [ ] B1 — Locate your App Store Connect **API key** (you already have one — it's in Codemagic)
- [ ] B2 — Link Apple credentials to EAS (or configure Codemagic-for-Expo)

**First device build = catch-up QA (Section C)**
- [ ] C1 — Run the first RN build
- [ ] C2 — Submit it to TestFlight
- [ ] C3 — Install via TestFlight on your iPhone
- [ ] C4 — Walk the [catch-up QA checklist](#c4--catch-up-qa-checklist-the-whole-v17-surface-on-a-real-phone-for-the-first-time)

**Per native feature (Section D) — I'll tell you exactly when each is needed**
- [ ] D-substrate — App Group registered + capability enabled
- [ ] D-contextmenu — (no portal step; just a rebuild + device test)
- [ ] D-liveactivity — extension registered + Live Activities tested on device
- [ ] D-widgets — widget added to Home/Lock screen + tested
- [ ] D-siri — Siri phrases tested
- [ ] D-tipkit — tips appear on device

**Recurring**
- [ ] Every time I add a capability → you regenerate the provisioning (Section F) — EAS does this automatically; Codemagic does not

---

## Decision 1 — Build tool: EAS vs Codemagic

<details>
<summary><b>The choice, and my recommendation (EAS Build)</b></summary>

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

👉 **Action: pick EAS or Codemagic and tell me.** The rest of this sheet's build steps assume **EAS**; the Apple-portal and device steps are the same either way.
</details>

---

## Section A — One-time accounts & tools

<details>
<summary><b>A1–A4 — what you need before the first build</b></summary>

**A1 — Apple Developer Program.** You already ship apps, so this is active. Sanity check: https://developer.apple.com/account → it should show your membership (not "enroll"). Note your **Team ID** (top-right, or Membership details — a 10-char code like `A1B2C3D4E5`); I may ask for it.

**A2 — A physical iPhone.** The simulator can't do Live Activities-on-lock-screen, real haptics, the camera scanner, or Dynamic Island. Have an iPhone you can install TestFlight builds on. **Model matters:** Dynamic Island (3.5.3) only renders on **iPhone 14 Pro / 15 Pro / 16 Pro** (and later Pro/all-15+ models); the Live Activity still works on the Lock Screen on any iOS 16.1+ iPhone. Tell me your model so I set expectations for 3.5.3.

**A3 — Expo account (EAS path).** Go to https://expo.dev → sign up (free). Remember the username/password.

**A4 — EAS CLI (EAS path).** On your computer, install Node (https://nodejs.org, LTS) if you don't have it, then in a terminal:
```
npm install -g eas-cli
eas login          # use your expo.dev account
```
That's all the local tooling you need — EAS builds in the cloud, so **you do not need a Mac.**
</details>

---

## Section B — Build pipeline (EAS path)

<details>
<summary><b>B1 — Find your App Store Connect API key (you already have one)</b></summary>

Your `codemagic.yaml` already uses an ASC API key (the `AppleConnect` group: an issuer ID, a key ID, and a `.p8` private key). You can **reuse the same key** for EAS so you don't create a second one.

- **App Store Connect → Users and Access → Integrations tab → App Store Connect API.** You'll see the key (a Key ID like `2X9…`, an Issuer ID like a UUID). The `.p8` file itself was only downloadable once — if you saved it (Codemagic has it), great; if not, click **+** to generate a new key with **App Manager** access and download the `.p8`.
- Keep three things handy: the **Issuer ID**, the **Key ID**, and the **`.p8` file**.
</details>

<details>
<summary><b>B2 — Link Apple credentials to EAS (mostly automatic)</b></summary>

I'll add an `eas.json` to the repo. Then, the first time you run a build (Section C), EAS asks to log into your Apple account (or use the API key from B1) and **creates everything for you**: the Distribution certificate, the App ID's capabilities, the App Group, and the provisioning profiles. You just answer the prompts (mostly "yes, let EAS handle it").

- When prompted **"Reuse this App Store Connect API Key?"** → point it at the `.p8` from B1 (or let it log in with your Apple ID + an app-specific password).
- When prompted about the bundle identifier → confirm `com.jasonsnyder.debtplanner`.

There is **nothing to pre-create in the Apple portal for the base app** — EAS does it. (The App Group + extension come later, in Section D, and EAS also handles those.)
</details>

---

## Section C — First RN build → TestFlight (the catch-up QA)

> This is the big one. Getting the current app onto your phone once verifies **everything built in v1.7 so far** that has only ever run in a browser.

<details>
<summary><b>C1–C3 — build, submit, install</b></summary>

After I've added `eas.json` and confirmed the config, **you run** (from the repo root or `apps/rn`, I'll tell you which):
```
eas build --platform ios --profile preview
```
- Answer the credential prompts (Section B2). The build runs in the cloud (~15–25 min); you'll get a link + email when it's done.
- **C2 — Submit to TestFlight:**
```
eas submit --platform ios --latest
```
(uses your ASC API key; uploads the build to App Store Connect → TestFlight).
- **C3 — Install:** on your iPhone, install **TestFlight** from the App Store, sign in with your Apple ID, and the "Debt Planner" build appears (allow a few minutes for Apple to finish processing). Tap **Install**.
  - First TestFlight build for an app sometimes needs you to add yourself as an **Internal Tester**: App Store Connect → your app → **TestFlight → Internal Testing → +** → add your Apple ID.
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

> I build each feature in-repo; **you** do only the dashboard/device bits below, and only when I say the feature is ready to test. With **EAS**, most "portal" steps are automated — I've marked what's truly manual.

<details>
<summary><b>3.5.1 — Native substrate (App Group)</b></summary>

The App Group is the shared container the app and its widgets/Live-Activity read the same data from.

- **EAS path:** I declare `group.com.jasonsnyder.debtplanner` in the config; on the next `eas build`, EAS **registers the App Group and enables it on your App ID automatically**. Your only job: when EAS prints *"the following capabilities will be added: App Groups — proceed?"* → **yes**.
- **If you ever need to verify it manually:** developer.apple.com/account → **Identifiers** → click **App Groups** in the top filter dropdown → confirm `group.com.jasonsnyder.debtplanner` exists; then → **Identifiers → App IDs →** `com.jasonsnyder.debtplanner` → **App Groups** capability is checked and points at that group.
- Then rebuild (C1) + reinstall (C3). Nothing visible changes yet — this is plumbing.
</details>

<details>
<summary><b>3.5.2 — iOS long-press context menu</b></summary>

Pure code + a native dependency (`react-native-ios-context-menu`). **No portal steps.** You just rebuild (C1) + reinstall and long-press a debt/bill row to confirm the UIMenu (Edit / Delete) appears with the native blur + haptic. (I run a pre-commit CI check so the new native dep can't break the build.)
</details>

<details>
<summary><b>3.5.3 — Live Activity + Dynamic Island (payday countdown)</b></summary>

This adds a **widget extension target** (a second mini-app bundle: `com.jasonsnyder.debtplanner.widgets`).

- **EAS path:** I add the target via `expo-apple-targets`; EAS **creates the extension's App ID + profile** on build. Confirm the capability prompt when EAS asks.
- **On device (you test):** trigger a payday (I'll add a debug button) → a Live Activity appears on the **Lock Screen** and (on iPhone 14 Pro+) in the **Dynamic Island**. Long-press the Dynamic Island to see the expanded view. Confirm the countdown updates.
- **Settings check:** the phone must have **Settings → Face ID & Passcode → (or Notifications) → Live Activities** enabled, and per-app **Settings → Debt Planner → Live Activities** on.
- If we later want **frequent/remote** updates, that needs the **Push Notifications** capability + an APNs key — I'll flag it separately; the first version uses local/timeline updates (no push, no extra key).
</details>

<details>
<summary><b>3.5.4 — Widgets + StandBy</b></summary>

Uses the same extension target as 3.5.3 (no new bundle ID).

- **On device (you test):** long-press the Home Screen → **+** (top-left) → search "Debt Planner" → add the widget (try small + medium). Add one to the **Lock Screen** too (long-press lock screen → Customize → Lock Screen → add widget). For the **interactive** "log paycheck" widget, tap its button and confirm the app records it (interactive widgets = iOS 17+). **StandBy:** put the phone on a charger, landscape — the widget should appear.
</details>

<details>
<summary><b>3.5.5 — App Intents / Siri + Control Center</b></summary>

Code-only capability (no portal step).

- **On device (you test):** say *"Hey Siri, when am I debt-free?"* / *"Hey Siri, log a payment in Debt Planner"* → confirm Siri runs the intent. Check **Settings → Siri & Search → Debt Planner** shows the shortcuts. Add the Control Center control (Settings → Control Center, or long-press Control Center → + on iOS 18).
</details>

<details>
<summary><b>3.5.6 — TipKit</b></summary>

Code-only (iOS 17+). **On device:** confirm the feature-discovery tips appear at the right moments and dismiss/don't-repeat correctly. (To re-trigger tips during testing I can add a reset.)
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

- **EAS path:** **automatic** — EAS detects the new capability and re-creates/re-syncs the profiles on the next `eas build`. You just approve the prompt. This is the main reason I recommend EAS for this block.
- **Codemagic path (if you chose it):** **manual** — developer.apple.com/account → **Profiles** → find the app's (and each extension's) distribution profile → **Edit → Generate** (it picks up the new capability) → **Download** → upload to Codemagic (or re-run its automatic signing). Do this for **both** the app ID and the widget-extension ID.
</details>

---

## What I'll do in-repo (so the boundary is clear)

You do the dashboards/device; **I do all of this** and tell you exactly when to build/test:
- Add `eas.json` (build profiles) — or the Codemagic-for-Expo workflow if you choose that.
- Add `expo-apple-targets` + the widget/Live-Activity target (SwiftUI views for the Live Activity, widgets, Dynamic Island).
- Declare the App Group + wire the shared data store (app writes → extension reads).
- Add `react-native-ios-context-menu` + wire the row UIMenu.
- Write the App Intents / Siri intents + TipKit tips.
- Add debug triggers so you can test payday/Live-Activity/tips on demand.
- Run the pre-commit native-build checks (CI xcodeproj-glob, config-plugin sanity) before each native dep lands.

---

_Living doc — I'll update it as each 3.5.x feature is ready to test. Canonical plan: `DEBT_ELEVATION_PLAN.md` §3.5._
