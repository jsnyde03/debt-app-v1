import { Pressable, StyleSheet } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';

/**
 * A calm circular check-off — the premium alternative to a repeated "Mark Paid" button. Empty ring
 * when open, a filled disc + check when done (tap toggles). `tone` picks the filled color: success
 * (paid) or accent (a recommended extra). Accessible as a checkbox.
 */
export function CheckCircle({
  checked,
  onPress,
  tone = 'success',
  label,
}: {
  checked: boolean;
  onPress?: () => void;
  tone?: 'success' | 'accent';
  label?: string;
}) {
  const c = useAppColors();
  const fill = tone === 'accent' ? c.accent.primary : c.accent.success;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.circle,
        checked ? { backgroundColor: fill, borderColor: fill } : { borderColor: c.border.strong },
        { opacity: pressed ? 0.6 : 1 },
      ]}>
      {checked ? <AppIcon name="check" size={16} color={c.text.onAccent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
