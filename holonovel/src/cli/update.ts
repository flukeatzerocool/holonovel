// update.ts — shipped Update command (REQ-650, REQ-424, REQ-651, REQ-579a).
//
// The published package exposes this through `bin/holonovel.js update`. It runs
// from compiled code, because the published artifact excludes build-only
// scripts (REQ-614). Two tiers are reconciled: persisted artifacts (Novel,
// roster, codex, server notes) by re-stamping through the interchange
// round-trip, and installed ruleset packages by a format-only re-emit when no
// rebuild source exists. Both write only after a backup, and `--dry-run`
// writes nothing.
//
// Exit codes: 0 = every tier is current, updated, or deferred; 1 = unexpected
// failure; 2 = usage error.

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDataDir } from "../core/data-dir.js";
import { reconcileUserData, type PersistedArtifactOutcome } from "../core/state.js";
import { upgradeInstalledPackage, type PackageUpgradeOutcome } from "../rulesets.js";
import { DATA_FORMAT, PACKAGE_FORMAT } from "../generated/contract-fingerprints.js";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const USAGE = `Usage: holonovel update [options]

Reconcile persisted campaign data and installed ruleset packages to this
server's current format fingerprints. Files are backed up before they change.

  --dry-run         Report the plan; write nothing.
  --json            Machine-readable report on stdout.
  --data-only       Reconcile persisted artifacts only.
  --packages-only   Reconcile installed ruleset packages only.
  --help, -h        Show this message.

Exit codes: 0 = every tier is current, updated, or deferred; 1 = failure;
2 = usage error.`;

interface TierOutcome {
  tier: "data" | "package";
  name: string;
  outcome: "current" | "updated" | "planned" | "deferred";
  reason?: string;
  stored?: string | null;
  from?: string | null;
}

function readHostVersion(): string {
  try {
    return JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf-8")).version ?? "unknown";
  } catch {
    // A missing manifest is not fatal for reconciliation; report "unknown".
    return "unknown";
  }
}

function installedSlugs(installDir: string): string[] {
  if (!fs.existsSync(installDir)) return [];
  const slugs: string[] = [];
  for (const entry of fs.readdirSync(installDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (fs.existsSync(path.join(installDir, entry.name, "manifest.json"))) slugs.push(entry.name);
  }
  return slugs.sort();
}

export function main(argv: string[]): number {
  try {
    if (argv.includes("--help") || argv.includes("-h")) {
      console.log(USAGE);
      return 0;
    }
    const known = new Set(["--dry-run", "--json", "--data-only", "--packages-only"]);
    const unknown = argv.filter((arg) => !known.has(arg));
    if (unknown.length > 0) {
      console.error(`holonovel update: unknown option(s): ${unknown.join(", ")}`);
      console.error(USAGE);
      return 2;
    }
    const dryRun = argv.includes("--dry-run");
    const json = argv.includes("--json");
    const dataOnly = argv.includes("--data-only");
    const packagesOnly = argv.includes("--packages-only");
    if (dataOnly && packagesOnly) {
      console.error("holonovel update: --data-only and --packages-only are mutually exclusive");
      return 2;
    }

    const dataDir = resolveDataDir(PACKAGE_ROOT, { mkdir: dryRun ? () => {} : undefined });
    const installDir = process.env.TTRPG_RULESET_DIRS ?? path.join(dataDir, "rulesets");
    const hostVersion = readHostVersion();
    const outcomes: TierOutcome[] = [];

    if (!packagesOnly) {
      for (const item of reconcileUserData(dataDir, { apply: !dryRun }) as PersistedArtifactOutcome[]) {
        outcomes.push({ tier: "data", name: `${item.kind}:${item.name}`, outcome: item.outcome, reason: item.reason, stored: item.stored });
      }
    }
    if (!dataOnly) {
      for (const slug of installedSlugs(installDir)) {
        const item = upgradeInstalledPackage(installDir, slug, { apply: !dryRun, hostVersion }) as PackageUpgradeOutcome;
        outcomes.push({ tier: "package", name: item.slug, outcome: item.outcome, reason: item.reason, from: item.from });
      }
    }

    const report = {
      dry_run: dryRun,
      host_version: hostVersion,
      data_format: DATA_FORMAT,
      package_format: PACKAGE_FORMAT,
      data_dir: dataDir,
      install_dir: installDir,
      outcomes,
    };

    if (json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(`holonovel update — ${dryRun ? "dry run" : "apply"} (data ${DATA_FORMAT.slice(0, 12)}…, package ${PACKAGE_FORMAT.slice(0, 12)}…)`);
      console.log(`  data:    ${dataDir}`);
      console.log(`  packages: ${installDir}`);
      console.log("");
      if (outcomes.length === 0) console.log("  Nothing to reconcile.");
      for (const item of outcomes) {
        const detail = item.reason ? ` — ${item.reason}` : "";
        console.log(`  ${item.tier.padEnd(8)} ${item.name}: ${item.outcome}${detail}`);
      }
      const counts = outcomes.reduce<Record<string, number>>((acc, item) => {
        acc[item.outcome] = (acc[item.outcome] ?? 0) + 1;
        return acc;
      }, {});
      console.log("");
      console.log(`${counts.updated ?? 0} updated, ${counts.current ?? 0} current, ${counts.planned ?? 0} planned, ${counts.deferred ?? 0} deferred.`);
      if (dryRun) console.log("Dry run: no files written. Re-run without --dry-run to apply.");
    }
    return 0;
  } catch (error) {
    console.error(`holonovel update: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

// Allow direct execution (`tsx src/cli/update.ts ...`) for harnesses and source
// checkouts; the shipped path is `bin/holonovel.js update`.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
