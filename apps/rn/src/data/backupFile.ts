import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';


/**
 * 5.8.5 — backup as a FILE: share-sheet out, document-picker in.
 *
 * ⚠️ This restores PARITY, it does not add a feature. v1.6 shipped `downloadBackup` + `readBackupFile`;
 * the RN rewrite went backwards to clipboard-only, and a user who has been saving `.json` backups since
 * v1.6 would have found no way to open one. That is why this sits in Phase 5 (data continuity) rather
 * than in a polish phase.
 *
 * ⛔ Both directions run over the SAME serialization as the paste path — `serializeBackup` writes,
 * `readBackup` reads. The file layer moves bytes and nothing else; it does not know the format. That is
 * what keeps the picker from becoming a second importer with its own idea of what a backup is, which is
 * precisely how the accept-any-object defect got in.
 *
 * ⚠️ Metro resolves `backupFile.web.ts` for web, keeping these three native modules out of the web bundle
 * (the `readLegacyStores` / `createAdapter` precedent).
 */

export const BACKUP_FILE_SUPPORTED = true;

/** iOS reports JSON as `public.json`; the MIME type covers Android and the Files-app edge cases. */
const JSON_TYPES = ['application/json', 'public.json'];

export type ExportFileOutcome = { ok: true } | { ok: false; reason: 'unavailable' | 'error' };
export type PickFileOutcome =
  | { ok: true; text: string; name: string }
  | { ok: false; reason: 'cancelled' | 'error' };

/**
 * Write the backup to a cache file and hand it to the share sheet.
 *
 * ⛔ It lands in **cache**, never in Documents. The file is a transport artifact — once the user has put
 * it wherever they wanted it, our copy is litter, and cache is the one directory iOS is free to reclaim.
 * A backup of someone's finances sitting permanently in the app container is a liability, not a feature.
 *
 * ⚠️ SDK 56's `expo-file-system` is the `File`/`Directory`/`Paths` API — there is no module-level
 * `cacheDirectory` or `writeAsStringAsync` any more (the old surface moved to `expo-file-system/legacy`).
 * Same API 5.1b.3's reader uses, so the two file-touching modules stay on one idiom.
 */
export async function exportBackupFile(text: string, filename: string): Promise<ExportFileOutcome> {
  try {
    if (!(await Sharing.isAvailableAsync())) return { ok: false, reason: 'unavailable' };
    const file = new File(Paths.cache, filename);
    // Overwrite rather than append: two exports on the same day share a name, and a file that grew by
    // concatenation would be unparseable JSON — a corrupt backup that looks like a successful save.
    if (file.exists) file.delete();
    file.create();
    file.write(text);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save your backup' });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/**
 * Let the user choose a file and return its TEXT. Deliberately returns text rather than a parsed value —
 * every judgement about what the bytes mean belongs to `readBackup`, which refuses what it cannot
 * identify. A picker that parsed would be a second opinion on the format.
 *
 * ⚠️ `copyToCacheDirectory` is on: without it the returned URI can point into a provider the app cannot
 * read a second time (iCloud Drive, Google Drive), and the read fails AFTER the user has already chosen —
 * which reads to them as "the app rejected my backup".
 */
export async function pickBackupFile(): Promise<PickFileOutcome> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: JSON_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return { ok: false, reason: 'cancelled' };
    const asset = result.assets?.[0];
    if (!asset?.uri) return { ok: false, reason: 'error' };
    const text = await new File(asset.uri).text();
    return { ok: true, text, name: asset.name ?? 'backup.json' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
