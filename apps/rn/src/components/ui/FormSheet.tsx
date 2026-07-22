import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * A slide-up bottom sheet for the unified add/edit forms (the B.6 redesign — one sheet drives both
 * modes, so add and edit never diverge). Renders title + subtitle + a scrollable field body + a
 * sticky submit, and an optional Remove (edit mode).
 */
export function FormSheet({
  visible,
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onRemove,
  onClose,
  headerAction,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  submitLabel: string;
  onSubmit: () => void;
  onRemove?: () => void;
  onClose: () => void;
  /** Optional pressable pinned in the header row, just left of Close (e.g. "View payoff schedule"). */
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* KeyboardAvoidingView lifts the sheet (and its sticky submit) above the keyboard — the
          decimal-pad has no return key, so an un-lifted submit is unreachable on device (RN lesson #9). */}
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: c.background.primary, paddingBottom: insets.bottom + spacing.base }]}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={[textStyles.title2, { color: c.text.primary }]}>{title}</Text>
              {subtitle ? <Text style={[textStyles.subhead, { color: c.text.secondary }]}>{subtitle}</Text> : null}
            </View>
            {headerAction}
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Close</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>

          <View style={styles.actions}>
            <Button label={submitLabel} onPress={onSubmit} />
            {onRemove ? (
              <Pressable onPress={onRemove} accessibilityRole="button" style={styles.remove}>
                <Text style={[textStyles.bodyMedium, { color: c.accent.danger }]}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: layout.cardRadiusLarge,
    borderTopRightRadius: layout.cardRadiusLarge,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xs },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: spacing.base, paddingVertical: spacing.xs },
  actions: { gap: spacing.xs },
  remove: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
