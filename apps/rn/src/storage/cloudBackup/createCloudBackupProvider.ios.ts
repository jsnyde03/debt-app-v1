import { CloudStorage, CloudStorageProvider, CloudStorageScope } from 'react-native-cloud-storage';

import { reportError } from '@/utils/reportError';

import { metadataFromMtime, unavailableCloudBackupProvider, type CloudBackupMetadata, type CloudBackupProvider } from './provider';

/**
 * P6.3.3.3, iOS — one file in the app's PRIVATE iCloud ubiquity container, via
 * `react-native-cloud-storage` v3 (a New-Arch TurboModule writing real `FileManager` ubiquity files; its
 * "CloudKit" naming is a misnomer — there are no CKRecords and no database).
 *
 * ⛔ **`AppData` scope, never `Documents`.** `AppData` is the container ROOT: private, and invisible in the
 * Files app. `Documents` would surface the user's whole portfolio as a readable JSON file they can stumble
 * on, rename or delete. Also not `NSUbiquitousKeyValueStore`, which caps at 1 MB — a real portfolio with
 * history will pass that, and the failure would arrive silently and late.
 *
 * ⚠️ **Everything below is device-only verifiable** and none of it runs under `test:app` or on web. The
 * defences are not speculative: each targets a state Freedom actually hit on a device (`4.3.8`).
 *
 * The iCloud entitlements are injected at prebuild by the library's Expo config plugin — see `app.json`,
 * and `docs/DEBT_ICLOUD_SETUP.md` for the Apple-portal half, without which the build fails to SIGN.
 */

/** A single file at the container root. The leading slash IS the root — not a folder named "". */
const BACKUP_PATH = '/debt-planner-cloud-backup.json';
const SCOPE = CloudStorageScope.AppData;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Read the file, tolerating the state that only exists on a FRESH INSTALL: iCloud knows the file exists
 * but has not materialised it locally yet, so `readFile` throws while `exists` says true.
 *
 * ⛔ This is exactly the moment the feature has to work — a new device, restoring — so treating that throw
 * as "no backup" would fail the only case anybody installs this for. We ask iCloud to pull it, then poll.
 * Returns null only when there is genuinely nothing, or the download never lands inside the window.
 */
async function readWithDownload(): Promise<string | null> {
  if (!(await CloudStorage.exists(BACKUP_PATH, SCOPE))) return null;
  try {
    return await CloudStorage.readFile(BACKUP_PATH, SCOPE);
  } catch {
    await CloudStorage.triggerSync(BACKUP_PATH, SCOPE).catch(() => {});
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await delay(700);
      try {
        return await CloudStorage.readFile(BACKUP_PATH, SCOPE);
      } catch {
        // still downloading — keep polling
      }
    }
    return null;
  }
}

/** P6.8.7d.2 — see the base variant. iOS is the one platform where a remote copy can exist. */
export const CLOUD_BACKUP_SUPPORTED = true;

