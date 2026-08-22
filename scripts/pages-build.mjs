#!/usr/bin/env node
/**
 * Static GitHub Pages build. Gym data stays in the browser (localStorage).
 *
 *   VITE_BASE=/freefit/ npm run build:pages
 */
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

process.env.NITRO_PRESET = process.env.NITRO_PRESET || "github_pages";

const root = process.cwd();
const publicDir = join(root, ".output", "public");

const result = spawnSync(
  process.execPath,
  ["scripts/with-app-env.mjs", "vite", "build"],
  { stdio: "inherit", env: process.env },
);

function listHtml(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) listHtml(p, acc);
    else if (name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const htmlFiles = listHtml(join(root, ".output"));
console.log("HTML files:", htmlFiles.join("\n") || "(none)");

const public404 = join(publicDir, "404.html");
if (!existsSync(join(publicDir, "index.html")) && existsSync(public404)) {
  cpSync(public404, join(publicDir, "index.html"));
  console.log("Copied 404.html -> index.html (GitHub Pages SPA shell)");
}

let index = htmlFiles.find((p) => p.endsWith(`${join("public", "index.html")}`))
  || (existsSync(join(publicDir, "index.html")) ? join(publicDir, "index.html") : null)
  || htmlFiles.find((p) => p.endsWith("index.html"));

if (!index) {
  console.error("Pages build: no index.html after prerender");
  process.exit(result.status || 1);
}

const indexDir = index.slice(0, -"index.html".length);
if (indexDir !== publicDir + "/" && indexDir !== publicDir) {
  console.log("Flattening", indexDir, "->", publicDir);
  mkdirSync(publicDir, { recursive: true });
  cpSync(indexDir, publicDir, { recursive: true });
}

if (!existsSync(join(publicDir, "404.html"))) {
  cpSync(join(publicDir, "index.html"), join(publicDir, "404.html"));
}
writeFileSync(join(publicDir, ".nojekyll"), "");
console.log("Pages site ready in .output/public");
process.exit(0);
