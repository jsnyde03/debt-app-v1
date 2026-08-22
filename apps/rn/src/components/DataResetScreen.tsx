import { RESTORE_FROM_CLOUD_ACTION } from '@core/copy/vocabulary';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImportBackupSheet } from '@/components/more/BackupSheets';
import { Button } from '@/components/ui/Button';
import { getCloudBackupProvider } from '@/storage/cloudBackup';
import { restoreFromCloud } from '@/storage/cloudBackup/service';
import { appStore } from '@/store/appStore';
import { allowRealStoreWrite } from '@/store/realWriteGuard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import type { DebtStore } from '@/data/models';

/**
 * Shown when the saved plan could not be migrated at launch, so the app started from defaults.
 *
 * ⛔ **Before this existed, the loudest event this app can have was its quietest.** The bytes were
 * quarantined and the store was replaced with `createDefaultStore()`, whose `onboardingComplete: false`
 * routes straight into first-run onboarding — so a user with a dozen debts opened the app and was
 * cheerfully asked to set one up, with nothing anywhere saying why. From where they stood it was
 * indistinguishable from a fresh install, which meant they had no reason to look for a way back.
 *
 * ⚠️ **It blocks, and that is the point.** A banner over the setup form was the alternative: it puts a
 * message about losing everything beside a field asking for a paycheck, and it can be dismissed in one
 * tap by someone who has not read it.
 *
 * ⚠️ **The copy must not say the data is gone.** The quarantined blob is still on the device and the
 * iCloud copy, if there is one, is untouched. What is true is that the app could not READ it.
 *
 * Renders above the theme provider, like `StorageErrorScreen`, so it takes the palette by scheme rather
 * than through `useAppColors` — and brings its own `GestureHandlerRootView` because the import sheet it
 * hosts is a `FormSheet`.
 */
export function DataResetScreen({
  scheme,
  onStartFresh,
}: {
  scheme: 'light' | 'dark';
  onStartFresh: () => void;
}) {
  const bg = colors.background.primary[scheme];
  const title = colors.text.primary[scheme];
  const body = colors.text.secondary[scheme];

  const [importing, setImporting] = useState(false);
  // `null` = still looking. The iCloud button is not rendered until we know there is something behind it,
  // because offering a restore that then reports "nothing found" is a second bad surprise on top of the
  // first one.
  const [cloud, setCloud] = useState<DebtStore | null>(null);
  const probed = useRef(false);

  useEffect(() => {
    if (probed.current) return;
    probed.current = true;
    void (async () => {
      const result = await restoreFromCloud(getCloudBackupProvider());
      if (result.ok) setCloud(result.store);
    })();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} testID="data-reset">
        <View style={styles.content}>
          <Text style={[textStyles.title2, { color: title }]} accessibilityRole="header">
            We couldn’t open your saved plan
          </Text>
          <Text style={[textStyles.body, styles.body, { color: body }]}>
            Something was wrong with the file, so the app started fresh. Nothing was deleted — your old
            data is still set aside on this device, and any iCloud backup is untouched.
          </Text>
          {cloud ? (
            <Button
              label={RESTORE_FROM_CLOUD_ACTION}
              testID="data-reset-restore"
              onPress={() => {
                // [R4] Declared, for the same reason the launch-time offer is: this fires while the store
                // is a not-yet-onboarded default, which is precisely the audience a demo sandbox is
                // admitted for, so an undeclared write here would be refused.
                allowRealStoreWrite(() => appStore.getState().importStore(cloud));
                onStartFresh();
              }}
            />
          ) : null}
          <Button
            label="Import a backup file"
            variant="secondary"
            testID="data-reset-import"
            onPress={() => setImporting(true)}
          />
          <Button
            label="Start fresh"
            variant="text"
            testID="data-reset-continue"
            onPress={onStartFresh}
          />
        </View>
        {importing ? <ImportBackupSheet onClose={() => setImporting(false)} /> : null}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  body: { marginBottom: spacing.sm },
});
