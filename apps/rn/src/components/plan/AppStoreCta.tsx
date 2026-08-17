import { Linking } from 'react-native';

import { Button } from '@/components/ui/Button';
import { APP_STORE_URL } from '@/utils/ecosystem';

/**
 * 3.5.7.7 — the marketing embed's ONE exit: the App Store.
 *
 * ⚠️ **THIS NATIVE FILE IS THE ONE THAT NEVER RUNS**, and it exists anyway. The CTA renders only when
 * `EMBED_DEMO` is set, which the bundler inlines false in every app build — so on iOS this is a constant
 * -false branch. Shipping only a `.web.tsx` would leave the native bundle unable to resolve the import at
 * all, and a component that cannot resolve is a build break rather than dead code.
 *
 * ⭐ THE WEB HALF IS A REAL ANCHOR, and that is the whole reason for the split — see `AppStoreCta.web.tsx`.
 */
export function AppStoreCta({ label, testID }: { label: string; testID?: string }) {
  return <Button label={label} testID={testID} onPress={() => void Linking.openURL(APP_STORE_URL)} />;
}
