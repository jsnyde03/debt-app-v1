import { useCallback, useEffect, useState } from 'react';

import { toCloudAction } from '@/data/cloudBackupMessages';
import { getCloudBackupProvider } from '@/storage/cloudBackup';
import {
  backupToCloud,
  backupToCloudGuarded,
  getCloudBackupStatus,
  inspectRemote,
  restoreFromCloud,
} from '@/storage/cloudBackup/service';
import type { DebtStore } from '@/data/models';
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
/**
 * ⚠️ `remote-unclaimed` is NOT a failure. It is the B3 guard refusing to destroy a copy this install has
 * never accounted for, and the only correct response is to put the choice in front of the user.
 */
/** ⛔ [pass-5 B5-11] `remote-unreadable` is distinct from `unavailable`: the user IS signed in. */
export type CloudBackupActionResult = 'ok' | 'unavailable' | 'no-backup' | 'error' | 'remote-unclaimed' | 'remote-unreadable';

/**
 * P6.8.7d.3 [M3-5] — an outcome **plus the specific thing the code already worked out about it.**
 *
 * ⛔ `restoreNow` used to return `result.reason` alone, so `decodeCloudBackup`'s exact diagnosis —
 * *"That iCloud file isn't a Debt Planner backup"*, *"…made by a newer version… update the app"* —
 * was computed, carried through two layers, and thrown away at the last one. Every distinct failure
 * rendered as one generic *"That didn't work."*
 *
 * ⚠️ `BackupSheets.tsx:98` has always done `setError(result.message)` for the FILE importer, over the same
 * envelope family. This was never a missing capability; it was one screen not doing what its sibling did.
 */
export interface CloudBackupAction {
  result: CloudBackupActionResult;
  /** Present only when the layer below computed something more specific than the reason. */
  message?: string;
}

export interface UseCloudBackup {
  status: CloudBackupUiStatus;
  /** [D47] — opt-in, so this is false until the user turns it on. */
  enabled: boolean;
  lastBackupAt: string | null;
  /**
   * P6.8.7d.1 [B3] — the mtime of an iCloud backup this install has NOT accounted for, or null. When this
   * is set, every write path is refusing until the user chooses, and the sheet must say so: the status
   * line otherwise renders *"Last backed up …"* over a copy that is not theirs.
   */
  unclaimedRemoteAt: string | null;
  /** Which long-running action is in flight, so the UI can disable both rather than queue them. */
  busy: 'backup' | 'restore' | null;
  /**
   * ⛔ **S1.11.5.2 [pass-4 `C4-6`] — THE PRE-READ IS IN FLIGHT.** Distinct from `busy`, deliberately:
   * `busy: 'restore'` would mislabel the state as *"we are overwriting your device"* on a screen whose
   * whole job is to say what is about to happen. This one means *"we do not yet know what is in the
   * backup"*, which is exactly the condition under which the confirm must not be committable.
   */
  previewing: boolean;
  setEnabled(next: boolean): Promise<void>;
  /**
   * ⛔ `opts.replaceUnclaimed` is the user having been SHOWN the other copy and having chosen to lose it.
   * Nothing may pass it on the user's behalf — that is the whole defect this parameter exists to prevent.
   */
  backupNow(opts?: { replaceUnclaimed?: boolean }): Promise<CloudBackupAction>;
  /** ⛔ [C-7b] Read the remote WITHOUT committing it, so the confirm can say what is in the file. */
  previewRestore(): Promise<DebtStore | null>;
  restoreNow(): Promise<CloudBackupAction>;
}

