#!/usr/bin/env npx tsx
/**
 * update.ts — Unified Update entry point (REQ-395c, REQ-556). [entry point]
 *
 * Reconciles every tier to the host's current fingerprints in one command:
 * stale installed ruleset packages are rebuilt through their recorded emitter
 * (REQ-563/REQ-564) and stale persisted artifacts are migrated (REQ-424).
 * A slug whose emitter or source cannot be resolved is recorded deferred with
 * its reason; the run never reports a tier complete without an outcome.
 *
 * The default invocation is a side-effect-free dry run. `--apply` writes.
 * Exit codes: 0 = every tier updated/current/deferred, 1 = usage error,
 * 2 = fatal unexpected error.
 *
 * REQ-395c, REQ-421, REQ-424, REQ-556, REQ-557, REQ-563, REQ-564, REQ-579.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseFlag, rejectUnknown } from "./lib/args.js";
import { readAndCompute } from "./lib/contract-fingerprint.js";
import {
  loadRegistry, saveRegistry, installedManifests, resolveEmitter,
  type RegistryEntry,
} from "./lib/ruleset-registry.js";
import { validateToolSchema } from "../holonovel/src/rulesets.js";

const USAGE = `Usage: npx tsx scripts/update.ts [--apply] [--json] [--packages-only] [--data-only] [--record] [--help]

  --apply           Write changes. Default is a side-effect-free dry run.
  --json            Machine-readable outcome on stdout.
  --packages-only   Reconcile ruleset packages only.
  --data-only       Migrate persisted user data only.
  --record          Append the per-tier outcome to <state>/update-outcome.md (with --apply).
  --help            Show this message.
`;

const KNOWN = new Set(["--apply", "--json", "--packages-only", "--data-only", "--record", "--help", "-h"]);
const argv = process.argv.slice(2);
handleHelp(argv, USAGE);
rejectUnknown(argv, KNOWN, USAGE);

const apply = parseFlag(argv, "--apply");
const json = parseFlag(argv, "--json");
const packagesOnly = parseFlag(argv, "--packages-only");
const dataOnly = parseFlag(argv, "--data-only");
const record = parseFlag(argv, "--record");

const root = join(import.meta.dirname, "..");
const dataDir = process.env.TTRPG_DATA_DIR ?? join(root, "holonovel", ".holonovel-state");
const installDir = process.env.TTRPG_RULESET_DIRS ?? join(dataDir, "rulesets");

interface TierOutcome {
  tier: "package" | "data";
  name: string;
  outcome: "current" | "updated" | "deferred" | "planned";
  reason?: string;
}

function readManifest(slug: string): any {
  try {
    return JSON.parse(readFileSync(join(installDir, slug, "manifest.json"), "utf-8"));
  } catch {
    return {};
  }
}

// REQ-430 — the same load-time predicate the host uses for
// `spec_health.ruleset_package_alerts`.
function toolQualityDefects(slug: string): number {
  try {
    const tools = JSON.parse(readFileSync(join(installDir, slug, "tools.json"), "utf-8"));
    if (!Array.isArray(tools)) return 0;
    return tools.filter((t: any) => validateToolSchema(t).length > 0).length;
  } catch {
    // Unreadable tools.json is surfaced by the host, not counted as a defect.
    return 0;
  }
}

function staleReason(slug: string, pkg: { package_format?: string; missing_surface: boolean }, current: string, entry?: RegistryEntry): string | null {
  if (pkg.package_format !== current) return pkg.package_format ? "fingerprint mismatch" : "no package-format fingerprint";
  if (pkg.missing_surface) return "missing surface declaration";
  if (toolQualityDefects(slug) > 0) return "tool-quality defects";
  if (entry?.base_content_hash) {
    const installed = readManifest(slug).content_hash;
    if (installed && installed !== entry.base_content_hash) return "supplement base hash mismatch";
  }
  return null;
}

function run(cmd: string, args: string[], env: Record<string, string> = {}): { status: number; out: string } {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf-8", env: { ...process.env, ...env } });
  return { status: r.status ?? -1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function main(): number {
  const current = readAndCompute().packageFormat;
  const registry = loadRegistry(dataDir);
  const packages = installedManifests(installDir);
  const outcomes: TierOutcome[] = [];

  // ── Package tier ────────────────────────────────────────────────────
  if (!dataOnly) {
    for (const pkg of packages) {
      const reason = staleReason(pkg.slug, pkg, current, registry[pkg.slug]);
      if (!reason) {
        outcomes.push({ tier: "package", name: pkg.slug, outcome: "current" });
        continue;
      }
      const resolved = resolveEmitter(root, installDir, pkg.slug, registry[pkg.slug]);
      if (!resolved) {
        outcomes.push({ tier: "package", name: pkg.slug, outcome: "deferred", reason: "no recorded emitter or source" });
        continue;
      }
      const extract = join(root, "scripts", "ruleset-builds", "dnd2024", "extract-thundercats.json");
      if (pkg.slug === "dnd2024" && !existsSync(extract)) {
        if (!apply) {
          outcomes.push({ tier: "package", name: pkg.slug, outcome: "deferred", reason: "extract missing; run --apply to regenerate" });
          continue;
        }
        const ex = run("node", [join(root, "scripts", "ruleset-builds", "dnd2024", "extract-thundercats.mjs")]);
        if (ex.status !== 0) {
          outcomes.push({ tier: "package", name: pkg.slug, outcome: "deferred", reason: `extract failed: ${ex.out.trim().slice(-200)}` });
          continue;
        }
      }
      if (!apply) {
        outcomes.push({ tier: "package", name: pkg.slug, outcome: "planned", reason: `${resolved.emitter} ${resolved.args.join(" ")}` });
        continue;
      }
      const r = run("node", [resolved.emitter, ...resolved.args]);
      if (r.status === 0) {
        registry[pkg.slug] = { ...(registry[pkg.slug] ?? { source: "" }), package_format: current, built_at: new Date().toISOString() };
        outcomes.push({ tier: "package", name: pkg.slug, outcome: "updated" });
      } else {
        outcomes.push({ tier: "package", name: pkg.slug, outcome: "deferred", reason: `emitter exited ${r.status}: ${r.out.trim().slice(-200)}` });
      }
    }
    if (apply) saveRegistry(dataDir, registry);
  }

  // ── Data tier ───────────────────────────────────────────────────────
  if (!packagesOnly) {
    const args = [join(root, "scripts", "migrate-user-data.ts"), ...(apply ? ["--apply"] : [])];
    const r = run("npx", ["tsx", ...args], { TTRPG_DATA_DIR: dataDir });
    if (r.status === 0) {
      outcomes.push({ tier: "data", name: "persisted artifacts", outcome: apply ? "updated" : "planned" });
    } else {
      outcomes.push({ tier: "data", name: "persisted artifacts", outcome: "deferred", reason: `migrate-user-data exited ${r.status}: ${r.out.trim().slice(-200)}` });
    }
  }

  // ── Report ──────────────────────────────────────────────────────────
  if (json) {
    console.log(JSON.stringify({ applied: apply, package_format: current, outcomes }, null, 2));
  } else {
    console.log(`update — ${apply ? "APPLY" : "dry run"} (package-format ${current.slice(0, 12)}…)`);
    console.log(`Install directory: ${installDir}`);
    console.log("");
    for (const o of outcomes) {
      const suffix = o.reason ? ` — ${o.reason}` : "";
      console.log(`  ${o.tier.padEnd(7)} ${o.name}: ${o.outcome}${suffix}`);
    }
    console.log("");
    const blockers = outcomes.filter((o) => o.outcome === "deferred");
    if (blockers.length === 0) console.log("Every tier is current or updated.");
    else console.log(`${blockers.length} tier(s) deferred — see reasons above.`);
    if (!apply) console.log("Dry run: no files written. Re-run with --apply.");
  }

  if (record && apply) {
    const stamp = new Date().toISOString();
    const lines = outcomes.map((o) =>
      `- ${o.tier}: ${o.name} — ${o.outcome}${o.reason ? ` (${o.reason})` : ""}`);
    appendFileSync(join(dataDir, "update-outcome.md"), `\n## Update outcome — ${stamp}\n\n${lines.join("\n")}\n`);
  }

  return 0;
}

try {
  process.exit(main());
} catch (e: any) {
  console.error(`update: ${e.message}`);
  process.exit(2);
}
