# Revenue Spine — Your Manual Setup Checklist (2026-07-25)

> **What this is:** the step-by-step for the things **only you can do** in external dashboards (App Store Connect, RevenueCat) for the v1.7 revenue spine (2.11). I handle all the app code; these are the account/product artifacts I can't create. Written assuming zero prior familiarity — follow it top to bottom.
>
> **Locked decisions this implements (2.11.1):** Monthly **$4.99** (already live) · Annual **$29.99** (new) · Lifetime **$79.99** one-time (new) · **no free trial** (paywall from day 1) · Lifetime = on-device Premium forever (not Connected/Ava).

---

## 0. Context — you are NOT starting from scratch ✅

Debt Premium is already live (v1.6, Capacitor). That means these already exist and must be **reused, not recreated**:
- **RevenueCat project** with Apple API key `appl_XUWODZnbbJFPbdMTgBTyKNAGGyp`.
- **Entitlement** identifier: `premium`.
- **Monthly product** at **$4.99** (already in App Store Connect + RevenueCat).
- **Bundle ID** `com.jasonsnyder.debtplanner` — the RN app uses the **same** one, so existing subscribers restore automatically. ✅ (already verified in the code)

So your job below is only: **add the two new products (Annual + Lifetime)** and wire them into the existing RevenueCat setup. Do **not** create a new RevenueCat project, a new entitlement, or a new monthly product.

---

## 1. App Store Connect — find your existing product ID convention (do this FIRST)

Before creating anything, look at how the existing monthly product is named, so the new ones match.

