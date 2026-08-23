import { unavailableCloudBackupProvider, type CloudBackupProvider } from './provider';

/**
 * P6.3.3.3 — the BASE variant: no cloud backup. Metro resolves this for web and Android;
 * `createCloudBackupProvider.ios.ts` overrides it on iOS.
 *
 * ⛔ This file is what keeps `react-native-cloud-storage` — a New-Arch TurboModule with a config plugin —
 * out of the web bundle entirely. The same split `createAdapter.web.ts` and `backupFile.web.ts` use, and
 * the reason the whole feature is testable off-device.
 */
export function createCloudBackupProvider(): CloudBackupProvider {
  return unavailableCloudBackupProvider;
}

/**
 * P6.8.7d.2 — **does this PLATFORM have iCloud backup at all**, which is a different question from
 * `isAvailable()`'s *"is it reachable right now"*.
 *
 * ⛔ Conflating the two breaks "Delete all data". C9's fix must refuse to wipe locally when the remote
 * copy could not be erased — but the stub's `isAvailable()` is permanently `false`, so on web and Android
 * that refusal would fire every time and the button would simply stop working. ⚠️ It is a platform
 * constant rather than a provider method on purpose: `unavailableCloudBackupProvider` is ALSO what iOS
 * degrades to when native setup throws, and that case must keep blocking.
 */
export const CLOUD_BACKUP_SUPPORTED = false;
