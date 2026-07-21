// Provision CanvasKit's wasm for Skia-on-web: copy it from node_modules into public/ so the dev
// server + web export serve it at /canvaskit.wasm (see TrajectoryCanvas.web.tsx's locateFile).
// Runs on install and before start/web/export so a fresh checkout or CI just works — the 8MB binary
// stays out of git.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const destDir = join(root, 'public');
const dest = join(destDir, 'canvaskit.wasm');

let src;
try {
  src = require.resolve('canvaskit-wasm/bin/full/canvaskit.wasm');
} catch {
  console.warn('[copy-canvaskit] canvaskit-wasm not installed yet — skipping (will run again next time).');
  process.exit(0);
}

if (existsSync(dest) && statSync(dest).size === statSync(src).size) process.exit(0);
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log('[copy-canvaskit] copied canvaskit.wasm -> public/');
