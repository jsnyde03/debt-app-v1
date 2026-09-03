from plant import *
import json, os

raw = open(os.path.join(ROOT,'scripts/finding-guards.json'), encoding='utf-8').read()
reg = json.loads(raw)
ids = list(reg)
print('top-level ids:', len(ids))
dup_id = ids[0]
print('duplicating:', dup_id)

def mk(name, indent, key_spelling):
    # rebuild the registry text with an extra duplicate entry, at the given indent
    parts = []
    for k, v in reg.items():
        body = json.dumps(v, ensure_ascii=False, indent=2)
        body = '\n'.join((indent + l) if i else l for i, l in enumerate(body.split('\n')))
        parts.append(f'{indent}{json.dumps(k)}: {body}')
    body = json.dumps(reg[dup_id], ensure_ascii=False, indent=2)
    body = '\n'.join((indent + l) if i else l for i, l in enumerate(body.split('\n')))
    parts.append(f'{indent}{key_spelling}: {body}')
    text = '{\n' + ',\n'.join(parts) + '\n}\n'
    # sanity: JSON.parse-equivalent gives one fewer unique id than entries written
    parsed = json.loads(text)
    assert len(parsed) == len(reg), (name, len(parsed), len(reg))
    open(os.path.join(os.path.dirname(__file__), name), 'w', encoding='utf-8').write(text)
    return name

esc = '"' + ''.join((chr(92) + 'u%04x' % ord(c)) if c.isalpha() else c for c in dup_id) + '"'
for name, indent, spell in [
    ('reg-indent2.json', '  ', json.dumps(dup_id)),
    ('reg-indent4.json', '    ', json.dumps(dup_id)),
    ('reg-tab.json', '\t', json.dumps(dup_id)),
    ('reg-unicode.json', '  ', esc),
]:
    mk(name, indent, spell)
    rel = 'docs/audits/2026-09-02-s1-money-pass7/class1-reaudit3-probes/' + name
    rc, out = run('npx', 'tsx', 'scripts/check-finding-guards.ts', f'--registry={rel}')
    show('D1-9/R8 ' + name, rc, out, grep='duplicate')

# un-fix the escape decoding (R8's own un-fix) -> the fixture must red
with Plant('scripts/check-finding-guards.ts') as p:
    p.replace("            keys.push(JSON.parse(`\"${current}\"`) as string);", "            keys.push(current);")
    show('R8 un-fix decoding', *gate('check-finding-guards'), grep='BLIND')
# un-fix the depth anchor (D1-9's own un-fix): make topLevelKeys only see depth-1 two-space keys
with Plant('scripts/check-finding-guards.ts') as p:
    p.replace("function topLevelKeys(raw: string): string[] {\n  const keys: string[] = [];",
              "function topLevelKeys(raw: string): string[] {\n  return [...raw.matchAll(/^\s{2}\"([^\"]+)\":/gm)].map((m) => m[1]);\n  const keys: string[] = [];")
    show('D1-9 un-fix two-space anchor', *gate('check-finding-guards'), grep='BLIND')
