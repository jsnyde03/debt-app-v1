import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormSheet } from '@/components/ui/FormSheet';
import { runMigrations } from '@/data/migrations';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { useAppStore } from '@/store/useAppStore';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Backup export/import. B.8 ships a text-based backup (copy/paste the JSON) — fully cross-platform
 * with zero native modules, so it's real and web-verifiable now. The premium native share-sheet
 * (expo-sharing) + document-picker file flow is a B.9 upgrade over this same store serialization.
 */

/** Export: shows the full store as selectable JSON to copy somewhere safe. */
export function ExportBackupSheet({ onClose }: { onClose: () => void }) {
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  const json = JSON.stringify(store, null, 2);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await Clipboard.setStringAsync(json);
    setCopied(true);
  }

  return (
    <FormSheet
      visible
      title="Export backup"
      subtitle="Copy this and save it somewhere safe. Paste it into Import to restore."
      submitLabel="Done"
      onSubmit={onClose}
      onClose={onClose}>
      <Button label={copied ? 'Copied ✓' : 'Copy to clipboard'} variant="secondary" onPress={copy} />
      <TextInput
        value={json}
        editable={false}
        multiline
        selectTextOnFocus
        style={[styles.code, { color: c.text.primary, backgroundColor: c.background.secondary, borderColor: c.border.default }]}
      />
    </FormSheet>
  );
}

/** Import: paste a previously-exported backup and restore it (migrated forward on the way in). */
export function ImportBackupSheet({ onClose }: { onClose: () => void }) {
  const c = useAppColors();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  function restore() {
    if (!text.trim()) return setError('Paste your backup first.');
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return setError("That doesn't look like a valid backup.");
    }
    try {
      appStore.getState().importStore(runMigrations(parsed));
      onClose();
    } catch {
      return setError("That backup couldn't be read.");
    }
  }

  return (
    <FormSheet
      visible
      title="Import backup"
      subtitle="Paste a backup you exported before. This replaces your current data."
      submitLabel="Restore backup"
      onSubmit={restore}
      onClose={onClose}>
      <TextInput
        value={text}
        onChangeText={(t) => { setText(t); setError(''); }}
        placeholder="Paste your backup JSON here"
        placeholderTextColor={c.text.tertiary}
        multiline
        style={[styles.code, { color: c.text.primary, backgroundColor: c.background.secondary, borderColor: error ? c.accent.danger : c.border.default }]}
      />
      {error ? <Text style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
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
