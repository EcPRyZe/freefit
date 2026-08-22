#!/usr/bin/env node
/**
 * Static GitHub Pages build. Gym data stays in the browser (localStorage).
 *
 * Nitro's github-pages preset prerenders / then crashes on a leftover SSR
 * step and can wipe .output/public. We stash index.html the moment it appears.
 *
 *   VITE_BASE=/freefit/ npm run build:pages
 */
import { cpSync, existsSync, mkdirSync, watch, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

process.env.NITRO_PRESET = process.env.NITRO_PRESET || "github_pages";

const root = process.cwd();
const publicDir = join(root, ".output", "public");
const keepDir = join(root, ".output", "pages-keep");

function stash() {
  const index = join(publicDir, "index.html");
  if (!existsSync(index)) return;
  mkdirSync(keepDir, { recursive: true });
  cpSync(publicDir, keepDir, { recursive: true });
}

mkdirSync(publicDir, { recursive: true });
let watcher;
try {
  watcher = watch(dirname(publicDir), { recursive: true }, () => {
    try {
      stash();
    } catch {
      /* mid-write */
    }
  });
} catch {
  watcher = undefined;
}

const result = spawnSync(
  process.execPath,
  ["scripts/with-app-env.mjs", "vite", "build"],
  { stdio: "inherit", env: process.env },
);
try {
  watcher?.close();
} catch {
  /* ignore */
}
stash();

const source = existsSync(join(publicDir, "index.html"))
  ? publicDir
  : existsSync(join(keepDir, "index.html"))
    ? keepDir
    : null;

if (!source) {
  console.error("Pages build: no index.html after prerender");
  process.exit(result.status || 1);
}

if (source !== publicDir) {
  mkdirSync(publicDir, { recursive: true });
  cpSync(source, publicDir, { recursive: true });
}

if (!existsSync(join(publicDir, "404.html"))) {
  cpSync(join(publicDir, "index.html"), join(publicDir, "404.html"));
}
writeFileSync(join(publicDir, ".nojekyll"), "");
if (result.status !== 0) {
  console.warn("Vite exited %s after prerender; stashed static site kept.", result.status);
}
console.log("Pages site ready in .output/public");
process.exit(0);
