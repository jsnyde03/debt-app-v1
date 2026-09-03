from plant import *
D = chr(36)
RA = 'apps/rn/src/components/plan/RequiredActionsCard.tsx'
DS = 'apps/rn/src/components/entities/DebtSheet.tsx'
def app(): return run('npm', 'run', 'test:app')
def keep(out, *needles):
    return [l.strip() for l in out.splitlines() if any(n in l for n in needles)]

ANCHOR = "                ? `An amount this paycheck has to cover could not be read, so this list is incomplete — ${unreadFix}.`"

print("##### N-7 residual E full output")
with Plant(RA) as p:
    p.replace(ANCHOR, "                ? `An amount could not be read. You can set it again" + D + "{' '}above.`")
    rc, out = app()
    print('EXIT=', rc)
    for l in keep(out, 'RequiredActionsCard', 'unread-inputs copy', 'App-layer regression'): print('   ', l[:180])

print("##### C1-9 control full output")
with Plant(RA) as p:
    p.replace(ANCHOR, "                ? `An amount could not be read. You can set it again\n                    above.`")
    rc, out = app()
    print('EXIT=', rc)
    for l in keep(out, 'RequiredActionsCard', 'unread-inputs copy', 'App-layer regression', 'FAIL'): print('   ', l[:200])

APR = "  const [apr, setApr] = useState(seed?.apr != null ? String(seed.apr) : '');"
print("##### C2-9 control (ternary off `editing`)")
with Plant(DS) as p:
    p.replace(APR, "  const [apr, setApr] = useState(editing ? String(editing.apr) : '');")
    rc, out = app()
    print('EXIT=', rc)
    for l in keep(out, 'useState in DebtSheet', 'debt prefill', 'FAIL'): print('   ', l[:200])

print("##### N-8 residual: LET hoist")
with Plant(DS) as p:
    p.replace(APR, "  let __edApr = editing ? String(editing.apr) : '';\n  const [apr, setApr] = useState(__edApr);")
    rc, out = app()
    print('EXIT=', rc)
    for l in keep(out, 'useState in DebtSheet', 'debt prefill', 'App-layer regression'): print('   ', l[:200])

print("##### N-8 residual: two-hop const")
with Plant(DS) as p:
    p.replace(APR, "  const __h1 = editing ? String(editing.apr) : '';\n  const __h2 = __h1;\n  const [apr, setApr] = useState(__h2);")
    rc, out = app()
    print('EXIT=', rc)
    for l in keep(out, 'useState in DebtSheet', 'debt prefill', 'App-layer regression'): print('   ', l[:200])
