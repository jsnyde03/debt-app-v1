import { EXPORT_BACKUP_TITLE, FILE_UNREADABLE, IMPORT_BACKUP_TITLE, REPLACE_DATA_ACTION } from '@core/copy/vocabulary';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormSheet } from '@/components/ui/FormSheet';
import { backupFilename, describeStoreContents, serializeBackup } from '@/data/backup';
import { BACKUP_FILE_SUPPORTED, exportBackupFile, pickBackupFile } from '@/data/backupFile';
import { describeBackup, readBackup, type ReadBackupSuccess } from '@/data/readBackup';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { useAppStore } from '@/store/useAppStore';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { notify } from '@/utils/confirm';

/**
 * Backup export/import.
 *
 * The text path (copy/paste) is cross-platform with zero native modules, so it stays as the web fallback
 * and as the thing the suite can drive. The share-sheet + file-picker flow (5.8.5) sits on top of the
 * SAME serialization rather than beside it — `serializeBackup` writes the file, `readBackup` reads it, and
 * neither the sheet nor the picker re-implements the shape.
 */

/**
 * Export: says what the backup HOLDS, offers the action that saves it, and keeps the raw JSON one tap away.
 *
 * ⚠️ The summary sentence is `describeStoreContents`, which the IMPORT sheet also speaks before a
 * destructive replace — one owner, so the two doors cannot describe the same backup differently.
 */
export function ExportBackupSheet({ onClose }: { onClose: () => void }) {
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  // ⛔ Wired to `serializeBackup` only now that `readBackup` understands the envelope (5.8.1's after-scan).
  // Writing the new format while the importer still ran raw `JSON.parse` → `runMigrations` would have made
  // the app's own export a total-loss round trip: measured at 1 debt → 0, income 2100 → blank.
  const json = serializeBackup(store);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  async function copy() {
    await Clipboard.setStringAsync(json);
    setCopied(true);
  }

  async function saveFile() {
    const result = await exportBackupFile(json, backupFilename());
    // ⚠️ Only a real failure is announced. A share sheet the user dismissed is a decision, not an error,
    // and `Sharing.shareAsync` resolves the same either way — so there is nothing here to distinguish
    // "cancelled" from "saved", and guessing wrong in the noisy direction trains people to ignore us.
    if (!result.ok) notify("Couldn’t save", 'Saving the file failed. You can still copy the text below.');
  }

  /**
   * ⛔ [P6.8.9.7.11.14.2 · audit P1-5] THE SHEET'S PRIMARY ACTION IS THE ONE THAT BACKS SOMETHING UP.
   *
   * It was `Done` — filled, sticky, and it dismisses. `Copy to clipboard`, the only control on the sheet
   * that puts the user's data anywhere, was the secondary treatment. **A user could press the most
   * prominent button on the screen and back up nothing.**
   *
   * ⚠️ **And the frame that finding was written from is a WEB frame.** `BACKUP_FILE_SUPPORTED` is `false`
   * in `backupFile.web.ts` and `true` on iOS, so the capture matrix could not photograph the filled
   * `Save as a file` button the shipping platform renders — where the real defect was **two** filled
   * buttons competing, not one inverted. Both platforms are fixed by the same move, because the platform
   * decides which action is primary and `Done` is never it.
   */
  const primary = BACKUP_FILE_SUPPORTED
    ? { label: 'Save as a file', onPress: saveFile }
    : { label: copied ? 'Copied ✓' : 'Copy to clipboard', onPress: copy };

  return (
    <FormSheet
      visible
      title={EXPORT_BACKUP_TITLE}
      subtitle="Save this somewhere safe. You can bring it back any time from Import."
      submitLabel={primary.label}
      onSubmit={primary.onPress}
      onClose={onClose}
      footerAccessory={<Button label="Done" variant="text" testID="backup-export-done" onPress={onClose} />}>
      {/* ⛔ THE WORST SINGLE FRAME IN THE MATRIX WAS THIS SHEET LEADING WITH `"formatVersion": 1,
          "storeVersion": 7, "paycheck": { "amount": "2000" …`. The bar is that a trust surface lets the
          user see the RESTRAINT working; this let them see the schema, inside the one interaction where
          they are being asked to believe the data is theirs. It now says what is in the backup, in the
          same words the import sheet uses before a destructive replace — one owner, so the two doors
          cannot drift. */}
      <Text testID="backup-export-summary" style={[textStyles.body, { color: c.text.primary }]}>
        {`This backup has ${describeStoreContents(store)}.`}
      </Text>
      {BACKUP_FILE_SUPPORTED ? (
        <Button label={copied ? 'Copied ✓' : 'Copy to clipboard'} variant="secondary" onPress={copy} />
      ) : null}
      {/* ⚠️ The raw text stays REACHABLE, not deleted. It is the whole copy/paste path on web, it is what
          `backup.spec.ts`'s round trip reads, and hiding a user's own data from them on a trust surface
          would invert the point of the fix. What changed is which one is the FACE of the sheet. */}
      <Pressable
        onPress={() => setShowRaw((v) => !v)}
        hitSlop={6}
        accessibilityRole="button"
        testID="backup-export-raw-toggle"
        accessibilityLabel={showRaw ? 'Hide the raw backup data' : 'Show the raw backup data'}>
        <Text style={[textStyles.caption, styles.rawToggle, { color: c.accent.primary }]}>
          {showRaw ? 'Hide the raw data' : 'Show the raw data'}
        </Text>
      </Pressable>
      {showRaw ? (
        <TextInput
          testID="backup-export-text"
          value={json}
          editable={false}
          multiline
          selectTextOnFocus
          style={[styles.code, { color: c.text.primary, backgroundColor: c.background.secondary, borderColor: c.border.control }]}
        />
      ) : null}
    </FormSheet>
  );
}

