import { toCloudBackupUiStatus } from '@/hooks/use-cloud-backup';
import type { CloudBackupStatus } from '@/storage/cloudBackup/service';

const cases: [string, CloudBackupStatus][] = [
  ['signed out',                       { available: false, unreadable: false, lastBackupAt: null }],
  ['signed in, timestamp readable',    { available: true,  unreadable: false, lastBackupAt: '2026-08-01T00:00:00Z' }],
  ['signed in, timestamp UNREADABLE',  { available: true,  unreadable: true,  lastBackupAt: null }],
];
console.log('what `setEnabled(true)` does, per status  (use-cloud-backup.ts:275 — `if (next && status === \'ready\') await backupNow()`)');
for (const [label, s] of cases) {
  const ui = toCloudBackupUiStatus(s);
  console.log(`  ${label.padEnd(34)} -> status=${JSON.stringify(ui).padEnd(20)} seeds a backup: ${ui === 'ready'}`);
}
