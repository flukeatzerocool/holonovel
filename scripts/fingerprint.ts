import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

const root = join(import.meta.dirname, "..");
const SERVERS = ["holonovel"];

function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hashDirectory(dir: string, extensions?: string[]): string {
  const files: string[] = [];
  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        walk(p);
      } else if (entry.isFile()) {
        if (extensions && !extensions.some(ext => entry.name.endsWith(ext))) continue;
        files.push(p);
      }
    }
  }
  walk(dir);
  files.sort();
  const h = createHash("sha256");
  for (const f of files) {
    try {
      h.update(relative(dir, f));
      h.update(readFileSync(f));
    } catch { /* skip unreadable */ }
  }
  return h.digest("hex");
}

function hashFile(path: string, fallback: string = "unavailable"): string {
  try { return sha256(readFileSync(path)); }
  catch { return fallback; }
}

function hashGenerated(serverDir: string): string {
  const gen = join(serverDir, "src", "generated");
  if (!existsSync(gen)) return "sentinel";
  try { return hashDirectory(gen); }
  catch { return "unknown"; }
}

function hashSurfaces(serverDir: string): string {
  const index = join(serverDir, "src", "index.ts");
  const state = join(serverDir, "src", "state.ts") || join(serverDir, "src", "core", "state.ts");
  const h = createHash("sha256");
  if (existsSync(index)) h.update(readFileSync(index));
  const statePath = existsSync(state) ? state : join(serverDir, "src", "core", "state.ts");
  if (existsSync(statePath)) h.update(readFileSync(statePath));
  return h.digest("hex");
}

interface FingerprintReport {
  server: string;
  source: string;
  config: string;
  lockfile: string;
  extraction: string;
  surfaces: string;
  timestamp: string;
}

function compute(server: string): FingerprintReport {
  const dir = join(root, server);
  return {
    server,
    source: hashDirectory(join(dir, "src"), [".ts"]),
    config: hashFile(join(dir, "package.json")) + hashFile(join(dir, "tsconfig.json"), ""),
    lockfile: hashFile(join(dir, "package-lock.json")),
    extraction: hashGenerated(dir),
    surfaces: hashSurfaces(dir),
    timestamp: new Date().toISOString(),
  };
}

const args = process.argv.includes("--json");
const server = process.argv.includes("--server")
  ? process.argv[process.argv.indexOf("--server") + 1]
  : null;

if (server) {
  if (!SERVERS.includes(server)) { console.error(`Unknown server: ${server}`); process.exit(1); }
  const report = compute(server);
  if (args) console.log(JSON.stringify(report, null, 2));
  else {
    for (const [k, v] of Object.entries(report)) console.log(`${k}=${v}`);
  }
} else {
  const results: Record<string, FingerprintReport> = {};
  for (const s of SERVERS) results[s] = compute(s);
  if (args) console.log(JSON.stringify(results, null, 2));
  else {
    for (const [server, report] of Object.entries(results)) {
      console.log(`\n${server}:`);
      for (const [k, v] of Object.entries(report).filter(([k]) => k !== "server")) console.log(`  ${k}=${v}`);
    }
  }
}
