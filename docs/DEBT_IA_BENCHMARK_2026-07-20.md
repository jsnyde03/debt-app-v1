# Debt-Payoff App — Information Architecture Benchmark

**Date:** 2026-07-20 · **Feeds:** Phase 0.1 nav/structure redesign
**Scope:** Answer Q2 (consolidate Bills+Debts+Goals or keep separate?) and Q3 (bottom tab bar or a different top-level nav model?) with evidence from how real apps are *actually* structured.

**Fixed context (settled):** Home/primary tab = **Today** (the payday moment — "pay exactly this, this paycheck"). A first-class **Progress** destination = the emotional journey (debt-free date, milestones, streaks, celebration). Three management surfaces exist: **Bills** (recurring expenses), **Debts** (balances), **Goals** (savings). This benchmark decides how the management surfaces and the top-level nav are organized *around* that fixed Today + Progress spine.

---

## Group A — Finance / debt / budgeting apps

### YNAB (You Need A Budget)
- **Nav model:** Bottom tab bar (mobile), envelope-budget centric.
- **Top-level destinations:** **Budget** (the money-assignment envelope screen — the daily loop), **Accounts** (a *single consolidated hub* listing every linked account/balance), **Reports** (trends).
- **Relevant pattern:** All account *entities* live under **one** "Accounts" destination, not one tab per account. The daily behavioral surface (Budget) is separate from the management/reference surface (Accounts). Precedent for **one management hub + a distinct do-surface**.

### Copilot Money
- **Nav model:** Bottom tab bar, **user-reorderable** ("App sections" setting).
- **Top-level destinations:** Dashboard, Transactions, Investments, **Accounts**, Categories, Recurrings, **Goals** (7 sections — but rearrangeable, and most users pin ~5).
- **Relevant pattern:** Even a many-entity app collapses *all accounts into one "Accounts" tab organized by account type* rather than a tab per type. **Dashboard is the "today" overview** (new transactions, upcoming recurrings, monthly progress, trending categories). Goals is its own tab, but the low-frequency reference surfaces (Accounts, Categories, Recurrings) are each one consolidated hub. Precedent for **consolidate-by-type, surface-the-daily-view-as-home**.

### Monarch Money
- **Nav model:** **5-item bottom tab bar** + a **sidebar** reached via the profile icon (top-left) for "extra sections and settings."
- **Top-level destinations:** Dashboard, **Accounts** (one hub, filterable by entity), Budget, **Plan** (medium/long-term goals + contributions), Transactions — with Goals living *inside* Plan.
- **Relevant pattern:** Monarch's redesign explicitly **demoted low-frequency items to the profile sidebar to protect a tight 5-tab bar**, and folded **Goals into "Plan"** rather than giving it its own tab. Accounts = one consolidated, filterable hub. Precedent for **ruthless tab-slot discipline + consolidating goals under a broader surface**.

### Rocket Money
- **Nav model:** Bottom tab bar, dashboard-home.
- **Top-level destinations:** Home/Dashboard (balances, recent transactions, upcoming bills), **Recurring** (bills + subscriptions merged into ONE tab), Budgets, Goals, plus net-worth/credit.
- **Relevant pattern:** The **single strongest "consolidate" precedent** — bills and subscriptions, two conceptually distinct entity types, live in **one "Recurring" tab with segmented views (Upcoming / All / Calendar)**. Rather than two tabs, one hub with a segmented control. Directly analogous to merging Bills + Debts + Goals under one hub with sections.

### Undebt.it (debt-specific)
- **Nav model:** Web tool, **dashboard-centric** (single primary surface + deep tables).
- **Top-level surfaces:** **Dashboard** (per-debt payoff dates + interest summary — "where you spend most of your time"), Snowball/Avalanche payment table, Payment Manager, Debt Snowflakes (one-off extra payments like a bonus/tax refund/extra paycheck).
- **Relevant pattern:** A debt app naturally centers on **one dashboard = the plan**, with the "extra paycheck → throw it at debt" behavior (Snowflakes) as a first-class concept. Validates a **strong single home** over many peer tabs, and the payday-windfall loop.

### Debt Payoff Planner (debt-specific)
- **Nav model:** Simple stepped app: enter debts → plan → track.
- **Top-level surfaces:** Debt list, Payoff plan with charts + **debt-free date**, progress tracking that **"celebrates each step with fun indicators that show payoff victories."**
- **Relevant pattern:** Even a utilitarian debt app builds in **celebration + debt-free-date as the emotional payoff** — confirms Progress-as-emotional-center is table stakes, not novel; the wedge is doing it *premium + payday-triggered*.

### Cleo (AI money)
- **Nav model:** **Chat-first** — looks like a messaging app, not a tab dashboard.
- **Top-level "features":** spend, budget, chat, save, borrow, habits — surfaced conversationally rather than as peer destinations.
- **Relevant pattern:** The **exception that proves the rule** — chat-first only works because the product *is* a conversational agent. For a structured do→journey→manage app it's the wrong model. Noted so it's explicitly ruled out with a reason.

---

## Group B — Best-in-class journey / habit / progress apps

