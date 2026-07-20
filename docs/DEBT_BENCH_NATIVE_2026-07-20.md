# Debt — Best-in-Class Benchmark: NATIVE PLATFORM TOUCHES

> **Purpose:** external, cited teardown of first-in-class native-platform surfaces, feeding **Phase 0.5 (the technology-agnostic native-capability pass)** of the Elevation Plan. The bar is *first-in-class on each platform's OWN terms.*
> **Governing stance (from `DEBT_ELEVATION_PLAN.md` Operating Principle 2):** use native where it delivers a first-class result RN can't; each platform first-class on its own terms; **iOS native edges land in v1.7, Android's OWN native treatment at v1.8.** Shared `packages/core` engine + shared RN surface; only the native-capability EDGES diverge. Use native *where it earns the result, not everywhere* ([[feedback_less_is_more_premium]]).
> **App shape (context):** payday-triggered emotional payoff journey. Home = "Today" (what to pay this paycheck). "Progress" = the debt-free-date journey + milestones. No widget / Live Activity / haptics in the RN app yet; iPad is a width-capped centered column, not master-detail (`DEBT_ELEVATION_READINESS_AUDIT_2026-07-20.md`).
> **Method:** web-researched, real apps + real platform capabilities cited. Nothing invented. Sources listed per surface.

---

## 0. Verdict at a glance

| # | Native surface | Worth it? | First-class shape for Debt | RN vs native | Ship |
|---|---|---|---|---|---|
| 1 | **Home-screen widget** (WidgetKit) | ✅ **Yes — flagship** | Debt-free **countdown** + this-payday plan + progress ring; small/medium/lock/StandBy | SwiftUI-only UI; RN feeds data | **v1.7 iOS** |
| 2 | **Live Activity / Dynamic Island** | ⚠️ **Only as a bounded "payday sprint"** | NOT a debt-free countdown (hollow — 8h cap). A payday-day pay-checklist session, if at all | SwiftUI/ActivityKit; RN drives via native module | **Defer / prototype v1.7, ship-optional** |
| 3 | **App Intents / Siri / Spotlight / Control Center** | ✅ **Yes — cheap, high-leverage** | "What do I pay this payday?" · "Mark paid" · Spotlight deep-links · a Control Center / Lock-Screen control | Intents are Swift; small surface; RN handles the action | **v1.7 iOS (subset)** |
| 4 | **Genuinely-native iPad** | ✅ **Yes — bar-defining** | Three-column master-detail (debts list · detail · plan/inspector), sidebar, pointer/keyboard | RN *can* do adaptive layout; SwiftUI is cleaner for true master-detail | **v1.7 iOS (adaptive), native-embed optional** |
| 5 | **Haptics + micro-interactions** | ✅ **Yes — table stakes for premium** | Restrained system haptics on daily surfaces; a **Core Haptics** custom pattern ONLY on the debt-paid-off beat | expo-haptics covers 90%; Core Haptics needs a tiny native module | **v1.7 iOS** |
| 6 | **Android-native parity** | 🔜 **v1.8** | Glance widgets + Material 3 Expressive / dynamic color · Quick Settings tile · rich ongoing notification · Wear tile | Jetpack Glance / Compose native edges | **v1.8 Android** |

---

## 1. Home-screen widgets (WidgetKit / App Widgets)

