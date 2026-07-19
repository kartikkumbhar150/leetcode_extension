// scripts/postbuild.mjs
// Copies static assets that Vite doesn't handle automatically.
import { copyFileSync, mkdirSync, existsSync, readdirSync, cpSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");

// 1. Copy manifest.json
copyFileSync(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));
console.log("✓ Copied manifest.json");

// 2. Copy icons folder (if it exists)
const iconsDir = resolve(root, "icons");
const distIcons = resolve(dist, "icons");
if (existsSync(iconsDir)) {
  mkdirSync(distIcons, { recursive: true });
  cpSync(iconsDir, distIcons, { recursive: true });
  console.log("✓ Copied icons/");
} else {
  console.warn("⚠  No icons/ directory found. Add icon16.png, icon48.png, icon128.png.");
}

console.log("✓ Postbuild complete — dist/ is ready to load as a Chrome extension.");
