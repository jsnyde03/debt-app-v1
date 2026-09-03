from _boot import *
import json, io, re, os
BS = chr(92)
SRC='scripts/finding-guards.json'
raw = io.open(SRC, encoding='utf-8', newline='').read()
d = json.loads(raw)
ids = list(d.keys())
print('entries', len(ids))
victim = ids[0]
print('victim', victim)
body = json.dumps(d[victim], ensure_ascii=False)

def make(name, keyliteral, indent='  '):
    i = raw.index('{')
    ins = '\n%s%s: %s,' % (indent, keyliteral, body)
    out = raw[:i+1] + ins + raw[i+1:]
    p = os.path.join('docs/audits/2026-09-02-s1-money-pass7/class1-reaudit2-probes', name)
    io.open(p,'w',encoding='utf-8',newline='').write(out)
    parsed = json.loads(out)
    print(name, 'parsed entries=', len(parsed), '(clean registry has', len(ids), ')')
    return p

esc = '"' + ''.join((BS + 'u%04x') % ord(ch) if k==1 else ch for k,ch in enumerate(victim)) + '"'
print('escaped key literal:', esc[:40])
probes = [
    make('reg-indent2.json', json.dumps(victim), '  '),
    make('reg-indent4.json', json.dumps(victim), '    '),
    make('reg-tab.json',     json.dumps(victim), '\t'),
    make('reg-unicode.json', esc, '  '),
]
for p in probes:
    code,out = run(['npx','tsx','scripts/check-finding-guards.ts','--registry='+p])
    sel = [l for l in out.splitlines() if 'duplicate' in l.lower() or l.strip().startswith('✅') or l.strip().startswith('❌')]
    print('==', os.path.basename(p), 'EXIT=', code)
    for l in sel[:4]: print('    ', l.strip()[:200])
