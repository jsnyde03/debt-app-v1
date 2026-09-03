from _boot import *
# A (the fixed half): wrapped named import
with_plant('apps/rn/src/utils/format.ts', """import {
  appStore,
} from '../store/appStore';
export const __d18a = appStore;
""", [['npx','tsx','scripts/check-sandbox-writes.ts']], mode='prepend')
# B (R9): namespace import
with_plant('apps/rn/src/utils/format.ts', """import * as appStoreModule from '../store/appStore';
export const __d18b = appStoreModule.appStore;
""", [['npx','tsx','scripts/check-sandbox-writes.ts']], mode='prepend')