### Oura (the closest structural analog)
- **Nav model:** **3-tab bottom bar** — the cleanest possible "do → journey → manage."
- **Top-level destinations:**
  - **Today** — timely, relevant, *changes every day*; score shortcuts across the top. (= our Today.)
  - **My Health** — long-term trends, the "so what," weekly/quarterly/yearly reports; "how your daily habits shape your long-term health." (= our Progress / journey.)
  - **Vitals** — *every metric consolidated in one place*, grouped by area (sleep, activity, heart, etc.). (= our management hub.)
- **Relevant pattern:** **This is the template.** A daily "Today" home, a separate long-horizon "journey" tab, and **one consolidated reference hub** holding all the entities/metrics grouped into sections. Three tabs. Directly maps to Today / Progress / Money-hub.

### Duolingo
- **Nav model:** 5–6 tab bottom bar; **the home tab IS the journey** (the vertical lesson **path**), each tab with "its own identity."
- **Top-level destinations:** Learn (the path), Quests, Leagues, Practice Hub (Super), Profile.
- **Relevant pattern:** The emotional journey can *be* the home screen (the path), with streak celebration woven through. Argues that **Today and Progress could be tightly coupled** — but note Duolingo's path is both do AND journey because a lesson is the atomic action. For us, "pay this paycheck" (Today) and "how far to debt-free" (Progress) are distinct enough to separate (as Oura does).

### Finch (self-care pet)
- **Nav model:** Bottom tabs + a top-left menu button for settings/extras.
- **Top-level destinations:** **Home** (daily goals/quests — the do-surface), the **birb/pet tab** (characteristics, collections, Locations *progress*), Quests, Shop. Settings pushed to the corner menu.
- **Relevant pattern:** **Emotional payoff (the pet + its growth) gets its own first-class destination separate from the daily to-do home.** Exactly the Today-vs-Progress split. Also: settings/low-frequency items exiled to a corner menu, never a tab slot.

### Strava
- **Nav model:** 5-tab bottom bar.
- **Top-level destinations:** Home (feed), Maps, Record, Groups, **You**.
- **Relevant pattern:** **"You" consolidates all personal progress** — your activities, training stats, profile — into ONE hub rather than separate "Stats," "History," "Profile" tabs. Another consolidate-the-personal-surfaces precedent, and a first-class progress/you destination.

### Tab-bar design consensus (cross-app)
- Usability research: **3–5 tabs is the sweet spot**; bars with 3–5 items navigate **20–30% faster** than 6+. Beyond 5, tap targets crowd and findability drops. Standard remedy for overflow: **push low-priority destinations to a profile/drawer menu** (exactly what Monarch and Finch do).

---

## Patterns (synthesis)

### For Q2 (consolidate vs. separate) — what best-in-class does
1. **Consolidate low-frequency entity-management into ONE hub, sectioned.** The dominant pattern across *every* Group-A app with many entity types: YNAB "Accounts," Copilot "Accounts," Monarch "Accounts," and — most on-point — **Rocket Money "Recurring" merges two distinct entity types into one tab with segmented views.** Journey apps do the same: Oura "Vitals," Strava "You."
2. **Reserve tab slots for behavior, not for data types.** Tabs go to the *jobs* users do repeatedly (the daily loop, the journey), not to each noun the app stores. Management nouns collapse into a hub.
3. **A "manage" surface is touched far less often than the daily/journey surfaces** — so it doesn't earn equal top-level real estate. Monarch even demotes management extras below the tab bar into the profile sidebar.
4. **Goals in particular is routinely folded** — Monarch nests Goals inside "Plan"; it rarely stands alone as a peer tab in tightly-designed apps.

### For Q3 (nav model) — what best-in-class does
1. **The bottom tab bar wins decisively for the "do → journey → manage" shape.** Oura (3), Duolingo (5–6), Strava (5), Finch, Monarch, Rocket, Copilot, YNAB — all bottom-tab. It exposes the journey persistently (critical for a reason-to-stay app; a drawer would hide Progress).
2. **3–5 tabs is the validated range**; a 3–4 destination app is the *textbook* tab-bar case.
3. **The home tab is a curated "Today" surface**, not a raw list — Oura Today, Copilot Dashboard, Rocket Dashboard, Duolingo path. It answers "what matters right now."
4. **Alternatives are job-specific, not general:** chat-first (Cleo) only fits a conversational agent; pure hub-and-spoke fits single-action tools; the journey-as-home merge (Duolingo/Finch) fits when the daily action and the journey are the same atomic thing. None of these fit a payday-loop + separate-emotional-journey app better than a tab bar.

---

## Recommendation

### Q2 — **Consolidate Bills + Debts + Goals into ONE management hub with clear sections.** ✅
Ship a single **"Money"** (or "Manage") tab containing sectioned/segmented sub-surfaces for Debts, Bills, and Goals — mirroring **Rocket Money's "Recurring"** (two entity types, one tab, segmented views), **Oura's "Vitals,"** **Monarch's "Accounts" + Goals-in-Plan,** and **Strava's "You."**

