"""Plant text into a tracked file, matching its dominant line endings; restore verified by bytes."""
import io, os, subprocess, sys, hashlib

def read_bytes(p):
    with open(p,'rb') as f: return f.read()

def crlf(p):
    b = read_bytes(p)
    return b.count(b'\r\n') > 0

def plant(path, text, mode='append', anchor=None):
    """text uses \n; converted to \r\n if the file is CRLF. mode: append|prepend|after_anchor"""
    orig = read_bytes(path)
    nl = b'\r\n' if crlf(path) else b'\n'
    payload = text.replace('\n','\x00').encode('utf-8').replace(b'\x00', nl)
    if mode=='append':
        new = orig + (nl if not orig.endswith(nl) else b'') + payload
    elif mode=='prepend':
        new = payload + orig
    elif mode=='after_anchor':
        a = anchor.encode('utf-8')
        i = orig.find(a)
        assert i!=-1, 'anchor not found'
        j = orig.find(nl, i)
        new = orig[:j+len(nl)] + payload + orig[j+len(nl):]
    else:
        raise ValueError(mode)
    assert new != orig
    with open(path,'wb') as f: f.write(new)
    return orig

def restore(path, orig):
    with open(path,'wb') as f: f.write(orig)
    ok = read_bytes(path) == orig
    return ok


def run(cmd, tail=1400):
    import subprocess
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    out = (r.stdout or '') + (r.stderr or '')
    return r.returncode, out

def with_plant(path, text, cmds, mode='append', anchor=None, tail=1400):
    """Plant, run each command, ALWAYS restore. Prints everything."""
    orig = read_bytes(path)
    try:
        plant(path, text, mode=mode, anchor=anchor)
        assert read_bytes(path) != orig, 'PLANT-NOT-APPLIED'
        print('PLANT-APPLIED bytes+%d' % (len(read_bytes(path)) - len(orig)))
        for cmd in cmds:
            code, out = run(cmd)
            print('--- %s' % ' '.join(cmd))
            print(out[-tail:])
            print('EXIT=%d' % code)
    finally:
        ok = restore(path, orig)
        print('RESTORE_OK=%s' % ok)
