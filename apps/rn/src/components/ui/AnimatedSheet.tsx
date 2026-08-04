import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/AppIcon';
import { SheetBackdrop } from '@/components/ui/SheetBackdrop';
import { sheetStyles } from '@/components/ui/sheet-styles';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSheetPresentation } from '@/hooks/use-sheet-presentation';
import { elevation } from '@/theme/elevation';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * 3.4.5.7 — the shared premium sheet shell for the NON-form (display/capture) sheets, so they match
 * the FormSheet exactly: frosted scrim fades in place · sheet springs up · grabber + swipe-down-dismiss
 * · dark luminous edge · ✕-in-circle header. Provides the grabber + a standard title/subtitle/✕ header;
 * the caller passes the body (its own ScrollView/content) as children. Uses `useSheetPresentation`.
 */
export function AnimatedSheet({
  visible,
  onClose,
  title,
  subtitle,
  headerRight,
  dirty,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  dirty?: boolean;
  children: ReactNode;
  // NOTE (3.7.A0): there is deliberately no `overlay` escape hatch. It existed so a sheet could open
  // from INSIDE another Modal, but it rendered as a SIBLING of the presented Modal and therefore sat
  // behind it on iOS — invisible on device, fine on web. Anything that needs to open "from" a sheet
  // should navigate to a route (see `app/schedule/[id].tsx`) rather than nest presentations.
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { pan, scrimStyle, sheetStyle, onBackdrop, requestClose, onSheetLayout } = useSheetPresentation(onClose, dirty);

  const body = (
      <GestureHandlerRootView style={sheetStyles.flex}>
        <KeyboardAvoidingView style={sheetStyles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SheetBackdrop scrimStyle={scrimStyle} onPress={onBackdrop} />
          <Animated.View
            onLayout={onSheetLayout}
            style={[
              sheetStyles.sheet,
              { backgroundColor: c.background.primary, paddingBottom: insets.bottom + spacing.base },
              elevation.raised[scheme],
              scheme === 'dark' && sheetStyles.sheetDarkEdge,
              sheetStyle,
            ]}>
            <GestureDetector gesture={pan}>
              <View style={sheetStyles.dragHandle}>
                <View style={[sheetStyles.grabber, { backgroundColor: c.text.tertiary }]} />
              </View>
            </GestureDetector>
            {/* Header lives OUTSIDE the GestureDetector so headerRight + ✕ stay tappable on native. */}
            <View style={sheetStyles.header}>
              <View style={sheetStyles.flex}>
                <Text style={[textStyles.title2, { color: c.text.primary }]}>{title}</Text>
                {subtitle ? (
                  <Text style={[textStyles.subhead, { color: c.text.secondary }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              {headerRight}
              <Pressable
                testID="sheet-close"
                onPress={() => void requestClose()}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={10}
                style={[sheetStyles.closeBtn, { backgroundColor: c.background.tertiary }]}>
                <AppIcon name="close" size={17} color={c.text.secondary} />
              </Pressable>
            </View>
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
  );

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onBackdrop}>
      {body}
    </Modal>
  );
}
