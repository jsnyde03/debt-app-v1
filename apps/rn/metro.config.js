// Monorepo Metro config for the Debt Planner RN app.
//
// Two path aliases are resolved here explicitly (Metro can't rely on tsconfig
// paths across the monorepo boundary on Windows):
//   @core/*  → ../../packages/core/*  (the SHARED pure-TS engine, surfaced via a
//              local link at apps/rn/core — junction on Windows, symlink elsewhere,
//              because Metro refuses relative imports that escape the project root)
//   @/*      → ./src/*                (this app's own source — theme, hooks, screens)
//
// Both resolvers are platform-extension aware (.web / .ios / .native → base) so
// platform-split files (e.g. hooks/use-color-scheme.web.ts) resolve correctly.
//
// TODO(migration): replace the ./core link + resolver with a proper npm-workspace
// once apps/capacitor is also carved out.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const projectRoot = __dirname;
const coreTarget = path.resolve(projectRoot, "../../packages/core");
const coreLink = path.join(projectRoot, "core");
const projectSrc = path.join(projectRoot, "src");

// Auto-create the ./core link so a fresh checkout (any OS) just works.
if (!fs.existsSync(coreLink)) {
  try {
    fs.symlinkSync(coreTarget, coreLink, process.platform === "win32" ? "junction" : "dir");
  } catch (err) {
    console.warn("[metro.config] could not link ./core -> packages/core:", err.message);
  }
}

const config = getDefaultConfig(projectRoot);

const EXTS = ["ts", "tsx", "js", "jsx", "json"];

// Resolve `base` to a concrete file, trying platform-specific extensions first
// (mirrors Metro's own platform resolution), then plain, then an index file.
function resolveWithExts(base, platform) {
  const platformTags = platform ? [platform, "native"] : [];
  const candidates = [];
  for (const tag of platformTags) for (const e of EXTS) candidates.push(`${base}.${tag}.${e}`);
  for (const e of EXTS) candidates.push(`${base}.${e}`);
  for (const tag of platformTags) for (const e of EXTS) candidates.push(path.join(base, `index.${tag}.${e}`));
  for (const e of EXTS) candidates.push(path.join(base, `index.${e}`));
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  return null;
}

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@core" || moduleName.startsWith("@core/")) {
    const subpath = moduleName === "@core" ? "" : moduleName.slice("@core/".length);
    const filePath = resolveWithExts(path.join(coreLink, subpath), platform);
    if (filePath) return { type: "sourceFile", filePath };
  }
  if (moduleName.startsWith("@/")) {
    const subpath = moduleName.slice("@/".length);
    const filePath = resolveWithExts(path.join(projectSrc, subpath), platform);
    if (filePath) return { type: "sourceFile", filePath };
  }
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  return resolve(context, moduleName, platform);
};

module.exports = config;
