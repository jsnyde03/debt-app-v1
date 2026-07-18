// Monorepo Metro config. The shared pure-TS core lives at ../../packages/core; we
// surface it INSIDE this project via a link at apps/rn/core (junction on Windows,
// symlink elsewhere), because Metro refuses relative imports that escape the project
// root and can't reliably hash external watchFolders on Windows. The `@core/*` alias
// then maps to ./core/* — the SAME shared source the Capacitor app imports.
//
// TODO(migration): replace this link + resolver with a proper npm-workspace setup
// once apps/capacitor is also carved out; the link keeps a fresh checkout building
// on any OS in the meantime.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const coreTarget = path.resolve(projectRoot, "../../packages/core");
const coreLink = path.join(projectRoot, "core");

// Auto-create the ./core link so a fresh checkout (any OS) just works.
if (!fs.existsSync(coreLink)) {
  try {
    fs.symlinkSync(coreTarget, coreLink, process.platform === "win32" ? "junction" : "dir");
  } catch (err) {
    console.warn("[metro.config] could not link ./core -> packages/core:", err.message);
  }
}

const config = getDefaultConfig(projectRoot);

const CORE_EXTS = ["ts", "tsx", "js", "jsx", "json"];
function resolveCoreFile(subpath) {
  const base = path.join(coreLink, subpath);
  for (const ext of CORE_EXTS) {
    const file = `${base}.${ext}`;
    if (fs.existsSync(file)) return file;
  }
  for (const ext of CORE_EXTS) {
    const indexFile = path.join(base, `index.${ext}`);
    if (fs.existsSync(indexFile)) return indexFile;
  }
  return null;
}

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@core" || moduleName.startsWith("@core/")) {
    const subpath = moduleName === "@core" ? "" : moduleName.slice("@core/".length);
    const filePath = resolveCoreFile(subpath);
    if (filePath) return { type: "sourceFile", filePath };
  }
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = config;
