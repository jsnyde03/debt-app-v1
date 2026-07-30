import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/**
 * VIS-2 — native share: capture the off-screen branded `ShareCard` to a PNG and open the iOS share
 * sheet (the one organic-growth artifact — a debt-free win worth posting). Split from `.web.ts` so
 * `react-native-view-shot` never enters the web bundle. Device-verified (no local RN runtime); the
 * `fallbackText` path is web-only. Mirrors Freedom's proven `share-card.ts`.
 */
export async function shareDebtCard(ref: RefObject<View | null>, _fallbackText: string): Promise<void> {
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: "Share you're debt-free" });
  }
}
