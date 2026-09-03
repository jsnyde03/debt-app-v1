from plant import *
BT = chr(96); D = chr(36)
RA = 'apps/rn/src/components/plan/RequiredActionsCard.tsx'
DS = 'apps/rn/src/components/entities/DebtSheet.tsx'

def app():
    return run('npm', 'run', 'test:app')

def summarise(label, rc, out):
    keep = [l for l in out.splitlines() if 'unread-inputs copy' in l or 'refusal points' in l or 'debt prefill' in l
            or 'App-layer regression' in l or l.strip().startswith('FAIL') or 'no useState in DebtSheet' in l]
    print(f'--- {label}  EXIT={rc}')
    for l in keep[:6]: print('   ', l.strip()[:180])

ANCHOR = "                ? `An amount this paycheck has to cover could not be read, so this list is incomplete — ${unreadFix}.`"

print('##### C1-9 control: the phrase split across a source line break')
with Plant(RA) as p:
    p.replace(ANCHOR, "                ? `An amount this paycheck has to cover could not be read. You can set it again\n                    above.`")
    summarise('C1-9 wrapped', *app())

print("##### N-7 residual E: ${' '} interpolation")
with Plant(RA) as p:
    p.replace(ANCHOR, "                ? `An amount could not be read. You can set it again" + D + "{' '}above.`")
    summarise("N-7 ${' '}", *app())

print('##### N-7 residual F: a named separator const')
with Plant(RA) as p:
    p.replace(ANCHOR, "                ? 'An amount could not be read. You can set it again' + SEP7 + 'above.'")
    b = read_bytes(RA).decode('utf-8')
    b = b.replace('export function RequiredActionsCard', "const SEP7 = ' ';\nexport function RequiredActionsCard".replace('\n', p.eol.decode()), 1)
    write_bytes(RA, b.encode('utf-8'))
    summarise('N-7 named separator', *app())