1. Go to **[App Store Connect](https://appstoreconnect.apple.com)** → **Apps** → **Debt Planner**.
2. Left sidebar → **Monetization** → **Subscriptions**.
3. You'll see a **Subscription Group** (e.g. "Debt Planner Premium") containing your monthly product. Click into it and **note the exact Product ID** of the monthly (e.g. it might be `premium_monthly`, or `com.jasonsnyder.debtplanner.premium.monthly`).
4. **Existing monthly Product ID (confirmed):** `paycheck_debt_planner_premium_monthly`

> **Use these exact IDs for the two new products (they match your existing pattern):**
> - **Annual:** `paycheck_debt_planner_premium_annual`
> - **Lifetime:** `paycheck_debt_planner_premium_lifetime`

---

## 2. App Store Connect — create the **Annual** subscription ($29.99/yr)

**Critical: the Annual must go in the SAME subscription group as the existing Monthly** (so the two are treated as one subscription the user switches between — never two stacked charges).

1. **Monetization → Subscriptions →** click your existing group (the one with Monthly).
2. Under **Subscriptions**, click the **(+)** / **Create** button.
3. **Reference Name:** `Premium Annual` (internal only, not shown to users).
4. **Product ID:** `paycheck_debt_planner_premium_annual`. ⚠️ Permanent — cannot be changed or reused later.
5. **Subscription Duration:** **1 Year**.
6. Save, then open the product and fill in:
   - **Subscription Prices →** Add price → choose **USD $29.99** (Apple auto-generates the other territories; you can accept the defaults). Availability: same territories as Monthly.
   - **App Store Localization →** add a **Display Name** (`Premium — Annual`) and **Description** (e.g. *"All Premium automation, billed yearly — best value."*).
   - **Review Information → Screenshot:** ⏳ *can wait* — see the note in §5. Leave for now; the product can sit in "Missing Metadata" until we have the paywall screenshot.
7. Leave any **Introductory Offer** section **empty** — we are intentionally shipping **no free trial**.

---

## 3. App Store Connect — create the **Lifetime** purchase ($79.99, one-time)

Lifetime is **not** a subscription — it's a **Non-Consumable In-App Purchase** (separate section).

1. Left sidebar → **Monetization → In-App Purchases** (NOT Subscriptions).
2. Click **(+) / Create**.
3. **Type:** **Non-Consumable**.
4. **Reference Name:** `Premium Lifetime`.
5. **Product ID:** `paycheck_debt_planner_premium_lifetime`. ⚠️ Permanent.
6. **Price:** **USD $79.99**.
7. **Localization →** Display Name `Premium — Lifetime`, Description (e.g. *"All Premium automation, forever. Pay once."*).
8. **Review screenshot:** ⏳ same as above — can wait for the paywall UI (§5).

---

## 4. RevenueCat — wire the two new products in

Go to the **[RevenueCat dashboard](https://app.revenuecat.com)** → your **Debt Planner** project.

### 4a. Add the products
1. Left sidebar → **Products** → **(+) New**.
2. Store: **App Store**. Enter the **exact** Annual Product ID from §2. Save.
3. Repeat for the **Lifetime** Product ID from §3.

### 4b. Attach both to the `premium` entitlement
1. Left sidebar → **Entitlements** → click **`premium`**.
2. **Attach** → select the new **Annual** product → attach.
3. **Attach** again → select the new **Lifetime** product → attach.
4. Confirm all three (Monthly, Annual, Lifetime) are now listed under the `premium` entitlement.

### 4c. Add them to the Offering (this is what the paywall reads)
1. Left sidebar → **Offerings** → open your **current / default** offering (the one already serving Monthly).
2. **(+) New Package** → choose package type **Annual** → attach the Annual product.
3. **(+) New Package** → choose package type **Lifetime** → attach the Lifetime product.
4. Confirm the offering now has **three packages: Monthly, Annual, Lifetime.**

> The app fetches packages by **type** (`MONTHLY` / `ANNUAL` / `LIFETIME`) from this offering, so getting the package **types** right in 4c is what makes each show up on the paywall.

---

## 5. About the review screenshots (why they can wait)

Every subscription/IAP needs a **review screenshot of the paywall** before Apple will approve it — but the paywall UI doesn't exist yet (I build it in step 2.11.4). So:
- **Now:** create the products with **Product ID + price only**. That's enough for me to wire RevenueCat and build against them.
- **For my dev testing:** I'll use a local **StoreKit test configuration** (same product IDs) so I can build and test the paywall **without** waiting on App Store Connect. No action from you.
- **Later (once the paywall exists):** you'll take a screenshot of the finished paywall and drop it into each product's **Review Information** so they reach **"Ready to Submit."** They then get submitted **together with the app build** at launch (Phase 6). I'll remind you when the paywall is done.

> ⚠️ One consequence: **real sandbox purchase testing** on a device needs the products at **"Ready to Submit"** (screenshot + metadata complete). Until then, on-device testing uses the local StoreKit config. Not a blocker for building.

---

## 6. Legal links for the paywall (I need two URLs from you)

Apple Guideline 3.1.2 requires the paywall to show tappable **Terms of Use (EULA)** and **Privacy Policy** links. I'll hardcode them; please confirm:

1. **Terms of Use / EULA →** we'll use **Apple's Standard EULA** (`https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`). ✅ Valid **as long as** your app's **License Agreement in App Store Connect is set to "Standard Apple License Agreement."**
   - Verify: **App Store Connect → Debt Planner → App Information → License Agreement** = *Standard Apple License Agreement*. Confirm: ☐
2. **Privacy Policy URL →** paste the **exact** Privacy Policy URL already configured for Debt Planner (App Store Connect → App Privacy / App Information). It's the one your live v1.6 already uses:
   - Privacy Policy URL: `________________________________`

---

## 7. Later — needed before launch, NOT before I start building (2.11.6)

These support analytics + crash reporting. **You don't need them for me to start the paywall** — I'll flag when they're on the critical path. Doing them now is fine too.

- **Sentry (crash/error reporting):**
  1. [sentry.io](https://sentry.io) → create (or reuse) a project → platform **React Native**.
  2. Copy the project's **DSN** (looks like `https://…@…ingest.sentry.io/…`).
  3. Send me the DSN: `________________________________`
- **Analytics backend:** tell me which service (if any) you want to use for the paywall funnel (viewed → started → completed → restored). Options range from lightweight (PostHog/Amplitude free tier) to none-for-now. If you have a preference or an existing account/key, share it; otherwise I'll recommend one when we get to 2.11.6.

---

## 8. Do NOT do (intentional, per our decisions)

- ❌ **No free trial / introductory offer** — leave those sections empty on all products. (A holiday promo trial is a possible *later* add on the existing monthly; it needs no new products, so ignore it for now.)
- ❌ **No new RevenueCat project, entitlement, or monthly product** — reuse what exists.
- ❌ **No Connected (Plaid) or Ava products** — those are separate future tiers.

---

## 9. When you're done — send me back:

1. ☐ The **exact Product IDs** you created for Annual and Lifetime.
2. ☐ Confirmation the RevenueCat **offering shows all three packages** (Monthly, Annual, Lifetime) and all three are attached to the **`premium`** entitlement.
3. ☐ The **Privacy Policy URL** (§6.2) and the License-Agreement confirmation (§6.1).
4. ☐ *(optional / later)* the **Sentry DSN** (§7).

With #1–#3 back, I can finish wiring the paywall to real products. I'll build everything else (SDK wiring, the paywall UI, gating, the launch flag) in the meantime against the local StoreKit config, so your dashboard work and my code work run in parallel.
