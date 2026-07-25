/**
 * Web stub for §2.8 scan-to-prefill — there's no on-device document scanner / Apple Vision on web, so
 * scanning is unavailable and the UI hides the Scan entry (`isScanAvailable` → false). Same surface as
 * `scan.ts` ([[feedback_platform_split_reexport_gap]]).
 */
export async function scanStatement(): Promise<string> {
  return '';
}

export function isScanAvailable(): boolean {
  return false;
}