/**
 * Import: read a backup, SHOW what is in it, and only then replace.
 *
 * ⛔ **The check and the replace are two separate taps, deliberately** (5.8.4). `importStore` overwrites
 * the user's entire portfolio and nothing undoes it, and until 5.8 that fired on a single tap over a
 * parser that accepted any JSON object at all. Reading is now `readBackup` — which refuses anything it
 * cannot identify — and what it found is rendered before the destructive action is even offered.
 *
 * ⚠️ The confirm is IN-SHEET, not an `Alert`. `Alert.alert` is an empty function on react-native-web, so
 * an alert-based confirm is invisible to the web suite — and this surface had **zero** coverage before
 * 5.8, which is exactly how the accept-anything importer survived an audit gate. A confirm the tests can
 * see is worth more here than one that matches the platform idiom. It also lets the summary show WHAT was
 * found, which an alert cannot.
 */
export function ImportBackupSheet({ onClose }: { onClose: () => void }) {
  const c = useAppColors();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [found, setFound] = useState<ReadBackupSuccess | null>(null);

  /** One reader for both doors. The picker supplies bytes; it never decides what they mean. */
  function check(source: string) {
    if (!source.trim()) return setError('Paste your backup first.');
    const result = readBackup(source);
    if (!result.ok) return setError(result.message);
    setError('');
    setFound(result);
  }

  async function chooseFile() {
    const picked = await pickBackupFile();
    if (!picked.ok) {
      // ⛔ A cancel is silent. The user closing the picker is not a failure, and reporting it as one is
      // how a safe flow starts feeling broken.
      if (picked.reason === 'error') setError(FILE_UNREADABLE);
      return;
    }
    setText(picked.text);
    check(picked.text);
  }

  function replace() {
    if (!found) return;
    appStore.getState().importStore(found.store);
    onClose();
  }

  if (found) {
    return (
      <FormSheet
        visible
        title="Replace your data?"
        subtitle="This overwrites everything currently in the app. It can’t be undone."
        submitLabel={REPLACE_DATA_ACTION}
        onSubmit={replace}
        onClose={onClose}>
        <Text testID="backup-found-summary" style={[textStyles.body, { color: c.text.primary }]}>
          {describeBackup(found)}
        </Text>
        <Button label="Choose a different backup" variant="secondary" testID="backup-back" onPress={() => setFound(null)} />
      </FormSheet>
    );
  }

  return (
    <FormSheet
      visible
      title={IMPORT_BACKUP_TITLE}
      subtitle="Paste a backup you saved before. You’ll see what’s in it before anything changes."
      submitLabel="Check backup"
      onSubmit={() => check(text)}
      onClose={onClose}>
      {BACKUP_FILE_SUPPORTED ? (
        <Button label="Choose a file" variant="primary" testID="backup-import-file" onPress={chooseFile} />
      ) : null}
      <TextInput
        testID="backup-import-input"
        value={text}
        onChangeText={(t) => { setText(t); setError(''); }}
        placeholder="Paste your backup here"
        placeholderTextColor={c.text.tertiary}
        multiline
        style={[styles.code, { color: c.text.primary, backgroundColor: c.background.secondary, borderColor: error ? c.accent.danger : c.border.control }]}
      />
      {error ? <Text testID="backup-import-error" style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  rawToggle: { fontWeight: '600' },
  code: {
    minHeight: 180,
    maxHeight: 320,
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
});
