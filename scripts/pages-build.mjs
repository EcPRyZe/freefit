#!/usr/bin/env node
/**
 * Static GitHub Pages build. Gym data stays in the browser (localStorage);
 * this only emits HTML/JS/CSS (+ 404.html for client routes).
 *
 *   VITE_BASE=/FreeFit/ npm run build:pages
 *
 * Nitro's github-pages preset prerenders / then tries a leftover SSR step
 * that errors on HTML input. If public/index.html is already there, we keep it.
 */
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

process.env.NITRO_PRESET = process.env.NITRO_PRESET || "github_pages";

const result = spawnSync(
  process.execPath,
  ["scripts/with-app-env.mjs", "vite", "build"],
  { stdio: "inherit", env: process.env },
);

const out = join(process.cwd(), ".output", "public");
const index = join(out, "index.html");
if (!existsSync(index)) {
  console.error("Pages build: missing .output/public/index.html");
  process.exit(result.status ?? 1);
}
const notFound = join(out, "404.html");
if (!existsSync(notFound)) copyFileSync(index, notFound);
writeFileSync(join(out, ".nojekyll"), "");
if (result.status !== 0) {
  console.warn(
    "Vite exited %s after prerender; using .output/public anyway (GitHub Pages static).",
    result.status,
  );
}
console.log("Pages site ready in .output/public");
