import json, io, sys
p = 'scripts/finding-guards.json'
orig = open(p, 'rb').read()
data = json.loads(orig.decode('utf-8'))
out = json.dumps(data, indent=2, ensure_ascii=False).encode('utf-8')
print('orig bytes', len(orig), 'roundtrip bytes', len(out), 'identical:', orig == out)
if orig != out:
    # locate first difference
    n = min(len(orig), len(out))
    for i in range(n):
        if orig[i] != out[i]:
            print('first diff at byte', i, repr(orig[max(0,i-40):i+40]), '||', repr(out[max(0,i-40):i+40]))
            break
    else:
        print('one is a prefix of the other; tail of longer:', repr((orig if len(orig)>len(out) else out)[n:n+60]))
print('CRLF count in orig:', orig.count(b'\r\n'), 'LF count:', orig.count(b'\n'))
