/**
 * P6.3.3.3 — the physical cloud-backup mechanism, behind an interface.
 *
 * One real implementation exists (`createCloudBackupProvider.ios.ts`, the app-private iCloud container) and
 * an `unavailableCloudBackupProvider` no-op for web, Android and tests. The service and the UI depend ONLY
 * on this interface, which buys two things: the native module never enters the web bundle (the
 * `backupFile.web.ts` / `createAdapter.web.ts` precedent), and every branch of the orchestration is
 * unit-testable against a fake provider with no device in the loop.
 *
 * ⚠️ Ported from `FinancialFreedom/src/storage/cloudBackup/provider.ts`, where this exact split is what let
 * the whole feature be built and tested before an iCloud entitlement existed.
 */

export interface CloudBackupMetadata {
  /** ISO timestamp of the backup file's last modification — this is what "Last backed up" renders. */
  modifiedAt: string;
}

export interface CloudBackupProvider {
  /** True only when an iCloud account is signed in AND this app's container is reachable. */
  isAvailable(): Promise<boolean>;
  /** Write (overwrite) the single backup file in the private container. */
  write(contents: string): Promise<void>;
  /** The backup file's contents, or `null` when there is none — including "not downloaded yet". */
  read(): Promise<string | null>;
  /** Metadata for the existing backup file, or `null` if there is none. */
  stat(): Promise<CloudBackupMetadata | null>;
  /**
   * P6.8.7d.2 [C9] — remove the backup file. **Resolves when there is nothing to remove**; "already gone"
   * is the success this method exists to reach, not an error.
   *
   * ⛔ Without it *"permanently erased… cannot be undone"* was **false**, and the failure mode was not
   * abstract: the copy outlives the wipe, so the next launch's restore offer hands **the previous owner's
   * whole plan to whoever is holding the phone.** Privacy, not polish.
   */
  delete(): Promise<void>;
}

/**
 * The no-op provider: web, Android, and the safe default.
 *
 * ⛔ `isAvailable()` returns false rather than throwing, and the writes are silent no-ops. Callers gate on
 * availability, so these guard a direct call — and the UI branches on the same signal to hide the controls
 * entirely. A dead button reads as a broken app; an absent one reads as a platform difference (the reason
 * `BACKUP_FILE_SUPPORTED` exists rather than a stub that fails when tapped).
 */
export const unavailableCloudBackupProvider: CloudBackupProvider = {
  async isAvailable() {
    return false;
  },
  async write() {
    // no-op — see above.
  },
  async read() {
    return null;
  },
  async stat() {
    return null;
  },
  async delete() {
    // no-op — there is no container here, so there is nothing to erase. ⚠️ Callers must still branch on
    // `isAvailable()` before treating a resolved delete as "the remote copy is gone": on web and Android
    // this resolving means only that nothing was ever there to begin with.
  },
};
