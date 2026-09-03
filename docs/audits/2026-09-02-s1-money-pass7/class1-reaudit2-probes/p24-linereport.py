from _boot import *
print('### an unsanctioned appStore import preceded by a docblock — which line does the gate name?')
with_plant('apps/rn/src/utils/a11y.ts', """/**
 * A docblock. Four lines of prose, then the offending import.
 * Nothing here mentions the singleton.
 */
import {
  appStore,
} from '../store/appStore';
export const __x = appStore;
""", [['npx','tsx','scripts/check-sandbox-writes.ts']], mode='prepend', tail=600)
