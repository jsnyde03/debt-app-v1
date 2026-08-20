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
};
