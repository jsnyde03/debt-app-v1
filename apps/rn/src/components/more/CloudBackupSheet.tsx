import { REPLACE_DATA_ACTION, RESTORE_FROM_CLOUD_ACTION } from '@core/copy/vocabulary';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormSheet } from '@/components/ui/FormSheet';
import { useAppColors } from '@/hooks/use-app-colors';
import { cloudBackupMessage, cloudBackupStatusLine, restoreConfirmDisabled, restoreDisclosure } from '@/data/cloudBackupMessages';
import { formatBackupTime } from '@/data/formatBackupTime';
import { describeRestorePreview } from '@/data/readBackup';
import { useCloudBackup, type CloudBackupAction } from '@/hooks/use-cloud-backup';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * P6.3.3.5 — the iCloud backup sheet. It replaces the "coming soon" row this app has been shipping
 * (finding **L1-29**), so this step CLOSES that finding rather than P6.4 doing it.
 *
 * ⛔ **The restore confirm is IN-SHEET, never an `Alert`.** `Alert.alert` is an empty function on
 * react-native-web, so an alert-based confirm is invisible to the entire web suite — and this is the
 * doctrine 5.8.4 arrived at for the file importer after the accept-anything importer survived an audit
 * gate on a surface with zero coverage. Restore overwrites the user's whole portfolio; it gets the same
 * two-tap treatment, from a control the tests can actually see.
 *
 * ⚠️ **The claim this screen must not overstate ([D41]):** the backup lands in the app's own private
 * iCloud container, in the user's Apple account — not on our servers. It is not end-to-end encrypted
 * ([D40] declined a passphrase), so no copy here may say or imply that it is.
 */
