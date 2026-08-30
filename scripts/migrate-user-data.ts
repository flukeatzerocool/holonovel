/**
 * migrate-user-data.ts — User-data migration entry point (REQ-424).
 *
 * Lists persisted state artifacts whose data-format fingerprint (REQ-423)
 * differs from the host's current value or is absent. The default invocation
 * is a dry run that reports what would change with no side effects. With
 * `--apply`, each stale artifact is re-stamped with the current fingerprint.
 * Field-level migration (inert preservation, defaults) runs at load per
 * REQ-065; re-stamping only updates the fingerprint so a subsequent load
 * revalidates as current. A migration that fails before completing leaves the
 * original artifact unchanged (atomic tmp+rename) and names the artifact.
 */

import { readdirSync, existsSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { readAndCompute } from "./lib/contract-fingerprint.js";

const root = join(import.meta.dirname, "..");
const dataDir = process.env.TTRPG_DATA_DIR ?? join(root, "holonovel", ".holonovel-state");
const current = readAndCompute().dataFormat;
const apply = process.argv.includes("--apply");

const META_KEY = "__holonovel_meta";

interface Artifact {
  kind: string;   // "novel", "roster", "codex", "server-notes"
  name: string;
  path: string;
  data_format?: string;
}

function findArtifacts(): Artifact[] {
  const artifacts: Artifact[] = [];
  const novelsDir = join(dataDir, "novels");
  if (existsSync(novelsDir)) {
    for (const f of readdirSync(novelsDir)) {
      if (!f.endsWith(".json")) continue;
      const p = join(novelsDir, f);
      try {
        const data = JSON.parse(readFileSync(p, "utf-8"));
        artifacts.push({ kind: "novel", name: data.slug ?? f.replace(/\.json$/, ""), path: p, data_format: data.data_format });
      } catch {
        artifacts.push({ kind: "novel", name: f.replace(/\.json$/, ""), path: p });
      }
    }
  }
  for (const [kind, filename] of [["roster", "roster.json"], ["codex", "codex.json"], ["server-notes", "server-notes.json"]] as const) {
    const p = join(dataDir, filename);
    if (!existsSync(p)) continue;
    try {
      const data = JSON.parse(readFileSync(p, "utf-8"));
      artifacts.push({ kind, name: filename, path: p, data_format: data[META_KEY]?.data_format });
    } catch {
      artifacts.push({ kind, name: filename, path: p });
    }
  }
  return artifacts;
}

function reStamp(artifact: Artifact): void {
  const data = JSON.parse(readFileSync(artifact.path, "utf-8"));
  if (artifact.kind === "novel") {
    data.data_format = current;
  } else {
    data[META_KEY] = { ...(data[META_KEY] ?? {}), data_format: current };
  }
  const tmp = artifact.path + `.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf-8");
  renameSync(tmp, artifact.path);
}

const artifacts = findArtifacts();
const stale = artifacts.filter((a) => a.data_format !== current);

console.log(`migrate-user-data — ${apply ? "apply" : "dry run"} (REQ-424)`);
console.log(`Current data-format fingerprint: ${current}`);
console.log(`State directory: ${dataDir}`);
console.log("");
if (stale.length === 0) {
  console.log("No stale artifacts — all persisted state matches the current data-format fingerprint.");
  process.exit(0);
}

console.log(`${stale.length} stale artifact(s)${apply ? "" : " (dry run — re-run with --apply to re-stamp)"}:`);
let failed = false;
for (const a of stale) {
  const why = a.data_format ? "fingerprint mismatch" : "no fingerprint";
  console.log(`  ${a.kind}:${a.name} — ${why}`);
  if (apply) {
    try {
      reStamp(a);
      console.log(`    re-stamped.`);
    } catch (e: any) {
      failed = true;
      console.log(`    FAILED (original unchanged): ${e.message}`);
    }
  }
}
if (failed) process.exit(1);
