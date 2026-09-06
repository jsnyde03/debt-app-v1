"""Byte-mode plant/restore. CRLF repo - never text mode, never `git checkout --`."""
import sys, os, shutil, subprocess, re
BK = os.path.join(os.environ.get('TEMP', '/tmp'), 'r3-plants')
os.makedirs(BK, exist_ok=True)

def key(path): return re.sub(r'[^A-Za-z0-9._-]', '_', path)

def plant(path, find, repl):
    b = open(path, 'rb').read()
    bk = os.path.join(BK, key(path))
    if not os.path.exists(bk):
        open(bk, 'wb').write(b)
    f = find.encode('utf-8'); r = repl.encode('utf-8')
    n = b.count(f)
    if n != 1:
        print('ANCHOR NOT UNIQUE: %d occurrence(s) in %s' % (n, path)); sys.exit(2)
    open(path, 'wb').write(b.replace(f, r))
    after = open(path, 'rb').read()
    assert after != b, 'plant did not change the bytes'
    assert after.count(r) == 1, 'replacement not present exactly once'
    print('PLANT APPLIED: %s  (%d -> %d bytes)' % (path, len(b), len(after)))

def restore(path):
    bk = os.path.join(BK, key(path))
    shutil.copyfile(bk, path)
    rc = subprocess.run(['cmp', bk, path]).returncode
    print('RESTORED %s cmp=%s (%d bytes)' % (path, 'IDENTICAL' if rc == 0 else 'DIFFERS', os.path.getsize(path)))
    if rc != 0: sys.exit(3)

if __name__ == '__main__':
    if sys.argv[1] == 'plant': plant(sys.argv[2], sys.argv[3], sys.argv[4])
    else: restore(sys.argv[2])
