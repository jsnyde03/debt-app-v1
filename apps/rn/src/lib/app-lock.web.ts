/**
 * Web stub for App Lock — no biometrics on web, so both calls fail open (never lock). Must export
 * the same surface as `app-lock.ts` ([[feedback_platform_split_reexport_gap]]).
 */

export async function canUseAppLock(): Promise<boolean> {
  return false;
}

export async function authenticate(): Promise<boolean> {
  return true;
}
