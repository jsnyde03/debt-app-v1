from _boot import *
from datetime import date, timedelta
d = (date.today()+timedelta(days=8)).isoformat()
G=[['npx','tsx','scripts/check-fixture-dates.ts']]
print("### bnpl.spec.ts — pinned ONLY by a docblock describing a pin that was REMOVED")
with_plant('apps/rn/tests/e2e/bnpl.spec.ts', "\nconst __fuse = { dueDate: '%s' };\n" % d, G, tail=450)
print("### control — the same literal in a sibling e2e spec with no such comment")
with_plant('apps/rn/tests/e2e/debts.spec.ts', "\nconst __fuse = { dueDate: '%s' };\n" % d, G, tail=450)
