# The tracked file `test:gate-plants` edits

⛔ **THIS FILE EXISTS TO BE MODIFIED BY A PLANT, AND FOR NOTHING ELSE.** [S1.10.6.5 · pass-3 `A3`]

`lint:secrets --working-tree` reads two populations: files nobody has `git add`-ed yet, and **edits to
files that have been in the repo for months**. The second is the more likely one and it was the one
missing, so it was added — and the harness that proves the authoring mode still refuses a credential
planted an **untracked** file, which reds on the un-fixed script for the *other* half. ⚡ Measured 2×2:
the un-fixed script plus a modified-tracked plant is the only combination that goes green, and the
scenario never ran it.

⚠️ **A plant that EDITS cannot use the create-then-delete mechanism** — pointing it at a real file would
delete that file on cleanup. So the harness saves the bytes, appends, and restores them, and asserts the
restore landed. This file is the target: tracked, inert, and impossible to confuse with real content.

⛔ **Do not add content here and do not delete it.** `test:gate-plants` refuses to run if it is missing
or already modified, because a dirty target makes the restore ambiguous.
