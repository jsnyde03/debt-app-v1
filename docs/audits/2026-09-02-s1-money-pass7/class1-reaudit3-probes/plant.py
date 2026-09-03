"""Byte-exact plant/restore harness. Snapshots bytes, plants, runs, restores, verifies."""
import os, subprocess, sys, io
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

def run(*args, cwd=None):
    p = subprocess.run(list(args), cwd=cwd or ROOT, capture_output=True, shell=True)
    out = (p.stdout or b'').decode('utf-8', 'replace') + (p.stderr or b'').decode('utf-8', 'replace')
    return p.returncode, out

def gate(name):
    return run('npx', 'tsx', f'scripts/{name}.ts')

def read_bytes(rel):
    with open(os.path.join(ROOT, rel), 'rb') as f: return f.read()

def write_bytes(rel, b):
    with open(os.path.join(ROOT, rel), 'wb') as f: f.write(b)

def eol(b):
    return b'\r\n' if b.count(b'\r\n') > b.count(b'\n') // 2 else b'\n'

class Plant:
    """with Plant('rel/path') as p: p.append(text) / p.replace(old,new) / p.insert_after(anchor,text)"""
    def __init__(self, rel):
        self.rel = rel
    def __enter__(self):
        self.orig = read_bytes(self.rel)
        self.eol = eol(self.orig)
        return self
    def _norm(self, text):
        return text.replace('\r\n', '\n').replace('\n', self.eol.decode())
    def append(self, text):
        write_bytes(self.rel, self.orig + self._norm(text).encode('utf-8'))
        assert read_bytes(self.rel) != self.orig, 'PLANT DID NOT CHANGE BYTES'
    def replace(self, old, new, count=1):
        o = self._norm(old).encode('utf-8'); n = self._norm(new).encode('utf-8')
        assert self.orig.count(o) >= 1, f'ANCHOR NOT FOUND: {old!r}'
        b = self.orig.replace(o, n, count)
        assert b != self.orig, 'PLANT DID NOT CHANGE BYTES'
        write_bytes(self.rel, b)
    def insert_after(self, anchor, text):
        a = self._norm(anchor).encode('utf-8')
        i = self.orig.find(a)
        assert i != -1, f'ANCHOR NOT FOUND: {anchor!r}'
        j = i + len(a)
        b = self.orig[:j] + self._norm(text).encode('utf-8') + self.orig[j:]
        assert b != self.orig, 'PLANT DID NOT CHANGE BYTES'
        write_bytes(self.rel, b)
    def __exit__(self, *a):
        write_bytes(self.rel, self.orig)
        assert read_bytes(self.rel) == self.orig, f'RESTORE FAILED for {self.rel}'
        return False

def show(label, rc, out, grep=None, n=6):
    print(f'--- {label}  EXIT={rc}')
    lines = [l for l in out.splitlines() if l.strip()]
    if grep:
        lines = [l for l in lines if grep.lower() in l.lower()]
    for l in lines[:n]: print('   ', l)
