# Live site + ASC privacy label — 2.0 corrections [A2 · A3]

> **Drafts for 🎯 to apply by hand. Nothing here is fixable from this repo.**
> Produced at **P6.8.7b.6**, 2026-08-21. Findings: M1 (claims-vs-product), refuted/corrected by **R2**.

---

## ⛔ READ THIS BEFORE EDITING ANYTHING

**The pages App Review loads are in the `jsnyde03/debt-planner-site` repo.** They are **not**
`debt-app-v1/site/`, and changing `site/` here accomplishes exactly nothing.

| | this repo's `site/` | live at `jsnyde03.github.io/debt-planner-site/` |
|---|---|---|
| `privacy.html` | **v1.5 · 2026-07-03** | **v1.7 · 2026-07-27** |
| `support.html` | **v1.5** | **v1.7** |
| last commit touching it | `34c7c89`, 2026-07-05 | — |

The live privacy page carries a paragraph this repo has never contained. **No workflow here deploys
`site/`** — `embed-pages.yml` publishes the Expo marketing embed and nothing else.

⚡ **This mattered:** three findings were filed against `site/*.html:<line>` quotes that are not the
strings a reviewer sees, and two of them changed verdict once the live page was actually fetched. **Read
the live page before editing it** — the corrections below were written against v1.7, and if the page has
moved again since 2026-08-21 they need re-checking.

⚠️ **Both URLs are paywall-linked under Guideline 3.1.2**, so a reviewer reaches them in one tap from the
purchase screen. These are genuine claim surfaces, not marketing pages.

---

## A2.1 · `privacy.html` — the iCloud bullet is false

**Live text (v1.7), in *"What data the app stores"*:**

> Is not synced or backed up to iCloud

**Why it is false:** 2.0 ships **iCloud backup** (P6.3). It is opt-in and default-off ([D47]), which does
not save the sentence — the policy is precisely what a user consults to decide whether to enable it, so
a policy that denies the feature by name is worse when the feature is optional, not better.

⛔ **And there is a sharper half neither M1 nor the bullet covers: the READ is not opt-in.** On every
fresh install the app calls `restoreFromCloud` **before any consent**, to decide whether to offer a
restore (`_layout.tsx:183-199`). The write is opt-in; the read is unconditional. A policy that says
nothing about iCloud except that it is unused cannot cover that.

**Replacement:**

> **iCloud backup — optional, and off until you turn it on.** If you enable it in More → iCloud Backup,
> your plan is copied to **your own** iCloud account so a new device can pick up where the old one left
> off. It is never sent to us — we have no servers and no account for you to have. When you first install
> the app it checks whether a backup of your own already exists, so it can offer to restore it; if there
> is none, nothing is read and nothing is written.

---

## A2.2 · `privacy.html` — the crash-reporting tense

**Live text (v1.7):**

> *…**If a future update adds crash reporting** to help us diagnose and fix bugs, it will collect only
> anonymous technical crash diagnostics (such as device model, OS version, and the error itself) — never
> your financial data or anything you've entered — and we will update this page to reflect it.*

**Why it is false:** crash reporting is in **this** update. The DSN was delivered on 2026-08-20 and
`codemagic.yaml` pulls the `AppleConnect` group into every release archive, so Sentry initialises in
2.0.0. ⚠️ `codemagic.yaml:33`'s *"Sentry ships DISABLED (no DSN) until Phase 6"* is a **stale comment**,
not evidence of the build.

⭐ **The page currently promises MORE than the app takes**, which is the one thing in its favour:
`sentry.ts:26-29` strips `user`, `request` and `contexts.device`, so **device model is not collected**.
The replacement narrows the claim to what actually leaves.

**Replacement:**

> **Crash diagnostics.** This version includes crash reporting, so a crash can be diagnosed and fixed. It
> sends anonymous technical information about the failure itself — never your financial data, your
> balances, or anything you have entered. Device identifiers, network details and device model are
> stripped before anything is sent.

⛔ **This one is the highest-stakes edit on the page, and the page is not where it matters most** — see
**A3**.

---

## A2.3 · `privacy.html` + `support.html` — the premium block is wrong six ways

