/**
 * VIS-2 web fallback — the native path captures the branded ShareCard to an image, but reliable
 * view→image capture isn't available in the web bundle, so on web we share the text via the Web Share
 * API (mobile browsers) or fall back to an alert. Keeps `react-native-view-shot` out of the web bundle.
 * The shipping surface is native iOS. Mirrors Freedom's `share-card.web.ts`.
 */
export async function shareDebtCard(_ref: unknown, fallbackText: string, _dialogTitle?: string): Promise<void> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: fallbackText });
    } catch {
      // user cancelled — ignore
    }
    return;
  }
  if (typeof window !== 'undefined') window.alert(fallbackText);
}
