import { useCallback, useEffect, useState } from 'react';

import { getCloudBackupProvider } from '@/storage/cloudBackup';
import { backupToCloud, getCloudBackupStatus, restoreFromCloud } from '@/storage/cloudBackup/service';
import { isSandboxStore } from '@/store/sandboxStore';
import { useActiveStore } from '@/store/StoreContext';
import { useAppStore } from '@/store/useAppStore';
import { reportError } from '@/utils/reportError';

/**
 * P6.3.3.5 — the More screen's iCloud row and sheet.
 *
 * ⛔ **NO native work during render.** Every value starts at a safe default and the real ones arrive in an
 * effect. This is not tidiness: a throw during render has no error boundary above this screen and becomes
 * an unhandled fatal on device — which is exactly how Freedom's version crashed on a real phone. The same
 * reasoning is why every call below is individually guarded rather than wrapped once at the top.
 *
 * ⚠️ On web and Android the provider is the unavailable stub, so `status` settles on `'unavailable'`, the
 * actions no-op, and the UI hides its controls instead of offering ones that do nothing.
 */

export type CloudBackupUiStatus = 'loading' | 'unavailable' | 'ready';
export type CloudBackupActionResult = 'ok' | 'unavailable' | 'no-backup' | 'error';

export interface UseCloudBackup {
  status: CloudBackupUiStatus;
  /** [D47] — opt-in, so this is false until the user turns it on. */
  enabled: boolean;
  lastBackupAt: string | null;
  /** Which long-running action is in flight, so the UI can disable both rather than queue them. */
  busy: 'backup' | 'restore' | null;
  setEnabled(next: boolean): Promise<void>;
  backupNow(): Promise<CloudBackupActionResult>;
  restoreNow(): Promise<CloudBackupActionResult>;
}

export function useCloudBackup(): UseCloudBackup {
  const [status, setStatus] = useState<CloudBackupUiStatus>('loading');
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  // ⚠️ Read with the hook, write through `useActiveStore()` — never the `appStore` singleton. Mixing the
  // two is how a component reads scripted tutorial money and mutates the user's real plan.
  const enabled = useAppStore((s) => s.store.prefs.cloudBackupEnabled === true);
  const store = useActiveStore();

  const refresh = useCallback(async () => {
    try {
      const next = await getCloudBackupStatus(getCloudBackupProvider());
      setStatus(next.available ? 'ready' : 'unavailable');
      setLastBackupAt(next.lastBackupAt);
    } catch (error) {
      reportError(error, { seam: 'cloud-backup', op: 'refresh' });
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const backupNow = useCallback(async (): Promise<CloudBackupActionResult> => {
    // ⛔ A SANDBOX must never reach iCloud. The tutorial runs the real screens over scripted money, so a
    // backup taken while it is active would overwrite the user's remote with a fiction. `bootstrapPersistence`
    // refuses a sandbox for the same reason; this is the same guard at the other end of the same risk.
    if (isSandboxStore(store)) {
      reportError(new Error('cloud backup attempted on a SANDBOX store — refusing'), { seam: 'cloud-backup' });
      return 'error';
    }
    setBusy('backup');
    try {
      // ⛔ Read the store at call time, not from a closure: the sheet can sit open across an edit, and a
      // captured snapshot would back up what the plan looked like when the sheet was opened.
      const result = await backupToCloud(store.getState().store, getCloudBackupProvider());
      if (result.ok) setLastBackupAt(result.at);
      await refresh();
      return result.ok ? 'ok' : result.reason;
    } finally {
      setBusy(null);
    }
  }, [refresh, store]);

  const restoreNow = useCallback(async (): Promise<CloudBackupActionResult> => {
    if (isSandboxStore(store)) {
      reportError(new Error('cloud restore attempted on a SANDBOX store — refusing'), { seam: 'cloud-backup' });
      return 'error';
    }
    setBusy('restore');
    try {
      const result = await restoreFromCloud(getCloudBackupProvider());
      if (!result.ok) return result.reason;
      store.getState().importStore(result.store);
      await refresh();
      return 'ok';
    } finally {
      setBusy(null);
    }
  }, [refresh, store]);

  const setEnabled = useCallback(
    async (next: boolean) => {
      store.getState().updatePrefs({ cloudBackupEnabled: next });
      // Turning it on with iCloud reachable seeds a backup immediately, so "on" means "backed up" rather
      // than "will be backed up the next time you happen to background the app".
      if (next && status === 'ready') await backupNow();
    },
    [status, backupNow, store],
  );

  return { status, enabled, lastBackupAt, busy, setEnabled, backupNow, restoreNow };
}
