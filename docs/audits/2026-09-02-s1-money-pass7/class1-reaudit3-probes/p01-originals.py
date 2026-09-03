from plant import *

# D1-1
with Plant('scripts/run-gates.ts') as p:
    p.replace("'lint:money',", "// 'lint:money',")
    show('D1-1 comment out lint:money', *gate('check-runner-completeness'), grep='lint:money')

# D1-2
with Plant('packages/core/testing/runRegressionTests.ts') as p:
    p.replace('import "./testAbuseScenarios";', '// import "./testAbuseScenarios";')
    show('D1-2 comment out suite import', *gate('check-runner-completeness'), grep='testAbuseScenarios')

# D1-3 wrapped collapse
with Plant('apps/rn/src/utils/format.ts') as p:
    p.append("\nexport const __d13 = (raw: string) =>\n  parseAmountField(\n    raw,\n  ) ?? 0;\n")
    show('D1-3 wrapped collapse', *gate('check-amount-collapse'), grep='collapses')

# D1-4 two sites in one file, both reported
with Plant('apps/rn/src/utils/format.ts') as p:
    p.append("\nexport const __a = (raw: string) => parseAmountField(raw) ?? 0;\nexport const __b = (raw: string) => parseAmountField(raw) ?? 0;\n")
    rc, out = gate('check-amount-collapse')
    show('D1-4 two collapses same file', rc, out, grep='collapses', n=8)

# D1-6 wrapped Math.round
with Plant('apps/rn/src/utils/format.ts') as p:
    p.append("\nexport const __d16 = (x: number) =>\n  Math.round(\n    x * 100,\n  ) / 100;\n")
    show('D1-6 wrapped Math.round', *gate('check-rounding'), grep='rounding')

# D1-7 A wrapped fuse, B variable-assigned fuse
import datetime
d = (datetime.date.today() + datetime.timedelta(days=8)).isoformat()
with Plant('apps/rn/src/utils/format.test.ts') as p:
    p.append("\nexport const __d17a = {\n  dueDate:\n    '%s',\n};\n" % d)
    show('D1-7A wrapped fuse', *gate('check-fixture-dates'), grep='fires in')
with Plant('apps/rn/src/utils/format.test.ts') as p:
    p.append("\nconst plantedDueDate = '%s';\nexport const __d17b = { dueDate: plantedDueDate };\n" % d)
    show('D1-7B variable fuse', *gate('check-fixture-dates'), grep='fires in')

# D1-8 A wrapped import, B namespace import
with Plant('apps/rn/src/utils/format.ts') as p:
    p.replace(p.orig.decode('utf-8')[:0] or 'x', 'x') if False else None
    b = p.orig
    write_bytes('apps/rn/src/utils/format.ts', "import {\n  appStore,\n} from '../store/appStore';\n".replace('\n', p.eol.decode()).encode() + b)
    show('D1-8A wrapped import', *gate('check-sandbox-writes'), grep='format.ts')
with Plant('apps/rn/src/utils/format.ts') as p:
    b = p.orig
    write_bytes('apps/rn/src/utils/format.ts', "import * as appStoreModule from '../store/appStore';\n".replace('\n', p.eol.decode()).encode() + b)
    show('D1-8B namespace import', *gate('check-sandbox-writes'), grep='format.ts')
