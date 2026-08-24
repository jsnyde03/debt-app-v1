/**
 * Has Skia finished loading? On native the answer is always yes, and this file exists to say so once.
 *
 * Skia is compiled into the native binary, so there is no load, no fallback and no window in which a
 * chart's labels could be on screen without its curve. Only `.web.ts` has real work to do.
 */
export function useSkiaReady(): boolean {
  return true;
}
