import { REPLACE_DATA_ACTION, RESTORE_FROM_CLOUD_ACTION } from '@core/copy/vocabulary';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormSheet } from '@/components/ui/FormSheet';
import { useAppColors } from '@/hooks/use-app-colors';
import { cloudBackupMessage } from '@/data/cloudBackupMessages';
import { formatBackupTime } from '@/data/formatBackupTime';
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
  const { status, enabled, lastBackupAt, unclaimedRemoteAt, busy, setEnabled, backupNow, restoreNow } =
    useCloudBackup();
  const [message, setMessage] = useState('');
  const [confirmingRestore, setConfirmingRestore] = useState(false);

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

          <Text testID="cloud-backup-status" style={[textStyles.caption, { color: c.text.secondary }]}>
            {status === 'loading'
              ? 'Checking iCloud…'
              : // ⛔ P6.8.7d.1 [B3] — when the remote is unclaimed this line must NOT say "Last backed
                // up". That is the sentence the finding turns on: it presents someone else's copy, or the
                // one the user declined at first launch, as this device's own work — and the next tap
                // deleted it. The date still shows, because which copy is older is the user's decision.
                unclaimedRemoteAt
                ? `A backup from ${formatBackupTime(unclaimedRemoteAt)} is in iCloud — not from this device`
                : lastBackupAt
                  ? `Last backed up ${formatBackupTime(lastBackupAt)}`
                  : 'Not backed up yet'}
          </Text>

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
                onPress={() => {
                  setMessage('');
                  setConfirmingRestore(true);
                }}
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
            disabled={busy !== null || status !== 'ready' || unclaimedRemoteAt !== null}
            onPress={() => {
              setMessage('');
              void backupNow().then((r) => report(r, 'Backed up.'));
            }}
          />

          {confirmingRestore ? (
            <View style={styles.confirm}>
              {/* ⚠️ The warning names what is LOST, not what is gained. A restore is destructive in one
                  direction only, and the user is the only one who knows which copy is the good one. */}
              <Text testID="cloud-restore-warning" style={[textStyles.body, { color: c.text.primary }]}>
                Restoring replaces everything on this device with the copy in iCloud. This can’t be undone.
              </Text>
              <Button
                label={REPLACE_DATA_ACTION}
                variant="danger"
                testID="cloud-restore-confirm"
                disabled={busy !== null}
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
              disabled={busy !== null || status !== 'ready'}
              onPress={() => {
                setMessage('');
                setConfirmingRestore(true);
              }}
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
