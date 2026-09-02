import io, json, sys, re
src = io.open('c:/Users/Jason/debt-app-v1/scripts/finding-guards.json', encoding='utf-8').read()
obj = json.loads(src)
ids = list(obj.keys())
dup = ids[0]
mode = sys.argv[1]
indent = 2 if mode == 'indent2' else 4
# emit manually so a duplicate key can exist in the TEXT
parts = []
for k in ids:
    parts.append(' ' * indent + json.dumps(k) + ': ' + json.dumps(obj[k], ensure_ascii=False))
# duplicate the first id verbatim -> parsed object still has the same unique key count
parts.append(' ' * indent + json.dumps(dup) + ': ' + json.dumps(obj[dup], ensure_ascii=False))
out = '{\n' + ',\n'.join(parts) + '\n}\n'
p = 'c:/Users/Jason/debt-app-v1/docs/audits/2026-09-02-s1-money-pass7/d1-probes/reg-' + mode + '.json'
io.open(p, 'w', encoding='utf-8', newline='\n').write(out)
parsed = json.loads(out)
print(mode, 'text keys:', len(parts), 'parsed unique:', len(parsed), 'dup id:', dup)
