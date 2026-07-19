import { createDebtStore } from './store';

/**
 * The app-wide store instance (one per process). Components read it via `useAppStore`; the
 * persistence layer hydrates + auto-saves it via `bootstrapPersistence`. Tests build isolated
 * instances with `createDebtStore()` instead of importing this singleton.
 */
export const appStore = createDebtStore();
