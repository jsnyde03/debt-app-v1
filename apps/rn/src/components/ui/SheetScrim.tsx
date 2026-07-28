import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * 3.4.3 — the shared frosted scrim behind slide-up sheets: a BlurView + a light dim, so the app content
 * behind a sheet reads as frosted glass rather than a flat black wash. Purely decorative (`pointerEvents
 * none`), so the sheet's own dismiss Pressable — layered ON TOP of this — still catches the backdrop tap.
 * Place as the FIRST child of a transparent backdrop container. Native material device-QA @ Phase 6.
 */
export function SheetScrim() {
  const scheme = useColorScheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <BlurView tint={scheme === 'dark' ? 'dark' : 'default'} intensity={20} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.dim]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // A light dim on top of the blur — enough to seat the sheet, not the old flat 0.45 black wash.
  dim: { backgroundColor: 'rgba(0,0,0,0.28)' },
});
