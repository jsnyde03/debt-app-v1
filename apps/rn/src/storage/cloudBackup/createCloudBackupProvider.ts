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