export function useCloudBackup(): UseCloudBackup {
  const [status, setStatus] = useState<CloudBackupUiStatus>('loading');
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [unclaimedRemoteAt, setUnclaimedRemoteAt] = useState<string | null>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const [previewing, setPreviewing] = useState(false);
  // ⚠️ Read with the hook, write through `useActiveStore()` — never the `appStore` singleton. Mixing the
  // two is how a component reads scripted tutorial money and mutates the user's real plan.
  const enabled = useAppStore((s) => s.store.prefs.cloudBackupEnabled === true);
  const store = useActiveStore();

  const refresh = useCallback(async () => {
    try {
      const next = await getCloudBackupStatus(getCloudBackupProvider());
      setStatus(next.available ? 'ready' : 'unavailable');
      setLastBackupAt(next.lastBackupAt);
      // ⛔ P6.8.7d.1 — asked on every refresh, not once at mount. The remote can gain a foreign copy while
      // this sheet sits open, and a stale belief about iCloud is exactly what licensed the B3 overwrite.
      // ⚠️ Read the claim at CALL time. A value captured in this callback's closure would be the one from
      // before the backup that just re-stamped it, and the sheet would keep warning about its own file.
      const claimed = store.getState().store.prefs.cloudBackupRemoteAt;
      const claim = await inspectRemote(getCloudBackupProvider(), claimed);
      setUnclaimedRemoteAt(claim.state === 'unclaimed' ? claim.at : null);
    } catch (error) {
      reportError(error, { seam: 'cloud-backup', op: 'refresh' });
      setStatus('unavailable');
    }
  }, [store]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const backupNow = useCallback(
    async (opts?: { replaceUnclaimed?: boolean }): Promise<CloudBackupAction> => {
      // ⛔ A SANDBOX must never reach iCloud. The tutorial runs the real screens over scripted money, so a
      // backup taken while it is active would overwrite the user's remote with a fiction. `bootstrapPersistence`
      // refuses a sandbox for the same reason; this is the same guard at the other end of the same risk.
      if (isSandboxStore(store)) {
        reportError(new Error('cloud backup attempted on a SANDBOX store — refusing'), { seam: 'cloud-backup' });
        return { result: 'error' };
      }
      setBusy('backup');
      try {
        // ⛔ Read the store at call time, not from a closure: the sheet can sit open across an edit, and a
        // captured snapshot would back up what the plan looked like when the sheet was opened.
        const current = store.getState().store;
        // ⛔ P6.8.7d.1 [B3] — the guarded path is the DEFAULT and the unguarded one needs an argument.
        // `replaceUnclaimed` is only ever true because the sheet showed the user the other copy's date and
        // they chose to lose it. This is the whole finding: an overwrite is fine, an *uninformed* one is not.
        const result = opts?.replaceUnclaimed
          ? await backupToCloud(current, getCloudBackupProvider())
          : await backupToCloudGuarded(current, getCloudBackupProvider());
        if (result.ok) {
          setLastBackupAt(result.at);
          // ⚠️ Claim the file we just wrote, or the very next check calls our own backup a foreign copy and
          // the guard refuses forever. `result.at` is the observed mtime, not our clock — see `backupToCloud`.
          store.getState().updatePrefs({ cloudBackupRemoteAt: result.at });
        }
        await refresh();
        return { result: result.ok ? 'ok' : result.reason };
      } finally {
        setBusy(null);
      }
    },
    [refresh, store],
  );

  /**
   * ⛔ **THE CLOUD DOOR CONFIRMED BEFORE IT FETCHED, SO IT HAD NOTHING TO DESCRIBE.**
   * [S1.10.6.4 · pass-3 C-7b]
   *
   * ⚡ `BackupSheets.tsx`'s own docblock states the rule this door did not follow — *"Import: read a backup,
   * **SHOW what is in it**, and only then replace."* The file importer has the bytes in hand before it
   * confirms; this one called `restoreNow()` *after* the tap. ⛔ **So the remedy is a PRE-READ, not a
   * wording change** — a fix that only edited the sentence could not have worked, which is why the finding
   * says so explicitly.
   *
   * ⚠️ Nothing is committed. `restoreFromCloud` returns the MIGRATED store without writing it — the same
   * separation that lets the file door confirm at all — and `DataResetScreen` already reads it up front for
   * exactly this reason. A failure returns `null` and the sheet falls back to its unconditional warning
   * rather than blocking the restore on a description.
   */
  /**
   * ⛔ **S1.11.5.2 [pass-4 `C4-6`] — IT SET NOTHING WHILE IT RAN, AND THAT IS WHAT MADE `C-7b` RACEABLE.**
   *
   * ⚡ `openRestoreConfirm` renders the confirm SYNCHRONOUSLY and starts this read afterwards, so the
   * confirm's first frame carries `preview === null` — **byte-identical to the un-fixed state** `C-7b` was
   * raised about. The button was `disabled={busy !== null}` and this function never touched `busy`, and
   * there was no spinner, so the window was invisible. Over an iCloud round-trip that is hundreds of
   * milliseconds to seconds, on the one screen in the app where a second tap destroys data.
   *
   * ⚠️ **The docblock's stated intent did not cover it.** It argued that `null` is right *"so a slow or
   * unavailable iCloud never blocks a restore the user has asked for"* — **not blocking the RESTORE and
   * not blocking the CONFIRM BUTTON for the duration of a read already in flight are different
   * decisions**, and only the first was ever argued. The failure path is unchanged: this clears, the
   * button re-enables, and the unconditional warning stands on its own.
   */
  const previewRestore = useCallback(async (): Promise<DebtStore | null> => {
    if (isSandboxStore(store)) return null;
    setPreviewing(true);
    try {
      const result = await restoreFromCloud(getCloudBackupProvider());
      return result.ok ? result.store : null;
    } catch {
      return null;
    } finally {
      // ⛔ `finally`, not the two return paths: a throw that skipped this would leave the confirm
      // permanently un-committable, which is the failure direction the docblock above refuses.
      setPreviewing(false);
    }
  }, [store]);

  const restoreNow = useCallback(async (): Promise<CloudBackupAction> => {
    if (isSandboxStore(store)) {
      reportError(new Error('cloud restore attempted on a SANDBOX store — refusing'), { seam: 'cloud-backup' });
      return { result: 'error' };
    }
    setBusy('restore');
    try {
      const result = await restoreFromCloud(getCloudBackupProvider());
      // ⛔ P6.8.7d.3 [M3-5] — the message travels WITH the reason, all the way to the screen. It is absent
      // on the reasons that have nothing more to say (`unavailable`, `no-backup`), and the sheet then falls
      // back to its own copy — so this adds specificity where it exists and changes nothing where it does not.
      // ⛔ P6.8.7d.3 [M3-5] — `toCloudAction`, never a hand-written literal. THIS line was the defect: it
      // read `return result.reason`, so `decodeCloudBackup`'s exact diagnosis — computed, then carried
      // carefully through `restoreFromCloud` — died one layer short of the screen and every distinct
      // failure rendered as one generic sentence. The shared constructor is covered by a test; a literal
      // here would only be covered by someone noticing.
      if (!result.ok) return toCloudAction(result);
      store.getState().importStore(result.store);
      // ⛔ AFTER `importStore`, never before. The import replaces prefs wholesale with the backup's own
      // copy of this field, which is always one generation stale — a blob cannot contain its own mtime.
      // Stamping first would be silently undone, and this install would then refuse to ever back up.
      if (result.at !== null) store.getState().updatePrefs({ cloudBackupRemoteAt: result.at });
      await refresh();
      return { result: 'ok' };
    } finally {
      setBusy(null);
    }
  }, [refresh, store]);

  const setEnabled = useCallback(
    async (next: boolean) => {
      store.getState().updatePrefs({ cloudBackupEnabled: next });
      // Turning it on with iCloud reachable seeds a backup immediately, so "on" means "backed up" rather
      // than "will be backed up the next time you happen to background the app".
      //
      // ⛔ **THIS IS THE TAP B3 IS ABOUT (P6.8.7d.1).** It used to call the unguarded `backupNow()`, so
      // enabling a *feature* destroyed the backup the user had declined at first launch — the one the
      // sheet is at that moment advertising as "Last backed up …". It now goes through the guard, and a
      // `remote-unclaimed` refusal leaves the preference ON while the sheet asks which copy to keep.
      // ⚠️ The preference is deliberately still set: the user asked for backup and they get it. What they
      // did not ask for is the deletion, and that is the only part being withheld.
      if (next && status === 'ready') await backupNow();
    },
    [status, backupNow, store],
  );

  return { status, enabled, lastBackupAt, unclaimedRemoteAt, busy, previewing, setEnabled, backupNow, previewRestore, restoreNow };
}
