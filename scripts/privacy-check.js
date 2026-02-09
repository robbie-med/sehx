/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const targets = [
  "packages/storage",
  "packages/capture",
  "apps/pwa",
  "packages/core"
].map((p) => path.join(root, p));

const forbidden = [
  "audio",
  "transcript",
  "pcm",
  "wav",
  "mp3",
  "ogg",
  "flac",
  "text"
];

const extensions = new Set([".ts", ".tsx", ".js", ".json"]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walk(full, files);
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

let violations = 0;
for (const target of targets) {
  for (const file of walk(target)) {
    const content = fs.readFileSync(file, "utf8");
    for (const word of forbidden) {
      const pattern = new RegExp(`\\b${word}\\b`, "i");
      if (pattern.test(content)) {
        console.error(`[privacy-check] "${word}" found in ${file}`);
        violations += 1;
      }
    }
  }
}

if (violations > 0) {
  console.error(`[privacy-check] ${violations} potential violation(s) found.`);
  process.exit(1);
}

console.log("[privacy-check] OK");
