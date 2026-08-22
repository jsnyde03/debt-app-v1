import { REPLACE_DATA_ACTION, RESTORE_FROM_CLOUD_ACTION } from '@core/copy/vocabulary';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormSheet } from '@/components/ui/FormSheet';
import { useAppColors } from '@/hooks/use-app-colors';
import { useCloudBackup, type CloudBackupActionResult } from '@/hooks/use-cloud-backup';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * ⚠️ `lastBackupAt` is an INSTANT (the iCloud file's mtime), not a calendar date — so this is the one
 * place a `Date` may be rendered through the platform locale. `@core/utils/localDate` deliberately does
 * NOT own this: its job is `YYYY-MM-DD` wall-calendar dates, and routing an instant through it would
 * throw away the time, which is the informative half of "last backed up".
 */
function formatBackupTime(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return 'recently';
  return `${at.toLocaleDateString()} at ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

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
  const { status, enabled, lastBackupAt, busy, setEnabled, backupNow, restoreNow } = useCloudBackup();
  const [message, setMessage] = useState('');
  const [confirmingRestore, setConfirmingRestore] = useState(false);

  function report(result: CloudBackupActionResult, success: string) {
    setMessage(
      result === 'ok'
        ? success
        : result === 'no-backup'
          ? 'There is no backup in iCloud yet.'
          : result === 'unavailable'
            ? 'Sign in to iCloud on this device to use backup.'
            : "That didn’t work. Your data on this device is unchanged.",
    );
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
              : lastBackupAt
                ? `Last backed up ${formatBackupTime(lastBackupAt)}`
                : 'Not backed up yet'}
          </Text>

          <Button
            label="Back up now"
            variant="secondary"
            testID="cloud-backup-now"
            disabled={busy !== null || status !== 'ready'}
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
