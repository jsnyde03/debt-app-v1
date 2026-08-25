import { FILE_UNREADABLE } from '@core/copy/vocabulary';
import { parseDebtCsvText } from '@core/imports/debtCsv';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormSheet } from '@/components/ui/FormSheet';
import { CSV_FILE_SUPPORTED, pickCsvFile } from '@/data/csvImportFile';
import type { Debt } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { useActiveStore } from '@/store/StoreContext';
import { mintDebtIds } from '@/store/debtIds';
import { useAppStore } from '@/store/useAppStore';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

/**
 * C8 — bulk-import debts from a CSV.
 *
 * ⛔ **The FAQ has promised this since v1.x and the app has never had it.** `site/support.html` tells
 * users to "tap the import button" in the Debts section; the parser existed but its only caller was the
 * Capacitor tree. This is the claim becoming true, which makes it an M1-class copy fix as much as a
 * capability.
 *
 * ⚠️ **Nothing is added until the user has seen what will be added.** The sheet parses first and shows a
 * count plus every row it could not read, then applies on a second tap — the same check-then-confirm
 * shape the backup import uses. An import that silently dropped half a file would be indistinguishable
 * from one that worked.
 *
 * ⚠️ **The paste path is not a fallback, it is the primary one.** It is cross-platform, it needs no
 * native module, and it is what the suite drives — so parse, preview, the skipped-row report and the
 * apply are all exercised off-device. The file picker sits on top of the SAME parse rather than beside
 * it, so there is no second opinion about what a CSV means.
 */

const PLACEHOLDER = 'name,balance,minimumPayment,apr,dueDate\nVisa,2400,75,19.99,2026-09-01';

type Preview = { debts: Debt[]; errors: string[] };

export function ImportDebtsSheet({ onClose }: { onClose: () => void }) {
  const c = useAppColors();
  // [R4] write to the store this subtree resolves to — a sandbox under a demo, the real one otherwise.
  const store_ = useActiveStore();
  const currentDate = useAppStore((s) => s.store.paycheck.currentDate);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);

  function check(source: string) {
    if (!source.trim()) return setError('Paste your CSV first.');
    // ⛔ Ids are minted at APPLY, not here. A preview the user backs out of must not consume ids, and the
    // portfolio can change under a sheet that stays open.
    const result = parseDebtCsvText(source, { makeId: () => '' });
    if (result.debts.length === 0) {
      setError(result.errors[0] ?? 'No debts found in that file.');
      return;
    }
    setError('');
    setPreview(result);
  }

  async function chooseFile() {
    const picked = await pickCsvFile();
    if (!picked.ok) {
      // ⛔ A cancel is silent. The user closing the picker is not a failure, and reporting it as one is
      // how a safe flow starts feeling broken.
      if (picked.reason === 'error') setError(FILE_UNREADABLE);
      return;
    }
    setText(picked.text);
    check(picked.text);
  }

  function apply() {
    if (!preview) return;
    const state = store_.getState();
    const ids = mintDebtIds(currentDate, state.store.debts, preview.debts.length);
    // One `addDebt` per row rather than a bulk action: `addDebt` owns the stamping and the BNPL
    // normalisation, and a second write path for the same entity is how the two drift apart.
    preview.debts.forEach((debt, i) => store_.getState().addDebt({ ...debt, id: ids[i] }));
    onClose();
  }

  if (preview) {
    const skipped = preview.errors.length;
    return (
      <FormSheet
        visible
        title="Import these debts?"
        subtitle="They’re added to your plan. Nothing else changes."
        submitLabel={`Add ${preview.debts.length} ${preview.debts.length === 1 ? 'debt' : 'debts'}`}
        onSubmit={apply}
        onClose={onClose}>
        <Text testID="csv-import-summary" style={[textStyles.body, { color: c.text.primary }]}>
          {preview.debts.map((d) => d.name).join(', ')}
        </Text>
        {skipped > 0 ? (
          <Text testID="csv-import-skipped" style={[textStyles.caption, { color: c.text.secondary }]}>
            {`${skipped} ${skipped === 1 ? 'row' : 'rows'} skipped:\n${preview.errors.join('\n')}`}
          </Text>
        ) : null}
        <Button label="Choose a different file" variant="secondary" testID="csv-import-back" onPress={() => setPreview(null)} />
      </FormSheet>
    );
  }

  return (
    <FormSheet
      visible
      title="Import debts from CSV"
      subtitle="One row per debt, with a header. You’ll see what’s in it before anything is added."
      submitLabel="Check file"
      onSubmit={() => check(text)}
      onClose={onClose}>
      {CSV_FILE_SUPPORTED ? (
        <Button label="Choose a file" variant="primary" testID="csv-import-file" onPress={chooseFile} />
      ) : null}
      {/*
        ⛔ **THE DATE FORMAT IS THE ONE RULE THAT LOSES THE WHOLE FILE, AND IT WAS THE ONE RULE NOT STATED
        HERE.** [P6.8.9.7.11.4] `dueDate` is required and must be `YYYY-MM-DD`; a spreadsheet or bank
        export writes `9/1/2026`, every row is refused, and the sheet gave no way to know that in advance.
        ⚡ The same change that widened the header parser argued *"a real export from a bank or a
        spreadsheet says `Minimum Payment`"* — **and that same export says `9/1/2026`.** One half of the
        premise was acted on and the other was not.
        ⚠️ `site/support.html` states the same rule, and the person pasting a CSV is not reading the
        support site while they do it — so the app has to say it too.
      */}
      <Text style={[textStyles.caption, { color: c.text.secondary }]}>
        Columns: name, balance, minimumPayment, apr, dueDate. Dates must be written as YYYY-MM-DD, for
        example 2026-09-01. APR can be left blank for 0%.
      </Text>
      <TextInput
        testID="csv-import-input"
        value={text}
        onChangeText={(t) => { setText(t); setError(''); }}
        placeholder={PLACEHOLDER}
        placeholderTextColor={c.text.tertiary}
        multiline
        style={[styles.code, { color: c.text.primary, backgroundColor: c.background.secondary, borderColor: error ? c.accent.danger : c.border.control }]}
      />
      {error ? <Text testID="csv-import-error" style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  code: {
    minHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: spacing.sm,
    padding: spacing.sm,
    fontFamily: 'Courier',
    fontSize: 12,
  },
});
