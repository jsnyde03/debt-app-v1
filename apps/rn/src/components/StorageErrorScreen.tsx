import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Shown when durable storage could not be opened or read at launch.
 *
 * ⚠️ Before this existed the same fault rendered `null` FOREVER — splash to black, no message, no
 * retry, no support path, and no way for the user to tell it apart from a crash. It is the one screen
 * whose absence is invisible in every test, because a suite hands the store a working adapter.
 *
 * ⚠️ **The copy must not claim the data is gone.** A failed read says nothing about whether the blob is
 * intact, and the app has deliberately NOT written anything (see `store.hydrate`) precisely so a retry
 * can still find it. Telling someone their debts were lost, when the likely cause is a keychain that
 * was not ready a second after boot, would be both wrong and the most alarming thing this product can
 * say. So: what happened, that it is probably temporary, and one action.
 *
 * Renders ABOVE the theme provider (nothing is mounted yet at this point), so it reads the palette
 * directly by scheme rather than through `useAppColors`.
 */
export function StorageErrorScreen({
  scheme,
  onRetry,
}: {
  scheme: 'light' | 'dark';
  onRetry: () => void;
}) {
  const bg = colors.background.primary[scheme];
  const title = colors.text.primary[scheme];
  const body = colors.text.secondary[scheme];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} testID="storage-error">
      <View style={styles.content}>
        <Text style={[textStyles.title2, { color: title }]} accessibilityRole="header">
          Couldn&rsquo;t open your data
        </Text>
        <Text style={[textStyles.body, styles.body, { color: body }]}>
          Your plan is still on this device — the app just couldn&rsquo;t read it this time. This is
          usually temporary. Try again, and if it keeps happening, restart your phone.
        </Text>
        <Button label="Try again" onPress={onRetry} testID="storage-error-retry" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  body: { marginBottom: spacing.sm },
});
