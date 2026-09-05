"""Byte-mode plant/restore. `plant.py apply <file> <b64-old> <b64-new>` / `plant.py restore <file>`.
Backup is held OUTSIDE the repo (the scratchpad) so no *.plant-backup can ever be tracked."""
import sys, os, base64, hashlib, shutil
STASH = os.path.join(os.environ.get("TEMP", "/tmp"), "class4-plants")
os.makedirs(STASH, exist_ok=True)
def key(p): return hashlib.sha1(os.path.abspath(p).encode()).hexdigest() + ".bak"
def apply(p, old_b64, new_b64):
    old = base64.b64decode(old_b64); new = base64.b64decode(new_b64)
    with open(p, "rb") as f: data = f.read()
    n = data.count(old)
    if n != 1: print(f"PLANT-FAIL: anchor occurs {n} times, need exactly 1"); sys.exit(2)
    bak = os.path.join(STASH, key(p))
    if not os.path.exists(bak): shutil.copyfile(p, bak)  # first plant on this file wins the backup
    with open(p, "wb") as f: f.write(data.replace(old, new))
    with open(p, "rb") as f: after = f.read()
    if after == data: print("PLANT-FAIL: file unchanged"); sys.exit(2)
    print(f"PLANTED ok  ({len(data)} -> {len(after)} bytes)")
def restore(p):
    b = os.path.join(STASH, key(p))
    if not os.path.exists(b): print("RESTORE-FAIL: no backup"); sys.exit(2)
    shutil.copyfile(b, p)
    with open(p, "rb") as f: a = f.read()
    with open(b, "rb") as f: c = f.read()
    print("RESTORE ok, byte-identical" if a == c else "RESTORE-FAIL: cmp differs")
    os.remove(b)
{"apply": lambda: apply(sys.argv[2], sys.argv[3], sys.argv[4]), "restore": lambda: restore(sys.argv[2])}[sys.argv[1]]()
