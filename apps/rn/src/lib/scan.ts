import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

/**
 * §2.8 scan-to-prefill — the JS side of the native OCR edge. Presents Apple's document scanner and
 * returns the recognized text (line-joined), for `parseStatementText` to turn into a debt prefill.
 * Resolves "" when the user cancels. iOS only — the web build uses `scan.web.ts` (a no-op), and the
 * `ScanVision` native module is linked only on iOS ([[feedback_platform_split_reexport_gap]]).
 *
 * ⚠️ Not web/simulator-verifiable — device-QA at Phase 6 ([[feedback_native_module_verification_gap]]).
 */
export async function scanStatement(): Promise<string> {
  const ScanVision = requireNativeModule<{ scanDocument(): Promise<string> }>('ScanVision');
  return ScanVision.scanDocument();
}

/** Whether the native document scanner is available (iOS with the module linked). Web/Android → false. */
export function isScanAvailable(): boolean {
  // ENG-3: iOS-only (the ScanVision module is iOS-native). Android resolves this base file (web uses
  // scan.web.ts), so without this gate an Android build would show the scan CTA then throw.
  return Platform.OS === 'ios';
}
