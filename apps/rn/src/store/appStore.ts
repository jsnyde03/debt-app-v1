import { refuseRealStoreWrite } from './realWriteGuard';
import { createDebtStore } from './store';

/**
 * The app-wide store instance (one per process). Components read it via `useAppStore`; the
 * persistence layer hydrates + auto-saves it via `bootstrapPersistence`. Tests build isolated
 * instances with `createDebtStore()` instead of importing this singleton.
 *
 * [R4] It is the ONE instance carrying the sandbox veto: while a demo or walkthrough is on screen, a
 * write to the user's plan through this singleton is refused before it lands rather than reported after
 * it has. See `realWriteGuard.ts` — a sandbox instance never gets it, because a sandbox IS the store its
 * subtree is meant to write.
 */
export const appStore = createDebtStore({ refuse: refuseRealStoreWrite });
