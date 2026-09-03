from _boot import *
from datetime import date, timedelta
d = (date.today()+timedelta(days=8)).isoformat()
with_plant('apps/rn/src/utils/format.test.ts', """
const plantedDueDate = '%s';
export const __d17bObj = { dueDate: plantedDueDate };
""" % d, [['npx','tsx','scripts/check-fixture-dates.ts']])
