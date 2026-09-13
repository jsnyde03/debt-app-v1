import type { PaydayActivityContent } from './paydayActivityContent';

/**
 * The app-side ActivityKit surface the lifecycle manager drives. Implemented natively by the
 * `LiveActivity` Expo module (`liveActivityBridge.native.ts`) and as a no-op on web/Android
 * (`liveActivityBridge.ts`). Types live in this NON platform-split file so both variants + the sync
 * manager share one definition without importing across the `.native`/`.web` split.
 */
export interface LiveActivityBridge {
  /** OS supports Live Activities AND the user hasn't disabled them in Settings. Web/Android → false. */
  areActivitiesEnabled(): boolean;
  /**
   * ⛔ [.5.4f · pass-7 `C3-5`] — each resolves to whether the call LANDED, and `liveActivitySync` stamps its
   * belief about the Lock Screen only on `true`. They returned `void`, so there was nothing to consult.
   * ⚠️ They never reject: a native failure resolves `false`.
   */
  start(content: PaydayActivityContent): Promise<boolean>;
  update(content: PaydayActivityContent): Promise<boolean>;
  end(): Promise<boolean>;
}
