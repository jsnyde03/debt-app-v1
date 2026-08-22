# 2.0 — the steps only you can do

> **Everything here needs a human, an Apple login, a device, or a decision.** Nothing on this list can be
> done from the repo, which is why it is a list and not a task.
> Generated at **P6.8.7b.6**, 2026-08-21, from the plan's open items. ⚠️ Re-read before acting: items move.

**How to read the columns.** *Blocks* = what cannot finish until you do it. *When* = the earliest it is
worth doing — some are cheap now, some are wasted effort before the final build exists.

---

## 1 · Do now — unblocked, off-device, no waiting

### 1.1 ⛔ ASC → App Privacy label: add **Diagnostics → Crash Data** `[A3]`
**Where:** App Store Connect → your app → **App Privacy** → Data Types.
**Do:**
- **ADD** `Diagnostics → Crash Data`. Purpose: **App Functionality**. Linked to identity: **No**. Tracking: **No**.
- **`Purchases → Purchase History`.** Purpose: **App Functionality** — and *only* that. Linked to identity: **No**. Tracking: **No**.
  - ⛔ Not Third-Party Advertising, not Developer's Advertising/Marketing, not Product Personalization — no ad SDK exists and entitlement is a boolean.
  - ⚠️ **Analytics is the only judgement call:** tick it *only if* you use RevenueCat's dashboard charts to make product decisions (audience size, what to build). It does **not** contradict the site's "no behavioral analytics", which is about usage tracking.
- **Leave UNDECLARED:** `Financial Info`, `Identifiers`, `Usage Data`. ⛔ Financial Info is the load-bearing one — it is the claim [D41] keeps true and P6.9 proves.

**Why it is first:** the label is checked **mechanically**; the policy page is read by a human, if at all.
Shipping Sentry against a label that still tells the 1.x *"no crash reporting"* story is the Guideline
5.1.1 mismatch that gets caught automatically. **This is the highest-risk item on the whole list and it
takes about four minutes.**
**Blocks:** P6.9 (privacy audit) · P6.21 (submission).

### 1.2 Fix the two **live** site pages `[A2]`
**Where:** the **`jsnyde03/debt-planner-site`** repo. ⛔ **NOT `debt-app-v1/site/`** — that is a stale v1.5
mirror, nothing here deploys it, and editing it changes nothing a reviewer loads.
**Do:** apply the replacement text in [`DEBT_SITE_COPY_2.0.md`](DEBT_SITE_COPY_2.0.md) —
- **A2.1** `privacy.html` — the *"Is not synced or backed up to iCloud"* bullet is **false**; iCloud backup ships.
- **A2.2** `privacy.html` — *"**If** a future update adds crash reporting"* → it is **this** update.
- **A2.3** both pages — the premium block is wrong six ways (same list as the store listing).
- **A2.4** `support.html` — the FAQ documents a CSV import. ⏳ **Leave until P6.21** — C8 may make it true.

⚠️ **Re-fetch the live pages before editing.** The drafts were written against v1.7 as of 2026-08-21.
**Blocks:** P6.9 · P6.21.

### 1.3 Availability: add **CA · AU · NZ**
**Where:** ASC → Pricing and Availability.
**Do:** US · CA · AU · NZ. ⛔ `£`/`€` storefronts are **out of 2.0**.
**Why now:** it is a checkbox with no code behind it (en-CA is `$`, period-decimal, English).

---

## 2 · Decisions owed — I am not building these until you answer

### 2.1 🔴 `[P1-10]` Windfall Autopilot has no tier gate
**The finding:** a free user's windfall is routed through the identical waterfall; premium only *shows*
the itemised split. That is the premium spec's own price test upside down — *"removing it must remove
**WORK**, not just info."*
**Already done:** the misleading copy shipped at b.5 — the invite now says *"Your $500 is already in the
plan"* instead of implying the money sits unrouted until you pay.
**The open call:** whether to actually gate the routing (a monetisation change).
**My recommendation: leave it for 2.1.** The dishonesty is fixed; the tier change is new behaviour inside
a phase converging on a freeze, and it would have to clear P6.10.
**Blocks:** nothing today. **Must clear P6.10 if you take it.**

### 2.2 ✅ `[R5]` The expense reserve — **shape settled 2026-08-21, build unblocked**
A **recommended-action row that can be declined**; declined → the next recommendation grows by the
balance; accepted → the hero bar shows it reserved. ⭐ **Two of those already work** — the engine supports
both end states today, so the build is the default, the row, and the decline control.

