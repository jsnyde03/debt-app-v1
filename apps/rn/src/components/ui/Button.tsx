import { useState } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type Variant = 'primary' | 'secondary' | 'text' | 'danger';

/** Themed button. `primary` = brand CTA fill, `secondary` = outlined card, `text` = bare label, `danger` = destructive fill.
 *  `onDark` forces the DARK color set regardless of the active theme — for a theme-CONSTANT dark surface (the
 *  finale/beat navy takeover) where theme-reactive tokens invert the hierarchy (B1: light primary is navy-on-navy). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  onDark = false,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
  /** The accessible NAME comes from the child text, which `getByLabel` does not match on web — so a
   *  button whose copy is expected to change needs a stable handle for tests. */
  testID?: string;
}) {
  const themeColors = useAppColors();
  // On a constant-dark surface, resolve from the dark tokens directly so light-mode doesn't render a
  // navy-on-navy primary / a white secondary that reads as the primary.
  const c = onDark
    ? {
        accent: { brand: colors.accent.brand.dark, danger: colors.accent.danger.dark },
        text: { onAccent: colors.text.onAccent.dark, primary: colors.text.primary.dark, secondary: colors.text.secondary.dark },
        background: { secondary: colors.background.secondary.dark },
        border: { control: colors.border.control.dark },
      }
    : themeColors;
  // 3.6.6 — pointer/keyboard affordances via the OFFICIALLY-typed Pressable props (the style-callback's
  // `hovered`/`focused` are RN-Web-only; these props fire for the iPad pointer + hardware keyboard on iOS
  // too, and are inert on touch). A gentle hover lift + a keyboard focus ring, never touching the touch UX.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const bg =
    variant === 'primary' ? c.accent.brand : variant === 'danger' ? c.accent.danger : variant === 'secondary' ? c.background.secondary : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger' ? c.text.onAccent : variant === 'text' ? c.text.secondary : c.text.primary;
  const border = variant === 'secondary' ? c.border.control : 'transparent';

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.base,
        variant === 'text' && styles.textVariant,
        { backgroundColor: bg, borderColor: focused ? c.accent.brand : border, opacity: disabled ? 0.5 : pressed ? 0.85 : hovered ? 0.9 : 1 },
        focused && styles.focusRing,
        style,
      ]}>
      <Text style={[textStyles.bodyMedium, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: layout.buttonRadius,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  textVariant: { minHeight: 44 },
  // Keyboard/pointer focus ring — a wider brand-tinted outline (borderColor above supplies the hue).
  focusRing: { borderWidth: 2 },
});