export function createCloudBackupProvider(): CloudBackupProvider {
  // iCloud + AppData are the iOS defaults; set explicitly so behaviour does not silently follow a library
  // default that changes. ⛔ Guarded: if the native provider setup throws (an iCloud-availability observer
  // failure is the documented one), degrade to the unavailable provider rather than taking the caller down
  // with it. A backup feature must never be the reason the app will not open.
  try {
    CloudStorage.setProvider(CloudStorageProvider.ICloud);
    CloudStorage.setProviderOptions({ scope: SCOPE });
  } catch (error) {
    reportError(error, { seam: 'cloud-backup', op: 'provider-init' });
    return unavailableCloudBackupProvider;
  }

  return {
    async isAvailable() {
      try {
        return await CloudStorage.isCloudAvailable();
      } catch (error) {
        reportError(error, { seam: 'cloud-backup', op: 'is-available' });
        return false;
      }
    },
    async write(contents: string) {
      await CloudStorage.writeFile(BACKUP_PATH, contents, SCOPE);
    },
    read() {
      return readWithDownload();
    },
    /**
     * ⛔ **BOTH DIRECTIONS OF AN ABSENT `mtimeMs` WERE UNHANDLED, AND THEY FAIL DIFFERENTLY.**
     * [S1.10.6.4 · pass-3 blocker B3, second half]
     *
     * ⚡ Measured, not reasoned: `new Date(undefined).toISOString()` and `new Date(NaN).toISOString()` both
     * **throw** `RangeError: Invalid time value` — which is the `unknown` the guard above now refuses. But
     * `new Date(null)` and `new Date(0)` do **not** throw; they become **`1970-01-01T00:00:00.000Z`**, and
     * `inspectRemote` then compares that epoch date as a real file identity. A silent 1970 is the worse of
     * the two: it never reaches a guard at all.
     *
     * ⛔ **IT THROWS, AND `null` WOULD HAVE BEEN THE CLOBBER WEARING THE FIX'S CLOTHES.** The finding's own
     * remedy said *"return `null` rather than an epoch date or a throw"* — and `null` is precisely the value
     * `inspectRemote` reads as **`none`**, *"there is no copy to lose"*, which the guard **permits**. A file
     * that exists and cannot be identified is the one case that must never be permitted. A throw is caught
     * by `inspectRemote` and becomes `unknown`, which the guard now refuses.
     *
     * ⚠️ **The stat-after-write path catches it too and falls back to our clock — the safe direction, and
     * the next inspect reads `unknown`, which the guard REFUSES.**
     *
     * ⛔ **S1.11.5.4 [pass-4 `F-B1`] — the app does NOT ask.** Measured against the real modules, with a
     * provider whose `stat()` raises:
     *
     * ```
     * 1) backupToCloud on an un-stat-able file -> ok, at = OUR clock, writes = 1
     * 2) next inspectRemote                    -> { state: "unknown" }      (not `unclaimed`)
     * 3) next guarded backup                   -> { ok: false, reason: "unavailable" }, writes = 1
     * ```
     *
     * `inspectRemote` never reaches the `unclaimed` branch: `provider.stat()` **throws**, and that
     * function's own `catch` returns `unknown` first. ⚠️ So the app does not **ask** — it **refuses**, and
     * every later automatic backup is refused the same way for as long as the mtime stays unreadable.
     * ⭐ The direction is still safe and the conclusion still holds — `writes` stays at 1 and nothing is
     * clobbered — which is why this was filed `minor`. **Only the mechanism was wrong.**
     *
     * ⚠️ **A docblock is a carried premise and decays like a carried number**, in both directions: this
     * paragraph is duplicated at `provider.ts:20-35`, and *that* copy never made the `unclaimed` claim and
     * was accurate the whole time.
     */
    async stat(): Promise<CloudBackupMetadata | null> {
      if (!(await CloudStorage.exists(BACKUP_PATH, SCOPE))) return null;
      const s = await CloudStorage.stat(BACKUP_PATH, SCOPE);
      // ⛔ The rule lives in `provider.ts` because this file imports a TurboModule and no test runner can
      // load it — which is precisely why the rule had neither an owner nor a test.
      return metadataFromMtime(s?.mtimeMs);
    },
    /**
     * P6.8.7d.2 [C9] — erase the container's one file.
     *
     * ⛔ **`exists` first, and `unlink` throws on a missing file.** "Nothing there" is the state this call
     * is trying to REACH, so surfacing it as a failure would make "Delete all data" report an error on the
     * second tap, or on a device whose iCloud copy was already removed elsewhere — and the caller's only
     * honest response to a failure is to tell the user their backup survived, which would be a lie.
     * ⚠️ A throw from `unlink` itself is NOT swallowed: that one means the file is still there.
     */
    async delete() {
      if (!(await CloudStorage.exists(BACKUP_PATH, SCOPE))) return;
      await CloudStorage.unlink(BACKUP_PATH, SCOPE);
    },
  };
}