**Two small residuals, neither blocking — answer whenever, or let my recommendation stand:**
- **Does a decline last one cycle or forever?** *Recommend per-cycle* (the contribution is already
  cycle-keyed, and it is advice about *this* paycheck). If declining every payday reads as nagging, the
  fix is a remembered preference, not a different default.
- **The transition cycle:** the first paycheck after this ships holds this cycle's bills **and** a
  contribution toward next, so every existing user's debt number drops on upgrade. *Recommend saying it
  out loud once*, that cycle only — a silent drop in the headline number is how "the app broke my plan"
  starts.

**Blocks:** nothing. Sits after P6.8, must clear **P6.10**.

---

## 3 · On the next device build — not blocking, but it accumulates

⛔ **Nothing is blocked on a device right now** (your call, 2026-08-21). These ride the next build:

| row | what to check | why it cannot be checked here |
|---|---|---|
| **Splash** | `[D51]`'s light/dark splash | supersedes the badge version row 1 passed; `expo prebuild` cannot run on Windows |
| **Sentry capture** | fire the **QA test-event button** and confirm the event lands | there is **no user-triggerable `reportError` path**, so last time a missing event would have read as "Sentry is broken" |
| **R3 demo exit** | twice-fixed now — confirm it reads as a way out | P6.4 found the first fix had left it caption-sized |
| **Rows 1 and 7** | [`DEBT_DEVICE_PASS_2026-08-20.md`](DEBT_DEVICE_PASS_2026-08-20.md) | — |

⛔ **Source-map upload stays OFF for this build.** A missing `SENTRY_AUTH_TOKEN` hard-fails the **archive**,
which would kill the build before any of the three checks above ran. Worst case with it off is minified
stack frames. ⏸ When you do switch it on, I need the **org slug**.
**Fixes from this pass land at P6.15.**

---

## 4 · At the final build — the tail, in order

These are sequenced and each one genuinely waits on the one before.

1. **P6.14 — the final device pass.** 98 checkboxes in [`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md), on the **post-deletion** binary — the configuration that actually ships. Human-ticked, non-gating.
2. **P6.20 — screenshots + the App Preview**, captured **from that build**. ONE 886×1920 file, 15–30 s. ⚠️ A visual problem found here costs another build; that is why P6.18 exists.
3. **P6.21 — submission.** Four things are yours:
   - **Paste the 2.0 description** from [`release-notes/app-store-listing.md`](release-notes/app-store-listing.md) → *"2.0.0 DESCRIPTION — REWRITE DRAFT"*. ⚠️ **Re-check two lines first:** *Strategy Comparison side-by-side* and *CSV import* are only true if **C7** and **C8** shipped. If either slipped, delete its line.
   - **App Review note must name the paywall path** — *"Tap ••• More → Unlock Premium"*. v1.1 was rejected repeatedly for paywall-findability; this is not optional.
   - **Release notes** — lead with the rewrite. A 2.0 carrying 1.7-shaped notes re-creates the expectation problem.
   - **The launch-FLIP value gate.**
4. **`[A2-5]` The Marketing URL index page** (`jsnyde03.github.io/debt-planner-site/`). ⚠️ **ASC-registered and audited by NO lens** — it almost certainly repeats the same wrong premium block. Read it before submitting.

---

## 5 · Already done — so you do not do them twice

⛔ **These were still listed as owed by you somewhere in the plan and are not.** Corrected 2026-08-21.

- ✅ **Sentry DSN** — delivered 2026-08-20, in the Codemagic `AppleConnect` group. *(The P6.5 row said "needs the DSN from 🎯" for a day after you had given it.)*
- ✅ **Apple portal for iCloud** — done 2026-08-20; signing unblocked.
- ✅ **[D48] build + its device pass** — iCloud rows 2–6 green including the clobber guard.
- ✅ **[D53]** — 2.0 ships with **no free trial**.
- ✅ **[D40]–[D48], [D3], [D54]** — settled.

⚠️ **This section is why the file exists.** Three separate rows this session still said they were waiting
on you after you had already answered — a waiting list only ever decays one way, because closing a thing
updates the decision and nobody deletes the row that was waiting on it.

---

## What is NOT on this list

Everything I can do from the repo: P6.8.7c–g (the remaining audit build), P6.8.8's gate run, P6.8.9's
verification, P6.9, P6.10, P6.11's deletion, P6.12. You will see those land; none of them needs you until
they produce a decision, at which point they arrive in §2.
