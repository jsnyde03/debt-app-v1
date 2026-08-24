/**
 * Has Skia finished loading? On native the answer is always yes, and this file exists to say so once.
 *
 * Skia is compiled into the native binary, so there is no load, no fallback and no window in which a
 * chart's labels could be on screen without its curve. Only `.web.ts` has real work to do.
 */
/**
 * ⚠️ The `chunk` parameter exists only so the two platform files share a signature — it is never called
 * here. On native there is no lazy chunk to await, and invoking it would import eagerly what the web build
 * deliberately defers. [V4-8 · P6.8.9.7.5]
 */
export function useSkiaReady(_chunk?: () => Promise<unknown>): boolean {
  return true;
}
