import type { PickCsvOutcome } from './csvImportFile';

/**
 * C8 on web — no document picker.
 *
 * ⛔ `CSV_FILE_SUPPORTED = false` rather than a stub that quietly fails, so the sheet does not offer a
 * button that does nothing when tapped. A dead control reads as a broken app; an absent one reads as a
 * platform difference. Same call `backupFile.web.ts` makes, for the same reason.
 *
 * ⚠️ **This does NOT make the feature untestable here, and that is by design.** The import's paste path is
 * cross-platform and is the one the suite drives — so the parse, the preview, the skipped-row report and
 * the apply are all exercised on web. What web cannot reach is the picker itself: choosing a file, and
 * `copyToCacheDirectory` surviving a provider that is not local. Those are P6.14 rows by construction.
 */

export const CSV_FILE_SUPPORTED = false;

export async function pickCsvFile(): Promise<PickCsvOutcome> {
  return { ok: false, reason: 'error' };
}
