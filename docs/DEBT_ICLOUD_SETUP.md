# iCloud backup — the Apple-portal setup (P6.3.3.1)

> **What this is:** the one-time, **code-cannot-do-it** setup that lets a Debt Planner build *sign* with
> iCloud entitlements. The app code and the `react-native-cloud-storage` Expo config plugin already inject
> the entitlements at prebuild — verified, see below — but **Apple will not let a build sign with them**
> until an iCloud Container is registered and the iCloud capability is enabled on the App ID.
>
> ⛔ **Do this BEFORE the [D48] batched Codemagic build**, or the build fails at signing and the cycle is
> spent. Ported from `FinancialFreedom/docs/ICLOUD_BACKUP_SETUP.md`, which exists for exactly this reason.

**Already verified from this repo** — `npx expo config --type introspect` (run in `apps/rn`) shows the
plugin writing all four keys, so nothing below is about the app's configuration:

| Entitlement | Value |
|---|---|
| `com.apple.developer.icloud-container-identifiers` | `["iCloud.com.jasonsnyder.debtplanner"]` |
| `com.apple.developer.icloud-services` | `["CloudDocuments"]` |
| `com.apple.developer.icloud-container-environment` | `Production` |
| `com.apple.developer.ubiquity-container-identifiers` | `["iCloud.com.jasonsnyder.debtplanner"]` |

⚠️ **The portal's iCloud capability offers only two radios** — *"Include CloudKit support (requires Xcode
6)"* vs *"Compatible with Xcode 5"*. Pick **Include CloudKit support**: that is simply the name of the
modern iCloud capability and it covers the iCloud **Documents** / ubiquity-container file storage this app
uses. There is **no separate "iCloud Documents" radio** — that granularity lives in the entitlements file
above. ⛔ Despite the radio's name, **the app creates and uses no CloudKit database** — only one file in the
private container.

---

## Step A — create the iCloud Container

1. **developer.apple.com/account** → **Certificates, Identifiers & Profiles** → **Identifiers**.
2. Top-right dropdown says **"App IDs"** — switch it to **"iCloud Containers"**.
3. Blue **(+)** → fill in:
   - **Description:** `Debt Planner iCloud`
   - **Identifier:** `iCloud.com.jasonsnyder.debtplanner` ← must be exactly this. It matches
     `iCloudContainerIdentifier` in `apps/rn/app.json` and the container the app reads at runtime.
4. **Continue** → **Register**.

## Step B — enable iCloud on the App ID and assign the container

1. Switch the dropdown back to **"App IDs"** → open **`com.jasonsnyder.debtplanner`**.
2. In **Capabilities**, tick **iCloud**. The row expands with two radios, a **Configure** button and
   *"Enabled iCloud Containers (0)"*.
3. Select **"Include CloudKit support (requires Xcode 6)"** (see the note above).
4. **Configure** → tick `iCloud.com.jasonsnyder.debtplanner` → **Continue** / **Save**. The count must read
   **(1)**. *(An empty list means Step A did not register — go back.)*
5. **Save** at the top of the App ID page, and confirm the "modify App capabilities" prompt.

## Step C — the provisioning profile

Enabling a capability does **not** update existing profiles.

- **Codemagic uses automatic signing here** (App Store Connect API key), so it fetches/regenerates the
  profile on the next build — *provided Steps A–B are saved first*. Nothing to do manually.
- If a build ever fails at signing with *"Provisioning profile … doesn't include the
  `com.apple.developer.icloud-container-identifiers` entitlement"* → A or B was not saved before the build.

## Step D — verify on the device (P6.3.3.8)

⛔ **None of this is verifiable on web or in the simulator.** The web suite exercises only the *unavailable*
branch, by construction.

1. On the test iPhone: **Settings → [your name] → iCloud** → **iCloud Drive** on, signed in.
2. Install the build, complete onboarding.
3. **More (•••) → Data → iCloud backup** — the sheet should show the toggle and *"Not backed up yet"*, not
   *"Sign in to iCloud…"*. Turn it **on**: it seeds a backup immediately, and the status becomes
   *"Last backed up …"*.
4. **Delete the app**, reinstall, launch → expect **"Restore from iCloud?"** → **Restore** → the plan
   returns. ⚠️ This is the `readWithDownload` path: on a fresh install the file exists before it has
   downloaded, so a failure here looks like *"there is no backup"*.
5. ⛔ **The clobber-guard row, and it is the one worth doing carefully:** reinstall → **decline** the
   restore ("Not now") → onboard fresh → background the app → **reopen and check the remote is still the
   OLD backup**, not the bare new plan. This is the defect that makes "restore later" impossible, and it is
   invisible until the day someone needs it.
6. Edge: turn **iCloud Drive off** in iOS Settings → reopen the app → the sheet must read
   *"Sign in to iCloud on this device to back up your plan."* with **no controls at all**, and must not
   crash.
