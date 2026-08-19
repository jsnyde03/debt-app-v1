import type { ExportFileOutcome, PickFileOutcome } from './backupFile';


/**
 * 5.8.5, web — no share sheet and no document picker.
 *
 * ⛔ `BACKUP_FILE_SUPPORTED = false` rather than a stub that quietly fails. The UI branches on it and
 * simply does not offer the file buttons, so a web user sees the paste path — which is complete and
 * always was — instead of a control that does nothing when tapped. A dead button is worse than an absent
 * one: it reads as a broken app rather than as a platform difference.
 *
 * Metro resolves this file for web, which keeps `expo-document-picker`, `expo-file-system` and
 * `expo-sharing` out of the web bundle entirely.
 *
 * ⚠️ A browser CAN download and upload files, so this could be implemented with an anchor and an
 * `<input type="file">` — v1.6 did exactly that. It is deliberately NOT done here: the web build is a
 * test and preview surface, not a shipping target, and a second file implementation would be a second
 * thing to keep correct for a platform with no users.
 */

export const BACKUP_FILE_SUPPORTED = false;

export async function exportBackupFile(): Promise<ExportFileOutcome> {
  return { ok: false, reason: 'unavailable' };
}

export async function pickBackupFile(): Promise<PickFileOutcome> {
  return { ok: false, reason: 'error' };
}
