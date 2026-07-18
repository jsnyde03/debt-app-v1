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
        <Link href="/" style={[textStyles.body, styles.link, { color: c.accent.primary }]}>
          Go to Plan
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  link: { marginTop: spacing.md },
});
