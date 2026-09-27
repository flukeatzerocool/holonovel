#!/usr/bin/env npx tsx
/**
 * check-registry-publish.ts — verify the MCP Registry lists the published
 * version. [gate]
 *
 * Closes the publication loop for REQ-428: the publish workflow (npm +
 * mcp-publisher) can succeed at npm and still fail to register the version in
 * the official MCP Registry (the npm-propagation race), which leaves Glama and
 * M8ven — registry consumers — stale. This gate reads the host version from
 * holonovel/package.json, canonicalizes it the way the publish workflow does
 * (leading zeros stripped per segment), and confirms an entry for the manifest
 * name at that version exists in the registry.
 *
 * Network-dependent, so it is deliberately NOT wired into the deterministic
 * check/check:fast gates; the push pipeline polls it (non-fatally) after the
 * mirror push and `npm run check-registry` runs it on demand.
 *
 * Usage: npx tsx scripts/check-registry-publish.ts [--wait <seconds>] [--json]
 *
 *   --wait <seconds>  Poll up to N seconds (every 15s) for the version to
 *                     appear. Default 0 — one attempt.
 *   --json            Emit a machine-readable result envelope to stdout.
 *   --help, -h        Show this message.
 *
 * Exit codes: 0 = the registry lists the published version, 1 = it does not
 * (or the registry was unreachable within the wait), 2 = unexpected fatal
 * error.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { handleHelp, parseFlag, parseValueFlag } from "./lib/args.js";

const root = join(import.meta.dirname, "..");
// Per-server versions endpoint (deterministic, newest-first). The `?search=`
// listing endpoint is eventually consistent and intermittently omits a
// just-registered version, so it cannot gate freshness.
const REGISTRY_ENDPOINT = "https://registry.modelcontextprotocol.io/v0/servers";

const USAGE = `Usage: npx tsx scripts/check-registry-publish.ts [--wait <seconds>] [--json] [--help]

  --wait <seconds>  Poll up to N seconds (every 15s) for the version.
  --json            Emit a machine-readable result envelope to stdout.
  --help, -h        Show this message.

Exit codes: 0 = registry lists the published version, 1 = it does not (or the
registry was unreachable), 2 = unexpected fatal error.
`;

handleHelp(process.argv, USAGE);

const KNOWN = new Set(["--wait", "--json", "--help", "-h"]);
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === "--wait") {
    i++;
    continue;
  }
  if (!KNOWN.has(a)) {
    console.error(`Unknown flag: ${a}\n${USAGE}`);
    process.exit(1);
  }
}
const waitRaw = parseValueFlag(process.argv, "--wait");
const waitSeconds = waitRaw === null ? 0 : Number(waitRaw);
if (waitRaw !== null && (!Number.isFinite(waitSeconds) || waitSeconds < 0)) {
  console.error(`--wait requires a non-negative number of seconds\n${USAGE}`);
  process.exit(1);
}
const asJson = parseFlag(process.argv, "--json");

interface RegistryServer {
  name?: string;
  version?: string;
}

function canonicalVersion(raw: string): string {
  return raw
    .split(".")
    .map((part, i) => (i === 0 ? part : String(parseInt(part, 10))))
    .join(".");
}

function readManifest(): { mcpName: string; canonical: string } {
  const pkg = JSON.parse(readFileSync(join(root, "holonovel", "package.json"), "utf-8")) as {
    name: string;
    version: string;
    mcpName?: string;
  };
  return {
    mcpName: pkg.mcpName ?? pkg.name,
    canonical: canonicalVersion(pkg.version),
  };
}

async function fetchRegistry(mcpName: string): Promise<RegistryServer[]> {
  const url = `${REGISTRY_ENDPOINT}/${encodeURIComponent(mcpName)}/versions`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`registry returned HTTP ${res.status}`);
  const body = (await res.json()) as { servers?: Array<{ server?: RegistryServer }> };
  return (body.servers ?? [])
    .map((e) => e.server)
    .filter((s): s is RegistryServer => Boolean(s));
}

// Numeric-segment maximum, independent of the API's ordering.
function compareVersions(a: number[], b: number[]): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function latestVersion(servers: RegistryServer[]): string | null {
  let best: string | null = null;
  let bestParts: number[] | null = null;
  for (const s of servers) {
    if (typeof s.version !== "string") continue;
    const parts = s.version.split(".").map((p) => parseInt(p, 10));
    if (parts.some((n) => Number.isNaN(n))) continue;
    if (bestParts === null || compareVersions(parts, bestParts) > 0) {
      bestParts = parts;
      best = s.version;
    }
  }
  return best;
}

async function main(): Promise<number> {
  const { mcpName, canonical } = readManifest();
  const deadline = Date.now() + waitSeconds * 1000;
  let present = false;
  let latest: string | null = null;
  let lastError: string | null = null;

  for (;;) {
    try {
      const servers = await fetchRegistry(mcpName);
      latest = latestVersion(servers);
      present = servers.some((s) => s.name === mcpName && s.version === canonical);
      lastError = null;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (present || Date.now() >= deadline) break;
    process.stderr.write(
      `registry does not list ${mcpName}@${canonical} yet; waiting 15s...\n`,
    );
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }

  if (asJson) {
    process.stdout.write(
      JSON.stringify({ name: mcpName, version: canonical, present, latest, error: lastError }) + "\n",
    );
  } else if (present) {
    process.stdout.write(`OK: MCP Registry lists ${mcpName}@${canonical}\n`);
  } else if (lastError !== null) {
    process.stdout.write(`MCP Registry unreachable: ${lastError}\n`);
  } else {
    process.stdout.write(
      `STALE: MCP Registry latest for ${mcpName} is ${latest ?? "none"}, expected ${canonical}\n`,
    );
  }

  return present ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  });
