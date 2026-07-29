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
  start(content: PaydayActivityContent): void;
  update(content: PaydayActivityContent): void;
  end(): void;
}