The live pages repeat the store listing's premium feature set. **Every correction in
[`release-notes/app-store-listing.md` → "2.0.0 DESCRIPTION — REWRITE DRAFT"](release-notes/app-store-listing.md)
applies here identically**, and it is one list, so fix them in the same sitting or they will drift again —
which is how they got here.

Shortest form: **Smart Insights** and **3-Month Forecast** do not exist · **What-If Simulation**,
**Amortization Schedule** and **Pay Cycle History** are **free**, not premium · **Strategy Comparison**
becomes real only if **C7** ships.

---

## A2.4 · `support.html` — the FAQ documents a CSV import that does not exist

The FAQ gives instructions for importing a CSV. `detectBackupFormat.ts:27` accepts three JSON shapes and
there is no CSV path in `apps/rn/src`.

⏳ **Do not delete this one yet.** **C8 (P6.8.7g) builds the CSV import**, and its parser
(`core/imports/debtCsv.ts`) must be rescued before P6.11 deletes its only caller. If C8 ships, the FAQ
becomes true and needs only its steps re-checked against the real flow. **If C8 slips, delete the entry.**
⚠️ Decide this at **P6.21**, against the shipped build — not now.

---

## A3 · ASC **App Privacy** label — declare Diagnostics → Crash Data

⛔ **This outranks every HTML edit above, and it is the one nobody had assigned.** The privacy *label* is
checked mechanically by App Review; the policy page is read by a human, if at all. Shipping Sentry while
the label still says the 1.x "no analytics, no crash reporting" story is a **Guideline 5.1.1** mismatch of
exactly the kind that gets caught automatically.

**Required in App Store Connect → App Privacy:**

| collection type | declare | purpose | linked to identity | tracking |
|---|---|---|---|---|
| **Diagnostics → Crash Data** | ✅ **ADD** | **App Functionality** | **No** — `sentry.ts:26-29` strips `user`, and there is no account | **No** |
| **Purchases → Purchase History** | ✅ keep/confirm | **App Functionality** *(see below)* | **No** | **No** |
| Financial Info | ⛔ **UNDECLARED** | — | — | — |
| Identifiers · Usage Data | ⛔ **UNDECLARED** | — | — | — |

**Purchase History — why App Functionality and nothing else** *(verified 2026-08-21 against
`premium/purchasesClient.ts`)*. `Purchases.configure({ apiKey })` passes **no `appUserID`**, so the id is
RevenueCat's anonymous one; there is no `setAttributes`, `setEmail` or `collectDeviceIdentifiers`, and no
attribution SDK anywhere in the tree. The only calls are `getCustomerInfo`, `getOfferings`,
`purchasePackage` and `restorePurchases`. The data leaves for exactly one reason: deciding whether premium
is unlocked.

⚠️ **The one condition that adds `Analytics`:** if RevenueCat's dashboard charts are used to make product
decisions — audience size, which features to build — Apple's *"measure audience size or characteristics"*
applies and Analytics should be ticked too. ⛔ **It does NOT contradict the site's "no behavioral
analytics"**, which is about usage tracking; revenue metrics are a different claim. Ticking it is cheap
insurance, leaving it off is defensible — **🎯 decides on how he actually uses the dashboard.**

⛔ **Financial Info must stay undeclared, and that is the load-bearing one** — it is the claim [D41] exists
to keep literally true and P6.9 exists to prove. **Usage Data** likewise: `track()` no-ops with no sink,
and `funnel.test.ts` now **fails** the moment one is installed.

⛔ **P6.9 owns proving this, and P6.21 owns filing it.** Recorded here because b.6 is where it was
surfaced, and because a checkbox with no owner is how it would ship wrong.

---

## What this does NOT cover

- **Whether the live pages moved again after 2026-08-21.** Re-fetch before editing.
- **The iCloud container's exact nature** — `createCloudBackupProvider.ios.ts` was not opened; A2.1's
  wording says "your own iCloud account", which is true either way.
- **Marketing URL** (`jsnyde03.github.io/debt-planner-site/`) — the index page was never audited by any
  lens. ⚠️ It is ASC-registered and almost certainly repeats the same premium block.
