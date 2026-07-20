import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useAppLock } from '@/hooks/use-app-lock';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Wraps the app so a biometric lock (when enabled) covers all content until the user authenticates.
 * The opaque overlay is always rendered above `children`, so the app content is never visible behind
 * it. On web / non-biometric devices the lock fails open, so this never shows.
 */
export function AppLockGate({ children }: { children: ReactNode }) {
  const { isLocked, tryUnlock, authing } = useAppLock();
  return (
    <View style={styles.root}>
      {children}
      {isLocked ? <LockOverlay onUnlock={tryUnlock} authing={authing} /> : null}
    </View>
  );
}

function LockOverlay({ onUnlock, authing }: { onUnlock: () => void; authing: boolean }) {
  const c = useAppColors();
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: c.background.primary }]}>
      <View style={[styles.icon, { backgroundColor: c.background.tertiary }]}>
        <AppIcon name="lock" size={32} color={c.accent.primary} />
      </View>
      <Text style={[textStyles.title2, styles.center, { color: c.text.primary }]}>Debt Planner is locked</Text>
      <Text style={[textStyles.subhead, styles.center, { color: c.text.secondary }]}>
        Unlock with Face ID, Touch ID, or your passcode.
      </Text>
      <Button label={authing ? 'Unlocking…' : 'Unlock'} onPress={onUnlock} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  icon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  center: { textAlign: 'center' },
  cta: { alignSelf: 'stretch', marginTop: spacing.md, maxWidth: 320 },
});
