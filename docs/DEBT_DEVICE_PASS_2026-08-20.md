# Device pass — the [D48] batched build (2026-08-20)

> **What this build proves, and nothing else proves:** **P6.3** iCloud backup · **P6.5** Sentry capture ·
> **P6.6** the splash. All three are **device-only verifiable** — the web suite exercises the *unavailable*
> branch by construction, and `expo prebuild` cannot even run on Windows.
>
> ⛔ **This is NOT the P6.14 52-row pass.** That one runs later, on the post-deletion binary, off
> [`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md). This is three features, ~20 minutes.
>
> **Report back:** the row number and what you saw. A row that *half* works is the interesting result — say
> what you actually observed, not whether it "passed", and I will decide which it was.

---

## ⛔ STEP 0 — BEFORE YOU TOUCH ANYTHING: export a backup

**Rows 4–7 require deleting the app, and deleting it destroys local data that may not exist anywhere else.**

1. Open the build → **More (•••) → Data → Export backup → Save as a file**. Put it somewhere that is not
   the app (Files → iCloud Drive, or AirDrop it to the Mac).
2. ⚠️ **If this device still holds v1.6 data you care about, stop and tell me.** The RN app uses the **same
   bundle id** as the retired Capacitor app, so deleting it also deletes the **WebKit container the legacy
   bridge migrates from**. That source is not recoverable by reinstalling.

✅ Do not proceed until you have a backup file you can see outside the app.

---

## 1 · Splash (P6.6) — you get one look, and only on a cold start

**Force-quit the app** (swipe it away), then launch it.

| | |
|---|---|
| ✅ Pass | A dark field with the app icon centred. ⭐ **The badge should DISSOLVE into the background** — its dark corners melting out, leaving the glowing teal bars and a soft vignette |
| ⛔ Fail | A **white flash** before the app appears (the default we are replacing), or the icon sitting on the field as a **visible square** with a hard edge |
| ⚠️ Known | If your phone is in **light mode** you will get a dark splash handing into a light UI. That is the recorded residual, not a defect — tell me if it bothers you and it is one config block to add a light variant |

⚠️ It is quick. If you miss it, force-quit and relaunch — it only shows on a cold start.

---

## 2 · iCloud is reachable (P6.3)

**Settings → [your name] → iCloud → iCloud Drive must be ON** before this row means anything.

Open **More (•••) → Data → iCloud backup**.

| | |
|---|---|
| ✅ Pass | A sheet with a **"Back up to iCloud"** toggle (OFF — it is opt-in, [D47]), the status **"Not backed up yet"**, and **Back up now** / **Restore from iCloud** buttons |
| ⛔ Fail | *"Sign in to iCloud on this device to back up your plan."* with no controls — means the container is unreachable. **Not a code bug**: check iCloud Drive is on and you are signed in |
| ⛔ Fail | The row still says **"coming soon"** with a **Soon** badge → you are on an old build |

---

## 3 · Back up, and confirm it is REAL

1. Turn the **toggle ON**. It seeds a backup immediately, so "on" means "backed up" rather than "will be".
2. The status should become **"Last backed up <today, a few seconds ago>"**.
3. Tap **Back up now**. Expect **"Backed up."** and the time to update.

| | |
|---|---|
| ✅ Pass | The time is *now*, and it changes when you tap again |
| ⛔ Fail | *"That didn't work…"* — tell me the exact wording; each phrasing maps to a different failure |
| ⚠️ Watch | A time that never changes means we are rendering a local guess instead of the file's own timestamp — a real defect, and a subtle one |

---

## 4 · ⭐ THE ROW THAT MATTERS — the clobber guard

**This is the one to run carefully.** It is the defect that makes *"I'll restore it later"* silently
impossible, and it is invisible until the day someone needs it.

1. **Delete the app** from the home screen. *(Step 0's backup is your safety net.)*
2. **Reinstall from TestFlight** and launch.
3. You should be offered **"Restore from iCloud?"**.
4. ⛔ **Tap "Not now".** Deliberately decline.
5. Complete onboarding fresh — enter a paycheck and one debt, anything.
6. **Background the app** (swipe up to the home screen) and wait ~10 seconds.
7. Reopen it → **More → Data → iCloud backup**.

| | |
|---|---|
| ✅ **Pass** | The status still shows the **ORIGINAL** backup time from row 3 — *before* the delete. The bare new plan did **not** overwrite it |
| ⛔ **Fail** | The time is from **step 6** — the app backed up the empty new plan over your real one, and the backup you declined to restore is **gone** |

⚠️ **Also check:** the toggle should read **OFF** on the fresh install ([D47] is opt-in, and the pref lives in
the store you just wiped). If it is ON, auto-backup is running for someone who never asked.

---

## 5 · Restore actually restores

1. Still on the fresh install: **More → Data → iCloud backup → Restore from iCloud**.
2. You get an **in-sheet** warning (deliberately not an iOS alert) naming what is lost, and a
   **"Replace my data"** button. Tap it.

| | |
|---|---|
| ✅ Pass | Your original plan is back — the debts, the paycheck, the bills from before the delete |
| ⚠️ Watch | ⛔ **A slow first read is EXPECTED here and is the point of the row.** On a fresh install iCloud knows the file exists before it has downloaded it, so the app triggers a sync and polls for a few seconds. **If it says "There is no backup in iCloud yet" — that is a real failure**, and it is the exact case the whole feature exists for |
| ⛔ Fail | It restores but the numbers are wrong, or the app lands on onboarding with the data invisible behind the gate |

---

## 6 · The unavailable path is honest

1. **Settings → [your name] → iCloud → iCloud Drive → OFF.**
2. Reopen the app → **More → Data → iCloud backup**.

| | |
|---|---|
| ✅ Pass | *"Sign in to iCloud on this device to back up your plan."* and **no controls at all** — no greyed toggle, no dead buttons |
| ⛔ Fail | A crash, or controls that are present and do nothing when tapped |

**Turn iCloud Drive back ON afterwards.**

---

## 7 · Sentry (P6.5) — and reading the breadcrumbs IS the test

1. Use the app normally for a minute — **tap around the Money tab specifically**, open a bill, a goal, the
   Guardian card. This is what builds the breadcrumb trail.
2. Trigger an error. Easiest reliable route: **More → Data → Import backup**, paste obvious junk
   (`not a backup`), and try to import — that exercises a `reportError` path without needing a crash.
3. Open **sentry.io → debt-planner → Issues**.

| | |
|---|---|
| ✅ Pass, part 1 | An issue arrives at all. ⚠️ Frames will be **minified** — that is expected; source-map upload is deliberately off for this build |
| ⭐ Pass, part 2 | ⛔ **Open the issue and read its BREADCRUMBS.** There must be **no `$` amount anywhere** in the trail, and **no `console` entries**. Redacted amounts appear as `$[redacted]` |
| ⛔ **Fail** | **Any real amount in a breadcrumb** — e.g. `Overdue, 2 items, $450`. That is your own money on a third-party server, and it is the thing [D41] promises never happens |
| ⚠️ Also | The app must behave **identically** whether Sentry works or not. A DSN problem must never change what the user sees |

---

## 8 · Nothing else broke

A quick sweep, because this build changed app startup (`_layout`), the More screen, and the launch sequence:

- Today, Progress and Money all render with your data.
- **More → Export backup → Save as a file** still opens the share sheet.
- No unexpected dialog on launch for an already-onboarded user — ⛔ **the restore offer must appear only on a
  fresh install**, never to someone who has already onboarded.

---

## What to send me

For each row: the number, and **what you saw** — screenshots for rows 1, 4 and 7 if you can. ⚠️ Row 4's
result is the one I most need in your words: *which* timestamp was showing, the original or the new one.

⏭ After a green pass: fixes are **P6.15**, and source-map upload flips on in one commit
(`SENTRY_AUTH_TOKEN` + `SENTRY_DISABLE_AUTO_UPLOAD: "false"` + the plugin's `{organization: "jason-snyder",
project: "debt-planner"}`) — deliberately held until now so a bad token could not kill the archive that was
carrying all three of these proofs.