export function CloudBackupSheet({ onClose }: { onClose: () => void }) {
  const c = useAppColors();
  const { status, enabled, lastBackupAt, unclaimedRemoteAt, busy, previewing, setEnabled, backupNow, previewRestore, restoreNow } =
    useCloudBackup();
  const [message, setMessage] = useState('');
  const [confirmingRestore, setConfirmingRestore] = useState(false);
  /**
   * ⛔ **S1.10.6.4 [C-7b] — WHAT IS IN THE FILE, BEFORE THE IRREVERSIBLE TAP.**
   *
   * ⚡ `BackupSheets.tsx:122` states the rule this door did not follow — *"Import: read a backup, **SHOW
   * what is in it**, and only then replace."* The file importer holds the bytes before it confirms; this
   * sheet confirmed first and fetched afterwards, so it rendered one unconditional sentence and nothing
   * about the copy it was about to overwrite the user's portfolio with.
   *
   * ⚠️ `null` while the read is in flight or when it fails — the confirm still stands on its own warning,
   * so a slow or unavailable iCloud never blocks a restore the user has asked for. Only the description is
   * conditional; the danger sentence is not.
   */
  const [preview, setPreview] = useState<string | null>(null);

  function openRestoreConfirm() {
    setMessage('');
    setPreview(null);
    setConfirmingRestore(true);
    void previewRestore().then((store) => setPreview(store ? describeRestorePreview(store) : null));
  }

  /**
   * ⛔ P6.8.7d.3 [M3-5] — the mapping itself lives in `@/data/cloudBackupMessages`, not here.
   *
   * This screen's `ready` branch is unreachable to every automated test in the repo (on web the provider
   * is the unavailable stub by construction), and a defect as simple as "the computed diagnosis is dropped
   * at the last layer" survived thirteen lenses because of it. Moving the branching to a pure module is
   * what makes the ORDER — success, then the guard's choice, then the diagnosis, then the fallbacks —
   * something a test can hold rather than something a reviewer has to notice.
   */
  function report(action: CloudBackupAction, success: string) {
    setMessage(cloudBackupMessage(action, success));
  }

  return (
    <FormSheet
      visible
      title="iCloud backup"
      subtitle="Keep a copy of your plan in your own iCloud account. It never goes to our servers."
      submitLabel="Done"
      onSubmit={onClose}
      onClose={onClose}>
      {/* ⛔ S1.13.7.8 [pass-6 blocker `B3-3`] — `'unavailable'` ONLY, and `'ready-unreadable'` falls to the
          `else` with every control in it. This branch used to catch a signed-in user whose backup's
          mtime would not read: it told them to sign in — the one thing they had already done — and took
          the toggle, **Back up now**, the conflict fork and **Restore from iCloud** with it. ⚠️ Restore is
          the one that mattered: `restoreFromCloud` stats with `.catch(() => null)` and works in this
          state, so the only thing between the user and their data was this line. ⭐ **Back up now** stays
          enabled too, deliberately — `backupToCloudGuarded` refuses an unreadable remote and returns the
          honest sentence, which tells the user more than a disabled button does. */}
      {status === 'unavailable' ? (
        // ⛔ An honest dead end rather than controls that do nothing when tapped — the same call
        // `BACKUP_FILE_SUPPORTED` makes for the file buttons on web.
        <Text testID="cloud-backup-unavailable" style={[textStyles.body, { color: c.text.secondary }]}>
          Sign in to iCloud on this device to back up your plan.
        </Text>
      ) : (
        <>
          <View style={styles.row}>
            <Text style={[textStyles.body, { color: c.text.primary }]}>Back up to iCloud</Text>
            <Switch
              testID="cloud-backup-toggle"
              accessibilityLabel="Back up to iCloud"
              value={enabled}
              disabled={status === 'loading' || busy !== null}
              onValueChange={(next) => {
                setMessage('');
                void setEnabled(next);
              }}
              trackColor={{ true: c.accent.primary, false: c.border.strong }}
            />
          </View>

          {/* ⛔ S1.13.7.8 [pass-6 `B3-3`] — the chain moved to `cloudBackupStatusLine`, a pure table, for
              the reason this module exists: this branch is unreachable to every automated test in the
              repo, so a decision written as nested ternaries here cannot be asserted. [B3]'s rule — an
              unclaimed copy is never called "Last backed up" — is the first row of it. */}
          {(() => {
            const line = cloudBackupStatusLine({ status, unclaimedRemoteAt, lastBackupAt, formatTime: formatBackupTime });
            return (
              <Text
                testID={`cloud-backup-status-${line.kind}`}
                style={[textStyles.caption, { color: line.kind === 'unreadable' ? c.accent.warning : c.text.secondary }]}>
                {line.text}
              </Text>
            );
          })()}

          {unclaimedRemoteAt ? (
            // ⛔ The B3 fork. Both outcomes are destructive in one direction, so neither is the default and
            // neither happens without a tap — the same reasoning as the restore confirm below.
            <View testID="cloud-backup-conflict" style={styles.confirm}>
              <Text testID="cloud-backup-conflict-warning" style={[textStyles.body, { color: c.text.primary }]}>
                This device hasn’t restored that backup, so it may be from another device or from before you
                reinstalled. Backing up replaces it, and that can’t be undone.
              </Text>
              <Button
                label="Use the iCloud copy"
                variant="secondary"
                testID="cloud-backup-conflict-restore"
                disabled={busy !== null}
                onPress={openRestoreConfirm}
              />
              <Button
                label="Replace it with this device"
                variant="danger"
                testID="cloud-backup-conflict-replace"
                disabled={busy !== null}
                onPress={() => {
                  setMessage('');
                  // ⛔ The ONLY place `replaceUnclaimed` is passed, and the user has just read the other
                  // copy's date on the line above. Informed is the entire difference from the defect.
                  void backupNow({ replaceUnclaimed: true }).then((r) => report(r, 'Backed up.'));
                }}
              />
            </View>
          ) : null}

          <Button
            label="Back up now"
            variant="secondary"
            testID="cloud-backup-now"
            // ⛔ S1.13.7.8 [pass-6 `B3-3`] — was `status !== 'ready'`, which disabled this in
            // `'ready-unreadable'`. The guard refuses an unreadable remote and NAMES why; a disabled
            // button says nothing. `'unavailable'` cannot reach here — this is inside its else.
            disabled={busy !== null || status === 'loading' || unclaimedRemoteAt !== null}
            onPress={() => {
              setMessage('');
              void backupNow().then((r) => report(r, 'Backed up.'));
            }}
          />

          {confirmingRestore ? (
            <View style={styles.confirm}>
              {/* ⚠️ The warning names what is LOST, not what is gained. A restore is destructive in one
                  direction only, and the user is the only one who knows which copy is the good one. */}
              {/* ⛔ [C-7b] What is in the file, ABOVE the danger sentence — the file door's own rule
                  ("SHOW what is in it, and only then replace"), applied to the door that skipped it. */}
              {/* ⛔ **S1.11.5.2 [pass-4 `C4-6`] — THE DISCLOSURE SLOT IS NEVER SILENTLY EMPTY.** The
                  confirm renders synchronously and the read starts after it, so this slot's first frame
                  was blank and indistinguishable from the un-fixed state. Three states now, and each says
                  which one it is: reading · what is in it · and *"I could not read it"*, which is the one
                  that used to be silence. ⚠️ The last is folded in rather than deferred — suppressing a
                  false statement to produce NO statement is the same defect one step quieter. */}
              {(() => {
                const slot = restoreDisclosure(previewing, preview);
                return (
                  <Text
                    testID={`cloud-restore-${slot.kind}`}
                    style={[textStyles.body, { color: slot.kind === 'unreadable' ? c.accent.warning : slot.kind === 'reading' ? c.text.secondary : c.text.primary }]}>
                    {slot.text}
                  </Text>
                );
              })()}
              <Text testID="cloud-restore-warning" style={[textStyles.body, { color: c.text.primary }]}>
                Restoring replaces everything on this device with the copy in iCloud. This can’t be undone.
              </Text>
              <Button
                label={REPLACE_DATA_ACTION}
                variant="danger"
                testID="cloud-restore-confirm"
                // ⛔ [C4-6] …and it cannot be COMMITTED while the disclosure is unknown. `previewing`, not
                // `busy`: the second would say "we are overwriting your device" while we are only reading.
                disabled={restoreConfirmDisabled(busy, previewing)}
                onPress={() => {
                  setConfirmingRestore(false);
                  void restoreNow().then((r) => report(r, 'Restored from iCloud.'));
                }}
              />
              <Button
                label="Keep what’s on this device"
                variant="secondary"
                testID="cloud-restore-cancel"
                onPress={() => setConfirmingRestore(false)}
              />
            </View>
          ) : (
            <Button
              label={RESTORE_FROM_CLOUD_ACTION}
              variant="secondary"
              testID="cloud-restore"
              /**
               * ⛔ **S1.13.7.8 [pass-6 blocker `B3-3`] — THE SECOND SITE, AND THE FINDING NAMED NEITHER.**
               *
               * `status !== 'ready'` disabled the restore door in `'ready-unreadable'`, so fixing only the
               * dead-end branch above would have made the door VISIBLE AND DEAD — a worse outcome than
               * hiding it, because it looks like the app tried. ⚡ Found by the class assertion sweeping
               * the file for `status !== 'ready'`, not by reading the finding, which pointed at
               * `getCloudBackupStatus` and the `status === 'unavailable'` branch.
               *
               * ⚠️ Restore is exactly the operation that does not need an mtime — `restoreFromCloud`
               * stats with `.catch(() => null)` — and it is asserted to succeed over this very provider.
               */
              disabled={busy !== null || status === 'loading'}
              onPress={openRestoreConfirm}
            />
          )}
        </>
      )}

      {message ? (
        <Text testID="cloud-backup-message" style={[textStyles.caption, { color: c.text.secondary }]}>
          {message}
        </Text>
      ) : null}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confirm: { gap: spacing.sm },
});
