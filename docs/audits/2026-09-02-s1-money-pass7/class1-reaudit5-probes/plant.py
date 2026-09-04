#!/usr/bin/env python3
"""Byte-mode plant / restore with cmp verification. Never text mode: this repo is CRLF."""
import os, subprocess, sys, shutil, hashlib

BK = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backups')
os.makedirs(BK, exist_ok=True)

def _key(path):
    return hashlib.sha1(os.path.abspath(path).encode()).hexdigest()[:16] + '_' + os.path.basename(path)

def save(path):
    dst = os.path.join(BK, _key(path))
    with open(path, 'rb') as f: data = f.read()
    with open(dst, 'wb') as f: f.write(data)
    return dst

def append(path, text):
    """Append raw bytes (text must already contain the desired newlines)."""
    save(path)
    with open(path, 'rb') as f: data = f.read()
    with open(path, 'wb') as f: f.write(data + text.encode('utf-8'))

def replace(path, find, repl, count=1):
    save(path)
    with open(path, 'rb') as f: data = f.read()
    fb, rb = find.encode('utf-8'), repl.encode('utf-8')
    n = data.count(fb)
    if n == 0: raise SystemExit('PLANT-DID-NOT-APPLY: needle absent in ' + path)
    data2 = data.replace(fb, rb, count)
    if data2 == data: raise SystemExit('PLANT-DID-NOT-APPLY: no change in ' + path)
    with open(path, 'wb') as f: f.write(data2)
    return n

def restore(path):
    src = os.path.join(BK, _key(path))
    with open(src, 'rb') as f: data = f.read()
    with open(path, 'wb') as f: f.write(data)
    r = subprocess.run(['cmp', src, path], capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit('RESTORE-FAILED ' + path + ' :: ' + r.stdout + r.stderr)
    return 'RESTORE-OK ' + path


def run(cmd, root=r'C:\Users\Jason\debt-app-v1'):
    """Run a shell command, UTF-8 decoded with replacement. Returns (exitcode, combined output)."""
    import subprocess
    r = subprocess.run(cmd, cwd=root, shell=True, stdout=subprocess.PIPE,
                       stderr=subprocess.STDOUT)
    return r.returncode, r.stdout.decode('utf-8', errors='replace')

def pick(out, *needles):
    ls = [l.strip() for l in out.splitlines() if any(n in l for n in needles)]
    return ls
