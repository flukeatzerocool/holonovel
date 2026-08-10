import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const HOLONOVEL_SRC = join(root, "holonovel", "src");
const DND5E_SRC = join(root, "dnd5e-holonovel", "src");
const HOLONOVEL_VENDOR = join(root, "holonovel", "narrative_world_model");
const DND5E_VENDOR = join(root, "dnd5e-holonovel", "narrative_world_model");

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function copyDir(src: string, dest: string): string[] {
  const copied: string[] = [];
  if (!existsSync(src)) return copied;
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const st = statSync(srcPath);
    if (st.isDirectory()) {
      copied.push(...copyDir(srcPath, destPath));
    } else {
      copyFileSync(srcPath, destPath);
      copied.push(relative(root, destPath));
    }
  }
  return copied;
}

let ok = true;

console.log("=== Verbatim source copies ===\n");

// world-model.ts — verbatim copy
const worldModelSrc = join(HOLONOVEL_SRC, "world", "model.ts");
const worldModelDest = join(DND5E_SRC, "world-model.ts");
if (existsSync(worldModelSrc)) {
  copyFileSync(worldModelSrc, worldModelDest);
  console.log(`  OK   world-model.ts: ${sha256(readFileSync(worldModelSrc, "utf-8"))}`);
} else {
  console.error(`  FAIL  world-model.ts: source not found`);
  ok = false;
}

// parser.ts — copy with import path fix
const parserSrc = join(HOLONOVEL_SRC, "world", "parser.ts");
const parserDest = join(DND5E_SRC, "parser.ts");
if (existsSync(parserSrc)) {
  let content = readFileSync(parserSrc, "utf-8");
  content = content.replace('from "./model.js"', 'from "./world-model.js"');
  writeFileSync(parserDest, content);
  console.log(`  OK   parser.ts: ${sha256(content)} (import path fixed)`);
} else {
  console.error(`  FAIL  parser.ts: source not found`);
  ok = false;
}

console.log("\n=== Vendor content ===\n");

const vendorCopied = copyDir(HOLONOVEL_VENDOR, DND5E_VENDOR);
for (const f of vendorCopied) {
  console.log(`  OK   ${f}`);
}

console.log("\n=== Diverged files (manual attention needed) ===\n");

const diverged = [
  { holonovel: "core/state.ts", dnd5e: "state.ts", reason: "916 vs 1280 lines — D&D entity fields, combat types" },
  { holonovel: "core/macros.ts", dnd5e: "macros.ts", reason: "55 vs 58 lines — D&D stat/hp macros added" },
  { holonovel: "core/enrichment.ts", dnd5e: "enrichment.ts", reason: "182 vs 240 lines — D&D-specific content" },
  { holonovel: "index.ts", dnd5e: "index.ts", reason: "D&D-specific tool registrations" },
];

for (const d of diverged) {
  const srcPath = join(HOLONOVEL_SRC, d.holonovel);
  const destPath = join(DND5E_SRC, d.dnd5e);
  const srcExists = existsSync(srcPath);
  const destExists = existsSync(destPath);
  if (srcExists && destExists) {
    console.log(`  WARN ${d.dnd5e}: diverged — ${d.reason}`);
  } else {
    console.log(`  SKIP ${d.dnd5e}: ${srcExists ? "destination missing" : "source missing"}`);
  }
}

if (!ok) {
  console.error("\nSource propagation FAILED.");
  process.exit(1);
}

console.log("\nSource propagation complete.");
