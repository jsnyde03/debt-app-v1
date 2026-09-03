# Re-auditor probe generator for D1-9. Emits three registries next to this file:
#   reg-indent2.json  reg-indent4.json  reg-unicode.json
# Each holds one duplicated top-level id in the TEXT; JSON.parse collapses it.
# reg-unicode.json spells the duplicate's second character as a \uXXXX escape.
import io, json, os
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(os.path.join(here, '..', '..', '..', '..'))
obj = json.load(io.open(os.path.join(root, 'scripts', 'finding-guards.json'), encoding='utf-8'))
ids = list(obj.keys()); dup = ids[0]
def emit(name, parts):
    out = '{\n' + ',\n'.join(parts) + '\n}\n'
    io.open(os.path.join(here, name), 'w', encoding='utf-8', newline='\n').write(out)
    print(name, 'text keys:', len(parts), 'parsed unique:', len(json.loads(out)))
for mode, indent in (('indent2', 2), ('indent4', 4)):
    p = [' ' * indent + json.dumps(k) + ': ' + json.dumps(obj[k], ensure_ascii=False) for k in ids]
    p.append(' ' * indent + json.dumps(dup) + ': ' + json.dumps(obj[dup], ensure_ascii=False))
    emit('reg-' + mode + '.json', p)
u = dup[0] + chr(92) + 'u' + format(ord(dup[1]), '04x') + dup[2:]
p = ['  ' + json.dumps(k) + ': ' + json.dumps(obj[k], ensure_ascii=False) for k in ids]
p.append('  "' + u + '": ' + json.dumps(obj[dup], ensure_ascii=False))
emit('reg-unicode.json', p)
