import sys, shutil, os
# byte-mode plant/restore. usage: plant.py plant <file> <find> <replace>  |  plant.py restore <file>
mode = sys.argv[1]
path = sys.argv[2]
bak = path + '.r4bak'
if mode == 'plant':
    find = sys.argv[3].encode('utf-8'); repl = sys.argv[4].encode('utf-8')
    with open(path, 'rb') as f: data = f.read()
    n = data.count(find)
    if n != 1:
        print(f'REFUSED: anchor matches {n}x'); sys.exit(2)
    shutil.copyfile(path, bak)
    with open(path, 'wb') as f: f.write(data.replace(find, repl))
    with open(path, 'rb') as f: after = f.read()
    print(f'PLANTED ok · anchor 1x · bytes {len(data)} -> {len(after)} · applied={repl in after}')
elif mode == 'restore':
    with open(bak, 'rb') as f: b = f.read()
    with open(path, 'wb') as f: f.write(b)
    with open(path, 'rb') as f: a = f.read()
    print(f'RESTORED · identical={a == b} · bytes={len(a)}')
    os.remove(bak)
