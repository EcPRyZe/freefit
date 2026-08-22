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

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const htmlFiles = walk(join(root, ".output")).filter((p) => p.endsWith(".html"));
console.log(
  "HTML files:\n",
  htmlFiles.map((p) => `${p} (${statSync(p).size}b)`).join("\n") || "(none)",
);

const nonempty = htmlFiles.filter((p) => statSync(p).size > 0);
const nestedIndex = nonempty.find((p) => p.endsWith("index.html") && !p.endsWith(join("public", "index.html")));
if (nestedIndex) {
  const nestedDir = nestedIndex.slice(0, -"index.html".length);
  console.log("Flattening", nestedDir, "->", publicDir);
  mkdirSync(publicDir, { recursive: true });
  cpSync(nestedDir, publicDir, { recursive: true });
}

const publicIndex = join(publicDir, "index.html");
const public404 = join(publicDir, "404.html");
const best = nonempty.sort((a, b) => statSync(b).size - statSync(a).size)[0];
if ((!existsSync(publicIndex) || statSync(publicIndex).size === 0) && best) {
  cpSync(best, publicIndex);
  console.log("Copied", best, "-> index.html");
}
if (!existsSync(public404) || statSync(public404).size === 0) {
  if (existsSync(publicIndex) && statSync(publicIndex).size > 0) {
    cpSync(publicIndex, public404);
  }
}
writeFileSync(join(publicDir, ".nojekyll"), "");

if (!existsSync(publicIndex) || statSync(publicIndex).size === 0) {
  console.error("Pages build: index.html is still empty");
  process.exit(1);
}
console.log("Pages site ready:", statSync(publicIndex).size, "byte index.html");
process.exit(0);
