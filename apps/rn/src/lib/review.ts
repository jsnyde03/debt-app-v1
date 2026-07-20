import * as StoreReview from 'expo-store-review';

/**
 * In-app review prompt (B.9). Ask at a genuine positive moment (a completed payday capture on an
 * established user), never on first run. iOS itself throttles the real prompt (~3/year), so an
 * over-eager call is capped by the OS. Guarded so a failure never disrupts the flow.
 *
 * ⚠️ Native-only — verified on device (Phase E); the `.web` stub no-ops.
 */
export async function maybeRequestReview(): Promise<void> {
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
    }
  } catch {
    /* never let a review prompt break the calling flow */
  }
}