### What first-in-class does
- **Copilot Money** ships polished home + lock-screen widgets that surface spending / budget / net-worth "at a glance without opening the app," but they're **bank-connection-dependent** — the widget is empty until data is live ([Copilot widgets help](https://help.copilot.money/en/articles/9834331-adding-widgets), [Copilot collections](https://help.copilot.money/en/collections/2832266-widgets)). Lesson: a widget that needs a live external feed can look broken; **Debt's widget is on-device by design, so it can always render real content** — a genuine differentiator.
- **Oura's "Ring Widget"** exposes VO2 Max / Cardio Load / progress-to-goal as glanceable lock-screen + home + watch widgets — a single number + a ring, nothing more ([App Store](https://apps.apple.com/us/app/ring-widget/id1663323988)).
- **Streaks / Streaks Widget** pins up to five "since" timers / streak counts to a space-efficient home widget — the whole product is a glanceable count ([Streaks Widget](https://streaks.arborapps.io/)).
- **Fitness (Activity rings)** is the archetype: one ring, filled = done, readable in <1 second.
- Debt precedent exists but is shallow: **DebtFree** dashboards a "debt-free countdown"; **YNAB** shows how much faster you'll be debt-free — but as in-app charts, not glanceable widgets ([YNAB debt apps](https://www.ynab.com/blog/5-best-apps-to-help-pay-off-debt), [best debt apps 2026](https://econumo.com/posts/best-debt-payoff-apps/)). **The glanceable debt-free countdown widget is a largely-unclaimed slot.**

### Platform capability
Lock-screen widgets (iOS 16), **interactive** widgets (iOS 17), and **StandBy** full-screen glance mode (charging on its side) all use one WidgetKit codebase ([WidgetKit refresh notes / TechCrunch](https://techcrunch.com/2022/06/06/apples-widgetkit-update-lets-developers-build-for-the-lock-screen-and-watch-with-the-same-code/)). **Constraint:** WidgetKit budgets ~40–70 refreshes/day (~every 15–60 min). This is a non-issue for Debt — a debt-free date and payday plan change on the order of *days*, not minutes, so the refresh budget is comfortable.

### What Debt's first-in-class widget is
Three glanceable jobs, mapped to families:
1. **Debt-free countdown** — "Debt-free in **2y 4m**" + a progress ring (% paid off). Small square + lock-screen circular + StandBy. This is the emotional hook, always renderable on-device.
2. **This-payday's plan** — "Pay **$420** this paycheck → Chase card." Medium rectangular. Interactive (iOS 17): a **Mark paid** button via an App Intent.
3. **Progress ring** — total paid vs. total, as an Activity-ring-style fill. Small + lock-screen inline/circular.

**Families to ship:** systemSmall (countdown), systemMedium (payday plan, interactive), accessoryCircular + accessoryRectangular (lock screen), and StandBy support (free once small is built).

### RN-vs-native call
**Native (SwiftUI) forced — but bounded.** Widget *UI* must be SwiftUI/WidgetKit; there is no RN-rendered widget. **This does NOT mean leaving Expo:** the official **`expo-widgets` / `expo-apple-targets`** path lets you author the SwiftUI widget target inside the Expo app and feed it data from the RN side (shared App Group storage), with "zero native project setup" beyond the Swift view ([Expo: Home screen widgets & Live Activities](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo), [Expo Widgets SDK](https://docs.expo.dev/versions/latest/sdk/widgets/), [bndkt/react-native-widget-extension](https://github.com/bndkt/react-native-widget-extension)). **Call: write ~1 small SwiftUI widget file; keep everything else RN.**

### Android-parity note (v1.8)
Android App Widgets via **Jetpack Glance** (Compose), styled with **Material You dynamic color** so the widget adopts the user's wallpaper palette, with a `defaultColorScheme` fallback ([Android widgets design](https://developer.android.com/design/ui/widget), [Glance/Wear widgets](https://developer.android.com/training/wearables/widgets)). Same three jobs (countdown / payday plan / ring), designed *as an Android widget* (dynamic color, Material 3 Expressive shapes) — not a reskin of the iOS card. A **Wear OS tile** (Glance + Material 3 Expressive) is a natural stretch: the debt-free countdown on the wrist.

---

## 2. Live Activities / Dynamic Island (iOS) + ongoing notifications (Android)

### What first-in-class does
Live Activities shine for **short, high-intent, clock-is-the-UX sessions**: Uber trip/ETA, delivery countdowns, ParkMobile meter expiry, CityMapper turn-by-turn, workout/timer, sports scores ([OneSignal: 22 examples](https://onesignal.com/blog/best-examples-of-apps-using-live-activities-to-enrich-their-ux/), [Pushwoosh iOS 18 Live Activities](https://www.pushwoosh.com/blog/ios-live-activities/)). The through-line: **an event that is genuinely happening right now and ends soon.**

### The hard constraint (why a debt-free countdown fails here)
Apple hard-caps a Live Activity at **~8 hours of active updates + up to 4 hours "stale" persistence**, then auto-removes it ([Apple HIG: Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities/), [Pushwoosh](https://www.pushwoosh.com/blog/ios-live-activities/)). Apple's own guidance: "designed for short-lived, real-time workflows, not long-running tracking… end them promptly." A **multi-year debt-free countdown is exactly the anti-pattern** — it would be perpetually stale or repeatedly re-created, which reads as broken. This **confirms the plan's flag that a recalc-only / countdown Live Activity is hollow.**

### The only honest Live Activity for Debt
A **bounded, session-shaped moment on payday itself**: "It's payday — 3 payments to make today," with a shrinking checklist and a **Mark paid** button (LiveActivityIntent), dismissed when the last payment is done. That's a real short session with a real end-state, matching the ParkMobile/checklist pattern. Even this is **optional flourish, not a pillar** — the widget already carries the payday plan glanceably without a live session.

### RN-vs-native call
**Native (ActivityKit/SwiftUI) if built at all** — and reachable from Expo via the same `expo-apple-targets` widget-extension path, with a native module bridging button taps back to JS ([Expo Live Activities](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo), [react-native-widget-extension](https://github.com/bndkt/react-native-widget-extension)). **Recommendation: do NOT commit it to v1.7.** Prototype-only; ship the widget instead. If the payday-sprint session tests well later, it's an additive v1.7.x / v1.8 delight, never a launch dependency. (Also heed the perf note: never update a Live Activity every second — it hammers CPU/battery; Debt's updates are event-driven anyway, [Expo integration notes](https://medium.com/inkitt-tech/live-activity-widget-in-expo-react-native-project-607df51f8a15).)

### Android-parity note (v1.8)
Android's equivalent is a **rich ongoing notification** (Notification with progress + actions) — and the emerging **Live Updates** promoted-notification style on Android 16. Same discipline: only for the bounded payday session, never a multi-year background countdown. On Android this is cheap and non-native-forcing (standard notification APIs).

---

## 3. App Intents / Siri / Spotlight / Control Center (iOS) + Android equivalents

### What first-in-class does
A single App Intent lights up **Siri, Spotlight, Shortcuts, the Action Button, interactive widgets, and (iOS 18) Control Center + Lock Screen controls** from one definition — Apple's caffeine-tracker sample lights the whole ecosystem in ~100 lines ([Apple: App Intents](https://developer.apple.com/documentation/appintents), [WWDC25 Get to know App Intents](https://developer.apple.com/videos/play/wwdc2025/244/), [GoodRequest App Intents guide](https://www.goodrequest.com/blog/app-intents-how-to-make-your-app-more-accessible-through-siri-spotlight-and-widgets)). Control widgets are iOS 18+.

### What's worthwhile for Debt (high leverage, low surface)
- **"What do I pay this payday?"** — a query intent returning the payday plan (Siri + Spotlight + Shortcuts). Powers the widget's interactivity too.
- **"Mark [debt] paid"** — an action intent; the same intent backs the widget/Live Activity buttons and a Shortcut automation ("when I get paid → remind me").
- **Spotlight deep-links** — surface "Today's plan" / "Progress" as indexed, jump-to results.
- **A Control Center / Lock Screen control (iOS 18)** — one tap to "Today's plan." A pleasant, cheap flourish once the query intent exists; low priority vs. the widget.

**These share plumbing with the widget** (same App Intents), so the marginal cost after building the widget is small — good value.

### RN-vs-native call
**Intents are Swift** (AppIntent structs), but tiny, and `expo-apple-targets` supports intent setup with a native module catching the intent and firing an event into JS to perform the action / open the app ([react-native-widget-extension intents](https://github.com/bndkt/react-native-widget-extension)). **Call: a thin Swift intent layer; the real work stays in RN/core.** Ship the query + mark-paid intents in v1.7 (they're the widget's backbone); treat the Control Center control as optional polish.

### Android-parity note (v1.8)
- **App Actions / built-in intents + Shortcuts API** for Assistant + dynamic shortcuts ("today's plan," "mark paid").
- A **Quick Settings tile** (customizable in 2025 Android) as the Control-Center analog — one tap to today's plan ([Android Quick Settings 2025](https://android-developers.googleblog.com/2025/08/introducing-material-3-expressive-for-wear-os.html)).
- Designed as Android affordances, not ports.

---

## 4. Genuinely-native iPad (master-detail / multi-column / Split View / pointer+keyboard)

### What first-in-class does
The gold standard is **three-column master-detail**:
- **Things 3** — landscape: project list · task list · task detail, all visible at once; elegantly collapses to two columns in portrait. Widely cited as the most beautiful dedicated iPad layout ([ToolFinder iPad to-do](https://toolfinder.com/best/to-do-list-apps-for-ipad)).
- **Todoist** — three-column landscape (sidebar · list · detail).
- **Notion** — full desktop parity + real Split View support.
- 2025 iPad design consensus: **persistent sidebar navigation, multi-column layouts, detailed inspector panels, simultaneous information display, refined Split View / Stage Manager** ([iPad design trends 2025](https://asoleap.com/ipad/development/monetization/discover-ipad-design-trends-modern-ui-patterns-2025), [Split View & multi-column layouts](https://medium.com/@mhamdouchi/split-view-and-multi-column-layouts-for-ipad-apps-775e0237d7a8)). A width-capped centered phone column (Debt's current state) reads as a blown-up phone and **fails the bar**.

### What Debt's first-in-class iPad is
A **three-column master-detail**:
1. **Sidebar** — Today/Plan · Progress · Your Money · More (the new IA), always visible in landscape.
2. **List column** — debts (or the payday plan items).
3. **Detail / inspector** — the selected debt's schedule, or the Progress journey with the debt-free date + milestones as the anchored right pane.
Plus: **pointer hover states, keyboard shortcuts** (⌘-based nav, mark-paid), Split View / Stage Manager multitasking, and a portrait two-column collapse. Restraint still governs the daily surface; the delight is in the milestone/celebration beats rendering large.

### RN-vs-native call
**RN can deliver a first-class *adaptive* result** — a responsive three-pane layout (sidebar + list + detail) with breakpoint logic is well within RN/Flexbox + a layout library, and keeps the shared surface shared. **Recommendation for v1.7: build the adaptive three-column layout in RN** (shared code, lowest cost to the bar). **Where native earns its place:** if a specific pane needs true UISplitViewController behavior (system-standard collapse/expand, sidebar animations, pointer semantics) to feel genuinely native rather than merely responsive, embed a **SwiftUI/UIKit pane via a Fabric native component** for that pane only. Start adaptive-RN; escalate to a native-embedded split-view pane *only if* the RN version misses the "feels truly iPad-native" bar in device QA. Don't native-rewrite the whole iPad app on spec.

### Android-parity note (v1.8)
Android's equivalent is the **canonical list-detail (two-pane) adaptive layout** via Material 3 `NavigationSuiteScaffold` / window size classes / Jetpack Compose adaptive — sidebar rail on expanded widths, list-detail on tablets/foldables, single-pane on phones. Same three-region intent, expressed with Material 3 Expressive components and dynamic color. Foldables get first-class treatment as their own affordance.

---

## 5. Haptics + platform micro-interactions

### What first-in-class does
- Haptics measurably lift engagement (cited 11–50% with subtle feedback) but **overuse fatigues** ([Saropa 2025 haptics guide](https://saropa.com/articles/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback/), [Newly: haptics in apps](https://newly.app/articles/haptics-mobile-apps)).
- Best practice: **`UIImpactFeedbackGenerator` / `UINotificationFeedbackGenerator` for standard UI**; reserve **Core Haptics** custom patterns for high-value, brand-defining moments; centralize haptics in one service that checks device capability + a user On/Minimal/Off setting; scale intensity to action importance ([Apple: Core Haptics](https://developer.apple.com/documentation/corehaptics), [iOS haptic guide/HackerNoon](https://hackernoon.com/the-ios-guide-to-haptic-feedback)).

### What Debt's first-in-class haptics are
- **Daily surfaces (restrained):** a light selection tick on tab switch / row select; a `.success` notification haptic on **Mark paid**. That's it on the calm surfaces — restraint reads premium ([[feedback_less_is_more_premium]]).
- **The one bespoke moment:** a **custom Core Haptics pattern on the debt-paid-off celebration** — a designed crescendo synchronized with the visual/motion beat. This is the "unique core brand interaction" the guidance says custom haptics are *for*. Exactly one, so it stays special.
- A **haptics On/Minimal/Off** setting in More → Preferences, respected globally.

### RN-vs-native call
**Mostly RN.** `expo-haptics` covers the standard impact/notification/selection generators — 90% of the surface, zero native code. **Only the bespoke debt-paid-off Core Haptics pattern needs native** (a tiny expo-module wrapping a `CHHapticEngine` pattern, or an `.ahap` file). **Call: RN/expo-haptics everywhere; one small native module for the single celebration pattern.** Don't over-invest.

### Android-parity note (v1.8)
Android's `VibrationEffect` / predefined effects + `HapticFeedbackConstants` (and Compose's haptic APIs) are the parity path. Android haptic hardware varies far more, so **test on real devices** and design a slightly more conservative celebration pattern; gate behind the same On/Minimal/Off setting. Perceived feel differs dramatically across devices — never assume the iOS pattern translates.

---

## 6. Applied recommendations / tech-choice map

Per surface: **worth-it**, **first-in-class shape**, **RN-vs-native**, **Android-parity**.

### ✅ Home-screen widget — **WORTH IT (flagship native touch)**
- **First-in-class:** debt-free countdown + this-payday plan (interactive Mark-paid) + progress ring; small/medium/lock/StandBy families. Always renderable on-device (beats Copilot's connection-dependent widget).
- **RN-vs-native:** SwiftUI widget target authored *inside* Expo via `expo-apple-targets`; data fed from RN through a shared App Group. ~1 SwiftUI file; rest stays RN.
- **Android (v1.8):** Jetpack Glance widget + Material You dynamic color; optional Wear tile.

### ✅ App Intents / Siri / Spotlight — **WORTH IT (cheap, shares widget plumbing)**
- **First-in-class:** query intent ("what do I pay this payday?") + action intent ("mark paid") + Spotlight deep-links; Control Center / Lock Screen control as optional polish.
- **RN-vs-native:** thin Swift intent layer, native module bridges to JS; core logic stays RN. Low marginal cost once the widget exists.
- **Android (v1.8):** App Actions / Shortcuts API + a Quick Settings tile.

### ✅ Genuinely-native iPad — **WORTH IT (bar-defining; current column state fails the bar)**
- **First-in-class:** three-column master-detail (sidebar · list · detail/inspector), pointer + keyboard, Split View / Stage Manager, portrait two-column collapse. Reference: Things 3.
- **RN-vs-native:** build the **adaptive three-column layout in RN** (shared surface, lowest cost). Escalate a single pane to a **SwiftUI/UIKit Fabric-embedded split-view** *only if* RN misses the "truly native iPad" feel in device QA. No full native rewrite on spec.
- **Android (v1.8):** Material 3 list-detail adaptive (`NavigationSuiteScaffold` + window size classes); foldable-first.

### ✅ Haptics + micro-interactions — **WORTH IT (premium table stakes, done with restraint)**
- **First-in-class:** restrained standard haptics on daily surfaces; ONE bespoke Core Haptics pattern on the debt-paid-off beat; global On/Minimal/Off setting.
- **RN-vs-native:** `expo-haptics` for everything standard; one tiny native module for the celebration pattern only.
- **Android (v1.8):** `VibrationEffect` / Compose haptics; conservative, device-tested celebration pattern.

### ⚠️ Live Activities / Dynamic Island — **NOT A PILLAR (confirmed hollow for a countdown)**
- **Why:** 8h-active + 4h-stale hard cap makes a multi-year debt-free countdown an anti-pattern (Apple: "not for long-running tracking"). The widget already carries the glanceable payday plan.
- **The only honest version:** a bounded **payday-day pay-checklist session** (Mark-paid buttons), dismissed when done — additive flourish, prototype-only.
- **RN-vs-native:** ActivityKit/SwiftUI via `expo-apple-targets` if ever built. **Do not commit to v1.7.**
- **Android (v1.8):** rich ongoing notification / Android 16 Live Updates for the same bounded session — cheap, non-native-forcing.

---

## 7. Recommended priority order

**v1.7 (iOS native edges — this ship):**
1. **Widget (WidgetKit, SwiftUI-in-Expo)** — the flagship. Debt-free countdown + payday plan + ring. Highest emotional payoff, on-device-always, an unclaimed slot in the debt category.
2. **App Intents (query + mark-paid) + Spotlight** — shares the widget's plumbing; lights up Siri/Shortcuts/interactive-widget for near-free once #1 exists.
3. **Haptics** — expo-haptics across the app + the one Core Haptics celebration pattern (built *with* the debt-paid-off delight beat in Phase 3).
4. **Adaptive three-column iPad (RN)** — clears the "not a blown-up phone column" bar; native split-view pane only if QA demands it.
5. **(Optional) Control Center / Lock Screen control** — cheap polish if #2 lands with time to spare.

**Explicitly deferred to v1.8 (Android's OWN first-class treatment):**
- Glance widgets + Material 3 Expressive / dynamic color (+ optional Wear tile)
- App Actions / Shortcuts + Quick Settings tile
- Material 3 list-detail adaptive layout (foldable-first)
- Android haptics (VibrationEffect / Compose), device-tested
- Rich ongoing notification (payday session), if the iOS prototype validates

**Prototype-only, not committed either version:** the payday-sprint Live Activity / Dynamic Island — build only if it tests as non-hollow; never a launch dependency.

**Guiding restraint:** every one of these must earn its place ([[feedback_less_is_more_premium]]). The widget + intents + haptics + adaptive iPad are the four that clear the "first-class on iOS's own terms" bar for v1.7; the Live Activity does not, and forcing it would be the exact hollow-feature trap the plan already flagged.

---

## Sources
- Copilot Money widgets — https://help.copilot.money/en/articles/9834331-adding-widgets · https://help.copilot.money/en/collections/2832266-widgets
- WidgetKit / lock-screen / refresh budget — https://techcrunch.com/2022/06/06/apples-widgetkit-update-lets-developers-build-for-the-lock-screen-and-watch-with-the-same-code/
- Oura Ring Widget — https://apps.apple.com/us/app/ring-widget/id1663323988
- Streaks Widget — https://streaks.arborapps.io/
- Debt payoff app landscape (DebtFree countdown, YNAB) — https://www.ynab.com/blog/5-best-apps-to-help-pay-off-debt · https://econumo.com/posts/best-debt-payoff-apps/
- Live Activities examples — https://onesignal.com/blog/best-examples-of-apps-using-live-activities-to-enrich-their-ux/ · https://www.pushwoosh.com/blog/ios-live-activities/
- Live Activities HIG + duration caps — https://developer.apple.com/design/human-interface-guidelines/live-activities/
- App Intents — https://developer.apple.com/documentation/appintents · https://developer.apple.com/videos/play/wwdc2025/244/ · https://www.goodrequest.com/blog/app-intents-how-to-make-your-app-more-accessible-through-siri-spotlight-and-widgets
- iPad master-detail (Things 3 / Todoist / trends) — https://toolfinder.com/best/to-do-list-apps-for-ipad · https://asoleap.com/ipad/development/monetization/discover-ipad-design-trends-modern-ui-patterns-2025 · https://medium.com/@mhamdouchi/split-view-and-multi-column-layouts-for-ipad-apps-775e0237d7a8
- Haptics best practices / Core Haptics — https://saropa.com/articles/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback/ · https://developer.apple.com/documentation/corehaptics · https://hackernoon.com/the-ios-guide-to-haptic-feedback
- Expo widgets / Live Activities / intents — https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo · https://docs.expo.dev/versions/latest/sdk/widgets/ · https://github.com/bndkt/react-native-widget-extension · https://medium.com/inkitt-tech/live-activity-widget-in-expo-react-native-project-607df51f8a15
- Android widgets / Material You / Wear / Quick Settings — https://developer.android.com/design/ui/widget · https://developer.android.com/training/wearables/widgets · https://android-developers.googleblog.com/2025/08/introducing-material-3-expressive-for-wear-os.html
