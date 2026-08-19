// Standalone entry for the migration audit, so it can be driven without the whole app-test runner.
// ⚠️ A FILE, not `npx tsx -e "…"` — bash parses `=>` as a redirect, which has now silently broken a run
// twice in this project. The rule was already written down both times.
import run from './audit.test';

run();
