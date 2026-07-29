/**
 * 3.6.6 — web / Android no-op. Hardware ⌘-shortcuts are an iOS (iPad) affordance; the real listener is
 * `KeyCommandListener.ios.tsx` (metro's `.ios` extension wins on iOS only). This base file is the fallback
 * for web + Android, so it must export the same component. (A `.native.tsx` split leaked onto web in this
 * project's export — the codebase convention is `.ios.tsx` + base, matching AppIcon / RowContextMenu.)
 */
export function KeyCommandListener() {
  return null;
}
