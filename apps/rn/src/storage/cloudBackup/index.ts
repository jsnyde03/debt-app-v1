import { createCloudBackupProvider } from './createCloudBackupProvider';
import type { CloudBackupProvider } from './provider';

/**
 * Process-wide provider singleton. The More screen's UI and the background auto-backup share it, so the
 * platform-resolved provider is constructed — and its native setup attempted — exactly once.
 */
let provider: CloudBackupProvider | null = null;

export function getCloudBackupProvider(): CloudBackupProvider {
  if (!provider) provider = createCloudBackupProvider();
  return provider;
}

export * from './provider';
export * from './service';
