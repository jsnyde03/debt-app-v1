import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export default function NotFoundScreen() {
  const c = useAppColors();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.root, { backgroundColor: c.background.primary }]}>
        <Text style={[textStyles.title2, { color: c.text.primary }]}>This screen doesn&apos;t exist.</Text>
        {/* ⛔ [P6.4.4 · audit L1-28 + L5-18, one site filed by two lenses] Said "Go to Plan". The tabs are
            Today · Progress · Money — "Plan" is the OLD tab name, so the one screen a lost user reaches
            pointed at a destination they cannot find afterwards. `href="/"` is Today, so the link was
            already going to the right place under the wrong name. ⚠️ An App Review tester lands here on a
            bad universal link. */}
        <Link href="/" style={[textStyles.body, styles.link, { color: c.accent.primary }]}>
          Go to Today
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  link: { marginTop: spacing.md },
});
