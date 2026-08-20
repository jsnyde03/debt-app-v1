# Sentry — what P6.5 needs from you (2026-08-20)

> **The code is done and inert.** `initErrorReporting()` **no-ops when `EXPO_PUBLIC_SENTRY_DSN` is unset**,
> so nothing below blocks a build — it blocks the *verification*. Sentry cannot be proven to capture
> anything without a real DSN on a real build, which is why this rides the [D48] batched build.

## What to create, and what to paste back

1. **sentry.io → create a project** — platform **React Native**, name it `debt-planner`.
2. From **Settings → Projects → debt-planner → Client Keys (DSN)**, copy the **DSN**. It looks like
   `https://<hash>@o<org-id>.ingest.sentry.io/<project-id>`. ⚠️ A DSN is **public by design** — it is
   write-only ingest, it is meant to be embedded in a shipped client, and ours is `EXPO_PUBLIC_` precisely
   because Metro must inline it into the bundle. It is not a secret; the auth token in step 4 is.
3. 🔴 **In Codemagic** (Settings → Environment variables, group `AppleConnect`), add:
   `EXPO_PUBLIC_SENTRY_DSN` = the DSN. **Not** marked secure — a secure var is masked in logs, and this one
   needs to survive into the JS bundle.

   ⛔ **It does NOT go in `codemagic.yaml`, and that is a decision, not an oversight.** ✅ **DSN received
   2026-08-20 and deliberately not committed.** The tempting argument is that a DSN is *public by design* —
   write-only ingest, and it ships inlined in every binary anyway, so committing it "changes nothing." ⚠️
   **That is true of the exposure and false of the effort.** `gh repo view` says this repository is
   **PUBLIC**: extracting a DSN from an IPA needs someone to target you, while a public repo is indexed and
   scraped automatically, and the payoff is a quota flood on your project. ⭐ **`lint:secrets` now enforces
   this** (`scripts/check-committed-secrets.ts`, in the `lint:rn` chain) — it reads `git ls-files`, so it
   guards what is *committed*, and it is mutation-verified against a real-shaped DSN.
4. ⏸ **Source-map upload — deliberately NOT part of the first build.** See the section below.

✅ **Done 2026-08-20:** DSN received, `EXPO_PUBLIC_SENTRY_DSN` added to the Codemagic `AppleConnect` group
(🎯), project slug **`debt-planner`**, project id **`4511944380907520`**, and 🎯 already holds a Sentry
**auth token** from another app in the same org.

⏸ **Still needed, and only when uploads are switched on: the ORG slug** (Settings → General → *Organization
Slug* — a name like `jason-snyder`, not the numeric `o4511649294450688` in the DSN). The
`@sentry/react-native` plugin wants `{ organization, project }`; the numeric id is not a substitute.

## ⛔ Why source maps are still deferred past the FIRST build — even now that a token exists

`codemagic.yaml` sets `SENTRY_DISABLE_AUTO_UPLOAD: "true"`. Its comment records the original reason: the
`@sentry/react-native` config plugin adds an upload build phase that **hard-fails a release archive** when
`SENTRY_AUTH_TOKEN` is missing — it breaks at `PhaseScriptExecution`, before anything runs.

⚠️ **An existing token weakens that argument but does not retire it.** The failure mode changes from
*"missing token"* to *"wrong scope, wrong org, or not present in the Codemagic environment"* — a token that
works for another app is scoped to an org, and this is a new project inside it. **The blast radius is
identical: the archive dies.**

⛔ **And the asymmetry is what decides it.** This build carries **three** proofs that exist nowhere else —
iCloud signing, the splash render, Sentry capture. Worst case with uploads OFF is *minified stack frames*.
Worst case with uploads ON is **no device verification at all** and another ~45-minute macOS cycle. Minified
frames are legible enough to confirm capture, which is the entire claim P6.5 makes.

✅ **The flip, once the device pass is green:** set `SENTRY_AUTH_TOKEN` in the Codemagic group, change
`SENTRY_DISABLE_AUTO_UPLOAD` to `"false"`, and add `["@sentry/react-native", { "organization": "<org-slug>",
"project": "debt-planner" }]` to `apps/rn/app.json`. That last one also silences the `expo prebuild` warning
*"Missing config for organization, project."* ⚠️ Neither slug is a credential — the org and project ids are
already inside the DSN, which ships in the binary — so they are safe to commit; the **token is not**, and
`lint:secrets` will refuse it.

## What is already built and tested off-device

- **`beforeSend`** strips `user`, `request` and `contexts.device`.
- ⛔ **`beforeBreadcrumb` — the one that matters.** `beforeSend` scrubs the *event*; breadcrumbs are the
  *trail*, and Sentry's touch integration records the pressed element's **accessibility label**. Debt builds
  those out of the user's own figures (`money.tsx:828` → `"Overdue, 2 items, $450"`), **so without this a
  crash on the Money tab would ship real balances to a third party** — exactly what [D41] says never
  happens. `scrubBreadcrumb.ts` redacts currency-formatted amounts and **drops `console` breadcrumbs
  outright** (their content is unbounded — in development it has carried whole store objects). 21 asserts,
  both directions, mutation-verified.
- **Hardened for RN 0.85 + New Arch** already, off a Freedom lesson: session/app-hang/watchdog trackers are
  disabled because in v7 they threw an unhandled TurboModule exception → SIGABRT on background.

## The device row (P6.5's half of the batched pass)

1. Install the build, confirm the app opens normally — **a DSN that is wrong or unreachable must not change
   app behaviour at all.**
2. Trigger a crash or a `reportError` path, then check the Sentry issue arrives.
3. ⛔ **Open the issue's BREADCRUMBS and read them.** The pass condition is not "an issue appeared" — it is
   **no `$` amount anywhere in the trail**, and no `console` category. That is the assertion the unit tests
   cannot make about the real SDK's own breadcrumb shapes.
