import { EXPORT_BACKUP_TITLE, IMPORT_BACKUP_TITLE, REPLACE_DATA_ACTION } from '@core/copy/vocabulary';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormSheet } from '@/components/ui/FormSheet';
import { backupFilename, serializeBackup } from '@/data/backup';
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

/** Export: shows the full store as selectable JSON to copy somewhere safe. */
export function ExportBackupSheet({ onClose }: { onClose: () => void }) {
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  // ⛔ Wired to `serializeBackup` only now that `readBackup` understands the envelope (5.8.1's after-scan).
  // Writing the new format while the importer still ran raw `JSON.parse` → `runMigrations` would have made
  // the app's own export a total-loss round trip: measured at 1 debt → 0, income 2100 → blank.
  const json = serializeBackup(store);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await Clipboard.setStringAsync(json);
    setCopied(true);
  }

  async function saveFile() {
    const result = await exportBackupFile(json, backupFilename());
    // ⚠️ Only a real failure is announced. A share sheet the user dismissed is a decision, not an error,
    // and `Sharing.shareAsync` resolves the same either way — so there is nothing here to distinguish
    // "cancelled" from "saved", and guessing wrong in the noisy direction trains people to ignore us.
    if (!result.ok) notify("Couldn't save", 'Saving the file failed. You can still copy the text below.');
  }

  return (
    <FormSheet
      visible
      title={EXPORT_BACKUP_TITLE}
      subtitle="Copy this and save it somewhere safe. Paste it into Import to restore."
      submitLabel="Done"
      onSubmit={onClose}
      onClose={onClose}>
      {BACKUP_FILE_SUPPORTED ? (
        <Button label="Save as a file" variant="primary" testID="backup-export-file" onPress={saveFile} />
      ) : null}
      <Button label={copied ? 'Copied ✓' : 'Copy to clipboard'} variant="secondary" onPress={copy} />
      <TextInput
        testID="backup-export-text"
        value={json}
        editable={false}
        multiline
        selectTextOnFocus
        style={[styles.code, { color: c.text.primary, backgroundColor: c.background.secondary, borderColor: c.border.default }]}
      />
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
      if (picked.reason === 'error') setError("That file couldn't be opened.");
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
        subtitle="This overwrites everything currently in the app. It can't be undone."
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
      subtitle="Paste a backup you saved before. You'll see what's in it before anything changes."
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
        style={[styles.code, { color: c.text.primary, backgroundColor: c.background.secondary, borderColor: error ? c.accent.danger : c.border.default }]}
      />
      {error ? <Text testID="backup-import-error" style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
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
