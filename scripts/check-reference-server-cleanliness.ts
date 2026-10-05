#!/usr/bin/env npx tsx
/**
 * check-reference-server-cleanliness.ts — reference-server content boundary
 * (REQ-562 / governance). [gate]
 *
 * The reference server (this specification repository) ships its own reference
 * rulesets; personal/deployed ruleset content — build assets, converted sources,
 * and emitted packages — belongs in the deploy content pipeline, not here. This
 * gate fails when:
 *   (a) `scripts/ruleset-builds/<slug>/` exists for a slug outside the sanctioned
 *       allowlist; or
 *   (b) a ruleset package triple (manifest.json + model.json + index.json) is
 *       tracked outside the sanctioned fixtures / gitignored build output.
 *
 * Usage: npx tsx scripts/check-reference-server-cleanliness.ts
 * Exit codes: 0 = clean, 1 = violations.
 */
import { execSync } from "node:child_process";

// Reference rulesets whose build assets are committed to this repository.
const SANCTIONED_BUILD_SLUGS = new Set(["dnd2024", "swse"]);
// Paths where a package triple is legitimate (test fixtures).
const SANCTIONED_PACKAGE_PREFIXES = ["holonovel/testdata/rulesets/"];

const root = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
const tracked = execSync("git ls-files", { cwd: root, encoding: "utf-8" }).trim().split("\n").filter(Boolean);

const violations: string[] = [];

// (a) build-asset slugs.
for (const f of tracked) {
  const m = f.match(/^scripts\/ruleset-builds\/([^/]+)\//);
  if (m && !SANCTIONED_BUILD_SLUGS.has(m[1])) {
    violations.push(`unsanctioned ruleset build asset: ${f} (slug '${m[1]}' — keep deployed ruleset content out of the reference server)`);
  }
}

// (b) package triples outside sanctioned fixtures.
const triples = new Map<string, Set<string>>();
for (const f of tracked) {
  const m = f.match(/^(.*)\/(manifest|model|index|tools|resources|prompts)\.json$/);
  if (!m) continue;
  if (SANCTIONED_PACKAGE_PREFIXES.some((p) => f.startsWith(p))) continue;
  const dir = m[1];
  if (!triples.has(dir)) triples.set(dir, new Set());
  triples.get(dir)!.add(m[2]);
}
for (const [dir, files] of triples) {
  if (files.has("manifest") && files.has("model") && files.has("index")) {
    violations.push(`tracked ruleset package under ${dir}/ (manifest+model+index) — emitted packages belong in the install dir, not the repo`);
  }
}

if (violations.length > 0) {
  for (const v of [...new Set(violations)]) console.error(`FAIL: ${v}`);
  console.error(`\n${violations.length} reference-server cleanliness violation(s)`);
  process.exit(1);
}
console.log("PASS: reference server carries no unsanctioned ruleset content");
process.exit(0);
