import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

/**
 * C8 — choosing a CSV of debts to import.
 *
 * ⛔ **Returns TEXT, never a parsed value.** Every judgement about what the bytes mean belongs to
 * `parseDebtCsvText`, which reports per-row what it could not accept. A picker that parsed would be a
 * second opinion on the format — the discipline `backupFile.ts` states for the backup door, and the one
 * that kept the accept-any-object defect from getting in twice.
 *
 * ⚠️ **Deliberately its own module rather than a generalisation of `backupFile.ts`'s picker.** The two
 * differ only in accepted type, so the shared version is tempting — but that file is a Phase-5 path
 * verified on hardware, and re-shaping a verified door to save ten lines is not a trade worth making
 * while the release is converging on a freeze. If a third file door ever appears, extract then.
 *
 * ⚠️ Metro resolves `csvImportFile.web.ts` for web, keeping the two native modules out of that bundle.
 */

export const CSV_FILE_SUPPORTED = true;

/**
 * iOS reports CSV as `public.comma-separated-values-text`; the MIME type covers Android and the Files-app
 * edge cases. ⚠️ `text/plain` is included on purpose: a CSV exported by a bank and renamed, or one sitting
 * in a provider that does not recognise the extension, is offered as plain text — and a picker that will
 * not let the user select the file they are looking at reads as the app refusing their data.
 */
const CSV_TYPES = ['text/csv', 'text/comma-separated-values', 'public.comma-separated-values-text', 'text/plain'];

export type PickCsvOutcome =
  | { ok: true; text: string; name: string }
  | { ok: false; reason: 'cancelled' | 'error' };

/**
 * ⚠️ `copyToCacheDirectory` is on: without it the returned URI can point into a provider the app cannot
 * read a second time (iCloud Drive, Google Drive), and the read fails AFTER the user has already chosen —
 * which reads to them as "the app rejected my file".
 */
export async function pickCsvFile(): Promise<PickCsvOutcome> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: CSV_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return { ok: false, reason: 'cancelled' };
    const asset = result.assets?.[0];
    if (!asset?.uri) return { ok: false, reason: 'error' };
    const text = await new File(asset.uri).text();
    return { ok: true, text, name: asset.name ?? 'debts.csv' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
