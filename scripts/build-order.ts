import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { regenerateContractFingerprints } from "./lib/contract-fingerprint.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const FINGERPRINT_PATH = join(root, ".holonovel-state", "build-order-fingerprint.json");

function hashDir(dir: string): string {
  if (!existsSync(dir)) return "";
  const h = createHash("sha256");
  try {
    const files = execSync("git ls-files", { cwd: dir, encoding: "utf-8" }).trim().split("\n").filter(Boolean).sort();
    for (const file of files) {
      const p = join(dir, file);
      try {
        if (existsSync(p) && statSync(p).isFile()) {
          h.update(file);
          h.update(readFileSync(p));
        }
      } catch { /* skip unreadable */ }
    }
  } catch {
    const entries = readdirSync(dir, { recursive: true }).sort();
    for (const entry of entries) {
      const p = join(dir, entry as string);
      try {
        if (statSync(p).isFile()) {
          h.update(entry as string);
          h.update(readFileSync(p));
        }
      } catch { /* skip unreadable */ }
    }
  }
  return h.digest("hex");
}

function hashFile(path: string): string {
  if (!existsSync(path)) return "";
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

interface Fingerprint {
  spec_hash: string;
  holonovel_src_hash: string;
  holonovel_world_hash: string;
  holonovel_vendor_hash: string;
  root_version: string;
}

function loadFingerprint(): Fingerprint | null {
  if (!existsSync(FINGERPRINT_PATH)) return null;
  try { return JSON.parse(readFileSync(FINGERPRINT_PATH, "utf-8")); }
  catch { return null; }
}

function saveFingerprint(fp: Fingerprint): void {
  if (!existsSync(dirname(FINGERPRINT_PATH))) {
    mkdirSync(dirname(FINGERPRINT_PATH), { recursive: true });
  }
  writeFileSync(FINGERPRINT_PATH, JSON.stringify(fp, null, 2) + "\n");
}

function computeCurrent(): Fingerprint {
  const rootPkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
  return {
    spec_hash: hashDir(join(root, "spec")),
    holonovel_src_hash: hashDir(join(root, "holonovel", "src")),
    holonovel_world_hash: hashDir(join(root, "holonovel", "src", "world")),
    holonovel_vendor_hash: hashDir(join(root, "holonovel", "narrative_world_model")),
    root_version: rootPkg.version,
  };
}

function run(label: string, cmd: string, cwd?: string): boolean {
  process.stdout.write(`\n${label} ... `);
  try {
    execSync(cmd, { cwd: cwd ?? root, stdio: "pipe" });
    console.log("OK");
    return true;
  } catch (e: unknown) {
    console.log("FAILED");
    const err = e as { stderr?: Buffer; stdout?: Buffer; status?: number };
    const output = err.stderr?.toString().trim() || err.stdout?.toString().trim() || err.status;
    console.error(`  ${output}`);
    return false;
  }
}

function skip(label: string, reason: string): boolean {
  console.log(`\n${label} ... SKIPPED (${reason})`);
  return true;
}

interface Step {
  label: string;
  fn: () => boolean;
}

console.log("Holonovel build order\n");

const current = computeCurrent();
const saved = loadFingerprint();
const firstRun = !saved;

const specChanged = firstRun || current.spec_hash !== saved.spec_hash;
const holoSrcChanged = firstRun || current.holonovel_src_hash !== saved.holonovel_src_hash;
const versionChanged = firstRun || current.root_version !== saved.root_version;

const steps: Step[] = [];

// Step 1: Assemble spec (depends on spec/)
if (specChanged) {
  steps.push({ label: "1. Assemble spec", fn: () => run("1. Assemble spec", "npx tsx scripts/assemble.ts") });
} else {
  steps.push({ label: "1. Assemble spec", fn: () => skip("1. Assemble spec", "spec/ unchanged") });
}

// Step 1b: Regenerate contract fingerprints (depends on assembled holonovel.md)
if (specChanged) {
  steps.push({
    label: "1b. Regenerate contract fingerprints",
    fn: () => {
      try {
        const fp = regenerateContractFingerprints();
        console.log(`OK (package_format ${fp.packageFormat.slice(0, 12)}…, data_format ${fp.dataFormat.slice(0, 12)}…)`);
        return true;
      } catch (e: unknown) {
        console.log("FAILED");
        console.error(`  ${(e as Error).message}`);
        return false;
      }
    },
  });
} else {
  steps.push({ label: "1b. Regenerate contract fingerprints", fn: () => skip("1b. Regenerate contract fingerprints", "spec/ unchanged") });
}

// Step 2: Check spec (depends on spec/)
if (specChanged) {
  steps.push({ label: "2. Check spec", fn: () => run("2. Check spec", "npm run check") });
} else {
  steps.push({ label: "2. Check spec", fn: () => skip("2. Check spec", "spec/ unchanged") });
}

// Step 3: Spec-propagate (depends on spec/)
if (specChanged) {
  steps.push({ label: "3. Propagate spec to server", fn: () => run("3. Propagate spec to server", "npx tsx scripts/spec-propagate.ts") });
} else {
  steps.push({ label: "3. Propagate spec to server", fn: () => skip("3. Propagate spec to server", "spec/ unchanged") });
}

// Step 4: Typecheck holonovel
if (holoSrcChanged) {
  steps.push({ label: "4. Typecheck holonovel", fn: () => run("4. Typecheck holonovel", "npm run typecheck", join(root, "holonovel")) });
} else {
  steps.push({ label: "4. Typecheck holonovel", fn: () => skip("4. Typecheck holonovel", "holonovel/src/ unchanged") });
}

// Step 5: Version-bump
if (versionChanged) {
  steps.push({ label: "5. Bump versions", fn: () => run("5. Bump versions", "npx tsx scripts/version-bump.ts") });
} else {
  steps.push({ label: "5. Bump versions", fn: () => skip("5. Bump versions", "version unchanged") });
}

// Step 6: Version-check — always runs (fast, catch-all)
steps.push({ label: "6. Verify version consistency", fn: () => run("6. Verify version consistency", "npx tsx scripts/version-check.ts") });

// ── Execute ──

let failed = false;
for (const step of steps) {
  if (!step.fn()) {
    failed = true;
    break;
  }
}

if (failed) {
  console.error("\nBuild order FAILED.");
  process.exit(1);
}

// Save updated fingerprint after successful run
// Recompute after execution since steps may have changed files
const after = computeCurrent();
saveFingerprint(after);

// Copy fingerprint to server data dirs for spec_health visibility
for (const server of ["holonovel"]) {
  const destDir = join(root, server, ".holonovel-state");
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
  writeFileSync(join(destDir, "build-order-fingerprint.json"), JSON.stringify(after, null, 2) + "\n");
}
console.log("  Fingerprint propagated to server.");

console.log("\nBuild order complete. Ready to commit.");
process.exit(0);