**Reasoning:**
- The app's two reasons-to-open are **Today** (payday loop) and **Progress** (journey). Those must own the tab bar's emotional weight. Spending 3 of ~5 slots on low-frequency CRUD (add/edit a bill, a balance, a goal) **dilutes the wedge** and pushes the bar to 5 crowded tabs.
- Bills/Debts/Goals management is **reference + occasional-edit** work — exactly the low-frequency category best-in-class collapses into one hub. The *frequent* interaction with debts already happens through Today ("pay this") and Progress ("how far") — the hub only holds the raw entity editing.
- Keeps the tab bar at a tight, fast **3–4 tabs** (Today · Progress · Money [· optional 4th]) — inside the validated 3–5 range and matching Oura's clean 3.

**Precedents that most drive this:** Rocket Money "Recurring," Oura "Vitals," Monarch (Accounts hub + Goals-under-Plan), Strava "You."

**Strongest counter-case:** **Debts is the hero entity** of a *debt* app — not a peer of Bills/Goals. If usability testing shows people repeatedly hunt for their debt list, promote **Debts** to its own 4th tab and keep only **Bills + Goals** consolidated (a "do → journey → Debts → other money" 4-tab bar). Also watch a common consolidation failure: a hub that's just a segmented control over three unrelated lists can feel like a junk drawer — each section needs a genuinely distinct, well-designed sub-screen (Rocket's segmented views are the model; a bare tab-switcher is the anti-pattern).

### Q3 — **Yes: a bottom tab bar, 3–4 tabs.** ✅
Top-level = **Today** (default/home) · **Progress** · **Money** (the consolidated hub), with an optional 4th only if Debts is promoted per the Q2 counter-case. Settings/account/low-frequency extras go to a **corner icon or a row inside Money**, never a tab slot (Monarch/Finch pattern). Do **not** use a drawer/hamburger for primary nav, and do **not** go chat-first.

**Reasoning:**
- This app's shape — **do → journey → manage** — is almost exactly **Oura's Today / My Health / Vitals**, which is a 3-tab bottom bar. The structural analog already exists and is best-in-class.
- A **persistent** tab bar keeps **Progress one tap away at all times** — essential for a reason-to-stay app. A drawer would bury the emotional journey and kill the very stickiness Progress exists to create.
- 3–4 tabs sits in the research-backed sweet spot (20–30% faster than 6+), and every comparable journey/finance app converges on it.

**Precedents that most drive this:** Oura (3-tab do/journey/manage), Duolingo & Finch (journey as a first-class tab, settings exiled to a corner), Strava/Monarch/Rocket (tab bar is the finance-app default), plus the 3–5-tab usability consensus.

**Strongest counter-case:** **Duolingo/Finch fuse the journey into the home screen** (the path IS the home). One could merge Today + Progress into a single scrolling home and run only 2–3 tabs. But that's already been decided against (Today and Progress are settled as separate), and **Oura validates the split** — its Today (timely/daily) and My Health (long-horizon "so what") are deliberately distinct surfaces because they answer different questions. Keep them separate.

---

## Sources
- YNAB — [App Store](https://apps.apple.com/us/app/ynab/id1010865877), [Features](https://www.ynab.com/features)
- Copilot Money — [Dashboard Tab](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview), [Accounts Tab](https://help.copilot.money/en/articles/6213732-accounts-tab-overview), [Categories Tab](https://help.copilot.money/en/articles/9504513-categories-tab-overview)
- Monarch Money — [New mobile navigation](https://www.monarch.com/new-mobile-navigation), [Using Goals](https://help.monarch.com/hc/en-us/articles/15000751305108-Using-Goals)
- Rocket Money — [Where to view subscriptions & bills](https://help.rocketmoney.com/en/articles/3117398-where-can-i-view-my-subscriptions-and-bills), [Managing bills & subscriptions](https://help.rocketmoney.com/en/articles/2185531-managing-your-bills-and-subscriptions)
- Undebt.it — [How it works](https://undebt.it/how-undebt.it-works.php)
- Debt Payoff Planner — [Homepage](https://www.debtpayoffplanner.com/)
- Cleo — [Penny Hoarder review](https://www.thepennyhoarder.com/budgeting/cleo-app-review/)
- Duolingo — [Core tabs redesign](https://blog.duolingo.com/core-tabs-redesign/), [Home screen redesign science](https://blog.duolingo.com/new-duolingo-home-screen-design/)
- Finch — [Exploring the Home Page](https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page)
- Oura — [New app experience](https://ouraring.com/blog/new-oura-app-experience/), [Oura App Redesign: Today/Vitals/My Health](https://liveworksleep.com/oura-app-features/)
- Strava — [New navigation bar](https://www.cyclingweekly.com/news/product-news/a-new-look-for-strava-app-with-updates-to-the-navigation-bar-498270)
- Tab-bar best practices — [UXDworld](https://uxdworld.com/bottom-tab-bar-navigation-design-best-practices/), [Smashing Magazine](https://www.smashingmagazine.com/2016/11/the-golden-rules-of-mobile-navigation-design/), [Mobbin tab-bar glossary](https://mobbin.com/glossary/tab-bar)
